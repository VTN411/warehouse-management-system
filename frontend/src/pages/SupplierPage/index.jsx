// src/pages/SupplierPage/index.jsx

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
import * as supplierService from "../../services/supplier.service";

// [!] 1. CẬP NHẬT ID QUYỀN (Theo SQL)
const PERM_SUPPLIER_CREATE = 61;
const PERM_SUPPLIER_EDIT = 62;
const PERM_SUPPLIER_DELETE = 63;

const SupplierPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  
  const [permissions, setPermissions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // State cho modal xóa
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await supplierService.getAllSuppliers();
      setSuppliers(response.data || []);
    } catch (error) {
      messageApi.error("Không thể tải danh sách nhà cung cấp!");
    }
    setLoading(false);
  }, [messageApi]);

  // [!] 2. CẬP NHẬT LOGIC LẤY QUYỀN (Chuẩn hóa)
  useEffect(() => {
    fetchSuppliers();
    try {
      const storedUser = localStorage.getItem("user_info");
      if (storedUser) {
        let user = JSON.parse(storedUser);
        
        // Fix lỗi dữ liệu lồng nhau
        if (user.quyen && !Array.isArray(user.quyen) && user.quyen.maNguoiDung) {
             user = user.quyen;
        }

        // Kiểm tra Admin
        const role = user.vaiTro || user.tenVaiTro || "";
        setIsAdmin(role === "ADMIN");

        // Lấy mảng ID quyền
        let perms = user.dsQuyenSoHuu || user.quyen;
        if (!Array.isArray(perms)) perms = [];
        
        setPermissions(perms);
      }
    } catch (e) {
      console.error("Lỗi đọc quyền:", e);
      setPermissions([]);
    }
  }, [fetchSuppliers]);

  // [!] 3. KIỂM TRA QUYỀN: Có ID quyền HOẶC là Admin
  const canCreate = isAdmin || permissions.includes(PERM_SUPPLIER_CREATE); // ID 61
  const canEdit = isAdmin || permissions.includes(PERM_SUPPLIER_EDIT);     // ID 62
  const canDelete = isAdmin || permissions.includes(PERM_SUPPLIER_DELETE); // ID 63

  // --- XỬ LÝ MODAL THÊM / SỬA ---
  const handleOpenModal = () => {
    setEditingSupplier(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingSupplier(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form.validateFields().then(async (values) => {
      try {
        if (editingSupplier) {
          await supplierService.updateSupplier(editingSupplier.maNCC, values);
          messageApi.success("Cập nhật nhà cung cấp thành công!");
        } else {
          await supplierService.createSupplier(values);
          messageApi.success("Thêm nhà cung cấp thành công!");
        }
        setIsModalVisible(false);
        fetchSuppliers();
      } catch (error) {
        messageApi.error("Có lỗi xảy ra!");
      }
    });
  };

  // --- XỬ LÝ XÓA ---
  const handleDelete = (id) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await supplierService.deleteSupplier(deletingId);
      messageApi.success("Xóa nhà cung cấp thành công!");
      fetchSuppliers();
    } catch (error) {
      messageApi.error("Lỗi khi xóa nhà cung cấp!");
    }
    setIsDeleteModalOpen(false);
    setDeletingId(null);
  };

  // --- CẤU HÌNH CỘT ---
  const columns = [
    { title: "Mã NCC", dataIndex: "maNCC", key: "maNCC", width: 80 },
    { title: "Tên Nhà Cung Cấp", dataIndex: "tenNCC", key: "tenNCC", width: 200 },
    { title: "Người Liên Hệ", dataIndex: "nguoiLienHe", key: "nguoiLienHe" },
    { title: "SĐT", dataIndex: "sdt", key: "sdt" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Địa Chỉ", dataIndex: "diaChi", key: "diaChi" },
    {
      title: "Hành động",
      key: "action",
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          {/* Nút Sửa (Quyền 62) */}
          {canEdit && (
            <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>
              Sửa
            </Button>
          )}
          
          {/* Nút Xóa (Quyền 63) */}
          {canDelete && (
            <Button 
              icon={<DeleteOutlined />} 
              danger 
              onClick={() => handleDelete(record.maNCC)}
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
        {/* Nút Thêm (Quyền 61) */}
        {canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal}>
            Thêm Nhà Cung Cấp
          </Button>
        )}
        <Button icon={<ReloadOutlined />} onClick={fetchSuppliers} loading={loading}>
          Tải lại
        </Button>
      </Space>

      <Table
        className="fixed-height-table"
        columns={columns}
        dataSource={suppliers}
        loading={loading}
        rowKey="maNCC"
        pagination={{ pageSize: 5 }}
      />

      {/* MODAL THÊM/SỬA */}
      <Modal
        title={editingSupplier ? "Sửa Nhà Cung Cấp" : "Thêm Nhà Cung Cấp"}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item 
            name="tenNCC" 
            label="Tên Nhà Cung Cấp" 
            rules={[{ required: true, message: "Vui lòng nhập tên!" }]}
          >
            <Input placeholder="Ví dụ: Samsung Vina" />
          </Form.Item>

          <Form.Item name="nguoiLienHe" label="Người Liên Hệ">
            <Input placeholder="Ví dụ: Mr. Kim" />
          </Form.Item>

          <Form.Item name="sdt" label="Số Điện Thoại">
            <Input placeholder="Ví dụ: 0909..." />
          </Form.Item>

          <Form.Item name="email" label="Email" rules={[{ type: 'email' }]}>
            <Input placeholder="Ví dụ: contact@samsung.com" />
          </Form.Item>

          <Form.Item name="diaChi" label="Địa Chỉ">
            <Input.TextArea rows={2} placeholder="Ví dụ: Khu công nghệ cao..." />
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
        <p>Bạn có chắc muốn xóa nhà cung cấp này không?</p>
      </Modal>
    </div>
  );
};

export default SupplierPage;