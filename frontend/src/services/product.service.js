// src/services/product.service.js
import api from "./api";

const API_ENDPOINT = "/sanpham";

export const getAllProducts = () => {
  return api.get(API_ENDPOINT);
};

export const createProduct = (data) => {
  return api.post(API_ENDPOINT, data);
};

export const updateProduct = (id, data) => {
  return api.put(`${API_ENDPOINT}/${id}`, data);
};

export const deleteProduct = (id) => {
  return api.delete(`${API_ENDPOINT}/${id}`);
};