import type { Metadata } from "next";
import "./globals.css";
import Navigation from "./Navigation";
import SpaceBackground from "./components/SpaceBackground";

export const metadata: Metadata = {
  title: "Food Crib",
  description: "Budget-friendly family meal planning",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <SpaceBackground />
        <Navigation />
        <main style={{ position: "relative", zIndex: 1 }}>
          {children}
        </main>
      </body>
    </html>
  );
}
