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
  Tag,
  Upload,
  Image,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import * as productService from "../../services/product.service";
import * as supplierService from "../../services/supplier.service";

const { Option } = Select;

const PERM_CREATE_ID = 50;
const PERM_EDIT_ID = 51;
const PERM_DELETE_ID = 52;

const ProductPage = () => {
  const [products, setProducts] = useState([]);
  const [listNCC, setListNCC] = useState([]);
  
  // State loading cho bảng
  const [loading, setLoading] = useState(false);
  // [!] 1. STATE LOADING CHO NÚT LƯU (Để user biết đang xử lý)
  const [submitLoading, setSubmitLoading] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  
  const [permissions, setPermissions] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState(null);

  const [fileList, setFileList] = useState([]);

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

  const fetchCommonData = useCallback(async () => {
    try {
      const response = await supplierService.getAllSuppliers();
      setListNCC(response.data || []);
    } catch (error) {
      console.error("Lỗi tải NCC:", error);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCommonData();
    try {
      const storedUser = localStorage.getItem("user_info");
      if (storedUser) {
        let user = JSON.parse(storedUser);
        if (user.quyen && !Array.isArray(user.quyen) && user.quyen.maNguoiDung) user = user.quyen;
        let perms = user.dsQuyenSoHuu || user.quyen;
        if (!Array.isArray(perms)) perms = [];
        setPermissions(perms);
      }
    } catch (e) { setPermissions([]); }
  }, [fetchProducts, fetchCommonData]);

  const canCreate = permissions.includes(PERM_CREATE_ID);
  const canEdit = permissions.includes(PERM_EDIT_ID);
  const canDelete = permissions.includes(PERM_DELETE_ID);

  // --- XỬ LÝ FORM ---

  const handleOpenModal = () => {
    setEditingProduct(null);
    setFileList([]); 
    form.resetFields();
    setIsModalVisible(true);
  };

  // [!] 2. SỬA LẠI HÀM handleEdit ĐỂ HIỂN THỊ ẢNH CŨ
  const handleEdit = (record) => {
    setEditingProduct(record);
    
    // Kiểm tra xem sản phẩm có ảnh không
    // Lưu ý: record.hinhAnh là chuỗi URL (https://...)
    if (record.hinhAnh) {
        setFileList([
            {
                uid: '-1', // ID giả
                name: 'hinh-anh-hien-tai.png',
                status: 'done', // Trạng thái đã xong
                url: record.hinhAnh, // Đường dẫn ảnh để hiển thị preview
            }
        ]);
    } else {
        setFileList([]);
    }

    const selectedNCCIds = record.danhSachNCC 
      ? record.danhSachNCC.map(ncc => ncc.maNCC) 
      : [];

    form.setFieldsValue({
      ...record,
      maLoai: record.loaiHang?.maLoai || record.maLoai, 
      danhSachMaNCC: selectedNCCIds, 
    });
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingProduct(null);
  };

  const handleOk = () => {
    form.validateFields().then(async (values) => {
      // [!] 3. BẬT LOADING KHI BẮT ĐẦU LƯU
      setSubmitLoading(true);

      try {
        // Chỉ lấy file nếu đó là file mới upload (có originFileObj)
        // Nếu là ảnh cũ (chỉ có url), thì file sẽ là null -> Backend sẽ giữ nguyên ảnh cũ
        const fileEntry = fileList.length > 0 ? fileList[0] : null;
        const file = fileEntry && fileEntry.originFileObj ? fileEntry.originFileObj : null;

        const productData = {
            tenSP: values.tenSP,
            donViTinh: values.donViTinh,
            giaNhap: values.giaNhap,
            soLuongTon: values.soLuongTon,
            mucTonToiThieu: values.mucTonToiThieu,
            mucTonToiDa: values.mucTonToiDa,
            maLoai: values.maLoai,
            moTa: values.moTa,
            danhSachMaNCC: values.danhSachMaNCC || [] 
        };

        if (editingProduct) {
          await productService.updateProduct(editingProduct.maSP, productData, file);
          messageApi.success("Cập nhật thành công!");
        } else {
          await productService.createProduct(productData, file);
          messageApi.success("Tạo mới thành công!");
        }
        
        setIsModalVisible(false);
        fetchProducts();
      } catch (error) {
        console.error(error);
        const msg = error.response?.data?.message || "Có lỗi xảy ra!";
        messageApi.error(msg);
      } finally {
        // [!] 4. TẮT LOADING DÙ THÀNH CÔNG HAY THẤT BẠI
        setSubmitLoading(false);
      }
    })
    .catch((info) => {
        console.log("Validate Failed:", info);
    });
  };

  const handleDelete = (id) => {
    setDeletingProductId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await productService.deleteProduct(deletingProductId);
      messageApi.success("Đã xóa sản phẩm!");
      fetchProducts();
    } catch (error) {
      messageApi.error("Lỗi khi xóa!");
    }
    setIsDeleteModalOpen(false);
    setDeletingProductId(null);
  };

  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const columns = [
    // { title: "Mã SP", dataIndex: "maSP", key: "maSP", width: 70 },
    { 
        title: "Hình Ảnh", 
        dataIndex: "hinhAnh", 
        key: "hinhAnh", 
        width: 100,
        render: (url) => (
            url ? <Image width={50} src={url} fallback="https://via.placeholder.com/50?text=Error" /> : <Tag>No Image</Tag>
        )
    },
    { title: "Tên Sản Phẩm", dataIndex: "tenSP", key: "tenSP", width: 200 },
    { title: "ĐVT", dataIndex: "donViTinh", key: "donViTinh", width: 80 },
    { 
      title: "Giá Nhập", 
      dataIndex: "giaNhap", 
      key: "giaNhap", 
      render: (val) => `${Number(val).toLocaleString()} đ`,
      width: 110 
    },
    { title: "Tồn", dataIndex: "soLuongTon", key: "soLuongTon", width: 70 },
    { 
      title: "Loại Hàng", 
      render: (_, record) => record.loaiHang?.tenLoai || `Mã: ${record.maLoai}`,
      key: "loaiHang",
      width: 120
    },
    { 
      title: "Nhà Cung Cấp",
      key: "danhSachNCC",
      width: 200,
      render: (_, record) => (
        <>
          {record.danhSachNCC && record.danhSachNCC.map(ncc => (
            <Tag key={ncc.maNCC} color="blue">{ncc.tenNCC}</Tag>
          ))}
        </>
      )
    },
    {
      title: "Hành động",
      key: "action",
      width: 150,
      render: (_, record) => (
        <Space size="small">
          {canEdit && <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />}
          {canDelete && <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.maSP)} />}
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
        // [!] 5. HIỂN THỊ HIỆU ỨNG LOADING Ở NÚT OK
        confirmLoading={submitLoading} 
        onCancel={() => setIsModalVisible(false)}
        width={800}
      >
        <Form form={form} layout="vertical">
          
          {/* Form Upload Ảnh */}
          <Row gutter={16}>
             <Col span={24} style={{ textAlign: 'center', marginBottom: 20 }}>
                <Upload
                    listType="picture-card"
                    fileList={fileList}
                    onChange={handleUploadChange}
                    beforeUpload={() => false} 
                    maxCount={1} 
                    onPreview={async (file) => {
                        let src = file.url;
                        if (!src) {
                            src = await new Promise((resolve) => {
                                const reader = new FileReader();
                                reader.readAsDataURL(file.originFileObj);
                                reader.onload = () => resolve(reader.result);
                            });
                        }
                        const image = new Image();
                        image.src = src;
                        const imgWindow = window.open(src);
                        imgWindow?.document.write(image.outerHTML);
                    }}
                >
                    {fileList.length < 1 && (
                        <div>
                            <PlusOutlined />
                            <div style={{ marginTop: 8 }}>Tải ảnh</div>
                        </div>
                    )}
                </Upload>
             </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="tenSP" label="Tên Sản Phẩm" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="maLoai" label="Mã Loại Hàng" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="giaNhap" label="Giá Nhập" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="donViTinh" label="ĐVT" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="soLuongTon" label="Tồn Kho" initialValue={0}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="mucTonToiThieu" label="Min Tồn">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="mucTonToiDa" label="Max Tồn">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="danhSachMaNCC" label="Nhà Cung Cấp">
            <Select mode="multiple" style={{ width: '100%' }} placeholder="Chọn nhà cung cấp" optionFilterProp="children" showSearch>
              {listNCC.map(ncc => (
                <Option key={ncc.maNCC} value={ncc.maNCC}>{ncc.tenNCC}</Option>
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