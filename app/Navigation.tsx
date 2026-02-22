import Link from "next/link";

export default function Navigation() {
    return (
        <nav className="glass" style={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            padding: "1rem 2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid var(--border-light)"
        }}>
            <Link href="/" style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--foreground)" }}>
                Food Crib
            </Link>

            <div style={{ display: "flex", gap: "2rem" }}>
                <Link href="/" style={{ color: "var(--foreground)", fontWeight: "500" }}>Dashboard</Link>
                <Link href="/planner" style={{ color: "var(--foreground)", fontWeight: "500" }}>Planner</Link>
                <Link href="/find" style={{ color: "var(--foreground)", fontWeight: "500" }}>Discover</Link>
                <Link href="/library" style={{ color: "var(--foreground)", fontWeight: "500" }}>Library</Link>
                <Link href="/importer" style={{ color: "var(--foreground)", fontWeight: "500" }}>Import</Link>
                <Link href="/inventory" style={{ color: "var(--foreground)", fontWeight: "500" }}>Inventory</Link>
                <Link href="/history" style={{ color: "var(--foreground)", fontWeight: "500" }}>History</Link>
                <Link href="/settings" style={{ color: "var(--foreground)", fontWeight: "500" }}>Settings</Link>
            </div>
        </nav>
    );
}
