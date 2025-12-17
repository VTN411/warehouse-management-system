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
  RestOutlined,
  UndoOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import * as categoryService from "../../services/category.service";

// --- QUYỀN HẠN ---
const PERM_VIEW = 140;
const PERM_CREATE = 141;
const PERM_EDIT = 142;
const PERM_DELETE = 143; // Quyền Xóa & Khôi phục

const CategoryPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inTrashMode, setInTrashMode] = useState(false); // State chuyển chế độ

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [permissions, setPermissions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // --- 1. HÀM TẢI DỮ LIỆU ---
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      // [QUAN TRỌNG] Phân luồng gọi API
      if (inTrashMode) {
        // Gọi API lấy thùng rác
        res = await categoryService.getTrashCategories();
      } else {
        // Gọi API lấy danh sách chính
        res = await categoryService.getAllCategories();
      }

      let data = res.data;
      if (data.content) data = data.content;

      if (Array.isArray(data)) {
        setCategories(data);
      } else {
        setCategories([]);
      }
    } catch (error) {
      // messageApi.error("Không thể tải dữ liệu!");
      setCategories([]);
    }
    setLoading(false);
  }, [inTrashMode]);

  // --- 2. CHECK QUYỀN ---
  useEffect(() => {
    const storedUser = localStorage.getItem("user_info");
    if (storedUser) {
      try {
        let user = JSON.parse(storedUser);
        if (
          user.quyen &&
          !Array.isArray(user.quyen) &&
          user.quyen.maNguoiDung
        ) {
          user = user.quyen;
        }

        const role = (user.vaiTro || user.tenVaiTro || "").toUpperCase();
        setIsAdmin(role === "ADMIN");

        let rawPerms = user.dsQuyenSoHuu || user.quyen || [];
        if (!Array.isArray(rawPerms)) rawPerms = [];
        const parsedPerms = rawPerms.map((p) =>
          typeof p === "object" ? parseInt(p.maQuyen || p.id) : parseInt(p)
        );

        setPermissions(parsedPerms);

        const hasViewPerm = parsedPerms.includes(PERM_VIEW);
        if (role === "ADMIN" || hasViewPerm) {
          fetchCategories();
        }
      } catch (e) {
        setPermissions([]);
      }
    }
  }, [fetchCategories]);

  const checkPerm = (id) => isAdmin || permissions.includes(id);

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
          messageApi.error("Lỗi lưu dữ liệu!");
        }
      })
      .catch(() => {});
  };

  // Xóa (Chuyển vào thùng rác)
  const handleDelete = (id) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await categoryService.deleteCategory(deletingId);
      messageApi.success("Đã chuyển vào thùng rác!");
      fetchCategories(); // Reload lại danh sách (bản ghi sẽ biến mất khỏi list chính)
    } catch (error) {
      messageApi.error("Lỗi khi xóa!");
    }
    setIsDeleteModalOpen(false);
  };

  // [MỚI] Khôi phục (Lấy lại từ thùng rác)
  const handleRestore = async (id) => {
    try {
      await categoryService.restoreCategory(id);
      messageApi.success("Đã khôi phục loại hàng!");
      fetchCategories(); // Reload lại list thùng rác (bản ghi sẽ biến mất khỏi đây)
    } catch (e) {
      messageApi.error("Lỗi khi khôi phục!");
    }
  };

  const columns = [
    { title: "Mã Loại", dataIndex: "maLoai", width: 80, align: "center" },
    { title: "Tên Loại Hàng", dataIndex: "tenLoai", render: (t) => <b>{t}</b> },
    { title: "Mô Tả", dataIndex: "moTa" },
    {
      title: "Trạng thái",
      align: "center",
      width: 120,
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
      render: (_, record) => {
        const allowEdit = checkPerm(PERM_EDIT);
        const allowDelete = checkPerm(PERM_DELETE);

        return (
          <Space size="middle">
            {inTrashMode ? (
              // Ở Thùng Rác: Nút Khôi Phục (Quyền 143)
              allowDelete && (
                <Tooltip title="Khôi phục">
                  <Button
                    type="primary"
                    ghost
                    icon={<UndoOutlined />}
                    onClick={() => handleRestore(record.maLoai)}
                  >
                    Khôi phục
                  </Button>
                </Tooltip>
              )
            ) : (
              // Ở Danh Sách Chính: Sửa / Xóa
              <>
                {allowEdit && (
                  <Tooltip title="Sửa">
                    <Button
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(record)}
                    />
                  </Tooltip>
                )}
                {allowDelete && (
                  <Tooltip title="Xóa">
                    <Button
                      icon={<DeleteOutlined />}
                      danger
                      onClick={() => handleDelete(record.maLoai)}
                    />
                  </Tooltip>
                )}
              </>
            )}
          </Space>
        );
      },
    },
  ];

  if (!loading && permissions.length > 0 && !checkPerm(PERM_VIEW)) {
    return (
      <Card style={{ margin: 20, color: "red", textAlign: "center" }}>
        Bạn không có quyền xem trang này (ID: {PERM_VIEW})
      </Card>
    );
  }

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
            <h3 style={{ margin: 0, color: inTrashMode ? "red" : "inherit" }}>
              {inTrashMode ? (
                <>
                  <RestOutlined /> Thùng rác Loại Hàng
                </>
              ) : (
                "Quản lý Loại Hàng"
              )}
            </h3>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchCategories}
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
                  {(isAdmin || checkPerm(PERM_DELETE)) && (
                    <Button
                      icon={<RestOutlined />}
                      danger
                      onClick={() => setInTrashMode(true)}
                    >
                      Thùng rác
                    </Button>
                  )}
                  {checkPerm(PERM_CREATE) && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleOpenModal}
                    >
                      Thêm Mới
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
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="moTa"
            label="Mô Tả"
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Xác nhận xóa"
        open={isDeleteModalOpen}
        onOk={handleDeleteConfirm}
        onCancel={() => setIsDeleteModalOpen(false)}
        okText="Xóa"
        cancelText="Hủy"
        okType="danger"
      >
        <p>Bạn có chắc muốn chuyển loại hàng này vào thùng rác?</p>
      </Modal>
    </div>
  );
};

export default CategoryPage;
