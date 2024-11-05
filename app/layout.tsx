import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scarlett's Portfolio",
  description: "Scarlett Parker Summer 2024",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" />
      </head>
      <body className="font-inter">{children}</body>
    </html>
  );
}