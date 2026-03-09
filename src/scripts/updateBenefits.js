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
        shortDescription: 'A high-performance IV therapy designed to optimise cellular energy production using NAD+. This infusion supports mitochondrial health, cognitive clarity, and physical vitality.',
        benefits: 'Boosts cellular energy, improves mental clarity, enhances physical stamina, and supports anti-ageing at a cellular level.',
        idealFor: 'Professionals with high workloads, individuals experiencing fatigue, athletes, and people seeking longevity and performance optimisation.'
    },
    {
        serviceId: 'vytal-shred-plus',
        shortDescription: 'A metabolism-support IV drip formulated with nutrients such as B-complex vitamins, L-Carnitine, magnesium and antioxidants to support metabolic efficiency and fat utilisation.',
        benefits: 'Supports metabolism, assists fat burning, improves energy levels, and reduces fatigue during weight loss journeys.',
        idealFor: 'Individuals aiming for weight management, people with slower metabolism, fitness enthusiasts, and those starting a fat-loss program.'
    },
    {
        serviceId: 'vytal-liver-detox',
        shortDescription: 'A targeted detoxification therapy designed to support liver function using nutrients that enhance natural detox pathways and metabolic balance.',
        benefits: 'Supports liver detoxification, reduces oxidative stress, improves metabolic health, and promotes overall wellbeing.',
        idealFor: 'Individuals exposed to alcohol, stress, environmental toxins, or those seeking metabolic reset and liver support.'
    },
    {
        serviceId: 'vytal-iv-essentials',
        shortDescription: 'A classic vitamin and mineral infusion designed to replenish essential micronutrients and restore hydration for overall wellness.',
        benefits: 'Improves energy levels, boosts immunity, supports hydration, reduces fatigue, and enhances general wellbeing.',
        idealFor: 'Individuals with vitamin deficiencies, busy professionals, frequent travellers, and those seeking general wellness support.'
    },
    {
        serviceId: 'vytal-cycle-support',
        shortDescription: 'A specialised IV therapy designed to support hormonal balance and metabolic health in women, particularly those managing PCOS or hormonal irregularities.',
        benefits: 'Supports hormonal balance, improves metabolic function, reduces fatigue, and enhances reproductive wellness.',
        idealFor: 'Women experiencing PCOS, hormonal imbalance, irregular cycles, or metabolic challenges.'
    },
    {
        serviceId: 'vytal-revive',
        shortDescription: 'A recovery-focused IV infusion designed to restore hydration, replenish essential nutrients, and support liver recovery after physical or lifestyle stress.',
        benefits: 'Provides rapid hydration, improves recovery, reduces fatigue, supports liver health, and promotes faster physical recovery.',
        idealFor: 'Individuals recovering from travel, dehydration, physical exertion, or lifestyle fatigue.'
    },
    {
        serviceId: 'vytal-endure-plus',
        shortDescription: 'A performance-support IV drip formulated to enhance stamina, muscle recovery, and athletic performance through targeted amino acids and vitamins.',
        benefits: 'Improves endurance, supports muscle recovery, boosts energy levels, and enhances athletic performance.',
        idealFor: 'Athletes, fitness enthusiasts, individuals with demanding physical routines, and those seeking faster workout recovery.'
    },
    {
        serviceId: 'vytal-immune-plus',
        shortDescription: 'An immunity-boosting IV therapy enriched with antioxidants and essential vitamins to strengthen the body\'s natural defence mechanisms.',
        benefits: 'Strengthens immune system, reduces risk of infections, improves recovery time, and supports overall health.',
        idealFor: 'Individuals prone to frequent illness, people under high stress, travellers, and those seeking immune protection.'
    },
    {
        serviceId: 'vytal-detox',
        shortDescription: 'An antioxidant-rich IV infusion designed to reduce oxidative stress and support cellular detoxification processes.',
        benefits: 'Reduces oxidative damage, supports detox pathways, improves skin health, and promotes cellular protection.',
        idealFor: 'Individuals exposed to pollution or stress, people seeking detoxification support, and those focused on longevity and wellness.'
    },
    {
        serviceId: 'vytal-femme-strong',
        shortDescription: 'A women-focused wellness infusion designed to support skin health, strength, and vitality through collagen-supporting nutrients and antioxidants.',
        benefits: 'Improves skin health, supports collagen production, boosts energy, and enhances overall vitality.',
        idealFor: 'Women seeking improved skin health, hormonal wellness support, and enhanced vitality.'
    },
    {
        serviceId: 'vytal-alpha-power',
        shortDescription: 'A vitality and strength IV therapy designed to support male performance, stamina, and resilience through targeted nutrients and antioxidants.',
        benefits: 'Improves stamina, enhances strength, supports tissue health, and boosts overall vitality.',
        idealFor: 'Men seeking improved energy, strength, resilience, and overall performance.'
    },
    {
        serviceId: 'vytal-gut-cleanse',
        shortDescription: 'A gut-support IV infusion formulated with nutrients that help support digestive health and restore gut balance.',
        benefits: 'Supports gut lining health, improves digestion, reduces inflammation, and enhances nutrient absorption.',
        idealFor: 'Individuals with digestive discomfort, gut imbalance, bloating, or those seeking improved digestive wellness.'
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
                        shortDescription: update.shortDescription,
                        benefits: update.benefits,
                        idealFor: update.idealFor
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
