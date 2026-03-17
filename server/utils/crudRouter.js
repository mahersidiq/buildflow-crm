const { Router } = require('express');
const supabase = require('../config/supabase');
const tenantQuery = require('./tenantQuery');
const authorize = require('../middleware/authorize');

/**
 * Creates a standard CRUD router for a tenant-scoped entity.
 *
 * @param {string} table - The Supabase table name
 * @param {object} options
 * @param {string} options.permission - Permission prefix (e.g., 'projects')
 * @param {import('zod').ZodSchema} [options.createSchema] - Zod schema for create validation
 * @param {import('zod').ZodSchema} [options.updateSchema] - Zod schema for update validation
 * @param {string} [options.selectColumns] - Columns to select (default '*')
 * @param {Function} [options.beforeCreate] - Hook to transform data before insert
 * @param {Function} [options.afterList] - Hook to transform list results
 */
function crudRouter(table, options = {}) {
  const router = Router();
  const perm = options.permission || table;
  const selectColumns = options.selectColumns || '*';

  // GET / - List all for tenant
  router.get('/', authorize(`${perm}.read`), async (req, res, next) => {
    try {
      const tq = tenantQuery(supabase, table, req.orgId);
      const { data, error } = await tq.select(selectColumns);
      if (error) throw error;

      const result = options.afterList ? options.afterList(data) : data;
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // GET /:id - Get one by id (tenant-scoped)
  router.get('/:id', authorize(`${perm}.read`), async (req, res, next) => {
    try {
      const tq = tenantQuery(supabase, table, req.orgId);
      const { data, error } = await tq.selectOne(req.params.id, selectColumns);
      if (error || !data) {
        return res.status(404).json({ error: 'Not found' });
      }
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  // POST / - Create (tenant-scoped)
  router.post('/', authorize(`${perm}.write`), async (req, res, next) => {
    try {
      let body = req.body;
      if (options.createSchema) {
        body = options.createSchema.parse(body);
      }
      // Strip org_id from body — always injected from JWT
      delete body.org_id;

      if (options.beforeCreate) {
        body = options.beforeCreate(body, req);
      }

      const tq = tenantQuery(supabase, table, req.orgId);
      const { data, error } = await tq.insert(body);
      if (error) throw error;
      res.status(201).json(data);
    } catch (err) {
      next(err);
    }
  });

  // PUT /:id - Update (tenant-scoped, double filter)
  router.put('/:id', authorize(`${perm}.write`), async (req, res, next) => {
    try {
      let body = req.body;
      if (options.updateSchema) {
        body = options.updateSchema.parse(body);
      }
      // Strip org_id and id from body
      delete body.org_id;
      delete body.id;

      const tq = tenantQuery(supabase, table, req.orgId);
      const { data, error } = await tq.update(req.params.id, body);
      if (error || !data) {
        return res.status(404).json({ error: 'Not found' });
      }
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  // DELETE /:id - Delete (tenant-scoped, double filter)
  router.delete('/:id', authorize(`${perm}.delete`), async (req, res, next) => {
    try {
      const tq = tenantQuery(supabase, table, req.orgId);
      const { error } = await tq.remove(req.params.id);
      if (error) throw error;
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = crudRouter;
