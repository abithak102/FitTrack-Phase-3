
import { useEffect, useState } from "react";
import api from "../services/api";
import "./AIWorkoutSuggestions.css";

function AIWorkoutSuggestions() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchSuggestions = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/ai-suggestions/");

            setData(response.data);
        } catch (err) {
            console.error("AI Suggestions Error:", err);

            setError(
                err.response?.data?.detail ||
                "Unable to load workout suggestions. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuggestions();
    }, []);

    const getCategoryClass = (category) => {
        return category?.toLowerCase() || "default";
    };

    if (loading) {
        return (
            <div className="ai-loading">
                <div className="ai-spinner"></div>
                <p>Analyzing your fitness activity...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="ai-page">
                <div className="ai-error">
                    <h3>Unable to Load Suggestions</h3>
                    <p>{error}</p>
                    <button onClick={fetchSuggestions}>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!data) {
        return null;
    }

    return (
        <div className="ai-page">

            <div className="ai-header">
                <div>
                    <h1>AI Workout Suggestions</h1>
                    <p>
                        Personalized workout recommendations
                        based on your fitness activity and goals.
                    </p>
                </div>

                <button
                    className="ai-refresh-btn"
                    onClick={fetchSuggestions}
                >
                    Refresh Suggestions
                </button>
            </div>

            <div className="ai-summary-grid">

                <div className="ai-summary-card">
                    <span className="ai-summary-icon">🔥</span>
                    <h3>Current Streak</h3>
                    <strong>{data.current_streak}</strong>
                    <p>Consecutive workout days</p>
                </div>

                <div className="ai-summary-card">
                    <span className="ai-summary-icon">💪</span>
                    <h3>Recent Workouts</h3>
                    <strong>{data.workouts_last_7_days}</strong>
                    <p>Workouts in the last 7 days</p>
                </div>

                <div className="ai-summary-card">
                    <span className="ai-summary-icon">🎯</span>
                    <h3>Active Goals</h3>
                    <strong>{data.active_goals_count}</strong>
                    <p>Your current fitness goals</p>
                </div>

            </div>

            <div className="ai-message">
                <h3>Your Fitness Insight</h3>
                <p>{data.message}</p>

                {data.last_workout_date && (
                    <p>
                        <strong>Last Workout:</strong>{" "}
                        {data.last_workout_date}
                    </p>
                )}
            </div>

            <div className="ai-recommendations-section">
                <h2>Recommended Workouts</h2>

                <p className="ai-section-description">
                    These workouts are selected based on
                    your recent activity and active goals.
                </p>

                <div className="ai-recommendations-grid">

                    {data.recommendations?.map((workout, index) => (
                        <div
                            className="ai-workout-card"
                            key={`${workout.title}-${index}`}
                        >
                            <div className="ai-workout-top">
                                <span className="ai-workout-number">
                                    0{index + 1}
                                </span>

                                <span
                                    className={`ai-category ${getCategoryClass(workout.category)}`}
                                >
                                    {workout.category}
                                </span>
                            </div>

                            <h3>{workout.title}</h3>

                            <div className="ai-workout-details">
                                <div>
                                    <span>⏱️</span>
                                    <strong>
                                        {workout.duration_minutes} min
                                    </strong>
                                </div>

                                <div>
                                    <span>⚡</span>
                                    <strong>{workout.intensity}</strong>
                                </div>
                            </div>

                            <div className="ai-reason">
                                <strong>Why this workout?</strong>
                                <p>{workout.reason}</p>
                            </div>
                        </div>
                    ))}

                </div>
            </div>

        </div>
    );
}

export default AIWorkoutSuggestions;