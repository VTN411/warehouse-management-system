// src/pages/PhieuNhapPage/index.jsx

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
  Tag,
  Descriptions,
  Divider,
  Row,
  Col,
  Card,
  DatePicker,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  MinusCircleOutlined,
  EditOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  SearchOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import * as phieuNhapService from "../../services/phieunhap.service";
import * as warehouseService from "../../services/warehouse.service";
import * as supplierService from "../../services/supplier.service";
import * as productService from "../../services/product.service";
import * as userService from "../../services/user.service";
import dayjs from "dayjs";

const { Option } = Select;
const { RangePicker } = DatePicker;

// --- CẤU HÌNH ID QUYỀN (CHUẨN THEO BẠN GỬI) ---
const PERM_VIEW = 26; // Xem danh sách
const PERM_CREATE = 20; // Tạo mới
const PERM_EDIT = 21; // Cập nhật (Sửa phiếu chờ duyệt)
const PERM_DELETE = 22; // Xóa
const PERM_APPROVE = 40; // Duyệt phiếu
const PERM_CANCEL = 41; // Hủy phiếu
const PERM_EDIT_APPROVED = 120; // Sửa phiếu (đã duyệt)

const PhieuNhapPage = () => {
  const [listData, setListData] = useState([]);

  // State phân trang
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
    showSizeChanger: true,
    pageSizeOptions: ["5", "10", "20", "50"],
  });

  // State bộ lọc
  const [filter, setFilter] = useState({
    chungTu: "",
    trangThai: null,
    maKho: null,
    maNCC: null,
    dateRange: null,
  });

  // State danh mục
  const [listKho, setListKho] = useState([]);
  const [listSanPham, setListSanPham] = useState([]);
  const [listNhaCungCap, setListNhaCungCap] = useState([]);
  const [listUser, setListUser] = useState([]);

  // State xử lý form
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingPhieuNhap, setViewingPhieuNhap] = useState(null);

  // State Quyền hạn
  const [permissions, setPermissions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // --- 1. HÀM TẢI DỮ LIỆU ---
  const fetchData = useCallback(
    async (page = 1, pageSize = 5, currentFilter = {}) => {
      setLoading(true);
      try {
        const { chungTu, trangThai, maKho, maNCC, dateRange } = currentFilter;

        const filterPayload = {
          page: page - 1,
          size: pageSize,
          chungTu: chungTu || null,
          trangThai: trangThai || null,
          maKho: maKho || null,
          maNCC: maNCC || null,
          fromDate: dateRange ? dateRange[0].format("YYYY-MM-DD") : null,
          toDate: dateRange ? dateRange[1].format("YYYY-MM-DD") : null,
        };

        const hasFilter = Object.values(filterPayload).some(
          (val) =>
            val !== null &&
            val !== "" &&
            val !== undefined &&
            val !== page - 1 &&
            val !== pageSize
        );

        let response;
        if (hasFilter && phieuNhapService.filterPhieuNhap) {
          response = await phieuNhapService.filterPhieuNhap(filterPayload);
        } else {
          response = await phieuNhapService.getAllPhieuNhap();
        }

        const data = response.data;
        if (data && Array.isArray(data.content)) {
          setListData(data.content);
          setPagination((prev) => ({
            ...prev,
            current: page,
            pageSize: pageSize,
            total: data.totalElements,
          }));
        } else if (Array.isArray(data)) {
          data.sort(
            (a, b) => new Date(b.ngayLapPhieu) - new Date(a.ngayLapPhieu)
          );
          const startIndex = (page - 1) * pageSize;
          const endIndex = startIndex + pageSize;
          setListData(data.slice(startIndex, endIndex));
          setPagination((prev) => ({
            ...prev,
            current: page,
            pageSize: pageSize,
            total: data.length,
          }));
        } else {
          setListData([]);
        }
      } catch (error) {
        messageApi.error("Không thể tải danh sách phiếu nhập!");
      }
      setLoading(false);
    },
    [messageApi]
  );

  const fetchCommonData = useCallback(async () => {
    try {
      const [resKho, resSP, resNCC, resUser] = await Promise.allSettled([
        warehouseService.getAllWarehouses(),
        productService.getAllProducts(),
        supplierService.getAllSuppliers(),
        userService.getAllUsers(),
      ]);

      if (resKho.status === "fulfilled") setListKho(resKho.value.data || []);
      if (resSP.status === "fulfilled") setListSanPham(resSP.value.data || []);
      if (resNCC.status === "fulfilled")
        setListNhaCungCap(resNCC.value.data || []);
      if (resUser.status === "fulfilled") setListUser(resUser.value.data || []);
    } catch (error) {
      console.error("Lỗi tải danh mục:", error);
    }
  }, []);

  // --- 2. KHỞI TẠO VÀ PHÂN QUYỀN (QUAN TRỌNG) ---
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

        // Chuyển đổi ID quyền sang số nguyên
        const parsedPerms = rawPerms.map((p) => {
          if (typeof p === "object" && p !== null)
            return parseInt(p.maQuyen || p.id);
          return parseInt(p);
        });

        // [!] LƯU QUYỀN VÀO STATE (Bắt buộc để nút hiển thị)
        setPermissions(parsedPerms);

        // Check quyền Xem danh sách (ID 26)
        const hasViewPerm = parsedPerms.includes(PERM_VIEW);

        if (roleName === "ADMIN" || hasViewPerm) {
          fetchData(1, 5, filter);
        } else {
          setLoading(false);
        }
      } catch (e) {
        setPermissions([]);
      }
    }
    fetchCommonData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- HANDLERS ---
  const handleSearch = () => fetchData(1, pagination.pageSize, filter);
  const handleResetFilter = () => {
    const empty = {
      chungTu: "",
      trangThai: null,
      maKho: null,
      maNCC: null,
      dateRange: null,
    };
    setFilter(empty);
    fetchData(1, 5, empty);
  };
  const handleTableChange = (newPag) =>
    fetchData(newPag.current, newPag.pageSize, filter);

  // Hàm check quyền nhanh
  const checkPerm = (id) => isAdmin || permissions.includes(id);

  // Logic hiển thị nút Sửa (dựa trên trạng thái và ID quyền)
  const isEditable = (record) => {
    // Admin luôn sửa được (trừ khi đã Hủy)
    if (isAdmin && record.trangThai !== 3) return true;

    // Chờ duyệt (Status 1) -> Cần quyền 21 (Cập nhật)
    if (record.trangThai === 1) return checkPerm(PERM_EDIT);

    // Đã duyệt (Status 2) -> Cần quyền 120 (Sửa phiếu đã duyệt)
    if (record.trangThai === 2) return checkPerm(PERM_EDIT_APPROVED);

    return false;
  };

  const getUserName = (id) => {
    const u = listUser.find((x) => x.maNguoiDung === id);
    return u ? u.hoTen : id;
  };

  const renderStatus = (s) => {
    if (s === 1) return <Tag color="orange">Chờ duyệt</Tag>;
    if (s === 2) return <Tag color="green">Đã duyệt</Tag>;
    if (s === 3) return <Tag color="red">Không duyệt</Tag>;
    return s;
  };

  // --- MODAL HANDLERS ---
  const handleOpenModal = () => {
    setEditingRecord(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = async (record) => {
    if (record.trangThai === 2) {
      // Nếu sửa phiếu đã duyệt, check lại lần nữa cho chắc
      if (!checkPerm(PERM_EDIT_APPROVED) && !isAdmin) {
        messageApi.warning("Bạn cần quyền 120 để sửa phiếu đã duyệt!");
        return;
      }
    }
    try {
      const res = await phieuNhapService.getPhieuNhapById(record.maPhieuNhap);
      setEditingRecord(res.data);
      form.setFieldsValue(res.data);
      setIsModalVisible(true);
    } catch (e) {
      messageApi.error("Lỗi tải chi tiết");
    }
  };

  const handleViewDetail = async (record) => {
    try {
      const res = await phieuNhapService.getPhieuNhapById(record.maPhieuNhap);
      setViewingPhieuNhap(res.data);
      setIsDetailModalOpen(true);
    } catch (e) {
      messageApi.error("Lỗi xem chi tiết");
    }
  };

  const handleOk = () => {
    form
      .validateFields()
      .then(async (values) => {
        try {
          if (editingRecord) {
            await phieuNhapService.updatePhieuNhap(
              editingRecord.maPhieuNhap,
              values
            );
            messageApi.success("Cập nhật thành công!");
          } else {
            await phieuNhapService.createPhieuNhap(values);
            messageApi.success("Tạo mới thành công!");
          }
          setIsModalVisible(false);
          fetchData(pagination.current, pagination.pageSize, filter);
        } catch (error) {
          messageApi.error("Lỗi xử lý!");
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
      await phieuNhapService.deletePhieuNhap(deletingId);
      messageApi.success("Đã xóa!");
      fetchData(pagination.current, pagination.pageSize, filter);
    } catch (e) {
      messageApi.error("Lỗi xóa!");
    }
    setIsDeleteModalOpen(false);
  };

  const handleApprove = async (id) => {
    try {
      await phieuNhapService.approvePhieuNhap(id);
      messageApi.success("Đã duyệt!");
      fetchData(pagination.current, pagination.pageSize, filter);
    } catch (e) {
      messageApi.error("Lỗi duyệt!");
    }
  };
  const handleReject = async (id) => {
    try {
      await phieuNhapService.rejectPhieuNhap(id);
      messageApi.success("Đã hủy!");
      fetchData(pagination.current, pagination.pageSize, filter);
    } catch (e) {
      messageApi.error("Lỗi hủy!");
    }
  };

  // --- CẤU HÌNH CỘT VÀ HIỂN THỊ NÚT ---
  const columns = [
    {
      title: "Ngày Lập",
      dataIndex: "ngayLapPhieu",
      width: "15%",
      render: (v) => dayjs(v).format("DD/MM/YYYY HH:mm"),
    },
    { title: "Chứng Từ", dataIndex: "chungTu", width: "10%" },
    {
      title: "Trạng Thái",
      dataIndex: "trangThai",
      width: "10%",
      render: renderStatus,
    },
    {
      title: "Tổng Tiền",
      dataIndex: "tongTien",
      width: "12%",
      render: (v) => Number(v || 0).toLocaleString() + " đ",
    },
    {
      title: "Nhà Cung Cấp",
      dataIndex: "maNCC",
      width: "20%",
      render: (id) => listNhaCungCap.find((n) => n.maNCC === id)?.tenNCC || id,
    },
    {
      title: "Người Lập",
      dataIndex: "nguoiLap",
      width: "10%",
      render: (id) => getUserName(id),
    },
    {
      title: "Hành động",
      key: "action",
      width: "20%",
      render: (_, record) => {
        const isChoDuyet = record.trangThai === 1;

        // 1. Logic nút Sửa (ID 21 hoặc 120)
        const allowEdit = isEditable(record);

        // 2. Logic nút Xóa (ID 22)
        const allowDelete = checkPerm(PERM_DELETE);

        // 3. Logic nút Duyệt (ID 40)
        const allowApprove = checkPerm(PERM_APPROVE);

        // 4. Logic nút Hủy (ID 41)
        const allowCancel = checkPerm(PERM_CANCEL);

        return (
          <Space
            size="small"
            wrap={false}
          >
            <Tooltip title="Xem chi tiết">
              <Button
                icon={<EyeOutlined />}
                onClick={() => handleViewDetail(record)}
              />
            </Tooltip>

            {allowEdit && (
              <Tooltip title="Sửa phiếu">
                <Button
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                />
              </Tooltip>
            )}

            {/* Xóa: Chỉ hiện khi Chờ duyệt + Có quyền 22 */}
            {isChoDuyet && allowDelete && (
              <Tooltip title="Xóa phiếu (Quyền 22)">
                <Button
                  icon={<DeleteOutlined />}
                  danger
                  onClick={() => handleDelete(record.maPhieuNhap)}
                />
              </Tooltip>
            )}

            {/* Duyệt: Chỉ hiện khi Chờ duyệt + Có quyền 40 */}
            {isChoDuyet && allowApprove && (
              <Tooltip title="Duyệt phiếu (Quyền 40)">
                <Button
                  icon={<CheckCircleOutlined />}
                  style={{ color: "green", borderColor: "green" }}
                  onClick={() => handleApprove(record.maPhieuNhap)}
                />
              </Tooltip>
            )}

            {/* Hủy: Chỉ hiện khi Chờ duyệt + Có quyền 41 */}
            {isChoDuyet && allowCancel && (
              <Tooltip title="Hủy phiếu (Quyền 41)">
                <Button
                  icon={<CloseCircleOutlined />}
                  danger
                  onClick={() => handleReject(record.maPhieuNhap)}
                />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  // Chặn nếu không có quyền xem (ID 26)
  const hasViewRight = isAdmin || permissions.includes(PERM_VIEW);

  if (!loading && permissions.length > 0 && !hasViewRight) {
    return (
      <Card style={{ margin: 20, textAlign: "center" }}>
        <h2 style={{ color: "red" }}>Truy cập bị từ chối</h2>
        <p>Bạn không có quyền xem danh sách Phiếu Nhập.</p>
        <p>
          Vui lòng liên hệ Admin cấp quyền mã: <b>{PERM_VIEW}</b>
        </p>
      </Card>
    );
  }

  return (
    <div>
      {contextHolder}
      <Card
        style={{ marginBottom: 16 }}
        bodyStyle={{ padding: "16px" }}
      >
        {/* BỘ LỌC */}
        <Row gutter={[16, 16]}>
          <Col span={4}>
            <div style={{ fontWeight: 500 }}>Mã chứng từ</div>
            <Input
              prefix={<SearchOutlined />}
              value={filter.chungTu}
              onChange={(e) =>
                setFilter({ ...filter, chungTu: e.target.value })
              }
            />
          </Col>
          <Col span={4}>
            <div style={{ fontWeight: 500 }}>Trạng thái</div>
            <Select
              style={{ width: "100%" }}
              allowClear
              value={filter.trangThai}
              onChange={(v) => setFilter({ ...filter, trangThai: v })}
            >
              <Option value={1}>Chờ duyệt</Option>
              <Option value={2}>Đã duyệt</Option>
              <Option value={3}>Không duyệt</Option>
            </Select>
          </Col>
          <Col span={4}>
            <div style={{ fontWeight: 500 }}>Kho nhập</div>
            <Select
              style={{ width: "100%" }}
              allowClear
              showSearch
              optionFilterProp="children"
              value={filter.maKho}
              onChange={(v) => setFilter({ ...filter, maKho: v })}
            >
              {listKho.map((k) => (
                <Option
                  key={k.maKho}
                  value={k.maKho}
                >
                  {k.tenKho}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <div style={{ fontWeight: 500 }}>Nhà cung cấp</div>
            <Select
              style={{ width: "100%" }}
              allowClear
              showSearch
              optionFilterProp="children"
              value={filter.maNCC}
              onChange={(v) => setFilter({ ...filter, maNCC: v })}
            >
              {listNhaCungCap.map((n) => (
                <Option
                  key={n.maNCC}
                  value={n.maNCC}
                >
                  {n.tenNCC}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={5}>
            <div style={{ fontWeight: 500 }}>Ngày lập</div>
            <RangePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              value={filter.dateRange}
              onChange={(d) => setFilter({ ...filter, dateRange: d })}
            />
          </Col>
          <Col
            span={3}
            style={{
              textAlign: "right",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "flex-end",
            }}
          >
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
              >
                Tìm
              </Button>
              <Button
                icon={<ClearOutlined />}
                onClick={handleResetFilter}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      <Space style={{ marginBottom: 16 }}>
        {/* Nút Tạo Mới (ID 20) */}
        {(isAdmin || checkPerm(PERM_CREATE)) && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenModal}
          >
            Tạo Phiếu Nhập
          </Button>
        )}
        <Button
          icon={<ReloadOutlined />}
          onClick={() =>
            fetchData(pagination.current, pagination.pageSize, filter)
          }
        >
          Tải lại
        </Button>
      </Space>

      <Table
        className="fixed-height-table"
        columns={columns}
        dataSource={listData}
        loading={loading}
        rowKey="maPhieuNhap"
        pagination={pagination}
        onChange={handleTableChange}
        scroll={{ x: "max-content" }}
      />

      {/* MODAL THÊM / SỬA */}
      <Modal
        title={editingRecord ? "Sửa Phiếu Nhập" : "Tạo Phiếu Nhập"}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
        width={1000}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Space wrap>
            <Form.Item
              name="maNCC"
              label="Nhà Cung Cấp"
              rules={[{ required: true }]}
            >
              <Select
                style={{ width: 250 }}
                showSearch
                optionFilterProp="children"
              >
                {listNhaCungCap.map((n) => (
                  <Option
                    key={n.maNCC}
                    value={n.maNCC}
                  >
                    {n.tenNCC}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="maKho"
              label="Kho Nhập"
              rules={[{ required: true }]}
            >
              <Select
                style={{ width: 200 }}
                showSearch
                optionFilterProp="children"
              >
                {listKho.map((k) => (
                  <Option
                    key={k.maKho}
                    value={k.maKho}
                  >
                    {k.tenKho}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="chungTu"
              label="Chứng từ"
              rules={[{ required: true }]}
            >
              <Input placeholder="PN-001" />
            </Form.Item>
          </Space>

          {/* Form List Chi Tiết */}
          <Row
            gutter={8}
            style={{
              background: "#f5f5f5",
              padding: "5px 0",
              textAlign: "center",
              fontWeight: "bold",
            }}
          >
            <Col span={10}>Sản phẩm</Col>
            <Col span={5}>Số lượng</Col>
            <Col span={6}>Đơn giá</Col>
            <Col span={2}>Xóa</Col>
          </Row>
          <Form.List name="chiTiet">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row
                    key={key}
                    gutter={8}
                    style={{ marginTop: 10 }}
                    align="middle"
                  >
                    <Col span={10}>
                      <Form.Item
                        {...restField}
                        name={[name, "maSP"]}
                        rules={[{ required: true }]}
                        style={{ marginBottom: 0 }}
                      >
                        <Select
                          showSearch
                          optionFilterProp="children"
                          style={{ width: "100%" }}
                          placeholder="Chọn SP"
                        >
                          {listSanPham.map((s) => (
                            <Option
                              key={s.maSP}
                              value={s.maSP}
                            >
                              {s.tenSP}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={5}>
                      <Form.Item
                        {...restField}
                        name={[name, "soLuong"]}
                        rules={[{ required: true }]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber
                          min={1}
                          style={{ width: "100%" }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        {...restField}
                        name={[name, "donGia"]}
                        rules={[{ required: true }]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber
                          min={0}
                          style={{ width: "100%" }}
                          formatter={(v) =>
                            `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                          }
                          parser={(v) => v.replace(/\$\s?|(,*)/g, "")}
                        />
                      </Form.Item>
                    </Col>
                    <Col
                      span={2}
                      style={{ textAlign: "center" }}
                    >
                      <MinusCircleOutlined
                        onClick={() => remove(name)}
                        style={{ color: "red", cursor: "pointer" }}
                      />
                    </Col>
                  </Row>
                ))}
                <Form.Item style={{ marginTop: 10 }}>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                  >
                    Thêm sản phẩm
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      {/* MODAL XÓA */}
      <Modal
        title="Xác nhận xóa"
        open={isDeleteModalOpen}
        onOk={handleDeleteConfirm}
        onCancel={() => setIsDeleteModalOpen(false)}
        okType="danger"
        okText="Xóa"
        cancelText="Hủy"
      >
        <p>Bạn có chắc muốn xóa phiếu nhập này?</p>
      </Modal>

      {/* MODAL CHI TIẾT */}
      <Modal
        title="Chi tiết Phiếu Nhập"
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={null}
        width={800}
      >
        {viewingPhieuNhap && (
          <div>
            <Descriptions
              bordered
              column={2}
            >
              <Descriptions.Item label="Mã Phiếu">
                {viewingPhieuNhap.maPhieuNhap}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày Lập">
                {dayjs(viewingPhieuNhap.ngayLapPhieu).format("DD/MM/YYYY")}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng Thái">
                {renderStatus(viewingPhieuNhap.trangThai)}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng Tiền">
                {Number(viewingPhieuNhap.tongTien).toLocaleString()} đ
              </Descriptions.Item>
              <Descriptions.Item label="NCC">
                {
                  listNhaCungCap.find((n) => n.maNCC === viewingPhieuNhap.maNCC)
                    ?.tenNCC
                }
              </Descriptions.Item>
              <Descriptions.Item label="Kho">
                {
                  listKho.find((k) => k.maKho === viewingPhieuNhap.maKho)
                    ?.tenKho
                }
              </Descriptions.Item>
            </Descriptions>
            <Divider orientation="left">Chi tiết sản phẩm</Divider>
            <Table
              dataSource={viewingPhieuNhap.chiTiet || []}
              pagination={false}
              rowKey="maSP"
              columns={[
                {
                  title: "Tên SP",
                  dataIndex: "maSP",
                  render: (id) =>
                    listSanPham.find((s) => s.maSP === id)?.tenSP || id,
                },
                { title: "SL", dataIndex: "soLuong" },
                {
                  title: "Đơn giá",
                  dataIndex: "donGia",
                  render: (v) => Number(v).toLocaleString(),
                },
                {
                  title: "Thành tiền",
                  render: (_, r) =>
                    Number(r.soLuong * r.donGia).toLocaleString(),
                },
              ]}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PhieuNhapPage;
