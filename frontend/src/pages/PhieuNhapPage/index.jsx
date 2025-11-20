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
import * as productService from "../../services/product.service"; // [!] Import Product Service

const { Option } = Select;

const PhieuNhapPage = () => {
  const [phieuNhapList, setPhieuNhapList] = useState([]);
  const [displayedPhieuNhapList, setDisplayedPhieuNhapList] = useState([]);
  const [sortConfig, setSortConfig] = useState(null);
  const [filterConfig, setFilterConfig] = useState(null);

  // Danh sách danh mục
  const [listNCC, setListNCC] = useState([]);
  const [listKho, setListKho] = useState([]);
  const [listSanPham, setListSanPham] = useState([]); // [!] Thêm list Sản phẩm

  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingPhieuNhapId, setDeletingPhieuNhapId] = useState(null);
  const [editingPhieuNhap, setEditingPhieuNhap] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);

  // --- CÁC HÀM API ---

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
        productService.getAllProducts(), // [!] Lấy luôn danh sách SP để hiển thị tên trong Form
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
      const user = JSON.parse(storedUser);
      setUserPermissions(user.quyen || []);
    }
  }, [fetchPhieuNhap, fetchCommonData]);

  // Logic lọc/sắp xếp (Giữ nguyên)
  useEffect(() => {
    let data = [...phieuNhapList];
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
          return sortConfig.direction === 'asc' ? a.tongTien - b.tongTien : b.tongTien - a.tongTien;
        }
        return 0;
      });
    }
    setDisplayedPhieuNhapList(data);
  }, [phieuNhapList, sortConfig, filterConfig]);

  const canApprove = userPermissions.includes("PERM_PHIEUNHAP_APPROVE");
  const canCancel = userPermissions.includes("PERM_PHIEUNHAP_CANCEL");
  const canEdit = userPermissions.includes("PERM_PHIEUNHAP_EDIT");
  const canDelete = userPermissions.includes("PERM_PHIEUNHAP_DELETE");

  // --- CÁC HÀM XỬ LÝ ---

  const handleOpenModal = () => {
    setEditingPhieuNhap(null);
    form.resetFields();
    setIsModalVisible(true);
    setIsDeleteModalOpen(false);
  };

  // [!] SỬA LẠI HÀM handleEdit: GỌI API LẤY CHI TIẾT
  const handleEdit = async (record) => {
    if (record.trangThai === 2 || record.trangThai === 3) {
      messageApi.warning("Không thể sửa phiếu đã được duyệt hoặc đã hủy.");
      return;
    }

    try {
      // Gọi API lấy chi tiết phiếu (bao gồm mảng 'chiTiet')
      const response = await phieuNhapService.getPhieuNhapById(record.maPhieuNhap);
      const fullData = response.data;

      setEditingPhieuNhap(fullData);
      form.setFieldsValue(fullData); // Đổ dữ liệu đầy đủ vào form
      setIsModalVisible(true);
      setIsDeleteModalOpen(false);
    } catch (error) {
      messageApi.error("Lỗi khi tải chi tiết phiếu nhập!");
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
          messageApi.success("Cập nhật phiếu nhập thành công!");
        } else {
          await phieuNhapService.createPhieuNhap(values);
          messageApi.success("Tạo phiếu nhập thành công!");
        }
        setIsModalVisible(false);
        setEditingPhieuNhap(null);
        fetchPhieuNhap();
      } catch (error) {
        let errMsg = "Có lỗi xảy ra!";
        if (error.response?.data?.message) {
          errMsg = error.response.data.message;
        }
        messageApi.error(errMsg);
      }
    })
    .catch((info) => {
      console.log("Validate Failed:", info);
    });
  };

  // ... (Các hàm Xóa, Duyệt, Hủy giữ nguyên) ...
  const handleDelete = (phieuNhapId) => {
    setDeletingPhieuNhapId(phieuNhapId);
    setIsDeleteModalOpen(true);
    setIsModalVisible(false);
  };

  const handleDeleteConfirm = async () => {
    try {
      await phieuNhapService.deletePhieuNhap(deletingPhieuNhapId);
      messageApi.success("Xóa phiếu nhập thành công!");
      fetchPhieuNhap();
    } catch (error) {
      let errMsg = "Lỗi khi xóa phiếu nhập!";
      if (error.response?.data?.message) {
        errMsg = error.response.data.message;
      }
      messageApi.error(errMsg);
    }
    setIsDeleteModalOpen(false);
    setDeletingPhieuNhapId(null);
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setDeletingPhieuNhapId(null);
  };

  const handleApprove = async (phieuNhapId) => {
    try {
      await phieuNhapService.approvePhieuNhap(phieuNhapId);
      messageApi.success("Duyệt phiếu nhập thành công!");
      fetchPhieuNhap();
    } catch (error) {
      messageApi.error("Lỗi khi duyệt phiếu!");
    }
  };

  const handleReject = async (phieuNhapId) => {
    try {
      await phieuNhapService.rejectPhieuNhap(phieuNhapId);
      messageApi.success("Đã hủy phiếu nhập!");
      fetchPhieuNhap();
    } catch (error) {
      messageApi.error("Lỗi khi hủy phiếu!");
    }
  };

  // Cột bảng (Giữ nguyên)
  const columns = [
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
      },
    },
    { 
      title: "Tổng Tiền", 
      dataIndex: "tongTien", 
      key: "tongTien",
      render: (value) => `${value?.toLocaleString()} đ`,
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

  return (
    <div>
      {contextHolder}
      
      <Space style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenModal}
        >
          Tạo Phiếu Nhập
        </Button>
        <Button icon={<ReloadOutlined />} onClick={fetchPhieuNhap} loading={loading}>
          Tải lại
        </Button>
        <Dropdown menu={sortMenu}>
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
        title={editingPhieuNhap ? "Sửa Phiếu Nhập Hàng" : "Tạo Phiếu Nhập Hàng"}
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
              >
                {listNCC.map(ncc => (
                  <Option key={ncc.maNCC} value={ncc.maNCC}>{ncc.tenNCC}</Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item name="maKho" label="Kho Nhập" rules={[{ required: true, message: "Vui lòng chọn!" }]}>
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

            <Form.Item name="chungTu" label="Chứng từ" rules={[{ required: true, message: "Vui lòng nhập!" }]}>
              <Input placeholder="Ví dụ: HD-001" />
            </Form.Item>
          </Space>

          <h3>Chi tiết phiếu nhập</h3>
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
                      {/* [!] CẬP NHẬT: Dùng Select để chọn Sản Phẩm */}
                      <Select style={{ width: 200 }} placeholder="Chọn SP" showSearch optionFilterProp="children">
                        {listSanPham.map(sp => (
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