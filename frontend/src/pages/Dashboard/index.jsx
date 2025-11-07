// src/pages/Dashboard/index.jsx

import React from 'react';
import { Typography } from 'antd';

const { Title, Paragraph } = Typography;

const Dashboard = () => {
  return (
    <div>
      <Title level={2}>Chào mừng đến với Dashboard</Title>
      <Paragraph>
        Đây là trang tổng quan hệ thống quản lý kho hàng.
      </Paragraph>
      <Paragraph>
        Bạn có thể sử dụng menu bên trái để điều hướng đến các chức năng chính.
      </Paragraph>
      {/* Không cần nút Đăng xuất ở đây nữa */}
    </div>
  );
};

export default Dashboard;