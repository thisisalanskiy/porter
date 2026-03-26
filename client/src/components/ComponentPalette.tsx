import { useState } from 'react';
import { useDrag } from 'react-dnd';
import { ComponentType } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  componentTypes: ComponentType[];
}

const GROUPS: { label: string; types: string[] }[] = [
  { label: 'Text', types: ['header', 'paragraph'] },
  { label: 'Data', types: ['table', 'bar-chart', 'line-chart', 'pie-chart'] },
];

const CONSTRAINTS: Record<string, string> = {
  'header':     '3 cols · fixed',
  'paragraph':  '1–3 cols',
  'table':      '1–3 cols',
  'bar-chart':  '1–3 cols',
  'line-chart': '1–3 cols',
  'pie-chart':  '1–3 cols',
};

const ComponentPalette: React.FC<Props> = ({ componentTypes }) => {
  const { tokens } = useTheme();
  const byType = Object.fromEntries(componentTypes.map((c) => [c.type, c]));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {GROUPS.map((group) => {
        const items = group.types.map((t) => byType[t]).filter(Boolean);
        if (!items.length) return null;
        return (
          <div key={group.label}>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              color: tokens.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 8,
            }}>
              {group.label}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
            }}>
              {items.map((component) => (
                <DraggableTile key={component.type} component={component} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface TileProps {
  component: ComponentType;
}

const DraggableTile: React.FC<TileProps> = ({ component }) => {
  const [hovered, setHovered] = useState(false);
  const { tokens } = useTheme();

  const [{ isDragging }, drag] = useDrag({
    type: 'component',
    item: { type: component.type, columnSpan: 1 },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const constraint = CONSTRAINTS[component.type];

  return (
    <div
      ref={drag}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        height: 92,
        borderRadius: 8,
        border: `1px solid ${hovered ? tokens.accent : tokens.borderDefault}`,
        background: hovered ? tokens.bgTileHover : tokens.bgTile,
        cursor: 'grab',
        opacity: isDragging ? 0.4 : 1,
        transition: 'border-color 0.15s, background 0.15s',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Icon + label — slide up on hover */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        transform: hovered && constraint ? 'translateY(-12px)' : 'translateY(0)',
        transition: 'transform 0.2s ease',
      }}>
        <span style={{ fontSize: 22, lineHeight: 1 }}>{component.icon}</span>
        <span style={{ fontSize: 12, fontWeight: 500, color: tokens.textPrimary, textAlign: 'center' }}>
          {component.label}
        </span>
      </div>
      {/* Constraint text — fades in at the bottom */}
      {constraint && (
        <span style={{
          position: 'absolute',
          bottom: 8,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 10,
          color: tokens.accent,
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateY(0)' : 'translateY(4px)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
        }}>
          {constraint}
        </span>
      )}
    </div>
  );
};

export default ComponentPalette;
