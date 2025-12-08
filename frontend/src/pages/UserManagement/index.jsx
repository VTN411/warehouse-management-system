// src/pages/UserManagement/index.jsx
// (Giữ nguyên các import và logic, chỉ thêm vào permissionGroups)

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

// [!] CẬP NHẬT DANH SÁCH QUYỀN
const permissionGroups = [
  // 1. NHÓM QUẢN TRỊ & HỆ THỐNG
  {
    label: "Quản trị Hệ thống",
    perms: [
      { id: 14, name: "Xem Danh sách User" },
      { id: 10, name: "Tạo User Mới" },
      { id: 11, name: "Sửa User" },
      { id: 12, name: "Xóa User" },
      { id: 13, name: "Cập nhật Cấu hình" },
      { id: 100, name: "Xem Nhật ký hệ thống" },
    ],
  },
  
  // 2. DASHBOARD & BÁO CÁO
  {
    label: "Báo cáo & Thống kê",
    perms: [
      { id: 130, name: "Xem Dashboard Tổng quan" },
      { id: 30, name: "Xem Báo cáo Tổng hợp" },
      { id: 103, name: "Xem Báo cáo Tồn kho" },
      { id: 101, name: "Xem Lịch sử Giao dịch" },
      { id: 131, name: "Xem Báo cáo Nhập-Xuất-Tồn" },
    ],
  },

  // 3. NHÓM DANH MỤC
  {
    label: "Quản lý Sản phẩm",
    perms: [
      { id: 50, name: "Tạo Sản phẩm" },
      { id: 51, name: "Sửa Sản phẩm" },
      { id: 52, name: "Xóa Sản phẩm" },
    ],
  },
  {
    label: "Quản lý Loại hàng",
    perms: [
      { id: 140, name: "Xem Loại hàng" },
      { id: 141, name: "Tạo Loại hàng" },
      { id: 142, name: "Sửa Loại hàng" },
      { id: 143, name: "Xóa Loại hàng" },
    ],
  },
  {
    label: "Quản lý Kho hàng",
    perms: [
      { id: 70, name: "Xem Danh sách Kho" },
      { id: 71, name: "Tạo Kho" },
      { id: 72, name: "Sửa Kho" },
      { id: 73, name: "Xóa Kho" },
    ],
  },
  {
    label: "Đối tác (NCC & Khách)",
    perms: [
      { id: 60, name: "Xem Nhà Cung Cấp" },
      { id: 61, name: "Tạo NCC" },
      { id: 62, name: "Sửa NCC" },
      { id: 63, name: "Xóa NCC" },
      { id: 90, name: "Xem Khách Hàng" },
      { id: 91, name: "Tạo Khách Hàng" },
      { id: 92, name: "Sửa Khách Hàng" },
      { id: 93, name: "Xóa Khách Hàng" },
    ],
  },

  // 4. NGHIỆP VỤ KHO
  {
    label: "Nhập Kho",
    perms: [
      { id: 26, name: "Xem DS Phiếu Nhập" },
      { id: 20, name: "Tạo Phiếu Nhập" },
      { id: 21, name: "Sửa Phiếu Nhập (Chờ duyệt)" },
      { id: 22, name: "Xóa Phiếu Nhập" },
      { id: 40, name: "Duyệt Phiếu Nhập" },
      { id: 41, name: "Hủy Phiếu Nhập" },
      { id: 120, name: "Sửa Phiếu Nhập Đã Duyệt (30 ngày)" },
      { id: 31, name: "Duyệt Đơn Đặt Hàng (PO)" },
    ],
  },
  {
    label: "Xuất Kho",
    perms: [
      { id: 27, name: "Xem DS Phiếu Xuất" },
      { id: 23, name: "Tạo Phiếu Xuất" },
      { id: 24, name: "Sửa Phiếu Xuất (Chờ duyệt)" },
      { id: 25, name: "Xóa Phiếu Xuất" },
      { id: 42, name: "Duyệt Phiếu Xuất" },
      { id: 43, name: "Hủy Phiếu Xuất" },
      { id: 121, name: "Sửa Phiếu Xuất Đã Duyệt (30 ngày)" },
      { id: 32, name: "Duyệt Đơn Bán Hàng (SO)" },
    ],
  },
  {
    label: "Điều Chuyển Kho",
    perms: [
      { id: 110, name: "Xem Điều Chuyển" },
      { id: 111, name: "Tạo Điều Chuyển" },
      { id: 112, name: "Duyệt Điều Chuyển" },
      { id: 113, name: "Hủy Điều Chuyển" },
      { id: 114, name: "Sửa Điều Chuyển Đã Duyệt" },
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

  const [currentUserPermissions, setCurrentUserPermissions] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState(null);

  const danhSachVaiTro = [
    { MaVaiTro: 1, TenVaiTro: "ADMIN" },
    { MaVaiTro: 2, TenVaiTro: "NHAN_VIEN" },
    { MaVaiTro: 3, TenVaiTro: "THUKHO" },
    { MaVaiTro: 4, TenVaiTro: "QUAN_LY" },
    { MaVaiTro: 5, TenVaiTro: "GIANG_VIEN" },

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
    try {
      const storedUser = localStorage.getItem("user_info");
      if (storedUser) {
        let user = JSON.parse(storedUser);
        if (
          user.quyen &&
          !Array.isArray(user.quyen) &&
          user.quyen.maNguoiDung
        ) {
          user = user.quyen;
        }
        const roleName = user.vaiTro || user.tenVaiTro || "";
        setCurrentUserRole(roleName);
        let perms = user.dsQuyenSoHuu || user.quyen;
        if (!Array.isArray(perms)) perms = [];
        setCurrentUserPermissions(perms);
      }
    } catch (e) {
      setCurrentUserPermissions([]);
    }
  }, [fetchUsers]);

  const isMyRoleAdmin = currentUserRole === "ADMIN";
  const canEdit = isMyRoleAdmin || currentUserPermissions.includes(11);
  const canDelete = isMyRoleAdmin || currentUserPermissions.includes(12);
  const canCreate = isMyRoleAdmin || currentUserPermissions.includes(10);
  const canManagePerms = isMyRoleAdmin;

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
          messageApi.error("Có lỗi xảy ra!");
        }
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
        // Không làm gì cả, Ant Design đã tự hiện dòng chữ đỏ dưới ô input rồi
      });
  };

  const handleGrantPermission = async (userId, permId, permName) => {
    try {
      await userService.grantPermission(userId, permId);
      messageApi.success(`Đã cấp quyền '${permName}'`);
      fetchUsers();
    } catch (error) {
      messageApi.error(
        `Lỗi: ${error.response?.data?.message || "Không thể cấp quyền"}`
      );
    }
  };

  const handleRevokePermission = async (userId, permId, permName) => {
    try {
      await userService.revokePermission(userId, permId);
      messageApi.success(`Đã thu hồi quyền '${permName}'`);
      fetchUsers();
    } catch (error) {
      messageApi.error(
        `Lỗi: ${error.response?.data?.message || "Không thể thu hồi quyền"}`
      );
    }
  };

  const createPermissionMenu = (userRecord) => {
    const userPerms = userRecord.dsQuyenSoHuu || [];

    const items = permissionGroups.map((group, index) => {
      const subItems = group.perms.flatMap((perm) => {
        const hasPermission = userPerms.includes(perm.id);
        if (hasPermission) {
          return {
            key: `revoke-${perm.id}`,
            label: `Thu hồi: ${perm.name}`,
            danger: true,
            onClick: () =>
              handleRevokePermission(
                userRecord.maNguoiDung,
                perm.id,
                perm.name
              ),
          };
        } else {
          return {
            key: `grant-${perm.id}`,
            label: `Cấp: ${perm.name}`,
            onClick: () =>
              handleGrantPermission(userRecord.maNguoiDung, perm.id, perm.name),
          };
        }
      });
      return {
        key: `group-${index}`,
        label: group.label,
        children: subItems,
      };
    });
    return { items };
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
        <Space
          size="middle"
          wrap
        >
          {canEdit && (
            <Button
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            ></Button>
          )}
          {canDelete && (
            <Button
              icon={<DeleteOutlined />}
              danger
              onClick={() => handleDelete(record.maNguoiDung)}
            ></Button>
          )}
          {canManagePerms && (
            <Dropdown
              menu={createPermissionMenu(record)}
              placement="bottomRight"
              trigger={["click"]}
            >
              <Button icon={<SettingOutlined />}></Button>
            </Dropdown>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      {contextHolder}
      {canCreate && (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenModal}
          style={{ marginBottom: 16 }}
        >
          Thêm người dùng mới
        </Button>
      )}
      <Table
        className="fixed-height-table"
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
        <Form
          form={form}
          layout="vertical"
          name="userForm"
        >
          <Form.Item
            name="tenDangNhap"
            label="Tên Đăng Nhập"
            rules={[{ required: true, message: "Vui lòng nhập Tên Đăng Nhập" }]}
          >
            <Input disabled={!!editingUser} />
          </Form.Item>
          <Form.Item
            name="hoTen"
            label="Họ Tên"
            rules={[{ required: true, message: "Vui lòng nhập Họ Tên" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Vui lòng nhập Email", type: "email" },
            ]}
          >
            <Input />
          </Form.Item>
          {!editingUser && (
            <Form.Item
              name="matKhau"
              label="Mật Khẩu"
              rules={[{ required: true, message: "Vui lòng nhập Mật Khẩu" }]}
            >
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item
            name="sdt"
            label="Số Điện Thoại"
            rules={[{ required: true, message: "Vui lòng nhập Số Điện Thoại" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="maVaiTro"
            label="Vai Trò"
            rules={[{ required: true, message: "Vui lòng chọn Vai Trò" }]}
          >
            <Select placeholder="Chọn một vai trò">
              {danhSachVaiTro.map((vt) => (
                <Option
                  key={vt.MaVaiTro}
                  value={vt.MaVaiTro}
                >
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
