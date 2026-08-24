const mongoose = require('mongoose');
require('dotenv').config({ path: '../../.env' });
const Blog = require('../models/Blog');

const updateData = [
  {
    slug: 'what-is-iv-therapy-is-it-safe-in-india',
    contentFragment: "But what is IV therapy, and more importantly, is it safe in India? Let’s break it down.",
    anchor: "IV therapy",
    linkedUrl: "https://vytalyou.com/iv-therapy"
  },
  {
    slug: 'how-personalized-iv-therapy-works',
    contentFragment: "lifestyle challenges, and health goals which is why customized IV therapy is emerging as the wellness tool of choice for today’s world.",
    anchor: "IV therapy",
    linkedUrl: "https://vytalyou.com/iv-therapy"
  },
  {
    slug: 'nad-therapy-benefits-risks',
    contentFragment: "This is where NAD IV therapy comes into play, a powerful",
    anchor: "NAD IV therapy",
    linkedUrl: "https://vytalyou.com/iv-therapy"
  },
  {
    slug: 'predictive-longevity-report-future-health-risks',
    contentFragment: "iv therapy Mumbai or preventive diagnostics due to its integrated approach.",
    anchor: "IV therapy Mumbai",
    linkedUrl: "https://vytalyou.com/locations/iv-clinic-in-powai"
  },
  {
    slug: 'predictive-longevity-report-future-health-risks',
    contentFragment: "If you are looking for a full body check up near me that does a lot more than your usual tests, then Vytalyou in Powai is the one for you",
    anchor: "full body check up near me",
    linkedUrl: "https://vytalyou.com/diagnostics"
  },
  {
    slug: 'predictive-longevity-report-future-health-risks',
    contentFragment: "If you're searching for a full body check up mumbai, Vytalyou in Powai offers advanced diagnostic and wellness solutions that go far beyond a standard body checkup.",
    anchor: "Full body check up Mumbai",
    linkedUrl: "https://vytalyou.com/diagnostics",
    isReplaceFullLine: true,
    originalFragment: "This is the tip of the iceberg where at Vytalyou in Powai, Mumbai your google search for a body checkup near me would take you to a level performing a basic phenomenon"
  },
  {
    slug: 'cost-of-iv-therapy-in-mumbai',
    contentFragment: "Refinements in wellness trends have propelled the popularity of IV therapy in Mumbai among professionals",
    anchor: "IV therapy in Mumbai",
    linkedUrl: "https://vytalyou.com/locations/iv-clinic-in-powai"
  },
  {
    slug: 'why-your-annual-health-check-up-is-not-enough',
    contentFragment: "They search online for a full body health checkup, get their reports",
    anchor: "full body health checkup",
    linkedUrl: "https://vytalyou.com/diagnostics"
  },
  {
    slug: 'iv-drips-vs-oral-supplements',
    contentFragment: "where IV drip infusion is changing the way we approach wellness.",
    anchor: "IV drip infusion",
    linkedUrl: "https://vytalyou.com/iv-therapy"
  },
  {
    slug: 'how-dna-based-insights-can-predict-and-prevent-disease-before-symptoms-appear',
    contentFragment: "With advances in DNA genetic testing, you can now learn about your health",
    anchor: "DNA genetic testing",
    linkedUrl: "https://vytalyou.com/diagnostics/genetics"
  },
  {
    slug: 'how-dna-based-insights-can-predict-and-prevent-disease-before-symptoms-appear',
    contentFragment: "At an IV clinic like Vytalyou, DNA testing insights can be paired with targeted therapies like IV therapy in Mumbai to actively support your body.",
    anchor: "IV therapy in Mumbai",
    linkedUrl: "https://vytalyou.com/iv-therapy"
  },
  {
    slug: 'iv-therapy-for-skin-glow-and-anti-aging-does-it-really-work',
    contentFragment: "That is why treatments such as IV therapy in Mumbai",
    anchor: "IV therapy in Mumbai",
    linkedUrl: "https://vytalyou.com/locations/iv-clinic-in-powai"
  },
  {
    slug: 'iv-therapy-for-skin-glow-and-anti-aging-does-it-really-work',
    contentFragment: "A full body checkup tells you about your health status; IV therapy helps you act on it.",
    anchor: "full body checkup",
    linkedUrl: "https://vytalyou.com/diagnostics"
  },
  {
    slug: 'add-healthy-years-to-your-life-with-iv-therapy',
    contentFragment: "This is where advanced, preventive treatments like IV therapy in Mumbai are playing an increasingly important role.",
    anchor: "IV therapy in Mumbai",
    linkedUrl: "https://vytalyou.com/locations/iv-clinic-in-powai"
  },
  {
    slug: 'add-healthy-years-to-your-life-with-iv-therapy',
    contentFragment: "From advanced diagnostics to tailored IV formulations, every step is designed to help you optimize your health today and invest in a stronger, healthier future.",
    anchor: "advanced diagnostics",
    linkedUrl: "https://vytalyou.com/diagnostics"
  }
];

async function checkBlogs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    for (const data of updateData) {
      const blog = await Blog.findOne({ slug: data.slug });
      if (!blog) {
        console.log(`Blog not found: ${data.slug}`);
        continue;
      }
      
      const content = blog.content;
      
      // We will try finding the text in a more relaxed way, stripping html and spaces
      let cleanedContent = content.replace(/<[^>]*>?/gm, ''); // strip html
      cleanedContent = cleanedContent.replace(/\s+/g, ' '); // normalize spaces
      
      let toFind = data.contentFragment.replace(/\s+/g, ' ');
      let origFind = data.originalFragment ? data.originalFragment.replace(/\s+/g, ' ') : null;
      
      if (cleanedContent.includes(toFind) || (origFind && cleanedContent.includes(origFind))) {
        console.log(`Found MATCH for slug: ${data.slug}`);
      } else {
        console.log(`MISSING content for slug: ${data.slug}`);
        console.log(`  Expected: ${toFind.substring(0, 50)}...`);
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkBlogs();
