require('dotenv').config();
const mongoose = require('mongoose');
const MedicalService = require('../models/MedicalService');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URI_LOCAL;
if (!MONGODB_URI) {
  console.error('Set MONGODB_URI in .env');
  process.exit(1);
}

const ivDrips = [
  {
    serviceId: 'complete-recode',
    category: 'iv_drips',
    title: 'The Complete Recode',
    subtitle: 'Comprehensive Cellular Rejuvenation',
    shortDescription: '20 IV Sessions · 6 Months',
    price: '₹2,49,000',
    sessionInfo: '20 IV Sessions • 6 Months',
    tagline: 'The Definitive Longevity & Cellular Reset',
    imageUrl: 'banner',
    order: 1,
    sections: [
      {
        title: 'A. Pre-Therapy Routine Health Check',
        items: [
          'Ultrasound Abdomen',
          'Chest X-Ray',
          '2D Echocardiogram',
          'ECG',
          'Genetic Test',
          'Complete Blood Profile',
          'Body Composition Evaluation',
        ],
      },
      {
        title: 'B. 20 Precision IV Therapy Sessions',
        items: ['Phase I (First 2 Months)', '6 NAD+ sessions', '6 Vytalyou Cocktail'],
      },
      {
        title: 'C. Post-Therapy Routine Health Check',
        items: ['Ultrasound Abdomen', 'Complete Blood Profile', 'Body Composition Evaluation'],
      },
    ],
  },
  {
    serviceId: 'renewal-series',
    category: 'iv_drips',
    title: 'The Renewal Series',
    subtitle: 'Focused Rejuvenation & Renewal',
    shortDescription: '12 IV Sessions · 2 Months',
    price: '₹1,49,000',
    sessionInfo: '12 IV Sessions • 2 Months',
    tagline: 'Targeted Longevity Rejuvenation',
    imageUrl: 'banner',
    order: 2,
    sections: [
      {
        title: 'A. Pre-Therapy Routine Health Check',
        items: [
          'Ultrasound Abdomen',
          'Chest X-Ray',
          '2D Echocardiogram',
          'ECG',
          'Genetic Test',
          'Complete Blood Profile',
          'Body Composition Evaluation',
        ],
      },
      {
        title: 'B. 12 Precision IV Therapy Sessions',
        items: ['Phase I (First 2 Months)', '6 NAD+ sessions', '6 Vytalyou Cocktail'],
      },
      {
        title: 'C. Post-Therapy Routine Health Check',
        items: ['Ultrasound Abdomen', 'Complete Blood Profile', 'Body Composition Evaluation'],
      },
    ],
  },
  {
    serviceId: 'starter-evolution',
    category: 'iv_drips',
    title: 'The Starter Evolution',
    subtitle: 'Introductory Longevity Boost',
    shortDescription: '4 IV Sessions · 35 Days',
    price: '₹75,000',
    sessionInfo: '4 IV Sessions • 35 Days',
    tagline: 'A Taste of Cellular Revitalization',
    imageUrl: 'banner',
    order: 3,
    sections: [
      {
        title: 'A. Pre-Therapy Routine Health Check',
        items: [
          'Ultrasound Abdomen',
          'Chest X-Ray',
          '2D Echocardiogram',
          'ECG',
          'Genetic Test',
          'Complete Blood Profile',
          'Body Composition Evaluation',
        ],
      },
      {
        title: 'B. 4 Precision IV Therapy Sessions',
        items: ['Phase I 10 – 35 Days', '3 NAD+ sessions', '1 Vytalyou Cocktail'],
      },
      {
        title: 'C. Post-Therapy Routine Health Check',
        items: ['Ultrasound Abdomen', 'Complete Blood Profile', 'Body Composition Evaluation'],
      },
    ],
  },
  {
    serviceId: 'femme-strong',
    category: 'iv_drips',
    title: 'Femme Strong',
    shortDescription: "IV therapy tailored for women's wellness and strength.",
    fullDescription:
      "Femme Strong is an IV therapy formulation tailored for women's wellness, energy, and strength. It supports hormonal balance, recovery, and overall vitality. Sessions are personalised based on your diagnostics and goals.",
    bullets: [
      "Tailored for women's wellness",
      'Supports energy and recovery',
      'Personalised based on your profile',
    ],
    imageUrl: 'saline-drip',
    order: 4,
  },
  {
    serviceId: 'endurance',
    category: 'iv_drips',
    title: 'Endurance',
    shortDescription: 'IV support for stamina, recovery and sustained performance.',
    fullDescription:
      'Endurance is an IV formulation designed to support stamina, recovery, and sustained physical and mental performance. Ideal for athletes and anyone seeking better endurance and faster recovery.',
    bullets: [
      'Stamina and sustained performance',
      'Faster recovery',
      'Athlete-friendly formulation',
    ],
    imageUrl: 'saline-drip',
    order: 5,
  },
  {
    serviceId: 'alpha-athlete',
    category: 'iv_drips',
    title: 'Alpha Athlete',
    shortDescription: 'Peak performance IV support for athletes.',
    fullDescription:
      'Alpha Athlete is our peak-performance IV support for athletes. It combines targeted micronutrients and NAD+ support to optimise performance, recovery, and cellular repair — all under medical supervision.',
    bullets: [
      'Peak performance support',
      'Recovery and cellular repair',
      'Medical supervision',
    ],
    imageUrl: 'saline-drip',
    order: 6,
  },
  {
    serviceId: 'alpha-executive',
    category: 'iv_drips',
    title: 'Alpha Executive',
    shortDescription: 'IV support for high-performing professionals.',
    fullDescription:
      'Alpha Executive is IV therapy designed for high-performing professionals. It supports mental clarity, energy, stress resilience, and cellular health — so you can perform at your best without burning out.',
    bullets: [
      'Mental clarity and energy',
      'Stress resilience',
      'Cellular health for longevity',
    ],
    imageUrl: 'saline-drip',
    order: 7,
  },
];

