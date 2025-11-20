// src/pages/ProductPage/index.jsx

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
  InputNumber,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import * as productService from "../../services/product.service";

const { Option } = Select;

const ProductPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [permissions, setPermissions] = useState([]);

  // State cho modal xóa
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await productService.getAllProducts();
      setProducts(response.data || []);
    } catch (error) {
      messageApi.error("Không thể tải danh sách sản phẩm!");
    }
    setLoading(false);
  }, [messageApi]);

  useEffect(() => {
    fetchProducts();
    const storedUser = localStorage.getItem("user_info");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setPermissions(user.quyen || []);
    }
  }, [fetchProducts]);

  const canCreate = permissions.includes("PERM_PRODUCT_CREATE");
  const canEdit = permissions.includes("PERM_PRODUCT_EDIT");
  const canDelete = permissions.includes("PERM_PRODUCT_DELETE");

  const handleOpenModal = () => {
    setEditingProduct(null);
    form.resetFields();
    setIsModalVisible(true);
    setIsDeleteModalOpen(false);
  };

  const handleEdit = (record) => {
    setEditingProduct(record);
    form.setFieldsValue({
      ...record,
      maLoai: record.loaiHang?.maLoai || record.maLoai, 
      danhSachMaNCC: record.danhSachMaNCC || [], 
    });
    setIsModalVisible(true);
    setIsDeleteModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingProduct(null);
  };

  const handleOk = () => {
    form.validateFields().then(async (values) => {
      try {
        if (editingProduct) {
          await productService.updateProduct(editingProduct.maSP, values);
          messageApi.success("Cập nhật sản phẩm thành công!");
        } else {
          await productService.createProduct(values);
          messageApi.success("Tạo sản phẩm mới thành công!");
        }
        setIsModalVisible(false);
        fetchProducts();
      } catch (error) {
        messageApi.error("Có lỗi xảy ra!");
      }
    });
  };

  const handleDelete = (id) => {
    setDeletingProductId(id);
    setIsDeleteModalOpen(true);
    setIsModalVisible(false);
  };

  const handleDeleteConfirm = async () => {
    try {
      await productService.deleteProduct(deletingProductId);
      messageApi.success("Xóa sản phẩm thành công!");
      fetchProducts();
    } catch (error) {
      messageApi.error("Lỗi khi xóa sản phẩm!");
    }
    setIsDeleteModalOpen(false);
    setDeletingProductId(null);
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setDeletingProductId(null);
  };

  const columns = [
    { title: "Mã SP", dataIndex: "maSP", key: "maSP", width: 80 },
    { title: "Tên Sản Phẩm", dataIndex: "tenSP", key: "tenSP", width: 200 },
    { title: "ĐVT", dataIndex: "donViTinh", key: "donViTinh", width: 80 },
    { 
      title: "Giá Nhập", 
      dataIndex: "giaNhap", 
      key: "giaNhap", 
      render: (val) => `${val?.toLocaleString()} đ`,
      width: 120 
    },
    { title: "Tồn Kho", dataIndex: "soLuongTon", key: "soLuongTon", width: 100 },
    { 
      title: "Loại Hàng", 
      render: (_, record) => record.loaiHang?.tenLoai || `Mã Loại: ${record.maLoai}`,
      key: "loaiHang" 
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          {canEdit && (
            <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>
              Sửa
            </Button>
          )}
          {canDelete && (
            <Button 
              icon={<DeleteOutlined />} 
              danger 
              onClick={() => handleDelete(record.maSP)}
            >
              Xóa
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      {contextHolder}
      <Space style={{ marginBottom: 16 }}>
        {canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal}>
            Thêm Sản Phẩm
          </Button>
        )}
        <Button icon={<ReloadOutlined />} onClick={fetchProducts} loading={loading}>
          Tải lại
        </Button>
      </Space>

      <Table
        className="fixed-height-table"
        columns={columns}
        dataSource={products}
        loading={loading}
        rowKey="maSP"
        pagination={{ pageSize: 5 }} // [!] ĐÃ SỬA THÀNH 5
        scroll={{ x: 1000 }}
      />

      {/* MODAL THÊM/SỬA */}
      <Modal
        title={editingProduct ? "Sửa Sản Phẩm" : "Thêm Sản Phẩm"}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="tenSP" label="Tên Sản Phẩm" rules={[{ required: true }]}>
                <Input placeholder="Nhập tên sản phẩm" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="maLoai" label="Mã Loại Hàng" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} placeholder="Nhập ID loại hàng (ví dụ: 1)" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="giaNhap" label="Giá Nhập" rules={[{ required: true }]}>
                <InputNumber 
                  style={{ width: '100%' }} 
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="donViTinh" label="Đơn Vị Tính" rules={[{ required: true }]}>
                <Input placeholder="Cái, Hộp, Kg..." />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="soLuongTon" label="Số Lượng Tồn" initialValue={0}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="mucTonToiThieu" label="Mức Tồn Tối Thiểu">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="mucTonToiDa" label="Mức Tồn Tối Đa">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item 
            name="danhSachMaNCC" 
            label="Mã Nhà Cung Cấp (Nhập số rồi ấn Enter)"
          >
            <Select 
              mode="tags" 
              style={{ width: '100%' }} 
              placeholder="Nhập ID NCC (ví dụ: 1) rồi nhấn Enter" 
              tokenSeparators={[',']}
            />
          </Form.Item>

          <Form.Item name="moTa" label="Mô Tả">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL XÁC NHẬN XÓA */}
      <Modal
        title="Xác nhận xóa"
        open={isDeleteModalOpen}
        onOk={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        okText="Xóa"
        cancelText="Hủy"
        okType="danger"
      >
        <p>Bạn có chắc muốn xóa sản phẩm này? Hành động này không thể hoàn tác.</p>
      </Modal>
    </div>
  );
};

export default ProductPage;