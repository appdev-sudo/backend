require('dotenv').config();
const mongoose = require('mongoose');
const Blog = require('./src/models/Blog');

async function updateImages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const imageMap = {
      'hidden-cost-of-monsoon-inflammation-iv-therapy': 'assets/blog/covers/The Hidden Cost of Monsoon Inflammation and the IV Protocol That Addresses It .png',
      'what-happens-inside-your-cells-during-an-iv-drip': 'assets/blog/covers/What Happens Inside Your Cells During an IV Drip_ A Doctor\'s Explanation.png',
      'monsoon-blood-tests-cholesterol-vitamin-d-thyroid-mumbai': 'assets/blog/covers/Is Your Cholesterol, Vitamin D or Thyroid Off_ The Monsoon Blood Tests Worth Getting Now.png',
      'magnesium-zinc-nutrient-deficiencies-india-food-isnt-enough': 'assets/blog/covers/Magnesium, Zinc & the Nutrients Indians Are Almost Always Deficient In, and Why Food Isn\'t Enough.png',
      'how-early-can-cancer-be-detected': 'assets/blog/covers/How Early Can Cancer Be Detected_.png',
      'why-insulin-resistance-can-exist-even-when-your-sugar-levels-are-normal': 'assets/blog/covers/Why Insulin Resistance Can Exist Even When Your Sugar Levels Are Normal.png',
      'why-you-feel-exhausted-even-after-sleeping-8-hours': 'assets/blog/covers/Why You Feel Exhausted Even After Sleeping 8 Hours- Could Wellness IV Therapy Help.png'
    };

    for (const [slug, coverImage] of Object.entries(imageMap)) {
      const result = await Blog.updateOne({ slug }, { $set: { coverImage } });
      console.log(`Updated ${slug}: ${result.modifiedCount} document(s) modified`);
    }

  } catch (err) {
    console.error('❌ Update failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

updateImages();
