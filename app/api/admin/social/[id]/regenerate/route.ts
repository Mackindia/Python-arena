import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdminApi } from "@/lib/admin-api";
import EventPost from "@/models/EventPost";
import { generateEventPost } from "@/lib/social-engine";

export const runtime = "nodejs";

const REGENERATABLE = ["draft", "pending_review", "failed", "approved"];

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return "Unknown error";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const access = await requireAdminApi();
    if (!access.ok) {
      return access.response;
    }

    const { id } = await params;
    await connectDB();
    const post = await EventPost.findById(id);
    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }
    if (!REGENERATABLE.includes(post.status)) {
      return NextResponse.json(
        { message: `Cannot regenerate a post in status "${post.status}"` },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const seed = Number.isFinite(body.seed)
      ? Number(body.seed)
      : Math.floor(Math.random() * 100000);
    const graphics =
      body.graphics === "ai" || body.graphics === "svg"
        ? body.graphics
        : post.graphics === "ai"
          ? "ai"
          : "svg";
    const backgroundPrompt =
      typeof body.backgroundPrompt === "string" && body.backgroundPrompt.trim()
        ? body.backgroundPrompt.trim().slice(0, 600)
        : (post.backgroundPrompt || "");

    const event = {
      title: post.title,
      date: post.date,
      venue: post.venue,
      tagline: post.tagline,
      category: post.category,
      seed,
    };

    const hadEditedCaption = post.caption.trim().length > 0;

    try {
      const generated = await generateEventPost(event, {
        aiBackground: graphics === "ai",
        backgroundPrompt,
      });
      post.seed = seed;
      post.imageUrl = generated.imageUrl;
      post.imagePublicId = generated.imagePublicId;
      post.graphics = generated.graphics;
      post.backgroundPrompt = generated.graphics === "ai" ? backgroundPrompt : "";
      if (!hadEditedCaption) {
        post.caption = generated.caption;
        post.hashtags = generated.hashtags;
      }
      post.status = "pending_review";
      post.error = "";
      await post.save();
    } catch (genError) {
      post.status = "failed";
      post.error = errorMessage(genError);
      post.attempts += 1;
      await post.save();
      return NextResponse.json(
        { message: "Regeneration failed", post, error: post.error },
        { status: 502 },
      );
    }

    return NextResponse.json({ post });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to regenerate post", error: errorMessage(error) },
      { status: 500 },
    );
  }
}
