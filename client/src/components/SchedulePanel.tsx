import React, { useState, useEffect } from 'react';
import { Drawer, Card, Space, Button, Typography, Modal, Form, Input, Select, TimePicker, message, Tag, Empty } from 'antd';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Props {
  visible: boolean;
  onClose: () => void;
  reportId: string | null;
  reportName: string;
}

interface ScheduledReport {
  id: string;
  reportId: string;
  reportName: string;
  frequency: string;
  time: string;
  recipients: string[];
  format: 'pdf' | 'email' | 'csv';
  active: boolean;
  nextRun: string;
}

const SchedulePanel: React.FC<Props> = ({ visible, onClose, reportId, reportName }) => {
  const [schedules, setSchedules] = useState<ScheduledReport[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      loadSchedules();
    }
  }, [visible]);

  const loadSchedules = () => {
    const savedSchedules = JSON.parse(localStorage.getItem('schedules') || '[]');
    setSchedules(savedSchedules);
  };

  const addSchedule = (values: any) => {
    const newSchedule: ScheduledReport = {
      id: `schedule-${Date.now()}`,
      reportId: reportId || 'unknown',
      reportName: reportName || 'Untitled Report',
      frequency: values.frequency,
      time: values.time ? values.time.format('HH:mm') : '09:00',
      recipients: values.recipients.split(',').map((s: string) => s.trim()),
      format: values.format,
      active: true,
      nextRun: calculateNextRun(values.frequency, values.time),
    };

    const updatedSchedules = [...schedules, newSchedule];
    setSchedules(updatedSchedules);
    localStorage.setItem('schedules', JSON.stringify(updatedSchedules));
    message.success('Schedule created successfully!');
    setShowAddModal(false);
    form.resetFields();
  };

  const calculateNextRun = (frequency: string, time: any) => {
    const now = dayjs();
    const scheduledTime = time || dayjs().hour(9).minute(0);
    
    switch (frequency) {
      case 'daily':
        return now.hour(scheduledTime.hour()).minute(scheduledTime.minute()).add(1, 'day').format('YYYY-MM-DD HH:mm');
      case 'weekly':
        return now.hour(scheduledTime.hour()).minute(scheduledTime.minute()).add(7, 'day').format('YYYY-MM-DD HH:mm');
      case 'monthly':
        return now.hour(scheduledTime.hour()).minute(scheduledTime.minute()).add(1, 'month').format('YYYY-MM-DD HH:mm');
      default:
        return now.add(1, 'day').format('YYYY-MM-DD HH:mm');
    }
  };

  const toggleSchedule = (scheduleId: string) => {
    const updatedSchedules = schedules.map(s =>
      s.id === scheduleId ? { ...s, active: !s.active } : s
    );
    setSchedules(updatedSchedules);
    localStorage.setItem('schedules', JSON.stringify(updatedSchedules));
    message.success('Schedule updated');
  };

  const deleteSchedule = (scheduleId: string) => {
    Modal.confirm({
      title: 'Delete Schedule',
      content: 'Are you sure you want to delete this schedule?',
      onOk: () => {
        const updatedSchedules = schedules.filter(s => s.id !== scheduleId);
        setSchedules(updatedSchedules);
        localStorage.setItem('schedules', JSON.stringify(updatedSchedules));
        message.success('Schedule deleted');
      },
    });
  };

  return (
    <>
      <Drawer
        title={
          <div>
            <Title level={4} style={{ margin: 0 }}>
              📅 Scheduled Reports
            </Title>
            <Text type="secondary">Manage automated report delivery</Text>
          </div>
        }
        placement="right"
        width={500}
        onClose={onClose}
        open={visible}
        extra={
          <Button type="primary" onClick={() => setShowAddModal(true)}>
            ➕ Add Schedule
          </Button>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {schedules.length === 0 ? (
            <Empty
              description="No scheduled reports yet"
              style={{ marginTop: '50px' }}
            >
              <Button type="primary" onClick={() => setShowAddModal(true)}>
                Create First Schedule
              </Button>
            </Empty>
          ) : (
            schedules.map((schedule) => (
              <Card
                key={schedule.id}
                size="small"
                title={
                  <Space>
                    <span>{schedule.reportName}</span>
                    <Tag color={schedule.active ? 'green' : 'default'}>
                      {schedule.active ? 'Active' : 'Paused'}
                    </Tag>
                  </Space>
                }
                extra={
                  <Space>
                    <Button
                      type="text"
                      size="small"
                      onClick={() => toggleSchedule(schedule.id)}
                    >
                      {schedule.active ? '⏸️' : '▶️'}
                    </Button>
                    <Button
                      type="text"
                      size="small"
                      danger
                      onClick={() => deleteSchedule(schedule.id)}
                    >
                      🗑️
                    </Button>
                  </Space>
                }
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text strong>Frequency:</Text> {schedule.frequency}
                  </div>
                  <div>
                    <Text strong>Time:</Text> {schedule.time}
                  </div>
                  <div>
                    <Text strong>Format:</Text> {schedule.format.toUpperCase()}
                  </div>
                  <div>
                    <Text strong>Recipients:</Text>
                    <div style={{ marginTop: '4px' }}>
                      {schedule.recipients.map((email, idx) => (
                        <Tag key={idx}>{email}</Tag>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Next run: {schedule.nextRun}
                    </Text>
                  </div>
                </Space>
              </Card>
            ))
          )}
        </Space>
      </Drawer>

      <Modal
        title="Schedule Report"
        open={showAddModal}
        onCancel={() => {
          setShowAddModal(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={addSchedule}
          initialValues={{
            frequency: 'daily',
            format: 'pdf',
          }}
        >
          <Form.Item
            name="frequency"
            label="Frequency"
            rules={[{ required: true, message: 'Please select frequency' }]}
          >
            <Select>
              <Select.Option value="daily">Daily</Select.Option>
              <Select.Option value="weekly">Weekly</Select.Option>
              <Select.Option value="monthly">Monthly</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="time"
            label="Time"
            rules={[{ required: true, message: 'Please select time' }]}
          >
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="format"
            label="Export Format"
            rules={[{ required: true, message: 'Please select format' }]}
          >
            <Select>
              <Select.Option value="pdf">PDF</Select.Option>
              <Select.Option value="email">Email (HTML)</Select.Option>
              <Select.Option value="csv">CSV</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="recipients"
            label="Recipients (comma-separated emails)"
            rules={[{ required: true, message: 'Please enter recipients' }]}
          >
            <TextArea
              rows={3}
              placeholder="user1@example.com, user2@example.com"
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default SchedulePanel;
