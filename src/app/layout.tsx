import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SevenCrash — Learn anything in 7 days",
  description: "AI 7-Day Crash Courses. Bite-sized plans, tasks & quizzes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
