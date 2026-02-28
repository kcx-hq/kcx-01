import { useEffect, useMemo, useState } from "react";
import { fetchOverview } from "./overview.api";
import type { OverviewResponse } from "./overview.types";
import Header from "../../components/Header";
import StatCard from "../../components/StatCard";
import { adminLogout } from "../auth/auth.api";

const Overview = () => {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [scopeDays, setScopeDays] = useState(7);

  const scopeLabel = useMemo(() => {
    if (scopeDays >= 365) return "All time";
    return `Last ${scopeDays} days`;
  }, [scopeDays]);

  useEffect(() => {
    let active = true;
    setError(null);
    fetchOverview(false, scopeDays)
      .then((res) => {
        if (active) {
          setData(res);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || "Failed to load overview");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [scopeDays]);

  if (loading) {
    return (
      <div>
        <Header title="Overview" subtitle="Loading data" />
        <div className="panel">Loading overview data.</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <Header title="Overview" subtitle="Error" />
        <div className="panel">{error || "No data"}</div>
      </div>
    );
  }

  const uploadByStatus = data.uploads.byStatus;

  const handleLogout = async () => {
    try {
      await adminLogout();
      window.location.href = "/login";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logout failed");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetchOverview(true, scopeDays);
      setData(res);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div>
      <Header
        title="Overview"
        subtitle={`Generated ${new Date(data.meta.generatedAt).toLocaleDateString()}`}
        onLogout={handleLogout}
      />

      {data.meta.warnings && data.meta.warnings.length > 0 ? (
        <div className="alert">{data.meta.warnings[0]}</div>
      ) : null}

      <div className="header-meta">
        <div className={`chip status-${data.systemStatus?.level || "operational"}`}>
          {data.systemStatus?.message || "All systems operational"}
        </div>
        <button className="logout-btn" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? "Refreshing" : "Refresh"}
        </button>
      </div>

      <div className="scope-select">
        <label htmlFor="scope">Time Scope</label>
        <select
          id="scope"
          value={scopeDays}
          onChange={(event) => setScopeDays(Number(event.target.value))}
        >
          <option value={1}>Last 24h</option>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={365}>All time</option>
        </select>
        <span className="muted">Generated at {new Date(data.meta.generatedAt).toLocaleTimeString()}</span>
      </div>

      <section className="section">
        <h2>Requires Attention</h2>
        <div className="panel">
          {data.attention && data.attention.length > 0 ? (
            <div className="attention-list">
              {data.attention.map((item) => (
                <div className={`attention-item ${item.severity}`} key={item.type}>
                  <div className="attention-title">{item.message}</div>
                  <div className={`badge badge--${item.severity}`}>
                    {item.severity.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="activity-item">No attention items.</div>
          )}
        </div>
      </section>

      <section className="section">
        <h2>Platform Snapshot</h2>
        <div className="card-grid">
          <StatCard label="Users" value={data.users.total} helper={`+${data.users.recent} in ${scopeLabel.toLowerCase()}`} tone="blue" />
          <StatCard label="Inquiries" value={data.inquiries.total} helper={`${data.inquiries.pending} pending`} tone="orange" />
          <StatCard
            label="AWS Connections"
            value={data.awsConnections?.total ?? 0}
            helper={`Errors ${data.awsConnections?.withErrors ?? 0}`}
            tone="red"
          />
        </div>
      </section>

      <section className="section">
        <h2>Ingestion Status</h2>
        <div className="card-grid">
          <StatCard label="Uploads Total" value={data.uploads.total} />
          <StatCard label="Uploads Completed" value={uploadByStatus.COMPLETED || 0} />
          <StatCard label="Uploads Failed" value={uploadByStatus.FAILED || 0} tone="red" />
        </div>
      </section>

      <section className="section">
        <div className="panel">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            {data.activity.length === 0 && (
              <div className="activity-item">No recent activity.</div>
            )}
            {data.activity.map((item) => (
              <div className="activity-item" key={`${item.type}-${item.entityId}-${item.timestamp}`}>
                <div>
                  <div className="event-title">{item.type.replace(/_/g, " ")}</div>
                  <div className="muted">
                    {item.label ? `Entity: ${item.label}` : `ID: ${item.entityId}`}
                  </div>
                </div>
                <div
                  className={`badge ${
                    item.status === "FAILED"
                      ? "badge--failed"
                      : item.status === "COMPLETED"
                      ? "badge--success"
                      : ""
                  }`.trim()}
                >
                  {item.status || new Date(item.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Overview;
