// src/pages/WarehousePage/index.jsx

import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  message,
  Tag,
  Card,
  Row,
  Col,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  EyeOutlined,
  SearchOutlined,
  RestOutlined, // Icon thùng rác
  UndoOutlined, // Icon khôi phục
  ArrowLeftOutlined, // Icon quay lại
} from "@ant-design/icons";
import * as warehouseService from "../../services/warehouse.service";

// Định nghĩa ID quyền
const PERM_KHO_CREATE = 71;
const PERM_KHO_EDIT = 72;
const PERM_KHO_DELETE = 73;

const WarehousePage = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);

  // State chế độ Thùng rác
  const [inTrashMode, setInTrashMode] = useState(false);

  // State cho Modal Thêm/Sửa
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);

  // State cho Modal Xóa
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // State cho Modal Chi tiết tồn kho
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [inventoryList, setInventoryList] = useState([]);
  const [currentWarehouseName, setCurrentWarehouseName] = useState("");

  const [keyword, setKeyword] = useState("");
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [permissions, setPermissions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // 1. HÀM LẤY DỮ LIỆU (Đã update logic Thùng rác)
  const fetchWarehouses = useCallback(
    async (searchKey = "") => {
      setLoading(true);
      try {
        let response;

        if (inTrashMode) {
          // A. Nếu đang ở THÙNG RÁC
          response = await warehouseService.getTrashWarehouses();
        } else {
          // B. Nếu đang ở DS CHÍNH (có hỗ trợ tìm kiếm)
          if (searchKey) {
            response = await warehouseService.searchWarehouses(searchKey);
          } else {
            response = await warehouseService.getAllWarehouses();
          }
        }

        // Xử lý dữ liệu trả về (mảng hoặc object chứa content)
        const data = Array.isArray(response.data)
          ? response.data
          : response.data?.content || [];
        setWarehouses(data);
      } catch (error) {
        console.error(error);
        messageApi.error("Không thể tải danh sách kho!");
      }
      setLoading(false);
    },
    [messageApi, inTrashMode] // Chạy lại khi chế độ Trash thay đổi
  );

  useEffect(() => {
    fetchWarehouses(keyword);
    // Lấy quyền
    try {
      const storedUser = localStorage.getItem("user_info");
      if (storedUser) {
        let user = JSON.parse(storedUser);
        if (user.quyen && !Array.isArray(user.quyen) && user.quyen.maNguoiDung)
          user = user.quyen;

        const role = user.vaiTro || user.tenVaiTro || "";
        setIsAdmin(role === "ADMIN");

        let perms = user.dsQuyenSoHuu || user.quyen;
        if (!Array.isArray(perms)) perms = [];
        setPermissions(perms);
      }
    } catch (e) {
      setPermissions([]);
    }
  }, [fetchWarehouses, keyword, inTrashMode]);

  const handleSearch = () => fetchWarehouses(keyword);
  const handleReset = () => {
    setKeyword("");
    fetchWarehouses("");
  };

  const canCreate = isAdmin || permissions.includes(PERM_KHO_CREATE);
  const canEdit = isAdmin || permissions.includes(PERM_KHO_EDIT);
  const canDelete = isAdmin || permissions.includes(PERM_KHO_DELETE);

  // --- HÀM KHÔI PHỤC (RESTORE) ---
  const handleRestore = async (record) => {
    try {
      await warehouseService.restoreWarehouse(record.maKho);
      messageApi.success("Khôi phục kho thành công!");
      fetchWarehouses(); // Load lại (kho sẽ biến mất khỏi thùng rác)
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data ||
        "Lỗi khôi phục!";
      messageApi.error(
        typeof errorMsg === "object" ? JSON.stringify(errorMsg) : errorMsg
      );
    }
  };

  // --- XỬ LÝ FORM THÊM/SỬA ---
  const handleOpenModal = () => {
    setEditingWarehouse(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingWarehouse(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form
      .validateFields()
      .then(async (values) => {
        // Logic kiểm tra trùng lặp tên/địa chỉ (Client side check)
        const cleanName = values.tenKho.trim().toLowerCase();
        const cleanAddress = (values.diaChi || "").trim().toLowerCase();
        const isDuplicate = warehouses.some((kho) => {
          if (editingWarehouse && kho.maKho === editingWarehouse.maKho)
            return false;
          const currentName = kho.tenKho.trim().toLowerCase();
          const currentAddress = (kho.diaChi || "").trim().toLowerCase();
          return currentName === cleanName && currentAddress === cleanAddress;
        });

        if (isDuplicate) {
          messageApi.error(
            `Kho "${values.tenKho}" tại địa chỉ này đã tồn tại!`
          );
          return;
        }

        try {
          if (editingWarehouse) {
            await warehouseService.updateWarehouse(
              editingWarehouse.maKho,
              values
            );
            messageApi.success("Cập nhật thành công!");
          } else {
            await warehouseService.createWarehouse(values);
            messageApi.success("Tạo kho mới thành công!");
          }
          setIsModalVisible(false);
          fetchWarehouses(keyword);
        } catch (error) {
          messageApi.error(error.response?.data?.message || "Có lỗi xảy ra!");
        }
      })
      .catch(() => {});
  };

  // --- XỬ LÝ XÓA (Soft Delete) ---
  const handleDelete = (id) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await warehouseService.deleteWarehouse(deletingId);
      messageApi.success("Đã chuyển vào thùng rác!");
      fetchWarehouses(keyword);
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data ||
        "Lỗi khi xóa kho!";
      messageApi.error(
        typeof errorMsg === "object" ? JSON.stringify(errorMsg) : errorMsg
      );
    }
    setIsDeleteModalOpen(false);
    setDeletingId(null);
  };

  // --- XEM CHI TIẾT ---
  const handleViewDetail = async (record) => {
    try {
      setCurrentWarehouseName(record.tenKho);
      const response = await warehouseService.getInventoryByWarehouse(
        record.maKho
      );
      setInventoryList(response.data || []);
      setIsDetailModalOpen(true);
    } catch (error) {
      messageApi.error("Lỗi tải dữ liệu tồn kho!");
    }
  };

  // --- CẤU HÌNH CỘT ---
  const columns = [
    { title: "Mã", dataIndex: "maKho", width: 60, align: "center" },
    {
      title: "Tên Kho",
      dataIndex: "tenKho",
      key: "tenKho",
      width: 200,
      render: (t) => <b>{t}</b>,
    },
    { title: "Địa Chỉ", dataIndex: "diaChi", key: "diaChi" },
    { title: "Ghi Chú", dataIndex: "ghiChu", key: "ghiChu" },
    {
      title: "Trạng thái",
      key: "status",
      width: 120,
      align: "center",
      render: () =>
        inTrashMode ? (
          <Tag color="red">Đã xóa</Tag>
        ) : (
          <Tag color="green">Hoạt động</Tag>
        ),
    },
    {
      title: "Hành động",
      key: "action",
      width: 180,
      align: "center",
      render: (_, record) => (
        <Space size="small">
          {inTrashMode ? (
            // 1. TRONG THÙNG RÁC -> CHỈ HIỆN NÚT KHÔI PHỤC
            <Tooltip title="Khôi phục kho này">
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
            // 2. DANH SÁCH CHÍNH -> HIỆN XEM/SỬA/XÓA
            <>
              <Tooltip title="Xem tồn kho">
                <Button
                  icon={<EyeOutlined />}
                  onClick={() => handleViewDetail(record)}
                />
              </Tooltip>

              {canEdit && (
                <Tooltip title="Sửa thông tin">
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(record)}
                  />
                </Tooltip>
              )}

              {canDelete && (
                <Tooltip title="Xóa tạm thời">
                  <Button
                    icon={<DeleteOutlined />}
                    danger
                    onClick={() => handleDelete(record.maKho)}
                  />
                </Tooltip>
              )}
            </>
          )}
        </Space>
      ),
    },
  ];

  const inventoryColumns = [
    { title: "Mã SP", dataIndex: "maSP", key: "maSP", width: 80 },
    { title: "Tên Sản Phẩm", dataIndex: "tenSP", key: "tenSP" },
    { title: "ĐVT", dataIndex: "donViTinh", key: "donViTinh", width: 80 },
    {
      title: "Số Lượng Tồn",
      dataIndex: "soLuongTon",
      key: "soLuongTon",
      render: (val) => <Tag color={val > 0 ? "blue" : "red"}>{val}</Tag>,
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
          {/* CỤM TRÁI: TÌM KIẾM HOẶC TIÊU ĐỀ */}
          <Col span={12}>
            {!inTrashMode ? (
              // Nếu ở trang chính -> Hiện ô tìm kiếm
              <Input
                placeholder="Tìm kiếm tên kho..."
                prefix={<SearchOutlined />}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onPressEnter={handleSearch}
                style={{ maxWidth: 300 }}
              />
            ) : (
              // Nếu ở thùng rác -> Hiện tiêu đề
              <h3 style={{ margin: 0, color: "#ff4d4f" }}>
                <RestOutlined /> Thùng rác (Kho hàng đã xóa)
              </h3>
            )}
          </Col>

          {/* CỤM PHẢI: CÁC NÚT CHỨC NĂNG */}
          <Col>
            <Space>
              {!inTrashMode && (
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={handleSearch}
                >
                  Tìm
                </Button>
              )}

              <Button
                icon={<ReloadOutlined />}
                onClick={handleReset}
              >
                Tải lại
              </Button>

              {/* NÚT CHUYỂN ĐỔI CHẾ ĐỘ */}
              {inTrashMode ? (
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => {
                    setInTrashMode(false);
                    setKeyword("");
                  }}
                >
                  Quay lại
                </Button>
              ) : (
                <>
                  <Button
                    icon={<RestOutlined />}
                    danger
                    onClick={() => {
                      setInTrashMode(true);
                      setKeyword("");
                    }}
                  >
                    Thùng rác
                  </Button>

                  {/* Nút thêm mới chỉ hiện ở trang chính */}
                  {canCreate && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleOpenModal}
                    >
                      Thêm Kho
                    </Button>
                  )}
                </>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      <Table
        className="fixed-height-table"
        columns={columns}
        dataSource={warehouses}
        loading={loading}
        rowKey="maKho"
        pagination={{ pageSize: 5 }}
      />

      {/* MODAL THÊM/SỬA */}
      <Modal
        title={editingWarehouse ? "Sửa Kho Hàng" : "Thêm Kho Hàng"}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="tenKho"
            label="Tên Kho"
            rules={[{ required: true }]}
          >
            <Input placeholder="Ví dụ: Kho Chính" />
          </Form.Item>
          <Form.Item
            name="diaChi"
            label="Địa Chỉ"
            rules={[{ required: true }]}
          >
            <Input placeholder="Ví dụ: 123 Đường ABC..." />
          </Form.Item>
          <Form.Item
            name="ghiChu"
            label="Ghi Chú"
          >
            <Input.TextArea rows={3} />
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
        <p>Bạn có chắc muốn xóa kho này không?</p>
        <p style={{ fontSize: 12, color: "#888" }}>
          Dữ liệu sẽ được chuyển vào thùng rác.
        </p>
      </Modal>

      {/* MODAL CHI TIẾT */}
      <Modal
        title={`Chi tiết tồn kho: ${currentWarehouseName}`}
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
        width={700}
      >
        <Table
          dataSource={inventoryList}
          columns={inventoryColumns}
          rowKey="maSP"
          pagination={{ pageSize: 5 }}
        />
      </Modal>
    </div>
  );
};

export default WarehousePage;
