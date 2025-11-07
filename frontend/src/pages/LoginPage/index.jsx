// src/pages/LoginPage/index.jsx

import React, { useState } from 'react';
// 1. Import lại các component của Ant Design
import { Form, Input, Button, Card, Typography, App } from 'antd'; 
import { useNavigate } from 'react-router-dom';
import { loginAPI } from '../../services/auth.service';
import { setToken } from '../../utils/token';

const { Title, Text } = Typography;

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  // 2. Lấy 'message' từ hook 'useApp()' (Rất quan trọng!)
  const { message } = App.useApp(); 

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await loginAPI(values.username, values.password);
      const token = response.data.accessToken;
      setToken(token);

      setToken(token);
      message.success('Đăng nhập thành công!');
      navigate('/dashboard');
    } catch (error) {    
      console.log('LỖI ĐĂNG NHẬP:', error);
      message.error('Đăng nhập thất bại! Vui lòng kiểm tra lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // 5. Toàn bộ phần JSX dùng component của antd
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f0f2f5' 
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ marginBottom: 0, color: '#1890ff' }}>
            Ứng dụng quản lý kho hàng
          </Title>
          <Title level={3} style={{ marginTop: 4, color: '#1890ff' }}>
            và đơn nhập xuất
          </Title>
        </div>

        <Form
          name="login_form"
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="Tên đăng nhập"
            name="username"
            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
          >
            <Input size="large" />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password size="large" />
          </Form.Item>

          <div style={{ marginBottom: 24, textAlign: 'right' }}>
             <Text type="danger" style={{ cursor: 'pointer' }}>Quên mật khẩu?</Text>
          </div>

          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={loading} style={{ fontWeight: 600 }}>
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;