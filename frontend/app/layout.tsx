import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScrewIT | Material Harmonization",
  description: "AI-assisted material code standardization for CPSEs.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
