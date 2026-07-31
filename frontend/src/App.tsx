import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Incidents from './pages/Incidents';
import Personnel from './pages/Personnel';
import Vehicles from './pages/Vehicles';
import Equipment from './pages/Equipment';
import Attendance from './pages/Attendance';
import GpsTracker from './pages/GpsTracker';
import FalseAlarms from './pages/FalseAlarms';
import Establishments from './pages/Establishments';
import Inspections from './pages/Inspections';
import Certificates from './pages/Certificates';
import Violations from './pages/Violations';
import Reports from './pages/Reports';
import StaffAccounts from './pages/StaffAccounts';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/personnel" element={<Personnel />} />
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="/equipment" element={<Equipment />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/gps-tracker" element={<GpsTracker />} />
        <Route path="/false-alarms" element={<FalseAlarms />} />
        <Route path="/establishments" element={<Establishments />} />
        <Route path="/inspections" element={<Inspections />} />
        <Route path="/certificates" element={<Certificates />} />
        <Route path="/violations" element={<Violations />} />
        <Route path="/reports" element={<Reports />} />
        <Route
          path="/staff-accounts"
          element={
            <ProtectedRoute adminOnly>
              <StaffAccounts />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<div className="p-6 text-slate-600">Page not found.</div>} />
    </Routes>
  );
}
