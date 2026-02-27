require('dotenv').config();
const mongoose = require('mongoose');
const MedicalService = require('../models/MedicalService');

async function updateServiceType() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const subscriptionTitles = [
            'the complete recode',
            'the renewal series',
            'the starter evolution'
        ];

        const services = await MedicalService.find({});
        console.log(`Found ${services.length} services`);

        let updatedCount = 0;
        for (const service of services) {
            if (service.title && subscriptionTitles.includes(service.title.toLowerCase())) {
                service.serviceType = 'subscription';
            } else {
                service.serviceType = 'individual';
            }

            await service.save();
            console.log(`Updated ${service.title} to ${service.serviceType}`);
            updatedCount++;
        }

        console.log(`Successfully updated ${updatedCount} services.`);
    } catch (error) {
        console.error('Error updating services:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    }
}

updateServiceType();
