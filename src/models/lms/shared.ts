import type { SchemaOptions } from "mongoose";

export function toSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export const commonSchemaOptions: SchemaOptions = {
  timestamps: true,
};
