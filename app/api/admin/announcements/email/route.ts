import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";

const RESEND_API = "https://api.resend.com/emails";

export async function POST(request: NextRequest) {
  try {
    const access = await requireAdminApi();
    if (!access.ok) {
      return access.response;
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ message: "RESEND_API_KEY is missing" }, { status: 500 });
    }

    const body = await request.json();
    if (!body.subject || !body.html || !Array.isArray(body.to) || body.to.length === 0) {
      return NextResponse.json({ message: "subject, html and to[] are required" }, { status: 400 });
    }

    const from = process.env.RESEND_FROM_EMAIL || "Python Arena <onboarding@resend.dev>";

    const response = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: body.to,
        subject: body.subject,
        html: body.html,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ message: "Resend send failed", error: data }, { status: 500 });
    }

    return NextResponse.json({ message: "Email sent", data });
  } catch (error) {
    return NextResponse.json({ message: "Failed to send emails", error: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}
