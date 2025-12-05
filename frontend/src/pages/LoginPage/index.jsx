// src/pages/LoginPage/index.jsx

import React, { useState } from "react";
import { Form, Input, Button, Card, Typography, App } from "antd";
import { useNavigate } from "react-router-dom";
import { loginAPI, getUserInfoAPI } from "../../services/auth.service"; // Import cả 2
import { setToken } from "../../utils/token";

const { Title, Text } = Typography;

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { message } = App.useApp();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // 1. Gọi API Đăng nhập
      const loginResponse = await loginAPI(values.username, values.password);

      // [!] ĐÃ SỬA LỖI Ở DÒNG NÀY (xóa chữ "E.g." bị thừa)
      const token = loginResponse.data.accessToken;
      setToken(token); // Lưu token ngay

      // 2. Gọi API Lấy Quyền/Thông tin
      const permissionsResponse = await getUserInfoAPI(token);

      // 3. GỘP KẾT QUẢ TỪ 2 API LẠI
      const userInfo = {
        hoTen: loginResponse.data.hoTen,
        tenDangNhap: loginResponse.data.tenDangNhap,
        email: loginResponse.data.email,
        quyen: permissionsResponse.data,
      };

      // 4. Lưu đối tượng ĐÃ GỘP vào localStorage
      localStorage.setItem("user_info", JSON.stringify(userInfo));

      // 5. Hoàn tất
      message.success("Đăng nhập thành công!");
      navigate("/dashboard");
    } catch (error) {
      console.log("LỖI ĐĂNG NHẬP HOẶC LẤY QUYỀN:", error);
      const errorMsg = error.response?.data?.message || "Đăng nhập thất bại!";
      message.error(errorMsg);
      setLoading(false);
    }
  };

  return (
    <div>
      {/* [!] SỬA LẠI TÊN FILE LOGO TẠI ĐÂY */}
      <img
        src="/images/Logo_STU.png"
        alt="STU Logo"
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          height: 100,
        }}
      />

      {/* Phần khung đăng nhập */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#f0f2f5",
        }}
      >
        <Card style={{ width: 400, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <Title
              level={3}
              style={{ marginBottom: 0, color: "#1890ff" }}
            >
              Ứng dụng quản lý kho hàng
            </Title>
            <Title
              level={3}
              style={{ marginTop: 4, color: "#1890ff" }}
            >
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
              rules={[
                { required: true, message: "Vui lòng nhập tên đăng nhập!" },
              ]}
            >
              <Input size="large" />
            </Form.Item>

            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
            >
              <Input.Password size="large" />
            </Form.Item>

            <div style={{ marginBottom: 24, textAlign: "right" }}>
              <Text
                type="danger"
                style={{ cursor: "pointer" }}
              >
                Quên mật khẩu?
              </Text>
            </div>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
                style={{ fontWeight: 600 }}
              >
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
