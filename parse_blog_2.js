const fs = require('fs');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Blog = require('./src/models/Blog');
require('dotenv').config();

const rawText = fs.readFileSync('raw_request_2.txt', 'utf8');
const blogsData = JSON.parse(fs.readFileSync('blogs_dump.json', 'utf8'));

// Split the raw text by "Blog URL Structure:"
// For a single file with one blog starting with Blog URL Structure:
const block = rawText.replace('Blog URL Structure: ', '').trim();

function htmlEscape(str) {
    return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const slugMatch = block.match(/https:\/\/vytalyou\.com\/blog\/([^\s]+)/);
const slug = slugMatch ? slugMatch[1].trim() : `blog-${blogsData.length + 1}`;

const metaTitleMatch = block.match(/Meta Title:\s*(.+)/);
const metaTitle = metaTitleMatch ? metaTitleMatch[1].trim() : '';

const metaDescMatch = block.match(/Meta Description:\s*(.+)/);
const metaDesc = metaDescMatch ? metaDescMatch[1].trim() : '';

const contentStartMatch = block.match(/Blog Banner Image: Link\s*/);
let rawContent = '';
if (contentStartMatch) {
    rawContent = block.substring(contentStartMatch.index + contentStartMatch[0].length).trim();
}

let htmlContent = '';
let title = '';
let keywords = [];

const lines = rawContent.split(/\r?\n/);

for (let j = 0; j < lines.length; j++) {
    let line = lines[j].trim();
    if (!line) continue;
    
    if (line.startsWith('H1:')) {
        title = line.replace('H1:', '').trim();
        htmlContent += `<h1>${htmlEscape(title)}</h1>\n`;
        keywords = title.split(' ').filter(w => w.length > 4).slice(0, 4).map(w => w.toLowerCase().replace(/[^a-z0-9]/g, ''));
    } 
    else if (line.startsWith('H2:')) {
        htmlContent += `<h2>${htmlEscape(line.replace('H2:', '').trim())}</h2>\n`;
    }
    else if (line.startsWith('H3:')) {
        htmlContent += `<h3>${htmlEscape(line.replace('H3:', '').trim())}</h3>\n`;
    }
    else {
        htmlContent += `<p>${htmlEscape(line)}</p>\n`;
    }
}

const excerpt = rawContent.substring(0, 150).replace(/H1:|H2:|H3:/g, '').trim() + '...';

const newBlog = {
    "_id": crypto.randomBytes(12).toString('hex'),
    "blogId": `blog-${blogsData.length + 1}`,
    "title": title || metaTitle,
    "slug": slug,
    "category": "Blog",
    "metaTitle": metaTitle,
    "metaDescription": metaDesc,
    "keywords": keywords,
    "excerpt": excerpt,
    "content": htmlContent,
    "coverImage": `assets/blog/covers/Body composition analysis for better health.png`,
    "author": "VytalYou Team",
    "readTime": 5,
    "published": true,
    "publishedAt": new Date().toISOString(),
    "order": blogsData.length + 1,
    "__v": 0,
    "createdAt": new Date().toISOString(),
    "updatedAt": new Date().toISOString()
};

blogsData.push(newBlog);
console.log('Added blog:', newBlog.title);
fs.writeFileSync('blogs_dump.json', JSON.stringify(blogsData, null, 2));
console.log('Saved to dump.');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const { _id, ...updateData } = newBlog;
    await Blog.findOneAndUpdate({ slug }, updateData, { upsert: true });
    console.log('Saved to MongoDB.');
    await mongoose.disconnect();
}
run();
