require('dotenv').config();
const mongoose = require('mongoose');
const MedicalService = require('../models/MedicalService');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URI_LOCAL;
if (!MONGODB_URI) {
    console.error('Set MONGODB_URI in .env');
    process.exit(1);
}

const map = {
  pathology: 'diag_pathology.png',
  radiology: 'diag_radiology.png',
  cardiac: 'diag_cardiac.png',
  'body-composition': 'diag_bodycomp.png',
  genetics: 'diag_genetics.png',
  'cancer-screening': 'diag_cancer.png',
  
  'complete-recode': 'iv_complete_recode.png',
  'renewal-series': 'iv_renewal_series.png',
  'starter-evolution': 'iv_starter_evolution.png',
  'vytal-power-plus': 'iv_vytal_power.png',
  'vytal-shred-plus': 'iv_vytal_shred.png',
  'vytal-liver-detox': 'iv_vytal_liver.png',
  'vytal-iv-essentials': 'iv_vytal_essentials.png',
  'vytal-cycle-support': 'iv_vytal_cycle.png',
  'vytal-revive': 'iv_vytal_revive.png',
  'vytal-immune-plus': 'iv_vytal_immune.png',
  'vytal-detox': 'iv_vytal_detox.png',
  'vytal-femme-strong': 'iv_vytal_femme.png',
  'femme-strong': 'iv_vytal_femme.png',
  'vytal-endure-plus': 'iv_vytal_endurance.png',
  'endurance': 'iv_vytal_endurance.png',
  'vytal-alpha-power': 'iv_vytal_alpha.png',
  'alpha-athlete': 'iv_vytal_alpha.png',
  'vytal-gut-cleanse': 'iv_vytal_gut.png',
  'alpha-executive': 'iv_vytal_executive.png',
  'vytal-hairboost': 'iv_vytal_hairboost.png',
  'red-light-therapy': 'red_light_therapy.png',
  'hyperbaric-oxygen': 'hyperbaric_oxygen.png',
};

const BASE_URL = 'https://vytalyou-public-assets.s3.eu-north-1.amazonaws.com/';

async function updateDbUrls() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const services = await MedicalService.find({});
        for (const doc of services) {
            let filename = map[doc.serviceId];
            if (!filename) {
                // Default fallback
                filename = 'iv_drip_card.png';
            }
            const s3Url = BASE_URL + filename;
            await MedicalService.updateOne(
                { _id: doc._id },
                { $set: { imageUrl: s3Url } }
            );
            console.log(`Updated ${doc.serviceId} -> ${s3Url}`);
        }

        console.log(`\n✅ Successfully updated URLs!`);
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Update error:', error);
        process.exit(1);
    }
}

updateDbUrls();
