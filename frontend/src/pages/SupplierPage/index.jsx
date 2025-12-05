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
  Card,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined, // [!] Import icon tìm kiếm
} from "@ant-design/icons";
import * as supplierService from "../../services/supplier.service";

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

  // [!] State cho tìm kiếm
  const [keyword, setKeyword] = useState("");

  // 1. LẤY DỮ LIỆU (Hỗ trợ tìm kiếm)
  const fetchSuppliers = useCallback(
    async (searchKey = "") => {
      setLoading(true);
      try {
        let response;
        if (searchKey) {
          // Gọi API tìm kiếm nếu có từ khóa
          response = await supplierService.searchSuppliers(searchKey);
        } else {
          // Gọi API lấy tất cả nếu không có từ khóa
          response = await supplierService.getAllSuppliers();
        }
        setSuppliers(response.data || []);
      } catch (error) {
        messageApi.error("Không thể tải danh sách nhà cung cấp!");
      }
      setLoading(false);
    },
    [messageApi]
  );

  // 2. CHECK QUYỀN & LOAD DATA
  useEffect(() => {
    fetchSuppliers(); // Load mặc định (không từ khóa)

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
        const role = user.vaiTro || user.tenVaiTro || "";
        setIsAdmin(role === "ADMIN");
        let perms = user.dsQuyenSoHuu || user.quyen;
        if (!Array.isArray(perms)) perms = [];
        setPermissions(perms);
      }
    } catch (e) {
      console.error("Lỗi đọc quyền:", e);
      setPermissions([]);
    }
  }, [fetchSuppliers]);

  // [!] Xử lý khi bấm nút Tìm
  const handleSearch = () => {
    fetchSuppliers(keyword);
  };

  // [!] Xử lý khi bấm nút Reset (Tải lại)
  const handleReset = () => {
    setKeyword("");
    fetchSuppliers("");
  };

  const canCreate = isAdmin || permissions.includes(PERM_SUPPLIER_CREATE);
  const canEdit = isAdmin || permissions.includes(PERM_SUPPLIER_EDIT);
  const canDelete = isAdmin || permissions.includes(PERM_SUPPLIER_DELETE);

  // --- XỬ LÝ MODAL ---
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
    form
      .validateFields()
      .then(async (values) => {
        try {
          if (editingSupplier) {
            await supplierService.updateSupplier(editingSupplier.maNCC, values);
            messageApi.success("Cập nhật nhà cung cấp thành công!");
          } else {
            await supplierService.createSupplier(values);
            messageApi.success("Thêm nhà cung cấp thành công!");
          }
          setIsModalVisible(false);
          fetchSuppliers(keyword); // Load lại theo từ khóa hiện tại
        } catch (error) {
          messageApi.error("Có lỗi xảy ra!");
        }
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  const handleDelete = (id) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await supplierService.deleteSupplier(deletingId);
      messageApi.success("Xóa nhà cung cấp thành công!");
      fetchSuppliers(keyword); // Load lại theo từ khóa
    } catch (error) {
      messageApi.error("Lỗi khi xóa nhà cung cấp!");
    }
    setIsDeleteModalOpen(false);
    setDeletingId(null);
  };

  const columns = [
    {
      title: "Tên Nhà Cung Cấp",
      dataIndex: "tenNCC",
      key: "tenNCC",
      width: 200,
    },
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
              onClick={() => handleDelete(record.maNCC)}
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      {contextHolder}

      {/* [!] THANH TÌM KIẾM */}
      <Card
        style={{ marginBottom: 16 }}
        bodyStyle={{ padding: "16px" }}
      >
        <Row
          gutter={[16, 16]}
          align="middle"
        >
          <Col span={12}>
            <Input
              placeholder="Tìm kiếm theo tên hoặc SĐT..."
              prefix={<SearchOutlined />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
            />
          </Col>
          <Col span={12}>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
              >
                Tìm kiếm
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleReset}
              >
                Tải lại
              </Button>
              {/* Nút Thêm chuyển xuống đây hoặc để ở dưới tùy bạn */}
            </Space>
          </Col>
        </Row>
      </Card>

      <Space style={{ marginBottom: 16 }}>
        {canCreate && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenModal}
          >
            Thêm Nhà Cung Cấp
          </Button>
        )}
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
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="tenNCC"
            label="Tên Nhà Cung Cấp"
            rules={[{ required: true, message: "Vui lòng nhập tên!" }]}
          >
            <Input placeholder="Ví dụ: Samsung Vina" />
          </Form.Item>
          <Form.Item
            name="nguoiLienHe"
            label="Người Liên Hệ"
          >
            <Input placeholder="Ví dụ: Mr. Kim" />
          </Form.Item>
          <Form.Item
            name="sdt"
            label="Số Điện Thoại"
          >
            <Input placeholder="Ví dụ: 0909..." />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ type: "email" }]}
          >
            <Input placeholder="Ví dụ: contact@samsung.com" />
          </Form.Item>
          <Form.Item
            name="diaChi"
            label="Địa Chỉ"
          >
            <Input.TextArea
              rows={2}
              placeholder="Ví dụ: Khu công nghệ cao..."
            />
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
