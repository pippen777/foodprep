import Link from "next/link";

export default function Navigation() {
    return (
        <nav className="glass" style={{
            position: "sticky",
            top: "20px",
            zIndex: 100,
            margin: "0 auto",
            width: "max-content",
            padding: "0.75rem 2rem",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            borderRadius: "var(--radius-full)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-lg)",
            marginTop: "20px"
        }}>
            <Link href="/" style={{
                fontSize: "1.2rem",
                fontWeight: "800",
                marginRight: "2rem",
                background: "linear-gradient(135deg, white, var(--primary))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
            }}>
                Food Crib
            </Link>

            <div style={{ display: "flex", gap: "1.5rem" }}>
                {[
                    { label: "Dashboard", href: "/" },
                    { label: "Planner", href: "/planner" },
                    { label: "Discover", href: "/find" },
                    { label: "Library", href: "/library" },
                    { label: "Inventory", href: "/inventory" },
                    { label: "History", href: "/history" },
                    { label: "Settings", href: "/settings" }
                ].map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className="nav-link"
                        style={{
                            color: "rgba(255,255,255,0.7)",
                            fontWeight: "600",
                            fontSize: "0.9rem",
                            transition: "all 0.2s ease"
                        }}
                    >
                        {link.label}
                    </Link>
                ))}
            </div>

        </nav>
    );
}
