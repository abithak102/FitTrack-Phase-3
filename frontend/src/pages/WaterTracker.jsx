
import { useEffect, useState } from "react";
import api from "../services/api";
import "./WaterTracker.css";

function getToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function WaterTracker() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [goal, setGoal] = useState("2000");
  const [amount, setAmount] = useState("250");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchWaterData = async () => {
    try {
      setLoading(true);
      setError("");

      const today = getToday();

      const [recordsResponse, summaryResponse] = await Promise.all([
        api.get("/water/", { params: { target_date: today } }),
        api.get("/water/daily-summary", { params: { target_date: today } }),
      ]);

      setRecords(recordsResponse.data);
      setSummary(summaryResponse.data);
      setGoal(String(summaryResponse.data.daily_goal_ml));
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to load water data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaterData();
  }, []);

  const handleAddWater = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      await api.post("/water/", {
        amount_ml: Number(amount),
        intake_date: getToday(),
      });

      setSuccess(`${amount} ml water intake added successfully!`);
      await fetchWaterData();
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to add water intake.");
    }
  };

  const handleSaveGoal = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      await api.put("/water/goal", {
        daily_goal_ml: Number(goal),
      });

      setSuccess("Daily water goal updated successfully!");
      await fetchWaterData();
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to update water goal.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this water intake record?")) return;

    setError("");
    setSuccess("");

    try {
      await api.delete(`/water/${id}`);
      setSuccess("Water intake record deleted successfully!");
      await fetchWaterData();
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to delete record.");
    }
  };

  const percentage = Math.min(
    Number(summary?.completion_percentage || 0),
    100
  );

  return (
    <div className="water-page">
      <header className="water-header">
        <h1>Water Intake Tracker</h1>
        <p>Stay hydrated and monitor your daily water consumption.</p>
      </header>

      {error && <p className="water-error">{error}</p>}
      {success && <p className="water-success">{success}</p>}

      <section className="water-summary">
        <h2>Today's Hydration</h2>

        {loading ? (
          <p>Loading water data...</p>
        ) : (
          <>
            <div className="water-total">
              <h3>{summary?.total_intake_ml ?? 0} ml</h3>
              <p>Water consumed today</p>
            </div>

            <div className="water-progress-track">
              <div
                className="water-progress-fill"
                style={{ width: `${percentage}%` }}
              />
            </div>

            <p className="water-percentage">
              {summary?.completion_percentage ?? 0}% of daily goal
            </p>

            <div className="water-stats">
              <div>
                <h3>{summary?.daily_goal_ml ?? 2000} ml</h3>
                <p>Daily Goal</p>
              </div>
              <div>
                <h3>{summary?.remaining_ml ?? 2000} ml</h3>
                <p>Remaining</p>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="water-form-section">
        <h2>Add Water Intake</h2>

        <form onSubmit={handleAddWater}>
          <label>Amount of Water (ml)</label>
          <input
            type="number"
            min="1"
            max="10000"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
          />

          <div className="water-quick-buttons">
            {[150, 250, 500, 750].map((value) => (
              <button
                type="button"
                key={value}
                onClick={() => setAmount(String(value))}
              >
                {value} ml
              </button>
            ))}
          </div>

          <button type="submit" className="water-primary-btn">
            Add Water
          </button>
        </form>
      </section>

      <section className="water-goal-section">
        <h2>Daily Water Goal</h2>

        <form onSubmit={handleSaveGoal}>
          <label>Set Daily Goal (ml)</label>
          <input
            type="number"
            min="1"
            max="10000"
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            required
          />

          <button type="submit" className="water-primary-btn">
            Update Goal
          </button>
        </form>
      </section>

      <section className="water-history-section">
        <h2>Today's Water Intake History</h2>

        {loading ? (
          <p>Loading records...</p>
        ) : records.length === 0 ? (
          <p>No water intake records found. Add your first glass of water!</p>
        ) : (
          <div className="water-record-list">
            {records.map((record) => (
              <div className="water-record-card" key={record.id}>
                <div>
                  <h3>{record.amount_ml} ml</h3>
                  <p>{record.intake_date}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(record.id)}
                  className="water-delete-btn"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default WaterTracker;