const diagnostics = [
  {
    serviceId: 'pathology',
    category: 'diagnostics',
    title: 'Pathology / Blood tests',
    shortDescription: 'Comprehensive laboratory testing for all vital organs.',
    fullDescription:
      'Our pathology and blood testing services provide a complete picture of your health. We offer comprehensive laboratory testing covering metabolic panels, organ function, hormones, vitamins, and inflammatory markers — all interpreted in the context of longevity and preventive health.',
    bullets: [
      'Complete blood count and metabolic panel',
      'Organ function (liver, kidney, thyroid)',
      'Vitamins and minerals',
      'Inflammatory and cardiac markers',
    ],
    imageUrl: 'pathology',
    order: 1,
  },
  {
    serviceId: 'radiology',
    category: 'diagnostics',
    title: 'Radiology - USG & X-ray',
    shortDescription: 'AI-assisted ultrasound, Colour Doppler, Elastography, X-ray.',
    fullDescription:
      'Radiology at VytalYou includes ultrasound (USG), X-ray, and advanced imaging. We use AI-assisted ultrasound, Colour Doppler, and Elastography where indicated to assess organs and structures — supporting early detection and baseline health mapping.',
    bullets: [
      'Ultrasound (Abdomen, etc.)',
      'X-Ray (Chest and others)',
      'Colour Doppler and Elastography where indicated',
    ],
    imageUrl: 'endocrine',
    order: 2,
  },
  {
    serviceId: 'cardiac',
    category: 'diagnostics',
    title: 'Cardiac Evaluation',
    subtitle: '2D/3D Echocardiogram, ECG',
    shortDescription: 'ECG and 2D/3D ECHO for heart performance assessment.',
    fullDescription:
      'Cardiac evaluation includes ECG and 2D/3D Echocardiogram to assess heart structure and function. This forms a key part of our preventive longevity assessment, ensuring your cardiovascular system is optimised and any early concerns are identified.',
    bullets: [
      'ECG (Electrocardiogram)',
      '2D Echocardiogram',
      '3D Echocardiogram where indicated',
    ],
    imageUrl: 'ecg-machine',
    order: 3,
  },
  {
    serviceId: 'body-composition',
    category: 'diagnostics',
    title: 'Body Composition Analysis',
    shortDescription:
      'Advanced technology measuring obesity, muscle mass, inflammation, cellular age.',
    fullDescription:
      'Body composition analysis goes beyond weight. We use advanced technology to measure fat mass, muscle mass, visceral fat, inflammation markers, and cellular age — giving you a clear view of your metabolic and structural health for targeted interventions.',
    bullets: [
      'Fat and muscle distribution',
      'Visceral fat and metabolic risk',
      'Cellular and metabolic age indicators',
    ],
    imageUrl: 'bio',
    order: 4,
  },
  {
    serviceId: 'genetics',
    category: 'diagnostics',
    title: 'Genetics',
    shortDescription: 'DNA-based insights into health risks and longevity potential.',
    fullDescription:
      'Our genetic testing provides DNA-based insights into your health risks, nutrient metabolism, and longevity potential. Results are interpreted by our doctors to personalise your IV therapy, supplements, and lifestyle recommendations.',
    bullets: [
      'Wellness and longevity-related genes',
      'Nutrient and drug metabolism',
      'Personalised interpretation by doctors',
    ],
    imageUrl: 'dna',
    order: 5,
  },
  {
    serviceId: 'cancer-screening',
    category: 'diagnostics',
    title: 'Cancer Screening',
    shortDescription: 'Early cancer risk screening and preventive markers.',
    fullDescription:
      'Cancer screening at VytalYou is part of our preventive longevity approach. We use evidence-based markers and, where appropriate, imaging and tests to support early detection and risk stratification — always in consultation with your care plan.',
    bullets: [
      'Evidence-based tumour markers where indicated',
      'Integrated with full diagnostic picture',
      'Doctor-supervised interpretation',
    ],
    imageUrl: 'pathology',
    order: 6,
  },
];

