import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define the routes that require the user to be logged in (Gmail or Admission Number)
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)", 
  "/admin(.*)", 
  "/teacher(.*)",
  "/learn(.*)", // Protects all learning content
  "/lms(.*)"    // Protects the lesson viewer
]);

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    // If user is not logged in, this will redirect them to the Clerk Login page
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
