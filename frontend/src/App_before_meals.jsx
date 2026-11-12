
import { useState, useEffect } from "react";
import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Workouts from "./pages/Workouts";
import Progress from "./pages/Progress";
import Goals from "./pages/Goals";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import WorkoutPlans from "./pages/WorkoutPlans";
import Exercises from "./pages/Exercises";
import Streaks from "./pages/Streaks";
import Badges from "./pages/Badges";
import DashboardOverview from "./pages/DashboardOverview";
import "./Dashboard.css";

const API = "http://127.0.0.1:8000";

// Protected Route
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("fittrack_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Register Page
function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await axios.post(`${API}/auth/register`, form);

      setMessage("Registration successful! Please login.");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Registration failed."
      );
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>FitTrack</h1>
        <p className="subtitle">Create your account</p>

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <label>Username</label>
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="Enter username"
            minLength="3"
            maxLength="50"
            required
          />

          <label>Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Enter email"
            required
          />

          <label>Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Minimum 8 characters"
            minLength="8"
            maxLength="72"
            required
          />

          <button type="submit">Create Account</button>
        </form>

        <p className="auth-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

// Login Page
function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const formData = new URLSearchParams();

      formData.append("username", username);
      formData.append("password", password);

      const response = await axios.post(
        `${API}/auth/login`,
        formData,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      localStorage.setItem(
        "fittrack_token",
        response.data.access_token
      );

      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.detail || "Login failed."
      );
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>FitTrack</h1>
        <p className="subtitle">Welcome back! Login to continue.</p>

        {error && <p className="error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <label>Username or Email</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username or email"
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
          />

          <button type="submit">Login</button>
        </form>

        <p className="auth-link">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}

// Dashboard Page
function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function loadProfile() {
      const token = localStorage.getItem("fittrack_token");

      try {
        const response = await axios.get(`${API}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUser(response.data);
try {
  const notificationResponse = await axios.get(
    `${API}/notifications/unread-count`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  setUnreadCount(notificationResponse.data.unread_count);
} catch (notificationError) {
  console.error("Unable to load notification count");
}
      } catch (err) {
        localStorage.removeItem("fittrack_token");
        setError("Session expired. Please login again.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  function handleLogout() {
    localStorage.removeItem("fittrack_token");
    navigate("/login");
  }

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (!user) {
    return (
      <div className="loading">
        {error || "Unable to load profile."}
        <br />
        <Link to="/login">Go to Login</Link>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <nav className="navbar">
  <h2>FitTrack</h2>

  <div className="navbar-actions">
    <Link to="/notifications" className="notification-bell">
      🔔
      {unreadCount > 0 && (
        <span className="notification-badge">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>

    <button className="logout-btn" onClick={handleLogout}>
      Logout
    </button>
  </div>
</nav>
      <main className="dashboard-content">
        <h1>Welcome, {user.username}!</h1>
        <p className="subtitle">
          Your fitness journey starts here.
        </p>
        <DashboardOverview />

        <div className="profile-card">
          <h2>My Profile</h2>
          <p><strong>User ID:</strong> {user.id}</p>
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Email:</strong> {user.email}</p>
        </div>

        <h2 className="section-title">My Fitness Dashboard</h2>

        
<div className="dashboard-grid">

  <Link to="/workouts" className="feature-card">
    <span>💪</span>
    <h3>Workouts</h3>
    <p>Manage your daily workouts.</p>
  </Link>

  <Link to="/progress" className="feature-card">
    <span>📊</span>
    <h3>Progress</h3>
    <p>Track your fitness progress.</p>
  </Link>

  <Link to="/workout-plans" className="feature-card">
    <span>📅</span>
    <h3>Workout Planner</h3>
    <p>Schedule and manage your upcoming workouts.</p>
  </Link>

  <Link to="/exercises" className="feature-card">
    <span>🏋️</span>
    <h3>Exercise Library</h3>
    <p>Browse, search and manage exercises.</p>
  </Link>

  <Link to="/goals" className="feature-card">
    <span>🎯</span>
    <h3>Goals</h3>
    <p>Set and track your fitness goals.</p>
  </Link>

  <Link to="/analytics" className="feature-card">
    <span>📈</span>
    <h3>Analytics</h3>
    <p>View your fitness analytics and statistics.</p>
  </Link>

  <Link to="/profile" className="feature-card">
    <span>👤</span>
    <h3>My Profile</h3>
    <p>View and update your account details.</p>
  </Link>

  <Link to="/notifications" className="feature-card">
    <span>🔔</span>
    <h3>Notifications</h3>
    <p>View workout reminders and goal alerts.</p>
  </Link>

  <Link to="/streaks" className="feature-card">
    <span>🔥</span>
    <h3>Workout Streaks</h3>
    <p>Track your current and longest workout streaks.</p>
  </Link>
  <Link to="/badges" className="feature-card">
    <span>🏆</span>
    <h3>Achievement Badges</h3>
    <p>View your earned badges and fitness achievements.</p>
  </Link>

</div>
      </main>
    </div>
  );
}

// Main Application
function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
 <Route
  path="/workouts"
  element={
    <ProtectedRoute>
      <Workouts />
    </ProtectedRoute>
  }
/>
<Route
  path="/progress"
  element={
    <ProtectedRoute>
      <Progress />
    </ProtectedRoute>
  }
/>
<Route
  path="/goals"
  element={
    <ProtectedRoute>
      <Goals />
    </ProtectedRoute>
  }
/>
<Route
  path="/analytics"
  element={
    <ProtectedRoute>
      <Analytics />
    </ProtectedRoute>
  }
/>
<Route
  path="/profile"
  element={
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  }
/>
<Route
  path="/notifications"
  element={
    <ProtectedRoute>
      <Notifications />
    </ProtectedRoute>
  }
/>
      <Route
        path="/workout-plans"
        element={
          <ProtectedRoute>
            <WorkoutPlans />
          </ProtectedRoute>
        }
      />
<Route
  path="/exercises"
  element={
    <ProtectedRoute>
      <Exercises />
    </ProtectedRoute>
  }
/>
<Route
  path="/streaks"
  element={
    <ProtectedRoute>
      <Streaks />
    </ProtectedRoute>
  }
/>
<Route
  path="/badges"
  element={
    <ProtectedRoute>
      <Badges />
    </ProtectedRoute>
  }
/>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;

