import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Exclusive Event — Registration",
  description: "Register for the exclusive real estate event and receive your digital pass.",
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
