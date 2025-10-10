import { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Layout, Card, Space, Typography, Button, Modal, Input, message, Tag } from 'antd';
// Icons replaced with Unicode symbols for simplicity

import DatabaseConnection from './components/DatabaseConnection';
import ReportBuilder from './components/ReportBuilder';
import ComponentPalette from './components/ComponentPalette';
import ReportPreview from './components/ReportPreview';
import Workspace from './components/Workspace';
import SchedulePanel from './components/SchedulePanel';
import { ReportElement, ComponentType } from './types';

const { Header } = Layout;
const { Title } = Typography;

function App() {
  const [currentView, setCurrentView] = useState<'workspace' | 'builder'>('workspace');
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const [currentReportName, setCurrentReportName] = useState<string>('Untitled Report');
  const [databaseConnection, setDatabaseConnection] = useState<any>(null);
  const [reportElements, setReportElements] = useState<ReportElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSchedulePanel, setShowSchedulePanel] = useState(false);
  const [showDatabaseModal, setShowDatabaseModal] = useState(false);
  const [isReportSaved, setIsReportSaved] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [availableColumns, setAvailableColumns] = useState<number>(3); // Max available columns in current row
  const [reportOrientation, setReportOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // Autosave functionality
  useEffect(() => {
    if (currentReportId && reportElements.length > 0) {
      const autoSaveInterval = setInterval(() => {
        if (!isReportSaved) {
          const reportData = {
            id: currentReportId,
            name: currentReportName,
            elements: reportElements,
            updatedAt: new Date().toISOString(),
          };
          
          const existingReports = JSON.parse(localStorage.getItem('reports') || '[]');
          const reportIndex = existingReports.findIndex((r: any) => r.id === reportData.id);
          
          if (reportIndex >= 0) {
            existingReports[reportIndex] = { ...existingReports[reportIndex], ...reportData };
            localStorage.setItem('reports', JSON.stringify(existingReports));
            setLastAutoSave(new Date());
            console.log('Auto-saved report');
          }
        }
      }, 30000); // Auto-save every 30 seconds

      return () => clearInterval(autoSaveInterval);
    }
  }, [currentReportId, reportElements, currentReportName, isReportSaved]);

  const componentTypes: ComponentType[] = [
    {
      type: 'header',
      icon: <span>📝</span>,
      label: 'Header',
      description: 'Add a heading to your report'
    },
    {
      type: 'paragraph',
      icon: <span>📄</span>,
      label: 'Paragraph',
      description: 'Add text content to your report'
    },
    {
      type: 'table',
      icon: <span>📊</span>,
      label: 'Data Table',
      description: 'Display data in a table format'
    },
    {
      type: 'bar-chart',
      icon: <span>📊</span>,
      label: 'Bar Chart',
      description: 'Visualize data with vertical bars'
    },
    {
      type: 'line-chart',
      icon: <span>📈</span>,
      label: 'Line Chart',
      description: 'Show trends over time'
    },
    {
     	type: 'pie-chart',
      icon: <span>🥧</span>,
      label: 'Pie Chart',
      description: 'Display proportions and percentages'
    }
  ];

  const addElement = (type: string, columnSpan: number = 1) => {
    const newElement: ReportElement = {
      id: `element-${Date.now()}`,
      type,
      config: {},
      position: { x: 0, y: reportElements.length * 250 },
      data: [],
      columnSpan: columnSpan
    };
    setReportElements([...reportElements, newElement]);
    setIsReportSaved(false); // Mark as unsaved when adding elements
  };

  const updateElement = (id: string, updates: Partial<ReportElement>) => {
    setReportElements(elements =>
      elements.map(el => el.id === id ? { ...el, ...updates } : el)
    );
    setIsReportSaved(false); // Mark as unsaved when updating elements
  };

  const updateElementConfig = (id: string, updates: Partial<ReportElement>) => {
    setReportElements(elements =>
      elements.map(el => el.id === id ? { ...el, ...updates } : el)
    );
    // Don't mark as unsaved - this is just configuration update
  };

  const deleteElement = (id: string) => {
    setReportElements(elements => elements.filter(el => el.id !== id));
    if (selectedElement === id) {
      setSelectedElement(null);
    }
    setIsReportSaved(false); // Mark as unsaved when deleting elements
  };

  const reorderElements = (dragIndex: number, hoverIndex: number) => {
    setReportElements(elements => {
      const newElements = [...elements];
      const draggedElement = newElements[dragIndex];
      
      // Remove the dragged element
      newElements.splice(dragIndex, 1);
      // Insert it at the new position
      newElements.splice(hoverIndex, 0, draggedElement);
      
      return newElements;
    });
    setIsReportSaved(false); // Mark as unsaved when reordering elements
  };

  const exportReport = async (format: 'email' | 'pdf' | 'csv') => {
    if (format === 'email') {
      // Open email export modal
      setShowPreview(true);
    } else if (format === 'pdf') {
      // Open preview for PDF export
      setShowPreview(true);
    } else {
      // Handle CSV export
      console.log(`Exporting report as ${format}`);
    }
  };

  const handleSaveReport = async () => {
    setShowSaveModal(true);
  };

  const confirmSaveReport = async (name: string) => {
    try {
      const reportData = {
        id: currentReportId || `report-${Date.now()}`,
        name: name || currentReportName,
        elements: reportElements,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Save to localStorage for MVP (in production, this would be an API call)
      const existingReports = JSON.parse(localStorage.getItem('reports') || '[]');
      const reportIndex = existingReports.findIndex((r: any) => r.id === reportData.id);
      
      if (reportIndex >= 0) {
        existingReports[reportIndex] = reportData;
      } else {
        existingReports.push(reportData);
      }
      
      localStorage.setItem('reports', JSON.stringify(existingReports));
      
      console.log('Report saved:', reportData);
      console.log('All reports in localStorage:', existingReports);
      
      setCurrentReportId(reportData.id);
      setCurrentReportName(reportData.name);
      setIsReportSaved(true);
      setLastAutoSave(new Date());
      message.success(`Report "${reportData.name}" saved successfully!`);
      setShowSaveModal(false);
      
      // Trigger a custom event to notify workspace of new report
      window.dispatchEvent(new CustomEvent('reportSaved', { detail: reportData }));
    } catch (error) {
      message.error('Failed to save report');
    }
  };

  const handleNewReport = () => {
    setCurrentReportId(null);
    setCurrentReportName('Untitled Report');
    setReportElements([]);
    setIsReportSaved(false);
    setLastAutoSave(null);
    setAvailableColumns(3);
    setCurrentView('builder');
  };

  const handleOpenReport = (report: any) => {
    setCurrentReportId(report.id);
    setCurrentReportName(report.name);
    setReportElements(report.elements || []);
    setIsReportSaved(true);
    setLastAutoSave(new Date());
    setAvailableColumns(3);
    setCurrentView('builder');
  };

  if (currentView === 'workspace') {
    return (
      <Workspace 
        onNewReport={handleNewReport}
        onOpenReport={handleOpenReport}
      />
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <Layout style={{ height: '100vh' }}>
        <Header style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space align="center">
            <Button onClick={() => setCurrentView('workspace')}>
              ← Back to Workspace
            </Button>
            <Title level={4} style={{ margin: 0, color: '#333' }}>
              {currentReportName}
            </Title>
            {!isReportSaved && <Tag color="orange">Unsaved</Tag>}
          </Space>
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
            {lastAutoSave && <span style={{ fontSize: '12px', color: '#666' }}>Last saved: {lastAutoSave.toLocaleTimeString()}</span>}
          </div>
          <Space>
            <Button onClick={handleSaveReport}>
              💾 Save Report
            </Button>
            <Button 
              onClick={() => setShowPreview(true)}
              disabled={!isReportSaved}
              title={!isReportSaved ? 'Save report first to preview' : ''}
            >
              👁️ Preview
            </Button>
            <Button 
              onClick={() => setShowSchedulePanel(true)}
              disabled={!isReportSaved}
              title={!isReportSaved ? 'Save report first to schedule' : ''}
            >
              📅 Schedule
            </Button>
            <Button 
              onClick={() => exportReport('pdf')}
              disabled={!isReportSaved}
              title={!isReportSaved ? 'Save report first to export' : ''}
            >
              ⬇️ Export
            </Button>
            <Button 
              onClick={() => exportReport('email')}
              disabled={!isReportSaved}
              title={!isReportSaved ? 'Save report first to export' : ''}
            >
              📧 Email
            </Button>
          </Space>
        </Header>

        <div style={{ marginTop: 0, paddingTop: '16px', paddingLeft: '16px', paddingRight: '16px', display: 'flex', height: 'calc(100vh - 64px - 16px)', gap: '16px' }}>
          <div style={{ 
            width: '300px', 
            background: '#fff', 
            height: '100%', 
            overflow: 'auto',
            borderRadius: '8px',
            border: '1px solid #f0f0f0'
          }}>
            <div style={{ padding: '16px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 500 }}>Report Configuration</h3>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Card 
                  size="small" 
                  onClick={() => setShowDatabaseModal(true)}
                  style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                  className="database-card"
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>🗄️</span>
                      <span>Database Connection</span>
                    </div>
                    <Tag color={databaseConnection ? 'green' : 'default'} style={{ margin: 0 }}>
                      {databaseConnection ? 'Active' : 'Inactive'}
                    </Tag>
                  </div>
                </Card>
                
                <Card title="Report Layout" size="small">
                  <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    <Button 
                      type="default"
                      onClick={() => setReportOrientation('portrait')}
                      size="small"
                      style={{ 
                        flex: 1,
                        backgroundColor: reportOrientation === 'portrait' ? '#ffffff' : '#f5f5f5',
                        color: reportOrientation === 'portrait' ? '#333' : '#999',
                        border: reportOrientation === 'portrait' ? '1px solid #d9d9d9' : '1px solid transparent',
                        boxShadow: 'none'
                      }}
                    >
                      📄 Portrait
                    </Button>
                    <Button 
                      type="default"
                      onClick={() => setReportOrientation('landscape')}
                      size="small"
                      style={{ 
                        flex: 1,
                        backgroundColor: reportOrientation === 'landscape' ? '#ffffff' : '#f5f5f5',
                        color: reportOrientation === 'landscape' ? '#333' : '#999',
                        border: reportOrientation === 'landscape' ? '1px solid #d9d9d9' : '1px solid transparent',
                        boxShadow: 'none'
                      }}
                    >
                      📄 Landscape
                    </Button>
                  </div>
                </Card>
                
                <Card title="Components" size="small">
                  <ComponentPalette 
                    componentTypes={componentTypes}
                    onAddElement={addElement}
                    availableColumns={availableColumns}
                    setAvailableColumns={setAvailableColumns}
                  />
                </Card>
              </Space>
            </div>
          </div>

          <div style={{ flex: 1, background: '#f5f5f5' }}>
                <ReportBuilder
                  elements={reportElements}
                  onUpdateElement={updateElement}
                  onUpdateElementConfig={updateElementConfig}
                  onDeleteElement={deleteElement}
                  onReorderElements={reorderElements}
                  selectedElement={selectedElement}
                  onSelectElement={setSelectedElement}
                  databaseConnection={databaseConnection}
                  availableColumns={availableColumns}
                  setAvailableColumns={setAvailableColumns}
                  reportOrientation={reportOrientation}
                />
          </div>
        </div>
      </Layout>

      <ReportPreview 
        visible={showPreview}
        onClose={() => setShowPreview(false)}
        elements={reportElements}
        reportName={currentReportName}
      />

      <Modal
        title="Save Report"
        open={showSaveModal}
        onCancel={() => setShowSaveModal(false)}
        onOk={() => {
          const input = document.getElementById('report-name-input') as HTMLInputElement;
          if (input?.value) {
            confirmSaveReport(input.value);
          } else {
            message.error('Please enter a report name');
          }
        }}
      >
        <div style={{ marginBottom: '16px' }}>
          <label>Report Name:</label>
          <Input
            id="report-name-input"
            defaultValue={currentReportName}
            placeholder="Enter report name"
            style={{ marginTop: '8px' }}
            onPressEnter={() => {
              const input = document.getElementById('report-name-input') as HTMLInputElement;
              if (input?.value) {
                confirmSaveReport(input.value);
              } else {
                message.error('Please enter a report name');
              }
            }}
          />
        </div>
      </Modal>

      <SchedulePanel
        visible={showSchedulePanel}
        onClose={() => setShowSchedulePanel(false)}
        reportId={currentReportId}
        reportName={currentReportName}
      />

      <Modal
        title="Database Connection"
        open={showDatabaseModal}
        onCancel={() => setShowDatabaseModal(false)}
        footer={null}
        width={600}
      >
        <DatabaseConnection onConnectionChange={setDatabaseConnection} />
      </Modal>
    </DndProvider>
  );
}

export default App;

