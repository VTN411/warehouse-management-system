// src/services/category.service.js
import api from "./api";

const API_ENDPOINT = "/loaihang";

export const getAllCategories = () => {
  return api.get(API_ENDPOINT);
};

export const createCategory = (data) => {
  return api.post(API_ENDPOINT, data);
};

export const updateCategory = (id, data) => {
  return api.put(`${API_ENDPOINT}/${id}`, data);
};

export const deleteCategory = (id) => {
  return api.delete(`${API_ENDPOINT}/${id}`);
};