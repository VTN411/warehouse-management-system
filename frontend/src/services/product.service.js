// src/services/product.service.js
import api from "./api";

const API_ENDPOINT = "/sanpham";

export const getAllProducts = () => {
  return api.get(API_ENDPOINT);
};

export const createProduct = (values, file) => {
  const formData = new FormData();
  formData.append("data", JSON.stringify(values));
  if (file) {
    formData.append("image", file);
  }
  return api.post(API_ENDPOINT, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// [!] KIỂM TRA KỸ HÀM NÀY
export const updateProduct = (id, values, file) => {
  const formData = new FormData();
  
  // Backend yêu cầu dữ liệu text nằm trong field 'data'
  formData.append("data", JSON.stringify(values));
  
  // Nếu có file ảnh mới thì gửi kèm, không thì thôi
  if (file) {
    formData.append("image", file);
  }

  // Bắt buộc header này
  return api.put(`${API_ENDPOINT}/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteProduct = (id) => {
  return api.delete(`${API_ENDPOINT}/${id}`);
};