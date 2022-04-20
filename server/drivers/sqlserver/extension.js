const { formatSchemaQueryResults } = require('./utils');
const { runQuery } = require('./core');

const DATABASE_SQL = `  
  DECLARE @AllTables table (db_name varchar(255), db_size int, remarks text) 
  INSERT @AllTables 
  EXEC sp_databases
  SELECT a.db_size as size, d.name ,d.database_id,d.create_date  as id FROM @AllTables a  INNER JOIN sys.databases d ON a.db_name = d.name 
  WHERE db_name NOT IN ('master', 'model', 'tempdb', 'msdb')
`;

const INFORMATION_SCHEMA_SQL = `
  SELECT 
    'INFORMATION_SCHEMA' as __RESULT__TYPE,
    t.table_schema, 
    t.table_name, 
    c.column_name, 
    c.data_type
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

const INFORMATION_CONSTRAINTS_SQL = `
  SELECT 
    'INFORMATION_CONSTRAINTS' as __RESULT__TYPE,
    tc.CONSTRAINT_CATALOG,
    tc.CONSTRAINT_SCHEMA,
    tc.CONSTRAINT_NAME,
    tc.CONSTRAINT_TYPE, 
    tc.IS_DEFERRABLE,
    tc.INITIALLY_DEFERRED,
    ccu.COLUMN_NAME 
  FROM INFORMATION_SCHEMA.TABLES t
  INNER JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc 
	  ON t.TABLE_NAME = tc.TABLE_NAME AND t.TABLE_SCHEMA = tc.CONSTRAINT_SCHEMA 
  INNER JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE ccu 
	  ON ccu.TABLE_NAME = t.TABLE_NAME AND t.TABLE_SCHEMA = ccu.CONSTRAINT_SCHEMA  AND ccu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME 
`;

const INFORMATION_REFERENTIAL_CONSTRAINTS_SQL = `
  SELECT 'INFORMATION_REFERENTIAL_CONSTRAINTS' as __RESULT__TYPE, * FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
`;

const INFORMATION_INDEXES_SQL = `
  SELECT
    'INFORMATION_INDEXES' as __RESULT__TYPE,
    a.name AS indexName,
    a.type_desc  As indexType,
    OBJECT_SCHEMA_NAME(a.object_id) As schamaName,
    OBJECT_NAME(a.object_id) As tableName,
    COL_NAME(b.object_id,b.column_id) AS columnName,
    a.is_primary_key as isPrimaryKey,
    a.is_unique as isUnique,
    a.is_unique_constraint as isUniqueConstraint,
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
function getABC(connection) {
  return runQuery(
    `${INFORMATION_SCHEMA_SQL}${INFORMATION_CONSTRAINTS_SQL}${INFORMATION_REFERENTIAL_CONSTRAINTS_SQL}${INFORMATION_INDEXES_SQL}`,
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
  getABC,
  getDatabase,
};
