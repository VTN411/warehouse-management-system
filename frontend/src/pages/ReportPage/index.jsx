// src/pages/ReportPage/index.jsx

import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Tabs,
  Card,
  Tag,
  Button,
  Space,
  message,
  DatePicker,
} from "antd";
import {
  BarChartOutlined,
  HistoryOutlined,
  FileExcelOutlined,
  WarningOutlined,
  SafetyCertificateOutlined,
  TableOutlined,
  SwapRightOutlined,
} from "@ant-design/icons";
import * as reportService from "../../services/report.service";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

const PERM_INVENTORY = 100;
const PERM_HISTORY = 101;

const ReportPage = () => {
  const [loading, setLoading] = useState(false);

  // State dữ liệu
  const [inventoryData, setInventoryData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [nxtData, setNxtData] = useState([]);

  // [!] 1. STATE QUẢN LÝ TAB ĐANG CHỌN (Mặc định là inventory)
  const [activeTab, setActiveTab] = useState("inventory");

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
    showSizeChanger: true,
    pageSizeOptions: ["5", "10", "20", "50"],
    // showTotal: (total) => `Tổng ${total} dòng`,
  });

  const [nxtFilter, setNxtFilter] = useState({
    from: dayjs().startOf("month"),
    to: dayjs().endOf("month"),
  });

  const [permissions, setPermissions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Lấy quyền user
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
  const canViewReport = canViewInventory || canViewHistory;

  // --- CÁC HÀM FETCH DỮ LIỆU ---

  const fetchInventory = useCallback(async () => {
    if (!canViewInventory) return;
    setLoading(true);
    try {
      const response = await reportService.getInventoryReport();
      const data = response.data || [];
      setInventoryData(data);
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
      setPagination((prev) => ({ ...prev, total: data.length, current: 1 }));
    } catch (error) {
      message.error("Lỗi tải lịch sử!");
    }
    setLoading(false);
  }, [canViewHistory]);

  const fetchNXT = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        from: nxtFilter.from.format("YYYY-MM-DD"),
        to: nxtFilter.to.format("YYYY-MM-DD"),
      };
      const response = await reportService.getNXTReport(params);
      setNxtData(response.data || []);
    } catch (error) {
      message.error("Lỗi tải báo cáo NXT!");
    }
    setLoading(false);
  }, [nxtFilter]);

  // [!] 2. USE EFFECT QUAN TRỌNG: Tự động gọi API khi tab thay đổi hoặc khi vừa có quyền
  useEffect(() => {
    if (activeTab === "inventory" && canViewInventory) {
      fetchInventory();
    } else if (activeTab === "history" && canViewHistory) {
      fetchHistory();
    } else if (activeTab === "nxt") {
      fetchNXT();
    }
  }, [
    activeTab,
    canViewInventory,
    canViewHistory,
    fetchInventory,
    fetchHistory,
    fetchNXT,
  ]);

  // Xử lý khi bấm chuyển Tab
  const handleTabChange = (key) => {
    setActiveTab(key); // Cập nhật state, useEffect ở trên sẽ tự chạy
  };

  const handleTableChange = (newPagination) => {
    setPagination({
      ...pagination,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  };

  // --- CẤU HÌNH CỘT ---
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
      width: 140,
      render: (type) => {
        if (type === "NHAP") return <Tag color="green">NHẬP KHO</Tag>;
        if (type === "XUAT") return <Tag color="blue">XUẤT KHO</Tag>;
        if (type === "CHUYEN_DI")
          return (
            <Tag color="orange">
              <SwapRightOutlined /> CHUYỂN ĐI
            </Tag>
          );
        if (type === "CHUYEN_DEN")
          return (
            <Tag color="cyan">
              <SwapRightOutlined /> CHUYỂN ĐẾN
            </Tag>
          );
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
        const isImport =
          record.loaiGiaoDich === "NHAP" ||
          record.loaiGiaoDich === "CHUYEN_DEN";
        return (
          <b style={{ color: isImport ? "green" : "red" }}>
            {isImport ? "+" : "-"}
            {val}
          </b>
        );
      },
    },
  ];

  const nxtColumns = [
    { title: "Mã SP", dataIndex: "maSP", width: 80 },
    { title: "Tên Sản Phẩm", dataIndex: "tenSP", width: 200 },
    { title: "ĐVT", dataIndex: "donViTinh", width: 80 },
    {
      title: "Tồn Đầu",
      dataIndex: "tonDau",
      align: "center",
      render: (v) => <b>{v}</b>,
    },
    {
      title: "Nhập",
      dataIndex: "slNhap",
      align: "center",
      render: (v) => <span style={{ color: "green" }}>+{v}</span>,
    },
    {
      title: "Xuất",
      dataIndex: "slXuat",
      align: "center",
      render: (v) => <span style={{ color: "red" }}>-{v}</span>,
    },
    {
      title: "Tồn Cuối",
      dataIndex: "tonCuoi",
      align: "center",
      render: (v) => <b style={{ color: "blue" }}>{v}</b>,
    },
    {
      title: "Giá Trị Tồn",
      dataIndex: "giaTriTonCuoi",
      align: "right",
      render: (v) => `${Number(v).toLocaleString()} đ`,
    },
  ];

  const items = [
    {
      key: "inventory",
      label: (
        <span>
          <BarChartOutlined /> Tồn kho hiện tại
        </span>
      ),
      children: (
        <>
          <div style={{ textAlign: "right", marginBottom: 16 }}>
            <Button icon={<FileExcelOutlined />}>Xuất Excel</Button>
          </div>
          <Table
            className="fixed-height-table"
            columns={inventoryColumns}
            dataSource={inventoryData}
            loading={loading}
            rowKey={(record, index) => index}
            pagination={pagination}
            onChange={handleTableChange}
          />
        </>
      ),
    },
    {
      key: "history",
      label: (
        <span>
          <HistoryOutlined /> Lịch sử Giao dịch
        </span>
      ),
      children: (
        <>
          <div style={{ textAlign: "right", marginBottom: 16 }}>
            <Button icon={<FileExcelOutlined />}>Xuất Excel</Button>
          </div>
          <Table
            className="fixed-height-table"
            columns={historyColumns}
            dataSource={historyData}
            loading={loading}
            rowKey={(record, index) => index}
            pagination={pagination}
            onChange={handleTableChange}
          />
        </>
      ),
    },
    {
      key: "nxt",
      label: (
        <span>
          <TableOutlined /> Nhập - Xuất - Tồn
        </span>
      ),
      children: (
        <>
          <div
            style={{
              marginBottom: 16,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <Space>
              <span>Kỳ báo cáo:</span>
              <RangePicker
                allowClear={false}
                value={[nxtFilter.from, nxtFilter.to]}
                onChange={(dates) =>
                  setNxtFilter({ from: dates[0], to: dates[1] })
                }
              />
              <Button
                type="primary"
                onClick={fetchNXT}
                loading={loading}
              >
                Xem báo cáo
              </Button>
            </Space>
            <Button icon={<FileExcelOutlined />}>Xuất Excel</Button>
          </div>
          <Table
            className="fixed-height-table"
            columns={nxtColumns}
            dataSource={nxtData}
            loading={loading}
            rowKey="maSP"
            pagination={pagination}
            onChange={handleTableChange}
            bordered
            summary={(pageData) => {
              let totalNhap = 0;
              let totalXuat = 0;
              let totalGiaTri = 0;
              pageData.forEach(({ slNhap, slXuat, giaTriTonCuoi }) => {
                totalNhap += slNhap;
                totalXuat += slXuat;
                totalGiaTri += giaTriTonCuoi;
              });
              return (
                <Table.Summary.Row
                  style={{ fontWeight: "bold", background: "#fafafa" }}
                >
                  <Table.Summary.Cell
                    index={0}
                    colSpan={4}
                  >
                    Tổng cộng
                  </Table.Summary.Cell>
                  <Table.Summary.Cell
                    index={1}
                    align="center"
                  >
                    {totalNhap}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell
                    index={2}
                    align="center"
                  >
                    {totalXuat}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3}></Table.Summary.Cell>
                  <Table.Summary.Cell
                    index={4}
                    align="right"
                  >
                    {totalGiaTri.toLocaleString()} đ
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              );
            }}
          />
        </>
      ),
    },
  ];

  return (
    <div style={{ padding: 0 }}>
      <h2>Báo cáo & Thống kê</h2>
      {canViewReport ? (
        // [!] CHỈ ĐỊNH TAB ĐANG ACTIVE
        <Tabs
          activeKey={activeTab}
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
