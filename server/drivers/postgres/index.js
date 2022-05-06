const {
  id,
  name,
  fields,
  getSchema,
  runQuery,
  testConnection,
} = require('./core');
const { getDatabase, getDbInformation } = require('./extension');

module.exports = {
  id,
  name,
  fields,
  getSchema,
  getDatabase,
  getDbInformation,
  runQuery,
  testConnection,
};
