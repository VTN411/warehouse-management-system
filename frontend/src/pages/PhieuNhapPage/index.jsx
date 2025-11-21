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
import * as phieuNhapService from "../../services/phieunhap.service";
import * as warehouseService from "../../services/warehouse.service";
import * as supplierService from "../../services/supplier.service";
import * as productService from "../../services/product.service";

const { Option } = Select;

const PERM_CREATE = 20;
const PERM_EDIT = 21;
const PERM_DELETE = 22;
const PERM_APPROVE = 40;
const PERM_CANCEL = 41;

const PhieuNhapPage = () => {
  const [phieuNhapList, setPhieuNhapList] = useState([]);
  const [displayedPhieuNhapList, setDisplayedPhieuNhapList] = useState([]);
  const [sortConfig, setSortConfig] = useState(null);
  const [filterConfig, setFilterConfig] = useState(null);

  const [listNCC, setListNCC] = useState([]);
  const [listKho, setListKho] = useState([]);
  const [listSanPham, setListSanPham] = useState([]);

  const [selectedNCC, setSelectedNCC] = useState(null);

  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingPhieuNhapId, setDeletingPhieuNhapId] = useState(null);
  const [editingPhieuNhap, setEditingPhieuNhap] = useState(null);
  
  const [permissions, setPermissions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchPhieuNhap = useCallback(async () => {
    setLoading(true);
    try {
      const response = await phieuNhapService.getAllPhieuNhap();
      setPhieuNhapList(response.data || []);
    } catch (error) {
      messageApi.error("Không thể tải danh sách phiếu nhập!");
    }
    setLoading(false);
  }, [messageApi]);

  const fetchCommonData = useCallback(async () => {
    try {
      const [resNCC, resKho, resSP] = await Promise.all([
        supplierService.getAllSuppliers(),
        warehouseService.getAllWarehouses(),
        productService.getAllProducts(),
      ]);
      setListNCC(resNCC.data || []);
      setListKho(resKho.data || []);
      setListSanPham(resSP.data || []);
    } catch (error) {
      console.error("Lỗi tải danh mục:", error);
    }
  }, []);

  useEffect(() => {
    fetchPhieuNhap();
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
  }, [fetchPhieuNhap, fetchCommonData]);

  useEffect(() => {
    let data = [...phieuNhapList]; // (Hoặc listData nếu ở trang Xuất)
    
    // 1. Lọc
    if (filterConfig && filterConfig.key === 'status') {
      data = data.filter(item => item.trangThai === filterConfig.value);
    }
    
    // 2. Sắp xếp
    if (sortConfig) {
      data.sort((a, b) => {
        if (sortConfig.key === 'date') {
          const dateA = new Date(a.ngayLapPhieu);
          const dateB = new Date(b.ngayLapPhieu);
          return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        }
        if (sortConfig.key === 'price') {
          // [!] FIX LỖI: Ép kiểu về số và xử lý null/undefined thành 0
          const priceA = Number(a.tongTien) || 0;
          const priceB = Number(b.tongTien) || 0;
          
          return sortConfig.direction === 'asc' ? priceA - priceB : priceB - priceA;
        }
        return 0;
      });
    }
    setDisplayedPhieuNhapList(data); // (Hoặc setDisplayedListData nếu ở trang Xuất)
  }, [phieuNhapList, sortConfig, filterConfig]);

  const checkPerm = (id) => isAdmin || permissions.includes(id);
  const canCreate = checkPerm(PERM_CREATE);
  const canEdit = checkPerm(PERM_EDIT);
  const canDelete = checkPerm(PERM_DELETE);
  const canApprove = checkPerm(PERM_APPROVE);
  const canCancel = checkPerm(PERM_CANCEL);

  // --- XỬ LÝ FORM ---
  const handleOpenModal = () => {
    setEditingPhieuNhap(null);
    setSelectedNCC(null);
    form.resetFields();
    setIsModalVisible(true);
    setIsDeleteModalOpen(false);
  };

  const handleEdit = async (record) => {
    if (record.trangThai === 2 || record.trangThai === 3) {
      messageApi.warning("Không thể sửa phiếu đã được duyệt hoặc đã hủy.");
      return;
    }
    try {
      const response = await phieuNhapService.getPhieuNhapById(record.maPhieuNhap);
      const fullData = response.data;
      setEditingPhieuNhap(fullData);
      setSelectedNCC(fullData.maNCC); 
      form.setFieldsValue(fullData);
      setIsModalVisible(true);
    } catch (error) {
      messageApi.error("Lỗi khi tải chi tiết phiếu!");
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingPhieuNhap(null);
  };

  const handleOk = () => {
    form.validateFields().then(async (values) => {
      try {
        if (editingPhieuNhap) {
          await phieuNhapService.updatePhieuNhap(editingPhieuNhap.maPhieuNhap, values);
          messageApi.success("Cập nhật thành công!");
        } else {
          await phieuNhapService.createPhieuNhap(values);
          messageApi.success("Tạo phiếu nhập thành công!");
        }
        setIsModalVisible(false);
        fetchPhieuNhap();
      } catch (error) {
        messageApi.error("Có lỗi xảy ra!");
      }
    });
  };

  // --- XỬ LÝ HÀNH ĐỘNG KHÁC ---
  const handleDelete = (id) => {
    setDeletingPhieuNhapId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await phieuNhapService.deletePhieuNhap(deletingPhieuNhapId);
      messageApi.success("Đã xóa phiếu nhập!");
      fetchPhieuNhap();
    } catch (error) {
      messageApi.error("Lỗi khi xóa!");
    }
    setIsDeleteModalOpen(false);
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
  };

  const handleApprove = async (id) => {
    try {
      await phieuNhapService.approvePhieuNhap(id);
      messageApi.success("Đã duyệt phiếu!");
      fetchPhieuNhap();
    } catch (error) {
      messageApi.error("Lỗi khi duyệt!");
    }
  };

  const handleReject = async (id) => {
    try {
      await phieuNhapService.rejectPhieuNhap(id);
      messageApi.success("Đã hủy phiếu!");
      fetchPhieuNhap();
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

  // [!] CẬP NHẬT CỘT BẢNG: ĐÃ XÓA SORTER
  const columns = [
    { 
      title: "Ngày Lập", 
      dataIndex: "ngayLapPhieu", 
      key: "ngayLapPhieu", 
      // Đã xóa sorter 
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
      render: (value) => `${value?.toLocaleString()} đ`,
      // Đã xóa sorter
    },
    { 
      title: "Nhà Cung Cấp", 
      dataIndex: "maNCC", 
      key: "maNCC",
      render: (id) => {
        const ncc = listNCC.find(item => item.maNCC === id);
        return ncc ? ncc.tenNCC : `Mã: ${id}`;
      }
    },
    { 
      title: "Kho Nhập", 
      dataIndex: "maKho", 
      key: "maKho",
      render: (id) => {
        const kho = listKho.find(item => item.maKho === id);
        return kho ? kho.tenKho : `Mã: ${id}`;
      }
    },
    { 
      title: "Người Duyệt", 
      dataIndex: "tenNguoiDuyet", 
      key: "tenNguoiDuyet",
      render: (text, record) => text || (record.nguoiDuyet ? `ID: ${record.nguoiDuyet}` : "---")
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => {
        const isChoDuyet = record.trangThai === 1;
        return (
          <Space size="small" wrap> 
            {isChoDuyet && canEdit && (
              <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>Sửa</Button>
            )}
            {isChoDuyet && canDelete && (
              <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.maPhieuNhap)}>Xóa</Button>
            )}
            {isChoDuyet && canApprove && (
              <Button icon={<CheckCircleOutlined />} onClick={() => handleApprove(record.maPhieuNhap)} style={{ color: 'green', borderColor: 'green' }}>Duyệt</Button>
            )}
            {isChoDuyet && canCancel && (
              <Button icon={<CloseCircleOutlined />} onClick={() => handleReject(record.maPhieuNhap)} danger>Hủy</Button>
            )}
          </Space>
        )
      },
    },
  ];

  return (
    <div>
      {contextHolder}
      <Space style={{ marginBottom: 16 }}>
        {canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal}>
            Tạo Phiếu Nhập
          </Button>
        )}
        <Button icon={<ReloadOutlined />} onClick={fetchPhieuNhap} loading={loading}>
          Tải lại
        </Button>
        <Dropdown menu={sortMenu} trigger={['click']}>
          <Button>Lọc / Sắp xếp <DownOutlined /></Button>
        </Dropdown>
      </Space>

      <Table
        className="fixed-height-table"
        columns={columns}
        dataSource={displayedPhieuNhapList}
        loading={loading}
        rowKey="maPhieuNhap"
        pagination={{ pageSize: 5 }}
      />

      <Modal
        title={editingPhieuNhap ? "Sửa Phiếu Nhập" : "Tạo Phiếu Nhập"}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={1000}
      >
        <Form form={form} layout="vertical" name="phieuNhapForm">
          <Space wrap>
            <Form.Item name="maNCC" label="Nhà Cung Cấp" rules={[{ required: true, message: "Vui lòng chọn!" }]}>
              <Select 
                style={{ width: 200 }} 
                placeholder="Chọn NCC" 
                showSearch 
                optionFilterProp="children"
                onChange={(value) => {
                    setSelectedNCC(value);
                    const currentChiTiet = form.getFieldValue('chiTiet');
                    if (currentChiTiet && currentChiTiet.length > 0) {
                       form.setFieldsValue({ chiTiet: [] });
                       message.info("Đã làm mới danh sách sản phẩm theo NCC");
                    }
                }}
              >
                {listNCC.map(ncc => (
                  <Option key={ncc.maNCC} value={ncc.maNCC}>{ncc.tenNCC}</Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item name="maKho" label="Kho Nhập" rules={[{ required: true, message: "Vui lòng chọn!" }]}>
              <Select style={{ width: 200 }} placeholder="Chọn Kho" showSearch optionFilterProp="children">
                {listKho.map(kho => (
                  <Option key={kho.maKho} value={kho.maKho}>{kho.tenKho}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="chungTu" label="Chứng từ" rules={[{ required: true, message: "Vui lòng nhập!" }]}>
              <Input placeholder="Ví dụ: HD-001" />
            </Form.Item>
          </Space>

          <h3>Chi tiết sản phẩm</h3>
          <Form.List name="chiTiet">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: "flex", marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, "maSP"]}
                      rules={[{ required: true, message: "Chọn SP" }]}
                    >
                      <Select 
                        style={{ width: 200 }} 
                        placeholder={selectedNCC ? "Chọn Sản phẩm" : "Vui lòng chọn NCC trước"} 
                        showSearch 
                        optionFilterProp="children"
                        disabled={!selectedNCC}
                      >
                        {listSanPham
                          .filter(sp => {
                            if (sp.maNCC == selectedNCC) return true;
                            if (sp.danhSachNCC && Array.isArray(sp.danhSachNCC)) {
                                return sp.danhSachNCC.some(ncc => ncc.maNCC === selectedNCC);
                            }
                            if (sp.danhSachMaNCC && Array.isArray(sp.danhSachMaNCC)) {
                                return sp.danhSachMaNCC.includes(selectedNCC);
                            }
                            return false;
                          })
                          .map(sp => (
                            <Option key={sp.maSP} value={sp.maSP}>{sp.tenSP}</Option>
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

      <Modal
        title="Xác nhận xóa"
        open={isDeleteModalOpen}
        onOk={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        okText="Xóa"
        cancelText="Hủy"
        okType="danger"
      >
        <p>Bạn có chắc muốn xóa phiếu nhập này? Hành động này không thể hoàn tác.</p>
      </Modal>
    </div>
  );
};

export default PhieuNhapPage;