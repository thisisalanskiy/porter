import React, { useState } from 'react';
import { Modal, Form, Input, Select, Button, message } from 'antd';
import { ReportElement } from '../types';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Props {
  elements: ReportElement[];
  onExport: (format: 'email' | 'pdf' | 'csv') => void;
}

const { TextArea } = Input;

const ExportPanel: React.FC<Props> = ({ elements, onExport }) => {
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm();
  const [exporting, setExporting] = useState(false);

  const handleExport = async (values: any) => {
    setExporting(true);
    try {
      if (values.format === 'email') {
        await axios.post('/api/reports/1/email', {
          emails: [values.email],
          subject: values.subject || 'Report from Reporter',
          content: values.message || 'Please find your report attached.',
        });
        message.success('Email sent successfully!');
      } else if (values.format === 'pdf') {
        await exportToPDF();
        message.success('PDF exported successfully!');
      } else if (values.format === 'csv') {
        await exportToCSV();
        message.success('CSV exported successfully!');
      }
      
      setVisible(false);
      form.resetFields();
    } catch (error: any) {
      message.error('Export failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;

    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF();
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save('report.pdf');
  };

  const exportToCSV = () => {
    const csvData: any[] = [];
    
    elements.forEach((element) => {
      if (element.type === 'table' && element.data) {
        element.data.forEach(row => {
          csvData.push(row);
        });
      }
    });

    if (csvData.length === 0) {
      message.warning('No table data to export');
      return;
    }

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <Button
        onClick={() => setVisible(true)}
        disabled={elements.length === 0}
      >
        📤 Export Report
      </Button>

      <Modal
        title="Export Report"
        open={visible}
        onCancel={() => {
          setVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleExport}
        >
          <Form.Item
            name="format"
            label="Export Format"
            rules={[{ required: true, message: 'Please select export format' }]}
            initialValue="email"
          >
            <Select>
              <Select.Option value="email">Email</Select.Option>
              <Select.Option value="pdf">PDF</Select.Option>
              <Select.Option value="csv">CSV</Select.Option>
            </Select>
          </Form.Item>

          {form.getFieldValue('format') === 'email' && (
            <>
              <Form.Item
                name="email"
                label="Recipient Email"
                rules={[
                  { required: true, message: 'Please enter email address' },
                  { type: 'email', message: 'Please enter valid email' }
                ]}
              >
                <Input placeholder="user@example.com" />
              </Form.Item>

              <Form.Item
                name="subject"
                label="Subject"
                initialValue="Report from Reporter"
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="message"
                label="Message"
                initialValue="Please find your report attached."
              >
                <TextArea rows={4} />
              </Form.Item>
            </>
          )}

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={exporting}
              block
            >
              {exporting ? 'Exporting...' : 'Export Report'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ExportPanel;

