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

// --- KHAI BÁO MÃ QUYỀN ---
const PERM_INVENTORY = 103; // Xem báo cáo tồn kho
const PERM_HISTORY = 101; // Xem lịch sử giao dịch
const PERM_NXT = 131; // Xem báo cáo Nhập Xuất Tồn

const ReportPage = () => {
  const [loading, setLoading] = useState(false);

  // State dữ liệu
  const [inventoryData, setInventoryData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [nxtData, setNxtData] = useState([]);

  // State quản lý Tab
  const [activeTab, setActiveTab] = useState("");

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
    showSizeChanger: true,
    pageSizeOptions: ["5", "10", "20", "50"],
  });

  const [nxtFilter, setNxtFilter] = useState({
    from: dayjs().startOf("month"),
    to: dayjs().endOf("month"),
  });

  const [permissions, setPermissions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // 1. LẤY QUYỀN USER
  useEffect(() => {
    const storedUser = localStorage.getItem("user_info");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const userData =
          user.quyen && !Array.isArray(user.quyen) ? user.quyen : user;

        const role = (
          userData.vaiTro ||
          userData.tenVaiTro ||
          ""
        ).toUpperCase();
        setIsAdmin(role === "ADMIN");

        let rawPerms = userData.dsQuyenSoHuu || userData.quyen || [];
        if (!Array.isArray(rawPerms)) rawPerms = [];

        // Chuẩn hóa quyền về dạng số
        const parsedPerms = rawPerms.map((p) => {
          if (typeof p === "object" && p !== null)
            return parseInt(p.maQuyen || p.id);
          return parseInt(p);
        });

        setPermissions(parsedPerms);
      } catch (e) {
        setPermissions([]);
      }
    }
  }, []);

  // 2. BIẾN FLAG KIỂM TRA QUYỀN
  const canViewInventory = isAdmin || permissions.includes(PERM_INVENTORY);
  const canViewHistory = isAdmin || permissions.includes(PERM_HISTORY);
  const canViewNXT = isAdmin || permissions.includes(PERM_NXT);

  const canViewAnyReport = canViewInventory || canViewHistory || canViewNXT;

  // --- CÁC HÀM FETCH DỮ LIỆU ---

  const fetchInventory = useCallback(async () => {
    if (!canViewInventory) return;
    setLoading(true);
    try {
      const response = await reportService.getInventoryReport();
      const data = response.data || [];
      setInventoryData(data);
      setPagination((prev) => ({ ...prev, total: data.length, current: 1 }));
    } catch (error) {
      // message.error("Lỗi tải tồn kho");
    }
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
    if (!canViewNXT) return;
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
  }, [nxtFilter, canViewNXT]);

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const handleTableChange = (newPagination) => {
    setPagination({
      ...pagination,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  };

  // --- [QUAN TRỌNG] KHAI BÁO CỘT TRƯỚC KHI DÙNG TRONG getTabItems ---

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

  // 3. XÂY DỰNG DANH SÁCH TAB DỰA TRÊN QUYỀN
  const getTabItems = () => {
    const items = [];

    // Tab Tồn kho (Quyền 103)
    if (canViewInventory) {
      items.push({
        key: "inventory",
        label: (
          <span>
            <BarChartOutlined /> Tồn kho hiện tại
          </span>
        ),
        children: (
          <>
           
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
      });
    }

    // Tab Lịch sử (Quyền 101)
    if (canViewHistory) {
      items.push({
        key: "history",
        label: (
          <span>
            <HistoryOutlined /> Lịch sử Giao dịch
          </span>
        ),
        children: (
          <>
            
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
      });
    }

    // Tab Nhập Xuất Tồn (Quyền 131)
    if (canViewNXT) {
      items.push({
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
      });
    }

    return items;
  };

  const items = getTabItems();

  // 4. TỰ ĐỘNG CHỌN TAB ĐẦU TIÊN CÓ QUYỀN
  useEffect(() => {
    if (items.length > 0) {
      const isCurrentTabValid = items.some((i) => i.key === activeTab);
      if (!activeTab || !isCurrentTabValid) {
        setActiveTab(items[0].key);
      }
    }
  }, [items, activeTab]);

  // 5. GỌI API KHI ACTIVE TAB THAY ĐỔI
  useEffect(() => {
    if (activeTab === "inventory" && canViewInventory) {
      fetchInventory();
    } else if (activeTab === "history" && canViewHistory) {
      fetchHistory();
    } else if (activeTab === "nxt" && canViewNXT) {
      fetchNXT();
    }
  }, [
    activeTab,
    canViewInventory,
    canViewHistory,
    canViewNXT,
    fetchInventory,
    fetchHistory,
    fetchNXT,
  ]);

  // --- RENDER GIAO DIỆN ---
  return (
    <div style={{ padding: 0 }}>
      <h2>Báo cáo & Thống kê</h2>
      {canViewAnyReport && items.length > 0 ? (
        <Tabs
          activeKey={activeTab}
          items={items}
          onChange={handleTabChange}
        />
      ) : (
        <Card style={{ textAlign: "center", marginTop: 20 }}>
          <WarningOutlined
            style={{ fontSize: 40, color: "orange", marginBottom: 10 }}
          />
          <p>Bạn không có quyền xem bất kỳ báo cáo nào.</p>
        </Card>
      )}
    </div>
  );
};

export default ReportPage;
