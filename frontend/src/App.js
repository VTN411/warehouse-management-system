// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { App as AntApp } from 'antd'; // <--- 1. IMPORT COMPONENT 'App' CỦA ANTD

// Import các component
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import AdminLayout from './layouts/AdminLayout';
import UserManagementPage from './pages/UserManagement';
import ProfilePage from './pages/ProfilePage';
import PhieuNhapPage from './pages/PhieuNhapPage'; 
import ProductPage from './pages/ProductPage';
import WarehousePage from './pages/WarehousePage';
import SupplierPage from './pages/SupplierPage';
import PhieuXuatPage from './pages/PhieuXuatPage';

import 'antd/dist/reset.css';
import './App.css';

function App() {
  return (
    // [!] 2. BỌC TOÀN BỘ ỨNG DỤNG TRONG <AntApp>
    <AntApp>
      <Router>
        <Routes>
          {/* Route công khai */}
          <Route path="/login" element={<LoginPage />} />

          {/* Các Route cần bảo vệ (phải đăng nhập) */}
          <Route element={<PrivateRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin/users" element={<UserManagementPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/stock-in" element={<PhieuNhapPage />} />
              <Route path="/products" element={<ProductPage />} />
              <Route path="/warehouses" element={<WarehousePage />} />
              <Route path="/suppliers" element={<SupplierPage />} />
              <Route path="/stock-out" element={<PhieuXuatPage />} />
            </Route>
          </Route>

          {/* Route mặc định */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Nếu gõ sai URL, quay về trang chủ */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AntApp>
    // [!] 3. ĐÓNG <AntApp>
  );
}

export default App;