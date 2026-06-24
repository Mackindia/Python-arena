import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import AINews from "@/src/models/AINews";
import { fetchAINews } from "@/src/lib/fetchAINews";

export async function GET(request: Request) {
  try {
    await connectDB();

    // Check when we last fetched the AI news
    const lastArticle = await AINews.findOne().sort({ fetchedAt: -1 });
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    // If database is empty or latest fetched article is older than 15 minutes, trigger sync
    if (!lastArticle || lastArticle.fetchedAt < fifteenMinutesAgo) {
      console.log("AI News Cache is stale or empty. Triggering dynamic refresh...");
      try {
        await fetchAINews();
      } catch (syncErr) {
        console.error("Failed to perform background RSS sync, serving stale cache:", syncErr);
        // Fall back gracefully to serve existing database cache if RSS feed is offline/down
      }
    }

    // Parse pagination query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    
    const skip = (page - 1) * limit;
    const count = await AINews.countDocuments();

    // Retrieve paginated items sorted chronologically (newest first)
    const articles = await AINews.find()
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(count / limit);

    return NextResponse.json({
      success: true,
      articles,
      currentPage: page,
      totalPages,
      totalArticles: count,
    });
  } catch (error: any) {
    console.error("AI News API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to load AI news",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
