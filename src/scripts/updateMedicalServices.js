require('dotenv').config();
const mongoose = require('mongoose');
const MedicalService = require('../models/MedicalService');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URI_LOCAL;

if (!MONGODB_URI) {
    console.error('Set MONGODB_URI in .env');
    process.exit(1);
}

const updates = [
    {
        serviceId: 'vytal-power-plus',
        title: 'Vytal POWER',
        shortDescription: 'A high-performance drip designed to boost cellular energy and longevity.',
        tagline: 'Boosts cellular energy and promotes anti-aging.',
        targetAudience: 'Professionals, athletes, and high-performers seeking peak vitality.'
    },
    {
        serviceId: 'vytal-shred-plus',
        title: 'Vytal SHRED',
        shortDescription: 'A metabolic accelerator that aids in fat burning and energy production.',
        tagline: 'Supports fat burning, energy, and a healthy metabolism.',
        targetAudience: 'Individuals looking to manage weight and boost energy.'
    },
    {
        serviceId: 'vytal-liver-detox',
        title: 'Vytal LIVER',
        shortDescription: 'A targeted liver detox infusion to support hepatic function and healing.',
        tagline: 'Supports liver function, detoxification, and cellular repair.',
        targetAudience: 'Individuals with poor liver health or recovering from overindulgence.'
    },
    {
        serviceId: 'vytal-iv-essentials',
        title: 'Vytal I/V BAR',
        shortDescription: 'A classic IV drip for hydration, energy, and overall essential wellness.',
        tagline: 'Improves hydration, energy, and general wellness.',
        targetAudience: 'Individuals seeking general wellness, hydration, and nutritional balance.'
    },
    {
        serviceId: 'vytal-cycle-support',
        title: 'Vytal CYCLE',
        shortDescription: 'A specialised drip for women that supports hormonal balance and PCOS management.',
        tagline: 'Supports menstrual cycle, hormonal balance, and overall wellness.',
        targetAudience: 'Women experiencing PMS, hormonal imbalances, or looking for PCOS support.'
    },
    {
        serviceId: 'vytal-revive',
        title: 'Vytal REVIVE',
        shortDescription: 'A recovery drip tailored to rehydrate and replenish vital nutrients rapidly.',
        tagline: 'Provides rapid recovery, hydration, and an energy boost.',
        targetAudience: 'Individuals recovering from illness, travel, or strenuous activities.'
    },
    {
        serviceId: 'vytal-endure-plus',
        title: 'Vytal ENDURANCE',
        shortDescription: 'A performance-enhancing drip to support stamina, recovery, and physical efficiency.',
        tagline: 'Improves stamina, accelerates recovery, and enhances performance efficiency.',
        targetAudience: 'Athletes, fitness enthusiasts, and active individuals needing optimal recovery.'
    },
    {
        serviceId: 'vytal-immune-plus',
        title: 'Vytal IMMUNITY',
        shortDescription: 'An immune-boosting drip to support the immune system and promote rapid recovery.',
        tagline: 'Strengthens immune system and aids in fighting off sickness.',
        targetAudience: 'Individuals prone to frequent illnesses or seeking to fortify their immunity.'
    },
    {
        serviceId: 'vytal-detox',
        title: 'Vytal DETOX',
        shortDescription: 'An antioxidant-rich drip designed to neutralize toxins and reduce oxidative stress.',
        tagline: 'Reduces oxidative stress, supports detox pathways, and protects cellular health.',
        targetAudience: 'Individuals exposed to high pollution or looking for full-body detoxification.'
    },
    {
        serviceId: 'vytal-femme-strong',
        title: 'Vytal FEMME',
        shortDescription: 'A women-centric drip targeting health, beauty, strength, and inner glow.',
        tagline: 'Improves hormonal balance, enhances beauty from within, and supports vitality.',
        targetAudience: 'Women seeking optimal health, prolonged wellness, and anti-aging benefits.'
    },
    {
        serviceId: 'vytal-alpha-power',
        title: 'VytaL ALFA',
        shortDescription: 'A vitality and longevity drip tailored to support men’s strength and resilience.',
        tagline: 'Improves cellular health, stamina, testosterone support, and performance.',
        targetAudience: 'Men seeking to improve energy, optimize strength, and support overall performance.'
    },
    {
        serviceId: 'vytal-gut-cleanse',
        title: 'Vytal GUTRENEW',
        shortDescription: 'A gut-supporting drip to restore digestive balance and promote overall health.',
        tagline: 'Supports gut health, improves digestion, and protects the gut lining.',
        targetAudience: 'Individuals with digestive issues or looking to restore their gut microbiome.'
    }
];

async function runUpdate() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        for (const update of updates) {
            const result = await MedicalService.findOneAndUpdate(
                { serviceId: update.serviceId },
                {
                    $set: {
                        title: update.title,
                        shortDescription: update.shortDescription,
                        tagline: update.tagline,
                        targetAudience: update.targetAudience
                    }
                },
                { new: true }
            );
            if (result) {
                console.log(`✓ Updated: ${result.title}`);
            } else {
                console.log(`❌ Not Found: ${update.serviceId}`);
            }
        }

        console.log(`\n✅ Successfully updated ${updates.length} IV Drip services!`);
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Update error:', error);
        process.exit(1);
    }
}

runUpdate();
