require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const Blog = require('./src/models/Blog');

async function seedFromDump() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const blogsData = JSON.parse(fs.readFileSync('blogs_dump.json', 'utf8'));
    console.log(`📖 Found ${blogsData.length} blogs in dump file`);

    let updatedCount = 0;
    for (const blogData of blogsData) {
      // Remove _id to avoid casting errors if it is just a random string
      const { _id, ...updateData } = blogData;
      
      await Blog.findOneAndUpdate(
        { slug: blogData.slug },
        updateData,
        { upsert: true, new: true }
      );
      updatedCount++;
    }
    
    console.log(`✅ Successfully inserted/updated ${updatedCount} blogs in MongoDB!`);
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

seedFromDump();
