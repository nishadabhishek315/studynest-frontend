import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import AppLayout from './components/Layout/AppLayout';

import Login        from './pages/Login';
import Dashboard    from './pages/Dashboard';
import Members      from './pages/Members/index';
import MemberProfile from './pages/MemberProfile';
import SeatMap      from './pages/SeatMap';
import Billing      from './pages/Billing/index';
import Reports      from './pages/Reports';
import Notifications from './pages/Notifications';

function RequireAuth({ children }) {
  const token = useAuthStore(s => s.token);
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index               element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"    element={<Dashboard />} />
        <Route path="members"      element={<Members />} />
        <Route path="members/:id"  element={<MemberProfile />} />
        <Route path="seats"        element={<SeatMap />} />
        <Route path="billing"      element={<Billing />} />
        <Route path="reports"      element={<Reports />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
