import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import ClerkUserSync from "@/src/components/auth/ClerkUserSync";
import HashEducationalAIRedirect from "@/src/components/educational-ai/HashEducationalAIRedirect";
import ChatWidget from "@/src/components/chat/ChatWidget";
import Navbar from "@/src/components/navbar/Navbar";
import NoticeBoard from "@/src/components/dashboard/NoticeBoard";
import Footer from "@/src/components/footer/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Python Arena",
  description: "Learn Python and AI from Class 8 to Class 11",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const hasClerkConfig =
    Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) &&
    Boolean(process.env.CLERK_SECRET_KEY);

  if (!hasClerkConfig) {
    return (
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
        suppressHydrationWarning
      >
        <body className="min-h-full bg-slate-950 text-slate-100" suppressHydrationWarning>
          <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 text-center">
            <h1 className="text-3xl font-bold sm:text-4xl">Deployment Configuration Required</h1>
            <p className="mt-4 text-sm text-slate-300 sm:text-base">
              This deployment is missing Clerk environment variables and cannot start authenticated pages.
            </p>
            <div className="mt-6 rounded-xl border border-slate-700 bg-slate-900/70 p-4 text-left text-sm text-slate-200">
              <p className="font-semibold">Set these Railway variables and redeploy:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</li>
                <li>CLERK_SECRET_KEY</li>
              </ul>
            </div>
          </main>
        </body>
      </html>
    );
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ClerkProvider>
          <ClerkUserSync />
          <HashEducationalAIRedirect />
          <Navbar />
          <NoticeBoard />
          <main className="flex-1">{children}</main>
          <ChatWidget />
          <Footer />
        </ClerkProvider>
      </body>
    </html>
  );
}
