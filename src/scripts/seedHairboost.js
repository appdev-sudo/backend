require('dotenv').config();
const mongoose = require('mongoose');
const MedicalService = require('../models/MedicalService');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URI_LOCAL;
if (!MONGODB_URI) {
    console.error('Set MONGODB_URI in .env');
    process.exit(1);
}

const hairboostService = {
    serviceId: 'vytal-hairboost',
    category: 'iv_drips',
    title: 'Vytal HAIRBOOST',
    subtitle: 'Save the density',
    tagline: 'Revitalize your hair density and health.',
    shortDescription: 'Advanced IV therapy for hair density and growth.',
    fullDescription: 'Vytal HAIRBOOST is a powerful blend of Glutathione, Vitamin C, Amino Acids, and essential minerals designed to support hair density, strength, and overall hair health.',
    bullets: [
        'Glutathione for cellular health',
        'Vitamin C for collagen production',
        'Amino Acids for keratin structure',
        'Zinc & Magnesium for hair growth',
    ],
    price: '₹20,000',
    imageUrl: 'saline-drip',
    order: 22,
    sections: [
        {
            title: 'Ingredients',
            items: [
                'Glutathione',
                'Vitamin C',
                'Amino Acid',
                'B complex',
                'Zinc chloride',
                'Magnesium Chloride',
                'Folic acid',
                'Trace elements'
            ],
        },
        {
            title: 'Package Pricing',
            items: [
                '1 Session - ₹20,000',
                '6 Sessions - ₹1,00,000',
                '1 Session + 250mg NAD+ - ₹33,000',
                '1 Session + 500mg NAD+ - ₹42,000',
                '6 Combo Sessions (250mg NAD+) - ₹1,65,000',
                '6 Combo Sessions (500mg NAD+) - ₹2,10,000',
            ],
        },
    ],
};

async function seedHairboost() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const result = await MedicalService.findOneAndUpdate(
            { serviceId: hairboostService.serviceId },
            hairboostService,
            { upsert: true, new: true }
        );
        console.log(`✓ Upserted: ${result.title}`);

        console.log(`\n✅ Successfully seeded Vytal Hairboost service!`);
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Seed error:', error);
        process.exit(1);
    }
}

seedHairboost();
