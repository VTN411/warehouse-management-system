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
import * as supplierService from "../../services/supplier.service";

const SupplierPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);

  // State: Đang ở chế độ xem thùng rác hay không?
  const [inTrashMode, setInTrashMode] = useState(false);

  // Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState(null);

  const [keyword, setKeyword] = useState("");
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // 1. LẤY DỮ LIỆU (Tự động chọn API dựa vào chế độ xem)
  const fetchSuppliers = useCallback(
    async (searchKey = "") => {
      setLoading(true);
      try {
        let response;

        if (inTrashMode) {
          // A. Nếu đang ở THÙNG RÁC -> Gọi API Trash
          console.log("Đang lấy dữ liệu thùng rác...");
          response = await supplierService.getTrashSuppliers();
        } else {
          // B. Nếu đang ở DANH SÁCH CHÍNH -> Gọi API thường
          if (searchKey) {
            response = await supplierService.searchSuppliers(searchKey);
          } else {
            response = await supplierService.getAllSuppliers();
          }
        }

        // Xử lý dữ liệu trả về (hỗ trợ cả dạng mảng và dạng trang)
        let rawData = [];
        if (Array.isArray(response.data)) {
          rawData = response.data;
        } else if (response.data && Array.isArray(response.data.content)) {
          rawData = response.data.content;
        }

        setSuppliers(rawData);
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
        messageApi.error("Không thể tải danh sách!");
      }
      setLoading(false);
    },
    [messageApi, inTrashMode]
  );

  useEffect(() => {
    fetchSuppliers(keyword);
  }, [fetchSuppliers, keyword, inTrashMode]);

  const handleSearch = () => fetchSuppliers(keyword);

  // Reset: Nếu ở trash thì reload trash, nếu ở main thì reload main
  const handleReload = () => {
    setKeyword("");
    fetchSuppliers("");
  };

  // --- HÀM KHÔI PHỤC (RESTORE) ---
  const handleRestore = async (record) => {
    try {
      setLoading(true);
      // Gọi API restore mới thêm
      await supplierService.restoreSupplier(record.maNCC);

      messageApi.success("Khôi phục thành công!");
      fetchSuppliers(); // Tải lại danh sách thùng rác (item đó sẽ biến mất)
    } catch (error) {
      messageApi.error("Lỗi khi khôi phục!");
    } finally {
      setLoading(false);
    }
  };

  // --- HÀM XÓA (SOFT DELETE) ---
  const handleDeleteClick = (record) => {
    setDeletingRecord(record);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingRecord) return;
    try {
      await supplierService.deleteSupplier(deletingRecord.maNCC);
      messageApi.success("Đã chuyển vào thùng rác!");
      fetchSuppliers(keyword);
    } catch (error) {
      messageApi.error("Lỗi khi xóa!");
    }
    setIsDeleteModalOpen(false);
    setDeletingRecord(null);
  };

  // --- MODAL & FORM (Thêm/Sửa) ---
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
            messageApi.success("Cập nhật thành công!");
          } else {
            await supplierService.createSupplier(values);
            messageApi.success("Tạo mới thành công!");
          }
          setIsModalVisible(false);
          fetchSuppliers(keyword);
        } catch (error) {
          messageApi.error("Có lỗi xảy ra!");
        }
      })
      .catch(() => {});
  };

  // --- CẤU HÌNH CỘT ---
  const columns = [
    {
      title: "Mã",
      dataIndex: "maNCC",
      width: 80,
    },
    {
      title: "Tên NCC",
      dataIndex: "tenNCC",
      key: "tenNCC",
      render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    { title: "Người Liên Hệ", dataIndex: "nguoiLienHe", key: "nguoiLienHe" },
    { title: "SĐT", dataIndex: "sdt", key: "sdt" },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Hành động",
      key: "action",
      width: 150,
      render: (_, record) => {
        return (
          <Space size="small">
            {inTrashMode ? (
              // 1. GIAO DIỆN TRONG THÙNG RÁC: Chỉ hiện nút Khôi Phục
              <Tooltip title="Khôi phục hoạt động">
                <Button
                  type="primary"
                  ghost // Nút viền xanh, nền trắng
                  icon={<UndoOutlined />}
                  onClick={() => handleRestore(record)}
                >
                  Khôi phục
                </Button>
              </Tooltip>
            ) : (
              // 2. GIAO DIỆN BÌNH THƯỜNG: Hiện Sửa/Xóa
              <>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                  title="Sửa"
                />
                <Button
                  icon={<DeleteOutlined />}
                  danger
                  onClick={() => handleDeleteClick(record)}
                  title="Xóa tạm thời"
                />
              </>
            )}
          </Space>
        );
      },
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
          {/* --- CỤM TÌM KIẾM --- */}
          <Col>
            {/* Chỉ hiện tìm kiếm khi KHÔNG ở thùng rác */}
            {!inTrashMode ? (
              <Space>
                <Input
                  placeholder="Tìm kiếm NCC..."
                  prefix={<SearchOutlined />}
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onPressEnter={handleSearch}
                  style={{ width: 250 }}
                />
                <Button
                  type="primary"
                  onClick={handleSearch}
                >
                  Tìm
                </Button>
              </Space>
            ) : (
              // Tiêu đề khi ở trong thùng rác
              <h3 style={{ margin: 0, color: "#ff4d4f" }}>
                <RestOutlined /> Thùng rác (Nhà cung cấp đã xóa)
              </h3>
            )}
          </Col>

          {/* --- CỤM NÚT CHỨC NĂNG --- */}
          <Col>
            <Space>
              {/* Nút Tải lại */}
              <Button
                icon={<ReloadOutlined />}
                onClick={handleReload}
              >
                Tải lại
              </Button>

              {/* Logic chuyển đổi nút Thùng rác / Quay lại */}
              {inTrashMode ? (
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => {
                    setInTrashMode(false); // Thoát chế độ thùng rác
                    setKeyword("");
                  }}
                >
                  Quay lại danh sách
                </Button>
              ) : (
                <>
                  {/* Nút vào Thùng rác */}
                  <Button
                    icon={<RestOutlined />}
                    danger
                    onClick={() => {
                      setInTrashMode(true); // Bật chế độ thùng rác
                      setKeyword("");
                    }}
                  >
                    Thùng rác
                  </Button>

                  {/* Nút Thêm mới (Chỉ hiện ở màn hình chính) */}
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleOpenModal}
                  >
                    Thêm NCC Mới
                  </Button>
                </>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      <Table
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
            label="Tên NCC"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="nguoiLienHe"
            label="Người Liên Hệ"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="sdt"
            label="Số Điện Thoại"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ type: "email" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="diaChi"
            label="Địa Chỉ"
          >
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL XÁA */}
      <Modal
        title="Xác nhận xóa"
        open={isDeleteModalOpen}
        onOk={handleDeleteConfirm}
        onCancel={() => setIsDeleteModalOpen(false)}
        okText="Xóa"
        cancelText="Hủy"
        okType="danger"
      >
        <p>
          Bạn có chắc muốn xóa <b>{deletingRecord?.tenNCC}</b>?
        </p>
        <p style={{ fontSize: "12px", color: "#888" }}>
          Dữ liệu sẽ được chuyển vào thùng rác và có thể khôi phục sau này.
        </p>
      </Modal>
    </div>
  );
};

export default SupplierPage;
