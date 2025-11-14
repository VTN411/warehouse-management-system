// src/pages/UserManagement/index.jsx

import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  message,
  Select,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import * as userService from "../../services/user.service";

const { Option } = Select;

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);

  const [messageApi, contextHolder] = message.useMessage();

  const danhSachVaiTro = [
    { MaVaiTro: 1, TenVaiTro: "ADMIN" },
    { MaVaiTro: 2, TenVaiTro: "NHAN_VIEN" },
    { MaVaiTro: 3, TenVaiTro: "THUKHO" },
    { MaVaiTro: 4, TenVaiTro: "QUAN_LY" },
  ];

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await userService.getAllUsers();
      setUsers(response.data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách người dùng:", error);
      messageApi.error("Không thể tải danh sách người dùng!");
    }
    setLoading(false);
  }, [messageApi]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // --- (Các hàm logic y hệt như cũ) ---

  const handleOpenModal = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalVisible(true);
    setIsDeleteModalOpen(false);
  };

  const handleEdit = (record) => {
    setEditingUser(record);
    const vaiTroId = danhSachVaiTro.find(
      (vt) => vt.TenVaiTro === record.tenVaiTro
    )?.MaVaiTro;

    form.setFieldsValue({
      tenDangNhap: record.tenDangNhap,
      hoTen: record.hoTen,
      email: record.email,
      sdt: record.sdt,
      maVaiTro: vaiTroId,
    });
    setIsModalVisible(true);
    setIsDeleteModalOpen(false);
  };

  const handleDelete = (userId) => {
    setDeletingUserId(userId);
    setIsDeleteModalOpen(true);
    setIsModalVisible(false);
  };

  const handleDeleteConfirm = async () => {
    try {
      await userService.deleteUser(deletingUserId);
      messageApi.success("Xóa người dùng thành công!");
      fetchUsers();
    } catch (error) {
      let errMsg = "Lỗi khi xóa người dùng!";
      if (error.response?.data?.message) {
        errMsg = error.response.data.message;
      }
      messageApi.error(errMsg);
    }
    setIsDeleteModalOpen(false);
    setDeletingUserId(null);
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setDeletingUserId(null);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleOk = () => {
    form
      .validateFields()
      .then(async (values) => {
        try {
          if (editingUser) {
            // Khi sửa, 'values' từ form không chứa 'tenDangNhap' (vì bị disabled)
            // Hoặc nếu có, nó vẫn ổn.
            // API updateUser của bạn nên bỏ qua 'tenDangNhap'
            await userService.updateUser(editingUser.maNguoiDung, values);
            messageApi.success("Cập nhật người dùng thành công!");
          } else {
            await userService.createUser(values);
            messageApi.success("Tạo người dùng mới thành công!");
          }
          setIsModalVisible(false);
          fetchUsers();
        } catch (error) {
          console.error("Chi tiết lỗi từ server:", error.response);
          let errorMessage = "Có lỗi xảy ra!";
          if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (typeof error.response?.data === "string") {
            errorMessage = error.response.data;
          }
          messageApi.error(errorMessage);
        }
      })
      .catch((info) => {
        console.log("Validate Form Thất Bại:", info);
        messageApi.warning("Vui lòng điền đầy đủ thông tin!");
      });
  };

  const columns = [
    { title: "Họ Tên", dataIndex: "hoTen", key: "hoTen" },
    { title: "Tên Đăng Nhập", dataIndex: "tenDangNhap", key: "tenDangNhap" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Số Điện Thoại", dataIndex: "sdt", key: "sdt" },
    { title: "Vai Trò", dataIndex: "tenVaiTro", key: "tenVaiTro" },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDelete(record.maNguoiDung)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  // Phần Render (return)
  return (
    <div>
      {contextHolder}

      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={handleOpenModal}
        style={{ marginBottom: 16 }}
      >
        Thêm người dùng mới
      </Button>

      <Table
        columns={columns}
        dataSource={users}
        loading={loading}
        rowKey="maNguoiDung"
      />

      {/* MODAL 1: THÊM/SỬA */}
      <Modal
        title={editingUser ? "Sửa người dùng" : "Tạo người dùng mới"}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form form={form} layout="vertical" name="userForm">
          {/* [!] ĐÂY LÀ THAY ĐỔI CỦA BẠN */}
          <Form.Item
            name="tenDangNhap"
            label="Tên Đăng Nhập"
            rules={[{ required: true, message: "Vui lòng nhập!" }]}
          >
            <Input disabled={!!editingUser} />
          </Form.Item>

          <Form.Item
            name="hoTen"
            label="Họ Tên"
            rules={[{ required: true, message: "Vui lòng nhập!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Vui lòng nhập!" },
              { type: "email", message: "Email không hợp lệ!" },
            ]}
          >
            <Input />
          </Form.Item>
          {!editingUser && (
            <Form.Item
              name="matKhau"
              label="Mật Khẩu"
              rules={[{ required: true, message: "Vui lòng nhập!" }]}
            >
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item
            name="sdt"
            label="Số Điện Thoại"
            rules={[{ required: true, message: "Vui lòng nhập!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="maVaiTro"
            label="Vai Trò"
            rules={[{ required: true, message: "Vui lòng chọn vai trò!" }]}
          >
            <Select placeholder="Chọn một vai trò">
              {danhSachVaiTro.map((vt) => (
                <Option key={vt.MaVaiTro} value={vt.MaVaiTro}>
                  {vt.TenVaiTro}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL 2: XÁC NHẬN XÓA */}
      <Modal
        title="Xác nhận xóa"
        open={isDeleteModalOpen}
        onOk={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        okText="Xóa"
        cancelText="Hủy"
        okType="danger"
      >
        <p>
          Bạn có chắc muốn xóa người dùng này? Hành động này không thể hoàn tác.
        </p>
      </Modal>
    </div>
  );
};

export default UserManagementPage;
