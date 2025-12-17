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
  UploadOutlined,
} from "@ant-design/icons";
import * as productService from "../../services/product.service";
import * as supplierService from "../../services/supplier.service";
import * as categoryService from "../../services/category.service";

const { Option } = Select;

// --- CẤU HÌNH ID QUYỀN (SẢN PHẨM) ---
const PERM_CREATE = 50; // Tạo mới
const PERM_EDIT = 51; // Cập nhật
const PERM_DELETE = 52; // Xóa (kiêm Khôi phục / Xem thùng rác)

const ProductPage = () => {
  // --- STATE ---
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

  // State Quyền hạn
  const [permissions, setPermissions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // --- 1. TẢI DỮ LIỆU ---
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let response;
      // [LOGIC] Nếu có API thùng rác riêng thì gọi, ở đây tạm dùng getAll và lọc
      response = await productService.getAllProducts();

      let data = response.data;
      if (data.content) data = data.content; // Nếu trả về Page object

      if (Array.isArray(data)) {
        // Lọc Client-side (nếu Backend trả về hết)
        // Nếu Backend đã lọc sẵn thì bỏ đoạn filter này
        const filtered = data.filter((item) => {
          // Giả sử logic: daXoa=1 hoặc trangThai=0 là đã xóa
          const isDeleted = item.daXoa === 1 || item.trangThai === 0;
          return inTrashMode ? isDeleted : !isDeleted;
        });

        // Lọc theo bộ lọc tìm kiếm
        const finalData = filtered.filter((item) => {
          const matchName =
            !filter.tenSP ||
            item.tenSP.toLowerCase().includes(filter.tenSP.toLowerCase());
          const matchLoai = !filter.maLoai || item.maLoai === filter.maLoai;
          const matchNCC =
            !filter.maNCC || item.danhSachMaNCC?.includes(filter.maNCC);
          return matchName && matchLoai && matchNCC;
        });

        setProducts(finalData);
      }
    } catch (error) {
      messageApi.error("Không thể tải danh sách sản phẩm!");
    }
    setLoading(false);
  }, [inTrashMode, filter, messageApi]);

  const fetchCommonData = useCallback(async () => {
    try {
      const [resNCC, resLoai] = await Promise.all([
        supplierService.getAllSuppliers(),
        categoryService.getAllCategories(),
      ]);
      setListNCC(resNCC.data || []);
      setListLoaiHang(resLoai.data || []); // Cần đảm bảo data trả về đúng mảng
    } catch (error) {
      console.error("Lỗi tải danh mục:", error);
    }
  }, []);

  // --- 2. KHỞI TẠO & PHÂN QUYỀN ---
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

        // [!] LƯU QUYỀN
        setPermissions(parsedPerms);

        // [!] KHÔNG CHECK QUYỀN XEM Ở ĐÂY
        // (Role nào cũng được fetch dữ liệu)
      } catch (e) {
        setPermissions([]);
      }
    }

    // Luôn tải dữ liệu
    fetchCommonData();
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]); // Reload khi filter hoặc chế độ thùng rác đổi

  // Hàm check quyền
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

    // Xử lý ảnh để hiển thị trong Upload
    const images = record.hinhAnh
      ? [
          {
            uid: "-1",
            name: "image.png",
            status: "done",
            url: record.hinhAnh, // Giả sử BE trả về link ảnh hoặc base64
          },
        ]
      : [];
    setFileList(images);

    form.setFieldsValue({
      ...record,
      // Map các trường đặc biệt nếu cần
    });
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form
      .validateFields()
      .then(async (values) => {
        // Xử lý upload ảnh (nếu có logic upload riêng thì gọi ở đây)
        // Giả sử values đã có đủ info
        try {
          // [Lưu ý]: Nếu có file ảnh, cần chuyển sang FormData
          // Ở đây demo gửi JSON cơ bản
          if (editingProduct) {
            await productService.updateProduct(editingProduct.maSP, values);
            messageApi.success("Cập nhật thành công!");
          } else {
            await productService.createProduct(values);
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
    } catch (e) {
      messageApi.error("Lỗi khi xóa!");
    }
    setIsDeleteModalOpen(false);
  };

  // Giả sử có hàm restore
  const handleRestore = async (id) => {
    try {
      // await productService.restoreProduct(id);
      messageApi.info("Backend cần API khôi phục (Restore)");
      // fetchProducts();
    } catch (e) {
      messageApi.error("Lỗi khôi phục");
    }
  };

  const handleUploadChange = ({ fileList: newFileList }) =>
    setFileList(newFileList);

  // --- CỘT BẢNG ---
  const columns = [
    {
      title: "Ảnh",
      dataIndex: "hinhAnh",
      width: 80,
      render: (src) =>
        src ? (
          <Image
            src={src}
            width={50}
          />
        ) : (
          <div style={{ width: 50, height: 50, background: "#f0f0f0" }}>
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
      title: "Giá Bán",
      dataIndex: "giaBan",
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
        // [CHECK QUYỀN]
        const allowEdit = checkPerm(PERM_EDIT); // 51
        const allowDelete = checkPerm(PERM_DELETE); // 52

        return (
          <Space size="middle">
            {inTrashMode ? (
              // Thùng rác: Hiện Khôi Phục nếu có quyền Xóa (52)
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
              // Danh sách chính: Hiện Sửa (51) / Xóa (52)
              <>
                {allowEdit && (
                  <Tooltip title="Cập nhật (Quyền 51)">
                    <Button
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(record)}
                    />
                  </Tooltip>
                )}
                {allowDelete && (
                  <Tooltip title="Xóa (Quyền 52)">
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
        {/* BỘ LỌC */}
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
          {/* Nút Tạo Mới: Cần quyền 50 */}
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
          {/* Nút Thùng Rác: Cần quyền Xóa (52) hoặc Admin */}
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

      {inTrashMode && (
        <h3 style={{ color: "red" }}>Đang xem: Thùng rác sản phẩm</h3>
      )}

      <Table
        className="fixed-height-table"
        columns={columns}
        dataSource={products}
        loading={loading}
        rowKey="maSP"
        pagination={{ pageSize: 5 }}
      />

      {/* MODAL FORM */}
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
                <Select>
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
                name="giaBan"
                label="Giá Bán"
                rules={[{ required: true }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  formatter={(v) =>
                    `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(v) => v.replace(/\$\s?|(,*)/g, "")}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="giaNhap"
                label="Giá Nhập"
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  formatter={(v) =>
                    `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(v) => v.replace(/\$\s?|(,*)/g, "")}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="soLuongTon"
                label="Tồn Kho"
                initialValue={0}
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
                name="donViTinh"
                label="Đơn vị tính"
              >
                <Input placeholder="Cái, Hộp..." />
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

          <Form.Item label="Hình ảnh">
            <Upload
              listType="picture"
              fileList={fileList}
              onChange={handleUploadChange}
              beforeUpload={() => false} // Chặn auto upload
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
            </Upload>
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
        <p>Bạn có chắc muốn xóa sản phẩm này?</p>
        <p style={{ fontSize: 12, color: "#888" }}>
          Sản phẩm sẽ được chuyển vào thùng rác.
        </p>
      </Modal>
    </div>
  );
};

export default ProductPage;
