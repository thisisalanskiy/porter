import React, { useState, useEffect } from 'react';
import { Layout, Card, Row, Col, Button, Space, Typography, Modal, Input, message, Empty, Table, Breadcrumb, Segmented, Dropdown, Checkbox, Select, Tabs, Tag, Divider } from 'antd';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

interface Props {
  onNewReport: () => void;
  onOpenReport: (report: any) => void;
}

interface Folder {
  id: string;
  name: string;
  reports: string[];
}

const Workspace: React.FC<Props> = ({ onNewReport, onOpenReport }) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showNewScheduleModal, setShowNewScheduleModal] = useState(false);
  const [showEditScheduleModal, setShowEditScheduleModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [settingsTab, setSettingsTab] = useState('email');
  const [currentView, setCurrentView] = useState<'workspace' | 'schedule'>('workspace');
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [scheduleViewMode, setScheduleViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFolderForAction, setSelectedFolderForAction] = useState<any>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteConfirmCheckbox, setDeleteConfirmCheckbox] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{id: string | null, name: string}>>([
    { id: null, name: 'Workspace' }
  ]);

  useEffect(() => {
    loadWorkspaceData();
    
    // Listen for report save events to refresh the workspace
    const handleReportSaved = () => {
      loadWorkspaceData();
    };
    
    window.addEventListener('reportSaved', handleReportSaved);
    
    return () => {
      window.removeEventListener('reportSaved', handleReportSaved);
    };
  }, []);

  // Generate sample data only after initial load
  useEffect(() => {
    generateSampleData();
  }, [reports, folders]);

  const loadWorkspaceData = () => {
    const savedReports = JSON.parse(localStorage.getItem('reports') || '[]');
    const savedFolders = JSON.parse(localStorage.getItem('folders') || '[]');
    const savedSchedules = JSON.parse(localStorage.getItem('schedules') || '[]');
    const savedLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    
    console.log('Loading workspace data:', { savedReports, savedFolders });
    
    setReports(savedReports);
    setFolders(savedFolders);
    setSchedules(savedSchedules);
    setActivityLogs(savedLogs);
  };

  const addActivityLog = (action: string, details: string) => {
    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action,
      details,
      user: 'Current User' // In production, get from auth
    };
    const updatedLogs = [newLog, ...activityLogs];
    setActivityLogs(updatedLogs);
    localStorage.setItem('activityLogs', JSON.stringify(updatedLogs));
  };

  const generateSampleData = () => {
    // Only generate if no data exists in localStorage
    const existingReports = JSON.parse(localStorage.getItem('reports') || '[]');
    const existingFolders = JSON.parse(localStorage.getItem('folders') || '[]');
    
    if (existingReports.length === 0 && existingFolders.length === 0) {
      const sampleFolders = [
        { id: 'folder-1', name: 'Sales Reports', reports: ['report-1', 'report-2'] },
        { id: 'folder-2', name: 'Marketing Analytics', reports: ['report-3'] },
        { id: 'folder-3', name: 'Financial Dashboard', reports: ['report-4', 'report-5', 'report-6'] },
        { id: 'folder-4', name: 'HR Metrics', reports: ['report-7'] },
      ];

      const sampleReports = [
        {
          id: 'report-1',
          name: 'Q4 Sales Performance',
          elements: [
            { type: 'header', config: { text: 'Q4 Sales Overview' } },
            { type: 'bar-chart', config: { title: 'Monthly Revenue' } },
            { type: 'table', config: { title: 'Top Products' } }
          ],
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-20T14:45:00Z'
        },
        {
          id: 'report-2',
          name: 'Customer Acquisition Analysis',
          elements: [
            { type: 'header', config: { text: 'Customer Analysis' } },
            { type: 'line-chart', config: { title: 'Acquisition Trends' } },
            { type: 'pie-chart', config: { title: 'Channel Distribution' } }
          ],
          createdAt: '2024-01-10T09:15:00Z',
          updatedAt: '2024-01-18T16:20:00Z'
        },
        {
          id: 'report-3',
          name: 'Campaign ROI Report',
          elements: [
            { type: 'header', config: { text: 'Marketing ROI' } },
            { type: 'table', config: { title: 'Campaign Performance' } },
            { type: 'bar-chart', config: { title: 'ROI by Channel' } }
          ],
          createdAt: '2024-01-12T11:00:00Z',
          updatedAt: '2024-01-19T13:30:00Z'
        },
        {
          id: 'report-4',
          name: 'Monthly Financial Summary',
          elements: [
            { type: 'header', config: { text: 'Financial Overview' } },
            { type: 'table', config: { title: 'Revenue Breakdown' } },
            { type: 'line-chart', config: { title: 'Profit Trends' } }
          ],
          createdAt: '2024-01-08T08:45:00Z',
          updatedAt: '2024-01-17T15:10:00Z'
        },
        {
          id: 'report-5',
          name: 'Budget vs Actual',
          elements: [
            { type: 'header', config: { text: 'Budget Analysis' } },
            { type: 'bar-chart', config: { title: 'Budget Comparison' } },
            { type: 'table', config: { title: 'Variance Analysis' } }
          ],
          createdAt: '2024-01-05T14:20:00Z',
          updatedAt: '2024-01-16T12:00:00Z'
        },
        {
          id: 'report-6',
          name: 'Cash Flow Projection',
          elements: [
            { type: 'header', config: { text: 'Cash Flow Forecast' } },
            { type: 'line-chart', config: { title: 'Projected Cash Flow' } },
            { type: 'pie-chart', config: { title: 'Revenue Sources' } }
          ],
          createdAt: '2024-01-03T16:30:00Z',
          updatedAt: '2024-01-15T10:45:00Z'
        },
        {
          id: 'report-7',
          name: 'Employee Performance Review',
          elements: [
            { type: 'header', config: { text: 'Performance Metrics' } },
            { type: 'table', config: { title: 'Employee Scores' } },
            { type: 'bar-chart', config: { title: 'Department Performance' } }
          ],
          createdAt: '2024-01-14T13:15:00Z',
          updatedAt: '2024-01-21T09:30:00Z'
        },
        {
          id: 'report-8',
          name: 'Weekly Executive Summary',
          elements: [
            { type: 'header', config: { text: 'Executive Dashboard' } },
            { type: 'table', config: { title: 'Key Metrics' } },
            { type: 'bar-chart', config: { title: 'KPI Trends' } }
          ],
          createdAt: '2024-01-22T07:00:00Z',
          updatedAt: '2024-01-22T07:00:00Z'
        }
      ];

      const sampleSchedules = [
        {
          id: 'schedule-1',
          reportId: 'report-1',
          reportName: 'Q4 Sales Performance',
          frequency: 'weekly',
          time: '09:00',
          recipients: ['ceo@company.com', 'sales@company.com'],
          format: 'pdf',
          active: true,
          nextRun: '2024-01-29 09:00'
        },
        {
          id: 'schedule-2',
          reportId: 'report-4',
          reportName: 'Monthly Financial Summary',
          frequency: 'monthly',
          time: '08:00',
          recipients: ['cfo@company.com', 'finance@company.com'],
          format: 'email',
          active: true,
          nextRun: '2024-02-01 08:00'
        },
        {
          id: 'schedule-3',
          reportId: 'report-8',
          reportName: 'Weekly Executive Summary',
          frequency: 'daily',
          time: '07:00',
          recipients: ['ceo@company.com', 'board@company.com'],
          format: 'pdf',
          active: true,
          nextRun: '2024-01-23 07:00'
        }
      ];

      localStorage.setItem('folders', JSON.stringify(sampleFolders));
      localStorage.setItem('reports', JSON.stringify(sampleReports));
      localStorage.setItem('schedules', JSON.stringify(sampleSchedules));
      
      setFolders(sampleFolders);
      setReports(sampleReports);
      setSchedules(sampleSchedules);
    }
  };

  const createFolder = (name: string) => {
    const newFolder: Folder = {
      id: `folder-${Date.now()}`,
      name,
      reports: [],
    };
    
    const updatedFolders = [...folders, newFolder];
    setFolders(updatedFolders);
    localStorage.setItem('folders', JSON.stringify(updatedFolders));
    message.success(`Folder "${name}" created!`);
    setShowNewFolderModal(false);
  };

  const deleteReport = (reportId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    Modal.confirm({
      title: 'Delete Report',
      content: 'Are you sure you want to delete this report?',
      onOk: () => {
        const updatedReports = reports.filter(r => r.id !== reportId);
        setReports(updatedReports);
        localStorage.setItem('reports', JSON.stringify(updatedReports));
        
        // Remove from folders
        const updatedFolders = folders.map(f => ({
          ...f,
          reports: f.reports.filter(id => id !== reportId)
        }));
        setFolders(updatedFolders);
        localStorage.setItem('folders', JSON.stringify(updatedFolders));
        
        message.success('Report deleted');
      },
    });
  };

  const renameFolder = (folder: any) => {
    setSelectedFolderForAction(folder);
    setShowRenameModal(true);
  };

  const confirmRenameFolder = (newName: string) => {
    if (!newName.trim()) {
      message.error('Folder name cannot be empty');
      return;
    }

    const updatedFolders = folders.map(f => 
      f.id === selectedFolderForAction.id ? { ...f, name: newName } : f
    );
    setFolders(updatedFolders);
    localStorage.setItem('folders', JSON.stringify(updatedFolders));
    
    // Update breadcrumbs if we're currently in this folder
    if (currentFolder === selectedFolderForAction.id) {
      setBreadcrumbs([
        { id: null, name: 'Workspace' },
        { id: selectedFolderForAction.id, name: newName }
      ]);
    }
    
    addActivityLog('Rename Folder', `Renamed folder from "${selectedFolderForAction.name}" to "${newName}"`);
    message.success(`Folder renamed to "${newName}"`);
    setShowRenameModal(false);
    setSelectedFolderForAction(null);
  };

  const deleteFolder = (folder: any) => {
    setSelectedFolderForAction(folder);
    setDeleteConfirmText('');
    setDeleteConfirmCheckbox(false);
    setShowDeleteModal(true);
  };

  const confirmDeleteFolder = () => {
    if (deleteConfirmText !== 'DELETE') {
      message.error('Please type DELETE to confirm');
      return;
    }

    const folder = selectedFolderForAction;
    if (folder.reports.length > 0 && !deleteConfirmCheckbox) {
      message.error('Please confirm deletion of reports inside folder');
      return;
    }

    const updatedFolders = folders.filter(f => f.id !== folder.id);
    setFolders(updatedFolders);
    localStorage.setItem('folders', JSON.stringify(updatedFolders));
    
    // Also delete reports in the folder if confirmed
    if (folder.reports.length > 0 && deleteConfirmCheckbox) {
      const updatedReports = reports.filter(r => !folder.reports.includes(r.id));
      setReports(updatedReports);
      localStorage.setItem('reports', JSON.stringify(updatedReports));
    }
    
    addActivityLog('Delete Folder', `Deleted folder "${folder.name}"${folder.reports.length > 0 ? ` with ${folder.reports.length} reports` : ''}`);
    message.success('Folder deleted');
    setShowDeleteModal(false);
    setSelectedFolderForAction(null);
    
    if (currentFolder === folder.id) {
      setCurrentFolder(null);
      setBreadcrumbs([{ id: null, name: 'Workspace' }]);
    }
  };

  const renderScheduleView = () => {
    const runningSchedules = schedules.filter(s => s.active);
    const stoppedSchedules = schedules.filter(s => !s.active);
    const allSchedules = [...runningSchedules, ...stoppedSchedules];

    const renderScheduleGrid = () => (
      <Row gutter={[16, 16]}>
        {allSchedules.map((schedule) => (
          <Col key={schedule.id} xs={24} sm={12} md={8} lg={6}>
            <Card
              style={{ 
                height: '220px',
                border: '1px solid #d9d9d9',
                transition: 'all 0.2s ease'
              }}
              className="schedule-card"
              styles={{ body: { padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}
            >
              {/* Content Section */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                {/* Title */}
                <Title 
                  level={5} 
                  style={{ 
                    margin: 0, 
                    fontSize: '16px', 
                    lineHeight: '1.3', 
                    marginBottom: '12px',
                    textAlign: 'left',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word'
                  }}
                >
                  {schedule.reportName}
                </Title>
                
                {/* Status */}
                <div style={{ marginBottom: '8px', textAlign: 'left' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Status: <Text strong style={{ color: schedule.active ? '#52c41a' : '#ff4d4f' }}>
                      {schedule.active ? 'Active' : 'Stopped'}
                    </Text>
                  </Text>
                </div>
                
                {/* Calendar - When runs */}
                <div style={{ marginBottom: '4px', textAlign: 'left' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    📅 {schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1)} at {schedule.time}
                  </Text>
                </div>
                
                {/* Clock - Next run */}
                {schedule.active && (
                  <div style={{ marginBottom: '12px', textAlign: 'left' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      🕐 Next: {schedule.nextRun}
                    </Text>
                  </div>
                )}
              </div>
              
              {/* Divider */}
              <Divider style={{ margin: '12px 0 8px 0' }} />
              
              {/* Action Buttons - Always at bottom */}
              <div style={{ display: 'flex', justifyContent: 'flex-start', flexWrap: 'wrap', gap: '4px' }}>
                <Button
                  type="text"
                  size="small"
                  onClick={() => {
                    setSelectedSchedule(schedule);
                    setShowLogsModal(true);
                  }}
                  style={{ padding: '0 4px', fontSize: '12px' }}
                >
                  📊 Logs
                </Button>
                <Button
                  type="text"
                  size="small"
                  onClick={() => {
                    setSelectedSchedule(schedule);
                    setShowEditScheduleModal(true);
                  }}
                  style={{ padding: '0 4px', fontSize: '12px' }}
                >
                  ✏️ Edit
                </Button>
                {schedule.active ? (
                  <Button
                    type="text"
                    size="small"
                    onClick={() => {
                      const updatedSchedules = schedules.map(s =>
                        s.id === schedule.id ? { ...s, active: false } : s
                      );
                      setSchedules(updatedSchedules);
                      localStorage.setItem('schedules', JSON.stringify(updatedSchedules));
                      addActivityLog('Stop Schedule', `Stopped schedule for "${schedule.reportName}"`);
                      message.success('Schedule stopped');
                    }}
                    style={{ padding: '0 4px', fontSize: '12px' }}
                  >
                    ⏹️ Stop
                  </Button>
                ) : (
                  <Button
                    type="text"
                    size="small"
                    onClick={() => {
                      const updatedSchedules = schedules.map(s =>
                        s.id === schedule.id ? { ...s, active: true } : s
                      );
                      setSchedules(updatedSchedules);
                      localStorage.setItem('schedules', JSON.stringify(updatedSchedules));
                      addActivityLog('Start Schedule', `Started schedule for "${schedule.reportName}"`);
                      message.success('Schedule started');
                    }}
                    style={{ padding: '0 4px', fontSize: '12px' }}
                  >
                    ▶️ Start
                  </Button>
                )}
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    );

    const renderScheduleList = () => (
      <Table
        dataSource={allSchedules}
        columns={[
          {
            title: 'Status',
            dataIndex: 'active',
            key: 'status',
            width: 100,
            render: (active: boolean) => (
              <Text strong style={{ color: active ? '#52c41a' : '#ff4d4f' }}>
                {active ? 'Active' : 'Stopped'}
              </Text>
            ),
            filters: [
              { text: 'Active', value: true },
              { text: 'Stopped', value: false }
            ],
            onFilter: (value, record) => record.active === value
          },
          {
            title: 'Report Name',
            dataIndex: 'reportName',
            key: 'reportName',
            sorter: (a, b) => a.reportName.localeCompare(b.reportName)
          },
          {
            title: 'Frequency',
            dataIndex: 'frequency',
            key: 'frequency',
            width: 120,
            render: (frequency: string) => frequency.charAt(0).toUpperCase() + frequency.slice(1),
            filters: [
              { text: 'Daily', value: 'daily' },
              { text: 'Weekly', value: 'weekly' },
              { text: 'Monthly', value: 'monthly' }
            ],
            onFilter: (value, record) => record.frequency === value
          },
          {
            title: 'Time',
            dataIndex: 'time',
            key: 'time',
            width: 100
          },
          {
            title: 'Next Run',
            dataIndex: 'nextRun',
            key: 'nextRun',
            width: 150,
            render: (nextRun: string, record) => record.active ? nextRun : '-'
          },
          {
            title: 'Recipients',
            dataIndex: 'recipients',
            key: 'recipients',
            render: (recipients: string[]) => recipients?.length || 0
          },
          {
            title: 'Actions',
            key: 'actions',
            width: 150,
            render: (_, record) => (
              <Space>
                <Button
                  type="text"
                  size="small"
                  onClick={() => {
                    setSelectedSchedule(record);
                    setShowLogsModal(true);
                  }}
                >
                  📊 Logs
                </Button>
                <Button
                  type="text"
                  size="small"
                  onClick={() => {
                    setSelectedSchedule(record);
                    setShowEditScheduleModal(true);
                  }}
                >
                  ✏️ Edit
                </Button>
                {record.active ? (
                  <Button
                    type="text"
                    size="small"
                    onClick={() => {
                      const updatedSchedules = schedules.map(s =>
                        s.id === record.id ? { ...s, active: false } : s
                      );
                      setSchedules(updatedSchedules);
                      localStorage.setItem('schedules', JSON.stringify(updatedSchedules));
                      addActivityLog('Stop Schedule', `Stopped schedule for "${record.reportName}"`);
                      message.success('Schedule stopped');
                    }}
                  >
                    ⏹️ Stop
                  </Button>
                ) : (
                  <Button
                    type="text"
                    size="small"
                    onClick={() => {
                      const updatedSchedules = schedules.map(s =>
                        s.id === record.id ? { ...s, active: true } : s
                      );
                      setSchedules(updatedSchedules);
                      localStorage.setItem('schedules', JSON.stringify(updatedSchedules));
                      addActivityLog('Start Schedule', `Started schedule for "${record.reportName}"`);
                      message.success('Schedule started');
                    }}
                  >
                    ▶️ Start
                  </Button>
                )}
              </Space>
            )
          }
        ]}
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: 'No schedules yet' }}
      />
    );

    return (
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Row align="middle" style={{ position: 'relative' }}>
          <Col>
            <Space>
              <Text style={{ fontSize: '16px', fontWeight: 500 }}>📅 Scheduled Reports</Text>
            </Space>
          </Col>
          <Col style={{ 
            position: 'absolute', 
            left: '50%', 
            transform: 'translateX(-50%)',
            zIndex: 1
          }}>
            <Segmented
              options={[
                { label: '⊞ Grid', value: 'grid' },
                { label: '☰ List', value: 'list' },
              ]}
              value={scheduleViewMode}
              onChange={(value) => setScheduleViewMode(value as 'grid' | 'list')}
            />
          </Col>
          <Col style={{ marginLeft: 'auto' }}>
            <Button onClick={() => setShowNewScheduleModal(true)} type="default">
              ➕ New Schedule
            </Button>
          </Col>
        </Row>

        {allSchedules.length === 0 ? (
          <Empty
            description="No schedules yet"
            style={{ marginTop: '100px' }}
          >
            <Button type="primary" onClick={() => setShowNewScheduleModal(true)}>
              ➕ Create Schedule
            </Button>
          </Empty>
        ) : (
          scheduleViewMode === 'grid' ? renderScheduleGrid() : renderScheduleList()
        )}
      </Space>
    );
  };

  const openFolder = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (folder) {
      setCurrentFolder(folderId);
      setBreadcrumbs([
        { id: null, name: 'Workspace' },
        { id: folderId, name: folder.name }
      ]);
    }
  };

  const navigateToBreadcrumb = (id: string | null) => {
    setCurrentFolder(id);
    if (id === null) {
      setBreadcrumbs([{ id: null, name: 'Workspace' }]);
    } else {
      const folder = folders.find(f => f.id === id);
      if (folder) {
        setBreadcrumbs([
          { id: null, name: 'Workspace' },
          { id: folder.id, name: folder.name }
        ]);
      }
    }
  };

  const getReportsInFolder = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return [];
    return reports.filter(r => folder.reports.includes(r.id));
  };

  const getCurrentFolders = () => {
    return currentFolder === null ? folders : [];
  };

  const getCurrentReports = () => {
    if (currentFolder === null) {
      // Show reports not in any folder
      const allFolderReports = folders.flatMap(f => f.reports);
      return reports.filter(r => !allFolderReports.includes(r.id));
    } else {
      return getReportsInFolder(currentFolder);
    }
  };

  const displayFolders = getCurrentFolders();
  const displayReports = getCurrentReports();

  const renderGridView = () => (
    <Row gutter={[16, 16]}>
      {/* Folders */}
      {displayFolders.map((folder) => (
        <Col key={folder.id} xs={24} sm={12} md={8} lg={6}>
          <div style={{ position: 'relative' }} className="folder-card-wrapper">
            <Card
              onClick={() => openFolder(folder.id)}
              style={{ 
                height: '200px', 
                display: 'flex', 
                flexDirection: 'column',
                border: '1px solid #d9d9d9',
                transition: 'all 0.2s ease'
              }}
              styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' } }}
              className="folder-card"
            >
              <div style={{ textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '16px' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>
                  📁
                </div>
                <div className="hover-actions" style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                  {folder.reports.length} item{folder.reports.length !== 1 ? 's' : ''}
                </div>
                <Title level={5} style={{ margin: 0, fontSize: '16px', lineHeight: '1.2' }}>
                  {folder.name}
                </Title>
              </div>
            </Card>
            
            {/* Hover Actions Overlay */}
            <div 
              className="folder-trash-button"
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                opacity: 0,
                transition: 'opacity 0.2s ease',
                zIndex: 10
              }}
            >
              <Button
                type="text"
                size="small"
                danger
                onClick={(e) => {
                  e.stopPropagation();
                  deleteFolder(folder);
                }}
                className="grid-delete-button"
                style={{ 
                  padding: '4px 12px',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                🗑️ Delete
              </Button>
            </div>
          </div>
        </Col>
      ))}

      {/* Reports */}
      {displayReports.map((report) => (
        <Col key={report.id} xs={24} sm={12} md={8} lg={6}>
          <div style={{ position: 'relative' }} className="report-card-wrapper">
            <Card
              onClick={() => onOpenReport(report)}
              style={{ 
                height: '200px', 
                display: 'flex', 
                flexDirection: 'column',
                border: '1px solid #d9d9d9',
                transition: 'all 0.2s ease'
              }}
              styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' } }}
              className="report-card"
            >
              <div style={{ textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '16px' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>
                  📊
                </div>
                <div className="hover-actions" style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                  {report.elements?.length || 0} elements • {new Date(report.updatedAt).toLocaleDateString()}
                </div>
                <Title level={5} style={{ 
                  margin: 0, 
                  fontSize: '16px', 
                  lineHeight: '1.2',
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  whiteSpace: 'nowrap'
                }}>
                  {report.name}
                </Title>
              </div>
            </Card>
            
            {/* Hover Actions Overlay */}
            <div 
              className="report-trash-button"
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                opacity: 0,
                transition: 'opacity 0.2s ease',
                zIndex: 10
              }}
            >
              <Button
                type="text"
                size="small"
                danger
                onClick={(e) => {
                  e.stopPropagation();
                  deleteReport(report.id);
                }}
                className="grid-delete-button"
                style={{ 
                  padding: '4px 12px',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                🗑️ Delete
              </Button>
            </div>
          </div>
        </Col>
      ))}
    </Row>
  );

  const renderListView = () => {
    const dataSource = [
      ...displayFolders.map(folder => ({
        key: folder.id,
        type: 'folder',
        icon: '📁',
        name: folder.name,
        elements: folder.reports.length,
        dateCreated: '-',
        dateUpdated: '-',
        owner: 'You',
        data: folder
      })),
      ...displayReports.map(report => ({
        key: report.id,
        type: 'report',
        icon: '📊',
        name: report.name,
        elements: report.elements?.length || 0,
        dateCreated: new Date(report.createdAt || Date.now()).toLocaleString(),
        dateUpdated: new Date(report.updatedAt).toLocaleString(),
        owner: 'You',
        data: report
      }))
    ];

    const columns = [
      {
        title: '',
        dataIndex: 'icon',
        key: 'icon',
        width: 50,
        render: (icon: string) => <span style={{ fontSize: '24px' }}>{icon}</span>
      },
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        sorter: (a: any, b: any) => a.name.localeCompare(b.name),
      },
      {
        title: 'Type',
        dataIndex: 'type',
        key: 'type',
        width: 100,
        render: (type: string) => (
          <span style={{ textTransform: 'capitalize' }}>{type}</span>
        ),
        filters: [
          { text: 'Folder', value: 'folder' },
          { text: 'Report', value: 'report' },
        ],
        onFilter: (value: any, record: any) => record.type === value,
      },
      {
        title: 'Items/Elements',
        dataIndex: 'elements',
        key: 'elements',
        width: 120,
        sorter: (a: any, b: any) => a.elements - b.elements,
      },
      {
        title: 'Date Created',
        dataIndex: 'dateCreated',
        key: 'dateCreated',
        width: 180,
        sorter: (a: any, b: any) => new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime(),
      },
      {
        title: 'Date Updated',
        dataIndex: 'dateUpdated',
        key: 'dateUpdated',
        width: 180,
        sorter: (a: any, b: any) => new Date(a.dateUpdated).getTime() - new Date(b.dateUpdated).getTime(),
      },
      {
        title: 'Owner',
        dataIndex: 'owner',
        key: 'owner',
        width: 100,
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 150,
        render: (_: any, record: any) => (
          <Space>
            {record.type === 'folder' ? (
              <>
                <Button
                  type="text"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    openFolder(record.key);
                  }}
                >
                  📂 Open
                </Button>
                <Button
                  type="text"
                  size="small"
                  danger
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFolder(record.key);
                  }}
                >
                  🗑️
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="text"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenReport(record.data);
                  }}
                >
                  ✏️ Edit
                </Button>
                <Button
                  type="text"
                  size="small"
                  danger
                  onClick={(e) => deleteReport(record.key, e)}
                >
                  🗑️
                </Button>
              </>
            )}
          </Space>
        ),
      },
    ];

    return (
      <Table
        dataSource={dataSource}
        columns={columns}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        onRow={(record) => ({
          onClick: () => {
            if (record.type === 'folder') {
              openFolder(record.key);
            } else {
              onOpenReport(record.data);
            }
          },
          style: { cursor: 'pointer' }
        })}
      />
    );
  };

  return (
    <Layout style={{ height: '100vh', background: '#f5f5f5' }}>
      <Header style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '0 24px' }}>
        <Row justify="space-between" align="middle" style={{ height: '100%' }}>
          <Col>
            <Space align="center">
              <Title level={3} style={{ margin: 0, color: '#2d87ea' }}>
                📄 Porter
              </Title>
              <Tag color="blue">BETA</Tag>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button 
                type={currentView === 'workspace' ? 'primary' : 'default'}
                onClick={() => setCurrentView('workspace')}
              >
                📂 Workspace
              </Button>
              <Button 
                type={currentView === 'schedule' ? 'primary' : 'default'}
                onClick={() => setCurrentView('schedule')}
              >
                📅 Schedule
              </Button>
            </Space>
          </Col>
          <Col>
            <Space>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'report',
                      label: '📊 Report',
                      onClick: onNewReport
                    },
                    {
                      key: 'folder',
                      label: '📁 Folder',
                      onClick: () => {
                        if (currentFolder === null) {
                          setShowNewFolderModal(true);
                        }
                      }
                    },
                    {
                      key: 'schedule',
                      label: '📅 Schedule',
                      onClick: () => setShowNewScheduleModal(true)
                    }
                  ]
                }}
                trigger={['click']}
                placement="bottomRight"
              >
                <Button>
                  ➕ New
                </Button>
              </Dropdown>
              <Button onClick={() => setShowSettingsModal(true)}>
                ⚙️ Settings
              </Button>
            </Space>
          </Col>
        </Row>
      </Header>

      <Content style={{ padding: '24px' }}>
        {currentView === 'schedule' ? (
          renderScheduleView()
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* Breadcrumbs and Controls */}
            <Row align="middle" style={{ position: 'relative' }}>
              <Col>
              <Breadcrumb
                items={breadcrumbs.map((crumb) => ({
                  title: (
                    <span
                      style={{
                        cursor: 'pointer',
                        color: '#666',
                        fontWeight: crumb.id === null ? 500 : 'normal',
                        fontSize: '16px',
                        lineHeight: '24px',
                        userSelect: 'none',
                        display: 'inline-flex',
                        alignItems: 'center'
                      }}
                      onClick={() => navigateToBreadcrumb(crumb.id)}
                    >
                      {crumb.id === null ? '🏠 Workspace' : crumb.name}
                    </span>
                  )
                }))}
              />
              </Col>
              <Col style={{ 
                position: 'absolute', 
                left: '50%', 
                transform: 'translateX(-50%)',
                zIndex: 1
              }}>
                <Segmented
                  options={[
                    { label: '⊞ Grid', value: 'grid' },
                    { label: '☰ List', value: 'list' },
                  ]}
                  value={viewMode}
                  onChange={(value) => setViewMode(value as 'grid' | 'list')}
                />
              </Col>
              <Col style={{ marginLeft: 'auto' }}>
                <Space>
                  <Button onClick={onNewReport}>
                    ➕ New Report
                  </Button>
                  {currentFolder === null && (
                    <Button onClick={() => setShowNewFolderModal(true)}>
                      📁 New Folder
                    </Button>
                  )}
                </Space>
              </Col>
            </Row>

            {/* Content Area */}
            {displayFolders.length === 0 && displayReports.length === 0 ? (
              <Empty
                description={currentFolder === null ? "No reports or folders yet" : "This folder is empty"}
                style={{ marginTop: '100px' }}
              >
                {currentFolder === null ? (
                  <Space>
                    <Button onClick={() => setShowNewFolderModal(true)}>
                      ➕ Create Folder
                    </Button>
                    <Button type="primary" onClick={onNewReport}>
                      ➕ Create Report
                    </Button>
                  </Space>
                ) : (
                  <Button type="primary" onClick={onNewReport}>
                    Create Report in this Folder
                  </Button>
                )}
              </Empty>
            ) : (
              viewMode === 'grid' ? renderGridView() : renderListView()
            )}
          </Space>
        )}
      </Content>

      <Modal
        title="Create New Folder"
        open={showNewFolderModal}
        onCancel={() => setShowNewFolderModal(false)}
        onOk={() => {
          const input = document.getElementById('folder-name-input') as HTMLInputElement;
          if (input?.value) {
            createFolder(input.value);
          }
        }}
      >
        <Input
          id="folder-name-input"
          placeholder="Enter folder name"
          style={{ marginTop: '8px' }}
        />
      </Modal>

      <Modal
        title="Rename Folder"
        open={showRenameModal}
        onCancel={() => {
          setShowRenameModal(false);
          setSelectedFolderForAction(null);
        }}
        onOk={() => {
          const input = document.getElementById('rename-folder-input') as HTMLInputElement;
          if (input?.value) {
            confirmRenameFolder(input.value);
          }
        }}
      >
        <Input
          id="rename-folder-input"
          placeholder="Enter new folder name"
          defaultValue={selectedFolderForAction?.name}
          style={{ marginTop: '8px' }}
        />
      </Modal>

      <Modal
        title="Delete Folder"
        open={showDeleteModal}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedFolderForAction(null);
          setDeleteConfirmText('');
          setDeleteConfirmCheckbox(false);
        }}
        onOk={confirmDeleteFolder}
        okText="Delete Folder"
        okButtonProps={{ danger: true }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>Are you sure you want to delete "{selectedFolderForAction?.name}"?</Text>
          </div>
          
          {selectedFolderForAction?.reports.length > 0 && (
            <div style={{ padding: '12px', background: '#fff7e6', borderRadius: '6px', border: '1px solid #ffd591' }}>
              <Text type="warning">
                ⚠️ This folder contains {selectedFolderForAction.reports.length} report(s).
              </Text>
              <div style={{ marginTop: '8px' }}>
                <Checkbox
                  checked={deleteConfirmCheckbox}
                  onChange={(e) => setDeleteConfirmCheckbox(e.target.checked)}
                >
                  I want to delete the folder and all reports inside
                </Checkbox>
              </div>
            </div>
          )}
          
          <div>
            <Text>Type <Text code>DELETE</Text> to confirm:</Text>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE here"
              style={{ marginTop: '8px' }}
            />
          </div>
        </Space>
      </Modal>

      <Modal
        title="New Schedule"
        open={showNewScheduleModal}
        onCancel={() => setShowNewScheduleModal(false)}
        onOk={() => {
          // Handle new schedule creation
          setShowNewScheduleModal(false);
        }}
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>Select Report or Folder:</Text>
            <Select
              style={{ width: '100%', marginTop: '8px' }}
              placeholder="Choose a report or folder to schedule"
            >
              {reports.map(report => (
                <Select.Option key={report.id} value={report.id}>
                  📊 {report.name}
                </Select.Option>
              ))}
              {folders.map(folder => (
                <Select.Option key={folder.id} value={folder.id}>
                  📁 {folder.name} ({folder.reports.length} reports)
                </Select.Option>
              ))}
            </Select>
          </div>

          <div>
            <Text strong>Frequency:</Text>
            <Select
              style={{ width: '100%', marginTop: '8px' }}
              defaultValue="daily"
            >
              <Select.Option value="daily">Daily</Select.Option>
              <Select.Option value="weekly">Weekly</Select.Option>
              <Select.Option value="monthly">Monthly</Select.Option>
            </Select>
          </div>

          <div>
            <Text strong>Time:</Text>
            <Input
              type="time"
              style={{ width: '100%', marginTop: '8px' }}
              defaultValue="09:00"
            />
          </div>

          <div>
            <Text strong>Recipients (comma-separated emails):</Text>
            <Input.TextArea
              rows={3}
              style={{ marginTop: '8px' }}
              placeholder="user1@example.com, user2@example.com"
            />
          </div>
        </Space>
      </Modal>

      <Modal
        title="Edit Schedule"
        open={showEditScheduleModal}
        onCancel={() => {
          setShowEditScheduleModal(false);
          setSelectedSchedule(null);
        }}
        onOk={() => {
          addActivityLog('Edit Schedule', `Edited schedule for "${selectedSchedule?.reportName}"`);
          message.success('Schedule updated');
          setShowEditScheduleModal(false);
          setSelectedSchedule(null);
        }}
        width={600}
      >
        {selectedSchedule && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>Report:</Text>
              <div style={{ marginTop: '8px', padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                📊 {selectedSchedule.reportName}
              </div>
            </div>

            <div>
              <Text strong>Frequency:</Text>
              <Select
                style={{ width: '100%', marginTop: '8px' }}
                defaultValue={selectedSchedule.frequency}
              >
                <Select.Option value="daily">Daily</Select.Option>
                <Select.Option value="weekly">Weekly</Select.Option>
                <Select.Option value="monthly">Monthly</Select.Option>
              </Select>
            </div>

            <div>
              <Text strong>Time:</Text>
              <Input
                type="time"
                style={{ width: '100%', marginTop: '8px' }}
                defaultValue={selectedSchedule.time}
              />
            </div>

            <div>
              <Text strong>Recipients (comma-separated emails):</Text>
              <Input.TextArea
                rows={3}
                style={{ marginTop: '8px' }}
                defaultValue={selectedSchedule.recipients?.join(', ')}
                placeholder="user1@example.com, user2@example.com"
              />
            </div>
          </Space>
        )}
      </Modal>

      <Modal
        title="Settings"
        open={showSettingsModal}
        onCancel={() => setShowSettingsModal(false)}
        footer={null}
        width={700}
      >
        <Tabs
          activeKey={settingsTab}
          onChange={setSettingsTab}
          items={[
            {
              key: 'email',
              label: '📧 Email Integration',
              children: (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text type="secondary">Configure your email provider for sending reports</Text>
                  </div>

                  <div>
                    <Text strong>Email Provider:</Text>
                    <Select
                      style={{ width: '100%', marginTop: '8px' }}
                      placeholder="Select your email provider"
                    >
                      <Select.Option value="gmail">Gmail</Select.Option>
                      <Select.Option value="outlook">Outlook</Select.Option>
                      <Select.Option value="yahoo">Yahoo</Select.Option>
                      <Select.Option value="custom">Custom SMTP</Select.Option>
                    </Select>
                  </div>

                  <div>
                    <Text strong>Email Address:</Text>
                    <Input
                      type="email"
                      style={{ width: '100%', marginTop: '8px' }}
                      placeholder="your-email@example.com"
                    />
                  </div>

                  <div>
                    <Text strong>App Password / API Key:</Text>
                    <Input.Password
                      style={{ width: '100%', marginTop: '8px' }}
                      placeholder="Enter your app password or API key"
                    />
                  </div>

                  <div>
                    <Button type="primary" style={{ width: '100%' }}>
                      🔗 Connect Email Account
                    </Button>
                  </div>
                </Space>
              )
            },
            {
              key: 'logs',
              label: '📋 Activity Logs',
              children: (
                <div>
                  <div style={{ marginBottom: '16px' }}>
                    <Text type="secondary">View all changes made by users</Text>
                  </div>
                  <Table
                    dataSource={activityLogs}
                    columns={[
                      {
                        title: 'Timestamp',
                        dataIndex: 'timestamp',
                        key: 'timestamp',
                        render: (timestamp: string) => new Date(timestamp).toLocaleString(),
                        width: 180
                      },
                      {
                        title: 'User',
                        dataIndex: 'user',
                        key: 'user',
                        width: 120
                      },
                      {
                        title: 'Action',
                        dataIndex: 'action',
                        key: 'action',
                        width: 140
                      },
                      {
                        title: 'Details',
                        dataIndex: 'details',
                        key: 'details'
                      }
                    ]}
                    pagination={{ pageSize: 10 }}
                    size="small"
                    locale={{ emptyText: 'No activity logs yet' }}
                  />
                </div>
              )
            }
          ]}
        />
      </Modal>

      <Modal
        title="Schedule Execution Logs"
        open={showLogsModal}
        onCancel={() => {
          setShowLogsModal(false);
          setSelectedSchedule(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setShowLogsModal(false);
            setSelectedSchedule(null);
          }}>
            Close
          </Button>
        ]}
        width={700}
      >
        {selectedSchedule && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>Report: </Text>
              <Text>{selectedSchedule.reportName}</Text>
            </div>
            
            <Divider style={{ margin: '12px 0' }} />
            
            <div>
              <Title level={5}>Execution History</Title>
              <Table
                dataSource={[
                  {
                    key: '1',
                    executedAt: '2024-01-22 09:00:00',
                    status: 'Success',
                    recipientsSent: selectedSchedule.recipients?.length || 0,
                    recipientsTotal: selectedSchedule.recipients?.length || 0,
                    duration: '2.3s'
                  },
                  {
                    key: '2',
                    executedAt: '2024-01-21 09:00:00',
                    status: 'Success',
                    recipientsSent: selectedSchedule.recipients?.length || 0,
                    recipientsTotal: selectedSchedule.recipients?.length || 0,
                    duration: '2.1s'
                  },
                  {
                    key: '3',
                    executedAt: '2024-01-20 09:00:00',
                    status: 'Success',
                    recipientsSent: selectedSchedule.recipients?.length || 0,
                    recipientsTotal: selectedSchedule.recipients?.length || 0,
                    duration: '2.5s'
                  }
                ]}
                columns={[
                  {
                    title: 'Executed At',
                    dataIndex: 'executedAt',
                    key: 'executedAt',
                    width: 160
                  },
                  {
                    title: 'Status',
                    dataIndex: 'status',
                    key: 'status',
                    width: 100,
                    render: (status: string) => (
                      <Text strong style={{ color: status === 'Success' ? '#52c41a' : '#ff4d4f' }}>
                        {status}
                      </Text>
                    )
                  },
                  {
                    title: 'Recipients',
                    key: 'recipients',
                    width: 120,
                    render: (_, record) => `${record.recipientsSent}/${record.recipientsTotal}`
                  },
                  {
                    title: 'Duration',
                    dataIndex: 'duration',
                    key: 'duration',
                    width: 100
                  }
                ]}
                pagination={false}
                size="small"
              />
            </div>
            
            <div style={{ marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '6px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                📧 Recipients: {selectedSchedule.recipients?.join(', ') || 'None configured'}
              </Text>
            </div>
          </Space>
        )}
      </Modal>

    </Layout>
  );
};

export default Workspace;
