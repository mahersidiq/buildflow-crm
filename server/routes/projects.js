const crudRouter = require('../utils/crudRouter');

module.exports = crudRouter('projects', {
  permission: 'projects',
  allowedColumns: [
    'name', 'client', 'value', 'status', 'type',
    'address', 'start', 'end', 'notes', 'spent', 'progress',
  ],
});
