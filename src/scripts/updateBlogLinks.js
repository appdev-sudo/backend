const mongoose = require('mongoose');
require('dotenv').config({ path: '../../.env' });
const Blog = require('../models/Blog');

const updateData = [
  {
    slug: 'what-is-iv-therapy-and-is-it-safe-in-india',
    replaceFn: (content) => content.replace(
      "But what is IV therapy, and more importantly, is it safe in India? Let’s break it down.",
      "But what is <a href=\"https://vytalyou.com/iv-therapy\">IV therapy</a>, and more importantly, is it safe in India? Let’s break it down."
    )
  },
  {
    slug: 'how-personalized-iv-therapy-works-step-by-step-guide',
    replaceFn: (content) => content.replace(
      "lifestyle challenges, and health goals which is why customized IV therapy is emerging as the wellness tool of choice for today’s world.",
      "lifestyle challenges, and health goals which is why customized <a href=\"https://vytalyou.com/iv-therapy\">IV therapy</a> is emerging as the wellness tool of choice for today’s world."
    )
  },
  {
    slug: 'nad-therapy-benefits-risks-and-who-should-take-it',
    replaceFn: (content) => content.replace(
      "This is where NAD IV therapy comes into play, a powerful",
      "This is where <a href=\"https://vytalyou.com/iv-therapy\">NAD IV therapy</a> comes into play, a powerful"
    )
  },
  {
    slug: 'how-a-predictive-longevity-report-can-reveal-your-future-health-risks',
    replaceFn: (content) => content.replace(
      "iv therapy Mumbai or preventive diagnostics due to its integrated approach.",
      "<a href=\"https://vytalyou.com/locations/iv-clinic-in-powai\">IV therapy Mumbai</a> or preventive diagnostics due to its integrated approach."
    )
  },
  {
    slug: 'how-a-predictive-longevity-report-can-reveal-your-future-health-risks',
    replaceFn: (content) => content.replace(
      "If you are looking for a full body check up near me that does a lot more than your usual tests, then Vytalyou in Powai is the one for you",
      "If you are looking for a <a href=\"https://vytalyou.com/diagnostics\">full body check up near me</a> that does a lot more than your usual tests, then Vytalyou in Powai is the one for you"
    )
  },
  {
    slug: 'how-a-predictive-longevity-report-can-reveal-your-future-health-risks',
    replaceFn: (content) => content.replace(
      "This is the tip of the iceberg where at Vytalyou in Powai, Mumbai your google search for a body checkup near me would take you to a level performing a basic phenomenon",
      "If you're searching for a <a href=\"https://vytalyou.com/diagnostics\">Full body check up Mumbai</a>, Vytalyou in Powai offers advanced diagnostic and wellness solutions that go far beyond a standard body checkup."
    )
  },
  {
    slug: 'cost-of-iv-therapy-in-mumbai-what-to-expect',
    replaceFn: (content) => content.replace(
      "Refinements in wellness trends have propelled the popularity of IV therapy in Mumbai among professionals",
      "Refinements in wellness trends have propelled the popularity of <a href=\"https://vytalyou.com/locations/iv-clinic-in-powai\">IV therapy in Mumbai</a> among professionals"
    )
  },
  {
    slug: 'why-your-annual-health-check-up-is-not-enough',
    replaceFn: (content) => content.replace(
      "They search online for a full body health checkup, get their reports",
      "They search online for a <a href=\"https://vytalyou.com/diagnostics\">full body health checkup</a>, get their reports"
    )
  },
  {
    slug: 'iv-drips-vs-oral-supplements',
    replaceFn: (content) => content.replace(
      "where IV drip infusion is changing the way we approach wellness.",
      "where <a href=\"https://vytalyou.com/iv-therapy\">IV drip infusion</a> is changing the way we approach wellness."
    )
  },
  {
    slug: 'how-dna-based-insights-can-predict-and-prevent-disease-before-symptoms-appear',
    replaceFn: (content) => content.replace(
      "With advances in DNA genetic testing, you can now learn about your health",
      "With advances in <a href=\"https://vytalyou.com/diagnostics/genetics\">DNA genetic testing</a>, you can now learn about your health"
    )
  },
  {
    slug: 'how-dna-based-insights-can-predict-and-prevent-disease-before-symptoms-appear',
    replaceFn: (content) => content.replace(
      "At an IV clinic like Vytalyou, DNA testing insights can be paired with targeted therapies like IV therapy in Mumbai to actively support your body.",
      "At an IV clinic like Vytalyou, DNA testing insights can be paired with targeted therapies like <a href=\"https://vytalyou.com/iv-therapy\">IV therapy in Mumbai</a> to actively support your body."
    )
  },
  {
    slug: 'iv-therapy-for-skin-glow-and-anti-aging-does-it-really-work',
    replaceFn: (content) => content.replace(
      "That is why treatments such as IV therapy in Mumbai",
      "That is why treatments such as <a href=\"https://vytalyou.com/locations/iv-clinic-in-powai\">IV therapy in Mumbai</a>"
    )
  },
  {
    slug: 'iv-therapy-for-skin-glow-and-anti-aging-does-it-really-work',
    replaceFn: (content) => content.replace(
      "A full body checkup tells you about your health status; IV therapy helps you act on it.",
      "A <a href=\"https://vytalyou.com/diagnostics\">full body checkup</a> tells you about your health status; IV therapy helps you act on it."
    )
  },
  {
    slug: 'how-to-add-10-healthy-years-to-your-life-with-iv-therapy',
    replaceFn: (content) => content.replace(
      "For those exploring IV therapy in Mumbai, Vytalyou offers",
      "For those exploring <a href=\"https://vytalyou.com/locations/iv-clinic-in-powai\">IV therapy in Mumbai</a>, Vytalyou offers"
    )
  },
  {
    slug: 'how-to-add-10-healthy-years-to-your-life-with-iv-therapy',
    replaceFn: (content) => content.replace(
      "From advanced diagnostics to tailored IV formulations, every step is designed to help you optimize your health today and invest in a stronger, healthier future.",
      "From <a href=\"https://vytalyou.com/diagnostics\">advanced diagnostics</a> to tailored IV formulations, every step is designed to help you optimize your health today and invest in a stronger, healthier future."
    )
  }
];

async function updateBlogs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    let modifiedCount = 0;
    
    // Group updates by slug
    const updatesBySlug = {};
    for (const data of updateData) {
      if (!updatesBySlug[data.slug]) {
        updatesBySlug[data.slug] = [];
      }
      updatesBySlug[data.slug].push(data.replaceFn);
    }
    
    for (const slug of Object.keys(updatesBySlug)) {
      const blog = await Blog.findOne({ slug: slug });
      if (!blog) {
        console.log(`Blog not found: ${slug}`);
        continue;
      }
      
      let newContent = blog.content;
      for (const replaceFn of updatesBySlug[slug]) {
        let prevContent = newContent;
        newContent = replaceFn(newContent);
        if (prevContent === newContent) {
           console.log(`Warning: No replacement occurred for one of the rules in ${slug}`);
        }
      }
      
      if (blog.content !== newContent) {
        blog.content = newContent;
        await blog.save();
        modifiedCount++;
        console.log(`Updated blog: ${slug}`);
      } else {
        console.log(`No changes made to blog: ${slug} (maybe already updated or text didn't match perfectly)`);
      }
    }
    
    console.log(`Successfully updated ${modifiedCount} blogs.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

updateBlogs();
