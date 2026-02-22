import FindMealClient from "./FindMealClient";

export default function FindMealPage() {
    return (
        <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
            <header style={{ marginBottom: "3rem", textAlign: "center" }}>
                <h1 style={{ fontSize: "3.5rem", fontWeight: "800", marginBottom: "1rem" }}>
                    Find a <span style={{ color: "var(--primary)" }}>Meal</span>
                </h1>
                <p style={{ fontSize: "1.1rem", color: "gray", maxWidth: "600px", margin: "0 auto" }}>
                    Search for anything you're craving. We'll find 3 variations with real South African price estimates.
                </p>
            </header>

            <FindMealClient />
        </div>
    );
}
