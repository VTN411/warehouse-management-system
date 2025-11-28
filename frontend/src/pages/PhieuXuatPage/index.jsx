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
  Descriptions,
  Divider,
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
  EyeOutlined,
} from "@ant-design/icons";
import * as phieuXuatService from "../../services/phieuxuat.service";
import * as warehouseService from "../../services/warehouse.service";
import * as productService from "../../services/product.service";
import * as customerService from "../../services/customer.service";
import * as userService from "../../services/user.service";

const { Option } = Select;

// Định nghĩa tên quyền
const PERM_CREATE = 23;
const PERM_EDIT = 24;
const PERM_DELETE = 25;
const PERM_APPROVE = 42;
const PERM_CANCEL = 43;

const PhieuXuatPage = () => {
  const [listData, setListData] = useState([]);
  const [displayedListData, setDisplayedListData] = useState([]);
  const [sortConfig, setSortConfig] = useState(null);
  const [filterConfig, setFilterConfig] = useState(null);

  const [listKho, setListKho] = useState([]);
  const [listSanPham, setListSanPham] = useState([]); // Dùng để hiển thị tên ở bảng ngoài
  const [listKhachHang, setListKhachHang] = useState([]); 
  const [listUser, setListUser] = useState([]); 

  // [!] 1. STATE LƯU TỒN KHO CỦA KHO ĐANG CHỌN
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
      const [resKho, resSP, resKH, resUser] = await Promise.allSettled([
        warehouseService.getAllWarehouses(),
        productService.getAllProducts(),
        customerService.getAllCustomers(),
        userService.getAllUsers(),
      ]);
      
      if (resKho.status === 'fulfilled') setListKho(resKho.value.data || []);
      if (resSP.status === 'fulfilled') setListSanPham(resSP.value.data || []);
      if (resKH.status === 'fulfilled') setListKhachHang(resKH.value.data || []);
      if (resUser.status === 'fulfilled') setListUser(resUser.value.data || []);

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
        if (user.quyen && !Array.isArray(user.quyen) && user.quyen.maNguoiDung) {
             user = user.quyen;
        }
        const role = user.vaiTro || user.tenVaiTro || "";
        setIsAdmin(role === "ADMIN");
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
    if (filterConfig && filterConfig.key === 'status') {
      data = data.filter(item => item.trangThai === filterConfig.value);
    }
    if (sortConfig) {
      data.sort((a, b) => {
        if (sortConfig.key === 'date') {
          const dateA = new Date(a.ngayLapPhieu);
          const dateB = new Date(b.ngayLapPhieu);
          return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        }
        if (sortConfig.key === 'price') {
          const priceA = Number(a.tongTien) || 0;
          const priceB = Number(b.tongTien) || 0;
          return sortConfig.direction === 'asc' ? priceA - priceB : priceB - priceA;
        }
        return 0;
      });
    }
    setDisplayedListData(data);
  }, [listData, sortConfig, filterConfig]);

  const checkPerm = (id) => isAdmin || permissions.includes(id);
  const canCreate = checkPerm(PERM_CREATE);
  const canEdit = checkPerm(PERM_EDIT);
  const canDelete = checkPerm(PERM_DELETE);
  const canApprove = checkPerm(PERM_APPROVE);
  const canCancel = checkPerm(PERM_CANCEL);

  const getUserName = (userId) => {
    if (!userId) return "---";
    const user = listUser.find(u => u.maNguoiDung === userId);
    return user ? user.hoTen : `ID: ${userId}`;
  };

  const renderStatus = (status) => {
    if (status === 1) return <Tag color="orange">Chờ duyệt</Tag>;
    if (status === 2) return <Tag color="green">Đã duyệt</Tag>;
    if (status === 3) return <Tag color="red">Không duyệt</Tag>;
    return status;
  };

  // --- XỬ LÝ FORM ---

  const handleOpenModal = () => {
    setEditingRecord(null);
    setSelectedKho(null);
    setCurrentInventory([]); // Reset danh sách sản phẩm
    form.resetFields();
    setIsModalVisible(true);
    setIsDeleteModalOpen(false);
  };

  // [!] 2. HÀM XỬ LÝ KHI CHỌN KHO
  const handleKhoChange = async (khoId) => {
    setSelectedKho(khoId);
    
    // Xóa danh sách sản phẩm đã nhập để tránh lỗi không khớp kho
    form.setFieldsValue({ chiTiet: [] });

    try {
      // Gọi API lấy tồn kho của kho này
      const res = await warehouseService.getInventoryByWarehouse(khoId);
      setCurrentInventory(res.data || []);
      message.info("Đã cập nhật danh sách sản phẩm theo kho xuất");
    } catch (error) {
      console.error(error);
      message.warning("Không thể lấy tồn kho.");
      setCurrentInventory([]);
    }
  };

  const handleEdit = async (record) => {
    if (record.trangThai === 2 || record.trangThai === 3) {
      messageApi.warning("Không thể sửa phiếu đã duyệt/hủy.");
      return;
    }
    
    try {
      const response = await phieuXuatService.getPhieuXuatById(record.maPhieuXuat);
      const fullData = response.data;
      setEditingRecord(fullData);
      
      // [!] Load lại tồn kho của kho trong phiếu cũ
      if (fullData.maKho) {
          handleKhoChange(fullData.maKho);
      }

      form.setFieldsValue(fullData);
      setIsModalVisible(true);
    } catch (error) {
      messageApi.error("Lỗi tải chi tiết phiếu!");
    }
  };

  const handleViewDetail = async (record) => {
    try {
      const response = await phieuXuatService.getPhieuXuatById(record.maPhieuXuat);
      setViewingPhieuXuat(response.data);
      setIsDetailModalOpen(true);
    } catch (error) {
      messageApi.error("Lỗi khi tải chi tiết phiếu!");
    }
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
        key: 'filter',
        label: 'Lọc theo Trạng Thái',
        children: [
          { key: 'filter_1', label: 'Chờ duyệt', onClick: () => setFilterConfig({ key: 'status', value: 1 }) },
          { key: 'filter_2', label: 'Đã duyệt', onClick: () => setFilterConfig({ key: 'status', value: 2 }) },
          { key: 'filter_3', label: 'Không duyệt', onClick: () => setFilterConfig({ key: 'status', value: 3 }) },
        ]
      },
      {
        key: 'sort_date',
        label: 'Sắp xếp theo Ngày tháng',
        children: [
          { key: 'date_asc', label: 'Cũ đến mới', onClick: () => setSortConfig({ key: 'date', direction: 'asc' }) },
          { key: 'date_desc', label: 'Mới đến cũ', onClick: () => setSortConfig({ key: 'date', direction: 'desc' }) },
        ]
      },
      {
        key: 'sort_price',
        label: 'Sắp xếp theo Giá tiền',
        children: [
          { key: 'price_asc', label: 'Thấp đến cao', onClick: () => setSortConfig({ key: 'price', direction: 'asc' }) },
          { key: 'price_desc', label: 'Cao đến thấp', onClick: () => setSortConfig({ key: 'price', direction: 'desc' }) },
        ]
      },
      { type: 'divider' },
      {
        key: 'reset',
        label: 'Reset (Bỏ lọc)',
        danger: true,
        onClick: () => {
          setFilterConfig(null);
          setSortConfig(null);
        }
      }
    ]
  };

  const columns = [
    { 
      title: "Ngày Lập", 
      dataIndex: "ngayLapPhieu", 
      key: "ngayLapPhieu",
      width: "15%", 
    },
    { 
      title: "Trạng Thái", 
      dataIndex: "trangThai", 
      key: "trangThai",
      width: "10%", 
      render: renderStatus,
    },
    { 
      title: "Tổng Tiền", 
      dataIndex: "tongTien", 
      key: "tongTien", 
      width: "10%",
      render: (v) => `${Number(v || 0).toLocaleString()} đ` 
    },
    { 
      title: "Khách Hàng", 
      dataIndex: "maKH", 
      key: "maKH",
      width: "18%",
      render: (id) => {
        const kh = listKhachHang.find(item => item.maKH === id);
        return kh ? kh.tenKH : `Mã: ${id}`;
      }
    },
    { 
      title: "Kho Xuất", 
      dataIndex: "maKho", 
      key: "maKho",
      width: "15%",
      render: (maKho) => {
        const kho = listKho.find(k => k.maKho === maKho);
        return kho ? kho.tenKho : `Mã: ${maKho}`;
      }
    },
    { 
        title: "Người Duyệt", 
        dataIndex: "tenNguoiDuyet", 
        key: "tenNguoiDuyet",
        width: "10%",
        render: (text, record) => text || getUserName(record.nguoiDuyet)
    },
    {
      title: "Hành động",
      key: "action",
      width: "20%",
      render: (_, record) => {
        const isChoDuyet = record.trangThai === 1;
        return (
          <Space size="small" wrap={false} style={{ display: 'flex', flexWrap: 'nowrap' }}>
            <Button icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} title="Xem" />
            
            {isChoDuyet && canEdit && (
              <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
            )}
            {isChoDuyet && canDelete && (
              <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.maPhieuXuat)} />
            )}
            {isChoDuyet && canApprove && (
              <Button icon={<CheckCircleOutlined />} onClick={() => handleApprove(record.maPhieuXuat)} style={{ color: 'green', borderColor: 'green' }} />
            )}
            {isChoDuyet && canCancel && (
              <Button icon={<CloseCircleOutlined />} onClick={() => handleReject(record.maPhieuXuat)} danger />
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
        <Dropdown menu={sortMenu} trigger={['click']}>
          <Button>Lọc / Sắp xếp <DownOutlined /></Button>
        </Dropdown>
      </Space>

      <Table
        className="fixed-height-table"
        columns={columns}
        dataSource={displayedListData}
        loading={loading}
        rowKey="maPhieuXuat"
        pagination={{ pageSize: 5 }}
        scroll={{ x: 'max-content' }}
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
            <Form.Item name="maKH" label="Khách Hàng" rules={[{ required: true, message: "Vui lòng chọn!" }]}>
              <Select 
                style={{ width: 200 }} 
                placeholder="Chọn Khách Hàng" 
                showSearch
                optionFilterProp="children"
              >
                {listKhachHang.map(kh => (
                  <Option key={kh.maKH} value={kh.maKH}>{kh.tenKH}</Option>
                ))}
              </Select>
            </Form.Item>
            
            {/* [!] 3. GẮN HÀM onChange CHO KHO XUẤT */}
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
                onChange={handleKhoChange} // Khi đổi kho -> Load lại hàng tồn kho
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
                       
                       {/* [!] 4. DROPDOWN SẢN PHẨM (DÙNG currentInventory) */}
                       <Select 
                        style={{ width: 300 }} 
                        placeholder={selectedKho ? "Chọn Sản phẩm" : "Vui lòng chọn Kho Xuất"} 
                        showSearch 
                        optionFilterProp="children"
                        disabled={!selectedKho}
                      >
                        {currentInventory.map(sp => (
                          <Option key={sp.maSP} value={sp.maSP}>
                            {sp.tenSP} (Tồn: {sp.soLuongTon})
                          </Option>
                        ))}
                      </Select>
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

      {/* [!] MODAL XEM CHI TIẾT */}
      <Modal
        title="Chi tiết Phiếu Xuất"
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={[<Button key="close" onClick={() => setIsDetailModalOpen(false)}>Đóng</Button>]}
        width={900}
      >
        {viewingPhieuXuat && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Mã Phiếu">{viewingPhieuXuat.maPhieuXuat}</Descriptions.Item>
              <Descriptions.Item label="Ngày Lập">{viewingPhieuXuat.ngayLapPhieu}</Descriptions.Item>
              <Descriptions.Item label="Trạng Thái">{renderStatus(viewingPhieuXuat.trangThai)}</Descriptions.Item>
              <Descriptions.Item label="Tổng Tiền">{Number(viewingPhieuXuat.tongTien).toLocaleString()} đ</Descriptions.Item>
              <Descriptions.Item label="Khách Hàng">
                {listKhachHang.find(kh => kh.maKH === viewingPhieuXuat.maKH)?.tenKH || viewingPhieuXuat.maKH}
              </Descriptions.Item>
              <Descriptions.Item label="Kho Xuất">
                {listKho.find(k => k.maKho === viewingPhieuXuat.maKho)?.tenKho || viewingPhieuXuat.maKho}
              </Descriptions.Item>
              <Descriptions.Item label="Chứng Từ">{viewingPhieuXuat.chungTu}</Descriptions.Item>
              <Descriptions.Item label="Người Lập">{getUserName(viewingPhieuXuat.nguoiLap)}</Descriptions.Item>
              <Descriptions.Item label="Người Duyệt">{getUserName(viewingPhieuXuat.nguoiDuyet)}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Danh sách sản phẩm</Divider>

            <Table 
              dataSource={viewingPhieuXuat.chiTiet || []}
              rowKey="maSP"
              pagination={false}
              columns={[
                {
                  title: 'Sản Phẩm',
                  dataIndex: 'maSP',
                  key: 'maSP',
                  render: (id) => listSanPham.find(sp => sp.maSP === id)?.tenSP || `SP-${id}`
                },
                {
                  title: 'Số Lượng',
                  dataIndex: 'soLuong',
                  key: 'soLuong',
                },
                {
                  title: 'Đơn Giá',
                  dataIndex: 'donGia',
                  key: 'donGia',
                  render: (val) => `${Number(val).toLocaleString()} đ`
                },
                {
                  title: 'Thành Tiền',
                  key: 'thanhTien',
                  render: (_, r) => `${(r.soLuong * r.donGia).toLocaleString()} đ`
                }
              ]}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PhieuXuatPage;