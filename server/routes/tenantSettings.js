const { Router } = require('express');
const supabase = require('../config/supabase');
const authorize = require('../middleware/authorize');

const router = Router();

// GET / - Get current organization settings
router.get('/', authorize('settings.read'), async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', req.orgId)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Organization not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// PUT / - Update organization settings
router.put('/', authorize('settings.write'), async (req, res, next) => {
  try {
    const { id, slug, is_active, plan, created_at, ...updates } = req.body;

    const { data, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', req.orgId)
      .select()
      .single();

    if (error || !data) return res.status(404).json({ error: 'Organization not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
