import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layouts/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgetPassword from './pages/auth/ForgetPassword';

// Main Pages
import Dashboard from './pages/Dashboard';

// Precheck Pages
import Precheck from './pages/precheck/Precheck';
import MakePrecheck from './pages/precheck/MakePrecheck';
import StoreIn from './pages/precheck/StoreIn';
import MakeOrder from './pages/precheck/MakeOrder';

import GenerateIRMSN from './pages/irmsn/GenerateIRMSN';
import SearchUpdateIRMSN from './pages/irmsn/SearchUpdateIRMSN';
import ViewIRMSN from './pages/irmsn/ViewIRMSN';

// QR Code Pages
import QRCode from './pages/qrcode/QRCode';
import BarcodeGeneration from './pages/qrcode/BarcodeGeneration';
import ViewBarcode from './pages/qrcode/ViewBarcode';

// SOP Pages
import SOP from './pages/sop/SOP';
import SOPGeneration from './pages/sop/SOPGeneration';

// Settings Pages
import Settings from './pages/settings/Settings';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgetPassword />} />

      {/* Protected Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Precheck Module */}
        <Route path="precheck">
          <Route index element={<Precheck />} />
          <Route path="make" element={<MakePrecheck />} />
          <Route path="store-in" element={<StoreIn />} />
          <Route path="make-order" element={<MakeOrder />} />
          <Route path="consumed" element={<Precheck />} />
        </Route>
        
        {/* IR/MSN Module */}
        <Route path="irmsn">
          <Route index element={<ViewIRMSN />} />
          <Route path="generate" element={<GenerateIRMSN />} />
          <Route path="search-update" element={<SearchUpdateIRMSN />} />
          <Route path="view" element={<ViewIRMSN />} />
        </Route>
        
        {/* QR Code Module */}
        <Route path="qrcode">
          <Route index element={<ViewBarcode />} />
          <Route path="generate" element={<BarcodeGeneration />} />
          <Route path="view" element={<ViewBarcode />} />
        </Route>
        
        {/* SOP Module */}
        <Route path="sop">
          <Route index element={<SOP />} />
          <Route path="generate" element={<SOPGeneration />} />
        </Route>
        
        {/* Settings Module */}
        <Route path="settings">
          <Route index element={<Settings />} />
        </Route>
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
} 