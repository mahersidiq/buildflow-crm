const crudRouter = require('../utils/crudRouter');

module.exports = crudRouter('photos', { permission: 'photos' });
