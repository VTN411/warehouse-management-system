// src/pages/TransferPage/index.jsx

import React, { useState, useEffect, useCallback } from "react";
import {
  Table, Button, Modal, Form, Input, Space, message, Select, InputNumber, Tag, Descriptions, Divider
} from "antd";
import {
  PlusOutlined, DeleteOutlined, ReloadOutlined,
  CheckCircleOutlined, CloseCircleOutlined, EyeOutlined, MinusCircleOutlined
} from "@ant-design/icons";
import * as transferService from "../../services/transfer.service";
import * as warehouseService from "../../services/warehouse.service";
import * as productService from "../../services/product.service";
import * as userService from "../../services/user.service";

const { Option } = Select;

// [!] ID QUYỀN (SỐ)
const PERM_CREATE = 111;
const PERM_APPROVE = 112;
const PERM_CANCEL = 113;
// (PERM_VIEW = 110 dùng để check truy cập)

const TransferPage = () => {
  const [listData, setListData] = useState([]);
  const [listKho, setListKho] = useState([]);
  const [listSanPham, setListSanPham] = useState([]);
  const [listUser, setListUser] = useState([]);

  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState(null);

  const [permissions, setPermissions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await transferService.getAllTransfers();
      setListData(response.data || []);
    } catch (error) {
      messageApi.error("Không thể tải danh sách phiếu điều chuyển!");
    }
    setLoading(false);
  }, [messageApi]);

  const fetchCommonData = useCallback(async () => {
    try {
      const [resKho, resSP, resUser] = await Promise.allSettled([
        warehouseService.getAllWarehouses(),
        productService.getAllProducts(),
        userService.getAllUsers(),
      ]);
      if (resKho.status === 'fulfilled') setListKho(resKho.value.data || []);
      if (resSP.status === 'fulfilled') setListSanPham(resSP.value.data || []);
      if (resUser.status === 'fulfilled') setListUser(resUser.value.data || []);
    } catch (error) { console.error(error); }
  }, []);

  // [!] LOGIC LẤY QUYỀN CHUẨN
  useEffect(() => {
    fetchData();
    fetchCommonData();
    try {
      const storedUser = localStorage.getItem("user_info");
      if (storedUser) {
        let user = JSON.parse(storedUser);
        // Fix lỗi lồng
        if (user.quyen && !Array.isArray(user.quyen) && user.quyen.maNguoiDung) user = user.quyen;
        
        const role = user.vaiTro || user.tenVaiTro || "";
        setIsAdmin(role.toUpperCase() === "ADMIN");
        
        let perms = user.dsQuyenSoHuu || user.quyen;
        if (!Array.isArray(perms)) perms = [];
        setPermissions(perms);
      }
    } catch (e) { setPermissions([]); }
  }, [fetchData, fetchCommonData]);

  const checkPerm = (id) => isAdmin || permissions.includes(id);
  const canCreate = checkPerm(PERM_CREATE);
  const canApprove = checkPerm(PERM_APPROVE);
  const canCancel = checkPerm(PERM_CANCEL);

  // Helper
  const getUserName = (id) => listUser.find(u => u.maNguoiDung === id)?.hoTen || `ID: ${id}`;
  const getKhoName = (id) => listKho.find(k => k.maKho === id)?.tenKho || `Mã: ${id}`;
  const getSPName = (id) => listSanPham.find(sp => sp.maSP === id)?.tenSP || `SP-${id}`;

  const renderStatus = (status) => {
    if (status === 1) return <Tag color="orange">Chờ duyệt</Tag>;
    if (status === 2) return <Tag color="green">Đã duyệt</Tag>;
    if (status === 3) return <Tag color="red">Đã hủy</Tag>;
    return status;
  };

  const handleOpenModal = () => { form.resetFields(); setIsModalVisible(true); };
  
  const handleOk = () => {
    form.validateFields().then(async (values) => {
      if (values.maKhoXuat === values.maKhoNhap) {
        messageApi.error("Kho xuất và Kho nhập không được trùng nhau!");
        return;
      }
      try {
        await transferService.createTransfer(values);
        messageApi.success("Tạo phiếu điều chuyển thành công!");
        setIsModalVisible(false);
        fetchData();
      } catch (error) { messageApi.error("Lỗi khi tạo phiếu!"); }
    });
  };

  const handleViewDetail = async (record) => {
    try {
      const response = await transferService.getTransferById(record.maPhieuDC);
      setViewingRecord(response.data);
      setIsDetailModalOpen(true);
    } catch (error) { messageApi.error("Lỗi tải chi tiết!"); }
  };

  const handleApprove = async (id) => {
    try { await transferService.approveTransfer(id); messageApi.success("Đã duyệt!"); fetchData(); } 
    catch (e) { messageApi.error("Lỗi khi duyệt!"); }
  };
  const handleReject = async (id) => {
    try { await transferService.rejectTransfer(id); messageApi.success("Đã hủy!"); fetchData(); } 
    catch (e) { messageApi.error("Lỗi khi hủy!"); }
  };
  const handleDelete = (id) => { setDeletingId(id); setIsDeleteModalOpen(true); };
  const handleDeleteConfirm = async () => {
    try { await transferService.deleteTransfer(deletingId); messageApi.success("Đã xóa!"); fetchData(); } 
    catch (e) { messageApi.error("Lỗi xóa!"); }
    setIsDeleteModalOpen(false);
  };

  const columns = [
    { title: "Mã Phiếu", dataIndex: "maPhieuDC", width: 80 },
    { title: "Ngày Chuyển", dataIndex: "ngayChuyen", width: 150 },
    { title: "Trạng Thái", dataIndex: "trangThai", width: 120, render: renderStatus },
    { title: "Kho Xuất", dataIndex: "maKhoXuat", width: 150, render: getKhoName },
    { title: "Kho Nhập", dataIndex: "maKhoNhap", width: 150, render: getKhoName },
    { title: "Người Lập", dataIndex: "nguoiLap", width: 150, render: getUserName },
    { 
      title: "Hành động", key: "action", width: 180,
      render: (_, record) => {
        const isPending = record.trangThai === 1;
        return (
          <Space size="small" wrap={false}>
            <Button icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} title="Xem" />
            
            {isPending && canApprove && <Button icon={<CheckCircleOutlined />} onClick={() => handleApprove(record.maPhieuDC)} style={{ color: 'green', borderColor: 'green' }} />}
            {isPending && canCancel && <Button icon={<CloseCircleOutlined />} onClick={() => handleReject(record.maPhieuDC)} danger />}
            {/* Chỉ Admin mới xóa được phiếu điều chuyển */}
            {isPending && isAdmin && <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.maPhieuDC)} />}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      {contextHolder}
      <Space style={{ marginBottom: 16 }}>
        {canCreate && <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal}>Tạo Phiếu Điều Chuyển</Button>}
        <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>Tải lại</Button>
      </Space>

      <Table className="fixed-height-table" columns={columns} dataSource={listData} loading={loading} rowKey="maPhieuDC" pagination={{ pageSize: 5 }} scroll={{ x: 'max-content' }} />

      {/* Modal Tạo */}
      <Modal title="Tạo Phiếu Điều Chuyển" open={isModalVisible} onOk={handleOk} onCancel={() => setIsModalVisible(false)} width={900}>
        <Form form={form} layout="vertical">
          <Space style={{ display: 'flex', width: '100%' }} align="start">
            <Form.Item name="maKhoXuat" label="Kho Xuất" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select placeholder="Chọn kho xuất">
                {listKho.map(k => <Option key={k.maKho} value={k.maKho}>{k.tenKho}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="maKhoNhap" label="Kho Nhập" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select placeholder="Chọn kho nhập">
                {listKho.map(k => <Option key={k.maKho} value={k.maKho}>{k.tenKho}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="chungTu" label="Chứng từ" rules={[{ required: true }]}>
              <Input placeholder="DC-001" />
            </Form.Item>
          </Space>
          <Form.Item name="ghiChu" label="Ghi chú"><Input.TextArea rows={2}/></Form.Item>
          <h3>Danh sách hàng hóa</h3>
          <Form.List name="chiTiet">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: "flex", marginBottom: 8 }} align="baseline">
                    <Form.Item {...restField} name={[name, "maSP"]} rules={[{ required: true, message: "Chọn SP" }]}>
                       <Select style={{ width: 300 }} placeholder="Chọn Sản phẩm" showSearch optionFilterProp="children">
                        {listSanPham.map(sp => <Option key={sp.maSP} value={sp.maSP}>{sp.tenSP} (Tồn: {sp.soLuongTon})</Option>)}
                      </Select>
                    </Form.Item>
                    <Form.Item {...restField} name={[name, "soLuong"]} rules={[{ required: true, message: "Nhập SL" }]}>
                      <InputNumber placeholder="Số lượng" min={1} />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} />
                  </Space>
                ))}
                <Form.Item><Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Thêm sản phẩm</Button></Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      {/* Modal Chi Tiết */}
      <Modal title="Chi tiết Điều Chuyển" open={isDetailModalOpen} onCancel={() => setIsDetailModalOpen(false)} footer={[<Button key="close" onClick={() => setIsDetailModalOpen(false)}>Đóng</Button>]} width={800}>
        {viewingRecord && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Mã Phiếu">{viewingRecord.maPhieuDC}</Descriptions.Item>
              <Descriptions.Item label="Ngày Chuyển">{viewingRecord.ngayChuyen}</Descriptions.Item>
              <Descriptions.Item label="Kho Xuất">{getKhoName(viewingRecord.maKhoXuat)}</Descriptions.Item>
              <Descriptions.Item label="Kho Nhập">{getKhoName(viewingRecord.maKhoNhap)}</Descriptions.Item>
              <Descriptions.Item label="Trạng Thái">{renderStatus(viewingRecord.trangThai)}</Descriptions.Item>
              <Descriptions.Item label="Người Lập">{getUserName(viewingRecord.nguoiLap)}</Descriptions.Item>
              <Descriptions.Item label="Ghi Chú" span={2}>{viewingRecord.ghiChu}</Descriptions.Item>
              <Descriptions.Item label="Chứng Từ" span={2}>{viewingRecord.chungTu}</Descriptions.Item>
            </Descriptions>
            <Divider orientation="left">Hàng hóa</Divider>
            <Table dataSource={viewingRecord.chiTiet || []} rowKey="maSP" pagination={false} columns={[
                { title: 'Sản Phẩm', dataIndex: 'maSP', render: (id) => getSPName(id) },
                { title: 'Số Lượng', dataIndex: 'soLuong' }
            ]}/>
          </div>
        )}
      </Modal>

      {/* Modal Xóa */}
      <Modal title="Xác nhận xóa" open={isDeleteModalOpen} onOk={handleDeleteConfirm} onCancel={() => setIsDeleteModalOpen(false)} okText="Xóa" cancelText="Hủy" okType="danger">
        <p>Bạn có chắc muốn xóa phiếu này không?</p>
      </Modal>
    </div>
  );
};

export default TransferPage;