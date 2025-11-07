// src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import các component
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import AdminLayout from './layouts/AdminLayout'; // 1. Import AdminLayout

import 'antd/dist/reset.css';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Route công khai */}
        <Route path="/login" element={<LoginPage />} />

        {/* 2. Cấu trúc Route được bảo vệ (thay đổi ở đây) */}
        <Route element={<PrivateRoute />}>
          {/* AdminLayout sẽ là cha của tất cả các trang quản trị */}
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            {/* Sau này bạn tạo các trang mới và thêm vào đây:
              <Route path="/products" element={<ProductPage />} />
              <Route path="/warehouses" element={<WarehousePage />} />
              ... 
            */}
          </Route>
        </Route>

        {/* 3. Route mặc định (thay đổi ở đây) */}
        {/* Chuyển hướng về /dashboard thay vì /login */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Nếu gõ sai URL, quay về trang chủ */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;