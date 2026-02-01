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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://charcuterme.com'),
  openGraph: {
    title: "CharcuterME - Turn Fridge Chaos Into Culinary Art",
    description: "AI-powered girl dinner generator. Enter your ingredients and get a fancy name, plating blueprint, and vibe check.",
    type: "website",
    siteName: "CharcuterME",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CharcuterME - AI-powered girl dinner generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CharcuterME - Turn Fridge Chaos Into Culinary Art",
    description: "AI-powered girl dinner generator. Enter your ingredients and get a fancy name, plating blueprint, and vibe check.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
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
