// src/pages/SystemLogPage/index.jsx

import React, { useState, useEffect, useCallback } from "react";
import { Table, message, Tag, Card, DatePicker, Space, Button } from "antd";
import { HistoryOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import * as logService from "../../services/log.service";
import dayjs from "dayjs"; // Thư viện xử lý ngày (đi kèm với Antd)

const { RangePicker } = DatePicker;

const SystemLogPage = () => {
  const [logs, setLogs] = useState([]); // Dữ liệu gốc
  const [displayedLogs, setDisplayedLogs] = useState([]); // Dữ liệu hiển thị (đã lọc)
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  
  // State cho bộ lọc ngày
  const [dateRange, setDateRange] = useState(null);

  // Cấu hình phân trang
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 10, // [!] Mặc định 10 dòng/trang
      showSizeChanger: true,
      pageSizeOptions: ['10', '20', '50', '100'],
      showTotal: (total) => `Tổng cộng ${total} dòng`
    },
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await logService.getAllLogs();
      const data = response.data || [];

      // [!] Mặc định sắp xếp mới nhất lên đầu (vì đã bỏ nút sort)
      data.sort((a, b) => new Date(b.thoiGianThucHien) - new Date(a.thoiGianThucHien));

      setLogs(data);
      setDisplayedLogs(data); // Ban đầu hiển thị hết

      // Cập nhật tổng số dòng cho phân trang
      setTableParams((prev) => ({
        ...prev,
        pagination: {
          ...prev.pagination,
          total: data.length,
        },
      }));

    } catch (error) {
      messageApi.error("Không thể tải nhật ký hệ thống!");
    }
    setLoading(false);
  }, [messageApi]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // [!] LOGIC LỌC THEO THỜI GIAN
  useEffect(() => {
    if (!dateRange) {
      setDisplayedLogs(logs); // Nếu không chọn ngày, hiện tất cả
      setTableParams(prev => ({
        ...prev,
        pagination: { ...prev.pagination, total: logs.length, current: 1 }
      }));
      return;
    }

    const [start, end] = dateRange;
    
    // Lọc dữ liệu
    const filtered = logs.filter((log) => {
      const logDate = dayjs(log.thoiGianThucHien);
      // Kiểm tra ngày nằm trong khoảng (tính cả ngày bắt đầu và kết thúc)
      return (logDate.isSame(start, 'day') || logDate.isAfter(start, 'day')) &&
             (logDate.isSame(end, 'day') || logDate.isBefore(end, 'day'));
    });

    setDisplayedLogs(filtered);
    
    // Cập nhật lại phân trang cho danh sách đã lọc
    setTableParams(prev => ({
      ...prev,
      pagination: { ...prev.pagination, total: filtered.length, current: 1 }
    }));

  }, [dateRange, logs]);

  const handleTableChange = (pagination, filters, sorter) => {
    setTableParams({
      pagination,
      filters,
      ...sorter,
    });
  };

  const columns = [
    { 
      title: "Mã HD", 
      dataIndex: "maHD", 
      key: "maHD", 
      width: 80 
    },
    { 
      title: "Người Dùng", 
      dataIndex: "tenDangNhap", 
      key: "tenDangNhap",
      render: (text, record) => (
        <div>
          <strong>{text}</strong>
          <div style={{ fontSize: 12, color: '#888' }}>{record.hoTen}</div>
        </div>
      )
    },
    { 
      title: "Hành Động", 
      dataIndex: "hanhDong", 
      key: "hanhDong",
      render: (text) => {
        let color = 'blue';
        if (text.includes('Xóa') || text.includes('Hủy')) color = 'red';
        if (text.includes('Thêm') || text.includes('Tạo') || text.includes('Duyệt')) color = 'green';
        if (text.includes('Cập nhật') || text.includes('Sửa')) color = 'orange';
        
        return <Tag color={color}>{text}</Tag>;
      }
    },
    { 
      title: "Thời Gian", 
      dataIndex: "thoiGianThucHien", 
      key: "thoiGianThucHien",
      width: 200,
      // [!] Đã BỎ sorter ở đây theo yêu cầu
      render: (text) => dayjs(text).format("DD/MM/YYYY HH:mm:ss") // Format ngày đẹp hơn
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {contextHolder}
      
      <Card 
        title={<span><HistoryOutlined /> Nhật Ký Hoạt Động Hệ Thống</span>} 
        bordered={false}
      >
        {/* [!] THANH CÔNG CỤ: LỌC VÀ TẢI LẠI */}
        <Space style={{ marginBottom: 16 }}>
          <RangePicker 
            placeholder={['Từ ngày', 'Đến ngày']}
            format="DD/MM/YYYY"
            onChange={(dates) => setDateRange(dates)} 
          />
          
          <Button 
            icon={<ReloadOutlined />} 
            onClick={fetchLogs} 
            loading={loading}
          >
            Tải lại
          </Button>
        </Space>

        <Table
          className="fixed-height-table"
          columns={columns}
          dataSource={displayedLogs} // Dùng danh sách đã lọc
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