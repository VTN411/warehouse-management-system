// src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
// 1. Import lại các component của Ant Design
import { ConfigProvider, App as AntApp } from 'antd'; 
import 'antd/dist/reset.css'; // 2. Import CSS của Ant Design
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* 3. Bọc lại bằng ConfigProvider và AntApp */}
    <ConfigProvider>
      <AntApp>
        <App />
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>
);

reportWebVitals();