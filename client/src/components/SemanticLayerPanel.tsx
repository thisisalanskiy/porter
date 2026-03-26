import React, { useState } from 'react';
import { Drawer, Button, Table, Space, Modal, Form, Input, Select, Typography, Popconfirm, Empty, Tag } from 'antd';
import { useSemanticLayer } from '../contexts/SemanticContext';
import { SemanticField } from '../types';
import { DatabaseSchema } from '../types';

const { Text } = Typography;

interface Props {
  visible: boolean;
  onClose: () => void;
  schema: DatabaseSchema | null;
}

const SemanticLayerPanel: React.FC<Props> = ({ visible, onClose, schema }) => {
  const { semanticLayer, addField, updateField, removeField, clearFields } = useSemanticLayer();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingField, setEditingField] = useState<SemanticField | null>(null);
  const [form] = Form.useForm();

  // Build flat list of table→column options from schema
  const tableOptions = schema ? Object.keys(schema) : [];
  const [selectedTable, setSelectedTable] = useState<string>('');

  const columnOptions = selectedTable && schema && schema[selectedTable]
    ? schema[selectedTable].columns.map(col => ({
        value: col.column_name,
        label: `${col.column_name} (${col.data_type})`,
        dataType: col.data_type,
      }))
    : [];

  const openAdd = () => {
    setEditingField(null);
    form.resetFields();
    setSelectedTable('');
    setShowAddModal(true);
  };

  const openEdit = (field: SemanticField) => {
    setEditingField(field);
    setSelectedTable(field.tableName);
    form.setFieldsValue({
      label: field.label,
      tableName: field.tableName,
      columnName: field.columnName,
      description: field.description || '',
    });
    setShowAddModal(true);
  };

  const handleSave = (values: any) => {
    const col = columnOptions.find(c => c.value === values.columnName);
    if (editingField) {
      updateField(editingField.id, {
        label: values.label,
        tableName: values.tableName,
        columnName: values.columnName,
        dataType: col?.dataType || '',
        description: values.description,
      });
    } else {
      addField({
        label: values.label,
        tableName: values.tableName,
        columnName: values.columnName,
        dataType: col?.dataType || '',
        description: values.description,
      });
    }
    setShowAddModal(false);
    form.resetFields();
  };

  const columns = [
    {
      title: 'Label',
      dataIndex: 'label',
      key: 'label',
      render: (label: string) => <Text strong>{label}</Text>,
    },
    {
      title: 'Source',
      key: 'source',
      render: (_: any, record: SemanticField) => (
        <Text style={{ fontSize: 12 }}>
          {record.tableName}.{record.columnName}
        </Text>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'dataType',
      key: 'dataType',
      width: 100,
      render: (dt: string) => <Tag style={{ fontSize: 11 }}>{dt}</Tag>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string) => <Text type="secondary" style={{ fontSize: 12 }}>{desc || '—'}</Text>,
    },
    {
      title: '',
      key: 'actions',
      width: 100,
      render: (_: any, record: SemanticField) => (
        <Space>
          <Button type="text" size="small" onClick={() => openEdit(record)}>
            ✏️
          </Button>
          <Popconfirm
            title="Remove this field?"
            onConfirm={() => removeField(record.id)}
            okText="Remove"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" size="small" danger>
              🗑️
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Drawer
        title={
          <Space>
            <span>Semantic Layer</span>
            <Tag color="purple">{semanticLayer.fields.length} fields</Tag>
          </Space>
        }
        placement="right"
        width={700}
        onClose={onClose}
        open={visible}
        extra={
          <Space>
            {semanticLayer.fields.length > 0 && (
              <Popconfirm
                title="Clear all semantic fields?"
                onConfirm={clearFields}
                okText="Clear"
                okButtonProps={{ danger: true }}
              >
                <Button size="small" danger>
                  Clear All
                </Button>
              </Popconfirm>
            )}
            <Button type="primary" onClick={openAdd}>
              ➕ Add Field
            </Button>
          </Space>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Define human-readable aliases for your database columns. These labels can be referenced in element configurations to make your reports more descriptive.
          </Text>
        </div>

        {semanticLayer.fields.length === 0 ? (
          <Empty
            description="No semantic fields defined yet"
            style={{ marginTop: 60 }}
          >
            <Button type="primary" onClick={openAdd}>
              ➕ Add Your First Field
            </Button>
          </Empty>
        ) : (
          <Table
            dataSource={semanticLayer.fields}
            columns={columns}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 15 }}
          />
        )}
      </Drawer>

      <Modal
        title={editingField ? 'Edit Semantic Field' : 'Add Semantic Field'}
        open={showAddModal}
        onCancel={() => {
          setShowAddModal(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="Save"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          style={{ marginTop: 8 }}
        >
          <Form.Item
            name="label"
            label="Display Label"
            rules={[{ required: true, message: 'Please enter a label' }]}
          >
            <Input placeholder="e.g. Monthly Revenue" />
          </Form.Item>

          <Form.Item
            name="tableName"
            label="Table"
            rules={[{ required: true, message: 'Please select a table' }]}
          >
            <Select
              placeholder={tableOptions.length > 0 ? 'Select table' : 'Connect a database first'}
              disabled={tableOptions.length === 0}
              onChange={(val) => {
                setSelectedTable(val);
                form.setFieldValue('columnName', undefined);
              }}
              showSearch
              optionFilterProp="label"
              options={tableOptions.map(t => ({ value: t, label: t }))}
            />
          </Form.Item>

          <Form.Item
            name="columnName"
            label="Column"
            rules={[{ required: true, message: 'Please select a column' }]}
          >
            <Select
              placeholder={selectedTable ? 'Select column' : 'Select a table first'}
              disabled={!selectedTable}
              showSearch
              optionFilterProp="label"
              options={columnOptions.map(c => ({ value: c.value, label: c.label }))}
            />
          </Form.Item>

          <Form.Item name="description" label="Description (optional)">
            <Input placeholder="Brief description of this metric" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default SemanticLayerPanel;
