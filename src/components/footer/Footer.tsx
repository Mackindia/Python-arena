import Link from "next/link";
import { FaGithub, FaInstagram, FaLinkedin, FaYoutube } from "react-icons/fa";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "Learn", href: "/learn" },
  { label: "Practice", href: "/#features" },
  { label: "Projects", href: "/#learning-paths" },
  { label: "Resources", href: "/learn" },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-slate-200 bg-gradient-to-b from-white to-slate-50 px-4 py-12 sm:px-6 lg:px-10">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-indigo-500/5 blur-3xl"></div>
      </div>

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="text-lg font-bold tracking-wider">
            <span className="bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">PYTHON ARENA</span>
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
            Learn coding with guided Python, AI, and computer science tracks from Class 8 to Class 11.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-900">Quick Links</h3>
          <ul className="mt-3 space-y-2.5 text-sm text-slate-600">
            {quickLinks.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="transition hover:text-indigo-600">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-900">Follow Us</h3>
          <div className="mt-3 flex items-center gap-3">
            <a href="#" aria-label="YouTube" className="rounded-lg border border-slate-200 bg-white p-2.5 text-slate-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600">
              <FaYoutube className="h-4 w-4" />
            </a>
            <a href="#" aria-label="Instagram" className="rounded-lg border border-slate-200 bg-white p-2.5 text-slate-600 transition-all hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600">
              <FaInstagram className="h-4 w-4" />
            </a>
            <a href="#" aria-label="LinkedIn" className="rounded-lg border border-slate-200 bg-white p-2.5 text-slate-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600">
              <FaLinkedin className="h-4 w-4" />
            </a>
            <a href="#" aria-label="GitHub" className="rounded-lg border border-slate-200 bg-white p-2.5 text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900">
              <FaGithub className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      <div className="relative mx-auto mt-10 max-w-7xl border-t border-slate-200 pt-6 text-xs text-slate-500">
        Copyright {new Date().getFullYear()} Python Arena. All rights reserved.
      </div>
    </footer>
  );
}
