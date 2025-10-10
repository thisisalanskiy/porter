import React, { useState, useEffect, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Card, Button, Space, Spin, message, Select } from 'antd';
import { ReportElement as ReportElementType, DatabaseConnection, DatabaseSchema } from '../types';
import DataTable from './chart/DataTable';
import BarChart from './chart/BarChart';
import LineChart from './chart/LineChart';
import PieChart from './chart/PieChart';
import axios from 'axios';

interface Props {
  element: ReportElementType;
  schema: DatabaseSchema | null;
  databaseConnection: DatabaseConnection | null;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<ReportElementType>) => void;
  index: number;
  onMoveElement: (dragIndex: number, hoverIndex: number) => void;
}

const ReportElementComponent: React.FC<Props> = ({
  element,
  schema,
  databaseConnection,
  isSelected,
  onClick,
  onDelete,
  onUpdate,
  index,
  onMoveElement,
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(element.data || []);
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: 'report-element',
    item: { index, id: element.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: 'report-element',
    hover: (item: { index: number; id: string }) => {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      onMoveElement(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  drag(drop(ref));

  useEffect(() => {
    if (element.sql && databaseConnection && !element.data.length) {
      fetchData();
    }
  }, [element.sql, databaseConnection, element.data.length]);

  const fetchData = async () => {
    if (!element.sql || !databaseConnection) return;

    setLoading(true);
    try {
      const response = await axios.post('/api/db/query', {
        query: element.sql,
      });
      setData(response.data.rows);
      onUpdate({ data: response.data.rows });
    } catch (error: any) {
      message.error('Failed to fetch data: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const renderChart = () => {
    switch (element.type) {
      case 'header':
        return (
          <div 
            contentEditable
            onBlur={(e) => onUpdate({ config: { ...element.config, text: e.currentTarget.textContent } })}
            style={{ 
              fontSize: element.config?.size || element.config?.fontSize || '28px', 
              fontWeight: 'bold',
              padding: '16px',
              outline: 'none',
              wordWrap: 'break-word',
              whiteSpace: 'pre-wrap',
              resize: 'none',
              overflow: 'visible',
              minHeight: 'auto',
              height: 'auto',
              lineHeight: '1.2'
            }}
          >
            {element.config?.text || 'Click to edit header'}
          </div>
        );
      case 'paragraph':
        return (
          <div 
            contentEditable
            onBlur={(e) => onUpdate({ config: { ...element.config, text: e.currentTarget.textContent } })}
            style={{ 
              fontSize: element.config?.fontSize || '16px',
              padding: '16px',
              lineHeight: element.config?.lineHeight || '1.6',
              textAlign: element.config?.textAlign || 'left',
              marginBottom: element.config?.marginBottom || '16px',
              outline: 'none',
              wordWrap: 'break-word',
              whiteSpace: 'pre-wrap',
              resize: 'none',
              overflow: 'visible',
              minHeight: 'auto',
              height: 'auto'
            }}
          >
            {element.config?.text || 'Click to edit paragraph text...'}
          </div>
        );
      case 'table':
        return (
          <DataTable
            data={data}
            config={element.config}
            schema={schema}
            onConfigChange={(config) => onUpdate({ config })}
          />
        );
      case 'bar-chart':
        return (
          <BarChart
            data={data}
            config={element.config}
            schema={schema}
            onConfigChange={(config) => onUpdate({ config })}
          />
        );
      case 'line-chart':
        return (
          <LineChart
            data={data}
            config={element.config}
            schema={schema}
            onConfigChange={(config) => onUpdate({ config })}
          />
        );
      case 'pie-chart':
        return (
          <PieChart
            data={data}
            config={element.config}
            schema={schema}
            onConfigChange={(config) => onUpdate({ config })}
          />
        );
      default:
        return <div>Unknown element type: {element.type}</div>;
    }
  };

  return (
    <div ref={ref} style={{ opacity: isDragging ? 0.5 : 1 }}>
      <Card
        size="small"
        title={
          <Space>
            <span style={{ cursor: 'grab' }}>⋮⋮</span>
            {element.config?.title || `${element.type.charAt(0).toUpperCase() + element.type.slice(1)} Element`}
          </Space>
        }
        extra={
          <Space>
            <Select
              value={element.columnSpan || 1}
              onChange={(value) => onUpdate({ columnSpan: value })}
              size="small"
              style={{ width: 80 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Select.Option value={1}>1 Col</Select.Option>
              <Select.Option value={2}>2 Cols</Select.Option>
              <Select.Option value={3}>3 Cols</Select.Option>
            </Select>
            <Button
              type="text"
              danger
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              🗑️
            </Button>
          </Space>
        }
        style={{
          marginBottom: '16px',
          border: isSelected ? '2px solid #2d87ea' : isOver ? '2px dashed #2d87ea' : '1px solid #d9d9d9',
          position: 'relative',
          width: '100%',
          minHeight: ['header', 'paragraph'].includes(element.type) ? 'auto' : '300px',
          cursor: 'move',
        }}
        styles={{
          body: {
            padding: ['header', 'paragraph'].includes(element.type) ? '0' : '24px',
            minHeight: ['header', 'paragraph'].includes(element.type) ? 'auto' : 'auto',
            height: ['header', 'paragraph'].includes(element.type) ? 'auto' : 'auto'
          }
        }}
        onClick={onClick}
      >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>Loading data...</div>
        </div>
      ) : !element.sql && !['header', 'paragraph'].includes(element.type) ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#999' 
        }}>
          <div>Configure SQL query to load data</div>
          <Button 
            type="link" 
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            Click to configure
          </Button>
        </div>
      ) : (
        <div style={{ minHeight: ['header', 'paragraph'].includes(element.type) ? 'auto' : '200px' }}>
          {renderChart()}
        </div>
      )}
    </Card>
    </div>
  );
};

export default ReportElementComponent;

