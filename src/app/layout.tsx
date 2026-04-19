import type { Metadata } from "next";
import { Manrope, Newsreader } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Evergreen Academy",
  description: "The Scholarly Atelier",
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='18' fill='%2323422A'/%3E%3Cpath d='M19 18H44V24H26V29H42V35H26V40H45V46H19V18Z' fill='%23FBF9F4'/%3E%3Cpath d='M42 16C46.4183 16 50 19.5817 50 24V30C45.5817 30 42 26.4183 42 22V16Z' fill='%23C7ECCA'/%3E%3C/svg%3E",
  },
};

import { AuthProvider } from "@/components/AuthProvider";
import { DateProvider } from "@/components/DateProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${manrope.variable} ${newsreader.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="antialiased font-body bg-background text-on-surface">
        <AuthProvider>
          <DateProvider>
            {children}
          </DateProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
