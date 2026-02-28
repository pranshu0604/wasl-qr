import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wasl Suhoor Gathering",
  description: "You are invited to the Wasl Employees Suhoor Gathering at Park Hyatt Dubai Creek. Register to receive your QR pass.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
