// src/pages/PhieuNhapPage/index.jsx

// [!] 1. IMPORT THÊM Dropdown VÀ DownOutlined
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
  Dropdown, // Thêm Dropdown
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  MinusCircleOutlined,
  EditOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownOutlined, // Thêm icon DownOutlined
} from "@ant-design/icons";
import * as phieuNhapService from "../../services/phieunhap.service";


const PhieuNhapPage = () => {
  // Master list
  const [phieuNhapList, setPhieuNhapList] = useState([]);
  
  // [!] 2. THÊM 3 STATE MỚI
  // List sẽ hiển thị trên bảng
  const [displayedPhieuNhapList, setDisplayedPhieuNhapList] = useState([]); 
  // State lưu trữ cài đặt Sắp xếp
  const [sortConfig, setSortConfig] = useState(null); 
  // State lưu trữ cài đặt Lọc
  const [filterConfig, setFilterConfig] = useState(null); 

  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingPhieuNhapId, setDeletingPhieuNhapId] = useState(null);
  const [editingPhieuNhap, setEditingPhieuNhap] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);

  // [!] 3. CẬP NHẬT fetchPhieuNhap
  const fetchPhieuNhap = useCallback(async () => {
    setLoading(true);
    try {
      const response = await phieuNhapService.getAllPhieuNhap();
      setPhieuNhapList(response.data || []); // Chỉ cập nhật master list
    } catch (error) {
      messageApi.error("Không thể tải danh sách phiếu nhập!");
    }
    setLoading(false);
  }, [messageApi]);

  useEffect(() => {
    fetchPhieuNhap();
    const storedUser = localStorage.getItem("user_info");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserPermissions(user.quyen || []);
    }
  }, [fetchPhieuNhap]);

  // [!] 4. THÊM useEffect ĐỂ XỬ LÝ LỌC/SẮP XẾP
  useEffect(() => {
    let data = [...phieuNhapList]; // Bắt đầu từ master list

    // Bước 1: Lọc (theo trạng thái)
    if (filterConfig && filterConfig.key === 'status') {
      data = data.filter(item => item.trangThai === filterConfig.value);
    }

    // Bước 2: Sắp xếp
    if (sortConfig) {
      data.sort((a, b) => {
        if (sortConfig.key === 'date') {
          // Sắp xếp ngày tháng
          const dateA = new Date(a.ngayLapPhieu);
          const dateB = new Date(b.ngayLapPhieu);
          return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        }
        if (sortConfig.key === 'price') {
          // Sắp xếp giá tiền
          return sortConfig.direction === 'asc' ? a.tongTien - b.tongTien : b.tongTien - a.tongTien;
        }
        return 0;
      });
    }

    // Bước 3: Cập nhật bảng
    setDisplayedPhieuNhapList(data);
  }, [phieuNhapList, sortConfig, filterConfig]); // Chạy lại khi 1 trong 3 thay đổi

  const canApprove = userPermissions.includes("PERM_PHIEUNHAP_APPROVE");
  const canCancel = userPermissions.includes("PERM_PHIEUNHAP_CANCEL");
  const canEdit = userPermissions.includes("PERM_PHIEUNHAP_EDIT");
  const canDelete = userPermissions.includes("PERM_PHIEUNHAP_DELETE");

  // --- (Tất cả các hàm logic (handle...) giữ nguyên) ---
  
  const handleOpenModal = () => {
    setEditingPhieuNhap(null);
    form.resetFields();
    setIsModalVisible(true);
    setIsDeleteModalOpen(false);
  };

  const handleEdit = (record) => {
    if (record.trangThai === 2 || record.trangThai === 3) {
      messageApi.warning("Không thể sửa phiếu đã được duyệt hoặc đã hủy.");
      return;
    }
    setEditingPhieuNhap(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
    setIsDeleteModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingPhieuNhap(null);
  };

  const handleOk = () => {
    form
      .validateFields()
      .then(async (values) => {
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

  // [!] 5. XÓA BỎ 'sorter' KHỎI CÁC CỘT
  const columns = [
    { title: "Mã Phiếu", dataIndex: "maPhieuNhap", key: "maPhieuNhap" },
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
      render: (value) => `${value?.toLocaleString()} đ`,
    },
    { title: "Mã NCC", dataIndex: "maNCC", key: "maNCC" },
    { title: "Mã Kho", dataIndex: "maKho", key: "maKho" },
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

  // [!] 6. ĐỊNH NGHĨA MENU CHO DROPDOWN
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
      
      {/* [!] 7. THÊM NÚT DROPDOWN VÀO SPACE */}
      <Space style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenModal}
        >
          Tạo Phiếu Nhập
        </Button>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={fetchPhieuNhap}
          loading={loading}
        >
          Tải lại
        </Button>
        <Dropdown menu={sortMenu}>
          <Button>
            Lọc / Sắp xếp <DownOutlined />
          </Button>
        </Dropdown>
      </Space>

      <Table
        columns={columns}
        dataSource={displayedPhieuNhapList} // [!] 8. SỬ DỤNG STATE MỚI
        loading={loading}
        rowKey="maPhieuNhap"
        pagination={{ pageSize: 5 }}
      />

      {/* MODAL TẠO/SỬA PHIẾU NHẬP (Giữ nguyên) */}
      <Modal
        title={editingPhieuNhap ? "Sửa Phiếu Nhập Hàng" : "Tạo Phiếu Nhập Hàng"}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={1000}
      >
        <Form form={form} layout="vertical" name="phieuNhapForm">
          <Space wrap>
            <Form.Item name="maNCC" label="Mã NCC" rules={[{ required: true, message: "Vui lòng nhập!" }]}>
              <InputNumber style={{ width: 150 }} placeholder="Nhập ID NCC"/>
            </Form.Item>
            <Form.Item name="maKho" label="Mã Kho" rules={[{ required: true, message: "Vui lòng nhập!" }]}>
              <InputNumber style={{ width: 150 }} placeholder="Nhập ID Kho"/>
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
                    <Form.Item {...restField} name={[name, "maSP"]} rules={[{ required: true, message: "Nhập Mã SP" }]}>
                      <InputNumber placeholder="Mã SP" />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, "soLuong"]} rules={[{ required: true, message: "Nhập SL" }]}>
                      <InputNumber placeholder="Số lượng" />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, "donGia"]} rules={[{ required: true, message: "Nhập Giá" }]}>
                      <InputNumber 
                        placeholder="Đơn giá" 
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

      {/* MODAL XÁC NHẬN XÓA (Giữ nguyên) */}
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