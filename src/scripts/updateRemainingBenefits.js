require('dotenv').config();
const mongoose = require('mongoose');
const MedicalService = require('../models/MedicalService');

const updates = [
    {
        title: "The Complete Recode",
        information: "A comprehensive longevity program designed to optimise cellular health through precision IV therapies and medical diagnostics. This 6-month protocol combines advanced NAD+ infusions with customised nutrient cocktails, supported by detailed pre- and post-therapy health assessments to monitor biological improvements.",
        benefits: "Deep cellular rejuvenation, enhanced mitochondrial energy production, improved metabolic health, better cognitive clarity, reduced fatigue, and long-term vitality optimisation.",
        idealFor: "Individuals seeking a full longevity reset, professionals experiencing chronic fatigue or burnout, bio-optimisation enthusiasts, and those interested in comprehensive preventive health programs."
    },
    {
        title: "The Renewal Series",
        information: "A focused rejuvenation program that delivers targeted NAD+ therapy and specialised nutrient infusions over a structured treatment period. Supported by detailed health diagnostics, this program is designed to refresh cellular function and restore vitality efficiently.",
        benefits: "Improves energy levels, enhances cellular repair, supports metabolic function, boosts recovery, and promotes overall wellbeing.",
        idealFor: "Individuals looking for a targeted longevity program, those experiencing moderate fatigue or lifestyle stress, and people seeking a structured wellness reset without committing to a longer program."
    },
    {
        title: "The Starter Evolution",
        information: "An introductory longevity program designed to provide an initial boost to cellular health through NAD+ therapy and nutrient infusions. This program includes medical assessments to establish a baseline and track early improvements in vitality and metabolic health.",
        benefits: "Supports energy production, improves mental clarity, promotes cellular repair, and provides a foundational boost to overall wellbeing.",
        idealFor: "Individuals new to IV therapy or longevity treatments, people looking to explore cellular health optimisation, and those seeking a short-term vitality boost."
    }
];

async function updateMedicalServices() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');

        let updatedCount = 0;

        for (const update of updates) {
            // Find the service by title
            const service = await MedicalService.findOne({ title: update.title });

            if (service) {
                // Update shortDescription (since "Information" typically maps to this)
                service.shortDescription = update.information;
                // Also update fullDescription just in case
                service.fullDescription = update.information;

                // Update the array representations if necessary
                service.benefits = update.benefits;
                service.idealFor = update.idealFor;

                await service.save();
                console.log(`Successfully updated: ${update.title}`);
                updatedCount++;
            } else {
                console.log(`Service not found for title: ${update.title}`);
            }
        }

        console.log(`\nUpdate process completed. ${updatedCount} services updated.`);

    } catch (error) {
        console.error('Error connecting to MongoDB or updating data:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

updateMedicalServices();
