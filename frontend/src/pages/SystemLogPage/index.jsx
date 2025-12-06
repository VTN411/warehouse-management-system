// src/pages/SystemLogPage/index.jsx

import React, { useState, useEffect, useCallback } from "react";
import { Table, message, Tag, Card, DatePicker, Space, Button } from "antd";
import {
  HistoryOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import * as logService from "../../services/log.service";
import * as userService from "../../services/user.service"; // [!] Import UserService
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

// [!] DANH SÁCH TÊN QUYỀN (Copy từ UserManagement sang để tra cứu)
// Nếu bạn muốn chuẩn hơn, hãy tạo một file constants/permissions.js để dùng chung
const PERMISSION_MAP = {
  10: "Tạo User",
  11: "Sửa User",
  12: "Xóa User",
  13: "Cấu hình",
  14: "Xem User",
  20: "Tạo Phiếu Nhập",
  21: "Sửa Phiếu Nhập",
  22: "Xóa Phiếu Nhập",
  40: "Duyệt P.Nhập",
  41: "Hủy P.Nhập",
  23: "Tạo Phiếu Xuất",
  24: "Sửa Phiếu Xuất",
  25: "Xóa Phiếu Xuất",
  42: "Duyệt P.Xuất",
  43: "Hủy P.Xuất",
  30: "Xem Báo Cáo",
  31: "Duyệt PO",
  32: "Duyệt SO",
  50: "Tạo SP",
  51: "Sửa SP",
  52: "Xóa SP",
  60: "Xem NCC",
  61: "Tạo NCC",
  62: "Sửa NCC",
  63: "Xóa NCC",
  70: "Xem Kho",
  71: "Tạo Kho",
  72: "Sửa Kho",
  73: "Xóa Kho",
  90: "Xem KH",
  91: "Tạo KH",
  92: "Sửa KH",
  93: "Xóa KH",
  100: "Xem Tồn Kho",
  101: "Xem Lịch Sử GD",
  110: "Xem Điều Chuyển",
  111: "Tạo Điều Chuyển",
  112: "Duyệt ĐC",
  113: "Hủy ĐC",
  114: "Sửa ĐC đã duyệt",
  120: "Sửa P.Nhập đã duyệt",
  121: "Sửa P.Xuất đã duyệt",
  140: "Xem Loại Hàng",
  141: "Tạo Loại Hàng",
  142: "Sửa Loại Hàng",
  143: "Xóa Loại Hàng",
};

const SystemLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [displayedLogs, setDisplayedLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  // [!] STATE DANH SÁCH USER ĐỂ TRA CỨU TÊN
  const [userMap, setUserMap] = useState({});

  const [dateRange, setDateRange] = useState(null);

  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 10,
      showSizeChanger: true,
      pageSizeOptions: ["10", "20", "50", "100"],
      showTotal: (total) => `Tổng cộng ${total} dòng`,
    },
  });

  // Hàm lấy logs và danh sách user
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Gọi song song 2 API
      const [resLogs, resUsers] = await Promise.allSettled([
        logService.getAllLogs(),
        userService.getAllUsers(),
      ]);

      // Xử lý Logs
      let dataLogs = [];
      if (resLogs.status === "fulfilled") {
        dataLogs = resLogs.value.data || [];
        // Sắp xếp mới nhất lên đầu
        dataLogs.sort(
          (a, b) => new Date(b.thoiGianThucHien) - new Date(a.thoiGianThucHien)
        );
      }

      // Xử lý Users -> Chuyển thành Map { id: "Tên User" } để tra cứu cho nhanh
      let map = {};
      if (resUsers.status === "fulfilled") {
        (resUsers.value.data || []).forEach((u) => {
          map[u.maNguoiDung] = `${u.hoTen} (${u.tenDangNhap})`;
        });
      }
      setUserMap(map);
      setLogs(dataLogs);
      setDisplayedLogs(dataLogs);

      setTableParams((prev) => ({
        ...prev,
        pagination: { ...prev.pagination, total: dataLogs.length },
      }));
    } catch (error) {
      messageApi.error("Lỗi tải dữ liệu!");
    }
    setLoading(false);
  }, [messageApi]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Logic lọc theo ngày
  useEffect(() => {
    if (!dateRange) {
      setDisplayedLogs(logs);
      setTableParams((prev) => ({
        ...prev,
        pagination: { ...prev.pagination, total: logs.length, current: 1 },
      }));
      return;
    }

    const [start, end] = dateRange;
    const filtered = logs.filter((log) => {
      const logDate = dayjs(log.thoiGianThucHien);
      return (
        (logDate.isSame(start, "day") || logDate.isAfter(start, "day")) &&
        (logDate.isSame(end, "day") || logDate.isBefore(end, "day"))
      );
    });

    setDisplayedLogs(filtered);
    setTableParams((prev) => ({
      ...prev,
      pagination: { ...prev.pagination, total: filtered.length, current: 1 },
    }));
  }, [dateRange, logs]);

  const handleTableChange = (pagination, filters, sorter) => {
    setTableParams({ pagination, filters, ...sorter });
  };

  // [!] HÀM FORMAT NỘI DUNG HÀNH ĐỘNG
  const formatActionText = (text) => {
    if (!text) return "";

    // Regex bắt chuỗi: "MaChucNang: 100" -> thay bằng tên quyền
    let newText = text.replace(/MaChucNang:\s*(\d+)/g, (match, id) => {
      const name = PERMISSION_MAP[id];
      return name ? `Quyền: ${name}` : match;
    });

    // Regex bắt chuỗi: "user (MaNguoiDung: 7)" hoặc "MaNguoiDung: 7" -> thay bằng tên user
    // (Lưu ý: userMap[7] = "Nguyen Van A (admin)")
    newText = newText.replace(/MaNguoiDung:\s*(\d+)/g, (match, id) => {
      const userName = userMap[id];
      return userName ? `User: ${userName}` : match;
    });

    return newText;
  };

  const columns = [
    {
      title: "Mã HD",
      dataIndex: "maHD",
      key: "maHD",
      width: 80,
    },
    {
      title: "Người Thực Hiện",
      dataIndex: "tenDangNhap",
      key: "tenDangNhap",
      width: 200,
      render: (text, record) => (
        <div>
          <strong>{text}</strong>
          <div style={{ fontSize: 12, color: "#888" }}>{record.hoTen}</div>
        </div>
      ),
    },
    {
      title: "Hành Động",
      dataIndex: "hanhDong",
      key: "hanhDong",
      render: (text) => {
        let color = "blue";
        if (
          text.includes("Xóa") ||
          text.includes("Hủy") ||
          text.includes("Thu hồi")
        )
          color = "red";
        if (
          text.includes("Thêm") ||
          text.includes("Tạo") ||
          text.includes("Duyệt") ||
          text.includes("Gán")
        )
          color = "green";
        if (text.includes("Cập nhật") || text.includes("Sửa")) color = "orange";

        // [!] GỌI HÀM FORMAT ĐỂ HIỂN THỊ TÊN THAY VÌ ID
        return (
          <Tag
            color={color}
            style={{ fontSize: "13px", whiteSpace: "normal" }}
          >
            {formatActionText(text)}
          </Tag>
        );
      },
    },
    {
      title: "Thời Gian",
      dataIndex: "thoiGianThucHien",
      key: "thoiGianThucHien",
      width: 180,
      render: (text) => dayjs(text).format("DD/MM/YYYY HH:mm:ss"),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {contextHolder}
      <Card
        title={
          <span>
            <HistoryOutlined /> Nhật Ký Hoạt Động Hệ Thống
          </span>
        }
        bordered={false}
      >
        <Space style={{ marginBottom: 16 }}>
          <RangePicker
            placeholder={["Từ ngày", "Đến ngày"]}
            format="DD/MM/YYYY"
            onChange={(dates) => setDateRange(dates)}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchData}
            loading={loading}
          >
            Tải lại
          </Button>
        </Space>
        <Table
          className="fixed-height-table"
          columns={columns}
          dataSource={displayedLogs}
          loading={loading}
          rowKey="maHD"
          pagination={tableParams.pagination}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  );
};

export default SystemLogPage;