const redLight = [
  {
    serviceId: 'red-light-therapy',
    category: 'red_light',
    title: 'Red Light Therapy',
    shortDescription:
      'Non-invasive photobiomodulation for recovery, skin and cellular health.',
    fullDescription:
      'Red light therapy uses specific wavelengths of light to support cellular energy production, recovery, and skin health. Sessions are brief and non-invasive, and can complement your IV and longevity protocol. Ask our team for session options and packages.',
    bullets: [
      'Photobiomodulation for cells',
      'Recovery and muscle support',
      'Skin and wellness benefits',
      'Short, non-invasive sessions',
    ],
    imageUrl: 'banner',
    order: 1,
  },
];

const hyperbaric = [
  {
    serviceId: 'hyperbaric-oxygen',
    category: 'hyperbaric',
    title: 'Hyperbaric Oxygen Therapy',
    shortDescription: 'Pressurised oxygen therapy to support recovery and cellular function.',
    fullDescription:
      'Hyperbaric Oxygen Therapy (HBOT) delivers 100% oxygen at increased pressure in a controlled chamber. This can support wound healing, recovery, and cellular function. Sessions are supervised and tailored to your goals. Enquire for availability and packages.',
    bullets: [
      '100% oxygen at increased pressure',
      'Supports recovery and healing',
      'Supervised, controlled sessions',
      'Tailored to your protocol',
    ],
    imageUrl: 'banner',
    order: 1,
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  const all = [...ivDrips, ...diagnostics, ...redLight, ...hyperbaric];
  for (const doc of all) {
    await MedicalService.findOneAndUpdate(
      { serviceId: doc.serviceId },
      doc,
      { upsert: true, new: true }
    );
  }
  console.log(`Seeded ${all.length} medical services.`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
