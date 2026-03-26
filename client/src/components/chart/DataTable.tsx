import React, { useState } from 'react';
import { Table, Typography } from 'antd';
import { DatabaseSchema } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

const { Title } = Typography;

interface Props {
  data: any[];
  config: any;
  schema: DatabaseSchema | null;
  onConfigChange: (config: any) => void;
}

const DataTable: React.FC<Props> = ({ data, config }) => {
  const { tokens } = useTheme();
  const [pageSize, setPageSize] = useState<number>(config?.limit || 50);

  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: tokens.textSecondary }}>
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
          pageSize,
          onShowSizeChange: (_, size) => setPageSize(size),
          showSizeChanger: true,
          showTotal: (total) => `${total} rows`,
          size: 'small',
        }}
        style={{ overflow: 'hidden' }}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
};

export default DataTable;

