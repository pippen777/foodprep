"use client";

import { useState } from "react";
import { saveCustomMealPlan } from "@/app/actions/planner";
import { useRouter } from "next/navigation";

interface PlannerClientProps {
    meals: any[];
    dietMode: string;
}

export default function PlannerClient({ meals, dietMode }: PlannerClientProps) {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");
    const [selectedSlot, setSelectedSlot] = useState<{ day: number, type: string } | null>(null);
    const [weeklyPlan, setWeeklyPlan] = useState<any[]>(
        Array.from({ length: 7 }, (_, i) => ({
            day: i + 1,
            breakfast: null,
            lunch: null,
            dinner: null,
            totalCost: 0
        }))
    );

    const filters = ["All", "Lunch", "Dinner", "Beef", "Chicken", "Keto-Friendly", "Carb-Cycling"];

    const filteredLibrary = meals.filter((meal) => {
        const matchesSearch = meal.name.toLowerCase().includes(search.toLowerCase()) ||
            meal.tags.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = activeFilter === "All" || meal.tags.includes(activeFilter);
        return matchesSearch && matchesFilter;
    });

    const handleSelectMeal = (meal: any) => {
        if (!selectedSlot) return;

        const newPlan = [...weeklyPlan];
        const dayIndex = selectedSlot.day - 1;
        newPlan[dayIndex][selectedSlot.type] = {
            name: meal.name,
            cost: meal.cost,
            id: meal.id
        };

        // Calculate daily total
        const day = newPlan[dayIndex];
        day.totalCost = (day.breakfast?.cost || 0) + (day.lunch?.cost || 0) + (day.dinner?.cost || 0);

        setWeeklyPlan(newPlan);
        setSelectedSlot(null);
    };

    const handleSave = async () => {
        await saveCustomMealPlan(weeklyPlan, dietMode);
        router.push("/");
    };

    const totalWeeklyCost = weeklyPlan.reduce((sum, day) => sum + day.totalCost, 0);

    return (
        <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: "3rem", padding: "1rem" }}>
            {/* Sidebar: Meal Library */}
            <div style={{
                position: "sticky",
                top: "100px",
                height: "calc(100vh - 150px)",
                overflowY: "auto",
                padding: "2rem",
                background: "rgba(255,255,255,0.02)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid rgba(255,255,255,0.05)",
                scrollbarWidth: "none"
            }}>
                <h3 style={{ marginBottom: "1.5rem", fontSize: "1.5rem" }}>Culinary Archives</h3>
                <div style={{ position: "relative", marginBottom: "1rem" }}>
                    <input
                        type="text"
                        placeholder="Search recipes..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: "100%", paddingLeft: "1rem" }}
                    />
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
                    {filters.map(f => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={activeFilter === f ? "btn-primary" : "btn-secondary"}
                            style={{ fontSize: "0.75rem", padding: "0.4rem 0.8rem" }}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {filteredLibrary.map(meal => (
                        <div
                            key={meal.id}
                            className="glass-card"
                            style={{
                                padding: "1.25rem",
                                cursor: selectedSlot ? "pointer" : "default",
                                border: selectedSlot ? "1px solid var(--primary)" : "1px solid rgba(255,255,255,0.05)",
                                background: selectedSlot ? "rgba(59, 130, 246, 0.1)" : undefined,
                                transition: "all 0.2s ease"
                            }}
                            onClick={() => selectedSlot && handleSelectMeal(meal)}
                        >
                            <div style={{ fontWeight: "700", fontSize: "1rem", marginBottom: "0.4rem" }}>{meal.name}</div>
                            <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>
                                <span style={{ color: "var(--success)" }}>R{meal.cost}</span> • {meal.tags.split(',')[0]}
                            </div>
                            {selectedSlot && (
                                <div style={{
                                    fontSize: "0.75rem",
                                    color: "var(--primary)",
                                    marginTop: "0.75rem",
                                    fontWeight: "800",
                                    textTransform: "uppercase"
                                }}>
                                    ✨ Click to Assign
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content: The Week */}
            <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "3rem" }}>
                    <div>
                        <h2 style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>Global Weekly Build</h2>
                        <p style={{ color: "rgba(255,255,255,0.5)" }}>Strategic meal allocation for the coming cycle.</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>Projected Total</div>
                        <div style={{ fontSize: "2.5rem", fontWeight: "900", color: "var(--success)" }}>R{totalWeeklyCost.toFixed(2)}</div>
                        <button onClick={handleSave} className="btn-primary" style={{ marginTop: "1rem", width: "100%" }}>Finalize Plan</button>
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    {weeklyPlan.map((day) => (
                        <div key={day.day} className="glass-card" style={{
                            display: "grid",
                            gridTemplateColumns: "120px 1fr 1fr 1fr 120px",
                            gap: "1.5rem",
                            alignItems: "center",
                            padding: "2rem"
                        }}>
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Session</div>
                                <div style={{ fontWeight: "900", color: "var(--primary)", fontSize: "1.5rem" }}>D-{day.day}</div>
                            </div>

                            {["breakfast", "lunch", "dinner"].map(type => (
                                <div
                                    key={type}
                                    onClick={() => setSelectedSlot({ day: day.day, type })}
                                    style={{
                                        padding: "1.5rem",
                                        borderRadius: "var(--radius-md)",
                                        border: selectedSlot?.day === day.day && selectedSlot?.type === type ? "2px solid var(--primary)" : "1px solid rgba(255,255,255,0.05)",
                                        background: day[type] ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.2)",
                                        cursor: "pointer",
                                        textAlign: "center",
                                        minHeight: "100px",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "center",
                                        transition: "all 0.2s ease",
                                        boxShadow: selectedSlot?.day === day.day && selectedSlot?.type === type ? "0 0 20px rgba(59, 130, 246, 0.3)" : "none"
                                    }}
                                >
                                    <div style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "0.5rem", letterSpacing: "1px" }}>{type}</div>
                                    {day[type] ? (
                                        <div style={{ fontWeight: "700", fontSize: "0.95rem", color: "white" }}>{day[type].name}</div>
                                    ) : (
                                        <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.2)" }}>+ Assign</div>
                                    )}
                                </div>
                            ))}

                            <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Day Cost</div>
                                <div style={{ fontWeight: "800", fontSize: "1.2rem", color: "white" }}>R{day.totalCost.toFixed(2)}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
