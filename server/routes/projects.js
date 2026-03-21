const crudRouter = require('../utils/crudRouter');

module.exports = crudRouter('projects', {
  permission: 'projects',
  allowedColumns: [
    'name', 'client', 'value', 'status', 'phase', 'type',
    'address', 'start', 'end', 'notes', 'spent', 'progress',
  ],
});
