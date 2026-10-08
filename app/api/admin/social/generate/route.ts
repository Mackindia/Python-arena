import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdminApi } from "@/lib/admin-api";
import EventPost from "@/models/EventPost";
import { generateEventPost } from "@/lib/social-engine";

export const runtime = "nodejs";

const CATEGORIES = ["science", "sports", "cultural", "exam", "generic"];

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return "Unknown error";
}

export async function POST(request: NextRequest) {
  try {
    const access = await requireAdminApi();
    if (!access.ok) {
      return access.response;
    }

    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json({ message: "title is required" }, { status: 400 });
    }

    const category = CATEGORIES.includes(body.category) ? body.category : "generic";
    const seed = Number.isFinite(body.seed) ? Number(body.seed) : Math.floor(Math.random() * 100000);
    const graphics = body.graphics === "ai" ? "ai" : "svg";
    const backgroundPrompt =
      typeof body.backgroundPrompt === "string" ? body.backgroundPrompt.trim().slice(0, 600) : "";

    const event = {
      title,
      date: typeof body.date === "string" ? body.date.trim() : "",
      venue: typeof body.venue === "string" ? body.venue.trim() : "",
      tagline: typeof body.tagline === "string" ? body.tagline.trim() : "",
      category,
      seed,
    };

    await connectDB();
    const post = await EventPost.create({
      ...event,
      graphics,
      eventDate: body.eventDate ? new Date(body.eventDate) : null,
      status: "generating",
      createdBy: access.userId,
    });

    try {
      const generated = await generateEventPost(event, {
        aiBackground: graphics === "ai",
        backgroundPrompt,
      });
      post.imageUrl = generated.imageUrl;
      post.imagePublicId = generated.imagePublicId;
      post.caption = generated.caption;
      post.hashtags = generated.hashtags;
      post.graphics = generated.graphics;
      post.backgroundPrompt = generated.graphics === "ai" ? backgroundPrompt : "";
      post.status = "pending_review";
      post.error = "";
      await post.save();
    } catch (genError) {
      post.status = "failed";
      post.error = errorMessage(genError);
      post.attempts += 1;
      await post.save();
      return NextResponse.json(
        { message: "Image generation failed", post, error: post.error },
        { status: 502 },
      );
    }

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to generate post", error: errorMessage(error) },
      { status: 500 },
    );
  }
}
