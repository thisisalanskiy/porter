import React, { useState } from 'react';
import { Input, Typography, Empty, Spin, Tag } from 'antd';
import { useDrag } from 'react-dnd';
import { DatabaseSchema } from '../types';
import { useTheme } from '../contexts/ThemeContext';

const { Search } = Input;
const { Text } = Typography;

interface Props {
  schema: DatabaseSchema | null;
  loading?: boolean;
  onColumnClick?: (tableName: string, columnName: string) => void;
}

// Map Postgres data types to short labels and colors
const dataTypeTag = (dataType: string) => {
  const t = dataType.toLowerCase();
  if (t.includes('int') || t.includes('numeric') || t.includes('float') || t.includes('double') || t.includes('decimal') || t === 'real') {
    return <Tag color="blue" style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px', marginLeft: 4 }}>num</Tag>;
  }
  if (t.includes('char') || t.includes('text') || t === 'name' || t === 'uuid') {
    return <Tag color="green" style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px', marginLeft: 4 }}>str</Tag>;
  }
  if (t.includes('date') || t.includes('time') || t.includes('interval')) {
    return <Tag color="orange" style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px', marginLeft: 4 }}>date</Tag>;
  }
  if (t === 'boolean' || t === 'bool') {
    return <Tag color="purple" style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px', marginLeft: 4 }}>bool</Tag>;
  }
  return <Tag style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px', marginLeft: 4 }}>{dataType.slice(0, 4)}</Tag>;
};

interface ColumnRowProps {
  tableName: string;
  columnName: string;
  dataType: string;
  isNullable: string;
  onColumnClick?: (tableName: string, columnName: string) => void;
  tokens: any;
}

const ColumnRow: React.FC<ColumnRowProps> = ({ tableName, columnName, dataType, isNullable, onColumnClick, tokens }) => {
  const [hovered, setHovered] = useState(false);
  const [{ isDragging }, drag] = useDrag({
    type: 'db-column',
    item: { tableName, columnName, dataType },
    collect: monitor => ({ isDragging: monitor.isDragging() }),
  });

  return (
    <div
      ref={drag as any}
      onClick={() => onColumnClick?.(tableName, columnName)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '3px 8px 3px 28px',
        fontSize: 12,
        cursor: 'grab',
        display: 'flex',
        alignItems: 'center',
        borderRadius: 4,
        opacity: isDragging ? 0.5 : 1,
        background: hovered ? (tokens.bgTileHover || 'rgba(0,0,0,0.04)') : 'transparent',
      }}
    >
      <span>{columnName}</span>
      {dataTypeTag(dataType)}
      {isNullable === 'YES' && (
        <span style={{ fontSize: 10, color: tokens.textSecondary, marginLeft: 4 }}>null</span>
      )}
    </div>
  );
};

interface TableSectionProps {
  tableName: string;
  columns: Array<{ column_name: string; data_type: string; is_nullable: string }>;
  defaultExpanded?: boolean;
  onColumnClick?: (tableName: string, columnName: string) => void;
  tokens: any;
}

const TableSection: React.FC<TableSectionProps> = ({ tableName, columns, defaultExpanded = false, onColumnClick, tokens }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [hovered, setHovered] = useState(false);
  const [{ isDragging }, drag] = useDrag({
    type: 'db-table',
    item: { tableName },
    collect: monitor => ({ isDragging: monitor.isDragging() }),
  });

  return (
    <div style={{ opacity: isDragging ? 0.5 : 1, marginBottom: 2 }}>
      <div
        ref={drag as any}
        onClick={() => setExpanded(v => !v)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          padding: '5px 8px',
          cursor: 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: 4,
          userSelect: 'none',
          background: hovered ? (tokens.bgTileHover || 'rgba(0,0,0,0.04)') : 'transparent',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 500 }}>
          {tableName}
          <span style={{ marginLeft: 6, fontSize: 11, color: tokens.textSecondary }}>({columns.length} cols)</span>
        </span>
        <span style={{ fontSize: 10, color: tokens.textSecondary }}>{expanded ? '▾' : '▸'}</span>
      </div>
      {expanded && (
        <div>
          {columns.map(col => (
            <ColumnRow
              key={col.column_name}
              tableName={tableName}
              columnName={col.column_name}
              dataType={col.data_type}
              isNullable={col.is_nullable}
              onColumnClick={onColumnClick}
              tokens={tokens}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const DataBrowser: React.FC<Props> = ({ schema, loading = false, onColumnClick }) => {
  const { tokens } = useTheme();
  const [searchText, setSearchText] = useState('');

  if (loading) {
    return (
      <div style={{ padding: '16px', textAlign: 'center' }}>
        <Spin size="small" />
        <div style={{ marginTop: 8, fontSize: 12, color: tokens.textSecondary }}>Loading schema…</div>
      </div>
    );
  }

  if (!schema || Object.keys(schema).length === 0) {
    return (
      <div style={{ padding: '16px' }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span style={{ fontSize: 12, color: tokens.textSecondary }}>
              Connect a database to browse tables
            </span>
          }
        />
      </div>
    );
  }

  const search = searchText.toLowerCase().trim();

  const filteredTables = Object.entries(schema).filter(([tableName, tableInfo]) => {
    if (!search) return true;
    if (tableName.toLowerCase().includes(search)) return true;
    return tableInfo.columns.some(col => col.column_name.toLowerCase().includes(search));
  });

  return (
    <div style={{ padding: '8px 12px' }}>
      <Search
        placeholder="Search tables & columns"
        value={searchText}
        onChange={e => setSearchText(e.target.value)}
        size="small"
        allowClear
        style={{ marginBottom: 10 }}
      />
      {filteredTables.length === 0 ? (
        <Text style={{ fontSize: 12, color: tokens.textSecondary }}>No results for "{searchText}"</Text>
      ) : (
        <div>
          {filteredTables.map(([tableName, tableInfo]) => {
            const matchesTable = tableName.toLowerCase().includes(search);
            const filteredColumns = search && !matchesTable
              ? tableInfo.columns.filter(col => col.column_name.toLowerCase().includes(search))
              : tableInfo.columns;
            return (
              <TableSection
                key={tableName}
                tableName={tableName}
                columns={filteredColumns}
                defaultExpanded={!!search}
                onColumnClick={onColumnClick}
                tokens={tokens}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DataBrowser;
