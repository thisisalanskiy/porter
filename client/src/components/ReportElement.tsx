import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useDrag, useDrop } from 'react-dnd';
import { Card, Button, Space, Spin, message } from 'antd';
import { ReportElement as ReportElementType, DatabaseConnection, DatabaseSchema } from '../types';
import { buildSQL } from '../utils/buildSQL';
import DataTable from './chart/DataTable';
import BarChart from './chart/BarChart';
import LineChart from './chart/LineChart';
import PieChart from './chart/PieChart';
import MetricCard from './chart/MetricCard';
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
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
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
  onResizeStart,
  onResizeEnd,
}) => {
  const { tokens } = useTheme();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(element.data || []);
  const [isResizing, setIsResizing] = useState(false);
  const [previewSpan, setPreviewSpan] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);
  const startXRef = useRef(0);
  const startSpanRef = useRef(1);

  const [{ isDragging }, drag] = useDrag({
    type: 'report-element',
    item: { index, id: element.id },
    canDrag: () => !isResizingRef.current,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: 'report-element',
    hover: (item: { index: number; id: string }, monitor) => {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      // Only swap when the cursor crosses the vertical midpoint of the hovered element
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      // Dragging downward: only swap when cursor is past the midpoint
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      // Dragging upward: only swap when cursor is before the midpoint
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      onMoveElement(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  drop(ref); // outer div is the reorder drop target only

  // Second drop target: accept db-column drops onto this element to add/replace columns
  const [{ isColumnOver }, columnDrop] = useDrop({
    accept: 'db-column',
    drop: (item: { tableName: string; columnName: string; dataType: string }) => {
      const current = element.queryBuilderConfig;
      let updated = { ...(current || {}), limit: current?.limit ?? 100 };

      if (!current?.table) {
        // No table set yet — initialize
        updated = { table: item.tableName, fields: [item.columnName], limit: 100 };
      } else if (current.table === item.tableName) {
        // Same table — add column if not already present
        const existing = current.fields || [];
        if (!existing.includes(item.columnName)) {
          updated = { ...current, fields: [...existing, item.columnName], limit: current.limit ?? 100 };
        } else {
          return; // already present, no-op
        }
      } else {
        // Different table — replace with new table/column
        message.warning(`Switched to table "${item.tableName}"`);
        updated = { table: item.tableName, fields: [item.columnName], limit: 100 };
      }

      const sql = buildSQL(updated, []);
      onUpdate({ queryBuilderConfig: updated, sql, data: [] });
    },
    collect: monitor => ({ isColumnOver: monitor.isOver() }),
  });

  // Re-fetch whenever the SQL query changes or a connection is established
  useEffect(() => {
    if (element.sql && databaseConnection) {
      fetchData();
    }
  }, [element.sql, databaseConnection]);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!containerRef.current) return;

    const oneColWidth = containerRef.current.offsetWidth / (element.columnSpan || 1);
    isResizingRef.current = true;
    startXRef.current = e.clientX;
    startSpanRef.current = element.columnSpan || 1;
    setIsResizing(true);
    onResizeStart?.();

    const onMouseMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startXRef.current;
      const newSpan = Math.max(1, Math.min(3, startSpanRef.current + Math.round(delta / oneColWidth)));
      setPreviewSpan(newSpan);
    };

    const onMouseUp = (ev: MouseEvent) => {
      const delta = ev.clientX - startXRef.current;
      const newSpan = Math.max(1, Math.min(3, startSpanRef.current + Math.round(delta / oneColWidth)));
      if (newSpan !== startSpanRef.current) onUpdate({ columnSpan: newSpan });
      isResizingRef.current = false;
      setIsResizing(false);
      setPreviewSpan(null);
      onResizeEnd?.();
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const fetchData = async () => {
    if (!element.sql || !databaseConnection) return;

    setLoading(true);
    try {
      const response = await axios.post('/api/db/query', {
        query: element.sql,
      });
      const rows = response.data?.rows ?? [];
      setData(rows);
      onUpdate({ data: rows });
    } catch (error: any) {
      const errMsg = error?.response?.data?.error || error?.message || 'Unknown error';
      message.error(`Failed to fetch data: ${errMsg}`);
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
      case 'metric-card':
        return (
          <MetricCard
            data={data}
            config={element.config}
          />
        );
      default:
        return <div>Unknown element type: {element.type}</div>;
    }
  };

  return (
    <div ref={ref} style={{ opacity: isDragging ? 0.5 : 1 }}>
      <div ref={node => { (containerRef as any).current = node; columnDrop(node); }} style={{ position: 'relative' }}>
        <Card
          size="small"
          title={
            <Space>
              <span ref={drag as any} style={{ cursor: 'grab' }}>⋮⋮</span>
              {element.config?.title || `${element.type.charAt(0).toUpperCase() + element.type.slice(1)} Element`}
            </Space>
          }
          extra={
            <Space>
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
            border: isSelected ? `2px solid ${tokens.accent}` : isColumnOver ? '2px dashed #52c41a' : isOver ? `2px dashed ${tokens.accent}` : `1px solid ${tokens.borderDefault}`,
            position: 'relative',
            width: '100%',
            minHeight: ['header', 'paragraph', 'metric-card'].includes(element.type) ? 'auto' : '300px',
            cursor: 'move',
            pointerEvents: isResizing ? 'none' : undefined,
          }}
          styles={{
            body: {
              padding: ['header', 'paragraph', 'metric-card'].includes(element.type) ? '0' : '24px',
              minHeight: ['header', 'paragraph', 'metric-card'].includes(element.type) ? 'auto' : 'auto',
              height: ['header', 'paragraph', 'metric-card'].includes(element.type) ? 'auto' : 'auto'
            }
          }}
          onClick={onClick}
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
              <div style={{ marginTop: '16px' }}>Loading data...</div>
            </div>
          ) : !element.sql && !['header', 'paragraph', 'metric-card'].includes(element.type) ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: tokens.textSecondary
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
            <div style={{ minHeight: ['header', 'paragraph', 'metric-card'].includes(element.type) ? 'auto' : '200px' }}>
              {renderChart()}
            </div>
          )}
        </Card>
        {/* Resize handle — hidden for header (fixed 3-col width) */}
        {element.type !== 'header' && (
          <div
            onMouseDown={handleResizeMouseDown}
            style={{
              position: 'absolute',
              top: 0,
              right: -6,
              width: 12,
              height: '100%',
              cursor: 'col-resize',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ width: 4, height: 40, background: isResizing ? tokens.accent : tokens.borderMedium, borderRadius: 2, position: 'relative' }}>
            {isResizing && previewSpan !== null && (
              <span style={{
                position: 'absolute',
                top: '50%',
                left: 10,
                transform: 'translateY(-50%)',
                background: tokens.accent,
                color: '#fff',
                fontSize: 10,
                fontWeight: 600,
                padding: '2px 5px',
                borderRadius: 4,
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
              }}>
                {previewSpan}/3
              </span>
            )}
          </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportElementComponent;

