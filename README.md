# Class XI Python Interactive Learning Platform

Modern student-friendly homepage built with Next.js, Tailwind CSS, Framer Motion, and a lightweight 3D hero element using @react-three/fiber.

## Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Project Structure

- `app/page.js`: Homepage composition
- `components/Hero3D.jsx`: Lightweight rotating 3D cube
- `components/sections/*`: Modular homepage sections
- `lib/content.js`: Reusable content data

## Notes

- 3D scene is intentionally simple for fast load and smooth performance.
- Styling uses Tailwind with custom brand colors and responsive layout.
- Animations use Framer Motion with subtle transitions.
