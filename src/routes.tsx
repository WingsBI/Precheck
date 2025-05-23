import { lazy } from 'react';
import { Route, Routes, Navigate, Outlet } from 'react-router-dom';
import Layout from './layouts/Layout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgetPassword from './pages/auth/ForgetPassword';
import Dashboard from './pages/Dashboard';
import Precheck from './pages/precheck/Precheck';
import ConsumptionView from './pages/precheck/ConsumptionView';
import StoreIn from './pages/precheck/StoreIn';
import MakeOrder from './pages/precheck/MakeOrder';
import MakePrecheck from './pages/precheck/MakePrecheck';
import SOP from './pages/sop/SOP';
import Settings from './pages/settings/Settings';
import ViewIRMSN from './pages/irmsn/ViewIRMSN';
import CreateIRMSN from './pages/irmsn/CreateIRMSN';
import SearchUpdateIRMSN from './pages/irmsn/SearchUpdateIRMSN';
import ViewQRCode from './pages/qrcode/ViewQRCode';
import CreateQRCode from './pages/qrcode/CreateQRCode';
import ProtectedRoute from './components/ProtectedRoute';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forget-password" element={<ForgetPassword />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>  
              <Outlet />
            </Layout>
         </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="precheck" element={<Precheck />} />
        <Route path="precheck/consumption" element={<ConsumptionView />} />
        <Route path="precheck/store-in" element={<StoreIn />} />
        <Route path="precheck/make-order" element={<MakeOrder />} />
        <Route path="precheck/make-precheck" element={<MakePrecheck />} />
        <Route path="sop" element={<SOP />} />
        <Route path="settings" element={<Settings />} />
        <Route path="irmsn/view" element={<ViewIRMSN />} />
        <Route path="irmsn/create" element={<CreateIRMSN />} />
        <Route path="irmsn/search-update" element={<SearchUpdateIRMSN />} />
        <Route path="qrcode/view" element={<ViewQRCode />} />
        <Route path="qrcode/create" element={<CreateQRCode />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes; 