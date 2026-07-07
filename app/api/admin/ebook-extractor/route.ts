import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://orangewebsupport.co.in/assets/files/ebook/Touchpad_Aiv3.0_417";

const CLASS_PATHS: Record<string, string> = {
  "9": "Book9/Touchpad_AI_Ebook-9_V3.0/resources/book/",
  "10": "Book10/Touchpad_AI_Ebook-10_V3.0/resources/book/",
  "11": "Book11/Touchpad_AI_Ebook-11_V3.0/resources/book/",
  "12": "Book12/Touchpad_AI_Ebook-12_V3.0/resources/book/",
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

    if (!CLASS_PATHS[classNum]) {
      return NextResponse.json(
        { error: `Class ${classNum} not supported` },
        { status: 400 }
      );
    }

    const imageUrl = `${BASE_URL}/${CLASS_PATHS[classNum]}file-page${page}.jpg`;

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
  } catch (error) {
    console.error("Ebook proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch page" },
      { status: 500 }
    );
  }
}
