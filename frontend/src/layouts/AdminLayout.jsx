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

// Menu dành riêng cho Admin (Quản lý User)
const adminMenuItems = [
  getItem("Quản lý Người dùng", "/admin/users", <UserOutlined />),
];

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = App.useApp();

  const [currentUser, setCurrentUser] = useState(null);
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    let user = null;
    let permissions = [];
    
    const storedUser = localStorage.getItem("user_info");
    if (storedUser) {
      user = JSON.parse(storedUser);
      setCurrentUser(user);
      permissions = user.quyen || [];
    }

    // Kiểm tra xem có phải Admin không
    const roleName = user?.vaiTro || user?.tenVaiTro;
    const isAdmin = roleName === "ADMIN";

    // 1. Xây dựng Menu con cho "Danh mục"
    const danhMucChildren = [
      getItem("Sản phẩm", "/products"), 
      
      // Hiện nếu có quyền PERM_KHO_VIEW HOẶC là ADMIN
      ...((permissions.includes("PERM_KHO_VIEW") || isAdmin)
          ? [getItem("Kho hàng", "/warehouses")] 
          : []
      ),
      
      // Hiện nếu có quyền PERM_SUPPLIER_VIEW HOẶC là ADMIN
      ...((permissions.includes("PERM_SUPPLIER_VIEW") || isAdmin)
          ? [getItem("Nhà cung cấp", "/suppliers")]
          : []
      ),
    ];

    // 2. Xây dựng Menu con cho "Nhập xuất"
    const nhapXuatChildren = [
      ...((permissions.includes("PERM_PHIEUNHAP_CREATE") || permissions.includes("PERM_PHIEUNHAP_VIEW") || isAdmin)
        ? [getItem("Nhập kho", "/stock-in")]
        : []
      ),

      ...((permissions.includes("PERM_PHIEUXUAT_CREATE") || permissions.includes("PERM_PHIEUXUAT_VIEW") || isAdmin)
        ? [getItem("Xuất kho", "/stock-out")]
        : []
      ),
    ];

    // 3. Tổng hợp Menu chính
    const dynamicMenu = [
      getItem("Dashboard", "/dashboard", <PieChartOutlined />),
      
      ...(danhMucChildren.length > 0 
          ? [getItem("Danh mục", "sub1", <DesktopOutlined />, danhMucChildren)] 
          : []
      ),
      
      ...(nhapXuatChildren.length > 0 
          ? [getItem("Nhập xuất", "sub2", <TeamOutlined />, nhapXuatChildren)]
          : []
      ),
      
      getItem("Báo cáo", "/reports", <FileOutlined />),
    ];

    // [!] 4. CẬP NHẬT LOGIC HIỂN THỊ MENU QUẢN LÝ USER
    // Hiển thị nếu là ADMIN hoặc có quyền PERM_ADMIN_CREATE_USER
    if (isAdmin || permissions.includes("PERM_ADMIN_CREATE_USER")) { 
      dynamicMenu.push(...adminMenuItems);
    }

    setMenuItems(dynamicMenu);
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

  const userMenu = [
    {
      key: "profile",
      label: "Thông tin tài khoản",
      icon: <UserOutlined />,
      onClick: () => navigate('/profile'),
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
        <div style={{ margin: 16, textAlign: 'center' }}>
            {/* Logo hoặc Text */}
            <div
            style={{
                height: 32,
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
                    {currentUser.vaiTro || currentUser.tenVaiTro}
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