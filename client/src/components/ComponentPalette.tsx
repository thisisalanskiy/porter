import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import { Card, Space, Button, Popover, message } from 'antd';
import { ComponentType } from '../types';

interface Props {
  componentTypes: ComponentType[];
  onAddElement: (type: string, columnSpan: number) => void;
  availableColumns: number;
  setAvailableColumns: (columns: number) => void;
}

const ComponentPalette: React.FC<Props> = ({ 
  componentTypes, 
  onAddElement, 
  availableColumns, 
  setAvailableColumns 
}) => {
  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {componentTypes.map((component) => (
        <DraggableComponent 
          key={component.type}
          component={component}
          onAddElement={onAddElement}
          availableColumns={availableColumns}
          setAvailableColumns={setAvailableColumns}
        />
      ))}
    </Space>
  );
};

interface DraggableComponentProps {
  component: ComponentType;
  onAddElement: (type: string, columnSpan: number) => void;
  availableColumns: number;
  setAvailableColumns: (columns: number) => void;
}

const DraggableComponent: React.FC<DraggableComponentProps> = ({ 
  component, 
  onAddElement,
  availableColumns,
  setAvailableColumns
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'component',
    item: { type: component.type, columnSpan: 1 },
    end: (item, monitor) => {
      if (monitor.didDrop()) {
        onAddElement(item.type, item.columnSpan);
        const newAvailableColumns = availableColumns - item.columnSpan;
        setAvailableColumns(newAvailableColumns > 0 ? newAvailableColumns : 3);
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
      }}
    >
      <Card
        size="small"
        style={{
          border: '1px solid #d9d9d9',
          borderRadius: '6px',
          transition: 'all 0.2s ease',
        }}
        className="component-card"
      >
        <Space>
          {component.icon}
          <div>
            <div style={{ fontWeight: 500, marginBottom: 2 }}>
              {component.label}
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>
              {component.description}
            </div>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default ComponentPalette;

