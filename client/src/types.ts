export interface DatabaseConnection {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl?: boolean;
}

export interface DatabaseSchema {
  [tableName: string]: {
    columns: Array<{
      column_name: string;
      data_type: string;
      is_nullable: string;
    }>;
    schema: string;
  };
}

export interface QueryColumn {
  name: string;
  dataTypeID: number;
  dataTypeSize: number;
  format: string;
}

export interface QueryResult {
  rows: any[];
  rowCount: number;
  fields: QueryColumn[];
}

export interface ReportElement {
  id: string;
  type: string;
  config: any;
  position: { x: number; y: number };
  data: any[];
  sql?: string;
  title?: string;
  width?: number;
  height?: number;
  columnSpan?: number; // Number of columns this element should span (1, 2, or 3)
  queryBuilderConfig?: QueryBuilderConfig;
}

export interface ComponentType {
  type: string;
  icon: React.ReactNode;
  label: string;
  description: string;
}

export interface ChartConfig {
  title: string;
  xAxisField: string;
  yAxisField: string;
  color?: string;
  width?: number;
  height?: number;
}

export interface TableConfig {
  title: string;
  columns: string[];
  limit?: number;
  orderBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

export interface MetricCardConfig {
  title?: string;
  prefix?: string;
  suffix?: string;
  valueField?: string;
  fontSize?: string;
  color?: string;
}

export interface SemanticField {
  id: string;
  label: string;
  tableName: string;
  columnName: string;
  dataType: string;
  description?: string;
}

export interface SemanticLayer {
  fields: SemanticField[];
}

export interface QueryBuilderConfig {
  table?: string;
  fields?: string[];
  filters?: Array<{ field: string; operator: string; value: string }>;
  orderBy?: string;
  orderDir?: 'ASC' | 'DESC';
  limit?: number;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  elements: Omit<ReportElement, 'id'>[];
}

