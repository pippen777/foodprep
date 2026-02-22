"use client";

import { useState } from "react";
import { generateWeeklyPlan, surpriseMe } from "@/app/actions/ai";
import Link from "next/link";
import MealDetail from "./library/MealDetail";

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [surprisedMeal, setSurprisedMeal] = useState<any>(null);
  const [message, setMessage] = useState("");

  const handleGenerate = async (type: "lunch" | "dinner" | "all" = "all") => {
    setLoading(true);
    setMessage("");
    const res = await generateWeeklyPlan(7, type);
    if (res.success) {
      setPlan(res.plan);
      setMessage(`${type === 'all' ? '7-Day' : type.charAt(0).toUpperCase() + type.slice(1)} Meal Plan generated successfully!`);
    } else {
      setMessage("Error: " + res.error);
    }
    setLoading(false);
  };

  const handleSurprise = async () => {
    const meal = await surpriseMe();
    if (meal) {
      setSurprisedMeal(meal);
    } else {
      setMessage("No meals in library yet. Add some first!");
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "4rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "4rem", fontWeight: "800", marginBottom: "1rem" }}>
          Welcome to <span style={{ color: "var(--primary)" }}>Food Crib</span>
        </h1>
        <p style={{ fontSize: "1.2rem", color: "gray", maxWidth: "600px", margin: "0 auto" }}>
          Budget-friendly, macro-compliant meal planning for your family.
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "3rem" }}>
        <div className="card" style={{ textAlign: "center", padding: "3rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Weekly Planner</h2>
            <p style={{ color: "gray", marginBottom: "2rem" }}>
              Generate a plan optimized for your diet and R400 daily budget.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            <button
              onClick={() => handleGenerate("all")}
              disabled={loading}
              className="btn-primary"
              style={{ width: "100%", padding: "1.25rem" }}
            >
              {loading ? "Generating..." : "Full 7-Day Plan"}
            </button>
            <div style={{ display: "flex", gap: "0.8rem" }}>
              <button
                onClick={() => handleGenerate("lunch")}
                disabled={loading}
                className="btn-secondary"
                style={{ flex: 1, padding: "1rem" }}
              >
                Lunches Only
              </button>
              <button
                onClick={() => handleGenerate("dinner")}
                disabled={loading}
                className="btn-secondary"
                style={{ flex: 1, padding: "1rem" }}
              >
                Dinners Only
              </button>
            </div>
          </div>
        </div>

        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <h2 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Pantry Chef</h2>
          <p style={{ color: "gray", marginBottom: "2rem" }}>
            Got random ingredients? Let the AI cook up something great.
          </p>
          <Link href="/pantry" className="btn-secondary" style={{ display: "inline-block", padding: "1.25rem 2.5rem", fontSize: "1.1rem" }}>
            Open Pantry Chef
          </Link>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: "4rem" }}>
        <button
          onClick={handleSurprise}
          className="btn-secondary"
          style={{ padding: "1rem 2rem", border: "1px solid var(--border)" }}
        >
          🎲 Surprise Me
        </button>
      </div>

      {plan && (
        <section className="card" style={{ marginBottom: "2rem" }}>
          <h2 style={{ marginBottom: "2rem", textAlign: "center" }}>Current Week at a Glance</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1rem" }}>
            {plan.meals.map((day: any) => (
              <div key={day.day} style={{ padding: "1rem", backgroundColor: "var(--surface-secondary)", borderRadius: "var(--radius-md)" }}>
                <h4 style={{ marginBottom: "1rem", color: "var(--primary)" }}>Day {day.day}</h4>
                <div style={{ fontSize: "0.9rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {day.breakfast && <div><strong>B:</strong> {day.breakfast.name}</div>}
                  {day.lunch && <div><strong>L:</strong> {day.lunch.name}</div>}
                  {day.dinner && <div><strong>D:</strong> {day.dinner.name}</div>}
                  <div style={{ marginTop: "0.5rem", fontWeight: "bold" }}>Total: R{day.totalCost}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "2rem", textAlign: "right", fontSize: "1.2rem", fontWeight: "700" }}>
            Weekly Total: R{plan.totalWeeklyCost}
          </div>
        </section>
      )}

      {message && (
        <div style={{ textAlign: "center", padding: "1rem", color: message.includes("Error") ? "var(--error)" : "var(--success)" }}>
          {message}
        </div>
      )}

      {surprisedMeal && (
        <MealDetail meal={surprisedMeal} onClose={() => setSurprisedMeal(null)} />
      )}
    </div>
  );
}
