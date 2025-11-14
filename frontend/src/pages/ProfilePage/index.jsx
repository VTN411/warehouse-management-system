// src/pages/ProfilePage/index.jsx

import React, { useState, useEffect } from "react";
import { Card, Descriptions, Spin, Alert, message } from "antd";
import * as authService from "../../services/auth.service";

const ProfilePage = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setLoading(true);
        // Gọi API để lấy thông tin user (đã tự đính kèm token)
        const response = await authService.getUserInfoAPI();
        
        // Dữ liệu trả về từ API (dựa trên Postman của bạn)
        setUserInfo(response.data); 
      } catch (err) {
        console.error("Lỗi khi lấy thông tin tài khoản:", err);
        setError("Không thể tải thông tin tài khoản.");
        message.error("Không thể tải thông tin tài khoản!");
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []); // [] = Chạy 1 lần khi component mount

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return <Alert message="Lỗi" description={error} type="error" showIcon />;
  }

  if (!userInfo) {
    return <Alert message="Không tìm thấy thông tin người dùng." type="warning" />;
  }

  // Hiển thị thông tin
  return (
    <Card title="Thông tin tài khoản">
      <Descriptions bordered column={1}>
        <Descriptions.Item label="Họ Tên">
          {userInfo.hoTen}
        </Descriptions.Item>
        <Descriptions.Item label="Tên Đăng Nhập">
          {userInfo.tenDangNhap}
        </Descriptions.Item>
        <Descriptions.Item label="Email">
          {userInfo.email}
        </Descriptions.Item>
        <Descriptions.Item label="Số Điện Thoại">
          {userInfo.sdt}
        </Descriptions.Item>
        <Descriptions.Item label="Vai Trò">
          {userInfo.tenVaiTro}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

export default ProfilePage;