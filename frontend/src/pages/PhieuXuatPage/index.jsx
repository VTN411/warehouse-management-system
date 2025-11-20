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
  Select, // [!] 1. IMPORT SELECT
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  MinusCircleOutlined,
  EditOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import * as phieuXuatService from "../../services/phieuxuat.service";
// [!] 2. IMPORT SERVICE KHO
import * as warehouseService from "../../services/warehouse.service"; 

const { Option } = Select;

// Định nghĩa tên quyền
const PERM_CREATE = "PERM_PHIEUXUAT_CREATE";
const PERM_EDIT = "PERM_PHIEUXUAT_EDIT";
const PERM_DELETE = "PERM_PHIEUXUAT_DELETE";
const PERM_APPROVE = "PERM_PHIEUXUAT_APPROVE";
const PERM_CANCEL = "PERM_PHIEUXUAT_CANCEL";

const PhieuXuatPage = () => {
  const [listData, setListData] = useState([]);
  // [!] 3. STATE LƯU DANH SÁCH KHO
  const [listKho, setListKho] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [permissions, setPermissions] = useState([]);

  // Hàm lấy dữ liệu phiếu xuất
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

  // [!] 4. HÀM LẤY DANH SÁCH KHO
  const fetchWarehouses = useCallback(async () => {
    try {
      const response = await warehouseService.getAllWarehouses();
      setListKho(response.data || []);
    } catch (error) {
      console.error("Lỗi tải danh sách kho:", error);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchWarehouses(); // [!] Gọi hàm lấy kho khi trang tải

    const storedUser = localStorage.getItem("user_info");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setPermissions(user.quyen || []);
    }
  }, [fetchData, fetchWarehouses]);

  const canCreate = permissions.includes(PERM_CREATE);
  const canEdit = permissions.includes(PERM_EDIT);
  const canDelete = permissions.includes(PERM_DELETE);
  const canApprove = permissions.includes(PERM_APPROVE);
  const canCancel = permissions.includes(PERM_CANCEL);

  // --- XỬ LÝ MODAL ---
  const handleOpenModal = () => {
    setEditingRecord(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    if (record.trangThai === 2 || record.trangThai === 3) {
      messageApi.warning("Không thể sửa phiếu đã duyệt/hủy.");
      return;
    }
    setEditingRecord(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form.validateFields().then(async (values) => {
      try {
        if (editingRecord) {
          await phieuXuatService.updatePhieuXuat(editingRecord.maPhieuXuat, values);
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

  // --- XỬ LÝ XÓA ---
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

  // --- DUYỆT / HỦY ---
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

  // --- CỘT BẢNG ---
  const columns = [
    { title: "Mã PX", dataIndex: "maPhieuXuat", key: "maPhieuXuat", width: 80 },
    { title: "Ngày Lập", dataIndex: "ngayLapPhieu", key: "ngayLapPhieu" },
    { 
      title: "Trạng Thái", 
      dataIndex: "trangThai", 
      key: "trangThai",
      render: (status) => {
        if (status === 1) return <Tag color="orange">Chờ duyệt</Tag>;
        if (status === 2) return <Tag color="green">Đã duyệt</Tag>;
        if (status === 3) return <Tag color="red">Không duyệt</Tag>;
        return status;
      }
    },
    { 
      title: "Tổng Tiền", 
      dataIndex: "tongTien", 
      key: "tongTien", 
      render: (v) => `${v?.toLocaleString()} đ` 
    },
    { title: "Mã KH", dataIndex: "maKH", key: "maKH" }, 
    // Hiển thị tên Kho nếu có thể (cần join bảng hoặc tra cứu từ listKho)
    { 
      title: "Kho Xuất", 
      dataIndex: "maKho", 
      key: "maKho",
      render: (maKho) => {
        const kho = listKho.find(k => k.maKho === maKho);
        return kho ? kho.tenKho : `Mã: ${maKho}`;
      }
    },
    { 
        title: "Người Duyệt", 
        dataIndex: "tenNguoiDuyet", 
        key: "tenNguoiDuyet",
        render: (text, record) => text || (record.nguoiDuyet ? `ID: ${record.nguoiDuyet}` : "---")
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => {
        const isChoDuyet = record.trangThai === 1;
        return (
          <Space size="small" wrap>
            {isChoDuyet && canEdit && (
              <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>Sửa</Button>
            )}
            {isChoDuyet && canDelete && (
              <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.maPhieuXuat)}>Xóa</Button>
            )}
            {isChoDuyet && canApprove && (
              <Button icon={<CheckCircleOutlined />} onClick={() => handleApprove(record.maPhieuXuat)} style={{ color: 'green', borderColor: 'green' }}>Duyệt</Button>
            )}
            {isChoDuyet && canCancel && (
              <Button icon={<CloseCircleOutlined />} onClick={() => handleReject(record.maPhieuXuat)} danger>Hủy</Button>
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
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal}>
            Tạo Phiếu Xuất
          </Button>
        )}
        <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
          Tải lại
        </Button>
      </Space>

      <Table
        className="fixed-height-table"
        columns={columns}
        dataSource={listData}
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
            <Form.Item name="maKH" label="Mã Khách Hàng" rules={[{ required: true }]}>
              <InputNumber style={{ width: 150 }} placeholder="Nhập ID KH" />
            </Form.Item>
            
            {/* [!] 5. THAY THẾ INPUTNUMBER BẰNG SELECT */}
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
                {listKho.map(kho => (
                  <Option key={kho.maKho} value={kho.maKho}>{kho.tenKho}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="chungTu" label="Chứng Từ" rules={[{ required: true }]}>
              <Input placeholder="VD: PX-001" />
            </Form.Item>
          </Space>

          <h3>Chi tiết phiếu xuất</h3>
          <Form.List name="chiTiet">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: "flex", marginBottom: 8 }} align="baseline">
                    <Form.Item {...restField} name={[name, "maSP"]} rules={[{ required: true, message: "Nhập Mã SP" }]}>
                      <InputNumber placeholder="Mã SP" />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, "soLuong"]} rules={[{ required: true, message: "Nhập SL" }]}>
                      <InputNumber placeholder="Số lượng" min={1} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, "donGia"]} rules={[{ required: true, message: "Nhập Giá" }]}>
                      <InputNumber 
                        placeholder="Đơn giá" 
                        min={0}
                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                        style={{ width: 150 }}
                      />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} />
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
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