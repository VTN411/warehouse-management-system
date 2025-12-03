// src/services/product.service.js
import api from "./api";

const API_ENDPOINT = "/sanpham";

export const getAllProducts = () => {
  return api.get(API_ENDPOINT);
};

// Hàm đóng gói dữ liệu chuẩn
const createFormData = (values, file) => {
  const formData = new FormData();
  
  // Đóng gói JSON vào Blob (để Backend Java hiểu)
  const jsonBlob = new Blob([JSON.stringify(values)], {
    type: 'application/json'
  });
  
  formData.append("data", jsonBlob);

  if (file) {
    formData.append("image", file);
  }
  
  return formData;
};

// Tạo mới
export const createProduct = (values, file) => {
  const formData = createFormData(values, file);
  
  // [!] "Content-Type": undefined là CHÌA KHÓA để fix lỗi này
  return api.post(API_ENDPOINT, formData, {
    headers: { "Content-Type": undefined }
  });
};

// Cập nhật
export const updateProduct = (id, values, file) => {
  const formData = createFormData(values, file);
  
  // [!] "Content-Type": undefined là CHÌA KHÓA để fix lỗi này
  return api.put(`${API_ENDPOINT}/${id}`, formData, {
    headers: { "Content-Type": undefined }
  });
};

export const deleteProduct = (id) => {
  return api.delete(`${API_ENDPOINT}/${id}`);
};
export const filterProducts = (filterData) => {
  // filterData gồm: { keyword, maLoai, page, size... }
  return api.post(`${API_ENDPOINT}/filter`, filterData);
};