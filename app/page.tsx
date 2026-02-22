"use client";

import { useState, useEffect } from "react";
import { generateWeeklyPlan, surpriseMe, getLatestMealPlan, deleteMealPlan, updateMealPlan } from "@/app/actions/ai";
import Link from "next/link";
import MealDetail from "./library/MealDetail";

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [fullPlan, setFullPlan] = useState<any>(null); // Stores the full DB object
  const [activeDossier, setActiveDossier] = useState<any>(null);
  const [surprisedMeal, setSurprisedMeal] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [showShoppingList, setShowShoppingList] = useState(false);

  useEffect(() => {
    loadPlan();
  }, []);

  async function loadPlan() {
    const latest = await getLatestMealPlan();
    if (latest) {
      setFullPlan(latest);
    } else {
      setFullPlan(null);
    }
  }

  const handleGenerate = async (type: "lunch" | "dinner" | "all" = "all") => {
    setLoading(true);
    setMessage("");
    setLoadingStep("Initiating deep-space scan...");

    const steps = [
      "Optimizing nutrient paths...",
      "Consulting culinary nodes library...",
      "Prioritizing your favorite meals...",
      "Syncing with ZAR budget cores...",
      "Compiling logistics manifest..."
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length) {
        setLoadingStep(steps[stepIdx]);
        stepIdx++;
      }
    }, 4000);

    try {
      const res = await generateWeeklyPlan(7, type);
      clearInterval(interval);
      if (res.success) {
        await loadPlan();
        setMessage(`${type === 'all' ? '7-Day' : type.charAt(0).toUpperCase() + type.slice(1)} Meal Plan generated successfully!`);
      } else {
        setMessage("Error: " + res.error);
      }
    } catch (e) {
      clearInterval(interval);
      setMessage("System Failure: Deployment failed.");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  const handleDeletePlan = async () => {
    if (confirm("Are you sure you want to terminate this entire deployment? This cannot be undone.")) {
      await deleteMealPlan(fullPlan.id);
      setFullPlan(null);
      setMessage("Plan terminated successfully.");
    }
  };

  const removeMealFromPlan = async (dayIdx: number, type: 'lunch' | 'dinner') => {
    const newMeals = [...fullPlan.meals.meals];
    newMeals[dayIdx][type] = null;

    // Recalculate total cost
    const totalWeeklyCost = newMeals.reduce((sum: number, day: any) => sum + (day.totalCost || 0), 0);

    await updateMealPlan(fullPlan.id, newMeals, fullPlan.meals.shoppingList, totalWeeklyCost);
    await loadPlan();
  };

  const handleSurprise = async () => {
    const meal = await surpriseMe();
    if (meal) {
      setSurprisedMeal(meal);
    } else {
      setMessage("No meals in library yet. Add some first!");
    }
  };

  const openDossier = (meal: any) => {
    const dossierMeal = {
      ...meal,
      id: "temp-" + Math.random().toString(36).substr(2, 9),
      ingredients: typeof meal.ingredients === 'string' ? meal.ingredients : JSON.stringify(meal.ingredients),
      rating: 0,
    };
    setActiveDossier(dossierMeal);
  };

  const plan = fullPlan?.meals;

  return (
    <div style={{ padding: "4rem 2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "6rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "5rem", fontWeight: "900", marginBottom: "1.5rem", lineHeight: 1.1 }}>
          The Future of <br />
          <span style={{
            background: "linear-gradient(to right, var(--primary), var(--accent))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>Family Dining</span>
        </h1>
        <p style={{ fontSize: "1.4rem", color: "rgba(255,255,255,0.6)", maxWidth: "700px", margin: "0 auto", fontWeight: "300" }}>
          AI-generated, budget-optimized, and macro-compliant meal planning.
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem", marginBottom: "4rem" }}>
        <div className="glass-card" style={{ textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: "2.2rem", marginBottom: "1rem" }}>Weekly Planner</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "2.5rem", fontSize: "1.1rem" }}>
              Generate a 7-day celestial menu prioritized from your library.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <button
              onClick={() => handleGenerate("all")}
              disabled={loading}
              className="btn-primary"
              style={{ width: "100%", padding: "1.5rem", fontSize: "1.2rem", position: "relative", overflow: "hidden" }}
            >
              {loading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
                  <div className="spinner-small"></div>
                  <span>{loadingStep}</span>
                </div>
              ) : "🚀 Generate Full 7-Day Plan"}
            </button>
            <div style={{ display: "flex", gap: "1rem" }}>
              <button
                onClick={() => handleGenerate("lunch")}
                disabled={loading}
                className="btn-secondary"
                style={{ flex: 1, padding: "1.25rem" }}
              >
                Lunches Only
              </button>
              <button
                onClick={() => handleGenerate("dinner")}
                disabled={loading}
                className="btn-secondary"
                style={{ flex: 1, padding: "1.25rem" }}
              >
                Dinners Only
              </button>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ textAlign: "center", padding: "3rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h2 style={{ fontSize: "2.2rem", marginBottom: "1rem" }}>Pantry Chef</h2>
          <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "2.5rem", fontSize: "1.1rem" }}>
            Got random cosmic ingredients? Let the AI cook up something magical.
          </p>
          <Link href="/pantry" className="btn-secondary" style={{ display: "inline-block", padding: "1.5rem", fontSize: "1.1rem", borderColor: "var(--accent)", color: "var(--accent)" }}>
            ✨ Open Pantry Chef
          </Link>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: "6rem", gap: "1rem" }}>
        <button
          onClick={handleSurprise}
          className="btn-secondary"
          style={{ padding: "1rem 2.5rem", fontSize: "1.1rem" }}
        >
          🎲 Surprise My Palate
        </button>
        {fullPlan && (
          <button
            onClick={handleDeletePlan}
            className="btn-secondary"
            style={{ padding: "1rem 2.5rem", fontSize: "1.1rem", borderColor: "var(--error)", color: "var(--error)" }}
          >
            🗑️ Terminate Plan
          </button>
        )}
      </div>

      {plan?.meals && (
        <>
          <section className="glass-card" style={{ marginBottom: "4rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem" }}>
              <div style={{ width: "150px" }}></div>
              <h2 style={{ textAlign: "center", fontSize: "2.5rem", margin: 0 }}>The Week Ahead</h2>
              <button
                onClick={() => setShowShoppingList(true)}
                className="btn-secondary"
                style={{ width: "150px", padding: "0.5rem 1rem", fontSize: "0.85rem", borderColor: "var(--success)", color: "var(--success)" }}
              >
                🛒 View Shopping List
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
              {plan.meals.map((day: any, idx: number) => (
                <div key={day.day} style={{
                  padding: "1.5rem",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  position: "relative"
                }}>
                  <h4 style={{ marginBottom: "1.5rem", color: "var(--primary)", fontSize: "1.2rem", fontWeight: "800" }}>DAY {day.day}</h4>
                  <div style={{ fontSize: "0.95rem", display: "flex", flexDirection: "column", gap: "1rem", color: "rgba(255,255,255,0.8)" }}>
                    {day.lunch ? (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div onClick={() => openDossier(day.lunch)} className="hover-primary" style={{ flex: 1 }}>
                          <span style={{ color: "var(--accent)", fontWeight: "bold" }}>L:</span> {day.lunch.name}
                        </div>
                        <button
                          onClick={() => removeMealFromPlan(idx, 'lunch')}
                          style={{ background: "none", border: "none", color: "var(--error)", opacity: 0.4, cursor: "pointer", fontSize: "1.2rem" }}
                        >&times;</button>
                      </div>
                    ) : (
                      <div style={{ fontSize: "0.8rem", opacity: 0.3 }}>[ Lunch Vacancy ]</div>
                    )}

                    {day.dinner ? (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div onClick={() => openDossier(day.dinner)} className="hover-primary" style={{ flex: 1 }}>
                          <span style={{ color: "var(--accent)", fontWeight: "bold" }}>D:</span> {day.dinner.name}
                        </div>
                        <button
                          onClick={() => removeMealFromPlan(idx, 'dinner')}
                          style={{ background: "none", border: "none", color: "var(--error)", opacity: 0.4, cursor: "pointer", fontSize: "1.2rem" }}
                        >&times;</button>
                      </div>
                    ) : (
                      <div style={{ fontSize: "0.8rem", opacity: 0.3 }}>[ Dinner Vacancy ]</div>
                    )}
                    <div style={{ marginTop: "0.5rem", fontWeight: "800", color: "white", fontSize: "1.1rem" }}>R{day.totalCost}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: "3rem",
              textAlign: "right",
              fontSize: "1.8rem",
              fontWeight: "900",
              color: "var(--success)"
            }}>
              Weekly Investment: R{fullPlan.totalCost.toFixed(2)} / R2800
            </div>
          </section>

          {showShoppingList && (
            <div style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "var(--surface-dark)",
              backdropFilter: "blur(12px)",
              zIndex: 1100,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "2rem"
            }}>
              <div className="glass-card" style={{ maxWidth: "800px", width: "100%", maxHeight: "80vh", overflowY: "auto", position: "relative" }}>
                <button
                  onClick={() => setShowShoppingList(false)}
                  style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "none", border: "none", color: "white", fontSize: "2rem", cursor: "pointer" }}
                >&times;</button>

                <h2 style={{ fontSize: "2.5rem", marginBottom: "2rem" }}>Logistics Manifest</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                  {plan.shoppingList?.map((item: any, idx: number) => (
                    <div key={idx} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "1rem 1.5rem",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      borderRadius: "var(--radius-sm)"
                    }}>
                      <div>
                        <span style={{ fontWeight: "700", display: "block" }}>{item.item}</span>
                        <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>Qty: {item.amount}</span>
                      </div>
                      <div style={{ color: "var(--success)", fontWeight: "800" }}>R{item.estimatedCost}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => window.print()}
                  className="btn-primary"
                  style={{ marginTop: "2rem", width: "100%" }}
                >
                  🖨️ Print Manifest
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {message && (
        <div style={{
          textAlign: "center",
          padding: "1.5rem",
          borderRadius: "var(--radius-md)",
          background: message.includes("Error") ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)",
          color: message.includes("Error") ? "var(--error)" : "var(--success)",
          marginBottom: "2rem"
        }}>
          {message}
        </div>
      )}

      {activeDossier && (
        <MealDetail
          meal={activeDossier}
          onClose={() => setActiveDossier(null)}
          onSaveSuccess={() => {
            setMessage("Instruction modifications synced.");
            loadPlan();
          }}
        />
      )}

      {surprisedMeal && (
        <MealDetail meal={surprisedMeal} onClose={() => setSurprisedMeal(null)} />
      )}
    </div>
  );
}
