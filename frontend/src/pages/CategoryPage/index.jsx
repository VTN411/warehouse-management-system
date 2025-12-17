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

// --- CẤU HÌNH ID QUYỀN (LOẠI HÀNG) ---
const PERM_VIEW = 140; // Xem danh sách
const PERM_CREATE = 141; // Tạo mới
const PERM_EDIT = 142; // Cập nhật
const PERM_DELETE = 143; // Xóa (kiêm Khôi phục)

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

  // State Quyền hạn
  const [permissions, setPermissions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // --- 1. HÀM TẢI DỮ LIỆU ---
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (inTrashMode) {
        // Nếu có API thùng rác riêng
        // res = await categoryService.getTrashCategories();
        // Nếu chưa có API thùng rác, tạm thời lọc client hoặc gọi API getAll
        res = await categoryService.getAllCategories();
        // Lưu ý: Bạn cần đảm bảo Backend có API hỗ trợ lọc DaXoa=1
      } else {
        res = await categoryService.getAllCategories();
      }

      // Xử lý dữ liệu trả về
      let data = res.data;
      // Nếu API trả về dạng Page object -> lấy content
      if (data.content) data = data.content;

      // Lọc dữ liệu theo chế độ (Nếu Backend trả về tất cả)
      if (Array.isArray(data)) {
        const filtered = data.filter((item) => {
          const isDeleted = item.daXoa === 1 || item.trangThai === 0; // Tùy logic DB của bạn
          return inTrashMode ? isDeleted : !isDeleted;
        });
        setCategories(filtered);
      } else {
        setCategories([]);
      }
    } catch (error) {
      messageApi.error("Không thể tải danh sách loại hàng!");
    }
    setLoading(false);
  }, [inTrashMode, messageApi]);

  // --- 2. KHỞI TẠO & PHÂN QUYỀN ---
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

        const roleName = (user.vaiTro || user.tenVaiTro || "").toUpperCase();
        setIsAdmin(roleName === "ADMIN");

        let rawPerms = user.dsQuyenSoHuu || user.quyen || [];
        if (!Array.isArray(rawPerms)) rawPerms = [];

        const parsedPerms = rawPerms.map((p) => {
          if (typeof p === "object" && p !== null)
            return parseInt(p.maQuyen || p.id);
          return parseInt(p);
        });

        // [!] LƯU QUYỀN VÀO STATE
        setPermissions(parsedPerms);

        // Check quyền Xem (ID 140)
        const hasViewPerm = parsedPerms.includes(PERM_VIEW);

        if (roleName === "ADMIN" || hasViewPerm) {
          fetchCategories();
        } else {
          setLoading(false);
        }
      } catch (e) {
        setPermissions([]);
      }
    } else {
      // Chưa đăng nhập
      setLoading(false);
    }
  }, [fetchCategories]); // Chạy lại khi hàm fetch thay đổi (do inTrashMode)

  // Hàm check quyền nhanh
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
          messageApi.error("Lỗi khi lưu!");
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
      messageApi.success("Đã chuyển vào thùng rác!");
      fetchCategories();
    } catch (error) {
      messageApi.error("Không thể xóa (có thể do ràng buộc dữ liệu)!");
    }
    setIsDeleteModalOpen(false);
  };

  // Giả sử có hàm restore (Nếu chưa có trong service thì cần thêm)
  const handleRestore = async (id) => {
    try {
      // await categoryService.restoreCategory(id);
      messageApi.info(
        "Chức năng khôi phục đang phát triển (Backend cần API restore)"
      );
      // Sau khi có API thì bỏ comment dòng trên và fetch lại
      // fetchCategories();
    } catch (e) {
      messageApi.error("Lỗi khôi phục");
    }
  };

  // --- CỘT BẢNG ---
  const columns = [
    { title: "Mã Loại", dataIndex: "maLoai", width: 100, align: "center" },
    { title: "Tên Loại Hàng", dataIndex: "tenLoai", render: (t) => <b>{t}</b> },
    { title: "Mô Tả", dataIndex: "moTa" },
    {
      title: "Trạng thái",
      align: "center",
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
        // Check quyền
        const allowEdit = checkPerm(PERM_EDIT); // 142
        const allowDelete = checkPerm(PERM_DELETE); // 143

        return (
          <Space size="middle">
            {inTrashMode ? (
              // 1. TRONG THÙNG RÁC -> Hiện nút Khôi Phục (Cần quyền Xóa 143 hoặc Admin)
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
              // 2. DANH SÁCH CHÍNH -> Hiện Sửa / Xóa
              <>
                {allowEdit && (
                  <Tooltip title="Sửa thông tin">
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

  // Chặn nếu không có quyền xem
  if (!loading && permissions.length > 0 && !checkPerm(PERM_VIEW)) {
    return (
      <Card style={{ margin: 20, textAlign: "center", color: "red" }}>
        <h3>Quyền truy cập bị từ chối</h3>
        <p>Bạn cần quyền "Xem danh sách loại hàng" (ID: {PERM_VIEW})</p>
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
            {/* TIÊU ĐỀ */}
            <h3 style={{ margin: 0 }}>
              {inTrashMode ? (
                <span style={{ color: "red" }}>
                  <RestOutlined /> Thùng rác Loại Hàng
                </span>
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

              {/* Nút Chuyển chế độ Thùng rác */}
              {inTrashMode ? (
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => setInTrashMode(false)}
                >
                  Quay lại danh sách
                </Button>
              ) : (
                <>
                  {/* Nút Thùng rác (Ai có quyền xóa hoặc Admin thì xem được thùng rác) */}
                  {(isAdmin || checkPerm(PERM_DELETE)) && (
                    <Button
                      icon={<RestOutlined />}
                      danger
                      onClick={() => setInTrashMode(true)}
                    >
                      Thùng rác
                    </Button>
                  )}

                  {/* Nút Thêm Mới (Cần quyền 141) */}
                  {checkPerm(PERM_CREATE) && (
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
