const { Router } = require('express');
const supabase = require('../config/supabase');
const tenantQuery = require('../utils/tenantQuery');
const authorize = require('../middleware/authorize');

const router = Router();
const TABLE = 'photos';
const BUCKET = 'photos';
const PERM = 'photos';

// GET / - List all for tenant
router.get('/', authorize(`${PERM}.read`), async (req, res, next) => {
  try {
    const tq = tenantQuery(supabase, TABLE, req.orgId);
    const { data, error } = await tq.select();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /:id - Get one by id (tenant-scoped)
router.get('/:id', authorize(`${PERM}.read`), async (req, res, next) => {
  try {
    const tq = tenantQuery(supabase, TABLE, req.orgId);
    const { data, error } = await tq.selectOne(req.params.id);
    if (error || !data) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /:id/download - Generate signed URL or redirect to file
router.get('/:id/download', authorize(`${PERM}.read`), async (req, res, next) => {
  try {
    const tq = tenantQuery(supabase, TABLE, req.orgId);
    const { data, error } = await tq.selectOne(req.params.id);
    if (error || !data) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    if (!data.file_url) {
      return res.status(404).json({ error: 'No file attached to this photo' });
    }

    // Extract the storage path from the file_url
    const storagePath = extractStoragePath(data.file_url, BUCKET);
    if (!storagePath) {
      return res.redirect(data.file_url);
    }

    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 60 * 60); // 1 hour

    if (urlError) {
      return res.redirect(data.file_url);
    }

    res.json({ url: signedUrlData.signedUrl });
  } catch (err) {
    next(err);
  }
});

// POST / - Create (tenant-scoped)
router.post('/', authorize(`${PERM}.write`), async (req, res, next) => {
  try {
    const body = { ...req.body };
    delete body.org_id;

    const tq = tenantQuery(supabase, TABLE, req.orgId);
    const { data, error } = await tq.insert(body);
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// PUT /:id - Update (tenant-scoped)
router.put('/:id', authorize(`${PERM}.write`), async (req, res, next) => {
  try {
    const body = { ...req.body };
    delete body.org_id;
    delete body.id;

    const tq = tenantQuery(supabase, TABLE, req.orgId);
    const { data, error } = await tq.update(req.params.id, body);
    if (error || !data) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// DELETE /:id - Delete record and associated file from storage
router.delete('/:id', authorize(`${PERM}.delete`), async (req, res, next) => {
  try {
    const tq = tenantQuery(supabase, TABLE, req.orgId);

    // Fetch the record first to get file_url before deleting
    const { data: record } = await tq.selectOne(req.params.id);

    // Delete the database record
    const { error } = await tq.remove(req.params.id);
    if (error) throw error;

    // If a file was attached, remove it from Supabase storage
    if (record && record.file_url) {
      const storagePath = extractStoragePath(record.file_url, BUCKET);
      if (storagePath) {
        await supabase.storage.from(BUCKET).remove([storagePath]);
      }
    }

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

/**
 * Extracts the storage path from a Supabase URL.
 * Expects the path portion to contain: /object/{sign|public}/{bucket}/{org_id}/{filename}
 * Returns: "{org_id}/{filename}" or null if unparseable.
 */
function extractStoragePath(fileUrl, bucket) {
  try {
    const url = new URL(fileUrl);
    const segments = url.pathname.split('/');
    const bucketIdx = segments.indexOf(bucket);
    if (bucketIdx !== -1 && bucketIdx < segments.length - 1) {
      return segments.slice(bucketIdx + 1).join('/');
    }
    return null;
  } catch {
    return null;
  }
}

module.exports = router;
