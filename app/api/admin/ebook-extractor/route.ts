import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const BASE_URL = "https://orangewebsupport.co.in/assets/files/ebook/Touchpad_Aiv3.0_417";

// Class 9, 10: Remote online images (file-pageN.jpg)
const REMOTE_CLASS_PATHS: Record<string, string> = {
  "9": "Book9/Touchpad_AI_Ebook-9_V3.0/resources/book/",
  "10": "Book10/Touchpad_AI_Ebook-10_V3.0/resources/book/",
};

// Class 11: Local flipbook folder (N.jpg)
const LOCAL_CLASS_PATHS: Record<string, string> = {
  "11": "D:\\downloads data\\AI Ver 3.0 class 11\\class 11\\files\\mobile",
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classNum = searchParams.get("class");
    const page = searchParams.get("page");

    if (!classNum || !page) {
      return NextResponse.json(
        { error: "Missing class or page parameter" },
        { status: 400 }
      );
    }

    // Remote classes (9, 10): fetch from online server
    if (REMOTE_CLASS_PATHS[classNum]) {
      const imageUrl = `${BASE_URL}/${REMOTE_CLASS_PATHS[classNum]}file-page${page}.jpg`;

      const response = await fetch(imageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: `Page ${page} not found for Class ${classNum}` },
          { status: 404 }
        );
      }

      const imageBuffer = await response.arrayBuffer();

      return new NextResponse(imageBuffer, {
        headers: {
          "Content-Type": "image/jpeg",
          "Content-Disposition": `inline; filename="page_${page}.jpg"`,
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    // Local classes (11): read from extracted flipbook folder
    if (LOCAL_CLASS_PATHS[classNum]) {
      const localDir = LOCAL_CLASS_PATHS[classNum];
      const imagePath = join(localDir, `${page}.jpg`);

      if (!existsSync(imagePath)) {
        return NextResponse.json(
          { error: `Page ${page} not found for Class ${classNum}` },
          { status: 404 }
        );
      }

      const imageBuffer = readFileSync(imagePath);

      return new NextResponse(imageBuffer, {
        headers: {
          "Content-Type": "image/jpeg",
          "Content-Disposition": `inline; filename="page_${page}.jpg"`,
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    return NextResponse.json(
      { error: `Class ${classNum} not supported` },
      { status: 400 }
    );
  } catch (error) {
    console.error("Ebook proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch page" },
      { status: 500 }
    );
  }
}
