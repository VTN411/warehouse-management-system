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
  RestOutlined,
  UndoOutlined,
  ArrowLeftOutlined,
  UploadOutlined,
} from "@ant-design/icons";
// [QUAN TRỌNG] Import đúng service của bạn
import * as productService from "../../services/product.service";
import * as supplierService from "../../services/supplier.service";
import * as categoryService from "../../services/category.service";

const { Option } = Select;

// --- CẤU HÌNH QUYỀN ---
const PERM_CREATE = 50;
const PERM_EDIT = 51;
const PERM_DELETE = 52;

const ProductPage = () => {
  const [products, setProducts] = useState([]);
  const [listNCC, setListNCC] = useState([]);
  const [listLoaiHang, setListLoaiHang] = useState([]);

  // State: Chế độ Thùng rác
  const [inTrashMode, setInTrashMode] = useState(false);

  // State Bộ lọc
  const [filter, setFilter] = useState({
    tenSP: "",
    maLoai: null,
    maNCC: null,
  });

  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [fileList, setFileList] = useState([]);

  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [permissions, setPermissions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // --- 1. TẢI DỮ LIỆU ---
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let response;

      // [FIX] Phân luồng gọi API dựa trên chế độ
      if (inTrashMode) {
        response = await productService.getTrashProducts();
      } else {
        response = await productService.getAllProducts();
      }

      let data = response.data ? response.data : response;

      if (data && data.content) {
        data = data.content;
      }

      if (Array.isArray(data)) {
        const finalData = data.filter((item) => {
          const matchName =
            !filter.tenSP ||
            item.tenSP.toLowerCase().includes(filter.tenSP.toLowerCase());
          const matchLoai = !filter.maLoai || item.maLoai === filter.maLoai;
          const matchNCC =
            !filter.maNCC ||
            (item.danhSachMaNCC && item.danhSachMaNCC.includes(filter.maNCC));

          return matchName && matchLoai && matchNCC;
        });

        setProducts(finalData);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
      setProducts([]);
    }
    setLoading(false);
  }, [inTrashMode, filter]);

  const fetchCommonData = useCallback(async () => {
    try {
      const [resNCC, resLoai] = await Promise.all([
        supplierService.getAllSuppliers(),
        categoryService.getAllCategories(),
      ]);
      setListNCC(resNCC.data || resNCC || []);
      setListLoaiHang(resLoai.data || resLoai || []);
    } catch (error) {
      console.error("Lỗi tải danh mục:", error);
    }
  }, []);

  // --- 2. KHỞI TẠO ---
  useEffect(() => {
    const storedUser = localStorage.getItem("user_info");
    if (storedUser) {
      try {
        let user = JSON.parse(storedUser);
        if (
          user.quyen &&
          !Array.isArray(user.quyen) &&
          user.quyen.maNguoiDung
        ) {
          user = user.quyen;
        }

        const roleName = (user.vaiTro || user.tenVaiTro || "").toUpperCase();
        setIsAdmin(roleName === "ADMIN");

        let rawPerms = user.dsQuyenSoHuu || user.quyen || [];
        if (!Array.isArray(rawPerms)) rawPerms = [];

        const parsedPerms = rawPerms.map((p) => {
          if (typeof p === "object" && p !== null)
            return parseInt(p.maQuyen || p.id);
          return parseInt(p);
        });

        setPermissions(parsedPerms);
      } catch (e) {
        setPermissions([]);
      }
    }
    fetchCommonData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const checkPerm = (id) => isAdmin || permissions.includes(id);

  // --- HANDLERS ---
  const handleOpenModal = () => {
    setEditingProduct(null);
    setFileList([]);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingProduct(record);
    const images = record.hinhAnh
      ? [{ uid: "-1", name: "image.png", status: "done", url: record.hinhAnh }]
      : [];
    setFileList(images);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form
      .validateFields()
      .then(async (values) => {
        try {
          let file = null;
          if (fileList.length > 0 && fileList[0].originFileObj) {
            file = fileList[0].originFileObj;
          }

          if (editingProduct) {
            await productService.updateProduct(
              editingProduct.maSP,
              values,
              file
            );
            messageApi.success("Cập nhật thành công!");
          } else {
            await productService.createProduct(values, file);
            messageApi.success("Tạo mới thành công!");
          }
          setIsModalVisible(false);
          fetchProducts();
        } catch (error) {
          messageApi.error("Lỗi khi lưu sản phẩm!");
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
      await productService.deleteProduct(deletingId);
      messageApi.success("Đã chuyển vào thùng rác!");
      fetchProducts();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data ||
        "Không thể xóa!";
      messageApi.error(errorMessage);
    }
    setIsDeleteModalOpen(false);
  };

  const handleRestore = async (id) => {
    try {
      await productService.restoreProduct(id);
      messageApi.success("Đã khôi phục sản phẩm!");
      fetchProducts();
    } catch (e) {
      messageApi.error("Lỗi khôi phục!");
    }
  };

  const handleUploadChange = ({ fileList: newFileList }) =>
    setFileList(newFileList);

  // --- CỘT BẢNG (ĐÃ CẬP NHẬT THEO DB) ---
  const columns = [
    {
      title: "Ảnh",
      dataIndex: "hinhAnh",
      width: 80,
      align: "center",
      render: (src) =>
        src ? (
          <Image
            src={src}
            width={50}
          />
        ) : (
          <div
            style={{
              width: 50,
              height: 50,
              background: "#f0f0f0",
              margin: "auto",
            }}
          >
            No IMG
          </div>
        ),
    },
    { title: "Tên Sản Phẩm", dataIndex: "tenSP", render: (t) => <b>{t}</b> },
    {
      title: "Loại Hàng",
      dataIndex: "maLoai",
      render: (id) => listLoaiHang.find((l) => l.maLoai === id)?.tenLoai || id,
    },
   {
      title: "Nhà Cung Cấp",
      key: "ncc",
      width: 250,
      render: (_, record) => {
        // API trả về "danhSachNCC": [{ maNCC: 1, tenNCC: "..." }, ...]
        const listNCC = record.danhSachNCC;

        if (Array.isArray(listNCC) && listNCC.length > 0) {
          return listNCC.map((ncc) => (
            <Tag key={ncc.maNCC} color="blue" style={{ marginBottom: 4 }}>
              {ncc.tenNCC}
            </Tag>
          ));
        }

        return <span style={{ color: "#ccc" }}>---</span>;
      },
    },
    {
      title: "ĐVT",
      dataIndex: "donViTinh",
      width: 80,
      align: "center",
    },
    {
      title: "Giá Nhập", // Đổi từ Giá Bán sang Giá Nhập
      dataIndex: "giaNhap",
      align: "right",
      render: (v) => Number(v).toLocaleString() + " đ",
    },
    {
      title: "Tồn Kho",
      dataIndex: "soLuongTon",
      align: "center",
      render: (v) => <Tag color={v > 10 ? "blue" : "red"}>{v}</Tag>,
    },
    {
      title: "Hành động",
      key: "action",
      width: 150,
      align: "center",
      render: (_, record) => {
        const allowEdit = checkPerm(PERM_EDIT);
        const allowDelete = checkPerm(PERM_DELETE);

        return (
          <Space size="middle">
            {inTrashMode ? (
              allowDelete && (
                <Tooltip title="Khôi phục">
                  <Button
                    icon={<UndoOutlined />}
                    type="primary"
                    ghost
                    onClick={() => handleRestore(record.maSP)}
                  >
                    Khôi phục
                  </Button>
                </Tooltip>
              )
            ) : (
              <>
                {allowEdit && (
                  <Tooltip title="Cập nhật">
                    <Button
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(record)}
                    />
                  </Tooltip>
                )}
                {allowDelete && (
                  <Tooltip title="Xóa">
                    <Button
                      icon={<DeleteOutlined />}
                      danger
                      onClick={() => handleDelete(record.maSP)}
                    />
                  </Tooltip>
                )}
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
        >
          <Col span={6}>
            <Input
              placeholder="Tên sản phẩm..."
              prefix={<SearchOutlined />}
              value={filter.tenSP}
              onChange={(e) => setFilter({ ...filter, tenSP: e.target.value })}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="Loại hàng"
              style={{ width: "100%" }}
              allowClear
              value={filter.maLoai}
              onChange={(v) => setFilter({ ...filter, maLoai: v })}
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
            <Select
              placeholder="Nhà cung cấp"
              style={{ width: "100%" }}
              allowClear
              value={filter.maNCC}
              onChange={(v) => setFilter({ ...filter, maNCC: v })}
            >
              {listNCC.map((n) => (
                <Option
                  key={n.maNCC}
                  value={n.maNCC}
                >
                  {n.tenNCC}
                </Option>
              ))}
            </Select>
          </Col>
          <Col
            span={10}
            style={{ textAlign: "right" }}
          >
            <Space>
              <Button
                icon={<ClearOutlined />}
                onClick={() =>
                  setFilter({ tenSP: "", maLoai: null, maNCC: null })
                }
              >
                Xóa lọc
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchProducts}
              >
                Tải lại
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Space>
          {!inTrashMode && checkPerm(PERM_CREATE) && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenModal}
            >
              Thêm Sản Phẩm
            </Button>
          )}
        </Space>

        <Space>
          {inTrashMode ? (
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => setInTrashMode(false)}
            >
              Quay lại danh sách
            </Button>
          ) : (
            (isAdmin || checkPerm(PERM_DELETE)) && (
              <Button
                icon={<RestOutlined />}
                danger
                onClick={() => setInTrashMode(true)}
              >
                Thùng rác
              </Button>
            )
          )}
        </Space>
      </div>

      {inTrashMode && <h3 style={{ color: "red" }}>Thùng rác sản phẩm</h3>}

      <Table
        className="fixed-height-table"
        columns={columns}
        dataSource={products}
        loading={loading}
        rowKey="maSP"
        pagination={{ pageSize: 5 }}
      />

      {/* --- MODAL FORM (ĐÃ SỬA THEO DB) --- */}
      <Modal
        title={editingProduct ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
        >
          {/* Hàng 1: Tên & Loại */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="tenSP"
                label="Tên Sản Phẩm"
                rules={[{ required: true, message: "Vui lòng nhập tên!" }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="maLoai"
                label="Loại Hàng"
                rules={[{ required: true, message: "Chọn loại hàng!" }]}
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

          {/* Hàng 2: ĐVT & Giá Nhập */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="donViTinh"
                label="Đơn vị tính"
                rules={[{ required: true, message: "Nhập ĐVT!" }]}
              >
                <Input placeholder="Ví dụ: Cái, Hộp, Kg..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="giaNhap"
                label="Giá nhập ban đầu"
                rules={[{ required: true, message: "Nhập giá!" }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  formatter={(v) =>
                    `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(v) => v.replace(/\$\s?|(,*)/g, "")}
                  addonAfter="VNĐ"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Hàng 3: Tồn Min & Max */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="mucTonToiThieu"
                label="Mức tồn tối thiểu"
                rules={[{ required: true }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="mucTonToiDa"
                label="Mức tồn tối đa"
                rules={[{ required: true }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Hàng 4: Nhà Cung Cấp */}
          <Form.Item
            name="danhSachMaNCC"
            label="Chọn Nhà Cung Cấp"
            rules={[{ required: true, message: "Chọn ít nhất 1 NCC!" }]}
          >
            <Select
              mode="multiple"
              style={{ width: "100%" }}
              placeholder="Chọn các nhà cung cấp..."
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

          {/* Hàng 5: Hình Ảnh */}
          <Form.Item label="Hình ảnh sản phẩm">
            <Upload
              listType="picture"
              fileList={fileList}
              onChange={handleUploadChange}
              beforeUpload={() => false}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Tải ảnh lên</Button>
            </Upload>
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
