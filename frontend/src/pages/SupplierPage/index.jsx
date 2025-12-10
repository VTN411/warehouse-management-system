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
  SearchOutlined,
} from "@ant-design/icons";
import * as supplierService from "../../services/supplier.service";

const PERM_SUPPLIER_CREATE = 61;
const PERM_SUPPLIER_EDIT = 62;
const PERM_SUPPLIER_DELETE = 63;

const SupplierPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [permissions, setPermissions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [keyword, setKeyword] = useState("");

  // 1. LẤY DỮ LIỆU
  const fetchSuppliers = useCallback(
    async (searchKey = "") => {
      setLoading(true);
      try {
        let response;
        if (searchKey) {
          response = await supplierService.searchSuppliers(searchKey);
        } else {
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

  useEffect(() => {
    fetchSuppliers();
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
      setPermissions([]);
    }
  }, [fetchSuppliers]);

  const handleSearch = () => {
    fetchSuppliers(keyword);
  };
  const handleReset = () => {
    setKeyword("");
    fetchSuppliers("");
  };

  const canCreate = isAdmin || permissions.includes(PERM_SUPPLIER_CREATE);
  const canEdit = isAdmin || permissions.includes(PERM_SUPPLIER_EDIT);
  const canDelete = isAdmin || permissions.includes(PERM_SUPPLIER_DELETE);

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

  // [!] 1. LOGIC KIỂM TRA TRÙNG LẶP & XỬ LÝ LỖI TẠO MỚI
  const handleOk = () => {
    form
      .validateFields()
      .then(async (values) => {
        // Chuẩn hóa dữ liệu để so sánh
        const inputName = values.tenNCC.trim().toLowerCase();
        const inputAddress = (values.diaChi || "").trim().toLowerCase();

        // Kiểm tra trùng: Cả Tên và Địa chỉ đều giống
        const isDuplicate = suppliers.some((ncc) => {
          if (editingSupplier && ncc.maNCC === editingSupplier.maNCC)
            return false;
          const currentName = ncc.tenNCC.trim().toLowerCase();
          const currentAddress = (ncc.diaChi || "").trim().toLowerCase();
          return currentName === inputName && currentAddress === inputAddress;
        });

        if (isDuplicate) {
          messageApi.error(
            `Nhà cung cấp "${values.tenNCC}" tại địa chỉ này đã tồn tại!`
          );
          return;
        }

        setSubmitLoading(true);
        try {
          if (editingSupplier) {
            await supplierService.updateSupplier(editingSupplier.maNCC, values);
            messageApi.success("Cập nhật thành công!");
          } else {
            await supplierService.createSupplier(values);
            messageApi.success("Thêm mới thành công!");
          }
          setIsModalVisible(false);
          fetchSuppliers(keyword);
        } catch (error) {
          // Hiển thị lỗi từ Backend (nếu có)
          const errorMsg =
            error.response?.data?.message ||
            error.response?.data ||
            "Có lỗi xảy ra!";
          messageApi.error(errorMsg);
        } finally {
          setSubmitLoading(false);
        }
      })
      .catch(() => {});
  };

  const handleDelete = (id) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  // [!] 2. LOGIC XÓA & HIỂN THỊ LỖI TỪ BACKEND
  const handleDeleteConfirm = async () => {
    try {
      await supplierService.deleteSupplier(deletingId);
      messageApi.success("Đã xóa nhà cung cấp!");
      fetchSuppliers(keyword);
    } catch (error) {
      // Ưu tiên lấy message từ Backend trả về
      // VD: Backend trả về { message: "Không thể xóa vì NCC đang có hàng trong kho" }
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data ||
        "Lỗi khi xóa nhà cung cấp!";

      // Nếu lỗi quá dài hoặc là lỗi SQL thuần, hiển thị thông báo thân thiện hơn
      if (
        errorMsg.includes("ConstraintViolation") ||
        errorMsg.includes("foreign key")
      ) {
        messageApi.error(
          "Không thể xóa! Nhà cung cấp này đang có giao dịch hoặc sản phẩm liên quan."
        );
      } else {
        messageApi.error(errorMsg);
      }
    }
    setIsDeleteModalOpen(false);
    setDeletingId(null);
  };

  const columns = [
    {
      title: "Tên NCC",
      dataIndex: "tenNCC",
      key: "tenNCC",
      width: 200,
      render: (t) => <b>{t}</b>,
    },
    { title: "Người Liên Hệ", dataIndex: "nguoiLienHe", key: "nguoiLienHe" },
    { title: "SĐT", dataIndex: "sdt", key: "sdt" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Địa Chỉ", dataIndex: "diaChi", key: "diaChi" },
    {
      title: "Hành động",
      key: "action",
      width: 120,
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
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingSupplier ? "Sửa Nhà Cung Cấp" : "Thêm Nhà Cung Cấp"}
        open={isModalVisible}
        onOk={handleOk}
        confirmLoading={submitLoading}
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
            rules={[{ required: true, message: "Vui lòng nhập Số Điện Thoại" }]}
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
            rules={[{ required: true, message: "Vui lòng nhập Địa Chỉ" }]}
          >
            <Input.TextArea
              rows={2}
              placeholder="Ví dụ: Khu công nghệ cao..."
            />
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
        <p>Bạn có chắc muốn xóa nhà cung cấp này không?</p>
      </Modal>
    </div>
  );
};

export default SupplierPage;
