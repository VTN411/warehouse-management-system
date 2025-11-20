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
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import * as warehouseService from "../../services/warehouse.service";

// [!] SỬA LẠI: Dùng TÊN QUYỀN (String) thay vì ID số
const PERM_KHO_CREATE = "PERM_KHO_CREATE";
const PERM_KHO_EDIT = "PERM_KHO_EDIT";
const PERM_KHO_DELETE = "PERM_KHO_DELETE";

const WarehousePage = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  
  const [permissions, setPermissions] = useState([]);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

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

  // Lấy quyền từ localStorage
  useEffect(() => {
    fetchWarehouses();
    const storedUser = localStorage.getItem("user_info");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      // Lưu mảng quyền (Ví dụ: ["PERM_KHO_CREATE", ...])
      setPermissions(user.quyen || []);
    }
  }, [fetchWarehouses]);

  // Kiểm tra quyền (So sánh String với String)
  const canCreate = permissions.includes(PERM_KHO_CREATE);
  const canEdit = permissions.includes(PERM_KHO_EDIT);
  const canDelete = permissions.includes(PERM_KHO_DELETE);

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
    });
  };

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

  const columns = [
    { title: "Mã Kho", dataIndex: "maKho", key: "maKho", width: 80 },
    { title: "Tên Kho", dataIndex: "tenKho", key: "tenKho", width: 200 },
    { title: "Địa Chỉ", dataIndex: "diaChi", key: "diaChi" },
    { title: "Ghi Chú", dataIndex: "ghiChu", key: "ghiChu" },
    {
      title: "Hành động",
      key: "action",
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          {/* Nút Sửa chỉ hiện khi có PERM_KHO_EDIT */}
          {canEdit && (
            <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>
              Sửa
            </Button>
          )}
          
          {/* Nút Xóa chỉ hiện khi có PERM_KHO_DELETE */}
          {canDelete && (
            <Button 
              icon={<DeleteOutlined />} 
              danger 
              onClick={() => handleDelete(record.maKho)}
            >
              Xóa
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      {contextHolder}
      <Space style={{ marginBottom: 16 }}>
        
        {/* Nút Thêm chỉ hiện khi có PERM_KHO_CREATE */}
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
    </div>
  );
};

export default WarehousePage;