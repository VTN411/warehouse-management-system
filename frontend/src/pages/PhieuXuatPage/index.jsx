// src/pages/PhieuXuatPage/index.jsx

import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  message,
  InputNumber,
  Tag,
  Select,
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
import * as phieuXuatService from "../../services/phieuxuat.service";
import * as warehouseService from "../../services/warehouse.service";
import * as productService from "../../services/product.service";
import * as customerService from "../../services/customer.service";
import * as userService from "../../services/user.service";
import dayjs from "dayjs";

const { Option } = Select;
const { RangePicker } = DatePicker;

// ID Quyền
const PERM_CREATE = 23;
const PERM_EDIT = 24;
const PERM_DELETE = 25;
const PERM_APPROVE = 42;
const PERM_CANCEL = 43;
const PERM_EDIT_APPROVED = 121;
const PERM_VIEW = 27;

const PhieuXuatPage = () => {
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
    maKH: null,
    dateRange: null,
  });

  const [listKho, setListKho] = useState([]);
  const [listSanPham, setListSanPham] = useState([]);
  const [listKhachHang, setListKhachHang] = useState([]);
  const [listUser, setListUser] = useState([]);

  const [currentInventory, setCurrentInventory] = useState([]);
  const [selectedKho, setSelectedKho] = useState(null);

  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingPhieuXuat, setViewingPhieuXuat] = useState(null);

  const [permissions, setPermissions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLecturer, setIsLecturer] = useState(false);

  // [!] 1. STATE LƯU THÔNG TIN NGƯỜI DÙNG HIỆN TẠI
  const [currentUser, setCurrentUser] = useState(null);

  // Hàm tải dữ liệu
  const fetchData = useCallback(
    async (page = 1, pageSize = 5, currentFilter = {}) => {
      setLoading(true);
      try {
        const { chungTu, trangThai, maKho, maKH, dateRange } = currentFilter;

        const filterPayload = {
          page: page - 1,
          size: pageSize,
          chungTu: chungTu || null,
          trangThai: trangThai || null,
          maKho: maKho || null,
          maKH: maKH || null,
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
        if (hasFilter && phieuXuatService.filterPhieuXuat) {
          response = await phieuXuatService.filterPhieuXuat(filterPayload);
        } else {
          response = await phieuXuatService.getAllPhieuXuat();
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
        messageApi.error("Không thể tải danh sách phiếu xuất!");
      }
      setLoading(false);
    },
    [messageApi]
  );

  const fetchCommonData = useCallback(async () => {
    try {
      const [resKho, resSP, resKH, resUser] = await Promise.allSettled([
        warehouseService.getAllWarehouses(),
        productService.getAllProducts(),
        customerService.getAllCustomers(),
        userService.getAllUsers(),
      ]);

      if (resKho.status === "fulfilled") setListKho(resKho.value.data || []);
      if (resSP.status === "fulfilled") setListSanPham(resSP.value.data || []);
      if (resKH.status === "fulfilled")
        setListKhachHang(resKH.value.data || []);
      if (resUser.status === "fulfilled") setListUser(resUser.value.data || []);
    } catch (error) {
      console.error("Lỗi tải danh mục:", error);
    }
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user_info");
    if (storedUser) {
      try {
        let user = JSON.parse(storedUser);
        
        // Fix lỗi dữ liệu lồng (nếu có)
        if (user.quyen && !Array.isArray(user.quyen) && user.quyen.maNguoiDung) {
          user = user.quyen;
        }
        setCurrentUser(user);

        const roleName = (user.vaiTro || user.tenVaiTro || "").toUpperCase();
        setIsAdmin(roleName === "ADMIN");

        // Logic Role Giảng viên (để ẩn/hiện cột Khách hàng)
        if (roleName === "GIANG_VIEN") {
            setIsLecturer(true);
        } else {
            setIsLecturer(false);
        }

        // --- XỬ LÝ DANH SÁCH QUYỀN (QUAN TRỌNG) ---
        let rawPerms = user.dsQuyenSoHuu || user.quyen || [];
        
        // Đảm bảo rawPerms là mảng
        if (!Array.isArray(rawPerms)) rawPerms = [];

        // Chuẩn hóa quyền về dạng số nguyên (tránh lỗi string "27" != number 27)
        const parsedPerms = rawPerms.map(p => {
            // Nếu quyền là object (ví dụ {maQuyen: 27, tenQuyen: 'View'}), lấy id ra
            if (typeof p === 'object' && p !== null) return parseInt(p.maQuyen || p.id);
            // Nếu quyền là số hoặc chuỗi, ép kiểu về số
            return parseInt(p);
        });

        

        // --- CHECK QUYỀN 27 ĐỂ GỌI API ---
        const hasViewPerm = parsedPerms.includes(PERM_VIEW); // PERM_VIEW = 27

        // Chỉ gọi API nếu là Admin HOẶC có quyền 27 HOẶC là Giảng viên (xem của chính mình)
        if (roleName === "ADMIN" || hasViewPerm || roleName === "GIANG_VIEN") {
            fetchData(1, 5, filter);
        } else {
            // Nếu không có quyền thì tắt loading (để hiện thông báo lỗi ở dưới)
            setLoading(false);
        }
        
      } catch (e) {
        console.error("Lỗi parse user:", e);
        setPermissions([]);
      }
    }
    fetchCommonData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    fetchData(1, pagination.pageSize, filter);
  };
  const handleResetFilter = () => {
    const emptyFilter = {
      chungTu: "",
      trangThai: null,
      maKho: null,
      maKH: null,
      dateRange: null,
    };
    setFilter(emptyFilter);
    fetchData(1, 5, emptyFilter);
  };
  const handleTableChange = (newPagination) => {
    fetchData(newPagination.current, newPagination.pageSize, filter);
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

  const handleOpenModal = () => {
    setEditingRecord(null);
    setSelectedKho(null);
    setCurrentInventory([]);
    form.resetFields();
    setIsModalVisible(true);
    setIsDeleteModalOpen(false);
  };

  const handleKhoChange = async (khoId) => {
    setSelectedKho(khoId);
    form.setFieldsValue({ chiTiet: [] });
    try {
      const res = await warehouseService.getInventoryByWarehouse(khoId);
      setCurrentInventory(res.data || []);
      message.info("Đã cập nhật danh sách sản phẩm theo kho xuất");
    } catch (error) {
      setCurrentInventory([]);
    }
  };

  const handleEdit = async (record) => {
    if (record.trangThai === 2) {
      const createdDate = dayjs(record.ngayLapPhieu);
      const diffDays = dayjs().diff(createdDate, "day");
      if (diffDays > 30) {
        messageApi.error(`Quá hạn sửa (${diffDays} ngày).`);
        return;
      }
      if (!canEditApproved && !isAdmin) {
        messageApi.warning("Bạn không có quyền sửa phiếu đã duyệt!");
        return;
      }
    } else if (record.trangThai === 3) {
      messageApi.warning("Không thể sửa phiếu đã hủy.");
      return;
    }

    try {
      const response = await phieuXuatService.getPhieuXuatById(
        record.maPhieuXuat
      );
      const fullData = response.data;
      setEditingRecord(fullData);
      if (fullData.maKho) handleKhoChange(fullData.maKho);
      form.setFieldsValue(fullData);
      setIsModalVisible(true);
    } catch (error) {
      messageApi.error("Lỗi tải chi tiết phiếu!");
    }
  };

  const handleViewDetail = async (record) => {
    try {
      const response = await phieuXuatService.getPhieuXuatById(
        record.maPhieuXuat
      );
      setViewingPhieuXuat(response.data);
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
          if (editingRecord) {
            await phieuXuatService.updatePhieuXuat(
              editingRecord.maPhieuXuat,
              values
            );
            messageApi.success("Cập nhật phiếu xuất thành công!");
          } else {
            if (isLecturer) {
              await phieuXuatService.createPhieuXuatGiangVien(values);
            } else {
              await phieuXuatService.createPhieuXuat(values);
            }
            messageApi.success("Tạo thành công!");
          }
          setIsModalVisible(false);
          fetchData(pagination.current, pagination.pageSize, filter);
        } catch (error) {
          messageApi.error("Có lỗi xảy ra!");
        }
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  const handleDelete = (id) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };
  const handleDeleteConfirm = async () => {
    try {
      await phieuXuatService.deletePhieuXuat(deletingId);
      messageApi.success("Đã xóa!");
      fetchData(pagination.current, pagination.pageSize, filter);
    } catch (e) {
      messageApi.error("Lỗi xóa!");
    }
    setIsDeleteModalOpen(false);
  };
  const handleApprove = async (id) => {
    try {
      await phieuXuatService.approvePhieuXuat(id);
      messageApi.success("Đã duyệt!");
      fetchData(pagination.current, pagination.pageSize, filter);
    } catch (e) {
      messageApi.error("Lỗi duyệt!");
    }
  };
  const handleReject = async (id) => {
    try {
      await phieuXuatService.rejectPhieuXuat(id);
      messageApi.success("Đã hủy!");
      fetchData(pagination.current, pagination.pageSize, filter);
    } catch (e) {
      messageApi.error("Lỗi hủy!");
    }
  };

  const columns = [
    {
      title: "Ngày Lập",
      dataIndex: "ngayLapPhieu",
      width: "15%",
      render: (val) => dayjs(val).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Trạng Thái",
      dataIndex: "trangThai",
      width: "10%",
      render: renderStatus,
    },
    {
      title: "Tổng Tiền",
      dataIndex: "tongTien",
      width: "10%",
      render: (value) => `${Number(value || 0).toLocaleString()} đ`,
    },
    {
      title: "Khách Hàng",
      dataIndex: "maKH",
      width: "18%",
      render: (id, record) => {
        // Nếu KHÔNG PHẢI Giảng viên (Admin, Nhân viên, Thủ kho...) -> Xem tên khách hàng thật
        if (!isLecturer) {
           const kh = listKhachHang.find((item) => item.maKH === id);
           return kh ? kh.tenKH : (record.khachHang?.tenKH || `Mã: ${id}`);
        }

        // Nếu LÀ Giảng viên -> Xem tên mình
        if (isLecturer && currentUser) {
          return currentUser.hoTen;
        }

        return `Mã: ${id}`;
      },
    },
    {
      title: "Kho Xuất",
      dataIndex: "maKho",
      width: "15%",
      render: (maKho) =>
        listKho.find((k) => k.maKho === maKho)?.tenKho || `Mã: ${maKho}`,
    },
    {
      title: "Người Duyệt",
      dataIndex: "nguoiDuyet",
      width: "10%",
       render: (id) => getUserName(id),
    },
    {
      title: "Hành động",
      key: "action",
      width: "20%",
      render: (_, record) => {
        const isChoDuyet = record.trangThai === 1;
        const allowEdit = isEditable(record);

        return (
          <Space
            size="small"
            wrap={false}
            style={{ display: "flex", flexWrap: "nowrap" }}
          >
            <Button
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
              title="Xem"
            />
            {allowEdit && (
              <Button
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
                title="Sửa"
              />
            )}
            {isChoDuyet && canDelete && (
              <Button
                icon={<DeleteOutlined />}
                danger
                onClick={() => handleDelete(record.maPhieuXuat)}
                title="Xóa"
              />
            )}
            {isChoDuyet && canApprove && (
              <Button
                icon={<CheckCircleOutlined />}
                onClick={() => handleApprove(record.maPhieuXuat)}
                style={{ color: "green", borderColor: "green" }}
                title="Duyệt"
              />
            )}
            {isChoDuyet && canCancel && (
              <Button
                icon={<CloseCircleOutlined />}
                onClick={() => handleReject(record.maPhieuXuat)}
                danger
                title="Hủy"
              />
            )}
          </Space>
        );
      },
    },
  ];
const hasViewRight = isAdmin || permissions.includes(PERM_VIEW) || isLecturer;

  // Nếu không loading và không có quyền -> Chặn
  if (!loading && permissions.length > 0 && !hasViewRight) {
      return (
        <Card style={{ margin: 20, textAlign: "center" }}>
            <h2 style={{ color: "red" }}>Truy cập bị từ chối</h2>
            <p>Tài khoản của bạn chưa được cấp quyền xem danh sách phiếu xuất.</p>
            <p>Vui lòng liên hệ Admin để cấp quyền mã: <b>{PERM_VIEW}</b></p>
            {/* Debug: Hiển thị danh sách quyền hiện có để kiểm tra */}
            <small style={{color: 'gray'}}>Quyền hiện có: {permissions.join(', ')}</small>
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
            <div style={{ fontWeight: 500, marginBottom: 5 }}>Kho xuất</div>
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
            <div style={{ fontWeight: 500, marginBottom: 5 }}>Khách hàng</div>
            <Select
              style={{ width: "100%" }}
              placeholder="Chọn KH"
              allowClear
              value={filter.maKH}
              onChange={(v) => setFilter({ ...filter, maKH: v })}
            >
              {listKhachHang.map((k) => (
                <Option
                  key={k.maKH}
                  value={k.maKH}
                >
                  {k.tenKH}
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
            Tạo Phiếu Xuất
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
        rowKey="maPhieuXuat"
        pagination={pagination}
        onChange={handleTableChange}
        scroll={{ x: "max-content" }}
      />

      {/* Modal Form */}
      <Modal
        title={editingRecord ? "Sửa Phiếu Xuất" : "Tạo Phiếu Xuất"}
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
            {!isLecturer && (
              <Form.Item
                name="maKH"
                label="Khách Hàng"
                rules={[
                  { required: true, message: "Vui lòng chọn khách hàng!" },
                ]}
              >
                <Select
                  style={{ width: 200 }}
                  placeholder="Chọn Khách Hàng"
                  showSearch
                  optionFilterProp="children"
                >
                  {listKhachHang.map((kh) => (
                    <Option key={kh.maKH} value={kh.maKH}>
                      {kh.tenKH}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            )}
            <Form.Item
              name="maKho"
              label="Kho Xuất Hàng"
              rules={[{ required: true, message: "Vui lòng chọn kho!" }]}
            >
              <Select
                style={{ width: 200 }}
                placeholder="Chọn Kho"
                showSearch
                optionFilterProp="children"
                onChange={handleKhoChange}
              >
                {listKho.map((kho) => (
                  <Option
                    key={kho.maKho}
                    value={kho.maKho}
                  >
                    {kho.tenKho}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="chungTu"
              label="Chứng Từ"
              rules={[{ required: true, message: "Vui lòng nhập Chứng Từ " }]}            >
              <Input placeholder="VD: PX-001" />
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
                        rules={[{ required: true, message: "Chọn SP" }]}
                        style={{ marginBottom: 0 }}
                      >
                        <Select
                          style={{ width: 300 }}
                          placeholder={
                            selectedKho
                              ? "Chọn Sản phẩm"
                              : "Vui lòng chọn Kho Xuất"
                          }
                          showSearch
                          optionFilterProp="children"
                          disabled={!selectedKho}
                        >
                          {currentInventory.map((sp) => (
                            <Option
                              key={sp.maSP}
                              value={sp.maSP}
                            >
                              {sp.tenSP} (Tồn: {sp.soLuongTon})
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
                          { required: true, message: "" },
                          { type: "integer", min: 1, message: ">0" },
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              if (!value) return Promise.resolve();
                              const selectedSP = getFieldValue([
                                "chiTiet",
                                name,
                                "maSP",
                              ]);
                              const inStock = currentInventory.find(
                                (i) => i.maSP === selectedSP
                              );
                              if (inStock && value > inStock.soLuongTon)
                                return Promise.reject(
                                  new Error(
                                    `Không dủ hàng trong kho`
                                  )
                                );
                              return Promise.resolve();
                            },
                          }),
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
                        rules={[{ required: true, message: "" }]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber
                          placeholder="Giá"
                          min={0}
                          formatter={(v) =>
                            `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                          }
                          parser={(v) => v.replace(/\$\s?|(,*)/g, "")}
                          style={{ width: 150 }}
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
        onCancel={() => setIsDeleteModalOpen(false)}
        okText="Xóa"
        cancelText="Hủy"
        okType="danger"
      >
        <p>Bạn có chắc muốn xóa phiếu xuất này?</p>
      </Modal>

      <Modal
        title="Chi tiết Phiếu Xuất"
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
        {viewingPhieuXuat && (
          <div>
            <Descriptions
              bordered
              column={2}
            >
              <Descriptions.Item label="Mã Phiếu">
                {viewingPhieuXuat.maPhieuXuat}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày Lập">
                {viewingPhieuXuat.ngayLapPhieu}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng Thái">
                {renderStatus(viewingPhieuXuat.trangThai)}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng Tiền">
                {Number(viewingPhieuXuat.tongTien).toLocaleString()} đ
              </Descriptions.Item>
              <Descriptions.Item label="Khách Hàng">
                {/* [!] HIỂN THỊ TÊN KHÁCH HÀNG TRONG CHI TIẾT */}
                {listKhachHang.find((kh) => kh.maKH === viewingPhieuXuat.maKH)
                  ?.tenKH ||
                  viewingPhieuXuat.khachHang?.tenKH ||
                  (isLecturer ? currentUser?.hoTen : viewingPhieuXuat.maKH)}
              </Descriptions.Item>
              <Descriptions.Item label="Kho Xuất">
                {listKho.find((k) => k.maKho === viewingPhieuXuat.maKho)
                  ?.tenKho || viewingPhieuXuat.maKho}
              </Descriptions.Item>
              <Descriptions.Item label="Chứng Từ">
                {viewingPhieuXuat.chungTu}
              </Descriptions.Item>
              <Descriptions.Item label="Người Lập">
                {getUserName(viewingPhieuXuat.nguoiLap)}
              </Descriptions.Item>
              <Descriptions.Item label="Người Duyệt">
                {getUserName(viewingPhieuXuat.nguoiDuyet)}
              </Descriptions.Item>
            </Descriptions>
            <Divider
              orientation="left"
              style={{
                borderColor: "#52c41a",
                color: "#52c41a",
                fontSize: "16px",
              }}
            >
              CHI TIẾT XUẤT
            </Divider>
            <Table
              dataSource={viewingPhieuXuat.chiTiet || []}
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

export default PhieuXuatPage;
