// src/pages/ReportPage/index.jsx

import React, { useState, useEffect, useCallback } from "react";
import { Table, Tabs, Card, Tag, Button, Space, message } from "antd";
import {
  BarChartOutlined,
  HistoryOutlined,
  FileExcelOutlined,
  WarningOutlined,
  SafetyCertificateOutlined,
  
} from "@ant-design/icons";
import * as reportService from "../../services/report.service";

const PERM_INVENTORY = 100;
const PERM_HISTORY = 101;

const ReportPage = () => {
  const [loading, setLoading] = useState(false);
  const [inventoryData, setInventoryData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // [!] 1. THÊM STATE PHÂN TRANG (Cho cả 2 bảng dùng chung hoặc riêng tùy ý)
  // Ở đây dùng chung để đơn giản, khi chuyển tab sẽ reset về trang 1
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
    showSizeChanger: true,
    pageSizeOptions: ["5", "10", "20", "50"],
  });

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
        setPermissions(Array.isArray(perms) ? perms : []);
      } catch (e) {
        setPermissions([]);
      }
    }
  }, []);

  const canViewInventory = isAdmin || permissions.includes(PERM_INVENTORY);
  const canViewHistory = isAdmin || permissions.includes(PERM_HISTORY);

  const fetchInventory = useCallback(async () => {
    if (!canViewInventory) return;
    setLoading(true);
    try {
      const response = await reportService.getInventoryReport();
      const data = response.data || [];
      setInventoryData(data);
      // Cập nhật tổng số dòng khi data về
      setPagination((prev) => ({ ...prev, total: data.length, current: 1 }));
    } catch (error) {}
    setLoading(false);
  }, [canViewInventory]);

  const fetchHistory = useCallback(async () => {
    if (!canViewHistory) return;
    setLoading(true);
    try {
      const response = await reportService.getHistoryReport();
      const data = response.data || [];
      setHistoryData(data);
      // Cập nhật tổng số dòng
      setPagination((prev) => ({ ...prev, total: data.length, current: 1 }));
    } catch (error) {
      message.error("Lỗi tải lịch sử!");
    }
    setLoading(false);
  }, [canViewHistory]);

  const handleTabChange = (key) => {
    if (key === "inventory") fetchInventory();
    if (key === "history") fetchHistory();
  };

  useEffect(() => {
    if (canViewInventory) fetchInventory();
    else if (canViewHistory) fetchHistory();
  }, [canViewInventory, canViewHistory, fetchInventory, fetchHistory]);

  // [!] 2. HÀM XỬ LÝ KHI NGƯỜI DÙNG THAY ĐỔI PHÂN TRANG
  const handleTableChange = (newPagination) => {
    setPagination({
      ...pagination,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  };

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
          return (
            <Tag
              icon={<WarningOutlined />}
              color="red"
            >
              Hết hàng
            </Tag>
          );
        if (current <= min)
          return (
            <Tag
              icon={<WarningOutlined />}
              color="orange"
            >
              Sắp hết
            </Tag>
          );
        return (
          <Tag
            icon={<SafetyCertificateOutlined />}
            color="green"
          >
            Bình thường
          </Tag>
        );
      },
    },
  ];

  const historyColumns = [
    {
      title: "Ngày",
      dataIndex: "ngay",
      key: "ngay",
      width: 150,
      render: (text) => new Date(text).toLocaleString("vi-VN"),
    },
    {
      title: "Loại GD",
      dataIndex: "loaiGiaoDich",
      key: "loaiGiaoDich",
      render: (type) => (
        <Tag
          color={type === "NHAP" || type === "CHUYEN_DEN" ? "green" : "blue"}
        >
          {type}
        </Tag>
      ),
    },
    { title: "Chứng Từ", dataIndex: "chungTu", key: "chungTu" },
    { title: "Sản Phẩm", dataIndex: "tenSP", key: "tenSP" },
    { title: "Kho", dataIndex: "tenKho", key: "tenKho" },
    {
      title: "Số Lượng",
      dataIndex: "soLuong",
      key: "soLuong",
      render: (val, record) => {
        const isImport =
          record.loaiGiaoDich === "NHAP" ||
          record.loaiGiaoDich === "CHUYEN_DEN";
        return (
          <b style={{ color: isImport ? "green" : "blue" }}>
            {isImport ? "+" : "-"}
            {val}
          </b>
        );
      },
    },
  ];

  const items = [];
  if (canViewInventory) {
    items.push({
      key: "inventory",
      label: (
        <span>
          <BarChartOutlined /> Báo cáo Tồn kho
        </span>
      ),
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
            rowKey={(record, index) => index} // Dùng index cho an toàn
            // [!] 3. GẮN STATE VÀO BẢNG
            pagination={pagination}
            onChange={handleTableChange}
          />
        </div>
      ),
    });
  }

  if (canViewHistory) {
    items.push({
      key: "history",
      label: (
        <span>
          <HistoryOutlined /> Lịch sử Giao dịch
        </span>
      ),
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
            rowKey={(record, index) => index}
            // [!] 3. GẮN STATE VÀO BẢNG
            pagination={pagination}
            onChange={handleTableChange}
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
