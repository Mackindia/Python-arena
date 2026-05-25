import { NextResponse } from "next/server";
import { ESLint } from "eslint";

export async function GET() {
  try {
    const eslint = new ESLint();
    const results = await eslint.lintFiles([
      "VS CODE Final TT project Doon Scholars/timetable-web-app/src/**/*.{js,jsx}"
    ]);
    const formatter = await eslint.loadFormatter("stylish");
    const resultText = formatter.format(results);
    return NextResponse.json({ success: true, resultText: resultText || "No issues found" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
