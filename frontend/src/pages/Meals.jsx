
import { useEffect, useState } from "react";
import api from "../services/api";
import "./Meals.css";

function getToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function Meals() {
  const [meals, setMeals] = useState([]);
  const [summary, setSummary] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    meal_type: "Breakfast",
    food_name: "",
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
  });

  // Load today's meals and nutrition summary
  const fetchMeals = async () => {
    try {
      setLoading(true);
      setError("");

      const today = getToday();

      const [mealResponse, summaryResponse] = await Promise.all([
        api.get("/meals/", {
          params: { target_date: today },
        }),
        api.get("/meals/daily-summary", {
          params: { target_date: today },
        }),
      ]);

      setMeals(mealResponse.data);
      setSummary(summaryResponse.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to load nutrition data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeals();
  }, []);

  // Handle form input changes
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      meal_type: "Breakfast",
      food_name: "",
      calories: "",
      protein: "",
      carbs: "",
      fats: "",
    });

    setEditingId(null);
  };

  // Add or update meal
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const mealData = {
      ...formData,
      calories: Number(formData.calories),
      protein: Number(formData.protein),
      carbs: Number(formData.carbs),
      fats: Number(formData.fats),
    };

    try {
      if (editingId !== null) {
        await api.put(`/meals/${editingId}`, mealData);
        setSuccess("Meal updated successfully!");
      } else {
        await api.post("/meals/", mealData);
        setSuccess("Meal added successfully!");
      }

      resetForm();
      await fetchMeals();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to save meal."
      );
    }
  };

  // Edit meal
  const handleEdit = (meal) => {
    setEditingId(meal.id);

    setFormData({
      meal_type: meal.meal_type,
      food_name: meal.food_name,
      calories: String(meal.calories),
      protein: String(meal.protein),
      carbs: String(meal.carbs),
      fats: String(meal.fats),
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Delete meal
  const handleDelete = async (mealId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this meal?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await api.delete(`/meals/${mealId}`);

      setSuccess("Meal deleted successfully!");

      if (editingId === mealId) {
        resetForm();
      }

      await fetchMeals();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to delete meal."
      );
    }
  };

  return (
    <div className="meals-page">
      <div className="meals-header">
        <h1>Nutrition & Meal Tracking</h1>
        <p>Track your daily food intake and nutrition.</p>
      </div>

      {/* DAILY NUTRITION SUMMARY */}
      <section className="nutrition-summary">
        <h2>Today's Nutrition Summary</h2>

        {loading ? (
          <p>Loading nutrition summary...</p>
        ) : (
          <div className="nutrition-grid">
            <div className="nutrition-card calories-card">
              <h3>Calories</h3>
              <p>
                {summary?.total_calories ?? 0}
                <span> kcal</span>
              </p>
            </div>

            <div className="nutrition-card protein-card">
              <h3>Protein</h3>
              <p>
                {summary?.total_protein ?? 0}
                <span> g</span>
              </p>
            </div>

            <div className="nutrition-card carbs-card">
              <h3>Carbohydrates</h3>
              <p>
                {summary?.total_carbs ?? 0}
                <span> g</span>
              </p>
            </div>

            <div className="nutrition-card fats-card">
              <h3>Fats</h3>
              <p>
                {summary?.total_fats ?? 0}
                <span> g</span>
              </p>
            </div>
          </div>
        )}

        <p className="meal-count">
          Total Meals: {summary?.total_meals ?? 0}
        </p>
      </section>

      {/* ADD / EDIT MEAL FORM */}
      <section className="meal-form-section">
        <h2>
          {editingId !== null ? "Edit Meal" : "Add New Meal"}
        </h2>

        <form onSubmit={handleSubmit}>
          <label>Meal Type</label>
          <select
            name="meal_type"
            value={formData.meal_type}
            onChange={handleChange}
            required
          >
            <option value="Breakfast">Breakfast</option>
            <option value="Lunch">Lunch</option>
            <option value="Dinner">Dinner</option>
            <option value="Snacks">Snacks</option>
          </select>

          <label>Food Name</label>
          <input
            type="text"
            name="food_name"
            value={formData.food_name}
            onChange={handleChange}
            placeholder="Example: Idli, Rice, Chicken"
            minLength="1"
            maxLength="120"
            required
          />

          <div className="meal-input-grid">
            <div>
              <label>Calories (kcal)</label>
              <input
                type="number"
                name="calories"
                value={formData.calories}
                onChange={handleChange}
                min="0"
                step="0.1"
                required
              />
            </div>

            <div>
              <label>Protein (g)</label>
              <input
                type="number"
                name="protein"
                value={formData.protein}
                onChange={handleChange}
                min="0"
                step="0.1"
                required
              />
            </div>

            <div>
              <label>Carbs (g)</label>
              <input
                type="number"
                name="carbs"
                value={formData.carbs}
                onChange={handleChange}
                min="0"
                step="0.1"
                required
              />
            </div>

            <div>
              <label>Fats (g)</label>
              <input
                type="number"
                name="fats"
                value={formData.fats}
                onChange={handleChange}
                min="0"
                step="0.1"
                required
              />
            </div>
          </div>

          <button type="submit" className="meal-submit-btn">
            {editingId !== null ? "Update Meal" : "Add Meal"}
          </button>

          {editingId !== null && (
            <button
              type="button"
              className="meal-cancel-btn"
              onClick={resetForm}
            >
              Cancel Edit
            </button>
          )}
        </form>

        {success && <p className="meal-success">{success}</p>}
        {error && <p className="meal-error">{error}</p>}
      </section>

      {/* TODAY'S MEAL LIST */}
      <section className="meal-list-section">
        <h2>Today's Meals</h2>

        {loading ? (
          <p>Loading meals...</p>
        ) : meals.length === 0 ? (
          <p>No meals found. Add your first meal!</p>
        ) : (
          <div className="meal-list">
            {meals.map((meal) => (
              <div className="meal-card" key={meal.id}>
                <div className="meal-card-header">
                  <span className="meal-type">
                    {meal.meal_type}
                  </span>
                  <h3>{meal.food_name}</h3>
                </div>

                <div className="meal-details">
                  <p>Calories: {meal.calories} kcal</p>
                  <p>Protein: {meal.protein} g</p>
                  <p>Carbs: {meal.carbs} g</p>
                  <p>Fats: {meal.fats} g</p>
                </div>

                <div className="meal-actions">
                  <button
                    type="button"
                    className="meal-edit-btn"
                    onClick={() => handleEdit(meal)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="meal-delete-btn"
                    onClick={() => handleDelete(meal.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Meals;
