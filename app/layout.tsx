import type { Metadata } from "next";
import "./globals.css";
import Navigation from "./Navigation";

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
      <body>
        <Navigation />
        <main>{children}</main>
      </body>
    </html>
  );
}
