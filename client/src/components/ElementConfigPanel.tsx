import React, { useEffect, useState } from 'react';
import { Form, Input, Select, Button, Collapse } from 'antd';
import { ReportElement, DatabaseSchema } from '../types';

const { Panel } = Collapse;

interface Props {
  element: ReportElement;
  schema: DatabaseSchema | null;
  onUpdate: (updates: Partial<ReportElement>) => void;
  onUpdateConfig?: (updates: Partial<ReportElement>) => void; // Optional: doesn't mark as unsaved
}

const ElementConfigPanel: React.FC<Props> = ({
  element,
  schema,
  onUpdate,
  onUpdateConfig,
}) => {
  const [form] = Form.useForm();
  const [isSqlExpanded, setIsSqlExpanded] = useState(!!element.sql);

  // Update form values when element changes
  useEffect(() => {
    form.setFieldsValue({
      ...element.config,
      text: element.config?.text || (element.type === 'header' ? 'Click to edit header' : 'Click to edit paragraph text...')
    });
    // Update SQL expansion state based on whether element has SQL
    setIsSqlExpanded(!!element.sql);
  }, [element, form]);

  const handleSave = (values: any) => {
    // Use onUpdateConfig if available (doesn't mark as unsaved), otherwise use onUpdate
    const updateFunction = onUpdateConfig || onUpdate;
    updateFunction({ config: { ...element.config, ...values } });
  };

  const sqlConfigOptions = schema 
    ? Object.keys(schema).map(table => ({
        value: table,
        label: table,
      }))
    : [];

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
                    <Form.Item
                      name="size"
                      label="Font Size"
                      initialValue="28px"
                    >
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
                      <Input.TextArea 
                        placeholder="Enter paragraph text" 
                        rows={4}
                      />
                    </Form.Item>
                    <Form.Item
                      name="fontSize"
                      label="Font Size"
                      initialValue="16px"
                    >
                      <Select>
                        <Select.Option value="12px">Small (12px)</Select.Option>
                        <Select.Option value="14px">Medium (14px)</Select.Option>
                        <Select.Option value="16px">Large (16px)</Select.Option>
                        <Select.Option value="18px">Extra Large (18px)</Select.Option>
                        <Select.Option value="20px">XXL (20px)</Select.Option>
                      </Select>
                    </Form.Item>
                    <Form.Item
                      name="textAlign"
                      label="Text Alignment"
                      initialValue="left"
                    >
                      <Select>
                        <Select.Option value="left">Left</Select.Option>
                        <Select.Option value="center">Center</Select.Option>
                        <Select.Option value="right">Right</Select.Option>
                        <Select.Option value="justify">Justify</Select.Option>
                      </Select>
                    </Form.Item>
                    <Form.Item
                      name="lineHeight"
                      label="Line Spacing"
                      initialValue="1.6"
                    >
                      <Select>
                        <Select.Option value="1.2">Tight (1.2)</Select.Option>
                        <Select.Option value="1.4">Normal (1.4)</Select.Option>
                        <Select.Option value="1.6">Relaxed (1.6)</Select.Option>
                        <Select.Option value="1.8">Loose (1.8)</Select.Option>
                        <Select.Option value="2.0">Very Loose (2.0)</Select.Option>
                      </Select>
                    </Form.Item>
                    <Form.Item
                      name="marginBottom"
                      label="Bottom Spacing"
                      initialValue="16px"
                    >
                      <Select>
                        <Select.Option value="8px">Small (8px)</Select.Option>
                        <Select.Option value="16px">Medium (16px)</Select.Option>
                        <Select.Option value="24px">Large (24px)</Select.Option>
                        <Select.Option value="32px">Extra Large (32px)</Select.Option>
                      </Select>
                    </Form.Item>
                  </>
                )}

                {!['header', 'paragraph'].includes(element.type) && (
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
                    <Form.Item
                      name="limit"
                      label="Row Limit"
                      initialValue={100}
                    >
                      <Input type="number" min={1} />
                    </Form.Item>
                    
                    <Form.Item
                      name="orderBy"
                      label="Order By"
                    >
                      <Select
                        placeholder="Select column to order by"
                        allowClear
                      >
                        {sqlConfigOptions.map(option => (
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
                      <Select placeholder="Select X-axis field">
                        {sqlConfigOptions.map(option => (
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
                      <Select placeholder="Select Y-axis field">
                        {sqlConfigOptions.map(option => (
                          <Select.Option key={option.value} value={option.value}>
                            {option.label}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </>
                )}

                {['table', 'bar-chart', 'line-chart', 'pie-chart'].includes(element.type) && (
                  <Form.Item label="SQL Query">
                    <Collapse 
                      activeKey={isSqlExpanded ? ['sql'] : []}
                      ghost
                      expandIconPosition="end"
                      onChange={(keys) => setIsSqlExpanded(keys.includes('sql'))}
                      style={{ 
                        border: '1px solid #d9d9d9',
                        borderRadius: '6px'
                      }}
                    >
                      <Panel 
                        header={
                          <span style={{ color: '#666', fontSize: '14px' }}>
                            {isSqlExpanded ? 'Collapse' : 'Expand'}
                          </span>
                        } 
                        key="sql"
                        style={{ padding: '0' }}
                      >
                        <div style={{ padding: '0 16px 16px 16px' }}>
                          <Input.TextArea
                            rows={12}
                            placeholder="Enter your SQL query here..."
                            value={element.sql || ''}
                            onChange={(e) => form.setFieldsValue({ sql: e.target.value })}
                            style={{ 
                              marginBottom: '16px', 
                              resize: 'none',
                              fontFamily: 'monospace',
                              fontSize: '13px'
                            }}
                          />
                          
                          <Button 
                            type="default"
                            onClick={() => {
                              const values = form.getFieldsValue();
                              onUpdate({ sql: values.sql });
                            }}
                            block
                          >
                            Save Query
                          </Button>
                        </div>
                      </Panel>
                    </Collapse>
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

