import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "CharcuterME - Turn Fridge Chaos Into Culinary Art",
  description: "AI-powered girl dinner generator. Enter your ingredients and get a fancy name, plating blueprint, and vibe check for your chaotic snack spread.",
  keywords: ["girl dinner", "charcuterie", "AI", "food", "plating", "snacks"],
  authors: [{ name: "CharcuterME" }],
  openGraph: {
    title: "CharcuterME - Turn Fridge Chaos Into Culinary Art",
    description: "AI-powered girl dinner generator. Enter your ingredients and get a fancy name, plating blueprint, and vibe check.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
