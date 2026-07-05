import { NavLink, useNavigate } from 'react-router-dom';
import { ClipboardList, Gavel, LogOut, Plus, Anchor, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = user?.role === 'buyer'
    ? [
        { to: '/buyer', label: 'RFQ Command Center', icon: ClipboardList },
        { to: '/create', label: 'Create RFQ', icon: Plus }
      ]
    : [
        { to: '/supplier', label: 'Auction Terminal', icon: Gavel }
      ];

  function handleLogout() {
    logout();
    navigate('/');
  }

  // Initials for avatar
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark"><Anchor size={18} /></span>
        <div className="brand-text">
          <span className="brand-title">BidFlow</span>
          <span className="brand-tag">Enterprise SaaS</span>
        </div>
      </div>

      <div className="system-status-pill">
        <span className="status-dot-pulse" />
        <span>Live Feed Active</span>
      </div>

      <div className="nav-section-label">Navigation</div>
      <nav className="nav-stack">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink 
              key={item.to} 
              to={item.to} 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile-badge">
          <div className="avatar-initials">
            {initials}
          </div>
          <div className="user-profile-info">
            <div className="user-profile-name">
              {user?.name || 'Workspace User'}
            </div>
            <div className="user-profile-meta">
              {user?.company_name || 'Global Forwarding'} • {user?.role}
            </div>
          </div>
        </div>

        <button 
          className="btn secondary sm full" 
          onClick={handleLogout} 
          style={{ 
            color: 'var(--text-secondary)',
            justifyContent: 'center'
          }}
        >
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export default Navbar;
