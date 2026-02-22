import { getMealPlans } from "@/app/actions/ai";

export default async function HistoryPage() {
    const plans = await getMealPlans();

    return (
        <div style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto" }}>
            <header style={{ marginBottom: "3rem", textAlign: "center" }}>
                <h1 style={{ fontSize: "3rem" }}>Meal History</h1>
                <p style={{ color: "gray" }}>Review your past weekly meal plans and total costs.</p>
            </header>

            {plans.length === 0 ? (
                <div className="card flex-center" style={{ minHeight: "200px", color: "gray" }}>
                    No meal plans generated yet. Go to the dashboard to create one!
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    {plans.map((plan) => (
                        <div key={plan.id} className="card">
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", borderBottom: "1px solid var(--border-light)", paddingBottom: "0.5rem" }}>
                                <div style={{ fontWeight: "700" }}>
                                    {new Date(plan.startDate).toLocaleDateString()} - {new Date(plan.endDate).toLocaleDateString()}
                                </div>
                                <div style={{ color: "var(--primary)", fontWeight: "600" }}>
                                    Mode: {plan.dietMode}
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
                                {JSON.parse(plan.meals).map((day: any) => (
                                    <div key={day.day} style={{ fontSize: "0.85rem", padding: "0.5rem", borderLeft: "2px solid var(--primary-hover)" }}>
                                        <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>Day {day.day}</div>
                                        <div style={{ opacity: 0.8 }}>Dinner: {day.dinner.name}</div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: "1rem", textAlign: "right", fontWeight: "700", fontSize: "1.1rem" }}>
                                Total Cost: R{plan.totalCost.toFixed(2)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
