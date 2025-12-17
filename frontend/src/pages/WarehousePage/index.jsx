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
// Import service
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

  // --- 1. TẢI DỮ LIỆU (ĐÃ SỬA) ---
  const fetchWarehouses = useCallback(async () => {
    setLoading(true);
    try {
      let res;

      // [QUAN TRỌNG] Phân luồng gọi API
      if (inTrashMode) {
        // Gọi API thùng rác (đã có trong service bạn cung cấp)
        res = await warehouseService.getTrashWarehouses();
      } else {
        // Gọi API danh sách chính
        res = await warehouseService.getAllWarehouses();
      }

      let data = res.data ? res.data : res; // Xử lý tùy wrapper api trả về
      if (data && data.content) data = data.content;

      if (Array.isArray(data)) {
        // Chỉ lọc theo từ khóa tìm kiếm (bỏ lọc daXoa vì API đã trả về đúng loại rồi)
        let filtered = data;

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
      console.error(error);
      // messageApi.error("Không thể tải danh sách kho!");
      setWarehouses([]);
    }
    setLoading(false);
  }, [inTrashMode, keyword]);

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

        setPermissions(parsedPerms);
      } catch (e) {
        setPermissions([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Gọi lại API khi thay đổi chế độ hoặc keyword
  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

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
      fetchWarehouses(); // Reload để item biến mất khỏi list chính
    } catch (error) {
      messageApi.error("Không thể xóa (có thể do ràng buộc dữ liệu)!");
    }
    setIsDeleteModalOpen(false);
  };

  // [SỬA] Kích hoạt chức năng khôi phục
  const handleRestore = async (id) => {
    try {
      await warehouseService.restoreWarehouse(id);
      messageApi.success("Đã khôi phục kho!");
      fetchWarehouses(); // Reload để item biến mất khỏi thùng rác
    } catch (e) {
      messageApi.error("Lỗi khôi phục");
    }
  };

  const handleViewInventory = async (record) => {
    try {
      const res = await warehouseService.getInventoryByWarehouse(record.maKho);
      setInventoryList(res.data || res || []);
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
          title: "Trạng thái",
          align: "center",
          width: 120,
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
      width: 200,
      render: (_, record) => {
        const allowEdit = checkPerm(PERM_EDIT); // 72
        const allowDelete = checkPerm(PERM_DELETE); // 73

        return (
          <Space size="small">
            <Tooltip title="Xem tồn kho">
              <Button
                icon={<EyeOutlined />}
                onClick={() => handleViewInventory(record)}
              />
            </Tooltip>

            {inTrashMode ? (
              // Thùng rác: Hiện Khôi Phục nếu có quyền Xóa (73)
              allowDelete && (
                <Tooltip title="Khôi phục ">
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
              // Danh sách chính: Hiện Sửa / Xóa
              <>
                {allowEdit && (
                  <Tooltip title="Cập nhật ">
                    <Button
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(record)}
                    />
                  </Tooltip>
                )}

                {allowDelete && (
                  <Tooltip title="Xóa ">
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
                  {(isAdmin || checkPerm(PERM_DELETE)) && (
                    <Button
                      icon={<RestOutlined />}
                      danger
                      onClick={() => setInTrashMode(true)}
                    >
                      Thùng rác
                    </Button>
                  )}

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
          Thùng rác kho hàng
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
      </Modal>

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
