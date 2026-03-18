const { Router } = require('express');
const supabase = require('../config/supabase');
const tenantQuery = require('../utils/tenantQuery');
const authorize = require('../middleware/authorize');

const router = Router();

// GET / - List estimates with line items
router.get('/', authorize('estimates.read'), async (req, res, next) => {
  try {
    const tq = tenantQuery(supabase, 'estimates', req.orgId);
    const { data: estimates, error } = await tq.select('*, estimate_line_items(*)');
    if (error) throw error;
    res.json(estimates);
  } catch (err) {
    next(err);
  }
});

// GET /:id
router.get('/:id', authorize('estimates.read'), async (req, res, next) => {
  try {
    const tq = tenantQuery(supabase, 'estimates', req.orgId);
    const { data, error } = await tq.selectOne(req.params.id, '*, estimate_line_items(*)');
    if (error || !data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST / - Create estimate (optionally with line items)
router.post('/', authorize('estimates.write'), async (req, res, next) => {
  try {
    const { lineItems, ...estimateData } = req.body;
    delete estimateData.org_id;

    const tq = tenantQuery(supabase, 'estimates', req.orgId);
    const { data: estimate, error } = await tq.insert(estimateData);
    if (error) throw error;

    if (lineItems && lineItems.length > 0) {
      const liTq = tenantQuery(supabase, 'estimate_line_items', req.orgId);
      for (const li of lineItems) {
        delete li.org_id;
        await liTq.insert({ ...li, estimate_id: estimate.id });
      }
    }

    // Re-fetch with line items
    const { data: full } = await tq.selectOne(estimate.id, '*, estimate_line_items(*)');
    res.status(201).json(full);
  } catch (err) {
    next(err);
  }
});

// PUT /:id
router.put('/:id', authorize('estimates.write'), async (req, res, next) => {
  try {
    const { lineItems, ...estimateData } = req.body;
    delete estimateData.org_id;
    delete estimateData.id;

    const tq = tenantQuery(supabase, 'estimates', req.orgId);
    const { data, error } = await tq.update(req.params.id, estimateData);
    if (error || !data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// DELETE /:id
router.delete('/:id', authorize('estimates.delete'), async (req, res, next) => {
  try {
    const tq = tenantQuery(supabase, 'estimates', req.orgId);
    const { error } = await tq.remove(req.params.id);
    if (error) throw error;
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// --- Estimate Line Items sub-routes ---

// POST /:estimateId/line-items
router.post('/:estimateId/line-items', authorize('estimates.write'), async (req, res, next) => {
  try {
    const body = { ...req.body, estimate_id: req.params.estimateId };
    delete body.org_id;

    const tq = tenantQuery(supabase, 'estimate_line_items', req.orgId);
    const { data, error } = await tq.insert(body);
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// PUT /line-items/:id
router.put('/line-items/:id', authorize('estimates.write'), async (req, res, next) => {
  try {
    delete req.body.org_id;
    delete req.body.id;

    const tq = tenantQuery(supabase, 'estimate_line_items', req.orgId);
    const { data, error } = await tq.update(req.params.id, req.body);
    if (error || !data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// DELETE /line-items/:id
router.delete('/line-items/:id', authorize('estimates.delete'), async (req, res, next) => {
  try {
    const tq = tenantQuery(supabase, 'estimate_line_items', req.orgId);
    const { error } = await tq.remove(req.params.id);
    if (error) throw error;
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
