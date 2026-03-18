import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LoadingProvider } from "@/components/layout/CreativeLoader";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Healthyfy | Smart Care for Everyday Health",
  description: "Healthyfy helps families consult doctors, manage conditions, and stay on track with personalized digital care."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <LoadingProvider>
            {children}
          </LoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
