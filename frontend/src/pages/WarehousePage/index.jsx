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
  ClearOutlined,
} from "@ant-design/icons";
import * as warehouseService from "../../services/warehouse.service";

// --- CẤU HÌNH ID QUYỀN (KHO HÀNG) ---
const PERM_VIEW = 70; // Xem danh sách
const PERM_CREATE = 71; // Tạo mới
const PERM_EDIT = 72; // Cập nhật
const PERM_DELETE = 73; // Xóa (kiêm Khôi phục / Vào thùng rác)

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

  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // State Quyền hạn
  const [permissions, setPermissions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // State bộ lọc tìm kiếm
  const [keyword, setKeyword] = useState("");

  // --- 1. TẢI DỮ LIỆU ---
  const fetchWarehouses = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      // Nếu có API thùng rác riêng thì gọi, tạm thời dùng logic lọc client
      res = await warehouseService.getAllWarehouses();

      let data = res.data;
      if (data.content) data = data.content; // Nếu trả về Page object

      if (Array.isArray(data)) {
        // Lọc Client-side theo chế độ Thùng rác
        let filtered = data.filter((item) => {
          // Giả sử logic: daXoa=1 hoặc trangThai=0 là đã xóa
          const isDeleted = item.daXoa === 1 || item.trangThai === 0;
          return inTrashMode ? isDeleted : !isDeleted;
        });

        // Lọc theo từ khóa tìm kiếm
        if (keyword) {
          filtered = filtered.filter(
            (item) =>
              item.tenKho.toLowerCase().includes(keyword.toLowerCase()) ||
              (item.diaChi &&
                item.diaChi.toLowerCase().includes(keyword.toLowerCase()))
          );
        }

        setWarehouses(filtered);
      } else {
        setWarehouses([]);
      }
    } catch (error) {
      messageApi.error("Không thể tải danh sách kho!");
    }
    setLoading(false);
  }, [inTrashMode, keyword, messageApi]);

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

        // Chuyển quyền về dạng số nguyên
        const parsedPerms = rawPerms.map((p) => {
          if (typeof p === "object" && p !== null)
            return parseInt(p.maQuyen || p.id);
          return parseInt(p);
        });

        // [!] LƯU QUYỀN VÀO STATE
        setPermissions(parsedPerms);

        // Check quyền Xem (ID 70)
        const hasViewPerm = parsedPerms.includes(PERM_VIEW);

        if (roleName === "ADMIN" || hasViewPerm) {
          fetchWarehouses();
        } else {
          setLoading(false);
        }
      } catch (e) {
        setPermissions([]);
      }
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Gọi lại khi đổi chế độ trash hoặc keyword, nhưng chỉ khi đã có quyền
    if (isAdmin || permissions.includes(PERM_VIEW)) {
      fetchWarehouses();
    }
  }, [fetchWarehouses, inTrashMode, isAdmin, permissions]);

  // Hàm check quyền nhanh
  const checkPerm = (id) => isAdmin || permissions.includes(id);

  // --- HANDLERS ---
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
        try {
          if (editingWarehouse) {
            await warehouseService.updateWarehouse(
              editingWarehouse.maKho,
              values
            );
            messageApi.success("Cập nhật kho thành công!");
          } else {
            await warehouseService.createWarehouse(values);
            messageApi.success("Tạo kho mới thành công!");
          }
          setIsModalVisible(false);
          fetchWarehouses();
        } catch (error) {
          messageApi.error("Có lỗi xảy ra!");
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
      await warehouseService.deleteWarehouse(deletingId);
      messageApi.success("Đã chuyển vào thùng rác!");
      fetchWarehouses();
    } catch (error) {
      messageApi.error("Không thể xóa (có thể do ràng buộc dữ liệu)!");
    }
    setIsDeleteModalOpen(false);
  };

  // Giả sử có hàm restore
  const handleRestore = async (id) => {
    try {
      // await warehouseService.restoreWarehouse(id);
      messageApi.info("Chức năng khôi phục đang phát triển (Backend)");
      // fetchWarehouses();
    } catch (e) {
      messageApi.error("Lỗi khôi phục");
    }
  };

  const handleViewInventory = async (record) => {
    try {
      const res = await warehouseService.getInventoryByWarehouse(record.maKho);
      setInventoryList(res.data || []);
      setCurrentWarehouseName(record.tenKho);
      setIsDetailModalOpen(true);
    } catch (error) {
      messageApi.error("Không thể tải tồn kho!");
    }
  };

  // --- CẤU HÌNH CỘT ---
  const columns = [
    {
      title: "Tên Kho",
      dataIndex: "tenKho",
      key: "tenKho",
      render: (t) => <b>{t}</b>,
    },
    { title: "Địa Chỉ", dataIndex: "diaChi", key: "diaChi" },
    { title: "Ghi Chú", dataIndex: "ghiChu", key: "ghiChu" },
    {
      title: "Trạng thái",
      align: "center",
      render: (_, record) =>
        inTrashMode ? (
          <Tag color="red">Đã xóa</Tag>
        ) : (
          <Tag color="green">Hoạt động</Tag>
        ),
    },
    {
      title: "Hành động",
      key: "action",
      width: 200,
      render: (_, record) => {
        // [CHECK QUYỀN]
        const allowEdit = checkPerm(PERM_EDIT); // 72
        const allowDelete = checkPerm(PERM_DELETE); // 73

        return (
          <Space size="small">
            {/* Nút Xem tồn kho: Ai có quyền xem danh sách (70) đều xem được */}
            <Tooltip title="Xem tồn kho">
              <Button
                icon={<EyeOutlined />}
                onClick={() => handleViewInventory(record)}
              />
            </Tooltip>

            {inTrashMode ? (
              // Thùng rác: Hiện Khôi Phục nếu có quyền Xóa (73)
              allowDelete && (
                <Tooltip title="Khôi phục (Quyền 73)">
                  <Button
                    type="primary"
                    ghost
                    icon={<UndoOutlined />}
                    onClick={() => handleRestore(record.maKho)}
                  >
                    Khôi phục
                  </Button>
                </Tooltip>
              )
            ) : (
              // Danh sách chính: Hiện Sửa (72) / Xóa (73)
              <>
                {allowEdit && (
                  <Tooltip title="Cập nhật (Quyền 72)">
                    <Button
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(record)}
                    />
                  </Tooltip>
                )}

                {allowDelete && (
                  <Tooltip title="Xóa (Quyền 73)">
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
        );
      },
    },
  ];

  // Chặn truy cập nếu không có quyền Xem (70)
  if (!loading && permissions.length > 0 && !checkPerm(PERM_VIEW)) {
    return (
      <Card style={{ margin: 20, textAlign: "center" }}>
        <h2 style={{ color: "red" }}>Truy cập bị từ chối</h2>
        <p>Bạn không có quyền xem danh sách Kho hàng.</p>
        <p>
          Liên hệ Admin cấp quyền mã: <b>{PERM_VIEW}</b>
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
        <Row
          justify="space-between"
          align="middle"
          gutter={[16, 16]}
        >
          <Col span={8}>
            <Input
              placeholder="Tìm tên kho hoặc địa chỉ..."
              prefix={<SearchOutlined />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchWarehouses}
              >
                Tải lại
              </Button>
              <Button
                icon={<ClearOutlined />}
                onClick={() => setKeyword("")}
              >
                Xóa tìm kiếm
              </Button>

              {/* Logic nút Thùng rác / Quay lại */}
              {inTrashMode ? (
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => setInTrashMode(false)}
                >
                  Quay lại danh sách
                </Button>
              ) : (
                <>
                  {/* Nút Thùng rác (Quyền 73 hoặc Admin) */}
                  {(isAdmin || checkPerm(PERM_DELETE)) && (
                    <Button
                      icon={<RestOutlined />}
                      danger
                      onClick={() => setInTrashMode(true)}
                    >
                      Thùng rác
                    </Button>
                  )}

                  {/* Nút Tạo Mới (Quyền 71) */}
                  {checkPerm(PERM_CREATE) && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleOpenModal}
                    >
                      Tạo Kho Mới
                    </Button>
                  )}
                </>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {inTrashMode && (
        <h3 style={{ color: "red", marginLeft: 10 }}>
          Đang xem: Kho hàng đã xóa
        </h3>
      )}

      <Table
        className="fixed-height-table"
        columns={columns}
        dataSource={warehouses}
        loading={loading}
        rowKey="maKho"
        pagination={{ pageSize: 5 }}
      />

      {/* Modal Thêm/Sửa */}
      <Modal
        title={editingWarehouse ? "Cập nhật Kho" : "Tạo Kho mới"}
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
            rules={[{ required: true, message: "Vui lòng nhập tên kho!" }]}
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
        <p>Bạn có chắc muốn xóa kho này không?</p>
        <p style={{ fontSize: 12, color: "#888" }}>
          Dữ liệu sẽ được chuyển vào thùng rác.
        </p>
      </Modal>

      {/* Modal Chi tiết tồn kho */}
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
          rowKey="maSP"
          pagination={{ pageSize: 5 }}
          columns={[
            { title: "Mã SP", dataIndex: "maSP" },
            { title: "Tên Sản Phẩm", dataIndex: "tenSP" },
            {
              title: "Số Lượng Tồn",
              dataIndex: "soLuongTon",
              align: "center",
              render: (v) => <Tag color="blue">{v}</Tag>,
            },
            { title: "Đơn Vị", dataIndex: "donViTinh" },
          ]}
        />
      </Modal>
    </div>
  );
};

export default WarehousePage;
