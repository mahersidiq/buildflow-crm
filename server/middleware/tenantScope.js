/**
 * Tenant scoping middleware.
 * Must run AFTER authenticate middleware.
 *
 * 1. Reads org_id from the authenticated user's JWT payload
 * 2. Attaches req.orgId for convenient access in route handlers
 * 3. Sets the PostgreSQL session variable 'app.current_org_id' for RLS policies
 */
const supabase = require('../config/supabase');

function tenantScope(req, res, next) {
  if (!req.user || !req.user.orgId) {
    return res.status(403).json({ error: 'No organization context' });
  }

  req.orgId = req.user.orgId;

  // Set PostgreSQL session variable for RLS defense-in-depth.
  // The RLS policies check: org_id::text = current_setting('app.current_org_id', true)
  supabase.rpc('set_config', {
    setting: 'app.current_org_id',
    value: req.orgId,
  }).then(() => next())
    .catch(next);
}

module.exports = tenantScope;
