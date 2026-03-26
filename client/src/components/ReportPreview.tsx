import React, { useRef } from 'react';
import { Modal, Typography, Button, Space } from 'antd';
import { ReportElement } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import ReportElementComponent from './ReportElement';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { generateHTML } from '../utils/htmlExporter';

const { Title } = Typography;

interface Props {
  visible: boolean;
  onClose: () => void;
  elements: ReportElement[];
  reportName?: string;
}

const ReportPreview: React.FC<Props> = ({ visible, onClose, elements, reportName = 'Report' }) => {
  const { tokens } = useTheme();
  const reportRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight; // shift image up by one page height
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${reportName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const handleEmailReport = () => {
    const subject = encodeURIComponent(`Report: ${reportName}`);
    const body = encodeURIComponent(`Please find the attached report: ${reportName}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleExportHTML = () => {
    const html = generateHTML(elements, reportName);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      title="Report Preview"
      open={visible}
      onCancel={onClose}
      width="90%"
      style={{ top: 20 }}
      footer={
        <Space>
          <Button onClick={handleExportPDF}>
            📄 Export as PDF
          </Button>
          <Button onClick={handleExportHTML}>
            🌐 Export as HTML
          </Button>
          <Button onClick={handleEmailReport}>
            📧 Open Email Draft
          </Button>
          <Button type="primary" onClick={onClose}>
            Close
          </Button>
        </Space>
      }
      styles={{ body: { padding: '24px', maxHeight: '80vh', overflow: 'auto' } }}
    >
      <div 
        ref={reportRef}
        style={{ 
          background: 'white', 
          padding: '24px', 
          borderRadius: '8px',
          minHeight: '400px'
        }}
      >
        <Title level={2} style={{ textAlign: 'center', marginBottom: '32px' }}>
          {reportName}
        </Title>
        
        {elements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: tokens.textSecondary }}>
            <p>No elements added to this report yet.</p>
            <p>Add components from the sidebar to see the preview.</p>
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
            {elements.map((element) => (
              <div 
                key={element.id} 
                style={{
                  gridColumn: `span ${element.columnSpan || 1}`,
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <ReportElementComponent
                  element={element}
                  schema={null}
                  databaseConnection={null}
                  isSelected={false}
                  onClick={() => {}}
                  onDelete={() => {}}
                  onUpdate={() => {}}
                  index={0}
                  onMoveElement={() => {}}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ReportPreview;

