
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

import api from "../services/api";
import "./AdvancedAnalytics.css";

const COLORS = ["#16a34a", "#f59e0b", "#64748b"];

function AdvancedAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/analytics/advanced");
      setData(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to load advanced analytics."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return <div className="advanced-loading">Loading analytics...</div>;
  }

  if (error) {
    return (
      <div className="advanced-error">
        <p>{error}</p>
        <button onClick={fetchAnalytics}>Try Again</button>
      </div>
    );
  }

  if (!data) {
    return <div className="advanced-loading">No analytics available.</div>;
  }

  const goals = data.goal_statistics;
  const consistency = data.workout_consistency;

  const goalChartData = [
    { name: "Completed", value: goals.completed_goals },
    { name: "Active", value: goals.active_goals },
    {
      name: "Other",
      value: Math.max(
        0,
        goals.total_goals -
        goals.completed_goals -
        goals.active_goals
      )
    }
  ];

  return (
    <div className="advanced-analytics-page">
      <div className="advanced-header">
        <h1>Advanced Analytics</h1>
        <p>Track your fitness performance and consistency.</p>
        <button onClick={fetchAnalytics}>Refresh Data</button>
      </div>

      <div className="advanced-summary-grid">
        <div className="advanced-card">
          <h3>Total Goals</h3>
          <h2>{goals.total_goals}</h2>
        </div>

        <div className="advanced-card">
          <h3>Completed Goals</h3>
          <h2>{goals.completed_goals}</h2>
        </div>

        <div className="advanced-card">
          <h3>Goal Completion</h3>
          <h2>{goals.completion_percentage}%</h2>
        </div>

        <div className="advanced-card">
          <h3>Workout Consistency</h3>
          <h2>{consistency.consistency_percentage}%</h2>
        </div>
      </div>

      <div className="advanced-chart-grid">
        <div className="advanced-chart-card">
          <h2>Weekly Workout Trend</h2>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.weekly_trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => value.slice(5)}
              />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="workouts"
                name="Workouts"
                fill="#2563eb"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="advanced-chart-card">
          <h2>Goal Completion Statistics</h2>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={goalChartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {goalChartData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={COLORS[index]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="advanced-detail-grid">
        <div className="advanced-detail-card">
          <h2>Average Goal Progress</h2>
          <h1>{goals.average_goal_progress}%</h1>
          <div className="advanced-progress-track">
            <div
              className="advanced-progress-fill"
              style={{
                width: `${Math.min(
                  goals.average_goal_progress,
                  100
                )}%`
              }}
            />
          </div>
        </div>

        <div className="advanced-detail-card">
          <h2>Workout Consistency</h2>
          <h1>
            {consistency.active_workout_days} /{" "}
            {consistency.period_days} days
          </h1>
          <p>
            Number of days you completed at least one workout
            during the last 30 days.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdvancedAnalytics;
