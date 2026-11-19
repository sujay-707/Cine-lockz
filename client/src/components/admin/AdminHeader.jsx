
import { Bell, Search, Menu } from "lucide-react";

function AdminHeader({ title = "Dashboard", subtitle = "Welcome back, Admin" }) {
  return (
    <header className="admin-header">
      <div className="admin-header-title">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="admin-header-actions">
        <label className="admin-search">
          <Search size={18} />
          <input type="search" placeholder="Search..." />
        </label>

        <button
          className="admin-icon-button"
          aria-label="Notifications"
        >
          <Bell size={20} />
          <span className="notification-dot" />
        </button>

        <div className="admin-profile">
          <div className="admin-avatar">A</div>
          <div>
            <strong>Administrator</strong>
            <span>CineLockz Admin</span>
          </div>
        </div>
      </div>

      <button className="admin-mobile-menu" aria-label="Open menu">
        <Menu size={23} />
      </button>
    </header>
  );
}

export default AdminHeader;
