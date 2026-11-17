import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Activity, Bell, Boxes, ChartNoAxesCombined, ChevronDown, CircleHelp, FileText, GitFork, LayoutDashboard, LogOut, Menu, Moon, Search, Settings, Shield, Sun, X, Zap } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { signOut, toggleTheme } from '../store.js';
import api from '../api.js';

const navItems = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/systems', label: 'Systems inventory', icon: Boxes },
  { to: '/dependencies', label: 'Dependency map', icon: GitFork },
  { to: '/simulations', label: 'Impact simulations', icon: Zap },
  { to: '/analytics', label: 'Analytics', icon: ChartNoAxesCombined }
];
const secondaryItems = [
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/audit', label: 'Audit log', icon: Shield }
];
const headingByPath = {
  '/': 'Overview', '/systems': 'Systems inventory', '/dependencies': 'Dependency map',
  '/simulations': 'Impact simulations', '/analytics': 'Analytics', '/reports': 'Reports', '/audit': 'Audit log'
};

export default function Layout() {
  const dispatch = useDispatch();
  const { user, theme } = useSelector((state) => ({ user: state.auth.user, theme: state.ui.theme }));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const location = useLocation();
  const loadNotifications = async () => {
    try { const { data } = await api.get('/analytics/notifications'); setNotifications(data.filter((item) => !item.read)); }
    catch (error) { console.error('Unable to load notifications', error); }
  };
  return (
    <div className="app-shell">
      {sidebarOpen && <button className="mobile-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><Activity size={19} /></div>
          <div><strong>impact<span>.ops</span></strong><small>DEPENDENCY PLATFORM</small></div>
          <button className="icon-btn mobile-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu"><X size={18} /></button>
        </div>
        <div className="workspace-switch"><div className="workspace-icon">A</div><div><b>Acme Corporation</b><small>Production workspace</small></div><ChevronDown size={15} /></div>
        <div className="nav-label">WORKSPACE</div>
        <nav className="nav-group">{navItems.map((item) => <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setSidebarOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><item.icon size={17} /><span>{item.label}</span>{item.to === '/simulations' && <span className="nav-pill">New</span>}</NavLink>)}</nav>
        <div className="nav-label nav-label-spaced">MANAGE</div>
        <nav className="nav-group">{secondaryItems.map((item) => <NavLink key={item.to} to={item.to} onClick={() => setSidebarOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><item.icon size={17} /><span>{item.label}</span></NavLink>)}</nav>
        <div className="sidebar-bottom">
          <div className="plan-card"><div className="plan-icon"><Zap size={15} /></div><b>Enterprise plan</b><p>All systems operational tools enabled.</p><div className="plan-meter"><span /></div><small>24 of 50 systems</small></div>
          <button className="nav-link" onClick={() => alert('Contact your workspace administrator for support.')}><CircleHelp size={17} /><span>Help & support</span></button>
          <button className="nav-link"><Settings size={17} /><span>Settings</span></button>
          <div className="profile">
            <div className="avatar">{user?.name?.slice(0, 1) || 'U'}</div>
            <div className="profile-info"><b>{user?.name || 'Loading user'}</b><small>{user?.role || 'Workspace member'}</small></div>
            <button className="icon-btn" title="Sign out" onClick={() => dispatch(signOut())}><LogOut size={16} /></button>
          </div>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <button className="icon-btn menu-toggle" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Menu size={19} /></button>
          <div className="breadcrumb"><span>Workspace</span><span className="crumb-slash">/</span><b>{headingByPath[location.pathname] || 'Overview'}</b></div>
          <div className="topbar-actions">
            <label className="global-search"><Search size={16} /><input placeholder="Search anything..." /><kbd>⌘ K</kbd></label>
            <button className="icon-btn theme-toggle" title="Toggle color theme" onClick={() => dispatch(toggleTheme())}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
            <div className="notification-wrap"><button className="icon-btn notification-btn" aria-label="Notifications" onClick={() => { setNoticeOpen(!noticeOpen); loadNotifications(); }}><Bell size={18} />{notifications.length > 0 && <span className="notification-dot" />}</button>
              {noticeOpen && <div className="notification-popover"><b>Notifications</b>{notifications.length ? notifications.slice(0, 5).map((notification) => <div key={notification._id} className="notice-item"><span className={`risk-dot ${notification.severity.toLowerCase()}`} /><div><strong>{notification.title}</strong><small>{notification.message}</small></div></div>) : <p className="empty-note">You're all caught up.</p>}</div>}
            </div>
            <span className="topbar-divider" /><div className="top-avatar">{user?.name?.slice(0, 1) || 'U'}</div>
          </div>
        </header>
        <div className="page-content"><Outlet /></div>
      </main>
    </div>
  );
}
