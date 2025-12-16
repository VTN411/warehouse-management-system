// src/pages/CategoryPage/index.jsx

import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  message,
  Card,
  Row,
  Col,
  Tag,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  RestOutlined, // Icon thùng rác
  UndoOutlined, // Icon khôi phục
  ArrowLeftOutlined, // Icon quay lại
} from "@ant-design/icons";
import * as categoryService from "../../services/category.service";

// ID QUYỀN
const PERM_VIEW = 140;
const PERM_CREATE = 141;
const PERM_EDIT = 142;
const PERM_DELETE = 143;

const CategoryPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // State chế độ Thùng rác
  const [inTrashMode, setInTrashMode] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [permissions, setPermissions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // 1. LẤY DỮ LIỆU (Tự động chọn API dựa vào chế độ)
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      let response;
      if (inTrashMode) {
        // Gọi API thùng rác
        response = await categoryService.getTrashCategories();
      } else {
        // Gọi API danh sách thường
        response = await categoryService.getAllCategories();
      }

      // Xử lý dữ liệu trả về (mảng hoặc object)
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.content || [];
      setCategories(data);
    } catch (error) {
      console.error(error);
      messageApi.error("Không thể tải danh sách loại hàng!");
    }
    setLoading(false);
  }, [messageApi, inTrashMode]);

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
  }, [fetchCategories, inTrashMode]);

  const checkPerm = (id) => isAdmin || permissions.includes(id);
  const canView = checkPerm(PERM_VIEW);
  const canCreate = checkPerm(PERM_CREATE);
  const canEdit = checkPerm(PERM_EDIT);
  const canDelete = checkPerm(PERM_DELETE);

  // --- HANDLERS CƠ BẢN ---
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

  // --- HANDLER XÓA & KHÔI PHỤC ---
  const handleDelete = (id) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await categoryService.deleteCategory(deletingId);
      messageApi.success("Đã chuyển vào thùng rác!"); // Thông báo thay đổi
      fetchCategories();
    } catch (error) {
      messageApi.error("Lỗi khi xóa (Có thể đang được sử dụng)!");
    }
    setIsDeleteModalOpen(false);
  };

  // Hàm khôi phục
  const handleRestore = async (record) => {
    try {
      await categoryService.restoreCategory(record.maLoai);
      messageApi.success("Khôi phục thành công!");
      fetchCategories(); // Reload lại (item sẽ biến mất khỏi thùng rác)
    } catch (error) {
      messageApi.error("Lỗi khi khôi phục!");
    }
  };

  // --- CẤU HÌNH CỘT ---
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
      title: "Trạng thái",
      key: "status",
      align: "center",
      width: 150,
      render: () =>
        inTrashMode ? (
          <Tag color="red">Đã xóa</Tag>
        ) : (
          <Tag color="green">Hoạt động</Tag>
        ),
    },
    {
      title: "Hành động",
      key: "action",
      width: 150,
      align: "center",
      render: (_, record) => (
        <Space size="middle">
          {inTrashMode ? (
            // 1. NẾU Ở THÙNG RÁC -> HIỆN NÚT KHÔI PHỤC
            (canEdit || canDelete) && (
              <Tooltip title="Khôi phục">
                <Button
                  type="primary"
                  ghost
                  icon={<UndoOutlined />}
                  onClick={() => handleRestore(record)}
                >
                  Khôi phục
                </Button>
              </Tooltip>
            )
          ) : (
            // 2. NẾU Ở DS CHÍNH -> HIỆN SỬA / XÓA
            <>
              {canEdit && (
                <Button
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                  title="Sửa"
                />
              )}
              {canDelete && (
                <Button
                  icon={<DeleteOutlined />}
                  danger
                  onClick={() => handleDelete(record.maLoai)}
                  title="Xóa"
                />
              )}
            </>
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

      <Card
        style={{ marginBottom: 16 }}
        bodyStyle={{ padding: "16px" }}
      >
        <Row
          justify="space-between"
          align="middle"
        >
          <Col>
            {inTrashMode ? (
              <h3 style={{ margin: 0, color: "#ff4d4f" }}>
                <RestOutlined /> Thùng rác (Loại hàng đã xóa)
              </h3>
            ) : (
              /* Khoảng trống tiêu đề hoặc ô tìm kiếm nếu cần */
              <span style={{ fontWeight: "bold", fontSize: 16 }}>
                Quản lý Loại hàng
              </span>
            )}
          </Col>

          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchCategories}
                loading={loading}
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
                <>
                  <Button
                    icon={<RestOutlined />}
                    danger
                    onClick={() => setInTrashMode(true)}
                  >
                    Thùng rác
                  </Button>

                  {canCreate && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleOpenModal}
                    >
                      Thêm Loại Hàng
                    </Button>
                  )}
                </>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

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
        <p style={{ fontSize: 12, color: "#888" }}>
          Dữ liệu sẽ được chuyển vào thùng rác.
        </p>
      </Modal>
    </div>
  );
};

export default CategoryPage;
