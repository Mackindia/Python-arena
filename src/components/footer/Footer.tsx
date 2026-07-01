import Link from "next/link";
import { FaGithub, FaInstagram, FaLinkedin, FaYoutube } from "react-icons/fa";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "Learn", href: "/learn" },
  { label: "Programs", href: "/#programs" },
  { label: "Practice", href: "/#features" },
  { label: "Resources", href: "/learn" },
];

const socialLinks = [
  { label: "YouTube", href: "#", icon: FaYoutube, hoverColor: "hover:border-red-200 hover:bg-red-50 hover:text-red-600" },
  { label: "Instagram", href: "#", icon: FaInstagram, hoverColor: "hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600" },
  { label: "LinkedIn", href: "#", icon: FaLinkedin, hoverColor: "hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600" },
  { label: "GitHub", href: "#", icon: FaGithub, hoverColor: "hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-slate-200 bg-gradient-to-b from-white to-slate-50 px-4 py-12 sm:px-6 lg:px-10">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-indigo-500/5 blur-3xl"></div>
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <p className="text-lg font-bold tracking-wider">
              <span className="bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">PYTHON ARENA</span>
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
              Learn coding with guided Python, AI, and computer science tracks.
              Interactive lessons, projects, and quizzes for aspiring developers.
            </p>
            <div className="mt-4 flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className={`rounded-lg border border-slate-200 bg-white p-2.5 text-slate-600 transition-all ${social.hoverColor}`}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
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

          {/* Contact */}
          <div>
            <h3 className="text-sm font-bold text-slate-900">Contact</h3>
            <ul className="mt-3 space-y-2.5 text-sm text-slate-600">
              <li>
                <a href="mailto:info@pythonarena.com" className="transition hover:text-indigo-600">
robogen1code1@gmail.com
                </a>
              </li>
              <li>
                <Link href="/dashboard" className="transition hover:text-indigo-600">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/educational-ai" className="transition hover:text-indigo-600">
                  Educational AI
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-slate-200 pt-6">
          <div className="flex flex-col items-center justify-between gap-3 text-xs text-slate-500 sm:flex-row">
            <p>
              &copy; {year} Python Arena. All rights reserved.
            </p>
            <p>
              Designed &amp; Developed by{" "}
              <span className="font-medium text-slate-700">Abhishek Rawat</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
