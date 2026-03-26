import React from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Typography } from 'antd';
import { DatabaseSchema } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

const { Title } = Typography;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

interface Props {
  data: any[];
  config: any;
  schema: DatabaseSchema | null;
  onConfigChange: (config: any) => void;
}

const PieChart: React.FC<Props> = ({ data, config }) => {
  const { tokens } = useTheme();
  if (!data || data.length === 0 || !config?.valueField || !config?.nameField) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: tokens.textSecondary }}>
        {!config?.valueField || !config?.nameField 
          ? 'Please configure value and name fields' 
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
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey={config.valueField}
            nameKey={config.nameField}
          >
            {data.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PieChart;

