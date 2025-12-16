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
  Tag,
  Tooltip,
  Row,
  Col,
  Card,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  RestOutlined, // Icon thùng rác
  UndoOutlined, // Icon khôi phục
  ArrowLeftOutlined, // Icon quay lại
  ReloadOutlined,
} from "@ant-design/icons";
import * as userService from "../../services/user.service";

const { Option } = Select;

// [GIỮ NGUYÊN DANH SÁCH QUYỀN CỦA BẠN]
const permissionGroups = [
  // ... (Code cũ của bạn giữ nguyên phần này) ...
  // Để tiết kiệm không gian tôi không paste lại mảng permissionGroups dài dòng,
  // bạn hãy giữ nguyên như file cũ nhé.
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
  {
    label: "Nghiệp vụ Kho",
    perms: [
      { id: 20, name: "Tạo Phiếu Nhập" },
      { id: 23, name: "Tạo Phiếu Xuất" },
      // ... thêm các quyền khác nếu cần
    ],
  },
];

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // State chế độ thùng rác
  const [inTrashMode, setInTrashMode] = useState(false);

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

  // 1. FETCH DATA (THEO CHẾ ĐỘ)
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      let response;
      if (inTrashMode) {
        // Gọi API thùng rác
        response = await userService.getTrashUsers();
      } else {
        // Gọi API danh sách thường
        response = await userService.getAllUsers();
      }
      setUsers(response.data);
    } catch (error) {
      console.error(error);
      messageApi.error("Không thể tải danh sách người dùng!");
    }
    setLoading(false);
  }, [messageApi, inTrashMode]);

  useEffect(() => {
    fetchUsers();
    // Lấy quyền user hiện tại
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
  }, [fetchUsers]); // Chạy lại khi inTrashMode thay đổi

  const isMyRoleAdmin = currentUserRole === "ADMIN";
  const canEdit = isMyRoleAdmin || currentUserPermissions.includes(11);
  const canDelete = isMyRoleAdmin || currentUserPermissions.includes(12);
  const canCreate = isMyRoleAdmin || currentUserPermissions.includes(10);
  const canManagePerms = isMyRoleAdmin;

  // --- HANDLERS ---
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
  };

  const handleDelete = (userId) => {
    setDeletingUserId(userId);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      // Xóa mềm -> Chuyển trạng thái thành 0 (Inactive)
      await userService.deleteUser(deletingUserId);
      messageApi.success("Đã chuyển người dùng vào thùng rác!");
      fetchUsers();
    } catch (error) {
      let errMsg =
        error.response?.data?.message || error.response?.data || "Lỗi khi xóa!";
      messageApi.error(errMsg);
    }
    setIsDeleteModalOpen(false);
    setDeletingUserId(null);
  };

  // --- KHÔI PHỤC (RESTORE) ---
  const handleRestore = async (userId) => {
    try {
      await userService.restoreUser(userId);
      messageApi.success("Khôi phục tài khoản thành công!");
      fetchUsers(); // Load lại danh sách thùng rác
    } catch (error) {
      messageApi.error(error.response?.data?.message || "Lỗi khi khôi phục!");
    }
  };

  const handleOk = () => {
    form
      .validateFields()
      .then(async (values) => {
        try {
          if (editingUser) {
            await userService.updateUser(editingUser.maNguoiDung, values);
            messageApi.success("Cập nhật thành công!");
          } else {
            await userService.createUser(values);
            messageApi.success("Tạo người dùng mới thành công!");
          }
          setIsModalVisible(false);
          fetchUsers();
        } catch (error) {
          const errorMessage =
            error.response?.data?.message ||
            error.response?.data ||
            "Có lỗi xảy ra!";
          if (
            errorMessage.toLowerCase().includes("duplicate") ||
            errorMessage.toLowerCase().includes("tồn tại")
          ) {
            messageApi.error("Tên đăng nhập đã tồn tại!");
          } else {
            messageApi.error(errorMessage);
          }
        }
      })
      .catch(() => {});
  };

  // (Giữ nguyên logic permission menu)
  const handleGrantPermission = async (userId, permId, permName) => {
    try {
      await userService.grantPermission(userId, permId);
      messageApi.success(`Đã cấp quyền '${permName}'`);
      fetchUsers();
    } catch (error) {
      messageApi.error("Không thể cấp quyền");
    }
  };

  const handleRevokePermission = async (userId, permId, permName) => {
    try {
      await userService.revokePermission(userId, permId);
      messageApi.success(`Đã thu hồi quyền '${permName}'`);
      fetchUsers();
    } catch (error) {
      messageApi.error("Không thể thu hồi quyền");
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
      return { key: `group-${index}`, label: group.label, children: subItems };
    });
    return { items };
  };

  // --- CỘT BẢNG ---
  const columns = [
    { title: "Họ Tên", dataIndex: "hoTen", key: "hoTen" },
    { title: "Tên Đăng Nhập", dataIndex: "tenDangNhap", key: "tenDangNhap" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "SĐT", dataIndex: "sdt", key: "sdt" },
    {
      title: "Vai Trò",
      dataIndex: "tenVaiTro",
      key: "tenVaiTro",
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Trạng thái",
      key: "status",
      align: "center",
      render: (_, record) => {
        // Dựa vào logic Backend trả về hoặc logic inTrashMode
        // Trong DB ảnh bạn gửi: TrangThai 1 là Active, 0 là Inactive/Deleted
        const val = record.trangThai ?? record.TrangThai;

        // XỬ LÝ CHO BIT(1) -> Boolean
        // Kiểm tra xem val có phải là true, hoặc số 1, hoặc chuỗi "1" không
        const isActive = val === true || val === 1 || val === "1";

        return isActive ? (
          <Tag color="green"> Hoạt động</Tag>
        ) : (
          <Tag color="red"> Đã khóa/Xóa</Tag>
        );
      },
    },
    {
      title: "Hành động",
      key: "action",
      width: 150,
      render: (_, record) => (
        <Space
          size="middle"
          wrap
        >
          {inTrashMode ? (
            // 1. TRONG THÙNG RÁC: Chỉ hiện nút Khôi Phục
            <Tooltip title="Khôi phục tài khoản">
              <Button
                type="primary"
                ghost
                icon={<UndoOutlined />}
                onClick={() => handleRestore(record.maNguoiDung)}
              >
                Khôi phục
              </Button>
            </Tooltip>
          ) : (
            // 2. DANH SÁCH CHÍNH: Hiện Sửa/Xóa/Quyền
            <>
              {canEdit && (
                <Tooltip title="Sửa thông tin">
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(record)}
                  />
                </Tooltip>
              )}

              {canDelete && (
                <Tooltip title="Xóa tài khoản">
                  <Button
                    icon={<DeleteOutlined />}
                    danger
                    onClick={() => handleDelete(record.maNguoiDung)}
                  />
                </Tooltip>
              )}

              {canManagePerms && (
                <Dropdown
                  menu={createPermissionMenu(record)}
                  placement="bottomRight"
                  trigger={["click"]}
                >
                  <Tooltip title="Phân quyền">
                    <Button icon={<SettingOutlined />} />
                  </Tooltip>
                </Dropdown>
              )}
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      {contextHolder}

      <Card
        style={{ marginBottom: 16 }}
        bodyStyle={{ padding: "16px" }}
      >
        <Row
          justify="space-between"
          align="middle"
        >
          {/* CỤM TIÊU ĐỀ / NÚT THÊM */}
          <Col>
            {inTrashMode ? (
              <h3 style={{ margin: 0, color: "#ff4d4f" }}>
                <RestOutlined /> Thùng rác (Tài khoản đã xóa)
              </h3>
            ) : (
              <Space>
                {canCreate && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleOpenModal}
                  >
                    Thêm người dùng mới
                  </Button>
                )}
              </Space>
            )}
          </Col>

          {/* CỤM NÚT CHUYỂN ĐỔI */}
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchUsers()}
              >
                Tải lại
              </Button>

              {inTrashMode ? (
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => setInTrashMode(false)}
                >
                  Quay lại danh sách
                </Button>
              ) : (
                <Button
                  icon={<RestOutlined />}
                  danger
                  onClick={() => setInTrashMode(true)}
                >
                  Thùng rác
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      <Table
        className="fixed-height-table"
        columns={columns}
        dataSource={users}
        loading={loading}
        rowKey="maNguoiDung"
        pagination={{ pageSize: 5 }}
      />

      {/* MODAL FORM (Giữ nguyên) */}
      <Modal
        title={editingUser ? "Sửa người dùng" : "Tạo người dùng mới"}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form
          form={form}
          layout="vertical"
          name="userForm"
        >
          <Form.Item
            name="tenDangNhap"
            label="Tên Đăng Nhập"
            rules={[{ required: true }]}
          >
            <Input disabled={!!editingUser} />
          </Form.Item>
          <Form.Item
            name="hoTen"
            label="Họ Tên"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: "email" }]}
          >
            <Input />
          </Form.Item>
          {!editingUser && (
            <Form.Item
              name="matKhau"
              label="Mật Khẩu"
              rules={[{ required: true }]}
            >
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item
            name="sdt"
            label="Số Điện Thoại"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="maVaiTro"
            label="Vai Trò"
            rules={[{ required: true }]}
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
        <p>Bạn có chắc muốn xóa người dùng này?</p>
        <p style={{ fontSize: 12, color: "#888" }}>
          Tài khoản sẽ bị vô hiệu hóa và chuyển vào thùng rác.
        </p>
      </Modal>
    </div>
  );
};

export default UserManagementPage;
