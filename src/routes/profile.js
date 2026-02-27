const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Get current user's profile
router.get('/', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                phone: user.phone,
                name: user.name,
                email: user.email,
                age: user.age,
                sex: user.sex,
                // weight: user.weight,
                // height: user.height,
                // comorbidities: user.comorbidities,
                // medications: user.medications,
                location: user.location,
                profileCompleted: user.profileCompleted,
                isPhoneVerified: user.isPhoneVerified,
            },
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user profile
router.put('/', authMiddleware, async (req, res) => {
    try {
        const { name, age, sex, location } = req.body;

        // Validation
        if (!name || !age || !sex) {
            return res.status(400).json({
                error: 'Name, age, and sex are required'
            });
        }

        if (age < 1 || age > 150) {
            return res.status(400).json({ error: 'Invalid age' });
        }

        // if (weight < 1 || weight > 500) {
        //     return res.status(400).json({ error: 'Invalid weight' });
        // }

        // if (height < 50 || height > 300) {
        //     return res.status(400).json({ error: 'Invalid height' });
        // }

        if (sex && !['Male', 'Female', 'Other'].includes(sex)) {
            return res.status(400).json({ error: 'Invalid sex value' });
        }

        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update profile
        // Update profile
        user.name = name;
        user.age = age;
        user.sex = sex;
        // user.weight = weight;
        // user.height = height;
        // user.comorbidities = comorbidities || [];
        // user.medications = medications || [];
        if (location) {
            user.location = location;
        }
        user.profileCompleted = true;

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                phone: user.phone,
                name: user.name,
                email: user.email,
                age: user.age,
                sex: user.sex,
                // weight: user.weight,
                // height: user.height,
                // comorbidities: user.comorbidities,
                // medications: user.medications,
                location: user.location,
                isPhoneVerified: user.isPhoneVerified,
                profileCompleted: user.profileCompleted,
            },
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
