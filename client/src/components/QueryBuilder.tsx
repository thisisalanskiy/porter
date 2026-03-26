import React, { useEffect, useState } from 'react';
import { Select, Button, Space, Input, InputNumber, Typography, Divider, Row, Col } from 'antd';
import { QueryBuilderConfig, DatabaseSchema } from '../types';
import { useSemanticLayer } from '../contexts/SemanticContext';
import { useTheme } from '../contexts/ThemeContext';
import { buildSQL } from '../utils/buildSQL';

const { Text } = Typography;

interface Filter {
  field: string;
  operator: string;
  value: string;
}

const OPERATORS = [
  { label: '= equals', value: '=' },
  { label: '!= not equals', value: '!=' },
  { label: '> greater', value: '>' },
  { label: '>= greater or equal', value: '>=' },
  { label: '< less', value: '<' },
  { label: '<= less or equal', value: '<=' },
  { label: 'LIKE', value: 'LIKE' },
  { label: 'ILIKE', value: 'ILIKE' },
  { label: 'IN', value: 'IN' },
  { label: 'NOT IN', value: 'NOT IN' },
  { label: 'IS NULL', value: 'IS NULL' },
  { label: 'IS NOT NULL', value: 'IS NOT NULL' },
];

interface Props {
  schema: DatabaseSchema | null;
  config: QueryBuilderConfig;
  onChange: (config: QueryBuilderConfig) => void;
}

