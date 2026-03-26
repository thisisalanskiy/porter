import React, { useEffect, useState } from 'react';
import { Form, Input, Select, Button, Switch, Typography } from 'antd';
import { ReportElement, DatabaseSchema, QueryBuilderConfig } from '../types';
import QueryBuilder from './QueryBuilder';
import { buildSQL } from '../utils/buildSQL';
import { useTheme } from '../contexts/ThemeContext';

const { Text } = Typography;

interface Props {
  element: ReportElement;
  schema: DatabaseSchema | null;
  onUpdate: (updates: Partial<ReportElement>) => void;
  onUpdateConfig?: (updates: Partial<ReportElement>) => void;
}

const ElementConfigPanel: React.FC<Props> = ({
  element,
  schema,
  onUpdate,
  onUpdateConfig,
}) => {
  const { tokens } = useTheme();
  const [form] = Form.useForm();
  const [sqlValue, setSqlValue] = useState(element.sql || '');
  const [showAdvancedSQL, setShowAdvancedSQL] = useState(false);
  const [qbConfig, setQbConfig] = useState<QueryBuilderConfig>(element.queryBuilderConfig || {});

  // Sync form and SQL editor when the selected element changes
  useEffect(() => {
    form.setFieldsValue({
      ...element.config,
      text: element.config?.text || (element.type === 'header' ? 'Click to edit header' : 'Click to edit paragraph text...'),
    });
    setSqlValue(element.sql || '');
    setQbConfig(element.queryBuilderConfig || {});
    setShowAdvancedSQL(false);
  }, [element.id, form]); // re-sync on element switch, not on every update

  const handleSave = (values: any) => {
    const updateFn = onUpdateConfig || onUpdate;
    updateFn({ config: { ...element.config, ...values } });
  };

  const handleSaveQuery = () => {
    onUpdate({ sql: sqlValue, data: [] }); // clear cached data so it re-fetches
  };

  // Column names derived from actual query results (first row keys)
  const columnOptions = element.data && element.data.length > 0
    ? Object.keys(element.data[0]).map(col => ({ value: col, label: col }))
    : [];

  // Table names from schema (used for orderBy hint when no data yet)
  const schemaTableOptions = schema
    ? Object.keys(schema).map(table => ({ value: table, label: table }))
    : [];

  const orderByOptions = columnOptions.length > 0 ? columnOptions : schemaTableOptions;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px 24px' }}>
        <Form
          form={form}
          layout="vertical"
          initialValues={element.config || {}}
          onFinish={handleSave}
        >
          {element.type === 'header' && (
            <>
              <Form.Item
                name="text"
                label={<span>Header Text <span style={{ color: 'red' }}>*</span></span>}
                rules={[{ required: true, message: 'Please enter header text' }]}
                required={false}
              >
                <Input placeholder="Enter header text" />
              </Form.Item>
              <Form.Item name="size" label="Font Size" initialValue="28px">
                <Select>
                  <Select.Option value="20px">Small (20px)</Select.Option>
                  <Select.Option value="24px">Medium (24px)</Select.Option>
                  <Select.Option value="28px">Large (28px)</Select.Option>
                  <Select.Option value="32px">Extra Large (32px)</Select.Option>
                </Select>
              </Form.Item>
            </>
          )}

          {element.type === 'paragraph' && (
            <>
              <Form.Item
                name="text"
                label={<span>Paragraph Text <span style={{ color: 'red' }}>*</span></span>}
                rules={[{ required: true, message: 'Please enter paragraph text' }]}
                required={false}
              >
                <Input.TextArea placeholder="Enter paragraph text" rows={4} />
              </Form.Item>
              <Form.Item name="fontSize" label="Font Size" initialValue="16px">
                <Select>
                  <Select.Option value="12px">Small (12px)</Select.Option>
                  <Select.Option value="14px">Medium (14px)</Select.Option>
                  <Select.Option value="16px">Large (16px)</Select.Option>
                  <Select.Option value="18px">Extra Large (18px)</Select.Option>
                  <Select.Option value="20px">XXL (20px)</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="textAlign" label="Text Alignment" initialValue="left">
                <Select>
                  <Select.Option value="left">Left</Select.Option>
                  <Select.Option value="center">Center</Select.Option>
                  <Select.Option value="right">Right</Select.Option>
                  <Select.Option value="justify">Justify</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="lineHeight" label="Line Spacing" initialValue="1.6">
                <Select>
                  <Select.Option value="1.2">Tight (1.2)</Select.Option>
                  <Select.Option value="1.4">Normal (1.4)</Select.Option>
                  <Select.Option value="1.6">Relaxed (1.6)</Select.Option>
                  <Select.Option value="1.8">Loose (1.8)</Select.Option>
                  <Select.Option value="2.0">Very Loose (2.0)</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="marginBottom" label="Bottom Spacing" initialValue="16px">
                <Select>
                  <Select.Option value="8px">Small (8px)</Select.Option>
                  <Select.Option value="16px">Medium (16px)</Select.Option>
                  <Select.Option value="24px">Large (24px)</Select.Option>
                  <Select.Option value="32px">Extra Large (32px)</Select.Option>
                </Select>
              </Form.Item>
            </>
          )}

          {!['header', 'paragraph', 'metric-card'].includes(element.type) && (
            <Form.Item
              name="title"
              label={<span>Title <span style={{ color: 'red' }}>*</span></span>}
              rules={[{ required: true, message: 'Please enter a title' }]}
              required={false}
            >
              <Input placeholder="Element title" />
            </Form.Item>
          )}

          {element.type === 'table' && (
            <>
              <Form.Item name="limit" label="Row Limit" initialValue={100}>
                <Input type="number" min={1} />
              </Form.Item>
              <Form.Item name="orderBy" label="Order By">
                <Select placeholder={orderByOptions.length > 0 ? 'Select column' : 'Run query first to see columns'} allowClear>
                  {orderByOptions.map(option => (
                    <Select.Option key={option.value} value={option.value}>
                      {option.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </>
          )}

          {(element.type === 'bar-chart' || element.type === 'line-chart') && (
            <>
              <Form.Item
                name="xAxisField"
                label={<span>X-Axis Field <span style={{ color: 'red' }}>*</span></span>}
                rules={[{ required: true, message: 'Please select X-axis field' }]}
                required={false}
              >
                <Select placeholder={columnOptions.length > 0 ? 'Select column' : 'Run query first to see columns'}>
                  {columnOptions.map(option => (
                    <Select.Option key={option.value} value={option.value}>
                      {option.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="yAxisField"
                label={<span>Y-Axis Field <span style={{ color: 'red' }}>*</span></span>}
                rules={[{ required: true, message: 'Please select Y-axis field' }]}
                required={false}
              >
                <Select placeholder={columnOptions.length > 0 ? 'Select column' : 'Run query first to see columns'}>
                  {columnOptions.map(option => (
                    <Select.Option key={option.value} value={option.value}>
                      {option.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </>
          )}

          {element.type === 'metric-card' && (
            <>
              <Form.Item name="title" label="Label">
                <Input placeholder="e.g. Total Revenue" />
              </Form.Item>
              <Form.Item name="prefix" label="Prefix">
                <Input placeholder="e.g. $" />
              </Form.Item>
              <Form.Item name="suffix" label="Suffix">
                <Input placeholder="e.g. %" />
              </Form.Item>
              <Form.Item name="valueField" label="Value Field">
                <Select placeholder={columnOptions.length > 0 ? 'Select column' : 'Run query first to see columns'} allowClear>
                  {columnOptions.map(option => (
                    <Select.Option key={option.value} value={option.value}>
                      {option.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="fontSize" label="Font Size" initialValue="48px">
                <Select>
                  <Select.Option value="32px">Small (32px)</Select.Option>
                  <Select.Option value="48px">Medium (48px)</Select.Option>
                  <Select.Option value="64px">Large (64px)</Select.Option>
                  <Select.Option value="80px">Extra Large (80px)</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="color" label="Color" initialValue="#84B4F8">
                <Input type="color" style={{ width: '60px', padding: '2px' }} />
              </Form.Item>
            </>
          )}

          {element.type === 'pie-chart' && (
            <>
              <Form.Item
                name="nameField"
                label={<span>Label Field <span style={{ color: 'red' }}>*</span></span>}
                rules={[{ required: true, message: 'Please select label field' }]}
                required={false}
              >
                <Select placeholder={columnOptions.length > 0 ? 'Select column' : 'Run query first to see columns'}>
                  {columnOptions.map(option => (
                    <Select.Option key={option.value} value={option.value}>
                      {option.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="valueField"
                label={<span>Value Field <span style={{ color: 'red' }}>*</span></span>}
                rules={[{ required: true, message: 'Please select value field' }]}
                required={false}
              >
                <Select placeholder={columnOptions.length > 0 ? 'Select column' : 'Run query first to see columns'}>
                  {columnOptions.map(option => (
                    <Select.Option key={option.value} value={option.value}>
                      {option.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </>
          )}

          {['table', 'bar-chart', 'line-chart', 'pie-chart', 'metric-card'].includes(element.type) && (
            <Form.Item label="Data Query">
              <div style={{ border: `1px solid ${tokens.borderDefault}`, borderRadius: '6px', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ fontSize: 13, fontWeight: 500 }}>Query Builder</Text>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 12, color: tokens.textSecondary }}>Advanced SQL</Text>
                    <Switch
                      size="small"
                      checked={showAdvancedSQL}
                      onChange={setShowAdvancedSQL}
                    />
                  </div>
                </div>

                {showAdvancedSQL ? (
                  <div>
                    <Input.TextArea
                      rows={10}
                      placeholder="Enter your SQL query here..."
                      value={sqlValue}
                      onChange={(e) => setSqlValue(e.target.value)}
                      style={{
                        marginBottom: '10px',
                        resize: 'none',
                        fontFamily: 'monospace',
                        fontSize: '13px',
                      }}
                    />
                    <Button type="default" onClick={handleSaveQuery} block size="small">
                      Run Query
                    </Button>
                  </div>
                ) : (
                  <div>
                    <QueryBuilder
                      schema={schema}
                      config={qbConfig}
                      onChange={(newConfig) => {
                        setQbConfig(newConfig);
                        const generated = buildSQL(newConfig, []);
                        setSqlValue(generated);
                        onUpdate({ queryBuilderConfig: newConfig, sql: generated, data: [] });
                      }}
                    />
                    {qbConfig.table && (
                      <Button
                        type="default"
                        onClick={() => {
                          onUpdate({ sql: sqlValue, queryBuilderConfig: qbConfig, data: [] });
                        }}
                        block
                        size="small"
                        style={{ marginTop: 10 }}
                      >
                        Run Query
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Form.Item>
          )}

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Save Configuration
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default ElementConfigPanel;
