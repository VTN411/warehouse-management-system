// src/pages/CustomerPage/index.jsx

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
import * as customerService from "../../services/customer.service";

const PERM_CREATE = 91;
const PERM_EDIT = 92;
const PERM_DELETE = 93;

const CustomerPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [permissions, setPermissions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // [!] State tìm kiếm
  const [keyword, setKeyword] = useState("");

  // 1. HÀM LẤY DỮ LIỆU (HỖ TRỢ TÌM KIẾM)
  const fetchCustomers = useCallback(
    async (searchKey = "") => {
      setLoading(true);
      try {
        let response;
        if (searchKey) {
          // Gọi API tìm kiếm
          response = await customerService.searchCustomers(searchKey);
        } else {
          // Gọi API lấy tất cả
          response = await customerService.getAllCustomers();
        }
        setCustomers(response.data || []);
      } catch (error) {
        messageApi.error("Không thể tải danh sách khách hàng!");
      }
      setLoading(false);
    },
    [messageApi]
  );

  useEffect(() => {
    fetchCustomers();
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
  }, [fetchCustomers]);

  // [!] Xử lý tìm kiếm
  const handleSearch = () => {
    fetchCustomers(keyword);
  };

  // [!] Xử lý reset
  const handleReset = () => {
    setKeyword("");
    fetchCustomers("");
  };

  const canCreate = isAdmin || permissions.includes(PERM_CREATE);
  const canEdit = isAdmin || permissions.includes(PERM_EDIT);
  const canDelete = isAdmin || permissions.includes(PERM_DELETE);

  // --- XỬ LÝ MODAL ---
  const handleOpenModal = () => {
    setEditingCustomer(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingCustomer(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form
      .validateFields()
      .then(async (values) => {
        try {
          if (editingCustomer) {
            await customerService.updateCustomer(editingCustomer.maKH, values);
            messageApi.success("Cập nhật thành công!");
          } else {
            await customerService.createCustomer(values);
            messageApi.success("Thêm mới thành công!");
          }
          setIsModalVisible(false);
          fetchCustomers(keyword); // Load lại theo từ khóa hiện tại
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
      await customerService.deleteCustomer(deletingId);
      messageApi.success("Đã xóa thành công!");
      fetchCustomers(keyword);
    } catch (error) {
      messageApi.error("Lỗi khi xóa!");
    }
    setIsDeleteModalOpen(false);
    setDeletingId(null);
  };

  const columns = [
    // { title: "Mã KH", dataIndex: "maKH", key: "maKH", width: 80 },
    { title: "Tên Khách Hàng", dataIndex: "tenKH", key: "tenKH", width: 200 },
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
              onClick={() => handleDelete(record.maKH)}
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
            Thêm Khách Hàng
          </Button>
        )}
      </Space>

      <Table
        className="fixed-height-table"
        columns={columns}
        dataSource={customers}
        loading={loading}
        rowKey="maKH"
        pagination={{ pageSize: 5 }}
      />

      {/* MODAL FORM */}
      <Modal
        title={editingCustomer ? "Sửa Khách Hàng" : "Thêm Khách Hàng"}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="tenKH"
            label="Tên Khách Hàng"
            rules={[{ required: true, message: "Vui lòng nhập tên!" }]}
          >
            <Input placeholder="Ví dụ: Nguyễn Văn A" />
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
            <Input placeholder="Ví dụ: email@domain.com" />
          </Form.Item>
          <Form.Item
            name="diaChi"
            label="Địa Chỉ"
          >
            <Input.TextArea
              rows={2}
              placeholder="Ví dụ: TP.HCM..."
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
        <p>Bạn có chắc muốn xóa khách hàng này không?</p>
      </Modal>
    </div>
  );
};

export default CustomerPage;
