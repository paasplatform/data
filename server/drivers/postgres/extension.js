const { formatSchemaQueryResults } = require('../sqlserver/utils');
const { runQuery } = require('./core');

const DATABASE_SQL = `  
  SELECT pg_database.datname as name, pg_database_size(pg_database.datname)/1024/1024 AS size 
  FROM pg_database 
  WHERE pg_database.datname not in('template1','template0','postgres')
  order by pg_database.datname;
`;

// same as MSSql
const INFORMATION_SCHEMA_SQL = `
  SELECT 
    'INFORMATION_SCHEMA' as __result__type,
    t.table_schema, 
    t.table_name, 
    c.column_name, 
    c.data_type
  FROM 
  INFORMATION_SCHEMA.TABLES t 
    JOIN INFORMATION_SCHEMA.COLUMNS c ON t.table_schema = c.table_schema AND t.table_name = c.table_name 
  WHERE 
    t.table_schema NOT IN ('information_schema') AND t.table_schema not like 'pg_%'
  ORDER BY 
    t.table_schema, 
    t.table_name, 
    c.ordinal_position;
`;

// same as MSSql
const INFORMATION_CONSTRAINTS_SQL = `
  SELECT 
    'INFORMATION_CONSTRAINTS' as __result__type,
    tc.constraint_catalog,
    tc.constraint_schema,
    tc.constraint_name,
    tc.constraint_type, 
    tc.is_deferrable,
    tc.initially_deferred,
    ccu.column_name 
  FROM INFORMATION_SCHEMA.TABLES t
  INNER JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc 
	  ON t.TABLE_NAME = tc.TABLE_NAME AND t.TABLE_SCHEMA = tc.CONSTRAINT_SCHEMA 
  INNER JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE ccu 
	  ON ccu.TABLE_NAME = t.TABLE_NAME AND t.TABLE_SCHEMA = ccu.CONSTRAINT_SCHEMA  AND ccu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
    WHERE tc.constraint_schema NOT LIKE 'pg_%';
`;

// same as MSSql
const INFORMATION_REFERENTIAL_CONSTRAINTS_SQL = `
  SELECT 'INFORMATION_REFERENTIAL_CONSTRAINTS' as __result__type, * FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS;
`;

const INFORMATION_INDEXES_SQL = `
  select
    'INFORMATION_INDEXES' as __result__type,
    i.relname as index_name,
    ns.nspname as table_schema,
    t.relname as table_name,
    a.attname as column_name,
    ix.indisprimary as is_primary_key,
    ix.indisunique as is_unique
  from
    pg_class t,
    pg_class i,
    pg_index ix,
    pg_attribute a,
    pg_namespace ns
  where
    t.oid = ix.indrelid
    and i.oid = ix.indexrelid
    and a.attrelid = t.oid
    and a.attnum = ANY(ix.indkey)
    and ns.oid = t.relnamespace
    and ns.nspname not like 'pg_%'
  order by
    ns.nspname,
    i.relname;
`;

/**
 * Get schema for connection
 * @param {*} connection
 */
function getDbInformation(connection) {
  const schema = runQuery(`${INFORMATION_SCHEMA_SQL}`, connection);
  const constraint = runQuery(`${INFORMATION_CONSTRAINTS_SQL}`, connection);
  const referential = runQuery(`${INFORMATION_REFERENTIAL_CONSTRAINTS_SQL}`, connection);
  const indexes = runQuery(`${INFORMATION_INDEXES_SQL}`, connection);
  
  return Promise.all([schema, constraint, referential, indexes]).then((results) => {
    return formatSchemaQueryResults(results.reduce((sum, current)=> {
      Object.assign(sum, {rows:sum.rows.concat(current.rows)}) 
      return sum;
    },{rows:[]}));
  });
}

/**
 * Get databases for connection
 * @param {*} connection
 */
function getDatabase(connection) {
  return runQuery(DATABASE_SQL, connection).then((queryResult) => {
    return queryResult;
  });
}

module.exports = {
  getDbInformation,
  getDatabase,
};
