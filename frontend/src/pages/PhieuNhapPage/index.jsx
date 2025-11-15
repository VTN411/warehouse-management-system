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
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  MinusCircleOutlined,
  EditOutlined,
  ReloadOutlined, // [!] 1. IMPORT ICON REFRESH
} from "@ant-design/icons";
import * as phieuNhapService from "../../services/phieunhap.service";

const PhieuNhapPage = () => {
  const [phieuNhapList, setPhieuNhapList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingPhieuNhapId, setDeletingPhieuNhapId] = useState(null);
  const [editingPhieuNhap, setEditingPhieuNhap] = useState(null);

  // Hàm lấy danh sách phiếu nhập
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

  useEffect(() => {
    fetchPhieuNhap();
  }, [fetchPhieuNhap]);

  // --- CÁC HÀM XỬ LÝ MODAL ---

  const handleOpenModal = () => {
    setEditingPhieuNhap(null);
    form.resetFields();
    setIsModalVisible(true);
    setIsDeleteModalOpen(false);
  };

  const handleEdit = (record) => {
    // Kiểm tra trạng thái trước khi sửa
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
            // Sửa
            await phieuNhapService.updatePhieuNhap(
              editingPhieuNhap.maPhieuNhap,
              values
            );
            messageApi.success("Cập nhật phiếu nhập thành công!");
          } else {
            // Tạo mới
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

  // --- CÁC HÀM XỬ LÝ XÓA ---

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

  // Cột Bảng
  const columns = [
    { title: "Mã Phiếu", dataIndex: "maPhieuNhap", key: "maPhieuNhap" },
    { title: "Ngày Lập", dataIndex: "ngayLapPhieu", key: "ngayLapPhieu" },
    { 
      title: "Trạng Thái", 
      dataIndex: "trangThai", 
      key: "trangThai",
      render: (status) => {
        if (status === 1) {
          return <Tag color="orange">Chờ duyệt</Tag>;
        } else if (status === 2) {
          return <Tag color="green">Đã duyệt</Tag>;
        } else if (status === 3) {
          return <Tag color="red">Không duyệt</Tag>;
        }
        return status;
      }
    },
    { 
      title: "Tổng Tiền", 
      dataIndex: "tongTien", 
      key: "tongTien",
      render: (value) => `${value?.toLocaleString()} đ` 
    },
    { title: "Mã NCC", dataIndex: "maNCC", key: "maNCC" },
    { title: "Mã Kho", dataIndex: "maKho", key: "maKho" },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>

          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDelete(record.maPhieuNhap)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {contextHolder}
      
      {/* [!] 2. THÊM NÚT REFRESH VÀ GOM NHÓM BẰNG SPACE */}
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
          onClick={fetchPhieuNhap} // Gọi hàm fetchPhieuNhap khi bấm
          loading={loading} // Hiệu ứng xoay khi đang tải
        >
          Tải lại
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={phieuNhapList}
        loading={loading}
        rowKey="maPhieuNhap"
      />

      {/* MODAL TẠO/SỬA PHIẾU NHẬP */}
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
                    <Form.Item
                      {...restField}
                      name={[name, "maSP"]}
                      rules={[{ required: true, message: "Nhập Mã SP" }]}
                    >
                      <InputNumber placeholder="Mã SP" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "soLuong"]}
                      rules={[{ required: true, message: "Nhập SL" }]}
                    >
                      <InputNumber placeholder="Số lượng" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "donGia"]}
                      rules={[{ required: true, message: "Nhập Giá" }]}
                    >
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