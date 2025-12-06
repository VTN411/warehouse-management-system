// src/pages/CategoryPage/index.jsx

import React, { useState, useEffect, useCallback } from "react";
import { Table, Button, Modal, Form, Input, Space, message, Card } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import * as categoryService from "../../services/category.service";

// [!] ID QUYỀN MỚI
const PERM_VIEW = 140;
const PERM_CREATE = 141;
const PERM_EDIT = 142;
const PERM_DELETE = 143;

const CategoryPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [permissions, setPermissions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // 1. Lấy danh sách
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await categoryService.getAllCategories();
      setCategories(response.data || []);
    } catch (error) {
      messageApi.error("Không thể tải danh sách loại hàng!");
    }
    setLoading(false);
  }, [messageApi]);

  // 2. Check quyền
  useEffect(() => {
    fetchCategories();
    try {
      const storedUser = localStorage.getItem("user_info");
      if (storedUser) {
        let user = JSON.parse(storedUser);
        if (user.quyen && !Array.isArray(user.quyen) && user.quyen.maNguoiDung)
          user = user.quyen;

        const role = user.vaiTro || user.tenVaiTro || "";
        setIsAdmin(role === "ADMIN");

        let perms = user.dsQuyenSoHuu || user.quyen;
        setPermissions(Array.isArray(perms) ? perms : []);
      }
    } catch (e) {
      setPermissions([]);
    }
  }, [fetchCategories]);

  const checkPerm = (id) => isAdmin || permissions.includes(id);
  const canView = checkPerm(PERM_VIEW);
  const canCreate = checkPerm(PERM_CREATE);
  const canEdit = checkPerm(PERM_EDIT);
  const canDelete = checkPerm(PERM_DELETE);

  // --- HANDLERS ---
  const handleOpenModal = () => {
    setEditingCategory(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingCategory(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form
      .validateFields()
      .then(async (values) => {
        try {
          if (editingCategory) {
            await categoryService.updateCategory(
              editingCategory.maLoai,
              values
            );
            messageApi.success("Cập nhật thành công!");
          } else {
            await categoryService.createCategory(values);
            messageApi.success("Tạo mới thành công!");
          }
          setIsModalVisible(false);
          fetchCategories();
        } catch (error) {
          messageApi.error("Có lỗi xảy ra!");
        }
      })
      .catch(() => {});
  };

  const handleDelete = (id) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await categoryService.deleteCategory(deletingId);
      messageApi.success("Đã xóa thành công!");
      fetchCategories();
    } catch (error) {
      messageApi.error("Lỗi khi xóa (Có thể đang được sử dụng)!");
    }
    setIsDeleteModalOpen(false);
  };

  const columns = [
    { title: "Mã", dataIndex: "maLoai", width: 80, align: "center" },
    {
      title: "Tên Loại Hàng",
      dataIndex: "tenLoai",
      width: 250,
      render: (text) => <b>{text}</b>,
    },
    { title: "Mô Tả", dataIndex: "moTa" },
    {
      title: "Hành động",
      key: "action",
      width: 150,
      align: "center",
      render: (_, record) => (
        <Space size="middle">
          {canEdit && (
            <Button
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          )}
          {canDelete && (
            <Button
              icon={<DeleteOutlined />}
              danger
              onClick={() => handleDelete(record.maLoai)}
            />
          )}
        </Space>
      ),
    },
  ];

  if (!canView && !isAdmin)
    return <Card>Bạn không có quyền xem trang này.</Card>;

  return (
    <div>
      {contextHolder}
      <Space style={{ marginBottom: 16 }}>
        {canCreate && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenModal}
          >
            Thêm Loại Hàng
          </Button>
        )}
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchCategories}
          loading={loading}
        >
          Tải lại
        </Button>
      </Space>

      <Table
        className="fixed-height-table"
        columns={columns}
        dataSource={categories}
        loading={loading}
        rowKey="maLoai"
        pagination={{ pageSize: 10 }}
      />

      {/* Modal Form */}
      <Modal
        title={editingCategory ? "Sửa Loại Hàng" : "Thêm Loại Hàng"}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="tenLoai"
            label="Tên Loại Hàng"
            rules={[{ required: true, message: "Vui lòng nhập tên loại!" }]}
          >
            <Input placeholder="Ví dụ: Điện tử, Gia dụng..." />
          </Form.Item>
          <Form.Item
            name="moTa"
            label="Mô Tả"
          >
            <Input.TextArea
              rows={3}
              placeholder="Mô tả chi tiết..."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Xóa */}
      <Modal
        title="Xác nhận xóa"
        open={isDeleteModalOpen}
        onOk={handleDeleteConfirm}
        onCancel={() => setIsDeleteModalOpen(false)}
        okText="Xóa"
        cancelText="Hủy"
        okType="danger"
      >
        <p>Bạn có chắc muốn xóa loại hàng này không?</p>
      </Modal>
    </div>
  );
};

export default CategoryPage;
