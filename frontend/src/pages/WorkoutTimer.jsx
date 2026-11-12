
import { useEffect, useState } from "react";
import api from "../services/api";
import "./WorkoutTimer.css";

function WorkoutTimer() {
  const [workoutName, setWorkoutName] = useState("");
  const [category, setCategory] = useState("Cardio");

  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isRunning || isPaused) return;

    const timer = setInterval(() => {
      setSeconds((previous) => previous + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, isPaused]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;

    return [hours, minutes, remainingSeconds]
      .map((value) => String(value).padStart(2, "0"))
      .join(":");
  };

  const startWorkout = () => {
    if (!workoutName.trim()) {
      setError("Please enter a workout name.");
      return;
    }

    setError("");
    setSuccess("");
    setIsRunning(true);
    setIsPaused(false);
  };

  const pauseWorkout = () => {
    setIsPaused(true);
  };

  const resumeWorkout = () => {
    setIsPaused(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsPaused(false);
    setSeconds(0);
  };

  const stopWorkout = async () => {
    if (seconds < 60) {
      setError("Complete at least 1 minute of workout before saving.");
      return;
    }

    const duration = Math.floor(seconds / 60);

    const caloriesPerMinute = {
      Cardio: 8,
      Strength: 6,
      Yoga: 3,
    };

    const caloriesBurned =
      duration * caloriesPerMinute[category];

    const workoutData = {
      workout_name: workoutName.trim(),
      category: category,
      duration: duration,
      calories_burned: Number(caloriesBurned.toFixed(1)),
      workout_date: new Date().toLocaleDateString("en-CA"),
    };

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await api.post("/workouts/", workoutData);

      setSuccess("Workout completed and saved successfully!");

      resetTimer();
      setWorkoutName("");
      setCategory("Cardio");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to save workout. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="timer-page">
      <div className="timer-header">
        <h1>Workout Timer</h1>
        <p>Start your workout and track your fitness activity live.</p>
      </div>

      <div className="timer-card">
        <div className="timer-form">
          <label>Workout Name</label>
          <input
            type="text"
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            placeholder="Example: Morning Running"
            disabled={isRunning}
          />

          <label>Workout Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={isRunning}
          >
            <option value="Cardio">Cardio</option>
            <option value="Strength">Strength</option>
            <option value="Yoga">Yoga</option>
          </select>
        </div>

        <div className="timer-display">
          <span className="timer-icon">⏱️</span>
          <h2>{formatTime(seconds)}</h2>
          <p>
            {!isRunning
              ? "Ready to start"
              : isPaused
              ? "Workout Paused"
              : "Workout in Progress"}
          </p>
        </div>

        <div className="timer-actions">
          {!isRunning ? (
            <button
              className="timer-start-btn"
              onClick={startWorkout}
              disabled={saving}
            >
              ▶ Start Workout
            </button>
          ) : (
            <>
              {isPaused ? (
                <button
                  className="timer-resume-btn"
                  onClick={resumeWorkout}
                >
                  ▶ Resume
                </button>
              ) : (
                <button
                  className="timer-pause-btn"
                  onClick={pauseWorkout}
                >
                  ⏸ Pause
                </button>
              )}

              <button
                className="timer-stop-btn"
                onClick={stopWorkout}
                disabled={saving}
              >
                {saving ? "Saving..." : "■ Stop & Save"}
              </button>
            </>
          )}
        </div>

        {success && (
          <p className="timer-success">{success}</p>
        )}

        {error && (
          <p className="timer-error">{error}</p>
        )}
      </div>

      <div className="timer-info">
        <h3>Estimated Calories</h3>
        <p>
          {(
            Math.floor(seconds / 60) *
            { Cardio: 8, Strength: 6, Yoga: 3 }[category]
          ).toFixed(1)}{" "}
          kcal
        </p>
        <small>
          This is an approximate estimate based on workout category,
          not an actual measurement.
        </small>
      </div>
    </div>
  );
}

export default WorkoutTimer;
