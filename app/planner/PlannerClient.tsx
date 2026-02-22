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
        <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: "2rem" }}>
            {/* Sidebar: Meal Library */}
            <div style={{ position: "sticky", top: "100px", height: "calc(100vh - 150px)", overflowY: "auto", paddingRight: "1rem" }}>
                <h3 style={{ marginBottom: "1rem" }}>Meal Library</h3>
                <input
                    type="text"
                    placeholder="Filter library..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: "100%", padding: "0.8rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", marginBottom: "1rem" }}
                />
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                    {filters.map(f => (
                        <button key={f} onClick={() => setActiveFilter(f)} className={activeFilter === f ? "btn-primary" : "btn-secondary"} style={{ fontSize: "0.7rem", padding: "0.3rem 0.6rem" }}>
                            {f}
                        </button>
                    ))}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                    {filteredLibrary.map(meal => (
                        <div
                            key={meal.id}
                            className="card"
                            style={{
                                padding: "1rem",
                                cursor: selectedSlot ? "pointer" : "default",
                                border: selectedSlot ? "1px dashed var(--primary)" : undefined,
                                opacity: selectedSlot ? 1 : 0.8
                            }}
                            onClick={() => selectedSlot && handleSelectMeal(meal)}
                        >
                            <div style={{ fontWeight: "600", fontSize: "0.9rem" }}>{meal.name}</div>
                            <div style={{ fontSize: "0.8rem", color: "gray" }}>R{meal.cost} | {meal.tags}</div>
                            {selectedSlot && <div style={{ fontSize: "0.7rem", color: "var(--primary)", marginTop: "0.5rem", fontWeight: "bold" }}>Click to Add</div>}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content: The Week */}
            <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                    <h2>Weekly Menu Builder</h2>
                    <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "1.2rem", fontWeight: "700" }}>Weekly Total: R{totalWeeklyCost.toFixed(2)}</div>
                        <button onClick={handleSave} className="btn-primary" style={{ marginTop: "0.5rem" }}>Save Plan to History</button>
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {weeklyPlan.map((day) => (
                        <div key={day.day} className="card" style={{ display: "grid", gridTemplateColumns: "100px 1fr 1fr 1fr 100px", gap: "1rem", alignItems: "center", padding: "1.5rem" }}>
                            <div style={{ fontWeight: "800", color: "var(--primary)" }}>DAY {day.day}</div>

                            {["breakfast", "lunch", "dinner"].map(type => (
                                <div
                                    key={type}
                                    onClick={() => setSelectedSlot({ day: day.day, type })}
                                    style={{
                                        padding: "1rem",
                                        borderRadius: "var(--radius-sm)",
                                        border: selectedSlot?.day === day.day && selectedSlot?.type === type ? "2px solid var(--primary)" : "1px solid var(--border-light)",
                                        backgroundColor: day[type] ? "var(--surface-secondary)" : "transparent",
                                        cursor: "pointer",
                                        textAlign: "center",
                                        minHeight: "80px",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "center"
                                    }}
                                >
                                    <div style={{ fontSize: "0.6rem", textTransform: "uppercase", color: "gray", marginBottom: "0.25rem" }}>{type}</div>
                                    {day[type] ? (
                                        <div style={{ fontWeight: "600", fontSize: "0.85rem" }}>{day[type].name}</div>
                                    ) : (
                                        <div style={{ fontSize: "0.8rem", color: "#ccc" }}>+ Select</div>
                                    )}
                                </div>
                            ))}

                            <div style={{ textAlign: "right", fontWeight: "700", fontSize: "0.9rem" }}>
                                R{day.totalCost.toFixed(2)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
