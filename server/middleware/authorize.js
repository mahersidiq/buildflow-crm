/**
 * Role-based authorization middleware.
 *
 * Built-in role hierarchy: owner > admin > member > viewer
 * Each role inherits all permissions of lower roles.
 *
 * Usage:
 *   router.post('/', authorize('projects.write'), createProject);
 *   router.delete('/:id', authorize('projects.delete'), deleteProject);
 */

const ROLE_PERMISSIONS = {
  viewer: [
    'projects.read', 'contacts.read', 'estimates.read', 'invoices.read',
    'budget.read', 'change_orders.read', 'daily_logs.read', 'bid_packages.read',
    'documents.read', 'photos.read', 'rfis.read', 'punch_list.read',
    'purchase_orders.read', 'meetings.read', 'settings.read',
  ],
  member: [
    'projects.write', 'contacts.write', 'estimates.write', 'invoices.write',
    'budget.write', 'change_orders.write', 'daily_logs.write', 'bid_packages.write',
    'documents.write', 'photos.write', 'rfis.write', 'punch_list.write',
    'purchase_orders.write', 'meetings.write',
  ],
  admin: [
    'projects.delete', 'contacts.delete', 'estimates.delete', 'invoices.delete',
    'budget.delete', 'change_orders.delete', 'daily_logs.delete', 'bid_packages.delete',
    'documents.delete', 'photos.delete', 'rfis.delete', 'punch_list.delete',
    'purchase_orders.delete', 'meetings.delete',
    'users.read', 'users.invite', 'users.manage', 'settings.write',
  ],
  owner: [
    'org.manage', 'org.delete', 'billing.manage',
  ],
};

// Build cumulative permission sets (each role includes all lower role permissions)
const ROLE_HIERARCHY = ['viewer', 'member', 'admin', 'owner'];
const CUMULATIVE_PERMISSIONS = {};
let accumulated = [];
for (const role of ROLE_HIERARCHY) {
  accumulated = [...accumulated, ...ROLE_PERMISSIONS[role]];
  CUMULATIVE_PERMISSIONS[role] = new Set(accumulated);
}

function authorize(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userPerms = CUMULATIVE_PERMISSIONS[req.user.role];
    if (!userPerms || !userPerms.has(permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

module.exports = authorize;
