import { Sora, Nunito } from "next/font/google";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
});

export const metadata = {
  title: "Class XI Python Interactive Learning Platform",
  description:
    "Learn Class XI Python with interactive notes, practical programs, chapter guidance, and AI-powered support.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${sora.variable} ${nunito.variable} font-body antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
