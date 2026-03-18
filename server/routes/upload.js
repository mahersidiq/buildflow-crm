const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const supabase = require('../config/supabase');

const router = Router();

// --- Multer config (memory storage for serverless compatibility) ---
const ALLOWED_EXTENSIONS = new Set([
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt',
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.heic',
]);

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(new Error(`File type '${ext}' is not allowed. Accepted: ${[...ALLOWED_EXTENSIONS].join(', ')}`));
    }
    cb(null, true);
  },
});

// --- Allowed storage buckets ---
const ALLOWED_BUCKETS = new Set(['documents', 'photos']);

// POST /api/upload/:bucket
router.post('/:bucket', upload.single('file'), async (req, res, next) => {
  try {
    const { bucket } = req.params;

    if (!ALLOWED_BUCKETS.has(bucket)) {
      return res.status(400).json({ error: `Invalid bucket '${bucket}'. Allowed: ${[...ALLOWED_BUCKETS].join(', ')}` });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const orgId = req.orgId;
    const filePath = `${orgId}/${req.file.originalname}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      return res.status(500).json({ error: `Upload failed: ${uploadError.message}` });
    }

    // Return the public URL (buckets are public, signed URLs expire)
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    res.json({ url: publicUrlData.publicUrl });
  } catch (err) {
    next(err);
  }
});

// Handle multer errors with meaningful messages
router.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err.message && err.message.includes('File type')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;
