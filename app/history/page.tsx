"use client";

import { useEffect, useState } from "react";
import { getMealPlans, deleteMealPlan, updateMealPlan } from "@/app/actions/ai";
import MealDetail from "../library/MealDetail";

export default function HistoryPage() {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeDossier, setActiveDossier] = useState<any>(null);
    const [viewingShoppingList, setViewingShoppingList] = useState<any | null>(null);

    useEffect(() => {
        load();
    }, []);

    async function load() {
        setLoading(true);
        const data = await getMealPlans();
        setPlans(data);
        setLoading(false);
    }

    const openDossier = (meal: any) => {
        const dossierMeal = {
            ...meal,
            id: "temp-" + Math.random().toString(36).substr(2, 9),
            ingredients: typeof meal.ingredients === 'string' ? meal.ingredients : JSON.stringify(meal.ingredients),
            rating: 0,
        };
        setActiveDossier(dossierMeal);
    };

    const handleDeletePlan = async (id: string) => {
        if (confirm("Terminate this historical record? This cannot be undone.")) {
            await deleteMealPlan(id);
            await load();
        }
    };

    const removeMealFromHistoryPlan = async (planId: string, dayIdx: number, type: 'lunch' | 'dinner') => {
        const plan = plans.find(p => p.id === planId);
        if (!plan) return;

        const planData = JSON.parse(plan.meals);
        const newMeals = Array.isArray(planData) ? [...planData] : [...planData.meals];
        newMeals[dayIdx][type] = null;

        const shoppingList = Array.isArray(planData) ? [] : planData.shoppingList;
        const totalWeeklyCost = newMeals.reduce((sum: number, day: any) => sum + (day.totalCost || 0), 0);

        await updateMealPlan(planId, newMeals, shoppingList, totalWeeklyCost);
        await load();
    };

    if (loading) {
        return (
            <div style={{ padding: "4rem", textAlign: "center" }}>
                <div className="spinner-small" style={{ margin: "0 auto 1rem" }}></div>
                <p>Retrieving archives...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: "4rem 2rem", maxWidth: "1200px", margin: "0 auto" }}>
            <header style={{ marginBottom: "6rem", textAlign: "center" }}>
                <h1 style={{ fontSize: "4rem", fontWeight: "900", marginBottom: "1.5rem" }}>
                    Mission <span style={{ color: "var(--primary)" }}>Logs</span>
                </h1>
                <p style={{ fontSize: "1.2rem", color: "rgba(255,255,255,0.6)" }}>
                    Review, modify, or terminate past deployments.
                </p>
            </header>

            {plans.length === 0 ? (
                <div className="glass-card" style={{ textAlign: "center", padding: "4rem" }}>
                    <p style={{ color: "rgba(255,255,255,0.5)" }}>No mission data found in history.</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
                    {plans.map((plan) => {
                        const planData = JSON.parse(plan.meals);
                        const meals = Array.isArray(planData) ? planData : planData.meals;
                        const shoppingList = Array.isArray(planData) ? [] : planData.shoppingList;

                        return (
                            <div key={plan.id} className="glass-card">
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "1.5rem" }}>
                                    <div>
                                        <h3 style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>
                                            Deployment: {new Date(plan.startDate).toLocaleDateString()}
                                        </h3>
                                        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                                            <span style={{ color: "var(--accent)", fontWeight: "600", fontSize: "0.9rem" }}>
                                                MODE: {plan.dietMode}
                                            </span>
                                            <button
                                                onClick={() => handleDeletePlan(plan.id)}
                                                style={{ background: "none", border: "none", color: "var(--error)", fontSize: "0.8rem", cursor: "pointer", opacity: 0.6 }}
                                            >
                                                [ Terminate Log ]
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "var(--success)" }}>
                                            R{plan.totalCost.toFixed(2)} / R2800
                                        </div>
                                        <button
                                            onClick={() => setViewingShoppingList(shoppingList)}
                                            className="btn-secondary"
                                            style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", marginTop: "0.5rem", borderColor: "var(--success)", color: "var(--success)" }}
                                        >
                                            🛒 View Shopping List
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1rem" }}>
                                    {meals.map((day: any, idx: number) => (
                                        <div key={day.day} style={{ padding: "1.25rem", background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(255,255,255,0.02)" }}>
                                            <div style={{ color: "var(--primary)", fontWeight: "800", fontSize: "0.8rem", marginBottom: "1rem" }}>DAY {day.day}</div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                                {day.lunch ? (
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                        <div onClick={() => openDossier(day.lunch)} className="hover-primary" style={{ fontSize: "0.9rem", flex: 1 }}>
                                                            <span style={{ color: "var(--accent)", fontWeight: "bold" }}>L:</span> {day.lunch.name}
                                                        </div>
                                                        <button
                                                            onClick={() => removeMealFromHistoryPlan(plan.id, idx, 'lunch')}
                                                            style={{ background: "none", border: "none", color: "var(--error)", opacity: 0.3, cursor: "pointer" }}
                                                        >&times;</button>
                                                    </div>
                                                ) : <div style={{ fontSize: "0.75rem", opacity: 0.2 }}>[ Empty Slot ]</div>}

                                                {day.dinner ? (
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                        <div onClick={() => openDossier(day.dinner)} className="hover-primary" style={{ fontSize: "0.9rem", flex: 1 }}>
                                                            <span style={{ color: "var(--accent)", fontWeight: "bold" }}>D:</span> {day.dinner.name}
                                                        </div>
                                                        <button
                                                            onClick={() => removeMealFromHistoryPlan(plan.id, idx, 'dinner')}
                                                            style={{ background: "none", border: "none", color: "var(--error)", opacity: 0.3, cursor: "pointer" }}
                                                        >&times;</button>
                                                    </div>
                                                ) : <div style={{ fontSize: "0.75rem", opacity: 0.2 }}>[ Empty Slot ]</div>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {viewingShoppingList && (
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
                            onClick={() => setViewingShoppingList(null)}
                            style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "none", border: "none", color: "white", fontSize: "2rem", cursor: "pointer" }}
                        >&times;</button>

                        <h2 style={{ fontSize: "2.5rem", marginBottom: "2rem" }}>Logistics Manifest</h2>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                            {viewingShoppingList.map((item: any, idx: number) => (
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
                    </div>
                </div>
            )}

            {activeDossier && (
                <MealDetail meal={activeDossier} onClose={() => setActiveDossier(null)} />
            )}
        </div>
    );
}
