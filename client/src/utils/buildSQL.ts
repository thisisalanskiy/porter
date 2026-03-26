import { QueryBuilderConfig, SemanticField } from '../types';

/**
 * Pure function that generates a SQL SELECT statement from a QueryBuilderConfig.
 * Optionally accepts a SemanticField array to resolve label→column mappings.
 */
export function buildSQL(
  config: QueryBuilderConfig,
  semanticFields: SemanticField[] = []
): string {
  if (!config.table) return '';

  // Resolve a field reference: may be a semantic label or a raw column name
  const resolveField = (fieldRef: string): string => {
    const semField = semanticFields.find(
      (sf) => sf.label === fieldRef || sf.id === fieldRef
    );
    if (semField) return `"${semField.tableName}"."${semField.columnName}"`;
    // Escape plain identifiers
    return `"${fieldRef.replace(/"/g, '""')}"`;
  };

  const table = `"${config.table.replace(/"/g, '""')}"`;

  // SELECT
  const selectClause =
    config.fields && config.fields.length > 0
      ? config.fields.map(resolveField).join(', ')
      : '*';

  let sql = `SELECT ${selectClause}\nFROM ${table}`;

  // WHERE
  if (config.filters && config.filters.length > 0) {
    const validFilters = config.filters.filter(
      (f) => f.field && f.operator && f.value !== undefined && f.value !== ''
    );
    if (validFilters.length > 0) {
      const whereClauses = validFilters.map((f) => {
        const col = resolveField(f.field);
        const op = f.operator.toUpperCase();
        switch (op) {
          case 'IS NULL':
          case 'IS NOT NULL':
            return `${col} ${op}`;
          case 'IN':
          case 'NOT IN': {
            const vals = f.value
              .split(',')
              .map((v) => `'${v.trim().replace(/'/g, "''")}'`)
              .join(', ');
            return `${col} ${op} (${vals})`;
          }
          case 'LIKE':
          case 'ILIKE':
          case 'NOT LIKE':
            return `${col} ${op} '${f.value.replace(/'/g, "''")}'`;
          default:
            // =, !=, <, >, <=, >=
            return `${col} ${op} '${f.value.replace(/'/g, "''")}'`;
        }
      });
      sql += `\nWHERE ${whereClauses.join(' AND ')}`;
    }
  }

  // ORDER BY
  if (config.orderBy) {
    const dir = config.orderDir === 'DESC' ? 'DESC' : 'ASC';
    sql += `\nORDER BY ${resolveField(config.orderBy)} ${dir}`;
  }

  // LIMIT
  if (config.limit && config.limit > 0) {
    sql += `\nLIMIT ${Math.floor(config.limit)}`;
  }

  return sql;
}
