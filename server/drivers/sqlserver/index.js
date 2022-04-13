const {
  id,
  name,
  fields,
  getSchema,
  runQuery,
  testConnection,
} = require('./core');
const { getDatabase, getABC } = require('./extension');

module.exports = {
  id,
  name,
  fields,
  getSchema,
  getDatabase,
  getABC,
  runQuery,
  testConnection,
};
