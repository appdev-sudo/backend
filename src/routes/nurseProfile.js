/**
 * Nurse Profile & Document Upload Routes
 * POST   /api/nurse/register           — Complete nurse onboarding
 * GET    /api/nurse/profile             — Get nurse profile
 * PUT    /api/nurse/profile             — Update nurse profile
 * POST   /api/nurse/documents/upload    — Upload document (multer)
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const path = require('path');
const fs = require('fs');
const Nurse = require('../models/Nurse');
const nurseAuth = require('../middleware/nurseAuth');

// All routes require nurse authentication
router.use(nurseAuth);

// ── AWS S3 & Multer setup for document uploads ──────────────────────────────
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME || 'vytalyou-public-assets',
    // Remove acl if the bucket enforces Object Ownership = Bucket owner enforced
    // acl: 'public-read', 
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const safeName = `nurse-documents/${req.nurseId}_${Date.now()}${ext}`;
      cb(null, safeName);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf|webp/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    if (extOk || mimeOk) return cb(null, true);
    cb(new Error('Only images (jpg, png, webp) and PDFs are allowed.'));
  },
});

// ── POST /register — Complete onboarding ────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, age, sex, email, qualifications, specializations } = req.body;

    if (!name || !age) {
      return res.status(400).json({ error: 'Name and age are required.' });
    }
    if (age < 18) {
      return res.status(400).json({ error: 'Nurse must be at least 18 years old.' });
    }

    const nurse = req.nurse;
    nurse.name = name;
    nurse.age = age;
    nurse.sex = sex || nurse.sex;
    nurse.email = email || nurse.email;
    nurse.qualifications = qualifications || [];
    nurse.specializations = specializations || [];
    nurse.isOnboarded = true;

    await nurse.save();

    res.json({
      success: true,
      message: 'Registration completed successfully.',
      nurse: nurse.toProfile(),
    });
  } catch (error) {
    console.error('Nurse register error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// ── GET /profile — Fetch current nurse's profile ────────────────────────────
router.get('/profile', async (req, res) => {
  try {
    res.json({ success: true, nurse: req.nurse.toProfile() });
  } catch (error) {
    console.error('Get nurse profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PUT /profile — Update nurse profile ─────────────────────────────────────
router.put('/profile', async (req, res) => {
  try {
    const { name, age, sex, email, qualifications, specializations, location } = req.body;
    const nurse = req.nurse;

    if (name) nurse.name = name;
    if (age) nurse.age = age;
    if (sex) nurse.sex = sex;
    if (email) nurse.email = email;
    if (qualifications) nurse.qualifications = qualifications;
    if (specializations) nurse.specializations = specializations;
    if (location) nurse.location = location;

    await nurse.save();

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      nurse: nurse.toProfile(),
    });
  } catch (error) {
    console.error('Update nurse profile error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// ── POST /documents/upload — Upload a document ──────────────────────────────
router.post('/documents/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const { documentType } = req.body;
    const validTypes = ['qualification_certificate', 'photo_id', 'aadhaar', 'profile_picture'];
    if (!documentType || !validTypes.includes(documentType)) {
      return res.status(400).json({ error: `Invalid document type. Must be one of: ${validTypes.join(', ')}` });
    }

    // Build the file URL using the S3 location
    const fileUrl = req.file.location;

    const nurse = req.nurse;

    // Replace if same type already exists, otherwise push
    const existingIdx = nurse.documents.findIndex(d => d.type === documentType);
    const docEntry = {
      type: documentType,
      url: fileUrl,
      verified: false,
    };

    if (existingIdx >= 0) {
      nurse.documents[existingIdx] = docEntry;
    } else {
      nurse.documents.push(docEntry);
    }

    // If it's a profile picture, also set the profilePicture field
    if (documentType === 'profile_picture') {
      nurse.profilePicture = fileUrl;
    }

    await nurse.save();

    res.json({
      success: true,
      url: fileUrl,
      message: 'Document uploaded successfully.',
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ error: error.message || 'Upload failed.' });
  }
});

module.exports = router;
