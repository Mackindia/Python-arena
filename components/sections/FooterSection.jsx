export default function FooterSection() {
  return (
    <footer className="border-t border-[rgba(255,255,255,0.08)] px-6 py-16 sm:px-10 lg:px-16">
      <div className="mx-auto grid w-full max-w-6xl gap-10 text-sm md:grid-cols-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-neon">
            Class XI · Python
          </p>
          <p className="mt-4 leading-relaxed text-ink-300">
            Interactive learning platform for Class XI students with structured notes, code
            practice, and AI-powered support.
          </p>
        </div>

        <div>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-100">
            Contact
          </h3>
          <ul className="mt-4 space-y-2 text-xs leading-relaxed text-ink-300">
            <li>support@classxipython.edu</li>
            <li>+91 90000 00000</li>
            <li>Mon–Sat, 9:00 AM – 6:00 PM</li>
          </ul>
        </div>

        <div>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-100">
            Navigation
          </h3>
          <ul className="mt-4 space-y-2 text-xs text-ink-300">
            <li>Home</li>
            <li>Chapters</li>
            <li>Practice Zone</li>
            <li>AI Tutor</li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-12 w-full max-w-6xl border-t border-[rgba(255,255,255,0.06)] pt-6">
        <p className="text-xs text-ink-500">
          © {new Date().getFullYear()} Class XI Python Interactive Learning Platform.
        </p>
      </div>
    </footer>
  );
}
