const crudRouter = require('../utils/crudRouter');

module.exports = crudRouter('contacts', { permission: 'contacts' });
