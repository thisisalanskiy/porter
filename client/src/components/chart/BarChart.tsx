import React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Typography } from 'antd';
import { DatabaseSchema } from '../../types';

const { Title } = Typography;

interface Props {
  data: any[];
  config: any;
  schema: DatabaseSchema | null;
  onConfigChange: (config: any) => void;
}

const BarChart: React.FC<Props> = ({ data, config, schema }) => {
  if (!data || data.length === 0 || !config?.xAxisField || !config?.yAxisField) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
        {!config?.xAxisField || !config?.yAxisField 
          ? 'Please configure X and Y axis fields' 
          : 'No data available'}
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', height: '400px' }}>
      {config?.title && (
        <Title level={4} style={{ marginBottom: '16px', textAlign: 'center' }}>
          {config.title}
        </Title>
      )}
      
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={config.xAxisField} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar 
            dataKey={config.yAxisField} 
            fill={config?.color || '#1890ff'} 
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChart;

