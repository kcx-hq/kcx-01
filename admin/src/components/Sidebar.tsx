import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchInquiries } from "../modules/inquiries/inquiries.api";

const Sidebar = () => {
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    fetchInquiries({ status: "PENDING", page: 1, limit: 1 })
      .then((res) => {
        if (active) setPendingCount(res.total);
      })
      .catch(() => {
        if (active) setPendingCount(null);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <aside className="sidebar">
      <div className="brand">KCX Admin</div>
      <nav>
        <NavLink to="/overview" end>
          Overview
        </NavLink>
        <NavLink to="/users">Users</NavLink>
        <NavLink to="/inquiries">
          Inquiries
          {pendingCount && pendingCount > 0 ? (
            <span className="nav-badge">{pendingCount}</span>
          ) : null}
        </NavLink>
        <NavLink to="/operations">Operations</NavLink>
        <NavLink to="/activity">Activity Log</NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
