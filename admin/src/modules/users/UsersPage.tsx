import { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import {
  deleteUser,
  fetchUsers,
  notifyUnverifiedUser,
  updateUserRole,
  updateUserStatus,
} from "./users.api";
import type { AdminUser } from "./users.types";

const ROLE_OPTIONS = ["ADMIN", "ENGINEER", "FINANCE"];

const Users = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState({
    role: "",
    status: "",
    verified: "",
  });
  const [draftFilters, setDraftFilters] = useState(filters);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminUser[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notifyToast, setNotifyToast] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: "status" | "role";
    userId: string;
    nextStatus?: boolean;
    nextRole?: string;
  } | null>(null);
  const [roleDraft, setRoleDraft] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const queryParams = useMemo(
    () => ({
      ...filters,
      search: debouncedSearch,
      page,
      limit: 10,
    }),
    [filters, page, debouncedSearch]
  );

  useEffect(() => {
    const id = setTimeout(() => {
      const value = searchTerm.trim();
      setDebouncedSearch(value.length >= 1 ? value : "");
    }, 500);
    return () => clearTimeout(id);
  }, [searchTerm]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchUsers(queryParams)
      .then((res) => {
        if (!active) return;
        setData(res.items);
        setTotalPages(res.totalPages);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || "Failed to load users");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [queryParams]);

  const applyFilters = () => {
    setError(null);
    setFilters(draftFilters);
    setPage(1);
  };

  const clearFilters = () => {
    setError(null);
    const cleared = { role: "", status: "", verified: "" };
    setSearchTerm("");
    setFilters(cleared);
    setDraftFilters(cleared);
    setPage(1);
  };

  const requestRoleChange = (user: AdminUser, nextRole: string) => {
    setError(null);
    if (!nextRole || nextRole === user.role) {
      setRoleDraft((prev) => ({ ...prev, [user.id]: user.role || "" }));
      setPendingAction(null);
      setConfirmOpen(false);
      return;
    }
    setRoleDraft((prev) => ({ ...prev, [user.id]: nextRole }));
    setPendingAction({ type: "role", userId: user.id, nextRole });
    setConfirmOpen(true);
  };

  const requestStatusToggle = (user: AdminUser) => {
    setError(null);
    const nextStatus = !user.is_active;
    setPendingAction({ type: "status", userId: user.id, nextStatus });
    setConfirmOpen(true);
  };

  const confirmPendingAction = async () => {
    if (!pendingAction) return;
    const user = data.find((u) => u.id === pendingAction.userId) || selected;
    if (!user) return;

    setError(null);
    setUpdatingId(user.id);
    try {
      if (pendingAction.type === "role" && pendingAction.nextRole) {
        await updateUserRole(user.id, pendingAction.nextRole);
        setData((prev) =>
          prev.map((item) =>
            item.id === user.id ? { ...item, role: pendingAction.nextRole! } : item
          )
        );
        if (selected?.id === user.id) {
          setSelected({ ...user, role: pendingAction.nextRole });
        }
        setRoleDraft((prev) => ({ ...prev, [user.id]: pendingAction.nextRole! }));
      }
      if (pendingAction.type === "status" && typeof pendingAction.nextStatus === "boolean") {
        await updateUserStatus(user.id, pendingAction.nextStatus);
        setData((prev) =>
          prev.map((item) =>
            item.id === user.id ? { ...item, is_active: pendingAction.nextStatus! } : item
          )
        );
        if (selected?.id === user.id) {
          setSelected({ ...user, is_active: pendingAction.nextStatus });
        }
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply change");
    } finally {
      setUpdatingId(null);
      setPendingAction(null);
      setConfirmOpen(false);
    }
  };

  const handleNotify = async (user: AdminUser) => {
    setError(null);
    setUpdatingId(user.id);
    try {
      await notifyUnverifiedUser(user.id);
      setError(null);
      setNotifyToast(true);
      setTimeout(() => setNotifyToast(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to notify user");
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (!adminPassword.trim()) {
      setDeleteError("Admin password is required.");
      return;
    }
    setError(null);
    setUpdatingId(deleteTarget.id);
    try {
      await deleteUser(deleteTarget.id, adminPassword.trim());
      setData((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      if (selected?.id === deleteTarget.id) {
        setSelected(null);
      }
      setDeleteTarget(null);
      setAdminPassword("");
      setDeleteError(null);
      setError(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setUpdatingId(null);
    }
  };

  const requestDeleteUser = (user: AdminUser) => {
    setError(null);
    setDeleteTarget(user);
    setAdminPassword("");
    setDeleteError(null);
  };

  return (
    <div className="users-page">
      <Header title="Users" subtitle="Manage client access and roles" />

      {error ? <div className="alert">{error}</div> : null}

      <section className="panel filters-panel">
        <div className="search-row">
          <div className="filter-field">
            <label>Search</label>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search user, company"
              name="admin_user_search"
              autoComplete="off"
            />
          </div>
        </div>
        <div className="filters-row">
          <div className="filter-field">
            <label>Role</label>
            <select
            title="Role"
              value={draftFilters.role}
              onChange={(e) =>
                setDraftFilters({ ...draftFilters, role: e.target.value })
              }
            >
              <option value="">All</option>
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-field">
            <label>Status</label>
            <select
              aria-label="Status"
              value={draftFilters.status}
              onChange={(e) =>
                setDraftFilters({ ...draftFilters, status: e.target.value })
              }
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
          <div className="filter-field">
            <label>Verified</label>
            <select
              aria-label="Verified"
              value={draftFilters.verified}
              onChange={(e) =>
                setDraftFilters({ ...draftFilters, verified: e.target.value })
              }
            >
              <option value="">All</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </select>
          </div>
          <div className="filter-actions">
            <button className="ghost-btn" onClick={clearFilters}>
              Clear
            </button>
            <button className="ghost-btn ghost-btn--primary" onClick={applyFilters}>
              Apply Filters
            </button>
          </div>
        </div>
      </section>

      <section className="panel users-table">
        {loading ? (
          <div className="muted">Loading users...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Company</th>
                <th>Role</th>
                <th>Status</th>
                <th>Verified</th>
                <th>Created</th>
                <th className="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="muted">
                    No users found.
                  </td>
                </tr>
              ) : (
                data.map((user) => (
                  <tr key={user.id} onClick={() => setSelected(user)}>
                    <td>
                      <div className="cell-primary">{user.full_name}</div>
                      <div className="muted">{user.email}</div>
                    </td>
                    <td>
                      <div className="cell-primary">{user.client?.name || "—"}</div>
                      <div className="muted">{user.client?.email || ""}</div>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <select
                        aria-label="Role"
                        value={roleDraft[user.id] ?? user.role ?? ""}
                        onChange={(e) => requestRoleChange(user, e.target.value)}
                        disabled={updatingId === user.id}
                      >
                        <option value="" disabled>
                          Unassigned
                        </option>
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span className={`badge ${user.is_active ? "badge--success" : "badge--failed"}`}>
                        {user.is_active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${user.is_verified ? "badge--success" : "badge--warning"}`}>
                        {user.is_verified ? "Verified" : "Unverified"}
                      </span>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="actions-col" onClick={(e) => e.stopPropagation()}>
                      <div className="actions-cell">
                        <button
                          className="ghost-btn"
                          onClick={() => requestStatusToggle(user)}
                          disabled={updatingId === user.id}
                        >
                          {user.is_active ? "Disable" : "Enable"}
                        </button>
                        <button
                          className="ghost-btn ghost-btn--danger"
                          onClick={() => requestDeleteUser(user)}
                          disabled={updatingId === user.id}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </section>

      {totalPages > 1 && (
        <div className="pagination">
          <button className="ghost-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Prev
          </button>
          <span className="muted">
            Page {page} of {totalPages}
          </span>
          <button
            className="ghost-btn"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">{selected.full_name}</div>
                <div className="muted">{selected.email}</div>
              </div>
              <button className="ghost-btn" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-row">
                <div className="modal-label">Client</div>
                <div>
                  <div className="modal-value">{selected.client?.name || "—"}</div>
                  <div className="muted">{selected.client?.email || ""}</div>
                </div>
              </div>
              <div className="modal-row">
                <div className="modal-label">Role</div>
                <select
                  aria-label="Role"
                  value={roleDraft[selected.id] ?? selected.role ?? ""}
                  onChange={(e) => requestRoleChange(selected, e.target.value)}
                  disabled={updatingId === selected.id}
                >
                  <option value="" disabled>
                    Unassigned
                  </option>
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-row">
                <div className="modal-label">Status</div>
                <div className="modal-value">
                  {selected.is_active ? "Active" : "Disabled"}
                </div>
              </div>
              <div className="modal-row">
                <div className="modal-label">Verified</div>
                <div className="modal-value">
                  {selected.is_verified ? "Verified" : "Unverified"}
                </div>
              </div>
              <div className="modal-row">
                <div className="modal-label">Created</div>
                <div className="modal-value">
                  {new Date(selected.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="modal-actions">
              {notifyToast ? (
                <div className="modal-toast">Reminder email sent.</div>
              ) : null}
              {!selected.is_verified ? (
                <button
                  className="ghost-btn ghost-btn--primary"
                  onClick={() => handleNotify(selected)}
                  disabled={updatingId === selected.id}
                >
                  Notify
                </button>
              ) : null}
              <button
                className="primary-btn"
                onClick={() => requestStatusToggle(selected)}
                disabled={updatingId === selected.id}
              >
                {selected.is_active ? "Disable User" : "Enable User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="modal modal--compact" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Confirm Deletion</div>
                <div className="muted">{deleteTarget.email}</div>
              </div>
              <button className="ghost-btn" onClick={() => setDeleteTarget(null)}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-row">
                <div className="modal-label">User</div>
                <div className="modal-value">{deleteTarget.full_name}</div>
              </div>
              <div className="modal-row">
                <div className="modal-label">Password</div>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="KCX admin password"
                  name="admin_delete_password"
                  autoComplete="current-password"
                />
              </div>
              {deleteError ? <div className="alert">{deleteError}</div> : null}
            </div>
            <div className="modal-actions">
              <button className="ghost-btn" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button
                className="ghost-btn ghost-btn--danger"
                onClick={confirmDelete}
                disabled={updatingId === deleteTarget.id}
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmOpen && pendingAction ? (
        <div className="modal-backdrop" onClick={() => setConfirmOpen(false)}>
          <div className="modal modal--compact" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Confirm Action</div>
                <div className="muted">
                  {pendingAction.type === "role"
                    ? "Change role for this user"
                    : pendingAction.nextStatus
                    ? "Disable this user"
                    : "Enable this user"}
                </div>
              </div>
              <button className="ghost-btn" onClick={() => setConfirmOpen(false)}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-row">
                <div className="modal-label">User</div>
                <div className="modal-value">
                  {data.find((u) => u.id === pendingAction.userId)?.email ||
                    selected?.email ||
                    "—"}
                </div>
              </div>
              {pendingAction.type === "role" ? (
                <div className="modal-row">
                  <div className="modal-label">New Role</div>
                  <div className="modal-value">{pendingAction.nextRole}</div>
                </div>
              ) : null}
            </div>
            <div className="modal-actions">
              <button className="ghost-btn" onClick={() => setConfirmOpen(false)}>
                Cancel
              </button>
              <button className="ghost-btn ghost-btn--primary" onClick={confirmPendingAction}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Users;
