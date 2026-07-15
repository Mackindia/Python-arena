import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";

// Helper for fetch retries with exponential backoff
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  delay = 1000
): Promise<Response> {
  try {
    const response = await fetch(url, options);

    // Specifically catch 429 Too Many Requests
    if (response.status === 429 && retries > 0) {
      console.warn(`Gemini API 429 rate limit hit. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }

    return response;
  } catch (error) {
    if (retries > 0) {
      console.warn(`Fetch request failed. Retrying in ${delay}ms... (${retries} retries left)`, error);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { text, type } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required and must be a string." },
        { status: 400 }
      );
    }

    if (!type || typeof type !== "string") {
      return NextResponse.json(
        { error: "Tone adjustment type is required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE" || apiKey === "PASTE_REAL_KEY_HERE") {
      return NextResponse.json(
        {
          error: "GEMINI_API_KEY is missing or configured with the default placeholder in .env.local. Please replace it with your real Gemini API key from Google AI Studio.",
        },
        { status: 500 }
      );
    }

    // Build system instructions based on the requested correction tone
    let toneInstruction = "";
    switch (type) {
      case "grammar":
        toneInstruction = "Fix all grammar, spelling, punctuation, and typographical errors. Make the text highly readable and clean while keeping the original meaning. Do not write any preamble, explanation, quotes, or introduction. Output ONLY the corrected text.";
        break;
      case "polite":
        toneInstruction = "Rewrite the text to make it extremely polite, gentle, cooperative, and professionally warm. Ensure it communicates the core message clearly. Do not write any preamble, explanation, quotes, or introduction. Output ONLY the rewritten text.";
        break;
      case "warning":
        toneInstruction = "Rewrite the text to be a firm warning or serious official notice. It must sound formal, high-priority, clear about expectations, and mention the importance of compliance. Do not write any preamble, explanation, quotes, or introduction. Output ONLY the rewritten text.";
        break;
      case "angry":
        toneInstruction = "Rewrite the text to convey a strong, highly assertive, and firm tone expressing direct dissatisfaction or urgent correction. Keep it professional but clearly urgent and stern. Do not write any preamble, explanation, quotes, or introduction. Output ONLY the rewritten text.";
        break;
      case "formal":
        toneInstruction = "Rewrite the text to make it highly formal, academic, and business-professional. Use precise vocabulary and standard professional phrasing. Do not write any preamble, explanation, quotes, or introduction. Output ONLY the rewritten text.";
        break;
      default:
        toneInstruction = "Refine the text to be clear and professional. Do not write any preamble, explanation, quotes, or introduction. Output ONLY the refined text.";
    }

    const prompt = `You are a professional writing assistant.
Task: ${toneInstruction}

Input Text: "${text}"

Output:`;

    // Fetch call to Google Gemini API with robust retries
    const response = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    );

    if (response.status === 429) {
      return NextResponse.json(
        {
          error: "AI is currently busy. Please try again in a moment.",
          code: "RATE_LIMIT_EXCEEDED"
        },
        { status: 429 }
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Gemini API Error Response:", errorData);
      return NextResponse.json(
        {
          error: `Google Gemini API returned error: ${response.statusText || response.status}. ${
            errorData?.error?.message || "Unknown error."
          }`,
        },
        { status: response.status }
      );
    }

    const responseData = await response.json();
    const generatedText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      return NextResponse.json(
        { error: "Google Gemini API did not return any text output." },
        { status: 500 }
      );
    }

    // Clean up any extraneous markdown fences that Gemini sometimes returns
    const cleanedText = generatedText.trim().replace(/^["']|["']$/g, "");

    return NextResponse.json({ result: cleanedText }, { status: 200 });
  } catch (error: any) {
    console.error("Writing assistant route caught error:", error);
    return NextResponse.json(
      { error: error?.message || "An unexpected internal server error occurred." },
      { status: 500 }
    );
  }
}
