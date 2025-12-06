// src/layouts/AdminLayout.jsx

import React, { useState, useEffect } from "react";
import {
  DesktopOutlined,
  FileOutlined,
  PieChartOutlined,
  TeamOutlined,
  UserOutlined,
  LogoutOutlined,
  HistoryOutlined,
  SwapOutlined, // Icon Điều chuyển
} from "@ant-design/icons";
import { Layout, Menu, theme, Avatar, Dropdown, Space, App } from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { removeToken } from "../utils/token";

const { Header, Content, Footer, Sider } = Layout;

function getItem(label, key, icon, children) {
  return { key, icon, children, label };
}

const adminMenuItems = [
  getItem("Quản lý Người dùng", "/admin/users", <UserOutlined />),
  getItem("Nhật ký Hệ thống", "/system-logs", <HistoryOutlined />),
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
    let perms = [];

    const storedUser = localStorage.getItem("user_info");
    if (storedUser) {
      try {
        user = JSON.parse(storedUser);
        if (
          user.quyen &&
          !Array.isArray(user.quyen) &&
          user.quyen.maNguoiDung
        ) {
          user = user.quyen;
        }
        setCurrentUser(user);
        const p1 = Array.isArray(user.quyen) ? user.quyen : [];
        const p2 = Array.isArray(user.dsQuyenSoHuu) ? user.dsQuyenSoHuu : [];
        perms = [...new Set([...p1, ...p2])];
      } catch (e) {
        console.error("Lỗi parse user_info", e);
      }
    }

    const roleName = user?.vaiTro || user?.tenVaiTro || "";
    const isAdmin = roleName.toUpperCase() === "ADMIN";

    const hasPerm = (idCode, stringCode) => {
      if (isAdmin) return true;
      return perms.includes(idCode) || perms.includes(stringCode);
    };

    // 1. Danh mục
    const danhMucChildren = [
      ...(hasPerm(140, "PERM_CATEGORY_VIEW")
        ? [getItem("Loại hàng", "/categories")]
        : []),
      getItem("Sản phẩm", "/products"),
      ...(hasPerm(70, "PERM_KHO_VIEW")
        ? [getItem("Kho hàng", "/warehouses")]
        : []),
      ...(hasPerm(60, "PERM_SUPPLIER_VIEW")
        ? [getItem("Nhà cung cấp", "/suppliers")]
        : []),
      ...(hasPerm(90, "PERM_CUSTOMER_VIEW")
        ? [getItem("Khách hàng", "/customers")]
        : []),
    ];

    // 2. Nhập xuất (Chỉ còn Nhập và Xuất)
    const nhapXuatChildren = [
      ...(hasPerm(20, "PERM_PHIEUNHAP_CREATE") ||
      hasPerm(null, "PERM_PHIEUNHAP_VIEW")
        ? [getItem("Nhập kho", "/stock-in")]
        : []),
      ...(hasPerm(23, "PERM_PHIEUXUAT_CREATE") ||
      hasPerm(null, "PERM_PHIEUXUAT_VIEW")
        ? [getItem("Xuất kho", "/stock-out")]
        : []),
    ];

    // 3. Tổng hợp Menu
    const dynamicMenu = [
      getItem("Dashboard", "/dashboard", <PieChartOutlined />),

      ...(danhMucChildren.length > 0
        ? [getItem("Danh mục", "sub1", <DesktopOutlined />, danhMucChildren)]
        : []),

      ...(nhapXuatChildren.length > 0
        ? [getItem("Nhập xuất", "sub2", <TeamOutlined />, nhapXuatChildren)]
        : []),

      // [!] ĐƯA ĐIỀU CHUYỂN RA NGOÀI (Ngang hàng)
      // Kiểm tra quyền ID 110 (Xem) hoặc 111 (Tạo)
      ...(hasPerm(110, "PERM_TRANSFER_VIEW") ||
      hasPerm(111, "PERM_TRANSFER_CREATE")
        ? [getItem("Điều chuyển", "/stock-transfer", <SwapOutlined />)]
        : []),

      ...(hasPerm(30, "PERM_VIEW_REPORT")
        ? [getItem("Báo cáo", "/reports", <FileOutlined />)]
        : []),
    ];

    if (hasPerm(10, "PERM_ADMIN_CREATE_USER")) {
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
      onClick: () => navigate("/profile"),
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
        <div style={{ margin: 16, textAlign: "center" }}>
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
          <Dropdown
            menu={{ items: userMenu }}
            placement="bottomRight"
          >
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
        <Footer style={{ textAlign: "center" }}>
          <Space
            direction="vertical"
            align="center"
            size="small"
          >
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
