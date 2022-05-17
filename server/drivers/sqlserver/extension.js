const { formatSchemaQueryResults } = require('./utils');
const { runQuery } = require('./core');

const DATABASE_SQL = `  
  DECLARE @AllTables table (db_name varchar(255), db_size int, remarks text) 
  INSERT @AllTables 
  EXEC sp_databases
  SELECT a.db_size as size, d.name ,d.database_id, d.create_date as id FROM @AllTables a  INNER JOIN sys.databases d ON a.db_name = d.name 
  WHERE db_name NOT IN ('master', 'model', 'tempdb', 'msdb')
`;

const INFORMATION_SCHEMA_SQL = `
  SELECT 
    'INFORMATION_SCHEMA' as __result__type,
    t.table_schema, 
    t.table_name, 
    c.column_name, 
    c.data_type,
    c.ordinal_position,
    c.character_maximum_length,
    c.numeric_precision,
    c.numeric_scale,
    c.is_nullable
  FROM 
    INFORMATION_SCHEMA.TABLES t 
    JOIN INFORMATION_SCHEMA.COLUMNS c ON t.table_schema = c.table_schema AND t.table_name = c.table_name 
  WHERE 
    t.table_schema NOT IN ('information_schema') 
  ORDER BY 
    t.table_schema, 
    t.table_name, 
    c.ordinal_position
`;

/* const INFORMATION_CONSTRAINTS_SQL = `
  SELECT 
    'INFORMATION_CONSTRAINTS' as __result__type,
    tc.constraint_catalog,
    tc.constraint_schema,
    tc.TABLE_NAME  as constraint_table,
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
`; */

const INFORMATION_CONSTRAINTS_SQL = `
  SELECT
    'INFORMATION_CONSTRAINTS' as __result__type,
    tc.table_schema, 
    tc.constraint_name, 
    tc.table_name, 
    tc.constraint_type,
    kcu.column_name, 
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
  FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
`;

/* const INFORMATION_REFERENTIAL_CONSTRAINTS_SQL = `
  SELECT 'INFORMATION_REFERENTIAL_CONSTRAINTS' as __result__type, * FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
`; */

const INFORMATION_INDEXES_SQL = `
  SELECT
    'INFORMATION_INDEXES' as __result__type,
    a.name AS index_name,
    a.type_desc  As index_type,
    OBJECT_SCHEMA_NAME(a.object_id) As table_schema,
    OBJECT_NAME(a.object_id) As table_name,
    COL_NAME(b.object_id,b.column_id) AS column_name,
    a.is_primary_key as is_primary_key,
    a.is_unique as is_unique,
    a.is_unique_constraint as is_unique_constraint,
    b.index_column_id,
    b.key_ordinal,
    b.is_included_column
  FROM
 	  sys.indexes AS a
  INNER JOIN sys.index_columns AS b ON a.object_id = b.object_id AND a.index_id = b.index_id
  WHERE
    a.is_hypothetical = 0 AND
    a.index_id != 0 AND
    a.object_id in (
      SELECT 
          OBJECT_ID(TABLE_SCHEMA+'.'+TABLE_NAME)
      FROM INFORMATION_SCHEMA.TABLES
    )
`;

/**
 * Get schema for connection
 * @param {*} connection
 */
function getDbInformation(connection) {
  return runQuery(
    `${INFORMATION_SCHEMA_SQL}${INFORMATION_CONSTRAINTS_SQL}${INFORMATION_INDEXES_SQL}`,
    connection
  ).then((queryResult) => {
    return formatSchemaQueryResults(queryResult);
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
