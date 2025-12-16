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
  Tag,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  RestOutlined, // Icon thùng rác
  UndoOutlined, // Icon khôi phục
  ArrowLeftOutlined, // Icon quay lại
} from "@ant-design/icons";
import * as customerService from "../../services/customer.service";

const PERM_CREATE = 91;
const PERM_EDIT = 92;
const PERM_DELETE = 93;

const CustomerPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  // State: Chế độ Thùng rác
  const [inTrashMode, setInTrashMode] = useState(false);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [permissions, setPermissions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [keyword, setKeyword] = useState("");

  // 1. LẤY DỮ LIỆU (Theo chế độ)
  const fetchCustomers = useCallback(
    async (searchKey = "") => {
      setLoading(true);
      try {
        let response;

        if (inTrashMode) {
          // A. CHẾ ĐỘ THÙNG RÁC
          response = await customerService.getTrashCustomers();
        } else {
          // B. CHẾ ĐỘ DANH SÁCH CHÍNH
          if (searchKey) {
            response = await customerService.searchCustomers(searchKey);
          } else {
            response = await customerService.getAllCustomers();
          }
        }

        // Xử lý dữ liệu trả về (mảng hoặc object phân trang)
        const data = Array.isArray(response.data)
          ? response.data
          : response.data?.content || [];
        setCustomers(data);
      } catch (error) {
        messageApi.error("Không thể tải danh sách khách hàng!");
      }
      setLoading(false);
    },
    [messageApi, inTrashMode]
  );

  useEffect(() => {
    fetchCustomers(keyword);
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
  }, [fetchCustomers, keyword, inTrashMode]);

  const handleSearch = () => {
    fetchCustomers(keyword);
  };
  const handleReset = () => {
    setKeyword("");
    fetchCustomers("");
  };

  const canCreate = isAdmin || permissions.includes(PERM_CREATE);
  const canEdit = isAdmin || permissions.includes(PERM_EDIT);
  const canDelete = isAdmin || permissions.includes(PERM_DELETE);

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

  // --- HÀM KHÔI PHỤC (RESTORE) ---
  const handleRestore = async (record) => {
    try {
      await customerService.restoreCustomer(record.maKH);
      messageApi.success("Khôi phục thành công!");
      fetchCustomers(); // Tải lại danh sách thùng rác (item sẽ biến mất)
    } catch (error) {
      messageApi.error(error.response?.data?.message || "Lỗi khi khôi phục!");
    }
  };

  // --- XỬ LÝ LƯU (THÊM/SỬA) ---
  const handleOk = () => {
    form
      .validateFields()
      .then(async (values) => {
        const inputName = values.tenKH.trim().toLowerCase();
        const inputPhone = (values.sdt || "").trim();

        // Check trùng lặp Client-side
        const isDuplicate = customers.some((kh) => {
          if (editingCustomer && kh.maKH === editingCustomer.maKH) return false;
          const currentName = kh.tenKH.trim().toLowerCase();
          const currentPhone = (kh.sdt || "").trim();
          return currentName === inputName && currentPhone === inputPhone;
        });

        if (isDuplicate) {
          messageApi.error(
            `Khách hàng "${values.tenKH}" - SĐT "${values.sdt}" đã tồn tại!`
          );
          return;
        }

        setSubmitLoading(true);
        try {
          if (editingCustomer) {
            await customerService.updateCustomer(editingCustomer.maKH, values);
            messageApi.success("Cập nhật thành công!");
          } else {
            await customerService.createCustomer(values);
            messageApi.success("Thêm mới thành công!");
          }
          setIsModalVisible(false);
          fetchCustomers(keyword);
        } catch (error) {
          messageApi.error(error.response?.data?.message || "Có lỗi xảy ra!");
        } finally {
          setSubmitLoading(false);
        }
      })
      .catch(() => {});
  };

  // --- XỬ LÝ XÓA (SOFT DELETE) ---
  const handleDelete = (id) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await customerService.deleteCustomer(deletingId);
      messageApi.success("Đã chuyển vào thùng rác!");
      fetchCustomers(keyword);
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || error.response?.data || "Lỗi khi xóa!";
      if (errorMsg.includes("foreign key") || errorMsg.includes("constraint")) {
        messageApi.error("Không thể xóa! Khách hàng đã có giao dịch.");
      } else {
        messageApi.error(errorMsg);
      }
    }
    setIsDeleteModalOpen(false);
    setDeletingId(null);
  };

  // --- CẤU HÌNH CỘT ---
  const columns = [
    {
      title: "Tên Khách Hàng",
      dataIndex: "tenKH",
      key: "tenKH",
      width: 200,
      render: (t) => <b>{t}</b>,
    },
    { title: "SĐT", dataIndex: "sdt", key: "sdt" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Địa Chỉ", dataIndex: "diaChi", key: "diaChi" },
    {
      title: "Trạng thái",
      key: "status",
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
      render: (_, record) => (
        <Space size="middle">
          {inTrashMode ? (
            // 1. TRONG THÙNG RÁC -> CHỈ HIỆN KHÔI PHỤC
            <Tooltip title="Khôi phục khách hàng">
              <Button
                type="primary"
                ghost
                icon={<UndoOutlined />}
                onClick={() => handleRestore(record)}
              >
                Khôi phục
              </Button>
            </Tooltip>
          ) : (
            // 2. DANH SÁCH CHÍNH -> HIỆN SỬA/XÓA
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
                <Tooltip title="Xóa tạm thời">
                  <Button
                    icon={<DeleteOutlined />}
                    danger
                    onClick={() => handleDelete(record.maKH)}
                  />
                </Tooltip>
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
          gutter={[16, 16]}
          align="middle"
          justify="space-between"
        >
          <Col span={12}>
            {inTrashMode ? (
              <h3 style={{ margin: 0, color: "#ff4d4f" }}>
                <RestOutlined /> Thùng rác (Khách hàng đã xóa)
              </h3>
            ) : (
              <Input
                placeholder="Tìm kiếm theo tên hoặc SĐT..."
                prefix={<SearchOutlined />}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onPressEnter={handleSearch}
                style={{ maxWidth: 400 }}
              />
            )}
          </Col>
          <Col>
            <Space>
              {!inTrashMode && (
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={handleSearch}
                >
                  Tìm kiếm
                </Button>
              )}

              <Button
                icon={<ReloadOutlined />}
                onClick={handleReset}
              >
                Tải lại
              </Button>

              {/* Logic Nút Chuyển Đổi */}
              {inTrashMode ? (
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => {
                    setInTrashMode(false);
                    setKeyword("");
                  }}
                >
                  Quay lại danh sách
                </Button>
              ) : (
                <>
                  <Button
                    icon={<RestOutlined />}
                    danger
                    onClick={() => {
                      setInTrashMode(true);
                      setKeyword("");
                    }}
                  >
                    Thùng rác
                  </Button>

                  {canCreate && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleOpenModal}
                    >
                      Thêm Khách Hàng
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
        dataSource={customers}
        loading={loading}
        rowKey="maKH"
        pagination={{ pageSize: 5 }}
      />

      {/* MODAL THÊM/SỬA */}
      <Modal
        title={editingCustomer ? "Sửa Khách Hàng" : "Thêm Khách Hàng"}
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
            name="tenKH"
            label="Tên Khách Hàng"
            rules={[{ required: true, message: "Vui lòng nhập Tên" }]}
          >
            <Input placeholder="Ví dụ: Nguyễn Văn A" />
          </Form.Item>
          <Form.Item
            name="sdt"
            label="Số Điện Thoại"
            rules={[{ required: true, message: "Vui lòng nhập SĐT" }]}
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
            rules={[{ required: true, message: "Vui lòng nhập Địa Chỉ" }]}
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
        <p style={{ fontSize: 12, color: "#888" }}>
          Dữ liệu sẽ được chuyển vào thùng rác.
        </p>
      </Modal>
    </div>
  );
};

export default CustomerPage;
