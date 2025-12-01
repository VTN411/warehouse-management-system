// src/pages/WarehousePage/index.jsx

import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  message,
  Tag,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  EyeOutlined, // [!] Import icon xem
} from "@ant-design/icons";
import * as warehouseService from "../../services/warehouse.service";

// Định nghĩa ID quyền
const PERM_KHO_CREATE = 71;
const PERM_KHO_EDIT = 72;
const PERM_KHO_DELETE = 73;

const WarehousePage = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // State cho Modal Thêm/Sửa
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  
  // State cho Modal Xóa
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // [!] STATE CHO MODAL CHI TIẾT TỒN KHO
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [inventoryList, setInventoryList] = useState([]); // Danh sách SP trong kho
  const [currentWarehouseName, setCurrentWarehouseName] = useState(""); // Tên kho đang xem

  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  
  const [permissions, setPermissions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchWarehouses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await warehouseService.getAllWarehouses();
      setWarehouses(response.data || []);
    } catch (error) {
      messageApi.error("Không thể tải danh sách kho!");
    }
    setLoading(false);
  }, [messageApi]);

  useEffect(() => {
    fetchWarehouses();
    try {
      const storedUser = localStorage.getItem("user_info");
      if (storedUser) {
        let user = JSON.parse(storedUser);
        if (user.quyen && !Array.isArray(user.quyen) && user.quyen.maNguoiDung) user = user.quyen;
        
        const role = user.vaiTro || user.tenVaiTro || "";
        setIsAdmin(role === "ADMIN");

        let perms = user.dsQuyenSoHuu || user.quyen;
        if (!Array.isArray(perms)) perms = [];
        setPermissions(perms);
      }
    } catch (e) {
      setPermissions([]);
    }
  }, [fetchWarehouses]);

  const canCreate = isAdmin || permissions.includes(PERM_KHO_CREATE);
  const canEdit = isAdmin || permissions.includes(PERM_KHO_EDIT);
  const canDelete = isAdmin || permissions.includes(PERM_KHO_DELETE);

  // --- XỬ LÝ FORM THÊM/SỬA ---
  const handleOpenModal = () => {
    setEditingWarehouse(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingWarehouse(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form.validateFields().then(async (values) => {
      try {
        if (editingWarehouse) {
          await warehouseService.updateWarehouse(editingWarehouse.maKho, values);
          messageApi.success("Cập nhật kho thành công!");
        } else {
          await warehouseService.createWarehouse(values);
          messageApi.success("Tạo kho mới thành công!");
        }
        setIsModalVisible(false);
        fetchWarehouses();
      } catch (error) {
        messageApi.error("Có lỗi xảy ra!");
      }
    }).catch((info) => {
        console.log("Validate Failed:", info);
        // Không làm gì cả, Ant Design đã tự hiện dòng chữ đỏ dưới ô input rồi
      });;
  };

  // --- XỬ LÝ XÓA ---
  const handleDelete = (id) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await warehouseService.deleteWarehouse(deletingId);
      messageApi.success("Xóa kho thành công!");
      fetchWarehouses();
    } catch (error) {
      messageApi.error("Lỗi khi xóa kho!");
    }
    setIsDeleteModalOpen(false);
    setDeletingId(null);
  };

  // [!] HÀM XỬ LÝ XEM CHI TIẾT
  const handleViewDetail = async (record) => {
    try {
      setCurrentWarehouseName(record.tenKho);
      // Gọi API lấy danh sách sản phẩm trong kho
      const response = await warehouseService.getInventoryByWarehouse(record.maKho);
      setInventoryList(response.data || []);
      setIsDetailModalOpen(true);
    } catch (error) {
      messageApi.error("Lỗi tải dữ liệu tồn kho!");
    }
  };

  // Cột cho bảng chính (Danh sách kho)
  const columns = [
    { title: "Mã Kho", dataIndex: "maKho", key: "maKho", width: 80 },
    { title: "Tên Kho", dataIndex: "tenKho", key: "tenKho", width: 200 },
    { title: "Địa Chỉ", dataIndex: "diaChi", key: "diaChi" },
    { title: "Ghi Chú", dataIndex: "ghiChu", key: "ghiChu" },
    {
      title: "Hành động",
      key: "action",
      width: 200,
      render: (_, record) => (
        <Space size="middle">
          {/* [!] Nút Xem Chi Tiết */}
          <Button icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
          
          </Button>

          {canEdit && (
            <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          )}
          {canDelete && (
            <Button 
              icon={<DeleteOutlined />} 
              danger 
              onClick={() => handleDelete(record.maKho)}
            />
          )}
        </Space>
      ),
    },
  ];

  // [!] Cột cho bảng chi tiết tồn kho (Trong Modal)
  const inventoryColumns = [
    { title: "Mã SP", dataIndex: "maSP", key: "maSP", width: 80 },
    { title: "Tên Sản Phẩm", dataIndex: "tenSP", key: "tenSP" },
    { title: "ĐVT", dataIndex: "donViTinh", key: "donViTinh", width: 80 },
    { 
      title: "Giá Nhập", 
      dataIndex: "giaNhap", 
      key: "giaNhap",
      render: (val) => `${Number(val).toLocaleString()} đ`
    },
    { 
      title: "Số Lượng Tồn", 
      dataIndex: "soLuongTon", 
      key: "soLuongTon",
      render: (val) => <Tag color={val > 0 ? "blue" : "red"}>{val}</Tag>
    },
  ];

  return (
    <div>
      {contextHolder}
      <Space style={{ marginBottom: 16 }}>
        {canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal}>
            Thêm Kho Mới
          </Button>
        )}
        <Button icon={<ReloadOutlined />} onClick={fetchWarehouses} loading={loading}>
          Tải lại
        </Button>
      </Space>

      <Table
        className="fixed-height-table"
        columns={columns}
        dataSource={warehouses}
        loading={loading}
        rowKey="maKho"
        pagination={{ pageSize: 5 }}
      />

      {/* MODAL THÊM/SỬA */}
      <Modal
        title={editingWarehouse ? "Sửa Kho Hàng" : "Thêm Kho Hàng"}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item 
            name="tenKho" 
            label="Tên Kho" 
            rules={[{ required: true, message: "Vui lòng nhập tên kho!" }]}
          >
            <Input placeholder="Ví dụ: Kho Chính" />
          </Form.Item>
          <Form.Item 
            name="diaChi" 
            label="Địa Chỉ" 
            rules={[{ required: true, message: "Vui lòng nhập địa chỉ!" }]}
          >
            <Input placeholder="Ví dụ: 123 Đường ABC..." />
          </Form.Item>
          <Form.Item name="ghiChu" label="Ghi Chú">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL XÓA */}
      <Modal
        title="Xác nhận xóa"
        open={isDeleteModalOpen}
        onOk={handleDeleteConfirm}
        onCancel={() => setIsDeleteModalOpen(false)}
        okText="Xóa"
        cancelText="Hủy"
        okType="danger"
      >
        <p>Bạn có chắc muốn xóa kho này không? Hành động này không thể hoàn tác.</p>
      </Modal>

      {/* [!] MODAL CHI TIẾT TỒN KHO (MỚI) */}
      <Modal
        title={`Chi tiết tồn kho: ${currentWarehouseName}`}
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalOpen(false)}>
            Đóng
          </Button>
        ]}
        width={800}
      >
        <Table 
          dataSource={inventoryList}
          columns={inventoryColumns}
          rowKey="maSP"
          pagination={{ pageSize: 5 }}
        />
      </Modal>
    </div>
  );
};

export default WarehousePage;