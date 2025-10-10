import React from 'react';
import { Table, Typography } from 'antd';
import { DatabaseSchema } from '../../types';

const { Title } = Typography;

interface Props {
  data: any[];
  config: any;
  schema: DatabaseSchema | null;
  onConfigChange: (config: any) => void;
}

const DataTable: React.FC<Props> = ({ data, config, schema, onConfigChange }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
        No data available
      </div>
    );
  }

  const columns = Object.keys(data[0]).map(key => ({
    title: key.toLowerCase().replace('_', ' '),
    dataIndex: key,
    key: key,
    sorter: (a: any, b: any) => {
      const aVal = a[key];
      const bVal = b[key];
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return aVal - bVal;
      }
      
      return String(aVal).localeCompare(String(bVal));
    },
  }));

  return (
    <div style={{ padding: '16px' }}>
      {config?.title && (
        <Title level={4} style={{ marginBottom: '16px', textAlign: 'center' }}>
          {config.title}
        </Title>
      )}
      
      <Table
        dataSource={data}
        columns={columns}
        pagination={{
          pageSize: config?.limit || 50,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} of ${total} items`,
        }}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
};

export default DataTable;

