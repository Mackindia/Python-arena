import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard/((?!documents).*)",  // all /dashboard/* except /dashboard/documents
  "/dashboard$",                   // /dashboard itself still protected
  "/admin(.*)", 
  "/teacher(.*)",
  "/learn(.*)",
  "/lms(.*)"
]);

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Exclude pdf-view API from Clerk middleware to prevent dev-mode redirect aborting iframe loads
    "/((?!.+\\.[\\w]+$|_next|api/pdf-view).*)",
    "/",
    "/(api(?!/pdf-view)|trpc)(.*)",
  ],
};