const express = require('express');
const router = express.Router();
const { Cashfree, CFEnvironment } = require('cashfree-pg');
const auth = require('../middleware/auth');
const Order = require('../models/Order');

// Initialize Cashfree instance
const cashfree = new Cashfree(
    process.env.CASHFREE_MODE === 'PRODUCTION' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
    process.env.CASHFREE_APP_ID,
    process.env.CASHFREE_SECRET_KEY
);

// @route   POST /api/payments/create-order
// @desc    Create a new order in Cashfree and save to DB
// @access  Protected
router.post('/create-order', auth, async (req, res) => {
    try {
        const { amount, customerId, customerPhone, customerName, customerEmail, serviceId } = req.body;

        let finalAmount = amount || 1000;

        if (serviceId) {
            const MedicalService = require('../models/MedicalService');
            const service = await MedicalService.findOne({ serviceId });
            if (service && service.price) {
                // Parse "₹2,49,000" -> 249000
                const numStr = service.price.replace(/[^0-9.]/g, '');
                if (numStr) {
                    finalAmount = parseFloat(numStr);
                }
            }
        }

        const request = {
            order_amount: finalAmount,
            order_currency: "INR",
            customer_details: {
                customer_id: customerId || `cust_${Date.now()}`,
                customer_phone: customerPhone || "9999999999", 
                customer_name: customerName || "User",
                customer_email: customerEmail || "user@example.com"
            },
            order_meta: {
                return_url: "https://vytalyou.com/payment-result?order_id={order_id}"
            }
        };

        const response = await cashfree.PGCreateOrder(request);
        const cfOrder = response.data;

        // Save order to MongoDB
        const order = await Order.create({
            user: req.userId,
            orderId: cfOrder.order_id,
            cfOrderId: cfOrder.cf_order_id,
            paymentSessionId: cfOrder.payment_session_id,
            amount: finalAmount,
            currency: "INR",
            customerName: customerName || "User",
            customerPhone: customerPhone || "9999999999",
            customerEmail: customerEmail || "user@example.com",
            orderStatus: 'CREATED',
        });

        console.log('Order saved to DB:', order.orderId);

        res.json({
            success: true,
            order: cfOrder,
            appId: process.env.CASHFREE_APP_ID,
            environment: process.env.CASHFREE_MODE || 'SANDBOX'
        });
    } catch (error) {
        console.error('Error creating Cashfree order:', error.response?.data || error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Could not create order', 
            error: error.response?.data || error.message 
        });
    }
});

// @route   POST /api/payments/verify
// @desc    Verify Cashfree payment status and update DB
// @access  Protected
router.post('/verify', auth, async (req, res) => {
    try {
        const { order_id } = req.body;

        if (!order_id) {
            return res.status(400).json({ success: false, message: 'Order ID is required' });
        }

        const response = await cashfree.PGOrderFetchPayments(order_id);
        
        // Find if any payment for this order is successful
        const payments = response.data;
        const successfulPayment = payments.find(p => p.payment_status === 'SUCCESS');

        if (successfulPayment) {
            // Update order in MongoDB
            await Order.findOneAndUpdate(
                { orderId: order_id },
                {
                    orderStatus: 'PAID',
                    paymentId: successfulPayment.cf_payment_id,
                    paymentMethod: successfulPayment.payment_group || successfulPayment.payment_method?.type,
                    paymentTime: successfulPayment.payment_time ? new Date(successfulPayment.payment_time) : new Date(),
                },
                { new: true }
            );

            console.log('Order verified & updated:', order_id);

            res.status(200).json({
                success: true,
                message: 'Payment verified successfully',
                paymentId: successfulPayment.cf_payment_id,
            });
        } else {
            // Update order as failed
            await Order.findOneAndUpdate(
                { orderId: order_id },
                { orderStatus: 'FAILED' }
            );

            res.status(400).json({
                success: false,
                message: 'No successful payment found for this order',
            });
        }
    } catch (error) {
        console.error('Error verifying payment:', error.response?.data || error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Could not verify payment', 
            error: error.response?.data || error.message 
        });
    }
});

module.exports = router;




