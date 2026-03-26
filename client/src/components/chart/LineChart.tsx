import React from 'react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Typography } from 'antd';
import { DatabaseSchema } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

const { Title } = Typography;

interface Props {
  data: any[];
  config: any;
  schema: DatabaseSchema | null;
  onConfigChange: (config: any) => void;
}

const LineChart: React.FC<Props> = ({ data, config }) => {
  const { tokens } = useTheme();
  if (!data || data.length === 0 || !config?.xAxisField || !config?.yAxisField) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: tokens.textSecondary }}>
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
        <RechartsLineChart
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
          <Line 
            type="monotone" 
            dataKey={config.yAxisField} 
            stroke={config?.color || '#1890ff'} 
            strokeWidth={2}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChart;
