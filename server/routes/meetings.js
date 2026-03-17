const crudRouter = require('../utils/crudRouter');

module.exports = crudRouter('meetings', { permission: 'meetings' });
