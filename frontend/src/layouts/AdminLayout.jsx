// src/layouts/AdminLayout.jsx

import React, { useState, useEffect } from "react";
import {
  DesktopOutlined,
  FileOutlined,
  PieChartOutlined,
  TeamOutlined,
  UserOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { Layout, Menu, theme, Avatar, Dropdown, Space, App } from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { removeToken } from "../utils/token";

const { Header, Content, Footer, Sider } = Layout;

function getItem(label, key, icon, children) {
  return { key, icon, children, label };
}

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

const adminMenuItems = [
  getItem("Quản lý Người dùng", "/admin/users", <UserOutlined />),
];

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const navigate = useNavigate(); // <-- Chúng ta sẽ dùng hàm này
  const location = useLocation();
  const { message } = App.useApp();

  const [currentUser, setCurrentUser] = useState(null);
  const [menuItems, setMenuItems] = useState(baseMenuItems);

  useEffect(() => {
    let user = null;
    const storedUser = localStorage.getItem("user_info");
    if (storedUser) {
      user = JSON.parse(storedUser);
      setCurrentUser(user);
    }

    if (user && user.quyen && user.quyen.includes("PERM_ADMIN_CREATE_USER")) {
      setMenuItems([...baseMenuItems, ...adminMenuItems]);
    } else {
      setMenuItems(baseMenuItems);
    }
  }, []);

  const onClickMenu = (e) => {
    navigate(e.key);
  };

  const handleLogout = () => {
    removeToken();
    localStorage.removeItem("user_info");
    message.success("Đăng xuất thành công!");
    navigate("/login");
  };

  // Menu dropdown (hiển thị tên)
  const userMenu = [
    // [!] ĐÃ SỬA LẠI DÒNG DƯỚI ĐÂY
    {
      key: "profile", // Đổi key cho rõ nghĩa
      label: "Thông tin tài khoản",
      icon: <UserOutlined />,
      onClick: () => navigate('/profile'), // Thêm onClick để điều hướng
    },
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

        <Menu
          theme="dark"
          defaultSelectedKeys={[location.pathname]}
          mode="inline"
          items={menuItems}
          onClick={onClickMenu}
        />
      </Sider>

      <Layout>
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