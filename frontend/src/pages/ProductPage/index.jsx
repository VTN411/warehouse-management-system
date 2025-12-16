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
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  ClearOutlined,
  RestOutlined, // Icon thùng rác
  UndoOutlined, // Icon khôi phục
  ArrowLeftOutlined, // Icon quay lại
} from "@ant-design/icons";
import * as productService from "../../services/product.service";
import * as supplierService from "../../services/supplier.service";
import * as categoryService from "../../services/category.service";

const { Option } = Select;

// Quyền hạn (Giữ nguyên)
const PERM_CREATE_ID = 50;
const PERM_EDIT_ID = 51;
const PERM_DELETE_ID = 52;

const ProductPage = () => {
  // --- STATE ---
  const [products, setProducts] = useState([]);
  const [listNCC, setListNCC] = useState([]);
  const [listLoaiHang, setListLoaiHang] = useState([]);

  // State: Chế độ Thùng rác
  const [inTrashMode, setInTrashMode] = useState(false);

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

  // --- 1. HÀM TẢI DỮ LIỆU (QUAN TRỌNG: TÁCH LOGIC TRASH VÀ FILTER) ---
  const fetchProducts = useCallback(
    async (page, pageSize, currentFilter) => {
      setLoading(true);
      try {
        let data = [];
        let total = 0;

        if (inTrashMode) {
          // A. CHẾ ĐỘ THÙNG RÁC (Gọi API getTrashProducts)
          // Lưu ý: API trash thường trả về List thay vì Page. Xử lý tùy backend.
          const response = await productService.getTrashProducts();
          const rawData = response.data; // Giả sử trả về List<Product>

          // Nếu backend trả về List, ta có thể tự phân trang client hoặc hiển thị hết
          if (Array.isArray(rawData)) {
            data = rawData;
            total = rawData.length;
          } else if (rawData && Array.isArray(rawData.content)) {
            data = rawData.content;
            total = rawData.totalElements;
          }
        } else {
          // B. CHẾ ĐỘ DANH SÁCH CHÍNH (Gọi API filterProducts)
          const filterData = {
            ...currentFilter,
            page: page - 1,
            size: pageSize,
          };
          const response = await productService.filterProducts(filterData);
          const resData = response.data;

          if (resData && Array.isArray(resData.content)) {
            data = resData.content;
            total = resData.totalElements;
          } else if (Array.isArray(resData)) {
            data = resData;
            total = resData.length;
          }
        }

        setProducts(data);
        setPagination((prev) => ({
          ...prev,
          current: page,
          pageSize: pageSize,
          total: total,
        }));
      } catch (error) {
        console.error(error);
        messageApi.error("Không thể tải danh sách sản phẩm!");
      }
      setLoading(false);
    },
    [messageApi, inTrashMode] // Khi inTrashMode đổi, hàm này cập nhật logic
  );

  const fetchCommonData = useCallback(async () => {
    try {
      const [resNCC, resLoai] = await Promise.allSettled([
        supplierService.getAllSuppliers(),
        categoryService.getAllCategories(),
      ]);
      if (resNCC.status === "fulfilled") setListNCC(resNCC.value.data || []);
      if (resLoai.status === "fulfilled")
        setListLoaiHang(resLoai.value.data || []);
    } catch (error) {
      console.error("Lỗi tải danh mục:", error);
    }
  }, []);

  useEffect(() => {
    // Mỗi khi chế độ Trash/Active thay đổi, reset về trang 1
    fetchProducts(1, 5, filter);
    fetchCommonData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inTrashMode]);
  // [!] Thêm inTrashMode vào đây để khi bấm nút thùng rác nó tự load lại

  useEffect(() => {
    // Lấy quyền user
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
  }, []);

  // --- HANDLERS ---

  const handleSearch = () => fetchProducts(1, pagination.pageSize, filter);

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

  const handleTableChange = (newPagination) => {
    fetchProducts(newPagination.current, newPagination.pageSize, filter);
  };

  // --- KHÔI PHỤC (RESTORE) ---
  const handleRestore = async (record) => {
    try {
      // Gọi API restore
      await productService.restoreProduct(record.maSP);

      messageApi.success("Khôi phục thành công!");

      // Load lại danh sách (để item đó biến mất khỏi thùng rác)
      fetchProducts(pagination.current, pagination.pageSize, filter);
    } catch (error) {
      console.error("Lỗi restore:", error);

      // MẶC ĐỊNH: Thông báo chung
      let errorMsg = "Lỗi khi khôi phục!";

      // KIỂM TRA: Nếu Server có trả về response
      if (error.response) {
        // Trường hợp 1: Server trả về JSON object (ví dụ: { message: "Tên trùng", status: 400 })
        if (error.response.data && error.response.data.message) {
          errorMsg = error.response.data.message;
        }
        // Trường hợp 2: Server trả về chuỗi text trực tiếp (ví dụ: "Tên sản phẩm đã tồn tại")
        else if (typeof error.response.data === "string") {
          errorMsg = error.response.data;
        }
      }

      // Hiển thị thông báo lỗi chính xác
      messageApi.error(errorMsg);
    }
  };

  // --- XÓA MỀM (SOFT DELETE) ---
  const handleDelete = (record) => {
    if (record.soLuongTon > 0) {
      messageApi.warning(
        `Sản phẩm đang còn tồn kho (${record.soLuongTon}). Không thể xóa!`
      );
      return;
    }
    setDeletingProductId(record.maSP);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await productService.deleteProduct(deletingProductId);
      messageApi.success("Đã chuyển vào thùng rác!");
      fetchProducts(pagination.current, pagination.pageSize, filter);
    } catch (error) {
      messageApi.error("Lỗi xóa!");
    }
    setIsDeleteModalOpen(false);
  };

  // --- MODAL HANDLERS (Create/Edit) ---
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
    // Map data for Form
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

  const handleOk = () => {
    form
      .validateFields()
      .then(async (values) => {
        setSubmitLoading(true);
        try {
          const file = fileList.length > 0 ? fileList[0].originFileObj : null;
          const productData = {
            ...values,
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
          let errorMsg = "Có lỗi xảy ra!";
          if (
            error.response &&
            error.response.data &&
            error.response.data.message
          ) {
            errorMsg = error.response.data.message;
          } else if (typeof error.response?.data === "string") {
            errorMsg = error.response.data;
          }
          messageApi.error(errorMsg);
        } finally {
          setSubmitLoading(false);
        }
      })
      .catch(() => {});
  };

  // --- COLUMNS ---
  const columns = [
    { title: "Mã", dataIndex: "maSP", width: 60, align: "center" },
    {
      title: "Ảnh",
      dataIndex: "hinhAnh",
      width: 80,
      align: "center",
      render: (url) =>
        url ? (
          <Image
            width={40}
            src={url}
          />
        ) : (
          <Tag>No Img</Tag>
        ),
    },
    {
      title: "Tên Sản Phẩm",
      dataIndex: "tenSP",
      width: 200,
      render: (text) => <b>{text}</b>,
    },
    { title: "ĐVT", dataIndex: "donViTinh", width: 70, align: "center" },
    {
      title: "Giá Nhập",
      dataIndex: "giaNhap",
      width: 110,
      align: "right",
      render: (val) => (val ? `${Number(val).toLocaleString()} đ` : "0 đ"),
    },
    { title: "Tồn", dataIndex: "soLuongTon", width: 70, align: "center" },
    {
      title: "Loại",
      width: 120,
      render: (_, r) => {
        const id = r.loaiHang?.maLoai || r.maLoai;
        const cat = listLoaiHang.find((c) => c.maLoai === id);
        return cat ? cat.tenLoai : id;
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
      align: "center",
      render: (_, record) => (
        <Space size="small">
          {inTrashMode ? (
            // 1. NẾU Ở THÙNG RÁC -> HIỆN NÚT KHÔI PHỤC
            <Tooltip title="Khôi phục sản phẩm">
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
            // 2. NẾU Ở DS CHÍNH -> HIỆN SỬA / XÓA
            <>
              {permissions.includes(PERM_EDIT_ID) && (
                <Button
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                />
              )}
              {permissions.includes(PERM_DELETE_ID) && (
                <Button
                  icon={<DeleteOutlined />}
                  danger
                  onClick={() => handleDelete(record)}
                />
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
          {/* --- CỤM TÌM KIẾM / TIÊU ĐỀ --- */}
          {!inTrashMode ? (
            // Nếu không ở thùng rác -> Hiện bộ lọc đầy đủ
            <>
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
                  formatter={(v) =>
                    `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(v) => v.replace(/\$\s?|(,*)/g, "")}
                  value={filter.minGia}
                  onChange={(val) => setFilter({ ...filter, minGia: val })}
                />
              </Col>
              <Col span={4}>
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="Đến giá"
                  formatter={(v) =>
                    `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(v) => v.replace(/\$\s?|(,*)/g, "")}
                  value={filter.maxGia}
                  onChange={(val) => setFilter({ ...filter, maxGia: val })}
                />
              </Col>
              <Col span={2}>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={handleSearch}
                  block
                >
                  Tìm
                </Button>
              </Col>
            </>
          ) : (
            // Nếu ở thùng rác -> Hiện tiêu đề
            <Col span={18}>
              <h3 style={{ margin: 0, color: "#ff4d4f" }}>
                <RestOutlined /> Thùng rác (Sản phẩm đã xóa)
              </h3>
            </Col>
          )}

          {/* --- CỤM NÚT CHỨC NĂNG --- */}
          <Col style={{ marginLeft: "auto" }}>
            <Space>
              {!inTrashMode && (
                <Button
                  icon={<ClearOutlined />}
                  onClick={handleResetFilter}
                >
                  Xóa lọc
                </Button>
              )}

              {/* Logic chuyển đổi nút Thùng rác / Quay lại */}
              {inTrashMode ? (
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => setInTrashMode(false)}
                >
                  Quay lại DS
                </Button>
              ) : (
                <Button
                  icon={<RestOutlined />}
                  danger
                  onClick={() => setInTrashMode(true)}
                >
                  Thùng rác
                </Button>
              )}

              <Button
                icon={<ReloadOutlined />}
                onClick={() =>
                  fetchProducts(pagination.current, pagination.pageSize, filter)
                }
              >
                Tải lại
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Chỉ hiện nút Thêm mới khi KHÔNG ở thùng rác */}
      {!inTrashMode && permissions.includes(PERM_CREATE_ID) && (
        <Space style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenModal}
          >
            Thêm Sản Phẩm
          </Button>
        </Space>
      )}

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

      {/* Modal Thêm/Sửa (Giữ nguyên logic của bạn) */}
      <Modal
        title={editingProduct ? "Sửa Sản Phẩm" : "Thêm Sản Phẩm"}
        open={isModalVisible}
        onOk={handleOk}
        confirmLoading={submitLoading}
        onCancel={() => setIsModalVisible(false)}
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
                onChange={({ fileList: fl }) => setFileList(fl)}
                beforeUpload={() => false}
                maxCount={1}
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
          {/* ... (Các trường Form giữ nguyên như code cũ của bạn) ... */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="tenSP"
                label="Tên Sản Phẩm"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="maLoai"
                label="Loại Hàng"
                rules={[{ required: true }]}
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
                label="ĐVT"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="mucTonToiThieu"
                label="Tồn Min"
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
                label="Tồn Max"
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
                label="Giá Nhập"
                rules={[{ required: true }]}
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
            <Col span={16}>
              <Form.Item
                name="danhSachMaNCC"
                label="Nhà Cung Cấp"
                rules={[{ required: true }]}
              >
                <Select
                  mode="multiple"
                  style={{ width: "100%" }}
                  placeholder="Chọn NCC"
                  optionFilterProp="children"
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
            </Col>
          </Row>
          <Form.Item
            name="moTa"
            label="Mô Tả"
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Xóa */}
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
        <p style={{ fontSize: 12, color: "#888" }}>
          Sản phẩm sẽ được chuyển vào thùng rác.
        </p>
      </Modal>
    </div>
  );
};

export default ProductPage;
