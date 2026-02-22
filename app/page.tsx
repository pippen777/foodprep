"use client";

import { useState, useEffect, useRef } from "react";
import { generateWeeklyPlan, surpriseMe, getLatestMealPlan, deleteMealPlan, updateMealPlan } from "@/app/actions/ai";
import Link from "next/link";
import MealDetail from "./library/MealDetail";

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [fullPlan, setFullPlan] = useState<any>(null);
  const [activeDossier, setActiveDossier] = useState<any>(null);
  const [surprisedMeal, setSurprisedMeal] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [showShoppingList, setShowShoppingList] = useState(false);

  // Mission Control State
  const [missionLogs, setMissionLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPlan();
  }, []);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [missionLogs]);

  async function loadPlan() {
    const latest = await getLatestMealPlan();
    if (latest) {
      setFullPlan(latest);
    } else {
      setFullPlan(null);
    }
  }

  const addLog = (text: string) => {
    setMissionLogs(prev => [...prev, `[${new Date().toLocaleTimeString([], { hour12: false, second: '2-digit', minute: '2-digit' })}] ${text}`]);
  };

  const handleGenerate = async (type: "lunch" | "dinner" | "all" = "all") => {
    setLoading(true);
    setMessage("");
    setMissionLogs([]);
    setProgress(0);

    const stages = [
      { msg: "Handshaking with OpenRouter Neural Core...", progress: 5, delay: 500 },
      { msg: "Accessing Food Crib Library (SQLite Payload Sent)...", progress: 15, delay: 1500 },
      { msg: "Applying South African Budget Context (R400/day constraint)...", progress: 25, delay: 3000 },
      { msg: "Optimizing Nutrient Paths for 7-Day Cycle...", progress: 40, delay: 6000 },
      { msg: "Primary Model (Gemma-3) Thinking...", progress: 55, delay: 10000 },
      { msg: "Scanning for Hallucinations & Ghost Recipes...", progress: 70, delay: 20000 },
      { msg: "Compiling Logistics Manifest & Hydrating JSON Data...", progress: 85, delay: 30000 },
      { msg: "Finalizing Deployment Manifest...", progress: 95, delay: 38000 },
    ];

    addLog(`INITIATING ${type.toUpperCase()} DEPLOYMENT...`);

    // Simulate steps in parallel with the actual call
    stages.forEach(s => {
      setTimeout(() => {
        if (loading) {
          addLog(s.msg);
          setProgress(s.progress);
        }
      }, s.delay);
    });

    // Detect if primary fails (around 40s)
    const fallbackTimer = setTimeout(() => {
      addLog("WARNING: Primary Node Choking. Activating Fallback Layer 1 (Trinity Mini)...");
    }, 40500);

    try {
      const res = await generateWeeklyPlan(7, type);
      clearTimeout(fallbackTimer);

      if (res.success) {
        setProgress(100);
        addLog("DEPLOYMENT SUCCESSFUL. WRITING TO HISTORY...");
        await loadPlan();
        setTimeout(() => setLoading(false), 1000);
        setMessage(`${type === 'all' ? '7-Day' : type.charAt(0).toUpperCase() + type.slice(1)} Meal Plan generated successfully!`);
      } else {
        addLog(`CRITICAL ERROR: ${res.error}`);
        setTimeout(() => setLoading(false), 2000);
        setMessage("Error: " + res.error);
      }
    } catch (e) {
      clearTimeout(fallbackTimer);
      addLog("SYSTEM FAILURE: DEPLOYMENT INTERRUPTED.");
      setTimeout(() => setLoading(false), 2000);
      setMessage("System Failure: Deployment failed.");
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
    const totalWeeklyCost = newMeals.reduce((sum: number, day: any) => sum + (day.totalCost || 0), 0);
    await updateMealPlan(fullPlan.id, newMeals, fullPlan.meals.shoppingList, totalWeeklyCost);
    await loadPlan();
  };

  const handleSurprise = async () => {
    const meal = await surpriseMe();
    if (meal) setSurprisedMeal(meal);
    else setMessage("No meals in library yet.");
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
      {/* AI Generate Overlay */}
      {loading && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(2, 6, 23, 0.98)",
          backdropFilter: "blur(20px)",
          zIndex: 2000,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "2rem"
        }}>
          <div style={{ maxWidth: "600px", width: "100%", textAlign: "center" }}>
            <h2 style={{ fontSize: "2.5rem", marginBottom: "2rem", color: "var(--primary)" }}>Mission Control</h2>

            {/* Progress Bar Container */}
            <div style={{
              width: "100%",
              height: "12px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "20px",
              marginBottom: "2rem",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.1)"
            }}>
              <div style={{
                width: `${progress}%`,
                height: "100%",
                background: "linear-gradient(to right, var(--primary), var(--accent))",
                transition: "width 1s cubic-bezier(0.23, 1, 0.32, 1)",
                boxShadow: "0 0 20px var(--primary-glow)"
              }}></div>
            </div>

            {/* Terminal Window */}
            <div style={{
              height: "300px",
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              padding: "1.5rem",
              textAlign: "left",
              fontFamily: "monospace",
              fontSize: "0.9rem",
              overflowY: "auto",
              color: "#10b981",
              boxShadow: "inset 0 0 20px rgba(0,0,0,0.5)"
            }}>
              {missionLogs.map((log, i) => (
                <div key={i} style={{ marginBottom: "0.5rem", borderLeft: "2px solid #10b981", paddingLeft: "1rem" }}>
                  {log}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>

            <p style={{ marginTop: "2rem", color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>
              Please standby. Large plans can take up to 2 minutes when nodes are saturated.
            </p>
          </div>
        </div>
      )}

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
              🚀 Generate Full 7-Day Plan
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
              zIndex: 3000,
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
                      <div style={{ color: "var(--success)", fontWeight: "800" }}>R{item.estimatedCost || 0}</div>
                    </div>
                  ))}
                </div>
                
                <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", fontSize: "1.2rem", fontWeight: "bold" }}>
                  <span>Total Estimated Cost:</span>
                  <span style={{ color: "var(--success)" }}>R{plan.totalCost || 0}</span>
                </div>

                <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
                  <button
                    onClick={() => {
                      document.querySelector('.shopping-print-container')?.setAttribute('style', 'display: block !important');
                      setTimeout(() => {
                        window.print();
                        document.querySelector('.shopping-print-container')?.setAttribute('style', 'display: none !important');
                      }, 100);
                    }}
                    className="btn-primary"
                    style={{ flex: 1 }}
                  >
                    🖨️ Print
                  </button>
                  <button
                    onClick={() => {
                      const maxItemLen = Math.max(...(plan.shoppingList?.map((i: any) => i.item.length) || [10]));
                      const padLen = Math.min(maxItemLen + 2, 30);
                      
                      const lines = plan.shoppingList?.map((item: any) => {
                        const name = item.item.padEnd(padLen);
                        const qty = String(item.amount).slice(0, 15).padEnd(15);
                        const cost = `R${(item.estimatedCost || 0).toFixed(2)}`;
                        return `${name} ${qty}  ${cost}`;
                      }) || [];
                      
                      const totalLine = "=".repeat(padLen + 20);
                      const sumLine = "TOTAL".padEnd(padLen) + "                " + `R${(plan.totalCost || 0).toFixed(2)}`;
                      
                      const text = `SHOPPING LIST\n${"=".repeat(40)}\n\nItem${" ".repeat(padLen - 4)}Quantity            Cost\n${"-".repeat(40)}\n${lines.join('\n')}\n${totalLine}\n${sumLine}\n${"=".repeat(padLen + 20)}\n`;
                      
                      const blob = new Blob([text], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'shopping-list.txt';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="btn-secondary"
                    style={{ flex: 1, borderColor: "var(--success)", color: "var(--success)" }}
                  >
                    📥 Save as Text
                  </button>
                </div>

                <button
                  onClick={() => {
                    const printContent = `
                      <html>
                      <head><title>Shopping List</title></head>
                      <body style="font-family: Arial, sans-serif; padding: 20px;">
                      <h1 style="border-bottom: 2px solid #333; padding-bottom: 10px;">Shopping List</h1>
                      <table style="width: 100%; border-collapse: collapse;">
                        <tr style="border-bottom: 1px solid #ccc;">
                          <th style="text-align: left; padding: 8px;">Item</th>
                          <th style="text-align: left; padding: 8px;">Quantity</th>
                          <th style="text-align: right; padding: 8px;">Cost</th>
                        </tr>
                        ${(plan.shoppingList || []).map((item: any) => `
                        <tr style="border-bottom: 1px solid #eee;">
                          <td style="padding: 8px;">${item.item}</td>
                          <td style="padding: 8px;">${item.amount}</td>
                          <td style="text-align: right; padding: 8px;">R${(item.estimatedCost || 0).toFixed(2)}</td>
                        </tr>`).join('')}
                      </table>
                      <h2 style="margin-top: 20px; border-top: 2px solid #333; padding-top: 10px;">
                        Total: R${(plan.totalCost || 0).toFixed(2)}
                      </h2>
                      </body></html>`;
                    
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(printContent);
                      printWindow.document.close();
                      printWindow.print();
                    }
                  }}
                  className="btn-primary"
                  style={{ marginTop: "1rem", width: "100%" }}
                >
                  🖨️ Print / Save as PDF
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
