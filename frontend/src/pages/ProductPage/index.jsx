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
  Card,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import * as productService from "../../services/product.service";
import * as supplierService from "../../services/supplier.service";
// [!] Đã bỏ import category.service gây lỗi

const { Option } = Select;

const PERM_CREATE_ID = 50;
const PERM_EDIT_ID = 51;
const PERM_DELETE_ID = 52;

const ProductPage = () => {
  const [products, setProducts] = useState([]);
  const [listNCC, setListNCC] = useState([]);

  // State Bộ lọc
  const [filter, setFilter] = useState({
    keyword: "",
    maLoai: null,
    minGia: null,
    maxGia: null,
  });

  // [!] 1. STATE PHÂN TRANG: MẶC ĐỊNH 5
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5, // <--- Sửa thành 5
    total: 0,
    showSizeChanger: true,
    pageSizeOptions: ["5", "10", "20", "50"],
  });

  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [permissions, setPermissions] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState(null);
  const [fileList, setFileList] = useState([]);

  // [!] 2. HÀM TẢI DỮ LIỆU: MẶC ĐỊNH 5
  const fetchProducts = useCallback(
    async (page = 1, pageSize = 5, currentFilter = {}) => {
      setLoading(true);
      try {
        const filterData = {
          ...currentFilter,
          page: page - 1,
          size: pageSize,
        };

        const response = await productService.filterProducts(filterData);

        const data = response.data;
        if (data && Array.isArray(data.content)) {
          setProducts(data.content);
          setPagination((prev) => ({
            ...prev,
            current: page,
            pageSize: pageSize,
            total: data.totalElements,
          }));
        } else if (Array.isArray(data)) {
          setProducts(data);
          setPagination((prev) => ({
            ...prev,
            current: page,
            pageSize: pageSize,
            total: data.length,
          }));
        }
      } catch (error) {
        messageApi.error("Không thể tải danh sách sản phẩm!");
      }
      setLoading(false);
    },
    [messageApi]
  );

  const fetchCommonData = useCallback(async () => {
    try {
      // Chỉ lấy NCC vì chưa có API loại hàng
      const response = await supplierService.getAllSuppliers();
      setListNCC(response.data || []);
    } catch (error) {
      console.error("Lỗi tải danh sách NCC:", error);
    }
  }, []);

  // [!] 3. USE EFFECT: GỌI HÀM VỚI SỐ 5
  useEffect(() => {
    fetchProducts(1, 5, {}); // <--- Sửa thành 5 ở đây
    fetchCommonData();

    try {
      const storedUser = localStorage.getItem("user_info");
      if (storedUser) {
        let user = JSON.parse(storedUser);
        if (user.quyen && !Array.isArray(user.quyen) && user.quyen.maNguoiDung)
          user = user.quyen;
        let perms = user.dsQuyenSoHuu || user.quyen;
        if (!Array.isArray(perms)) perms = [];
        setPermissions(perms);
      }
    } catch (e) {
      setPermissions([]);
    }
  }, [fetchProducts, fetchCommonData]);

  // Xử lý tìm kiếm
  const handleSearch = () => {
    fetchProducts(1, pagination.pageSize, filter);
  };

  // Reset về trang 1, size 5
  const handleResetFilter = () => {
    const emptyFilter = {
      keyword: "",
      maLoai: null,
      minGia: null,
      maxGia: null,
    };
    setFilter(emptyFilter);
    fetchProducts(1, 5, emptyFilter);
  };

  const handleTableChange = (newPagination) => {
    fetchProducts(newPagination.current, newPagination.pageSize, filter);
  };

  const canCreate = permissions.includes(PERM_CREATE_ID);
  const canEdit = permissions.includes(PERM_EDIT_ID);
  const canDelete = permissions.includes(PERM_DELETE_ID);

  const handleOpenModal = () => {
    setEditingProduct(null);
    setFileList([]);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingProduct(record);
    if (record.hinhAnh) {
      setFileList([
        { uid: "-1", name: "image.png", status: "done", url: record.hinhAnh },
      ]);
    } else {
      setFileList([]);
    }
    // Chuyển đổi NCC object -> ID
    const selectedNCCIds =
      record.danhSachNCC && Array.isArray(record.danhSachNCC)
        ? record.danhSachNCC.map((item) =>
            typeof item === "object" ? item.maNCC : item
          )
        : record.danhSachMaNCC || [];

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
    form
      .validateFields()
      .then(async (values) => {
        setSubmitLoading(true);
        try {
          const file = fileList.length > 0 ? fileList[0].originFileObj : null;
          const productData = {
            tenSP: values.tenSP,
            donViTinh: values.donViTinh,
            giaNhap: values.giaNhap,
            soLuongTon: values.soLuongTon,
            mucTonToiThieu: values.mucTonToiThieu,
            mucTonToiDa: values.mucTonToiDa,
            maLoai: values.maLoai,
            moTa: values.moTa,
            danhSachMaNCC: values.danhSachMaNCC || [],
          };
          if (editingProduct)
            await productService.updateProduct(
              editingProduct.maSP,
              productData,
              file
            );
          else await productService.createProduct(productData, file);
          messageApi.success("Thành công!");
          setIsModalVisible(false);
          fetchProducts(pagination.current, pagination.pageSize, filter);
        } catch (error) {
          messageApi.error(error.response?.data?.message || "Có lỗi xảy ra!");
        } finally {
          setSubmitLoading(false);
        }
      })
      .catch(() => {});
  };

  const handleDelete = (id) => {
    setDeletingProductId(id);
    setIsDeleteModalOpen(true);
  };
  const handleDeleteConfirm = async () => {
    try {
      await productService.deleteProduct(deletingProductId);
      messageApi.success("Đã xóa!");
      fetchProducts(pagination.current, pagination.pageSize, filter);
    } catch (error) {
      messageApi.error("Lỗi xóa!");
    }
    setIsDeleteModalOpen(false);
  };
  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const columns = [
    { title: "Mã", dataIndex: "maSP", width: 60 },
    {
      title: "Ảnh",
      dataIndex: "hinhAnh",
      width: 80,
      render: (url) =>
        url ? (
          <Image
            width={40}
            src={url}
            fallback="https://via.placeholder.com/40"
          />
        ) : (
          <Tag>No Img</Tag>
        ),
    },
    { title: "Tên Sản Phẩm", dataIndex: "tenSP", width: 200 },
    { title: "ĐVT", dataIndex: "donViTinh", width: 70 },
    {
      title: "Giá Nhập",
      dataIndex: "giaNhap",
      render: (val) => `${Number(val).toLocaleString()} đ`,
      width: 110,
    },
    { title: "Tồn", dataIndex: "soLuongTon", width: 70 },
    {
      title: "Loại",
      width: 120,
      render: (_, r) => r.loaiHang?.tenLoai || `Mã: ${r.maLoai}`,
    },
    {
      title: "NCC",
      width: 150,
      render: (_, r) => (
        <>
          {r.danhSachNCC &&
            r.danhSachNCC.map((n, idx) => (
              <Tag
                key={idx}
                color="blue"
              >
                {n.tenNCC || n.maNCC || n}
              </Tag>
            ))}
        </>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Space size="small">
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
              onClick={() => handleDelete(record.maSP)}
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
          <Col span={6}>
            <Input
              placeholder="Tên sản phẩm..."
              prefix={<SearchOutlined />}
              value={filter.keyword}
              onChange={(e) =>
                setFilter({ ...filter, keyword: e.target.value })
              }
              onPressEnter={handleSearch}
            />
          </Col>
          {/* Nhập mã loại thủ công */}
          <Col span={4}>
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Mã loại"
              value={filter.maLoai}
              onChange={(val) => setFilter({ ...filter, maLoai: val })}
            />
          </Col>
          <Col span={4}>
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Giá từ"
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(v) => v.replace(/\$\s?|(,*)/g, "")}
              value={filter.minGia}
              onChange={(val) => setFilter({ ...filter, minGia: val })}
            />
          </Col>
          <Col span={4}>
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Đến giá"
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(v) => v.replace(/\$\s?|(,*)/g, "")}
              value={filter.maxGia}
              onChange={(val) => setFilter({ ...filter, maxGia: val })}
            />
          </Col>
          <Col
            span={6}
            style={{ textAlign: "right" }}
          >
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
              >
                Tìm kiếm
              </Button>
              <Button
                icon={<ClearOutlined />}
                onClick={handleResetFilter}
              >
                Xóa lọc
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
            Thêm Sản Phẩm
          </Button>
        )}
        <Button
          icon={<ReloadOutlined />}
          onClick={() =>
            fetchProducts(pagination.current, pagination.pageSize, filter)
          }
          loading={loading}
        >
          Tải lại
        </Button>
      </Space>

      <Table
        className="fixed-height-table"
        columns={columns}
        dataSource={products}
        loading={loading}
        rowKey="maSP"
        pagination={pagination}
        onChange={handleTableChange}
        scroll={{ x: 1000 }}
      />

      <Modal
        title={editingProduct ? "Sửa Sản Phẩm" : "Thêm Sản Phẩm"}
        open={isModalVisible}
        onOk={handleOk}
        confirmLoading={submitLoading}
        onCancel={handleCancel}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col
              span={24}
              style={{ textAlign: "center", marginBottom: 20 }}
            >
              <Upload
                listType="picture-card"
                fileList={fileList}
                onChange={handleUploadChange}
                beforeUpload={() => false}
                maxCount={1}
                onPreview={async (file) => {
                  let src =
                    file.url ||
                    (await new Promise((r) => {
                      const reader = new FileReader();
                      reader.readAsDataURL(file.originFileObj);
                      reader.onload = () => r(reader.result);
                    }));
                  window.open(src);
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
              <Form.Item
                name="tenSP"
                label="Tên Sản Phẩm"
                rules={[
                  { required: true, message: "Vui lòng nhập tên sản phẩm " },
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="maLoai"
                label="Mã Loại Hàng"
                rules={[{ required: true, message: "Vui lòng nhập Mã Loại " }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="Nhập ID"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="giaNhap"
                label="Giá Nhập"
                rules={[{ required: true, message: "Vui lòng nhập Giá " }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  formatter={(v) =>
                    `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(v) => v.replace(/\$\s?|(,*)/g, "")}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="donViTinh"
                label="ĐVT"
                rules={[
                  { required: true, message: "Vui lòng nhập Đơn Vị Tính " },
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="soLuongTon"
                label="Tồn Kho"
                initialValue={0}
              >
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="mucTonToiThieu"
                label="Min Tồn"
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="mucTonToiDa"
                label="Max Tồn"
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="danhSachMaNCC"
            label="Nhà Cung Cấp"
          >
            <Select
              mode="multiple"
              style={{ width: "100%" }}
              placeholder="Chọn NCC"
              optionFilterProp="children"
              showSearch
            >
              {listNCC.map((ncc) => (
                <Option
                  key={ncc.maNCC}
                  value={ncc.maNCC}
                >
                  {ncc.tenNCC}
                </Option>
              ))}
            </Select>
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
        <p>Bạn có chắc muốn xóa sản phẩm này?</p>
      </Modal>
    </div>
  );
};

export default ProductPage;
