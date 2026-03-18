const crudRouter = require('../utils/crudRouter');

module.exports = crudRouter('budget_items', { permission: 'budget' });
