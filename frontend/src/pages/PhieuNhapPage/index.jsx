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

// ID Quyền
const PERM_CREATE = 20;
const PERM_EDIT = 21;
const PERM_DELETE = 22;
const PERM_APPROVE = 40;
const PERM_CANCEL = 41;
const PERM_EDIT_APPROVED = 120;

const PhieuNhapPage = () => {
  const [phieuNhapList, setPhieuNhapList] = useState([]);

  // [!] 1. CẤU HÌNH PHÂN TRANG: 5 DÒNG
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
    showSizeChanger: true,
    pageSizeOptions: ["5", "10", "20", "50"],
  });

  const [filter, setFilter] = useState({
    chungTu: "",
    trangThai: null,
    maKho: null,
    maNCC: null,
    dateRange: null,
  });

  const [listNCC, setListNCC] = useState([]);
  const [listKho, setListKho] = useState([]);
  const [listSanPham, setListSanPham] = useState([]);
  const [listUser, setListUser] = useState([]);

  const [selectedNCC, setSelectedNCC] = useState(null);
  const [currentInventory, setCurrentInventory] = useState([]);
  const [selectedKho, setSelectedKho] = useState(null);

  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPhieuNhap, setEditingPhieuNhap] = useState(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingPhieuNhapId, setDeletingPhieuNhapId] = useState(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingPhieuNhap, setViewingPhieuNhap] = useState(null);

  const [permissions, setPermissions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // [!] 2. HÀM TẢI DỮ LIỆU (Đã fix logic phân trang)
  const fetchPhieuNhap = useCallback(
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

        // Kiểm tra xem có đang lọc không
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

        // Xử lý dữ liệu trả về
        if (data && Array.isArray(data.content)) {
          // Trường hợp 1: Backend trả về Page (Server-side Pagination)
          setPhieuNhapList(data.content);
          setPagination((prev) => ({
            ...prev,
            current: page,
            pageSize: pageSize,
            total: data.totalElements,
          }));
        } else if (Array.isArray(data)) {
          // Trường hợp 2: Backend trả về List (Client-side Pagination)
          // Tự cắt mảng để hiển thị đúng số lượng
          data.sort(
            (a, b) => new Date(b.ngayLapPhieu) - new Date(a.ngayLapPhieu)
          );
          const startIndex = (page - 1) * pageSize;
          const endIndex = startIndex + pageSize;
          const pageData = data.slice(startIndex, endIndex);

          setPhieuNhapList(pageData);
          setPagination((prev) => ({
            ...prev,
            current: page,
            pageSize: pageSize,
            total: data.length,
          }));
        } else {
          setPhieuNhapList([]);
          setPagination((prev) => ({ ...prev, total: 0 }));
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
      const [resNCC, resKho, resSP, resUser] = await Promise.allSettled([
        supplierService.getAllSuppliers(),
        warehouseService.getAllWarehouses(),
        productService.getAllProducts(),
        userService.getAllUsers(),
      ]);

      if (resNCC.status === "fulfilled") setListNCC(resNCC.value.data || []);
      if (resKho.status === "fulfilled") setListKho(resKho.value.data || []);
      if (resSP.status === "fulfilled") setListSanPham(resSP.value.data || []);
      if (resUser.status === "fulfilled") setListUser(resUser.value.data || []);
    } catch (error) {
      console.error("Lỗi tải danh mục:", error);
    }
  }, []);

  // [!] 3. KHỞI TẠO (Tắt cảnh báo missing dependency bằng comment)
  useEffect(() => {
    fetchPhieuNhap(1, 5, filter);
    fetchCommonData();

    try {
      const storedUser = localStorage.getItem("user_info");
      if (storedUser) {
        let user = JSON.parse(storedUser);
        if (
          user.quyen &&
          !Array.isArray(user.quyen) &&
          user.quyen.maNguoiDung
        ) {
          user = user.quyen;
        }
        const role = user.vaiTro || user.tenVaiTro || "";
        setIsAdmin(role.toUpperCase() === "ADMIN");
        let perms = user.dsQuyenSoHuu || user.quyen;
        setPermissions(Array.isArray(perms) ? perms : []);
      }
    } catch (e) {
      setPermissions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Các hàm xử lý tìm kiếm & Phân trang
  const handleSearch = () => {
    fetchPhieuNhap(1, pagination.pageSize, filter);
  };

  const handleResetFilter = () => {
    const emptyFilter = {
      chungTu: "",
      trangThai: null,
      maKho: null,
      maNCC: null,
      dateRange: null,
    };
    setFilter(emptyFilter);
    fetchPhieuNhap(1, 5, emptyFilter); // Reset về 5 dòng
  };

  // [!] Hàm chuyển trang quan trọng
  const handleTableChange = (newPagination) => {
    fetchPhieuNhap(newPagination.current, newPagination.pageSize, filter);
  };

  const checkPerm = (id) => isAdmin || permissions.includes(id);
  const canCreate = checkPerm(PERM_CREATE);
  const canEdit = checkPerm(PERM_EDIT);
  const canDelete = checkPerm(PERM_DELETE);
  const canApprove = checkPerm(PERM_APPROVE);
  const canCancel = checkPerm(PERM_CANCEL);
  const canEditApproved = checkPerm(PERM_EDIT_APPROVED);

  const getUserName = (userId) => {
    if (!userId) return "---";
    const user = listUser.find((u) => u.maNguoiDung === userId);
    return user ? user.hoTen : `ID: ${userId}`;
  };

  const renderStatus = (status) => {
    if (status === 1) return <Tag color="orange">Chờ duyệt</Tag>;
    if (status === 2) return <Tag color="green">Đã duyệt</Tag>;
    if (status === 3) return <Tag color="red">Không duyệt</Tag>;
    return status;
  };

  const isEditable = (record) => {
    if (isAdmin && record.trangThai !== 3) return true;
    if (record.trangThai === 1) return canEdit;
    if (record.trangThai === 2) return canEditApproved;
    return false;
  };

  // --- CÁC HÀM XỬ LÝ FORM ---
  const handleOpenModal = () => {
    setEditingPhieuNhap(null);
    setSelectedNCC(null);
    setSelectedKho(null);
    setCurrentInventory([]);
    form.resetFields();
    setIsModalVisible(true);
    setIsDeleteModalOpen(false);
  };

  const handleKhoChange = async (khoId) => {
    setSelectedKho(khoId);
    try {
      const res = await warehouseService.getInventoryByWarehouse(khoId);
      setCurrentInventory(res.data || []);
    } catch (error) {
      setCurrentInventory([]);
    }
  };

  const handleEdit = async (record) => {
    if (record.trangThai === 2) {
      const createdDate = dayjs(record.ngayLapPhieu);
      const diffDays = dayjs().diff(createdDate, "day");
      if (diffDays > 30) {
        messageApi.error(`Không thể sửa: Quá hạn 30 ngày.`);
        return;
      }
      if (!canEditApproved && !isAdmin) {
        messageApi.warning("Không có quyền sửa phiếu đã duyệt!");
        return;
      }
    } else if (record.trangThai === 3) {
      messageApi.warning("Không thể sửa phiếu đã hủy.");
      return;
    }

    try {
      const response = await phieuNhapService.getPhieuNhapById(
        record.maPhieuNhap
      );
      const fullData = response.data;
      setEditingPhieuNhap(fullData);
      setSelectedNCC(fullData.maNCC);
      if (fullData.maKho) handleKhoChange(fullData.maKho);
      form.setFieldsValue(fullData);
      setIsModalVisible(true);
    } catch (error) {
      messageApi.error("Lỗi tải chi tiết!");
    }
  };

  const handleViewDetail = async (record) => {
    try {
      const response = await phieuNhapService.getPhieuNhapById(
        record.maPhieuNhap
      );
      setViewingPhieuNhap(response.data);
      setIsDetailModalOpen(true);
    } catch (error) {
      messageApi.error("Lỗi khi tải chi tiết phiếu!");
    }
  };

  const handleOk = () => {
    form
      .validateFields()
      .then(async (values) => {
        try {
          if (editingPhieuNhap)
            await phieuNhapService.updatePhieuNhap(
              editingPhieuNhap.maPhieuNhap,
              values
            );
          else await phieuNhapService.createPhieuNhap(values);
          messageApi.success(
            editingPhieuNhap ? "Cập nhật thành công!" : "Tạo mới thành công!"
          );
          setIsModalVisible(false);
          fetchPhieuNhap(pagination.current, pagination.pageSize, filter);
        } catch (error) {
          messageApi.error("Có lỗi xảy ra!");
        }
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingPhieuNhap(null);
  };

  const handleDelete = (id) => {
    setDeletingPhieuNhapId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await phieuNhapService.deletePhieuNhap(deletingPhieuNhapId);
      messageApi.success("Đã xóa!");
      fetchPhieuNhap(pagination.current, pagination.pageSize, filter);
    } catch (e) {
      messageApi.error("Lỗi xóa!");
    }
    setIsDeleteModalOpen(false);
  };

  // [!] SỬA LỖI: Hàm này đã được dùng trong Modal Xóa
  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
  };

  const handleApprove = async (id) => {
    try {
      await phieuNhapService.approvePhieuNhap(id);
      messageApi.success("Đã duyệt!");
      fetchPhieuNhap(pagination.current, pagination.pageSize, filter);
    } catch (e) {
      messageApi.error("Lỗi duyệt!");
    }
  };

  const handleReject = async (id) => {
    try {
      await phieuNhapService.rejectPhieuNhap(id);
      messageApi.success("Đã hủy!");
      fetchPhieuNhap(pagination.current, pagination.pageSize, filter);
    } catch (e) {
      messageApi.error("Lỗi hủy!");
    }
  };

  const getStock = (spId) => {
    if (!selectedKho) return 0;
    const item = currentInventory.find((i) => i.maSP === spId);
    return item ? item.soLuongTon : 0;
  };

  const columns = [
    {
      title: "Ngày Lập",
      dataIndex: "ngayLapPhieu",
      width: 180,
      render: (val) => dayjs(val).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Trạng Thái",
      dataIndex: "trangThai",
      width: 150,
      render: renderStatus,
    },
    {
      title: "Nhà Cung Cấp",
      dataIndex: "maNCC",
      width: 250,
      render: (id) => listNCC.find((i) => i.maNCC === id)?.tenNCC || id,
    },
    {
      title: "Kho Nhập",
      dataIndex: "maKho",
      width: 150,
      render: (id) => listKho.find((i) => i.maKho === id)?.tenKho || id,
    },
    {
      title: "Người Duyệt",
      dataIndex: "nguoiDuyet",
      width: 150,
      render: (id) => getUserName(id),
    },
    {
      title: "Hành động",
      key: "action",
      width: 220,
      render: (_, record) => (
        <Space
          size="small"
          wrap={false}
        >
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
            title="Xem"
          />
          {isEditable(record) && (
            <Button
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              title="Sửa"
            />
          )}
          {record.trangThai === 1 && canDelete && (
            <Button
              icon={<DeleteOutlined />}
              danger
              onClick={() => handleDelete(record.maPhieuNhap)}
              title="Xóa"
            />
          )}
          {record.trangThai === 1 && canApprove && (
            <Button
              icon={<CheckCircleOutlined />}
              onClick={() => handleApprove(record.maPhieuNhap)}
              style={{ color: "green", borderColor: "green" }}
              title="Duyệt"
            />
          )}
          {record.trangThai === 1 && canCancel && (
            <Button
              icon={<CloseCircleOutlined />}
              onClick={() => handleReject(record.maPhieuNhap)}
              danger
              title="Hủy"
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      {contextHolder}

      {/* THANH TÌM KIẾM */}
      <Card
        style={{ marginBottom: 16 }}
        bodyStyle={{ padding: "16px" }}
      >
        <Row gutter={[16, 16]}>
          <Col span={4}>
            <div style={{ fontWeight: 500, marginBottom: 5 }}>Mã chứng từ</div>
            <Input
              placeholder="Nhập mã..."
              prefix={<SearchOutlined />}
              value={filter.chungTu}
              onChange={(e) =>
                setFilter({ ...filter, chungTu: e.target.value })
              }
            />
          </Col>
          <Col span={4}>
            <div style={{ fontWeight: 500, marginBottom: 5 }}>Trạng thái</div>
            <Select
              style={{ width: "100%" }}
              placeholder="Chọn trạng thái"
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
            <div style={{ fontWeight: 500, marginBottom: 5 }}>Kho nhập</div>
            <Select
              style={{ width: "100%" }}
              placeholder="Chọn kho"
              allowClear
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
            <div style={{ fontWeight: 500, marginBottom: 5 }}>Nhà cung cấp</div>
            <Select
              style={{ width: "100%" }}
              placeholder="Chọn NCC"
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
          <Col span={5}>
            <div style={{ fontWeight: 500, marginBottom: 5 }}>
              Ngày lập phiếu
            </div>
            <RangePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              placeholder={["Từ ngày", "Đến ngày"]}
              value={filter.dateRange}
              onChange={(dates) => setFilter({ ...filter, dateRange: dates })}
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
                title="Xóa lọc"
              />
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
            Tạo Phiếu Nhập
          </Button>
        )}
        <Button
          icon={<ReloadOutlined />}
          onClick={() =>
            fetchPhieuNhap(pagination.current, pagination.pageSize, filter)
          }
        >
          Tải lại
        </Button>
      </Space>

      <Table
        className="fixed-height-table"
        columns={columns}
        dataSource={phieuNhapList}
        loading={loading}
        rowKey="maPhieuNhap"
        pagination={pagination}
        onChange={handleTableChange}
        scroll={{ x: 1300 }}
      />

      {/* Modal Form */}
      <Modal
        title={editingPhieuNhap ? "Sửa Phiếu Nhập" : "Tạo Phiếu Nhập"}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={1000}
      >
        <Form
          form={form}
          layout="vertical"
          name="phieuNhapForm"
        >
          <Space wrap>
            <Form.Item
              name="maNCC"
              label="Nhà Cung Cấp"
              rules={[
                { required: true, message: "Vui lòng chọn Nhà Cung Cấp " },
              ]}
            >
              <Select
                style={{ width: 200 }}
                placeholder="Chọn NCC"
                onChange={(v) => {
                  setSelectedNCC(v);
                  form.setFieldsValue({ chiTiet: [] });
                }}
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
            </Form.Item>
            <Form.Item
              name="maKho"
              label="Kho Nhập"
              rules={[{ required: true, message: "Vui lòng chọn Kho " }]}
            >
              <Select
                style={{ width: 200 }}
                placeholder="Chọn Kho"
                onChange={handleKhoChange}
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
              rules={[{ required: true, message: "Vui lòng nhập chứng từ " }]}
            >
              <Input />
            </Form.Item>
          </Space>

          <Row
            gutter={8}
            style={{
              marginBottom: 5,
              fontWeight: "bold",
              textAlign: "center",
              background: "#f0f2f5",
              padding: "5px 0",
              borderRadius: "4px",
            }}
          >
            <Col
              span={10}
              style={{ textAlign: "left", paddingLeft: 15 }}
            >
              Sản phẩm
            </Col>
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
                    style={{ marginBottom: 10 }}
                    align="middle"
                  >
                    <Col span={10}>
                      <Form.Item
                        {...restField}
                        name={[name, "maSP"]}
                        rules={[
                          { required: true, message: "Vui lòng chọn Sản Phẩm" },
                        ]}
                        style={{ marginBottom: 0 }}
                      >
                        <Select
                          placeholder="Chọn SP"
                          disabled={!selectedNCC}
                          showSearch
                          optionFilterProp="children"
                        >
                          {listSanPham
                            .filter((sp) => {
                              // [!] Fix lỗi so sánh: Ép kiểu về String để an toàn
                              if (String(sp.maNCC) === String(selectedNCC))
                                return true;
                              if (
                                sp.danhSachNCC &&
                                Array.isArray(sp.danhSachNCC)
                              )
                                return sp.danhSachNCC.some(
                                  (n) => String(n.maNCC) === String(selectedNCC)
                                );
                              if (
                                sp.danhSachMaNCC &&
                                Array.isArray(sp.danhSachMaNCC)
                              )
                                return sp.danhSachMaNCC
                                  .map(String)
                                  .includes(String(selectedNCC));
                              return false;
                            })
                            .map((sp) => (
                              <Option
                                key={sp.maSP}
                                value={sp.maSP}
                              >
                                {sp.tenSP}{" "}
                                {selectedKho
                                  ? `(Tồn: ${getStock(sp.maSP)})`
                                  : ""}
                              </Option>
                            ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={5}>
                      <Form.Item
                        {...restField}
                        name={[name, "soLuong"]}
                        rules={[
                          { required: true, message: "Vui lòng nhập Số Lượng" },
                          { type: "integer", min: 1 },
                        ]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber
                          placeholder="SL"
                          min={1}
                          precision={0}
                          style={{ width: "100%" }}
                          onKeyPress={(e) =>
                            !/[0-9]/.test(e.key) && e.preventDefault()
                          }
                        />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        {...restField}
                        name={[name, "donGia"]}
                        rules={[
                          { required: true, message: "Vui lòng nhập Giá" },
                        ]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber
                          placeholder="Giá"
                          min={0}
                          formatter={(v) =>
                            `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                          }
                          parser={(v) => v.replace(/\$\s?|(,*)/g, "")}
                          style={{ width: "100%" }}
                          onKeyPress={(e) =>
                            !/[0-9]/.test(e.key) && e.preventDefault()
                          }
                        />
                      </Form.Item>
                    </Col>
                    <Col
                      span={2}
                      style={{ textAlign: "center" }}
                    >
                      <MinusCircleOutlined
                        onClick={() => remove(name)}
                        style={{
                          color: "red",
                          fontSize: "18px",
                          cursor: "pointer",
                        }}
                      />
                    </Col>
                  </Row>
                ))}
                <Form.Item style={{ marginTop: 16 }}>
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

      <Modal
        title="Xác nhận xóa"
        open={isDeleteModalOpen}
        onOk={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        okText="Xóa"
        cancelText="Hủy"
        okType="danger"
      >
        <p>Bạn có chắc muốn xóa phiếu này?</p>
      </Modal>
      <Modal
        title="Chi tiết Phiếu Nhập"
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={[
          <Button
            key="close"
            onClick={() => setIsDetailModalOpen(false)}
          >
            Đóng
          </Button>,
        ]}
        width={900}
      >
        {viewingPhieuNhap && (
          <div>
            <Descriptions
              bordered
              column={2}
            >
              <Descriptions.Item label="Mã">
                {viewingPhieuNhap.maPhieuNhap}
              </Descriptions.Item>
              <Descriptions.Item label="Chứng Từ">
                {viewingPhieuNhap.chungTu}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày">
                {dayjs(viewingPhieuNhap.ngayLapPhieu).format(
                  "DD/MM/YYYY HH:mm"
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng Thái">
                {renderStatus(viewingPhieuNhap.trangThai)}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng Tiền">
                {Number(viewingPhieuNhap.tongTien).toLocaleString()} đ
              </Descriptions.Item>
              <Descriptions.Item label="Nhà Cung Cấp">
                {listNCC.find((n) => n.maNCC === viewingPhieuNhap.maNCC)
                  ?.tenNCC || viewingPhieuNhap.maNCC}
              </Descriptions.Item>
              <Descriptions.Item label="Kho Nhập">
                {listKho.find((k) => k.maKho === viewingPhieuNhap.maKho)
                  ?.tenKho || viewingPhieuNhap.maKho}
              </Descriptions.Item>
            </Descriptions>
            <Divider
              orientation="left"
              style={{
                borderColor: "#1890ff",
                color: "#1890ff",
                fontSize: "16px",
              }}
            >
              CHI TIẾT NHẬP
            </Divider>
            <Table
              dataSource={viewingPhieuNhap.chiTiet || []}
              rowKey="maSP"
              pagination={false}
              bordered
              columns={[
                {
                  title: "Tên SP",
                  dataIndex: "maSP",
                  render: (id) =>
                    listSanPham.find((s) => s.maSP === id)?.tenSP || id,
                },
                { title: "SL", dataIndex: "soLuong", align: "center" },
                {
                  title: "Đơn Giá",
                  dataIndex: "donGia",
                  align: "right",
                  render: (v) => Number(v).toLocaleString() + " đ",
                },
                {
                  title: "Thành Tiền",
                  align: "right",
                  render: (_, r) =>
                    (r.soLuong * r.donGia).toLocaleString() + " đ",
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
