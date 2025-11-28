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
// [!] 1. IMPORT SERVICE NHÀ CUNG CẤP
import * as supplierService from "../../services/supplier.service";

const { Option } = Select;

const PERM_CREATE_ID = 50;
const PERM_EDIT_ID = 51;
const PERM_DELETE_ID = 52;

const ProductPage = () => {
  const [products, setProducts] = useState([]);
  // [!] 2. STATE LƯU DANH SÁCH NCC
  const [listNCC, setListNCC] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  
  const [permissions, setPermissions] = useState([]);
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

  // [!] 3. HÀM LẤY DANH SÁCH NCC
  const fetchCommonData = useCallback(async () => {
    try {
      const response = await supplierService.getAllSuppliers();
      setListNCC(response.data || []);
    } catch (error) {
      console.error("Lỗi tải danh sách NCC:", error);
      // Không báo lỗi 403 ra màn hình để tránh làm phiền user nếu họ không có quyền xem
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCommonData(); // Gọi hàm lấy dữ liệu chung

    try {
      const storedUser = localStorage.getItem("user_info");
      if (storedUser) {
        let user = JSON.parse(storedUser);
        if (user.quyen && !Array.isArray(user.quyen) && user.quyen.maNguoiDung) {
             user = user.quyen;
        }
        let perms = user.dsQuyenSoHuu || user.quyen;
        if (!Array.isArray(perms)) perms = [];
        setPermissions(perms);
      }
    } catch (e) {
      setPermissions([]);
    }
  }, [fetchProducts, fetchCommonData]);

  const canCreate = permissions.includes(PERM_CREATE_ID);
  const canEdit = permissions.includes(PERM_EDIT_ID);
  const canDelete = permissions.includes(PERM_DELETE_ID);

  const handleOpenModal = () => {
    setEditingProduct(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingProduct(record);
    form.setFieldsValue({
      ...record,
      maLoai: record.loaiHang?.maLoai || record.maLoai, 
      // Đảm bảo danhSachMaNCC là mảng để Select mode="multiple" hiển thị đúng
      danhSachMaNCC: record.danhSachMaNCC || [], 
    });
    setIsModalVisible(true);
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
              
            </Button>
          )}
          {canDelete && (
            <Button 
              icon={<DeleteOutlined />} 
              danger 
              onClick={() => handleDelete(record.maSP)}
            >
              
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
        pagination={{ pageSize: 5 }}
        scroll={{ x: 1000 }}
      />

      <Modal
        title={editingProduct ? "Sửa Sản Phẩm" : "Thêm Sản Phẩm"}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
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

          {/* [!] 4. SỬA LẠI THÀNH SELECT CHỌN NCC TỪ API */}
          <Form.Item 
            name="danhSachMaNCC" 
            label="Nhà Cung Cấp"
          >
            <Select 
              mode="multiple" // Cho phép chọn nhiều
              style={{ width: '100%' }} 
              placeholder="Chọn nhà cung cấp"
              optionFilterProp="children"
            >
              {listNCC.map(ncc => (
                <Option key={ncc.maNCC} value={ncc.maNCC}>
                  {ncc.tenNCC}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="moTa" label="Mô Tả">
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
        <p>Bạn có chắc muốn xóa sản phẩm này? Hành động này không thể hoàn tác.</p>
      </Modal>
    </div>
  );
};

export default ProductPage;