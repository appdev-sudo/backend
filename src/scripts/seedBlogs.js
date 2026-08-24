/**
 * Blog Migration Script
 * Reads blog data from VytalYou Blogs.xlsx and seeds it into MongoDB
 * 
 * Usage: node src/scripts/seedBlogs.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const XLSX = require('xlsx');
const path = require('path');
const Blog = require('../models/Blog');

// Helper: generate a URL-friendly slug from a title
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/['']/g, '')
    .replace(/&/g, 'and')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Helper: parse the Content field to extract meta title, meta description, and body
function parseContent(raw) {
  if (!raw) return { metaTitle: '', metaDescription: '', content: '' };

  const lines = raw.split(/\r?\n/);
  let metaTitle = '';
  let metaDescription = '';
  let bodyStartIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.match(/^Meta Title/i)) {
      // Next non-empty line is the meta title
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim()) {
          metaTitle = lines[j].trim();
          i = j;
          break;
        }
      }
      continue;
    }

    if (line.match(/^Meta Description/i)) {
      // Next non-empty line is the meta description
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim()) {
          metaDescription = lines[j].trim();
          i = j;
          break;
        }
      }
      continue;
    }

    // Once we've passed meta fields, the rest is content
    if (metaTitle && metaDescription && !line.match(/^Meta/i)) {
      bodyStartIndex = i;
      break;
    }
  }

  // Build the HTML content from the remaining lines
  const contentLines = lines.slice(bodyStartIndex);
  const htmlContent = convertToHTML(contentLines);

  return { metaTitle, metaDescription, content: htmlContent };
}

// Helper: convert plain text blog lines to structured HTML
function convertToHTML(lines) {
  const html = [];
  let inList = false;
  let expectingListItems = false; // true after a line ending with ":"

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) {
      if (inList) {
        html.push('</ul>');
        inList = false;
      }
      // A blank line resets list expectation only if we're not already in a list
      if (!inList) {
        expectingListItems = false;
      }
      continue;
    }

    // Check if line starts with an explicit bullet character
    const bulletMatch = line.match(/^[–•\-]\s*(.+)/);

    // A line ending with ":" that is short is a sub-heading that introduces a list
    const isListIntroHeading = line.endsWith(':') && line.length < 100 && !line.includes('. ');

    // Detect if this short line is actually a list item (not a real heading)
    // It's a list item if:
    //   - We're already expecting list items (previous was ":" heading or another bullet)
    //   - OR  we're already inside a <ul>
    //   - AND the line is short and doesn't look like a real section heading
    const isShortLine = line.length < 80 && !line.endsWith('.') && !line.endsWith(',');
    const looksLikeBulletItem = isShortLine && !line.endsWith(':') &&
                                 !line.startsWith('–') && !line.startsWith('-') && !line.startsWith('•') &&
                                 (expectingListItems || inList);

    // Real section headings: short lines NOT in list context, not sentence-like
    const isRealHeading = isShortLine && !line.endsWith(':') && line.length > 10 && line.length < 75 &&
                          !line.startsWith('–') && !line.startsWith('-') && !line.startsWith('•') &&
                          !expectingListItems && !inList && i > 0;

    if (bulletMatch) {
      // Explicit bullet
      if (!inList) {
        html.push('<ul>');
        inList = true;
      }
      html.push(`<li>${bulletMatch[1]}</li>`);
      expectingListItems = true;
    } else if (isListIntroHeading) {
      // Sub-heading that introduces a list (e.g. "Key benefits:")
      if (inList) {
        html.push('</ul>');
        inList = false;
      }
      const headingText = line.replace(/:$/, '');
      html.push(`<h3>${headingText}</h3>`);
      expectingListItems = true;
    } else if (looksLikeBulletItem) {
      // Short line in list context → treat as bullet item
      if (!inList) {
        html.push('<ul>');
        inList = true;
      }
      html.push(`<li>${line}</li>`);
    } else if (isRealHeading) {
      if (inList) {
        html.push('</ul>');
        inList = false;
      }
      expectingListItems = false;
      // First few lines are top-level headings
      if (i <= 2) {
        html.push(`<h2>${line}</h2>`);
      } else {
        html.push(`<h3>${line}</h3>`);
      }
    } else {
      // Regular paragraph
      if (inList) {
        html.push('</ul>');
        inList = false;
      }
      expectingListItems = false;
      html.push(`<p>${line}</p>`);
    }
  }

  if (inList) {
    html.push('</ul>');
  }

  return html.join('\n');
}

// Helper: extract first meaningful paragraph for excerpt
function extractExcerpt(content, maxLen = 200) {
  // Strip HTML tags
  const plain = content.replace(/<[^>]+>/g, '');
  // Get first sentence or maxLen characters
  const sentence = plain.match(/^[^.!?]+[.!?]/);
  if (sentence && sentence[0].length <= maxLen) {
    return sentence[0].trim();
  }
  return plain.substring(0, maxLen).trim() + '...';
}

// Helper: estimate read time from content
function estimateReadTime(content) {
  const plainText = content.replace(/<[^>]+>/g, '');
  const wordCount = plainText.split(/\s+/).length;
  return Math.max(3, Math.ceil(wordCount / 200));
}

// Helper: parse Excel serial date to JS Date
function excelDateToJS(serial) {
  if (!serial) return new Date();
  if (typeof serial === 'string') {
    const parsed = new Date(serial);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }
  // Excel serial date conversion
  const utc_days = Math.floor(serial - 25569);
  const date = new Date(utc_days * 86400 * 1000);
  return date;
}

// Cover image URLs — we'll use gradient placeholders that match the website theme
const coverImages = [
  'assets/blog/covers/blog-cover-1.png', // IV therapy
  'assets/blog/covers/blog-cover-2.png', // NAD therapy
  'assets/blog/covers/blog-cover-3.png', // personalized therapy
  'assets/blog/covers/blog-cover-4.png', // cost/medical
  'assets/blog/covers/blog-cover-5.png', // longevity report
  'assets/blog/covers/blog-cover-6.png', // healthy years
];

async function seedBlogs() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Read Excel file
    const xlsxPath = path.resolve(__dirname, '../../../vytalyou_website/assets/blog/VytalYou Blogs.xlsx');
    console.log(`📖 Reading Excel file: ${xlsxPath}`);
    
    const workbook = XLSX.readFile(xlsxPath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    // Filter only rows that have actual content
    const validRows = rows.filter(row => row['Content'] && row['Blog Topic']);
    // Add the April blog
    validRows.push({
      'No.': validRows.length + 1,
      'Blog Topic': 'How to Add 10+ Healthy Years to Your Life with IV Therapy',
      'Category': 'Blog',
      'Keywords': 'IV therapy\nLongevity\nHealthspan\nImmunity\nEnergy',
      'Date Published': '2026-04-01',
      'CoverImage': 'assets/blog/covers/april_blog_cover.png',
      'Content': `Meta Title (60 characters):
Add 10+ Healthy Years with IV Therapy | Vytalyou
Meta Description (160 characters):
Discover how personalized IV therapy helps boost energy, immunity & longevity. Explore IV therapy Mumbai & IV therapy at home with Vytalyou.

How to Add 10+ Healthy Years to Your Life with IV Therapy
Living longer is no longer the ultimate goal, living healthier for longer is.
In a fast-paced city like Mumbai, where stress, pollution, and lifestyle demands take a toll on overall well-being, there is a growing shift toward science-backed, preventive approaches to longevity.
This is where personalized IV therapy is creating a meaningful impact. At advanced longevity centers like Vytalyou, IV therapy goes beyond symptom management; it targets health at a cellular level, supporting recovery, optimization, and long-term vitality.
What Does “Adding Healthy Years” Really Mean?
Extending life is not just about lifespan it’s about healthspan.
Healthspan refers to:
Sustained energy as you age
Preserved mental clarity
Reduced risk of chronic disease
Maintenance of strength, immunity, and function
Modern wellness focuses on early detection, prevention, and optimization—a philosophy deeply embedded in Vytalyou’s approach.
How Personalized IV Therapy Supports Longevity
Unlike oral supplements, which are limited by digestion and absorption, IV therapy delivers nutrients directly into the bloodstream, ensuring maximum bioavailability and faster results.
At Vytalyou, every IV therapy plan is guided by advanced diagnostics and predictive health insights, ensuring your body receives exactly what it needs.
Corrects Hidden Nutrient Deficiencies
Even with a balanced diet, many individuals experience undetected deficiencies due to stress, lifestyle, or poor absorption.
IV therapy helps restore optimal levels of:
Vitamins (B-complex, Vitamin C, Vitamin D)
Minerals (magnesium, zinc)
Antioxidants
This supports cellular balance and long-term resilience.
Boosts Cellular Energy Production
Energy is fundamental to every biological process.
As we age, mitochondrial efficiency declines, leading to fatigue and reduced performance. IV therapy supports mitochondrial function the energy engine of your cells helping you:
Feel more energetic
Improve productivity and performance
Reduce fatigue and burnout
Consistent energy is a cornerstone of healthy aging.
Reduces Inflammation & Slows Aging
Chronic inflammation is one of the primary drivers of aging and disease.
Personalized IV therapy delivers potent antioxidants that:
Neutralize free radicals
Reduce oxidative stress
Support cellular repair
This helps slow biological aging and protect against long-term damage.
Strengthens Immunity
A strong immune system is essential for longevity.
IV therapy supports:
Enhanced immune response
Reduced frequency of illness
Faster recovery
This translates to fewer health disruptions and greater overall stability in your well-being.
Supports Brain Health & Mental Clarity
Cognitive health is a key determinant of quality of life.
IV therapy helps:
Support neurotransmitter function
Improve focus and memory
Reduce brain fog
Maintaining mental sharpness is essential for independence and vitality as you age.
Enhances Detoxification
Modern living exposes the body to constant toxins from pollution to processed foods.
IV therapy supports detoxification by:
Assisting liver function
Promoting toxin elimination
Improving metabolic efficiency
In urban environments like Mumbai, this added support becomes especially valuable.
The Vytalyou Approach to Longevity
What sets Vytalyou apart is its precision-health ecosystem.
Before recommending any therapy, the process includes:
Comprehensive body evaluation
Advanced blood marker analysis
Cardiac and metabolic risk assessment
Imaging and diagnostic insights
This allows therapies to be tailored based on your biological age and risk profile, not just your chronological age.
The focus is clear: extend your health span, not just treat symptoms.
Can You Opt for IV Therapy at Home?
At-home IV therapy is becoming increasingly popular for its convenience.
Benefits include:
Time efficiency for busy schedules
Comfort of your home environment
Reduced need for clinic visits
However, safety remains paramount. Always ensure:
Certified medical professionals administer the therapy
Strict hygiene and clinical protocols are followed
Proper consultation is completed beforehand
Vytalyou offers safe, medically supervised at-home IV therapy, maintaining the same standards as in-clinic care.
How Often Should You Take IV Therapy?
The frequency of IV therapy depends on your individual goals and health status:
General wellness: Every 2–4 weeks
Energy and recovery: Weekly or bi-weekly
Longevity optimization: As advised after detailed evaluation
A structured, personalized plan ensures consistent and sustainable benefits.
Lifestyle + IV Therapy = Maximum Longevity
While IV therapy is a powerful tool, its impact is amplified when combined with:
Balanced nutrition
Regular physical activity
Stress management
Quality sleep
Think of IV therapy as a precision enhancer elevating the results of an already healthy lifestyle.

Final Thoughts
Adding 10+ healthy years to your life is no longer aspirational; it is achievable through science-backed, proactive care.
Personalized IV therapy plays a key role in this journey by correcting imbalances, enhancing cellular function, and supporting long-term health optimization.
For those exploring IV therapy in Mumbai, Vytalyou offers a data-driven, medically supervised, and highly personalized approach far beyond conventional wellness treatments.
From advanced diagnostics to tailored IV formulations, every step is designed to help you optimize your health today and invest in a stronger, healthier future.`
    });

    console.log(`📝 Found ${validRows.length} blogs with content`);

    // Clear existing blogs
    // await Blog.deleteMany({});
    // console.log('🗑️  Cleared existing blog data');

    const blogs = [];

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      const title = row['Blog Topic'];
      const slug = slugify(title);
      const keywords = (row['Keywords'] || '').split('\n').map(k => k.trim()).filter(Boolean);
      const { metaTitle, metaDescription, content } = parseContent(row['Content']);
      const excerpt = extractExcerpt(content);
      const readTime = estimateReadTime(content);
      const publishedAt = new Date('2026-04-01');

      const blog = {
        blogId: `blog-${row['No.'] || (i + 1)}`,
        title,
        slug,
        category: row['Category'] || 'Blog',
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || excerpt,
        keywords,
        excerpt,
        content,
        coverImage: row['CoverImage'] || coverImages[i % coverImages.length],
        author: 'VytalYou Team',
        readTime,
        published: true,
        publishedAt,
        order: i + 1,
      };

      blogs.push(blog);
      console.log(`  📄 Prepared: "${title}" (${readTime} min read)`);
    }

    // Insert or update all blogs
    const result = [];
    for (const blogData of blogs) {
      const updated = await Blog.findOneAndUpdate(
        { slug: blogData.slug },
        blogData,
        { upsert: true, new: true }
      );
      result.push(updated);
    }
    console.log(`\n✅ Successfully migrated/upserted ${result.length} blogs to MongoDB!`);

    // Print summary
    console.log('\n📋 Blog Summary:');
    result.forEach((blog, i) => {
      console.log(`  ${i + 1}. ${blog.title}`);
      console.log(`     Slug: ${blog.slug}`);
      console.log(`     Read time: ${blog.readTime} min`);
      console.log(`     Keywords: ${blog.keywords.join(', ')}`);
      console.log('');
    });

  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

seedBlogs();
