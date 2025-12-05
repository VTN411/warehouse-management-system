// src/pages/ReportPage/index.jsx

import React, { useState, useEffect, useCallback } from "react";
import { Table, Tabs, Card, Tag, Button, Space, message } from "antd";
import {
  BarChartOutlined,
  HistoryOutlined,
  FileExcelOutlined,
  WarningOutlined,
  SafetyCertificateOutlined,
  SwapRightOutlined, // Icon cho điều chuyển
} from "@ant-design/icons";
import * as reportService from "../../services/report.service";

// Định nghĩa ID quyền
const PERM_INVENTORY = 100;
const PERM_HISTORY = 101;

const ReportPage = () => {
  const [loading, setLoading] = useState(false);
  const [inventoryData, setInventoryData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Lấy quyền
  useEffect(() => {
    const storedUser = localStorage.getItem("user_info");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const userData =
          user.quyen && !Array.isArray(user.quyen) ? user.quyen : user;

        const role = userData.vaiTro || userData.tenVaiTro || "";
        setIsAdmin(role === "ADMIN");

        let perms = userData.dsQuyenSoHuu || userData.quyen || [];
        if (!Array.isArray(perms)) perms = [];
        setPermissions(perms);
      } catch (e) {
        setPermissions([]);
      }
    }
  }, []);

  const canViewInventory = isAdmin || permissions.includes(PERM_INVENTORY);
  const canViewHistory = isAdmin || permissions.includes(PERM_HISTORY);

  // [!] CẤU HÌNH PHÂN TRANG CHUNG
  const paginationConfig = {
    pageSize: 5, 
    showSizeChanger: true, 
    pageSizeOptions: ['5', '10', '20', '50'], 
    showTotal: (total) => `Tổng ${total} dòng`
  };

  // Hàm tải dữ liệu tồn kho
  const fetchInventory = useCallback(async () => {
    if (!canViewInventory) return;
    setLoading(true);
    try {
      const response = await reportService.getInventoryReport();
      setInventoryData(response.data || []);
    } catch (error) {
      // message.error("Lỗi tải báo cáo tồn kho!");
    }
    setLoading(false);
  }, [canViewInventory]);

  // Hàm tải dữ liệu lịch sử
  const fetchHistory = useCallback(async () => {
    if (!canViewHistory) return;
    setLoading(true);
    try {
      const response = await reportService.getHistoryReport();
      setHistoryData(response.data || []);
    } catch (error) {
      message.error("Lỗi tải lịch sử giao dịch!");
    }
    setLoading(false);
  }, [canViewHistory]);

  // Gọi API khi chuyển Tab
  const handleTabChange = (key) => {
    if (key === "inventory") fetchInventory();
    if (key === "history") fetchHistory();
  };

  useEffect(() => {
    if (canViewInventory) fetchInventory();
    else if (canViewHistory) fetchHistory();
  }, [canViewInventory, canViewHistory, fetchInventory, fetchHistory]);

  // --- CẤU HÌNH CỘT BẢNG TỒN KHO ---
  const inventoryColumns = [
    { title: "Tên Sản Phẩm", dataIndex: "tenSP", key: "tenSP" },
    { title: "ĐVT", dataIndex: "donViTinh", key: "donViTinh", width: 80 },
    { title: "Kho", dataIndex: "tenKho", key: "tenKho" },
    {
      title: "Số Lượng Tồn",
      dataIndex: "soLuongTon",
      key: "soLuongTon",
      render: (val) => (
        <b style={{ color: val <= 10 ? "red" : "inherit" }}>{val}</b>
      ),
    },
    {
      title: "Trạng Thái",
      key: "status",
      render: (_, record) => {
        const min = record.mucTonToiThieu || 0;
        const current = record.soLuongTon || 0;

        if (current <= 0)
          return <Tag icon={<WarningOutlined />} color="red">Hết hàng</Tag>;
        if (current <= min)
          return <Tag icon={<WarningOutlined />} color="orange">Sắp hết</Tag>;
        return <Tag icon={<SafetyCertificateOutlined />} color="green">Bình thường</Tag>;
      },
    },
  ];

  // --- [!] CẬP NHẬT CẤU HÌNH CỘT BẢNG LỊCH SỬ ---
  const historyColumns = [
    {
      title: "Ngày",
      dataIndex: "ngay",
      key: "ngay",
      width: 160,
      render: (text) => new Date(text).toLocaleString("vi-VN"),
    },
    {
      title: "Loại GD",
      dataIndex: "loaiGiaoDich",
      key: "loaiGiaoDich",
      width: 140,
      render: (type) => {
        // Xử lý hiển thị thẻ màu cho từng loại
        if (type === 'NHAP') return <Tag color="green">NHẬP KHO</Tag>;
        if (type === 'XUAT') return <Tag color="blue">XUẤT KHO</Tag>;
        if (type === 'CHUYEN_DI') return <Tag color="orange"><SwapRightOutlined /> CHUYỂN ĐI</Tag>;
        if (type === 'CHUYEN_DEN') return <Tag color="cyan"><SwapRightOutlined /> CHUYỂN ĐẾN</Tag>;
        return <Tag>{type}</Tag>;
      },
    },
    { title: "Chứng Từ", dataIndex: "chungTu", key: "chungTu" },
    { title: "Sản Phẩm", dataIndex: "tenSP", key: "tenSP" },
    { title: "Kho", dataIndex: "tenKho", key: "tenKho" },
    {
      title: "Số Lượng",
      dataIndex: "soLuong",
      key: "soLuong",
      render: (val, record) => {
        // [!] Xử lý dấu +/- cho số lượng
        const type = record.loaiGiaoDich;
        let color = 'black';
        let prefix = '';

        if (type === 'NHAP' || type === 'CHUYEN_DEN') {
            color = 'green';
            prefix = '+';
        } else if (type === 'XUAT' || type === 'CHUYEN_DI') {
            color = 'red';
            prefix = '-';
        }
        
        return <b style={{ color }}>{prefix}{val}</b>;
      },
    },
  ];

  // Cấu hình các Tabs
  const items = [];
  if (canViewInventory) {
    items.push({
      key: "inventory",
      label: <span><BarChartOutlined /> Báo cáo Tồn kho</span>,
      children: (
        <div>
          <Space style={{ marginBottom: 16, float: "right" }}>
            <Button icon={<FileExcelOutlined />}>Xuất Excel</Button>
          </Space>
          <Table
            className="fixed-height-table"
            columns={inventoryColumns}
            dataSource={inventoryData}
            loading={loading}
            rowKey="maSP"
            pagination={paginationConfig}
          />
        </div>
      ),
    });
  }

  if (canViewHistory) {
    items.push({
      key: "history",
      label: <span><HistoryOutlined /> Lịch sử Giao dịch</span>,
      children: (
        <div>
          <Space style={{ marginBottom: 16, float: "right" }}>
            <Button icon={<FileExcelOutlined />}>Xuất Excel</Button>
          </Space>
          <Table
            className="fixed-height-table"
            columns={historyColumns}
            dataSource={historyData}
            loading={loading}
            // Dùng index làm key để tránh lỗi trùng lặp
            rowKey={(record, index) => index}
            pagination={paginationConfig}
          />
        </div>
      ),
    });
  }

  return (
    <div style={{ padding: 0 }}>
      <h2>Báo cáo & Thống kê</h2>
      {items.length > 0 ? (
        <Tabs
          defaultActiveKey={items[0].key}
          items={items}
          onChange={handleTabChange}
        />
      ) : (
        <Card>Bạn không có quyền xem báo cáo nào.</Card>
      )}
    </div>
  );
};

export default ReportPage;