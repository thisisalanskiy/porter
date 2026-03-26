import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface MetricCardConfig {
  title?: string;
  prefix?: string;
  suffix?: string;
  valueField?: string;
  fontSize?: string;
  color?: string;
}

interface Props {
  data: any[];
  config: MetricCardConfig;
}

const MetricCard: React.FC<Props> = ({ data, config }) => {
  const { tokens } = useTheme();
  const {
    title = 'Metric',
    prefix = '',
    suffix = '',
    valueField,
    fontSize = '48px',
    color = tokens.accent,
  } = config;

  // Derive the displayed value
  let displayValue: string | number = '—';
  if (data && data.length > 0) {
    if (valueField && data[0][valueField] !== undefined) {
      displayValue = data[0][valueField];
    } else {
      // Fall back to the first numeric field in the first row
      const firstRow = data[0];
      const numericKey = Object.keys(firstRow).find(
        (k) => typeof firstRow[k] === 'number'
      );
      if (numericKey !== undefined) {
        displayValue = firstRow[numericKey];
      }
    }
  }

  // Format numbers with locale separators if numeric
  const formattedValue =
    typeof displayValue === 'number'
      ? displayValue.toLocaleString()
      : displayValue;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        textAlign: 'center',
        height: '100%',
        minHeight: '160px',
      }}
    >
      {title && (
        <div
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: tokens.textSecondary,
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {title}
        </div>
      )}
      <div
        style={{
          fontSize,
          fontWeight: 700,
          color,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {prefix}
        {formattedValue}
        {suffix}
      </div>
    </div>
  );
};

export default MetricCard;
