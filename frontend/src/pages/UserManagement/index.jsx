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
  Dropdown,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import * as userService from "../../services/user.service";

const { Option } = Select;

// Định nghĩa tất cả các quyền
const permissionGroups = [
  {
    label: "Phiếu Nhập",
    perms: [
      { id: 20, name: "Tạo Phiếu Nhập" },
      { id: 21, name: "Sửa Phiếu Nhập" },
      { id: 22, name: "Xóa Phiếu Nhập" },
    ],
  },
  {
    label: "Phiếu Xuất",
    perms: [
      { id: 23, name: "Tạo Phiếu Xuất" },
      { id: 24, name: "Sửa Phiếu Xuất" },
      { id: 25, name: "Xóa Phiếu Xuất" },
    ],
  },
  {
    label: "Báo cáo & Duyệt",
    perms: [
      { id: 30, name: "Xem Báo cáo" },
      { id: 31, name: "Duyệt Đơn Đặt hàng (PO)" },
      { id: 32, name: "Duyệt Đơn Bán hàng (SO)" },
    ],
  },
];

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
      messageApi.error("Không thể tải danh sách người dùng!");
    }
    setLoading(false);
  }, [messageApi]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // --- CÁC HÀM XỬ LÝ (SỬ DỤNG CÁC STATE SETTER) ---

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
    setEditingUser(null);
  };

  const handleOk = () => {
    form
      .validateFields()
      .then(async (values) => {
        try {
          if (editingUser) {
            await userService.updateUser(editingUser.maNguoiDung, values);
            messageApi.success("Cập nhật người dùng thành công!");
          } else {
            await userService.createUser(values);
            messageApi.success("Tạo người dùng mới thành công!");
          }
          setIsModalVisible(false);
          setEditingUser(null);
          fetchUsers();
        } catch (error) {
          let errMsg = "Có lỗi xảy ra!";
          if (error.response?.data?.message) {
            errMsg = error.response.data.message;
          }
          messageApi.error(errMsg);
        }
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  // --- CÁC HÀM PHÂN QUYỀN ---
  
  const handleGrantPermission = async (userId, permId, permName) => {
    try {
      await userService.grantPermission(userId, permId);
      messageApi.success(`Đã cấp quyền '${permName}'`);
      fetchUsers();
    } catch (error) {
      messageApi.error(`Lỗi khi cấp quyền: ${error.response?.data?.message || 'Lỗi máy chủ'}`);
    }
  };

  const handleRevokePermission = async (userId, permId, permName) => {
    try {
      await userService.revokePermission(userId, permId);
      messageApi.success(`Đã thu hồi quyền '${permName}'`);
      fetchUsers();
    } catch (error) {
      messageApi.error(`Lỗi khi thu hồi quyền: ${error.response?.data?.message || 'Lỗi máy chủ'}`);
    }
  };

  // [!] SỬA LẠI HÀM NÀY ĐỂ HIỂN THỊ CẢ 2 NÚT
  const createPermissionMenu = (userRecord) => {
    
    const items = permissionGroups.map((group, index) => {
      // Dùng flatMap để tạo ra 2 mục menu (Cấp & Thu hồi) cho MỖI quyền
      const subItems = group.perms.flatMap(perm => [
        {
          key: `grant-${perm.id}`,
          label: `Cấp quyền: ${perm.name}`,
          onClick: () => handleGrantPermission(userRecord.maNguoiDung, perm.id, perm.name)
        },
        {
          key: `revoke-${perm.id}`,
          label: `Thu hồi quyền: ${perm.name}`,
          danger: true, // Màu đỏ cho nút thu hồi
          onClick: () => handleRevokePermission(userRecord.maNguoiDung, perm.id, perm.name)
        }
      ]);
      
      return {
        key: `group-${index}`,
        label: group.label,
        children: subItems
      };
    });

    return { items };
  };

  // Cột (columns)
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
          <Space size="middle" wrap>
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
            <Dropdown 
              menu={createPermissionMenu(record)}
              placement="bottomRight"
            >
              <Button icon={<SettingOutlined />}>Phân quyền</Button>
            </Dropdown>
          </Space>
        )
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
        pagination={{ pageSize: 5 }}
      />

      <Modal
        title={editingUser ? "Sửa người dùng" : "Tạo người dùng mới"}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form form={form} layout="vertical" name="userForm">
          <Form.Item name="tenDangNhap" label="Tên Đăng Nhập" rules={[{ required: true }]} >
            <Input disabled={!!editingUser} />
          </Form.Item>
          <Form.Item name="hoTen" label="Họ Tên" rules={[{ required: true }]} >
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]} >
            <Input />
          </Form.Item>
          {!editingUser && (
            <Form.Item name="matKhau" label="Mật Khẩu" rules={[{ required: true }]} >
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item name="sdt" label="Số Điện Thoại" rules={[{ required: true }]} >
            <Input />
          </Form.Item>
          <Form.Item name="maVaiTro" label="Vai Trò" rules={[{ required: true }]} >
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