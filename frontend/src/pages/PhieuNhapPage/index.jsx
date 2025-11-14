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
  //Select,
  InputNumber, 
} from "antd";
import { PlusOutlined, DeleteOutlined, MinusCircleOutlined,EditOutlined, } from "@ant-design/icons";
import * as phieuNhapService from "../../services/phieunhap.service";

//const { Option } = Select;

const PhieuNhapPage = () => {
  const [phieuNhapList, setPhieuNhapList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingPhieuNhapId, setDeletingPhieuNhapId] = useState(null);

  // Hàm gọi API lấy danh sách (cho bảng)
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

  // Mở modal
  const handleOpenModal = () => {
    form.resetFields();
    setIsModalVisible(true);
    setIsDeleteModalOpen(false);
  };

  // Hủy modal
  const handleCancel = () => {
    setIsModalVisible(false);
  };

  // Hàm OK (Gửi form)
  const handleOk = () => {
    form
      .validateFields()
      .then(async (values) => {
        // 'values' chính là object giống Postman
        try {
          await phieuNhapService.createPhieuNhap(values);
          messageApi.success("Tạo phiếu nhập thành công!");
          setIsModalVisible(false);
          fetchPhieuNhap(); // Tải lại bảng
        } catch (error) {
          let errMsg = "Lỗi khi tạo phiếu nhập!";
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
    setIsModalVisible(false); // Đóng modal tạo (nếu đang mở)
  };

  const handleDeleteConfirm = async () => {
    try {
      await phieuNhapService.deletePhieuNhap(deletingPhieuNhapId);
      messageApi.success("Xóa phiếu nhập thành công!");
      fetchPhieuNhap(); // Tải lại bảng
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



  // Cột cho bảng (Table)
  const columns = [
    { title: "Mã Phiếu", dataIndex: "maPhieuNhap", key: "maPhieuNhap" },
    { title: "Ngày Lập", dataIndex: "ngayLapPhieu", key: "ngayLapPhieu" },
    { title: "Trạng Thái", dataIndex: "trangThai", key: "trangThai" },
    { title: "Tổng Tiền", dataIndex: "tongTien", key: "tongTien" },
    { title: "Mã NCC", dataIndex: "maNCC", key: "maNCC" },
    { title: "Mã Kho", dataIndex: "maKho", key: "maKho" },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => { /* Tạm thời */ }}>
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
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={handleOpenModal}
        style={{ marginBottom: 16 }}
      >
        Tạo Phiếu Nhập
      </Button>

      <Table
        columns={columns}
        dataSource={phieuNhapList}
        loading={loading}
        rowKey="maPhieuNhap"
      />

      {/* MODAL TẠO PHIẾU NHẬP */}
      <Modal
        title="Tạo Phiếu Nhập Hàng"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={1000} // Cho modal rộng hơn
      >
        <Form form={form} layout="vertical" name="phieuNhapForm">
          {/* Các trường thông tin chung */}
          <Space>
            <Form.Item
              name="trangThai"
              label="Trạng thái"
              initialValue="HoanThanh"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="maNCC" label="Mã NCC" rules={[{ required: true }]}>
              <InputNumber />
            </Form.Item>
            <Form.Item name="maKho" label="Mã Kho" rules={[{ required: true }]}>
              <InputNumber />
            </Form.Item>
            <Form.Item name="nguoiDuyet" label="Người duyệt" rules={[{ required: true }]}>
              <InputNumber />
            </Form.Item>
            <Form.Item name="chungTu" label="Chứng từ" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Space>

          {/* [!] PHẦN QUAN TRỌNG: FORM ĐỘNG CHO 'chiTiet' */}
          <h3>Chi tiết phiếu nhập</h3>
          <Form.List name="chiTiet">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space
                    key={key}
                    style={{ display: "flex", marginBottom: 8 }}
                    align="baseline"
                  >
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
                      rules={[{ required: true, message: "Nhập S.Lượng" }]}
                    >
                      <InputNumber placeholder="Số lượng" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "donGia"]}
                      rules={[{ required: true, message: "Nhập Đơn giá" }]}
                    >
                      <InputNumber placeholder="Đơn giá" />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} />
                  </Space>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                  >
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