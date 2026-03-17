const { Router } = require('express');
const supabase = require('../config/supabase');
const tenantQuery = require('../utils/tenantQuery');
const authorize = require('../middleware/authorize');

const router = Router();

// GET / - List bid packages with bids
router.get('/', authorize('bid_packages.read'), async (req, res, next) => {
  try {
    const tq = tenantQuery(supabase, 'bid_packages', req.orgId);
    const { data, error } = await tq.select('*, bids(*)');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /:id
router.get('/:id', authorize('bid_packages.read'), async (req, res, next) => {
  try {
    const tq = tenantQuery(supabase, 'bid_packages', req.orgId);
    const { data, error } = await tq.selectOne(req.params.id, '*, bids(*)');
    if (error || !data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /
router.post('/', authorize('bid_packages.write'), async (req, res, next) => {
  try {
    delete req.body.org_id;
    const tq = tenantQuery(supabase, 'bid_packages', req.orgId);
    const { data, error } = await tq.insert(req.body);
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// PUT /:id
router.put('/:id', authorize('bid_packages.write'), async (req, res, next) => {
  try {
    delete req.body.org_id;
    delete req.body.id;
    const tq = tenantQuery(supabase, 'bid_packages', req.orgId);
    const { data, error } = await tq.update(req.params.id, req.body);
    if (error || !data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// DELETE /:id
router.delete('/:id', authorize('bid_packages.delete'), async (req, res, next) => {
  try {
    const tq = tenantQuery(supabase, 'bid_packages', req.orgId);
    const { error } = await tq.remove(req.params.id);
    if (error) throw error;
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// --- Bids sub-routes ---

// POST /:packageId/bids
router.post('/:packageId/bids', authorize('bid_packages.write'), async (req, res, next) => {
  try {
    const body = { ...req.body, package_id: req.params.packageId };
    delete body.org_id;
    const tq = tenantQuery(supabase, 'bids', req.orgId);
    const { data, error } = await tq.insert(body);
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// PUT /bids/:id
router.put('/bids/:id', authorize('bid_packages.write'), async (req, res, next) => {
  try {
    delete req.body.org_id;
    delete req.body.id;
    const tq = tenantQuery(supabase, 'bids', req.orgId);
    const { data, error } = await tq.update(req.params.id, req.body);
    if (error || !data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// DELETE /bids/:id
router.delete('/bids/:id', authorize('bid_packages.delete'), async (req, res, next) => {
  try {
    const tq = tenantQuery(supabase, 'bids', req.orgId);
    const { error } = await tq.remove(req.params.id);
    if (error) throw error;
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
