import { ReportElement } from '../types';

/**
 * Generates a self-contained HTML string representing the report.
 * This is a lightweight export that renders data tables and metric cards
 * as plain HTML/CSS, without requiring React at runtime.
 */
export function generateHTML(elements: ReportElement[], reportName: string): string {
  const rows = elements
    .map((el) => {
      const span = el.columnSpan || 1;
      const cellContent = renderElement(el);
      return `<div style="grid-column: span ${span}; min-width: 0;">${cellContent}</div>`;
    })
    .join('\n    ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(reportName)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1a1a1a;
      background: #fff;
      margin: 0;
      padding: 0;
    }
    .report-wrapper {
      max-width: 960px;
      margin: 0 auto;
      padding: 32px 24px;
    }
    h1.report-title {
      text-align: center;
      margin-bottom: 32px;
      font-size: 28px;
      font-weight: 700;
      color: #111;
    }
    .report-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      width: 100%;
    }
    /* Element cards */
    .element-card {
      border: 1px solid #e8e8e8;
      border-radius: 8px;
      padding: 16px;
      background: #fff;
    }
    .element-card h2 {
      font-size: 14px;
      font-weight: 600;
      margin: 0 0 12px 0;
      color: #555;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    /* Header element */
    .el-header {
      font-weight: bold;
      word-wrap: break-word;
      line-height: 1.2;
    }
    /* Paragraph element */
    .el-paragraph {
      word-wrap: break-word;
      white-space: pre-wrap;
      line-height: 1.6;
    }
    /* Metric card */
    .el-metric {
      text-align: center;
      padding: 24px 16px;
    }
    .el-metric .metric-label {
      font-size: 12px;
      font-weight: 500;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }
    .el-metric .metric-value {
      font-size: 48px;
      font-weight: 700;
      line-height: 1;
    }
    /* Data table */
    .el-table table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .el-table thead tr {
      background: #f5f5f5;
    }
    .el-table th, .el-table td {
      border: 1px solid #e8e8e8;
      padding: 6px 10px;
      text-align: left;
    }
    .el-table th {
      font-weight: 600;
      white-space: nowrap;
    }
    .el-table tr:nth-child(even) td {
      background: #fafafa;
    }
    /* Chart placeholder */
    .el-chart-placeholder {
      background: #f9f9f9;
      border: 1px dashed #ccc;
      border-radius: 6px;
      padding: 40px;
      text-align: center;
      color: #999;
      font-size: 13px;
    }
    @media print {
      body { background: #fff; }
      .report-wrapper { padding: 16px; }
    }
  </style>
</head>
<body>
  <div class="report-wrapper">
    <h1 class="report-title">${escapeHtml(reportName)}</h1>
    <div class="report-grid">
    ${rows}
    </div>
  </div>
</body>
</html>`;
}

// ─── Per-element renderers ─────────────────────────────────────────────────

function renderElement(el: ReportElement): string {
  switch (el.type) {
    case 'header':
      return renderHeader(el);
    case 'paragraph':
      return renderParagraph(el);
    case 'metric-card':
      return renderMetricCard(el);
    case 'table':
      return renderTable(el);
    case 'bar-chart':
    case 'line-chart':
    case 'pie-chart':
      return renderChartPlaceholder(el);
    default:
      return `<div class="element-card"><em>Unknown element type: ${escapeHtml(el.type)}</em></div>`;
  }
}

function renderHeader(el: ReportElement): string {
  const text = el.config?.text || '';
  const fontSize = el.config?.size || el.config?.fontSize || '28px';
  return `<div class="el-header" style="font-size:${escapeHtml(fontSize)};">${escapeHtml(text)}</div>`;
}

function renderParagraph(el: ReportElement): string {
  const text = el.config?.text || '';
  const fontSize = el.config?.fontSize || '16px';
  const textAlign = el.config?.textAlign || 'left';
  const lineHeight = el.config?.lineHeight || '1.6';
  return `<div class="el-paragraph" style="font-size:${escapeHtml(fontSize)};text-align:${escapeHtml(textAlign)};line-height:${escapeHtml(lineHeight)};">${escapeHtml(text)}</div>`;
}

function renderMetricCard(el: ReportElement): string {
  const title = el.config?.title || '';
  const prefix = el.config?.prefix || '';
  const suffix = el.config?.suffix || '';
  const color = el.config?.color || '#3ECF8E';
  const fontSize = el.config?.fontSize || '48px';
  const valueField = el.config?.valueField;

  let displayValue: string | number = '—';
  if (el.data && el.data.length > 0) {
    if (valueField && el.data[0][valueField] !== undefined) {
      displayValue = el.data[0][valueField];
    } else {
      const firstRow = el.data[0];
      const numericKey = Object.keys(firstRow).find((k) => typeof firstRow[k] === 'number');
      if (numericKey !== undefined) displayValue = firstRow[numericKey];
    }
  }

  const formatted =
    typeof displayValue === 'number' ? displayValue.toLocaleString() : String(displayValue);

  return `<div class="element-card el-metric">
    ${title ? `<div class="metric-label">${escapeHtml(title)}</div>` : ''}
    <div class="metric-value" style="color:${escapeHtml(color)};font-size:${escapeHtml(fontSize)};">
      ${escapeHtml(prefix)}${escapeHtml(formatted)}${escapeHtml(suffix)}
    </div>
  </div>`;
}

function renderTable(el: ReportElement): string {
  const title = el.config?.title || '';
  const data: any[] = el.data || [];

  if (data.length === 0) {
    return `<div class="element-card el-table">
      ${title ? `<h2>${escapeHtml(title)}</h2>` : ''}
      <p style="color:#999;font-size:13px;">No data available</p>
    </div>`;
  }

  const keys = Object.keys(data[0]);
  const headerRow = keys.map((k) => `<th>${escapeHtml(k)}</th>`).join('');
  const bodyRows = data
    .map((row) => {
      const cells = keys
        .map((k) => `<td>${escapeHtml(String(row[k] ?? ''))}</td>`)
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('\n        ');

  return `<div class="element-card el-table">
    ${title ? `<h2>${escapeHtml(title)}</h2>` : ''}
    <table>
      <thead><tr>${headerRow}</tr></thead>
      <tbody>
        ${bodyRows}
      </tbody>
    </table>
  </div>`;
}

function renderChartPlaceholder(el: ReportElement): string {
  const title = el.config?.title || el.type;
  return `<div class="element-card el-chart-placeholder">
    ${title ? `<h2>${escapeHtml(title)}</h2>` : ''}
    <div>[${escapeHtml(el.type)} — chart not rendered in HTML export]</div>
  </div>`;
}

// ─── Utility ──────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
