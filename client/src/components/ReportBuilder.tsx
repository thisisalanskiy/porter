import { useState, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { Card, Button, Modal, Tag } from 'antd';
import ReportElement from './ReportElement';
import ElementConfigPanel from './ElementConfigPanel';
import { ReportElement as ReportElementType, DatabaseConnection } from '../types';
import axios from 'axios';

interface Props {
  elements: ReportElementType[];
  onUpdateElement: (id: string, updates: Partial<ReportElementType>) => void;
  onUpdateElementConfig: (id: string, updates: Partial<ReportElementType>) => void;
  onDeleteElement: (id: string) => void;
  onReorderElements: (dragIndex: number, hoverIndex: number) => void;
  selectedElement: string | null;
  onSelectElement: (id: string | null) => void;
  databaseConnection: DatabaseConnection | null;
  availableColumns: number;
  setAvailableColumns: (columns: number) => void;
  reportOrientation: 'portrait' | 'landscape';
}

const ReportBuilder: React.FC<Props> = ({
  elements,
  onUpdateElement,
  onUpdateElementConfig,
  onDeleteElement,
  onReorderElements,
  selectedElement,
  onSelectElement,
  databaseConnection,
  reportOrientation,
}) => {
  const [schema, setSchema] = useState(null);

  const [{ isOver }, drop] = useDrop({
    accept: 'component',
    drop: (item: { type: string, columnSpan?: number }) => {
      const newElement: ReportElementType = {
        id: `element-${Date.now()}`,
        type: item.type,
        config: {},
        position: { x: 0, y: elements.length * 250 },
        data: [],
        columnSpan: item.columnSpan || 1,
      };
      onUpdateElement(newElement.id, { ...newElement });
      onSelectElement(newElement.id);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  useEffect(() => {
    if (databaseConnection) {
      fetchSchema();
    }
  }, [databaseConnection]);

  const fetchSchema = async () => {
    try {
      const response = await axios.get('/api/db/schema');
      setSchema(response.data);
    } catch (error) {
      console.error('Failed to fetch schema:', error);
    }
  };

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
              border: isOver ? '2px dashed #2d87ea' : '2px dashed #d9d9d9',
              borderRadius: '8px',
              background: isOver ? 'rgba(45, 135, 234, 0.05)' : '#fafafa',
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
                color: '#999', 
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
                gridAutoFlow: 'row dense',
                gap: '16px',
                width: '100%',
                alignItems: 'start',
                maxWidth: '100%'
              }}>
                {elements.map((element, index) => (
                  <div
                    key={element.id}
                    style={{
                      gridColumn: `span ${element.columnSpan || 1}`,
                      width: '100%',
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

