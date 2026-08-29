require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const Nurse = require('../models/Nurse');
const connectDB = require('../config/db');

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const getContentType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.png': return 'image/png';
    case '.webp': return 'image/webp';
    case '.pdf': return 'application/pdf';
    default: return 'application/octet-stream';
  }
};

const migrateToS3 = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();

    const uploadsDir = path.join(__dirname, '../../uploads/nurse-documents');
    if (!fs.existsSync(uploadsDir)) {
      console.log('No local uploads directory found. Exiting.');
      process.exit(0);
    }

    const files = fs.readdirSync(uploadsDir);
    const bucketName = process.env.AWS_BUCKET_NAME || 'vytalyou-public-assets';
    
    console.log(`Found ${files.length} local files. Starting migration...`);

    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      const s3Key = `nurse-documents/${file}`;
      
      const fileStream = fs.createReadStream(filePath);
      
      console.log(`Uploading ${file} to S3...`);
      
      const uploadParams = {
        Bucket: bucketName,
        Key: s3Key,
        Body: fileStream,
        ContentType: getContentType(file),
      };

      await s3.send(new PutObjectCommand(uploadParams));
      
      const s3Url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
      
      // Update any Nurse document in Mongo that currently references this local file
      const localUrlStr = `/uploads/nurse-documents/${file}`;
      
      // 1. Update the subdocument array for documents
      const nursesToUpdate = await Nurse.find({ 'documents.url': localUrlStr });
      
      for (const nurse of nursesToUpdate) {
        nurse.documents.forEach(doc => {
          if (doc.url === localUrlStr) {
            doc.url = s3Url;
          }
        });
        
        // 2. Also check profilePicture
        if (nurse.profilePicture === localUrlStr) {
          nurse.profilePicture = s3Url;
        }
        
        await nurse.save();
        console.log(`Updated DB references for Nurse: ${nurse.nurseId}`);
      }
    }
    
    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

migrateToS3();
