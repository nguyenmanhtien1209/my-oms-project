// src/services/api.js
import axios from 'axios';
// update: 26/07/2026
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- API DÀNH CHO ĐƠN HÀNG BÁN ---
export const fetchOrders = async (params = {}) => {
  // params có thể chứa: { status, platform, search }
  const response = await api.get('/orders', { params });
  return response.data;
};

// --- API DÀNH CHO ĐƠN HOÀN / TRẢ TIỀN ---
export const fetchReturns = async (params = {}) => {
  const response = await api.get('/returns', { params });
  return response.data;
};

export const updateReturnInspect = async (returnId, formData) => {
  // formData dùng để gửi cả text + file video/ảnh bóc hàng
  const response = await api.put(`/returns/inspect/${returnId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export default api;