const QueryBuilder: React.FC<Props> = ({ schema, config, onChange }) => {
  const { semanticLayer } = useSemanticLayer();
  const { tokens } = useTheme();
  const [filters, setFilters] = useState<Filter[]>(config.filters || []);

  const tableOptions = schema ? Object.keys(schema) : [];

  const columnOptions =
    config.table && schema && schema[config.table]
      ? schema[config.table].columns.map((col) => ({
          value: col.column_name,
          label: `${col.column_name} (${col.data_type})`,
        }))
      : [];

  // Also include semantic labels as field options
  const semanticOptions = semanticLayer.fields.map((sf) => ({
    value: sf.label,
    label: `${sf.label} → ${sf.tableName}.${sf.columnName}`,
  }));

  const allFieldOptions = [...columnOptions, ...(semanticOptions.length > 0 ? semanticOptions : [])];

  // When table changes, clear field selections
  const handleTableChange = (table: string) => {
    const next: QueryBuilderConfig = { ...config, table, fields: [], orderBy: undefined, filters: [] };
    setFilters([]);
    onChange(next);
  };

  const handleFieldsChange = (fields: string[]) => {
    onChange({ ...config, fields });
  };

  const handleOrderByChange = (orderBy: string) => {
    onChange({ ...config, orderBy });
  };

  const handleOrderDirChange = (orderDir: 'ASC' | 'DESC') => {
    onChange({ ...config, orderDir });
  };

  const handleLimitChange = (limit: number | null) => {
    onChange({ ...config, limit: limit ?? undefined });
  };

  const addFilter = () => {
    const newFilters = [...filters, { field: '', operator: '=', value: '' }];
    setFilters(newFilters);
    onChange({ ...config, filters: newFilters });
  };

  const removeFilter = (idx: number) => {
    const newFilters = filters.filter((_, i) => i !== idx);
    setFilters(newFilters);
    onChange({ ...config, filters: newFilters });
  };

  const updateFilter = (idx: number, patch: Partial<Filter>) => {
    const newFilters = filters.map((f, i) => (i === idx ? { ...f, ...patch } : f));
    setFilters(newFilters);
    onChange({ ...config, filters: newFilters });
  };

  // Keep local filters in sync when config.filters changes externally
  useEffect(() => {
    setFilters(config.filters || []);
  }, [config.table]);

  const noValueOps = ['IS NULL', 'IS NOT NULL'];
  const generatedSQL = buildSQL(config, semanticLayer.fields);

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {/* Table */}
      <div>
        <Text strong style={{ fontSize: 12 }}>Table</Text>
        <Select
          style={{ width: '100%', marginTop: 4 }}
          placeholder={tableOptions.length > 0 ? 'Select table' : 'Connect a database first'}
          disabled={tableOptions.length === 0}
          value={config.table || undefined}
          onChange={handleTableChange}
          showSearch
          optionFilterProp="label"
          options={tableOptions.map((t) => ({ value: t, label: t }))}
          size="small"
        />
      </div>

      {/* Fields */}
      {config.table && (
        <div>
          <Text strong style={{ fontSize: 12 }}>Select Fields</Text>
          <Select
            mode="multiple"
            style={{ width: '100%', marginTop: 4 }}
            placeholder="Leave empty to select all (*)"
            value={config.fields || []}
            onChange={handleFieldsChange}
            options={allFieldOptions}
            showSearch
            optionFilterProp="label"
            size="small"
          />
        </div>
      )}

      {/* Filters */}
      {config.table && (
        <div>
          <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text strong style={{ fontSize: 12 }}>Filters</Text>
            <Button size="small" onClick={addFilter}>+ Add Filter</Button>
          </Space>
          {filters.map((f, idx) => (
            <Row key={idx} gutter={4} style={{ marginBottom: 6 }} align="middle">
              <Col flex="1">
                <Select
                  style={{ width: '100%' }}
                  placeholder="Field"
                  value={f.field || undefined}
                  onChange={(val) => updateFilter(idx, { field: val })}
                  options={allFieldOptions}
                  showSearch
                  optionFilterProp="label"
                  size="small"
                />
              </Col>
              <Col flex="none" style={{ width: 120 }}>
                <Select
                  style={{ width: '100%' }}
                  value={f.operator}
                  onChange={(val) => updateFilter(idx, { operator: val })}
                  options={OPERATORS}
                  size="small"
                />
              </Col>
              {!noValueOps.includes(f.operator) && (
                <Col flex="1">
                  <Input
                    size="small"
                    placeholder="Value"
                    value={f.value}
                    onChange={(e) => updateFilter(idx, { value: e.target.value })}
                  />
                </Col>
              )}
              <Col flex="none">
                <Button
                  type="text"
                  danger
                  size="small"
                  onClick={() => removeFilter(idx)}
                  style={{ padding: '0 4px' }}
                >
                  ✕
                </Button>
              </Col>
            </Row>
          ))}
        </div>
      )}

      {/* Order By + Limit */}
      {config.table && (
        <Row gutter={8}>
          <Col flex="1">
            <Text strong style={{ fontSize: 12 }}>Order By</Text>
            <Select
              style={{ width: '100%', marginTop: 4 }}
              placeholder="None"
              value={config.orderBy || undefined}
              onChange={handleOrderByChange}
              allowClear
              options={allFieldOptions}
              showSearch
              optionFilterProp="label"
              size="small"
            />
          </Col>
          <Col flex="none" style={{ width: 90 }}>
            <Text strong style={{ fontSize: 12 }}>Dir</Text>
            <Select
              style={{ width: '100%', marginTop: 4 }}
              value={config.orderDir || 'ASC'}
              onChange={handleOrderDirChange}
              size="small"
              options={[
                { value: 'ASC', label: 'ASC' },
                { value: 'DESC', label: 'DESC' },
              ]}
            />
          </Col>
          <Col flex="none" style={{ width: 90 }}>
            <Text strong style={{ fontSize: 12 }}>Limit</Text>
            <InputNumber
              style={{ width: '100%', marginTop: 4 }}
              min={1}
              value={config.limit}
              onChange={handleLimitChange}
              placeholder="100"
              size="small"
            />
          </Col>
        </Row>
      )}

      {/* Generated SQL Preview */}
      {generatedSQL && (
        <>
          <Divider style={{ margin: '8px 0' }} />
          <div>
            <Text strong style={{ fontSize: 12 }}>Generated SQL</Text>
            <pre
              style={{
                marginTop: 4,
                background: 'rgba(0,0,0,0.04)',
                border: `1px solid ${tokens.borderDefault}`,
                borderRadius: 4,
                padding: '8px 10px',
                fontSize: 12,
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                maxHeight: 120,
                overflow: 'auto',
              }}
            >
              {generatedSQL}
            </pre>
          </div>
        </>
      )}
    </Space>
  );
};

export default QueryBuilder;
