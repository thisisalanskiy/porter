import React, { useState } from 'react';
import { Card, Form, Input, InputNumber, Switch, Button, message, Space } from 'antd';
import { DatabaseConnection as DbConnectionType } from '../types';
import axios from 'axios';

interface Props {
  onConnectionChange: (connection: DbConnectionType | null) => void;
}

const DatabaseConnection: React.FC<Props> = ({ onConnectionChange }) => {
  const [form] = Form.useForm();
  const [testing, setTesting] = useState(false);
  const [connected, setConnected] = useState(false);

  const testConnection = async (values: any) => {
    setTesting(true);
    try {
      const response = await axios.post('/api/db/connect', values);
      if (response.data.success) {
        message.success('Database connection successful!');
        setConnected(true);
        onConnectionChange(values);
      } else {
        message.error('Connection failed: ' + response.data.message);
        setConnected(false);
        onConnectionChange(null);
      }
    } catch (error: any) {
      message.error('Connection failed: ' + (error.response?.data?.message || error.message));
      setConnected(false);
      onConnectionChange(null);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      size="small"
      onFinish={testConnection}
      initialValues={{
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        database: 'reporter_db',
        ssl: false
      }}
    >
      <Form.Item
        name="host"
        label="Host"
        rules={[{ required: true, message: 'Please enter host' }]}
      >
        <Input placeholder="localhost" />
      </Form.Item>

      <Form.Item
        name="port"
        label="Port"
        rules={[{ required: true, message: 'Please enter port' }]}
      >
        <InputNumber min={1} max={65535} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        name="username"
        label="Username"
        rules={[{ required: true, message: 'Please enter username' }]}
      >
        <Input placeholder="postgres" />
      </Form.Item>

      <Form.Item
        name="password"
        label="Password"
        rules={[{ required: true, message: 'Please enter password' }]}
      >
        <Input.Password placeholder="Password" />
      </Form.Item>

      <Form.Item
        name="database"
        label="Database"
        rules={[{ required: true, message: 'Please enter database name' }]}
      >
        <Input placeholder="reporter_db" />
      </Form.Item>

      <Form.Item name="ssl" label="Use SSL" valuePropName="checked">
        <Switch />
      </Form.Item>

      <Form.Item>
        <Space style={{ width: '100%' }}>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={testing}
            block
          >
            Test Connection
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default DatabaseConnection;

