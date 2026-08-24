require('dotenv').config();
const mongoose = require('mongoose');
const MedicalService = require('../models/MedicalService');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URI_LOCAL;
if (!MONGODB_URI) {
    console.error('Set MONGODB_URI in .env');
    process.exit(1);
}

const newIvDrips = [
    // ─── 1. POWER+ ────────────────────────────────────────────────────────────
    {
        serviceId: 'vytal-power-plus',
        category: 'iv_drips',
        title: 'Vytal POWER+',
        tagline: 'Targeted Energy Optimization',
        shortDescription: 'NAD+ therapy for cellular energy and longevity.',
        fullDescription:
            'Vytal POWER+ delivers NAD+ directly to your cells, supporting mitochondrial function, energy production, and cellular repair. Choose from 250mg or 500mg doses based on your goals.',
        bullets: [
            'NAD+ infusion (250mg or 500mg)',
            'Cellular energy optimization',
            'Anti-aging and longevity support',
        ],
        imageUrl: 'saline-drip',
        order: 10,
        sections: [
            {
                title: 'Content',
                items: ['NAD+'],
            },
            {
                title: 'Pricing',
                items: [
                    '250mg NAD+ — ₹10,000',
                    '500mg NAD+ — ₹15,500',
                    '6 Sessions (250mg) — ₹50,000',
                    '6 Sessions (500mg) — ₹77,500',
                ],
            },
        ],
    },

    // ─── 2. SHRED+ ────────────────────────────────────────────────────────────
    {
        serviceId: 'vytal-shred-plus',
        category: 'iv_drips',
        title: 'Vytal SHRED+',
        tagline: 'Optimising metabolism. Not starving it.',
        shortDescription: 'Metabolic support for fat burning and energy.',
        fullDescription:
            'Vytal SHRED+ is designed to support healthy metabolism and fat oxidation. Contains B-Complex, L-Carnitine, Magnesium, Alpha-lipoic acid, and Zinc in personalised doses.',
        bullets: [
            'B-Complex for energy metabolism',
            'L-Carnitine for fat transport',
            'Alpha-lipoic acid for metabolic support',
            'Magnesium and Zinc',
        ],
        price: '₹10,000',
        imageUrl: 'saline-drip',
        order: 11,
        sections: [
            {
                title: 'Ingredients',
                items: ['B-Complex', 'L-Carnitine', 'Magnesium', 'Alpha-lipoic acid', 'Zinc'],
            },
            {
                title: 'Pricing',
                items: [
                    '1 Session — ₹10,000',
                    '6 Sessions — ₹50,000',
                    '1 Session + 250mg NAD+ — ₹18,000',
                    '1 Session + 500mg NAD+ — ₹22,500',
                    '6 Combo Sessions (Vytal Shred + 250mg NAD+) — ₹90,000',
                    '6 Combo Sessions (Vytal Shred + 500mg NAD+) — ₹1,12,500',
                ],
            },
        ],
    },

    // ─── 3. LIVER DETOX ───────────────────────────────────────────────────────
    {
        serviceId: 'vytal-liver-detox',
        category: 'iv_drips',
        title: 'Vytal LIVER DETOX',
        tagline: 'Optimising liver function for metabolic balance.',
        shortDescription: 'Comprehensive liver support and detoxification.',
        fullDescription:
            'Vytal LIVER DETOX supports hepatic function and detoxification pathways with B-Complex, N-Acetyl Cysteine, Zinc, Vitamin C, Glutathione, and Magnesium in personalised doses.',
        bullets: [
            'Glutathione for detoxification',
            'N-Acetyl Cysteine for liver protection',
            'Vitamin C and B-Complex',
            'Magnesium and Zinc',
        ],
        price: '₹15,000',
        imageUrl: 'saline-drip',
        order: 12,
        sections: [
            {
                title: 'Ingredients',
                items: ['B-Complex', 'N-Acetyl Cysteine', 'Zinc', 'Vitamin C', 'Glutathione', 'Magnesium'],
            },
            {
                title: 'Pricing',
                items: [
                    '1 Session — ₹15,000',
                    '6 Sessions — ₹75,000',
                    '1 Session + 250mg NAD+ — ₹23,000',
                    '1 Session + 500mg NAD+ — ₹27,500',
                    '6 Combo Sessions (250mg NAD+) — ₹1,15,000',
                    '6 Combo Sessions (500mg NAD+) — ₹1,37,500',
                ],
            },
        ],
    },

    // ─── 4. ESSENTIALS (Myer's) ───────────────────────────────────────────────
    {
        serviceId: 'vytal-iv-essentials',
        category: 'iv_drips',
        title: 'Vytal ESSENTIALS',
        subtitle: "Myer's Cocktail",
        tagline: 'Essential vitamins and minerals for overall wellness.',
        shortDescription: 'Classic IV vitamin and mineral infusion for wellness.',
        fullDescription:
            "Vytal ESSENTIALS (Myer's Cocktail) delivers essential vitamins and minerals including Vitamin C, B-Complex, Magnesium, Calcium, and trace minerals for overall wellness.",
        bullets: [
            'Vitamin C boost',
            'B-Complex for energy',
            'Magnesium and Calcium',
            'Trace minerals for balance',
        ],
        price: '₹10,000',
        imageUrl: 'saline-drip',
        order: 13,
        sections: [
            {
                title: 'Ingredients',
                items: ['Vitamin C', 'B-Complex', 'Magnesium', 'Calcium', 'Trace minerals'],
            },
            {
                title: 'Pricing',
                items: [
                    '1 Session — ₹10,000',
                    '6 Sessions — ₹50,000',
                    '1 Session + 250mg NAD+ — ₹18,000',
                    '1 Session + 500mg NAD+ — ₹22,500',
                    '6 Combo Sessions (250mg NAD+) — ₹90,000',
                    '6 Combo Sessions (500mg NAD+) — ₹1,12,500',
                ],
            },
        ],
    },

    // ─── 5. CYCLE SUPPORT ─────────────────────────────────────────────────────
    {
        serviceId: 'vytal-cycle-support',
        category: 'iv_drips',
        title: 'Vytal CYCLE SUPPORT',
        tagline: 'PCOS support through biology.',
        shortDescription: 'Hormonal balance and PCOS support for women.',
        fullDescription:
            'Vytal CYCLE SUPPORT is formulated to support hormonal balance and PCOS management with B-Complex, Inositol, Magnesium, Chromium, Vitamin C, and Glutathione in personalised doses.',
        bullets: [
            'Inositol for hormonal balance',
            'Chromium for insulin sensitivity',
            'Glutathione for cellular health',
            'B-Complex and Magnesium',
        ],
        price: '₹15,000',
        imageUrl: 'saline-drip',
        order: 14,
        sections: [
            {
                title: 'Ingredients',
                items: ['B-Complex', 'Inositol', 'Magnesium', 'Chromium', 'Vitamin C', 'Glutathione'],
            },
            {
                title: 'Pricing',
                items: [
                    '1 Session — ₹15,000',
                    '6 Sessions — ₹75,000',
                    '1 Session + 250mg NAD+ — ₹23,000',
                    '1 Session + 500mg NAD+ — ₹27,500',
                    '6 Combo Sessions (250mg NAD+) — ₹1,15,000',
                    '6 Combo Sessions (500mg NAD+) — ₹1,37,500',
                ],
            },
        ],
    },

    // ─── 6. REVIVE ────────────────────────────────────────────────────────────
    {
        serviceId: 'vytal-revive',
        category: 'iv_drips',
        title: 'Vytal REVIVE',
        tagline: 'Rehydration, recovery, and liver support.',
        shortDescription: 'Recovery and rehydration IV therapy.',
        fullDescription:
            'Vytal REVIVE is designed for recovery, rehydration, and liver support. Perfect after illness, travel, or overindulgence. Contains B-Complex, Vitamin C, Magnesium, Glutathione, and Antacid in personalised doses.',
        bullets: [
            'Rapid rehydration',
            'Liver support with Glutathione',
            'Vitamin C and B-Complex',
            'Anti-nausea support',
        ],
        price: '₹15,000',
        imageUrl: 'saline-drip',
        order: 15,
        sections: [
            {
                title: 'Ingredients',
                items: ['B-Complex', 'Vitamin C', 'Magnesium', 'Glutathione', 'Antacid'],
            },
            {
                title: 'Pricing',
                items: [
                    '1 Session — ₹15,000',
                    '6 Sessions — ₹75,000',
                    '1 Session + 250mg NAD+ — ₹23,000',
                    '1 Session + 500mg NAD+ — ₹27,500',
                    '6 Combo Sessions (250mg NAD+) — ₹1,15,000',
                    '6 Combo Sessions (500mg NAD+) — ₹1,37,500',
                ],
            },
        ],
    },

    // ─── 7. ENDURE+ ───────────────────────────────────────────────────────────
    {
        serviceId: 'vytal-endure-plus',
        category: 'iv_drips',
        title: 'Vytal ENDURE+',
        tagline: 'Supports stamina, recovery & performance efficiency.',
        shortDescription: 'Performance and endurance IV support.',
        fullDescription:
            'Vytal ENDURE+ supports stamina, recovery, and performance efficiency for athletes and active individuals. Contains B-Complex, Magnesium, L-Carnitine, Amino Acids, Vitamin C, and Glutathione in personalised doses.',
        bullets: [
            'Amino acids for muscle recovery',
            'L-Carnitine for endurance',
            'Magnesium for muscle function',
            'Glutathione for recovery',
        ],
        price: '₹15,000',
        imageUrl: 'saline-drip',
        order: 16,
        sections: [
            {
                title: 'Ingredients',
                items: ['B-Complex', 'Magnesium', 'L-Carnitine', 'Amino Acid', 'Vitamin C', 'Glutathione'],
            },
            {
                title: 'Pricing',
                items: [
                    '1 Session — ₹15,000',
                    '6 Sessions — ₹75,000',
                    '1 Session + 250mg NAD+ — ₹23,000',
                    '1 Session + 500mg NAD+ — ₹27,500',
                    '6 Combo Sessions (250mg NAD+) — ₹1,15,000',
                    '6 Combo Sessions (500mg NAD+) — ₹1,37,500',
                ],
            },
        ],
    },

    // ─── 8. IMMUNE+ ───────────────────────────────────────────────────────────
    {
        serviceId: 'vytal-immune-plus',
        category: 'iv_drips',
        title: 'Vytal IMMUNE+',
        tagline: 'Supporting immunity and recovery.',
        shortDescription: 'Immune system support and recovery IV.',
        fullDescription:
            'Vytal IMMUNE+ is designed to support your immune system and recovery. Contains Vitamin C, Zinc, B-Complex, Magnesium, Glutathione, and trace minerals in personalised doses.',
        bullets: [
            'High-dose Vitamin C',
            'Zinc for immune function',
            'Glutathione for cellular protection',
            'Trace minerals for balance',
        ],
        price: '₹15,000',
        imageUrl: 'saline-drip',
        order: 17,
        sections: [
            {
                title: 'Ingredients',
                items: ['Vitamin C', 'Zinc', 'B-Complex', 'Magnesium', 'Glutathione', 'Trace minerals'],
            },
            {
                title: 'Pricing',
                items: [
                    '1 Session — ₹15,000',
                    '6 Sessions — ₹75,000',
                    '1 Session + 250mg NAD+ — ₹23,000',
                    '1 Session + 500mg NAD+ — ₹27,500',
                    '6 Combo Sessions (250mg NAD+) — ₹1,15,000',
                    '6 Combo Sessions (500mg NAD+) — ₹1,37,500',
                ],
            },
        ],
    },

    // ─── 9. DETOX ─────────────────────────────────────────────────────────────
    {
        serviceId: 'vytal-detox',
        category: 'iv_drips',
        title: 'Vytal DETOX',
        tagline: 'Reducing oxidative stress. Supporting cellular protection.',
        shortDescription: 'Antioxidant and detoxification IV therapy.',
        fullDescription:
            'Vytal DETOX focuses on reducing oxidative stress and supporting cellular protection with Vitamin C, N-Acetyl Cysteine, Glutathione, Alpha-Lipoic Acid (ALA), B-Complex, Magnesium, and trace minerals in personalised doses.',
        bullets: [
            'Glutathione master antioxidant',
            'Alpha-Lipoic Acid for detox',
            'N-Acetyl Cysteine for cellular protection',
            'Trace minerals for balance',
        ],
        price: '₹15,000',
        imageUrl: 'saline-drip',
        order: 18,
        sections: [
            {
                title: 'Ingredients',
                items: [
                    'Vitamin C',
                    'N-Acetyl Cysteine',
                    'Glutathione',
                    'Alpha-Lipoic Acid (ALA)',
                    'B-Complex',
                    'Magnesium',
                    'Trace minerals',
                ],
            },
            {
                title: 'Pricing',
                items: [
                    '1 Session — ₹15,000',
                    '6 Sessions — ₹75,000',
                    '1 Session + 250mg NAD+ — ₹23,000',
                    '1 Session + 500mg NAD+ — ₹27,500',
                    '6 Combo Sessions (250mg NAD+) — ₹1,15,000',
                    '6 Combo Sessions (500mg NAD+) — ₹1,37,500',
                ],
            },
        ],
    },

    // ─── 10. FEMME STRONG ─────────────────────────────────────────────────────
    {
        serviceId: 'vytal-femme-strong',
        category: 'iv_drips',
        title: 'Vytal FEMME STRONG',
        tagline: "Supporting women's strength at every stage.",
        shortDescription: "Women's wellness, beauty, and strength IV.",
        fullDescription:
            "Vytal FEMME STRONG is designed to support women's health, beauty, and strength at every stage of life. Contains Vitamin C, B-Complex, Alpha Lipoic Acid, Zinc, Collagen, Hyaluronic Acid, Trace Elements, L-Carnitine, N-Acetyl Cysteine, and Glutathione in personalised doses.",
        bullets: [
            'Collagen and Hyaluronic Acid for skin and joints',
            'Glutathione for cellular glow',
            'L-Carnitine for energy and metabolism',
            'B-Complex and Vitamin C',
        ],
        price: '₹15,500',
        imageUrl: 'saline-drip',
        order: 19,
        sections: [
            {
                title: 'Ingredients',
                items: [
                    'Vitamin C',
                    'B-Complex',
                    'Alpha Lipoic Acid',
                    'Zinc',
                    'Collagen',
                    'Hyaluronic Acid',
                    'Trace Elements',
                    'L-Carnitine',
                    'N-Acetyl Cysteine',
                    'Glutathione',
                ],
            },
            {
                title: 'Pricing',
                items: [
                    '1 Session — ₹15,500',
                    '6 Sessions — ₹77,500',
                    '1 Session + 250mg NAD+ — ₹25,000',
                    '1 Session + 500mg NAD+ — ₹30,000',
                    '6 Combo Sessions (250mg NAD+) — ₹1,17,500',
                    '6 Combo Sessions (500mg NAD+) — ₹1,40,000',
                ],
            },
        ],
    },

    // ─── 11. ALPHA POWER ──────────────────────────────────────────────────────
    {
        serviceId: 'vytal-alpha-power',
        category: 'iv_drips',
        title: 'Vytal ALPHA POWER',
        tagline: 'Strength, stamina, and resilience — from within.',
        shortDescription: "Men's performance, strength, and vitality IV.",
        fullDescription:
            "Vytal ALPHA POWER is designed for men seeking strength, stamina, and resilience. Contains Vitamin C, B-Complex, Alpha Lipoic Acid, Zinc, Collagen, Hyaluronic Acid, Trace Elements, L-Carnitine, N-Acetyl Cysteine, and Glutathione in personalised doses.",
        bullets: [
            'Zinc for testosterone support',
            'Collagen for joints and recovery',
            'Glutathione for cellular health',
            'L-Carnitine for stamina',
        ],
        price: '₹15,500',
        imageUrl: 'saline-drip',
        order: 20,
        sections: [
            {
                title: 'Ingredients',
                items: [
                    'Vitamin C',
                    'B-Complex',
                    'Alpha Lipoic Acid',
                    'Zinc',
                    'Collagen',
                    'Hyaluronic Acid',
                    'Trace Elements',
                    'L-Carnitine',
                    'N-Acetyl Cysteine',
                    'Glutathione',
                ],
            },
            {
                title: 'Pricing',
                items: [
                    '1 Session — ₹15,500',
                    '6 Sessions — ₹77,500',
                    '1 Session + 250mg NAD+ — ₹25,000',
                    '1 Session + 500mg NAD+ — ₹30,000',
                    '6 Combo Sessions (250mg NAD+) — ₹1,17,500',
                    '6 Combo Sessions (500mg NAD+) — ₹1,40,000',
                ],
            },
        ],
    },

    // ─── 12. GUT CLEANSE ──────────────────────────────────────────────────────
    {
        serviceId: 'vytal-gut-cleanse',
        category: 'iv_drips',
        title: 'Vytal GUT CLEANSE',
        tagline: 'Restoring gut balance. Supporting whole-body health.',
        shortDescription: 'Gut health and digestive support IV therapy.',
        fullDescription:
            'Vytal GUT CLEANSE supports gut health and digestive balance with Glutamine, B-Complex, Magnesium, Vitamin C, Zinc, and Glutathione in personalised doses. Restores gut balance for whole-body health.',
        bullets: [
            'Glutamine for gut lining',
            'Zinc for gut immunity',
            'Magnesium for digestion',
            'Glutathione for detox',
        ],
        price: '₹15,500',
        imageUrl: 'saline-drip',
        order: 21,
        sections: [
            {
                title: 'Ingredients',
                items: ['Glutamine', 'B-Complex', 'Magnesium', 'Vitamin C', 'Zinc', 'Glutathione'],
            },
            {
                title: 'Pricing',
                items: [
                    '1 Session — ₹15,500',
                    '6 Sessions — ₹77,500',
                    '1 Session + 250mg NAD+ — ₹25,000',
                    '1 Session + 500mg NAD+ — ₹30,000',
                    '6 Combo Sessions (250mg NAD+) — ₹1,17,500',
                    '6 Combo Sessions (500mg NAD+) — ₹1,40,000',
                ],
            },
        ],
    },

    // ─── 13. HAIR BOOST (NEW) ─────────────────────────────────────────────────
    {
        serviceId: 'vytal-hair-boost',
        category: 'iv_drips',
        title: 'Vytal HAIR BOOST',
        tagline: 'Save the density.',
        shortDescription: 'IV therapy for hair strength, density, and growth.',
        fullDescription:
            'Vytal HAIR BOOST delivers a powerful blend of Glutathione, Vitamin C, Amino Acids, B-Complex, Zinc Chloride, Magnesium Chloride, Folic Acid, Trace Elements, and Biotin IM — formulated to nourish hair follicles and support density from within.',
        bullets: [
            'Biotin IM for hair growth',
            'Glutathione and Vitamin C for scalp health',
            'Amino Acids for follicle strength',
            'Zinc and Folic Acid for density',
        ],
        price: '₹15,500',
        imageUrl: 'saline-drip',
        order: 22,
        sections: [
            {
                title: 'Ingredients',
                items: [
                    'Glutathione',
                    'Vitamin C',
                    'Amino Acid',
                    'B-Complex',
                    'Zinc Chloride',
                    'Magnesium Chloride',
                    'Folic Acid',
                    'Trace Elements',
                    'Biotin IM',
                ],
            },
            {
                title: 'Pricing',
                items: [
                    '1 Session — ₹15,500',
                    '6 Sessions — ₹77,500',
                    '1 Session + 250mg NAD+ — ₹25,000',
                    '1 Session + 500mg NAD+ — ₹30,000',
                    '6 Combo Sessions (250mg NAD+) — ₹1,17,500',
                    '6 Combo Sessions (500mg NAD+) — ₹1,40,000',
                ],
            },
        ],
    },
];

async function seedNewIvDrips() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        for (const doc of newIvDrips) {
            const result = await MedicalService.findOneAndUpdate(
                { serviceId: doc.serviceId },
                doc,
                { upsert: true, new: true }
            );
            console.log(`✓ Upserted: ${result.title}`);
        }

        console.log(`\n✅ Successfully seeded ${newIvDrips.length} IV Drip services!`);
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Seed error:', error);
        process.exit(1);
    }
}

seedNewIvDrips();
