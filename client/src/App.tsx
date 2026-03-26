import { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Layout, Card, Space, Typography, Button, Modal, Input, message, Tag, ConfigProvider, theme as antTheme } from 'antd';

import DatabaseConnection from './components/DatabaseConnection';
import ReportBuilder from './components/ReportBuilder';
import ComponentPalette from './components/ComponentPalette';
import ReportPreview from './components/ReportPreview';
import Workspace from './components/Workspace';
import DataBrowser from './components/DataBrowser';
import SemanticLayerPanel from './components/SemanticLayerPanel';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { SemanticProvider } from './contexts/SemanticContext';
import { ReportElement, ComponentType, DatabaseSchema, QueryBuilderConfig } from './types';
import { buildSQL } from './utils/buildSQL';
import { useSemanticLayer } from './contexts/SemanticContext';
import axios from 'axios';

const { Header } = Layout;
const { Title } = Typography;

function AppInner() {
  const { tokens, isDark } = useTheme();
  const { semanticLayer } = useSemanticLayer();
  const [currentView, setCurrentView] = useState<'workspace' | 'builder'>('workspace');
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const [currentReportName, setCurrentReportName] = useState<string>('Untitled Report');
  const [databaseConnection, setDatabaseConnection] = useState<any>(null);
  const [dbSchema, setDbSchema] = useState<DatabaseSchema | null>(null);
  const [dbSchemaLoading, setDbSchemaLoading] = useState(false);
  const [reportElements, setReportElements] = useState<ReportElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showDatabaseModal, setShowDatabaseModal] = useState(false);
  const [showSemanticPanel, setShowSemanticPanel] = useState(false);
  const [isReportSaved, setIsReportSaved] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [saveModalName, setSaveModalName] = useState<string>('');
  const [reportOrientation, setReportOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [hoveredLayout, setHoveredLayout] = useState<'portrait' | 'landscape' | null>(null);

  // Autosave functionality
  useEffect(() => {
    if (!currentReportId) return;
    const autoSaveInterval = setInterval(() => {
      if (!isReportSaved) {
        try {
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
            setIsReportSaved(true);
          }
        } catch {
          // Autosave failed silently (e.g. storage quota exceeded)
        }
      }
    }, 30000);
    return () => clearInterval(autoSaveInterval);
  }, [currentReportId, reportElements, currentReportName, isReportSaved]);

  // On mount: restore saved connection and re-establish the server pool
  useEffect(() => {
    const saved = localStorage.getItem('dbConnection');
    if (!saved) return;
    const creds = JSON.parse(saved);
    axios.post('/api/db/connect', creds)
      .then(res => {
        if (res.data.success) setDatabaseConnection(creds);
        else localStorage.removeItem('dbConnection');
      })
      .catch(() => localStorage.removeItem('dbConnection'));
  }, []);

  // Persist connection credentials whenever they change
  useEffect(() => {
    if (databaseConnection) {
      localStorage.setItem('dbConnection', JSON.stringify(databaseConnection));
    } else {
      localStorage.removeItem('dbConnection');
    }
  }, [databaseConnection]);

  // Fetch schema whenever the database connection changes
  useEffect(() => {
    if (!databaseConnection) {
      setDbSchema(null);
      return;
    }
    const fetchSchema = async () => {
      setDbSchemaLoading(true);
      try {
        const response = await axios.get('/api/db/schema');
        setDbSchema(response.data);
      } catch (error) {
        console.error('Failed to fetch schema:', error);
        setDbSchema(null);
      } finally {
        setDbSchemaLoading(false);
      }
    };
    fetchSchema();
  }, [databaseConnection]);

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
    },
    {
      type: 'metric-card',
      icon: <span>🔢</span>,
      label: 'Metric Card',
      description: 'Display a single key number with label'
    }
  ];

  const addElement = (type: string, columnSpan: number = 1): string => {
    const id = `element-${Date.now()}`;
    const newElement: ReportElement = {
      id,
      type,
      config: {},
      position: { x: 0, y: reportElements.length * 250 },
      data: [],
      columnSpan: type === 'header' ? 3 : columnSpan,
    };
    setReportElements(prev => [...prev, newElement]);
    setIsReportSaved(false);
    return id;
  };

  const addElementWithData = (type: string, qbConfig: QueryBuilderConfig): string => {
    const id = `element-${Date.now()}`;
    const sql = buildSQL(qbConfig, semanticLayer.fields);
    const newElement: ReportElement = {
      id,
      type,
      config: {},
      position: { x: 0, y: reportElements.length * 250 },
      data: [],
      columnSpan: type === 'header' ? 3 : type === 'metric-card' ? 1 : 2,
      queryBuilderConfig: qbConfig,
      sql,
    };
    setReportElements(prev => [...prev, newElement]);
    setSelectedElement(id);
    setIsReportSaved(false);
    return id;
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
    setIsReportSaved(false);
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

  const handleSaveReport = () => {
    setSaveModalName(currentReportName);
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
    setCurrentView('builder');
  };

  const handleOpenReport = (report: any) => {
    setCurrentReportId(report.id);
    setCurrentReportName(report.name);
    setReportElements(report.elements || []);
    setIsReportSaved(true);
    setLastAutoSave(new Date());
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
        <Header style={{ background: tokens.bgPrimary, borderBottom: `1px solid ${tokens.borderSubtle}`, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space align="center">
            <Button onClick={() => setCurrentView('workspace')}>
              ← Back to Workspace
            </Button>
            <Title level={4} style={{ margin: 0, color: tokens.textPrimary }}>
              {currentReportName}
            </Title>
            {!isReportSaved && <Tag color="orange">Unsaved</Tag>}
          </Space>
          <Space>
            {lastAutoSave && (
              <span style={{ fontSize: '12px', color: tokens.textSecondary }}>
                Last saved: {lastAutoSave.toLocaleTimeString()}
              </span>
            )}
            <Button onClick={handleSaveReport}>
              💾 Save Report
            </Button>
            <Button onClick={() => setShowPreview(true)}>
              👁️ Preview
            </Button>
            <Button onClick={() => setShowSemanticPanel(true)}>
              🧠 Semantic
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

        <div style={{ marginTop: 0, paddingTop: '16px', paddingLeft: '16px', paddingRight: '16px', display: 'flex', height: 'calc(100vh - 64px - 16px)', gap: '16px', background: tokens.bgSecondary }}>
          <div style={{
            width: '300px',
            background: tokens.bgPrimary,
            height: '100%',
            overflow: 'auto',
            borderRadius: '8px',
            border: `1px solid ${tokens.borderSubtle}`
          }}>
            <div style={{ padding: '16px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 500, color: tokens.textPrimary }}>Report Configuration</h3>
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {([
                      { key: 'portrait',  icon: '📄', label: 'Portrait',  sub: 'Vertical · 800px',   iconStyle: {} },
                      { key: 'landscape', icon: '📄', label: 'Landscape', sub: 'Horizontal · 1000px', iconStyle: { display: 'inline-block', transform: 'rotate(90deg)' } },
                    ] as const).map(({ key, icon, label, sub, iconStyle }) => {
                      const active = reportOrientation === key;
                      const hovered = hoveredLayout === key;
                      return (
                        <div
                          key={key}
                          onClick={() => setReportOrientation(key)}
                          onMouseEnter={() => setHoveredLayout(key)}
                          onMouseLeave={() => setHoveredLayout(null)}
                          style={{
                            position: 'relative',
                            height: 92,
                            borderRadius: 8,
                            border: `1px solid ${active || hovered ? '#4096ff' : tokens.borderDefault}`,
                            background: active ? (isDark ? 'rgba(62,207,142,0.15)' : 'rgba(62,207,142,0.10)') : hovered ? tokens.bgTileHover : tokens.bgTile,
                            cursor: 'pointer',
                            overflow: 'hidden',
                            transition: 'border-color 0.15s, background 0.15s',
                            userSelect: 'none',
                          }}
                        >
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            transform: hovered ? 'translateY(-12px)' : 'translateY(0)',
                            transition: 'transform 0.2s ease',
                          }}>
                            <span style={{ fontSize: 22, lineHeight: 1, ...iconStyle }}>{icon}</span>
                            <span style={{ fontSize: 12, fontWeight: 500, color: active ? tokens.accent : tokens.textPrimary }}>
                              {label}
                            </span>
                          </div>
                          <span style={{
                            position: 'absolute',
                            bottom: 8,
                            left: 0,
                            right: 0,
                            textAlign: 'center',
                            fontSize: 10,
                            color: '#4096ff',
                            opacity: hovered ? 1 : 0,
                            transform: hovered ? 'translateY(0)' : 'translateY(4px)',
                            transition: 'opacity 0.2s ease, transform 0.2s ease',
                          }}>
                            {sub}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                <Card title="Components" size="small">
                  <ComponentPalette componentTypes={componentTypes} />
                </Card>

                {databaseConnection && (
                  <Card title="Data Browser" size="small" styles={{ body: { padding: 0 } }}>
                    <DataBrowser schema={dbSchema} loading={dbSchemaLoading} />
                  </Card>
                )}
              </Space>
            </div>
          </div>

          <div style={{ flex: 1, background: tokens.bgSecondary }}>
                <ReportBuilder
                  elements={reportElements}
                  onAddElement={addElement}
                  onAddElementWithData={addElementWithData}
                  onUpdateElement={updateElement}
                  onUpdateElementConfig={updateElementConfig}
                  onDeleteElement={deleteElement}
                  onReorderElements={reorderElements}
                  selectedElement={selectedElement}
                  onSelectElement={setSelectedElement}
                  databaseConnection={databaseConnection}
                  reportOrientation={reportOrientation}
                  schema={dbSchema}
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
          if (saveModalName.trim()) {
            confirmSaveReport(saveModalName.trim());
          } else {
            message.error('Please enter a report name');
          }
        }}
      >
        <div style={{ marginBottom: '16px' }}>
          <label>Report Name:</label>
          <Input
            value={saveModalName}
            onChange={(e) => setSaveModalName(e.target.value)}
            placeholder="Enter report name"
            style={{ marginTop: '8px' }}
            onPressEnter={() => {
              if (saveModalName.trim()) confirmSaveReport(saveModalName.trim());
            }}
            autoFocus
          />
        </div>
      </Modal>

      <Modal
        title="Database Connection"
        open={showDatabaseModal}
        onCancel={() => setShowDatabaseModal(false)}
        footer={null}
        width={600}
      >
        <DatabaseConnection onConnectionChange={setDatabaseConnection} onSuccess={() => setShowDatabaseModal(false)} />
      </Modal>

      <SemanticLayerPanel
        visible={showSemanticPanel}
        onClose={() => setShowSemanticPanel(false)}
        schema={dbSchema}
      />

    </DndProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <SemanticProvider>
        <AppWithConfig />
      </SemanticProvider>
    </ThemeProvider>
  );
}

function AppWithConfig() {
  const { isDark, tokens } = useTheme();
  return (
    <ConfigProvider theme={{
      algorithm: isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
      token: {
        colorPrimary:           tokens.accent,
        colorLink:              tokens.accent,
        colorTextBase:          isDark ? '#D0D6F0' : '#1A1C2E',
        colorBgBase:            isDark ? '#1A1A1A' : '#F4F5FA',
        colorBgContainer:       isDark ? '#242424' : '#FFFFFF',
        colorBgElevated:        isDark ? '#2A2A2A' : '#FFFFFF',
        colorBgLayout:          isDark ? '#141414' : '#F4F5FA',
        colorBorder:            isDark ? '#333333' : '#D5D8E8',
        colorBorderSecondary:   isDark ? '#2A2A2A' : '#E8EAF2',
        colorText:              isDark ? '#D0D6F0' : '#1A1C2E',
        colorTextSecondary:     isDark ? '#A8AECC' : '#586080',
      },
      components: {
        Button: {
          defaultBorderColor:   isDark ? '#333333' : '#D5D8E8',
          defaultColor:         isDark ? '#D0D6F0' : '#1A1C2E',
          defaultBg:            isDark ? '#242424' : '#FFFFFF',
        },
      },
    }}>
      <AppInner />
    </ConfigProvider>
  );
}

export default App;

