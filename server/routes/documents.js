const crudRouter = require('../utils/crudRouter');

module.exports = crudRouter('documents', { permission: 'documents' });
