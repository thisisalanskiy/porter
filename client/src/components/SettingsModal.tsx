import React from 'react';
import { Modal, Tabs, Segmented } from 'antd';
import { useTheme, ThemeMode } from '../contexts/ThemeContext';

interface Props {
  open: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<Props> = ({ open, onClose }) => {
  const { mode, setMode, tokens } = useTheme();

  return (
    <Modal title="Settings" open={open} onCancel={onClose} footer={null} width={480}>
      <Tabs
        items={[
          {
            key: 'appearance',
            label: 'Appearance',
            children: (
              <div style={{ padding: '8px 0 16px' }}>
                <div style={{ marginBottom: 12, fontWeight: 500, color: tokens.textPrimary }}>
                  Theme
                </div>
                <Segmented<ThemeMode>
                  value={mode}
                  onChange={setMode}
                  options={[
                    { label: '☀️  Light',  value: 'light'  },
                    { label: '🌙  Dark',   value: 'dark'   },
                    { label: '💻  System', value: 'system' },
                  ]}
                  block
                />
                <div style={{ marginTop: 8, fontSize: 12, color: tokens.textSecondary }}>
                  {mode === 'system'
                    ? 'Follows your OS appearance setting.'
                    : mode === 'dark'
                    ? 'Always use dark theme.'
                    : 'Always use light theme.'}
                </div>
              </div>
            ),
          },
        ]}
      />
    </Modal>
  );
};

export default SettingsModal;
