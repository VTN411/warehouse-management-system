// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import các component
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import AdminLayout from './layouts/AdminLayout';
// [!] ĐÃ XÓA Import UserManagementPage (vì chưa tạo)

import 'antd/dist/reset.css';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Route công khai */}
        <Route path="/login" element={<LoginPage />} />

        {/* Các Route cần bảo vệ (phải đăng nhập) */}
        <Route element={<PrivateRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* [!] ĐÃ XÓA Route /admin/users (vì chưa tạo) */}
            
            {/* Sau này bạn tạo các trang mới và thêm vào đây:
              <Route path="/admin/users" element={<UserManagementPage />} />
              <Route path="/products" element={<ProductPage />} />
            */}
          </Route>
        </Route>

        {/* [!] Route mặc định (đã sửa) */}
        {/* Chuyển hướng về /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Nếu gõ sai URL, quay về trang chủ (cũng là login) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;