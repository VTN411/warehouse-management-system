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
  Dropdown,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  MinusCircleOutlined,
  EditOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownOutlined,
} from "@ant-design/icons";
import * as phieuXuatService from "../../services/phieuxuat.service";
import * as warehouseService from "../../services/warehouse.service";
import * as productService from "../../services/product.service";
import * as customerService from "../../services/customer.service";

const { Option } = Select;

// [!] SỬA LẠI ID QUYỀN THÀNH SỐ (KHỚP VỚI CSDL)
const PERM_CREATE = 23;
const PERM_EDIT = 24;
const PERM_DELETE = 25;
const PERM_APPROVE = 42; // ID quyền Duyệt
const PERM_CANCEL = 43; // ID quyền Hủy

const PhieuXuatPage = () => {
  const [listData, setListData] = useState([]);
  const [displayedListData, setDisplayedListData] = useState([]);
  const [sortConfig, setSortConfig] = useState(null);
  const [filterConfig, setFilterConfig] = useState(null);

  const [listKho, setListKho] = useState([]);
  const [listSanPham, setListSanPham] = useState([]);
  const [listKhachHang, setListKhachHang] = useState([]);

  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await phieuXuatService.getAllPhieuXuat();
      setListData(response.data || []);
    } catch (error) {
      messageApi.error("Không thể tải danh sách phiếu xuất!");
    }
    setLoading(false);
  }, [messageApi]);

  const fetchCommonData = useCallback(async () => {
    try {
      const [resKho, resSP, resKH] = await Promise.all([
        warehouseService.getAllWarehouses(),
        productService.getAllProducts(),
        customerService.getAllCustomers(),
      ]);
      setListKho(resKho.data || []);
      setListSanPham(resSP.data || []);
      setListKhachHang(resKH.data || []);
    } catch (error) {
      console.error("Lỗi tải danh mục:", error);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchCommonData();

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

        const role = user.vaiTro || user.tenVaiTro || "";
        setIsAdmin(role === "ADMIN");

        // Lấy mảng ID quyền
        let perms = user.dsQuyenSoHuu || user.quyen;
        if (!Array.isArray(perms)) perms = [];
        setPermissions(perms);
      } catch (e) {
        setPermissions([]);
      }
    }
  }, [fetchData, fetchCommonData]);

  useEffect(() => {
    let data = [...listData];
    if (filterConfig && filterConfig.key === "status") {
      data = data.filter((item) => item.trangThai === filterConfig.value);
    }
    if (sortConfig) {
      data.sort((a, b) => {
        if (sortConfig.key === "date") {
          const dateA = new Date(a.ngayLapPhieu);
          const dateB = new Date(b.ngayLapPhieu);
          return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
        }
        if (sortConfig.key === "price") {
          return sortConfig.direction === "asc"
            ? a.tongTien - b.tongTien
            : b.tongTien - a.tongTien;
        }
        return 0;
      });
    }
    setDisplayedListData(data);
  }, [listData, sortConfig, filterConfig]);

  // Hàm kiểm tra quyền
  const checkPerm = (id) => isAdmin || permissions.includes(id);

  const canCreate = checkPerm(PERM_CREATE);
  const canEdit = checkPerm(PERM_EDIT);
  const canDelete = checkPerm(PERM_DELETE);
  const canApprove = checkPerm(PERM_APPROVE); // Check ID 42
  const canCancel = checkPerm(PERM_CANCEL); // Check ID 43

  // --- XỬ LÝ MODAL ---
  const handleOpenModal = () => {
    setEditingRecord(null);
    form.resetFields();
    setIsModalVisible(true);
    setIsDeleteModalOpen(false);
  };

  const handleEdit = async (record) => {
    if (record.trangThai === 2 || record.trangThai === 3) {
      messageApi.warning("Không thể sửa phiếu đã duyệt/hủy.");
      return;
    }

    try {
      const response = await phieuXuatService.getPhieuXuatById(
        record.maPhieuXuat
      );
      const fullData = response.data;
      setEditingRecord(fullData);
      form.setFieldsValue(fullData);
      setIsModalVisible(true);
    } catch (error) {
      messageApi.error("Lỗi tải chi tiết phiếu!");
    }
  };

  const handleOk = () => {
    form.validateFields().then(async (values) => {
      try {
        if (editingRecord) {
          await phieuXuatService.updatePhieuXuat(
            editingRecord.maPhieuXuat,
            values
          );
          messageApi.success("Cập nhật phiếu xuất thành công!");
        } else {
          await phieuXuatService.createPhieuXuat(values);
          messageApi.success("Tạo phiếu xuất thành công!");
        }
        setIsModalVisible(false);
        fetchData();
      } catch (error) {
        messageApi.error("Có lỗi xảy ra!");
      }
    });
  };

  const handleDelete = (id) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await phieuXuatService.deletePhieuXuat(deletingId);
      messageApi.success("Xóa phiếu xuất thành công!");
      fetchData();
    } catch (error) {
      messageApi.error("Lỗi khi xóa phiếu!");
    }
    setIsDeleteModalOpen(false);
    setDeletingId(null);
  };

  const handleApprove = async (id) => {
    try {
      await phieuXuatService.approvePhieuXuat(id);
      messageApi.success("Đã duyệt phiếu xuất!");
      fetchData();
    } catch (error) {
      messageApi.error("Lỗi khi duyệt!");
    }
  };

  const handleReject = async (id) => {
    try {
      await phieuXuatService.rejectPhieuXuat(id);
      messageApi.success("Đã hủy phiếu xuất!");
      fetchData();
    } catch (error) {
      messageApi.error("Lỗi khi hủy!");
    }
  };

  const sortMenu = {
    items: [
      {
        key: "filter",
        label: "Lọc theo Trạng Thái",
        children: [
          {
            key: "filter_1",
            label: "Chờ duyệt",
            onClick: () => setFilterConfig({ key: "status", value: 1 }),
          },
          {
            key: "filter_2",
            label: "Đã duyệt",
            onClick: () => setFilterConfig({ key: "status", value: 2 }),
          },
          {
            key: "filter_3",
            label: "Không duyệt",
            onClick: () => setFilterConfig({ key: "status", value: 3 }),
          },
        ],
      },
      {
        key: "sort_date",
        label: "Sắp xếp theo Ngày tháng",
        children: [
          {
            key: "date_asc",
            label: "Cũ đến mới",
            onClick: () => setSortConfig({ key: "date", direction: "asc" }),
          },
          {
            key: "date_desc",
            label: "Mới đến cũ",
            onClick: () => setSortConfig({ key: "date", direction: "desc" }),
          },
        ],
      },
      {
        key: "sort_price",
        label: "Sắp xếp theo Giá tiền",
        children: [
          {
            key: "price_asc",
            label: "Thấp đến cao",
            onClick: () => setSortConfig({ key: "price", direction: "asc" }),
          },
          {
            key: "price_desc",
            label: "Cao đến thấp",
            onClick: () => setSortConfig({ key: "price", direction: "desc" }),
          },
        ],
      },
      { type: "divider" },
      {
        key: "reset",
        label: "Reset (Bỏ lọc)",
        danger: true,
        onClick: () => {
          setFilterConfig(null);
          setSortConfig(null);
        },
      },
    ],
  };

  const columns = [
    {
      title: "Ngày Lập",
      dataIndex: "ngayLapPhieu",
      key: "ngayLapPhieu",
    },
    {
      title: "Trạng Thái",
      dataIndex: "trangThai",
      key: "trangThai",
      render: (status) => {
        if (status === 1) return <Tag color="orange">Chờ duyệt</Tag>;
        if (status === 2) return <Tag color="green">Đã duyệt</Tag>;
        if (status === 3) return <Tag color="red">Không duyệt</Tag>;
        return status;
      },
    },
    {
      title: "Tổng Tiền",
      dataIndex: "tongTien",
      key: "tongTien",
      render: (v) => `${v?.toLocaleString()} đ`,
    },
    {
      title: "Khách Hàng",
      dataIndex: "maKH",
      key: "maKH",
      render: (id) => {
        const kh = listKhachHang.find((item) => item.maKH === id);
        return kh ? kh.tenKH : `Mã: ${id}`;
      },
    },
    {
      title: "Kho Xuất",
      dataIndex: "maKho",
      key: "maKho",
      render: (maKho) => {
        const kho = listKho.find((k) => k.maKho === maKho);
        return kho ? kho.tenKho : `Mã: ${maKho}`;
      },
    },
    {
      title: "Người Duyệt",
      dataIndex: "tenNguoiDuyet",
      key: "tenNguoiDuyet",
      render: (text, record) =>
        text || (record.nguoiDuyet ? `ID: ${record.nguoiDuyet}` : "---"),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => {
        const isChoDuyet = record.trangThai === 1;
        return (
          <Space size="small" wrap>
            {/* NÚT SỬA/XÓA */}
            {isChoDuyet && canEdit && (
              <Button
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                Sửa
              </Button>
            )}
            {isChoDuyet && canDelete && (
              <Button
                icon={<DeleteOutlined />}
                danger
                onClick={() => handleDelete(record.maPhieuXuat)}
              >
                Xóa
              </Button>
            )}

            {/* NÚT DUYỆT/HỦY */}
            {isChoDuyet && canApprove && (
              <Button
                icon={<CheckCircleOutlined />}
                onClick={() => handleApprove(record.maPhieuXuat)}
                style={{ color: "green", borderColor: "green" }}
              >
                Duyệt
              </Button>
            )}
            {isChoDuyet && canCancel && (
              <Button
                icon={<CloseCircleOutlined />}
                onClick={() => handleReject(record.maPhieuXuat)}
                danger
              >
                Hủy
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      {contextHolder}
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
        <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
          Tải lại
        </Button>
        <Dropdown menu={sortMenu} trigger={["click"]}>
          <Button>
            Lọc / Sắp xếp <DownOutlined />
          </Button>
        </Dropdown>
      </Space>

      <Table
        className="fixed-height-table"
        columns={columns}
        dataSource={displayedListData}
        loading={loading}
        rowKey="maPhieuXuat"
        pagination={{ pageSize: 5 }}
      />

      {/* MODAL THÊM/SỬA */}
      <Modal
        title={editingRecord ? "Sửa Phiếu Xuất" : "Tạo Phiếu Xuất"}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
        width={1000}
      >
        <Form form={form} layout="vertical">
          <Space wrap>
            <Form.Item
              name="maKH"
              label="Khách Hàng"
              rules={[{ required: true, message: "Vui lòng chọn khách hàng!" }]}
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
              >
                {listKho.map((kho) => (
                  <Option key={kho.maKho} value={kho.maKho}>
                    {kho.tenKho}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="chungTu"
              label="Chứng Từ"
              rules={[{ required: true }]}
            >
              <Input placeholder="VD: PX-001" />
            </Form.Item>
          </Space>

          <h3>Chi tiết phiếu xuất</h3>
          <Form.List name="chiTiet">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space
                    key={key}
                    style={{ display: "flex", marginBottom: 8 }}
                    align="baseline"
                  >
                    <Form.Item
                      {...restField}
                      name={[name, "maSP"]}
                      rules={[{ required: true, message: "Nhập Mã SP" }]}
                    >
                      <Select
                        style={{ width: 200 }}
                        placeholder="Chọn SP"
                        showSearch
                        optionFilterProp="children"
                      >
                        {listSanPham.map((sp) => (
                          <Option key={sp.maSP} value={sp.maSP}>
                            {sp.tenSP}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "soLuong"]}
                      rules={[{ required: true, message: "Nhập SL" }]}
                    >
                      <InputNumber placeholder="Số lượng" min={1} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "donGia"]}
                      rules={[{ required: true, message: "Nhập Giá" }]}
                    >
                      <InputNumber
                        placeholder="Đơn giá"
                        min={0}
                        formatter={(value) =>
                          `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                        }
                        parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                        style={{ width: 150 }}
                      />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} />
                  </Space>
                ))}
                <Form.Item>
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
        okText="Xóa"
        cancelText="Hủy"
        okType="danger"
      >
        <p>Bạn có chắc muốn xóa phiếu xuất này?</p>
      </Modal>
    </div>
  );
};

export default PhieuXuatPage;
