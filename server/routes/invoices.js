const crudRouter = require('../utils/crudRouter');

module.exports = crudRouter('invoices', { permission: 'invoices' });
