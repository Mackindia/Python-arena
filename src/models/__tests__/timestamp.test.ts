import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const noteContent = fs.readFileSync("src/models/PrivateNote.ts", "utf-8");
const pdfContent = fs.readFileSync("src/models/PrivatePdf.ts", "utf-8");
const clientContent = fs.readFileSync("src/components/admin/PrivateNotesClient.tsx", "utf-8");

describe("Timestamp Feature - PrivateNote & PrivatePdf", () => {
  it("IPrivateNote has createdAt and updatedAt", () => {
    assert.ok(noteContent.includes("createdAt: Date"));
    assert.ok(noteContent.includes("updatedAt: Date"));
  });

  it("IPrivatePdf has createdAt and updatedAt", () => {
    assert.ok(pdfContent.includes("createdAt: Date"));
    assert.ok(pdfContent.includes("updatedAt: Date"));
  });

  it("PrivateNote schema has timestamps: true", () => {
    assert.ok(noteContent.includes("timestamps: true"));
  });

  it("PrivatePdf schema has timestamps: true", () => {
    assert.ok(pdfContent.includes("timestamps: true"));
  });

  it("Notes sidebar shows year in date", () => {
    assert.ok(clientContent.includes('year: "numeric"'), "year: numeric not found in PrivateNotesClient");
  });

  it("PDF list shows year in date", () => {
    const pdfDateSection = clientContent.substring(
      clientContent.indexOf("pdf.updatedAt"),
      clientContent.indexOf("pdf.updatedAt") + 200
    );
    assert.ok(pdfDateSection.includes('year: "numeric"'), "PDF date missing year");
  });
});
