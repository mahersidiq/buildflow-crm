const crudRouter = require('../utils/crudRouter');

module.exports = crudRouter('purchase_orders', { permission: 'purchase_orders' });
