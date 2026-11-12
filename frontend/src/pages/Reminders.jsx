
import { useEffect, useState } from "react";
import api from "../services/api";
import "./Reminders.css";

function Reminders() {
  const today = new Date().toLocaleDateString("en-CA");

  const emptyForm = {
    title: "",
    description: "",
    reminder_type: "CUSTOM",
    reminder_date: today,
    reminder_time: "07:00",
  };

  const [reminders, setReminders] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchReminders = async () => {
    try {
      setError("");
      const response = await api.get("/reminders/");
      setReminders(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to load reminders."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        ...form,
        reminder_time:
          form.reminder_time.length === 5
            ? `${form.reminder_time}:00`
            : form.reminder_time,
      };

      if (editingId) {
        await api.put(`/reminders/${editingId}`, payload);
        setSuccess("Reminder updated successfully!");
      } else {
        await api.post("/reminders/", payload);
        setSuccess("Reminder created successfully!");
      }

      resetForm();
      await fetchReminders();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Unable to save reminder."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (reminder) => {
    setEditingId(reminder.id);
    setForm({
      title: reminder.title,
      description: reminder.description || "",
      reminder_type: reminder.reminder_type,
      reminder_date: reminder.reminder_date,
      reminder_time: reminder.reminder_time.slice(0, 5),
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleComplete = async (reminder) => {
    try {
      await api.put(`/reminders/${reminder.id}`, {
        is_completed: !reminder.is_completed,
      });
      setSuccess("Reminder status updated!");
      await fetchReminders();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Unable to update reminder."
      );
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this reminder?")) {
      return;
    }

    try {
      await api.delete(`/reminders/${id}`);
      setSuccess("Reminder deleted successfully!");
      await fetchReminders();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Unable to delete reminder."
      );
    }
  };

  const upcomingCount = reminders.filter(
    (item) => !item.is_completed && item.reminder_date >= today
  ).length;

  const completedCount = reminders.filter(
    (item) => item.is_completed
  ).length;

  return (
    <div className="reminders-page">
      <div className="reminders-header">
        <div>
          <h1>My Reminders</h1>
          <p>Plan your workouts and stay on track with your goals.</p>
        </div>
      </div>

      <div className="reminder-summary">
        <div className="reminder-summary-card">
          <h2>{reminders.length}</h2>
          <p>Total Reminders</p>
        </div>

        <div className="reminder-summary-card">
          <h2>{upcomingCount}</h2>
          <p>Upcoming Reminders</p>
        </div>

        <div className="reminder-summary-card">
          <h2>{completedCount}</h2>
          <p>Completed Reminders</p>
        </div>
      </div>

      <div className="reminder-form-card">
        <h2>{editingId ? "Edit Reminder" : "Create New Reminder"}</h2>

        <form onSubmit={handleSubmit}>
          <div className="reminder-form-grid">
            <div className="reminder-field">
              <label>Reminder Title</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Example: Morning Workout"
                minLength="3"
                maxLength="100"
                required
              />
            </div>

            <div className="reminder-field">
              <label>Reminder Type</label>
              <select
                name="reminder_type"
                value={form.reminder_type}
                onChange={handleChange}
              >
                <option value="WORKOUT">Workout</option>
                <option value="GOAL">Goal</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>

            <div className="reminder-field">
              <label>Date</label>
              <input
                type="date"
                name="reminder_date"
                value={form.reminder_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="reminder-field">
              <label>Time</label>
              <input
                type="time"
                name="reminder_time"
                value={form.reminder_time}
                onChange={handleChange}
                required
              />
            </div>

            <div className="reminder-field full-width">
              <label>Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Enter reminder details..."
                rows="3"
              />
            </div>
          </div>

          <div className="reminder-form-actions">
            <button type="submit" disabled={saving}>
              {saving
                ? "Saving..."
                : editingId
                ? "Update Reminder"
                : "Create Reminder"}
            </button>

            {editingId && (
              <button
                type="button"
                className="cancel-reminder-btn"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {error && <div className="reminder-error">{error}</div>}
      {success && <div className="reminder-success">{success}</div>}

      <div className="reminder-list-section">
        <h2>Scheduled Reminders</h2>

        {loading ? (
          <p>Loading reminders...</p>
        ) : reminders.length === 0 ? (
          <div className="empty-reminders">
            <h3>No reminders yet</h3>
            <p>Create your first reminder using the form above.</p>
          </div>
        ) : (
          <div className="reminder-list">
            {reminders.map((item) => (
              <div
                className={`reminder-card ${
                  item.is_completed ? "completed" : ""
                }`}
                key={item.id}
              >
                <div className="reminder-card-content">
                  <div className="reminder-card-top">
                    <span className={`reminder-type ${item.reminder_type.toLowerCase()}`}>
                      {item.reminder_type}
                    </span>

                    <span className="reminder-status">
                      {item.is_completed ? "Completed" : "Pending"}
                    </span>
                  </div>

                  <h3>{item.title}</h3>

                  {item.description && <p>{item.description}</p>}

                  <div className="reminder-date-time">
                    <span>Date: {item.reminder_date}</span>
                    <span>
                      Time: {item.reminder_time.slice(0, 5)}
                    </span>
                  </div>
                </div>

                <div className="reminder-card-actions">
                  <button onClick={() => handleComplete(item)}>
                    {item.is_completed ? "Undo" : "Complete"}
                  </button>

                  <button
                    className="edit-reminder-btn"
                    onClick={() => handleEdit(item)}
                  >
                    Edit
                  </button>

                  <button
                    className="delete-reminder-btn"
                    onClick={() => handleDelete(item.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Reminders;
