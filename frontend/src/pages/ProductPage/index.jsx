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
import * as categoryService from "../../services/category.service";

const { Option } = Select;

const PERM_CREATE_ID = 50;
const PERM_EDIT_ID = 51;
const PERM_DELETE_ID = 52;

const ProductPage = () => {
  const [products, setProducts] = useState([]);
  const [listNCC, setListNCC] = useState([]);
  const [listLoaiHang, setListLoaiHang] = useState([]);

  // State Bộ lọc
  const [filter, setFilter] = useState({
    keyword: "",
    maLoai: null,
    minGia: null,
    maxGia: null,
  });

  // State Phân trang
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
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

  // 1. Hàm tải dữ liệu
  const fetchProducts = useCallback(
    async (page, pageSize, currentFilter) => {
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
            current: page, // Cập nhật trang hiện tại từ tham số truyền vào
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
      const [resNCC, resLoai] = await Promise.allSettled([
        supplierService.getAllSuppliers(),
        categoryService.getAllCategories(), // Gọi API lấy loại hàng
      ]);

      if (resNCC.status === "fulfilled") setListNCC(resNCC.value.data || []);
      if (resLoai.status === "fulfilled")
        setListLoaiHang(resLoai.value.data || []);
    } catch (error) {
      console.error("Lỗi tải danh mục:", error);
    }
  }, []);

  // [!] 2. SỬA LỖI QUAN TRỌNG TẠI ĐÂY:
  // useEffect chỉ chạy 1 lần duy nhất khi mount (mảng phụ thuộc rỗng [])
  // Để tránh việc nó tự động reset về trang 1 khi component re-render.
  useEffect(() => {
    fetchProducts(1, 5, {}); // Load trang 1, 5 dòng, không lọc
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Xử lý tìm kiếm (Reset về trang 1)
  const handleSearch = () => {
    fetchProducts(1, pagination.pageSize, filter);
  };

  // Xử lý reset (Reset về trang 1)
  const handleResetFilter = () => {
    const emptyFilter = {
      keyword: "",
      maLoai: null,
      minGia: null,
      maxGia: null,
    };
    setFilter(emptyFilter);
    fetchProducts(1, pagination.pageSize, emptyFilter);
  };

  // [!] 3. HÀM CHUYỂN TRANG
  const handleTableChange = (newPagination) => {
    // Gọi API với trang mới và filter hiện tại
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
          // Load lại trang hiện tại sau khi lưu
          fetchProducts(pagination.current, pagination.pageSize, filter);
        } catch (error) {
        // [!] LOGIC BẮT LỖI TỪ BACKEND ĐỂ HIỂN THỊ
        console.error("Lỗi API:", error.response); // In ra console để debug nếu cần

        let errorMsg = "Có lỗi xảy ra!";
        
        if (error.response) {
            // Trường hợp 1: Backend trả về JSON chuẩn (ví dụ: { "message": "Tên bị trùng", "status": 400 })
            if (error.response.data && error.response.data.message) {
                errorMsg = error.response.data.message;
            } 
            // Trường hợp 2: Backend trả về chuỗi text trực tiếp (ví dụ: "Tên bị trùng")
            else if (typeof error.response.data === "string") {
                errorMsg = error.response.data;
            }
        } else if (error.message) {
            // Trường hợp lỗi mạng hoặc lỗi code frontend
            errorMsg = error.message;
        }

        // Hiển thị thông báo lỗi màu đỏ
        messageApi.error(errorMsg); 
      } finally {
        setSubmitLoading(false);
      }
    }).catch(() => {
        // Lỗi validate form (bỏ qua vì Antd đã hiện chữ đỏ dưới ô input)
    });
  };

  const handleDelete = (record) => {
    // 1. Kiểm tra tồn kho
    if (record.soLuongTon > 0) {
        messageApi.warning(`Không thể xóa! Sản phẩm "${record.tenSP}" đang còn tồn kho (${record.soLuongTon}).`);
        return; // Dừng lại ngay, không mở modal xóa
    }

    // 2. Nếu tồn = 0 thì mới mở modal xác nhận
    setDeletingProductId(record.maSP);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await productService.deleteProduct(deletingProductId);
      messageApi.success("Đã xóa!");
      // Load lại trang hiện tại sau khi xóa
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
    { title: "Mã", dataIndex: "maSP", width: 60, 
      render: (text, record) => <span style={{ opacity: record.daXoa ? 0.5 : 1 }}>{text}</span> 
    },
    {
      title: "Ảnh",
      dataIndex: "hinhAnh",
      width: 80,
      render: (url, record) => (
        <div style={{ opacity: record.daXoa ? 0.5 : 1 }}>
            {url ? <Image width={40} src={url} /> : <Tag>No Img</Tag>}
        </div>
      ),
    },
    { 
      title: "Tên Sản Phẩm", 
      dataIndex: "tenSP", 
      width: 200,
      render: (text, record) => (
        <div style={{ opacity: record.daXoa ? 0.5 : 1 }}>
          <span style={{ textDecoration: record.daXoa ? 'line-through' : 'none', color: record.daXoa ? '#999' : 'inherit' }}>
            {text}
          </span>
          {/* Hiện nhãn nếu đã xóa */}
          {record.daXoa && <Tag color="default" style={{ marginLeft: 8 }}>Đã xóa</Tag>}
        </div>
      )
    },
    { 
        title: "ĐVT", dataIndex: "donViTinh", width: 70,
        render: (t, r) => <span style={{ opacity: r.daXoa ? 0.5 : 1 }}>{t}</span>
    },
    {
      title: "Giá Nhập",
      dataIndex: "giaNhap",
      width: 110,
      render: (val, r) => <span style={{ opacity: r.daXoa ? 0.5 : 1 }}>{Number(val).toLocaleString()} đ</span>,
    },
    { 
        title: "Tồn", dataIndex: "soLuongTon", width: 70,
        render: (t, r) => <span style={{ opacity: r.daXoa ? 0.5 : 1 }}>{t}</span>
    },
    {
      title: "Loại",
      width: 120,
      render: (_, r) => {
        const id = r.loaiHang?.maLoai || r.maLoai;
        const cat = listLoaiHang.find((c) => c.maLoai === id);
        return <span style={{ opacity: r.daXoa ? 0.5 : 1 }}>{cat ? cat.tenLoai : `Mã: ${id}`}</span>;
      },
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
              // [!] KHÓA NÚT SỬA NẾU ĐÃ XÓA
              disabled={!!record.daXoa} 
            />
          )}
          {canDelete && (
            <Button
              icon={<DeleteOutlined />}
              danger
              onClick={() => handleDelete(record)}
              // [!] KHÓA NÚT XÓA NẾU ĐÃ XÓA (Tránh xóa 2 lần)
              disabled={!!record.daXoa} 
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
          <Col span={4}>
            <Select
              style={{ width: "100%" }}
              placeholder="Chọn loại"
              allowClear
              value={filter.maLoai}
              onChange={(val) => setFilter({ ...filter, maLoai: val })}
            >
              {listLoaiHang.map((l) => (
                <Option
                  key={l.maLoai}
                  value={l.maLoai}
                >
                  {l.tenLoai}
                </Option>
              ))}
            </Select>
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
        {/* Nút Reload tải lại trang hiện tại chứ không reset về 1 */}
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
        // [!] Gắn state phân trang vào bảng
        pagination={pagination}
        // [!] Gắn hàm xử lý chuyển trang
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
                  { required: true, message: "Vui lòng nhập tên sản phẩm" },
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="maLoai"
                label="Loại Hàng"
                rules={[{ required: true, message: "Vui lòng chọn loại hàng" }]}
              >
                <Select placeholder="Chọn loại hàng">
                  {listLoaiHang.map((l) => (
                    <Option
                      key={l.maLoai}
                      value={l.maLoai}
                    >
                      {l.tenLoai}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="donViTinh"
                label="Đơn vị tính"
                rules={[{ required: true, message: "Vui lòng nhập đơn vị tính" }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="mucTonToiThieu"
                label="Mức tồn tối thiểu"
                rules={[{ required: true, message: "Vui lòng nhập mức tồn tối thiểu" }]}
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
                label="Mức tồn tối đa"
                rules={[{ required: true, message: "Vui lòng nhập mức tồn tối đa" }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>

            <Col span={8}>
              <Form.Item
                name="giaNhap"
                label="Giá "
                rules={[{ required: true, message:"Vui lòng nhập giá" }]}
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
          </Row>

          
          <Form.Item
            name="danhSachMaNCC"
            label="Nhà Cung Cấp"
            rules={[{ required: true , message: "Vui lòng chọn nhà cung cấp"}]}
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
