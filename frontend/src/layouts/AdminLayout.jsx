// src/layouts/AdminLayout.jsx

import React, { useState } from 'react';
import {
  DesktopOutlined,
  FileOutlined,
  PieChartOutlined,
  TeamOutlined,
  UserOutlined,
  LogoutOutlined, // Icon đăng xuất
} from '@ant-design/icons';
import { Breadcrumb, Layout, Menu, theme, Avatar, Space, Button, App } from 'antd';
import { Outlet, useNavigate } from 'react-router-dom';
import { removeToken } from '../utils/token'; // Import hàm xóa token

const { Header, Content, Footer, Sider } = Layout;

// Hàm tạo item cho menu
function getItem(label, key, icon, children) {
  return {
    key,
    icon,
    children,
    label,
  };
}

// Các mục menu (Dựa trên SRS của bạn)
const items = [
  getItem('Dashboard', '/dashboard', <PieChartOutlined />),
  getItem('Danh mục', 'sub1', <DesktopOutlined />, [
    getItem('Sản phẩm', '/products'),
    getItem('Kho hàng', '/warehouses'),
    getItem('Nhà cung cấp', '/suppliers'),
  ]),
  getItem('Nghiệp vụ', 'sub2', <TeamOutlined />, [
    getItem('Nhập kho', '/stock-in'), 
    getItem('Xuất kho', '/stock-out')
  ]),
  getItem('Báo cáo', '/reports', <FileOutlined />),
];

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { message } = App.useApp(); // Dùng hook message

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Xử lý khi nhấn vào menu
  const handleMenuClick = ({ key }) => {
    // key chính là đường dẫn (path) chúng ta đã định nghĩa ở 'items'
    navigate(key);
  };

  // Xử lý đăng xuất
  const handleLogout = () => {
    removeToken();
    message.success('Đã đăng xuất');
    navigate('/login');
  };

  return (
    <Layout
      style={{
        minHeight: '100vh',
      }}
    >
      {/* 1. Menu bên trái (Sider) */}
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', textAlign: 'center', lineHeight: '32px', color: 'white', borderRadius: '6px' }}>
          {collapsed ? 'KHO' : 'QUẢN LÝ KHO'}
        </div>
        <Menu
          theme="dark"
          defaultSelectedKeys={['/dashboard']}
          mode="inline"
          items={items}
          onClick={handleMenuClick} // Thêm sự kiện click
        />
      </Sider>

      {/* 2. Phần bên phải (Header + Content + Footer) */}
      <Layout>
        {/* 2.1. Header */}
        <Header
          style={{
            padding: '0 16px',
            background: colorBgContainer,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            {/* Có thể thêm Breadcrumb ở đây sau */}
          </div>
          <Space>
            <Avatar style={{ backgroundColor: '#87d068' }} icon={<UserOutlined />} />
            <span>Admin</span>
            <Button
              type="primary"
              danger
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              Đăng xuất
            </Button>
          </Space>
        </Header>

        {/* 2.2. Nội dung chính (Content) */}
        <Content
          style={{
            margin: '16px',
          }}
        >
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            {/* Đây là nơi các trang con (Dashboard, Products...) sẽ được render */}
            <Outlet />
          </div>
        </Content>

        {/* 2.3. Footer */}
        <Footer
          style={{
            textAlign: 'center',
          }}
        >
          Đồ án tốt nghiệp ©{new Date().getFullYear()} - Quản lý kho hàng
        </Footer>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;