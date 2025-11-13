// src/layouts/AdminLayout.jsx

// 1. Thêm import { useEffect } và { useLocation }
import React, { useState, useEffect } from "react";
import {
  DesktopOutlined,
  FileOutlined,
  PieChartOutlined,
  TeamOutlined,
  UserOutlined, // 2. Thêm icon UserOutlined
  LogoutOutlined,
} from "@ant-design/icons";
// 3. Thêm import { App } và { Dropdown } (nếu bạn chưa có)
import { Layout, Menu, theme, Avatar, Dropdown, Space, App } from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { removeToken } from "../utils/token";

const { Header, Content, Footer, Sider } = Layout;

function getItem(label, key, icon, children) {
  return { key, icon, children, label };
}

// 4. Tách các menu ra
// Menu mà ai cũng thấy
const baseMenuItems = [
  getItem("Dashboard", "/dashboard", <PieChartOutlined />),
  getItem("Danh mục", "sub1", <DesktopOutlined />, [
    getItem("Sản phẩm", "/products"),
    getItem("Kho hàng", "/warehouses"),
    getItem("Nhà cung cấp", "/suppliers"),
  ]),
  getItem("Nhập xuất", "sub2", <TeamOutlined />, [
    getItem("Nhập kho", "/stock-in"),
    getItem("Xuất kho", "/stock-out"),
  ]),
  getItem("Báo cáo", "/reports", <FileOutlined />),
];

// Menu CHỈ Admin thấy
const adminMenuItems = [
  getItem("Quản lý Người dùng", "/admin/users", <UserOutlined />),
];

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const navigate = useNavigate();
  const location = useLocation(); // 5. Thêm useLocation
  const { message } = App.useApp(); // 6. Thêm App.useApp()

  // 7. State để lưu thông tin user và menu
  const [currentUser, setCurrentUser] = useState(null);
  const [menuItems, setMenuItems] = useState(baseMenuItems); // Menu động

  // 8. Lấy thông tin user và xây dựng menu KHI component tải
  useEffect(() => {
    let user = null;
    const storedUser = localStorage.getItem("user_info");
    if (storedUser) {
      user = JSON.parse(storedUser);
      setCurrentUser(user);
    }

    // [!] LOGIC PHÂN QUYỀN ĐÃ SỬA LẠI
    // Thay vì kiểm tra "vai trò", chúng ta kiểm tra "quyền"
    if (user && user.quyen && user.quyen.includes("PERM_ADMIN_CREATE_USER")) {
      // Nếu user có quyền 'PERM_ADMIN_CREATE_USER'
      setMenuItems([...baseMenuItems, ...adminMenuItems]);
    } else {
      // Nếu không, chỉ dùng menu cơ bản
      setMenuItems(baseMenuItems);
    }
  }, []); // [] nghĩa là chỉ chạy 1 lần khi layout được tải

  // 9. Sửa lại hàm click menu (đã có trong file bạn)
  const onClickMenu = (e) => {
    navigate(e.key);
  };

  // 10. Cập nhật hàm Logout
  const handleLogout = () => {
    removeToken();
    localStorage.removeItem("user_info"); // Xóa user khi logout
    message.success("Đăng xuất thành công!");
    navigate("/login");
  };

  // 11. Menu dropdown (hiển thị tên)
  const userMenu = [
    { key: "1", label: "Thông tin tài khoản", icon: <UserOutlined /> },
    { type: "divider" },
    {
      key: "logout",
      label: "Đăng xuất",
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
      >
        {/* Logo/Tiêu đề Sider */}
        <div
          style={{
            height: 32,
            margin: 16,
            background: "rgba(255, 255, 255, 0.2)",
            color: "white",
            textAlign: "center",
            lineHeight: "32px",
            fontWeight: "bold",
            borderRadius: "6px",
          }}
        >
          {collapsed ? "KHO" : "QUẢN LÝ KHO"}
        </div>

        {/* 12. Sử dụng menuItems từ state và location */}
        <Menu
          theme="dark"
          defaultSelectedKeys={[location.pathname]}
          mode="inline"
          items={menuItems}
          onClick={onClickMenu}
        />
      </Sider>

      <Layout>
        {/* 13. Header (Hiển thị tên và vai trò động) */}
        <Header
          style={{
            padding: "0 24px",
            background: colorBgContainer,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <Dropdown menu={{ items: userMenu }} placement="bottomRight">
            <Space style={{ cursor: "pointer" }}>
              <Avatar
                icon={<UserOutlined />}
                style={{ backgroundColor: "#87d068" }}
              />
              {currentUser ? (
                <Space
                  direction="vertical"
                  size={0}
                  style={{ lineHeight: 1.2 }}
                >
                  <strong style={{ fontSize: "14px" }}>
                    {currentUser.hoTen}
                  </strong>
                  <span style={{ fontSize: "12px", color: "#8c8c8c" }}>
                    {currentUser.vaiTro}
                  </span>
                </Space>
              ) : (
                <strong>Loading...</strong>
              )}
            </Space>
          </Dropdown>
        </Header>

        {/* Content và Footer giữ nguyên */}
        <Content style={{ margin: "16px" }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Outlet />
          </div>
        </Content>
        <Footer
          style={{
            textAlign: "center",
          }}
        >
          <Space direction="vertical" align="center" size="small">
            <img
              src="/images/Logo_STU.png"
              alt="STU Logo"
              style={{ height: 50 }}
            />
            <span>
              Đồ án tốt nghiệp ©{new Date().getFullYear()} - Quản lý kho hàng
            </span>
          </Space>
        </Footer>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
