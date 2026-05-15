import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black px-4 py-10">
      <SignIn forceRedirectUrl="/dashboard" fallbackRedirectUrl="/dashboard" />
      
      <div className="mt-8 text-center">
        <p className="text-gray-400 text-sm">
          Forgot your password?{" "}
          <Link 
            href="/forgot-password" 
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            Request a reset from Admin
          </Link>
        </p>
      </div>
    </main>
  );
}