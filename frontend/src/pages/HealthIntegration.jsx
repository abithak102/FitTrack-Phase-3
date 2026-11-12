
import { useEffect, useState } from "react";
import api from "../services/api";
import "./HealthIntegration.css";

function HealthIntegration() {
  const [platform, setPlatform] = useState("ANDROID");
  const [summary, setSummary] = useState({});
  const [connections, setConnections] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [dataType, setDataType] = useState("STEPS");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("steps");
  const [recordedAt, setRecordedAt] = useState("");
  const [externalId, setExternalId] = useState("");

  const loadHealthData = async () => {
    try {
      setLoading(true);
      const [summaryResponse, historyResponse] = await Promise.all([
        api.get("/health-sync/summary"),
        api.get("/health-sync/history"),
      ]);

      setSummary(summaryResponse.data.health_summary || {});
      setConnections(summaryResponse.data.connections || []);
      setHistory(historyResponse.data || []);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to load health integration data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealthData();
  }, []);

  const handleConnect = async () => {
    try {
      setMessage("");
      setError("");

      await api.post("/health-sync/connect", {
        platform,
      });

      setMessage(
        `${platform} backend registration completed. Native device permission is not verified.`
      );

      await loadHealthData();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Platform registration failed."
      );
    }
  };

  const handleSync = async (e) => {
    e.preventDefault();

    if (!value || Number(value) < 0 || !recordedAt || !externalId.trim()) {
      setError("Please enter a valid value, date/time and external record ID.");
      return;
    }

    try {
      setMessage("");
      setError("");

      const record = {
        source: platform,
        data_type: dataType,
        value: Number(value),
        unit: unit.trim(),
        recorded_at: new Date(recordedAt).toISOString(),
        external_record_id: externalId.trim(),
      };

      const response = await api.post("/health-sync/sync", {
        source: platform,
        records: [record],
      });

      setMessage(response.data.message);
      setValue("");
      setExternalId("");

      await loadHealthData();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Health data synchronization failed."
      );
    }
  };

  const handleDisconnect = async (selectedPlatform) => {
    const confirmed = window.confirm(
      `Disconnect ${selectedPlatform} backend registration?`
    );

    if (!confirmed) return;

    try {
      setMessage("");
      setError("");

      const response = await api.delete(
        `/health-sync/disconnect/${selectedPlatform}`
      );

      setMessage(response.data.message);
      await loadHealthData();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Unable to disconnect platform."
      );
    }
  };

  return (
    <div className="health-page">
      <div className="health-header">
        <div>
          <h1>Health Integration</h1>
          <p>
            View health data and test synchronization with FitTrack.
          </p>
        </div>

        <button
          className="health-refresh-btn"
          onClick={loadHealthData}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh Data"}
        </button>
      </div>

      <div className="health-notice">
        <strong>Development mode:</strong> Platform registration below is
        for backend API testing only. It does not request or verify
        Health Connect or Apple HealthKit permissions.
      </div>

      {message && <div className="health-success">{message}</div>}
      {error && <div className="health-error">{error}</div>}

      <section className="health-section">
        <h2>Platform Registration</h2>

        <div className="health-connect-controls">
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          >
            <option value="ANDROID">Android Health Connect</option>
            <option value="APPLE">Apple HealthKit</option>
          </select>

          <button onClick={handleConnect}>
            Register Platform
          </button>
        </div>

        <div className="health-platform-grid">
          {["ANDROID", "APPLE"].map((item) => {
            const connection = connections.find(
              (entry) => entry.platform === item
            );

            return (
              <div className="health-platform-card" key={item}>
                <h3>
                  {item === "ANDROID"
                    ? "Android Health Connect"
                    : "Apple HealthKit"}
                </h3>

                <p>
                  Backend status:{" "}
                  <strong
                    className={
                      connection?.is_connected
                        ? "health-connected"
                        : "health-disconnected"
                    }
                  >
                    {connection?.is_connected
                      ? "Registered"
                      : "Not registered"}
                  </strong>
                </p>

                <p>
                  Last sync:{" "}
                  {connection?.last_sync_at
                    ? new Date(connection.last_sync_at).toLocaleString()
                    : "Not synced"}
                </p>

                {connection?.is_connected && (
                  <button
                    className="health-disconnect-btn"
                    onClick={() => handleDisconnect(item)}
                  >
                    Disconnect
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="health-section">
        <h2>Manual Health Data Sync – API Test</h2>

        <form className="health-sync-form" onSubmit={handleSync}>
          <label>Platform</label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          >
            <option value="ANDROID">Android</option>
            <option value="APPLE">Apple</option>
          </select>

          <label>Health Data Type</label>
          <select
            value={dataType}
            onChange={(e) => {
              const selected = e.target.value;
              setDataType(selected);

              const units = {
                STEPS: "steps",
                ACTIVE_CALORIES: "kcal",
                DISTANCE: "km",
                WORKOUT: "minutes",
                HEART_RATE: "bpm",
              };

              setUnit(units[selected]);
            }}
          >
            <option value="STEPS">Steps</option>
            <option value="ACTIVE_CALORIES">Active Calories</option>
            <option value="DISTANCE">Distance</option>
            <option value="WORKOUT">Workout</option>
            <option value="HEART_RATE">Heart Rate</option>
          </select>

          <label>Value</label>
          <input
            type="number"
            min="0"
            step="any"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter value"
            required
          />

          <label>Unit</label>
          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            maxLength={20}
            required
          />

          <label>Recorded Date and Time</label>
          <input
            type="datetime-local"
            value={recordedAt}
            onChange={(e) => setRecordedAt(e.target.value)}
            required
          />

          <label>External Record ID</label>
          <input
            type="text"
            value={externalId}
            onChange={(e) => setExternalId(e.target.value)}
            maxLength={150}
            placeholder="Example: test-steps-001"
            required
          />

          <button type="submit">Sync Test Record</button>
        </form>
      </section>

      <section className="health-section">
        <h2>Health Summary</h2>

        {Object.keys(summary).length === 0 ? (
          <p className="health-empty">No health records available yet.</p>
        ) : (
          <div className="health-summary-grid">
            {Object.entries(summary).map(([key, item]) => (
              <div className="health-summary-card" key={key}>
                <h3>{key.replaceAll("_", " ")}</h3>
                <p>
                  {Number(item.total).toLocaleString()} {item.unit}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="health-section">
        <h2>Synchronization History</h2>

        {history.length === 0 ? (
          <p className="health-empty">No synchronization history found.</p>
        ) : (
          <div className="health-table-wrapper">
            <table className="health-table">
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Status</th>
                  <th>Records Synced</th>
                  <th>Message</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td>{item.platform}</td>
                    <td>{item.status}</td>
                    <td>{item.records_synced}</td>
                    <td>{item.message || "-"}</td>
                    <td>
                      {new Date(item.synced_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default HealthIntegration;
