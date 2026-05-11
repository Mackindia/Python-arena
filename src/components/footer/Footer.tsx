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
    <footer className="border-t border-slate-200 bg-white px-4 py-12 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-3">
        <div>
          <p className="text-sm font-bold tracking-[0.2em] text-slate-900">PYTHON ARENA</p>
          <p className="mt-3 max-w-sm text-sm text-slate-600">
            Learn coding with guided Python, AI, and computer science tracks from Class 6 to Class 12.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">Quick Links</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {quickLinks.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="transition hover:text-slate-900">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">Follow Us</h3>
          <div className="mt-3 flex items-center gap-3 text-slate-600">
            <a href="#" aria-label="YouTube" className="rounded-lg border border-slate-300 p-2 transition hover:bg-slate-100">
              <FaYoutube className="h-4 w-4" />
            </a>
            <a href="#" aria-label="Instagram" className="rounded-lg border border-slate-300 p-2 transition hover:bg-slate-100">
              <FaInstagram className="h-4 w-4" />
            </a>
            <a href="#" aria-label="LinkedIn" className="rounded-lg border border-slate-300 p-2 transition hover:bg-slate-100">
              <FaLinkedin className="h-4 w-4" />
            </a>
            <a href="#" aria-label="GitHub" className="rounded-lg border border-slate-300 p-2 transition hover:bg-slate-100">
              <FaGithub className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-7xl border-t border-slate-200 pt-5 text-xs text-slate-500">
        Copyright {new Date().getFullYear()} Python Arena. All rights reserved.
      </div>
    </footer>
  );
}
