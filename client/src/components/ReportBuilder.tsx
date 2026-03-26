import { useState } from 'react';
import { useDrop } from 'react-dnd';
import { Card, Button, Modal, Tag } from 'antd';
import ReportElement from './ReportElement';
import ElementConfigPanel from './ElementConfigPanel';
import { ReportElement as ReportElementType, DatabaseConnection, DatabaseSchema, QueryBuilderConfig } from '../types';
import { useTheme } from '../contexts/ThemeContext';

const isNumericType = (dataType: string): boolean => {
  const t = dataType.toLowerCase();
  return t.includes('int') || t.includes('numeric') || t.includes('float') ||
    t.includes('double') || t.includes('decimal') || t === 'real';
};

interface Props {
  elements: ReportElementType[];
  onAddElement: (type: string, columnSpan: number) => string;
  onAddElementWithData: (type: string, config: QueryBuilderConfig) => string;
  onUpdateElement: (id: string, updates: Partial<ReportElementType>) => void;
  onUpdateElementConfig: (id: string, updates: Partial<ReportElementType>) => void;
  onDeleteElement: (id: string) => void;
  onReorderElements: (dragIndex: number, hoverIndex: number) => void;
  selectedElement: string | null;
  onSelectElement: (id: string | null) => void;
  databaseConnection: DatabaseConnection | null;
  reportOrientation: 'portrait' | 'landscape';
  schema: DatabaseSchema | null;
}

const ReportBuilder: React.FC<Props> = ({
  elements,
  onAddElement,
  onAddElementWithData,
  onUpdateElement,
  onUpdateElementConfig,
  onDeleteElement,
  onReorderElements,
  selectedElement,
  onSelectElement,
  databaseConnection,
  reportOrientation,
  schema,
}) => {
  const [isAnyResizing, setIsAnyResizing] = useState(false);
  const { tokens } = useTheme();

  const [{ isOver }, drop] = useDrop({
    accept: ['component', 'db-table', 'db-column'],
    drop: (item: any, monitor) => {
      const itemType = monitor.getItemType();
      if (itemType === 'component') {
        const id = onAddElement(item.type, item.columnSpan || 1);
        onSelectElement(id);
      } else if (itemType === 'db-table') {
        const id = onAddElementWithData('table', {
          table: item.tableName,
          fields: [],
          limit: 100,
        });
        onSelectElement(id);
      } else if (itemType === 'db-column') {
        const elementType = isNumericType(item.dataType) ? 'metric-card' : 'table';
        const id = onAddElementWithData(elementType, {
          table: item.tableName,
          fields: [item.columnName],
          limit: 100,
        });
        onSelectElement(id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const handleElementClick = (elementId: string) => {
    onSelectElement(elementId);
  };

  const handleDeleteElement = (elementId: string) => {
    Modal.confirm({
      title: 'Delete Element',
      content: 'Are you sure you want to delete this element?',
      onOk: () => {
        onDeleteElement(elementId);
        if (selectedElement === elementId) {
          onSelectElement(null);
        }
      },
    });
  };

  const handleMoveElement = (dragIndex: number, hoverIndex: number) => {
    if (dragIndex === hoverIndex) return;
    onReorderElements(dragIndex, hoverIndex);
  };

  const selectedElementData = elements.find(el => el.id === selectedElement);

  // Calculate estimated page count based on elements
  const calculatePageCount = () => {
    if (elements.length === 0) return 1;
    
    // Rough estimation: each element takes about 200-300px height
    // A4 page is roughly 800px height in portrait mode
    const estimatedHeight = elements.length * 250;
    const pageHeight = 800;
    const pages = Math.ceil(estimatedHeight / pageHeight);
    
    return Math.max(1, pages);
  };

  const pageCount = calculatePageCount();

  return (
    <div style={{ height: '100%', display: 'flex', gap: '16px' }}>
      <div style={{ flex: 1 }}>
        <Card 
          title={
            <span>
              Report Canvas 
              <Tag color="default" style={{ marginLeft: '8px' }}>
                {pageCount} page{pageCount !== 1 ? 's' : ''}
              </Tag>
            </span>
          }
          style={{ height: '100%', overflow: 'auto' }}
        >
          <div
            ref={drop}
            style={{
              minHeight: '600px',
              padding: '16px',
              border: isOver ? `2px dashed ${tokens.accent}` : `2px dashed ${tokens.borderMedium}`,
              borderRadius: '8px',
              background: isOver ? `color-mix(in srgb, ${tokens.accent} 5%, transparent)` : tokens.bgCanvas,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              maxWidth: reportOrientation === 'landscape' ? '1000px' : '800px',
              margin: '0 auto',
              width: '100%',
            }}
          >
            {elements.length === 0 ? (
              <div style={{
                textAlign: 'center',
                color: tokens.textSecondary,
                fontSize: '16px',
                marginTop: '200px'
              }}>
                Drag components here to build your report
              </div>
            ) : (
              <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gridAutoRows: 'auto',
                  gridAutoFlow: 'row',
                  gap: '16px',
                  width: '100%',
                  alignItems: 'start',
                  backgroundImage: isAnyResizing
                    ? 'linear-gradient(to right, rgba(0,0,0,0.03) 0, rgba(0,0,0,0.03) calc((100% - 32px) / 3), transparent calc((100% - 32px) / 3), transparent calc((100% - 32px) / 3 + 16px), rgba(0,0,0,0.03) calc((100% - 32px) / 3 + 16px), rgba(0,0,0,0.03) calc((100% - 32px) * 2 / 3 + 16px), transparent calc((100% - 32px) * 2 / 3 + 16px), transparent calc((100% - 32px) * 2 / 3 + 32px), rgba(0,0,0,0.03) calc((100% - 32px) * 2 / 3 + 32px), rgba(0,0,0,0.03) 100%)'
                    : undefined,
                }}>
                  {elements.map((element, index) => (
                    <div
                      key={element.id}
                      style={{
                        gridColumn: `span ${element.columnSpan || 1}`,
                        width: '100%',
                        minWidth: 0,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <ReportElement
                        element={element}
                        schema={schema}
                        databaseConnection={databaseConnection}
                        isSelected={selectedElement === element.id}
                        onClick={() => handleElementClick(element.id)}
                        onDelete={() => handleDeleteElement(element.id)}
                        onUpdate={(updates) => onUpdateElement(element.id, updates)}
                        index={index}
                        onMoveElement={handleMoveElement}
                        onResizeStart={() => setIsAnyResizing(true)}
                        onResizeEnd={() => setIsAnyResizing(false)}
                      />
                    </div>
                  ))}
                </div>
            )}
          </div>
        </Card>
      </div>

      {selectedElementData && (
        <Card 
          title="Element Configuration"
          extra={
            <Button 
              type="text" 
              onClick={() => onSelectElement(null)}
              style={{ padding: '4px 8px' }}
            >
              ✕
            </Button>
          }
          style={{ width: '350px', height: '100%' }}
          styles={{
            body: {
              padding: '0',
              height: 'calc(100% - 57px)',
              overflow: 'hidden'
            }
          }}
        >
          <ElementConfigPanel
            element={selectedElementData}
            schema={schema}
            onUpdate={(updates) => selectedElement && onUpdateElement(selectedElement, updates)}
            onUpdateConfig={(updates) => selectedElement && onUpdateElementConfig(selectedElement, updates)}
          />
        </Card>
      )}
    </div>
  );
};

export default ReportBuilder;

