import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import api from './api.js';
import { setUser } from './store.js';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Systems from './pages/Systems.jsx';
import DependencyMap from './pages/DependencyMap.jsx';
import Simulations from './pages/Simulations.jsx';
import Analytics from './pages/Analytics.jsx';
import Reports from './pages/Reports.jsx';
import AuditLogs from './pages/AuditLogs.jsx';

function Protected({ children }) {
  return localStorage.getItem('token') ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.ui.theme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    if (localStorage.getItem('token')) {
      api.get('/auth/me').then(({ data }) => dispatch(setUser(data))).catch(() => localStorage.removeItem('token'));
    }
  }, [dispatch, theme]);
  return (
    <Routes>
      <Route path="/login" element={localStorage.getItem('token') ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<Protected><Layout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="systems" element={<Systems />} />
        <Route path="dependencies" element={<DependencyMap />} />
        <Route path="simulations" element={<Simulations />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="reports" element={<Reports />} />
        <Route path="audit" element={<AuditLogs />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
