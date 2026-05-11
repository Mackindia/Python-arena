import matter from "gray-matter";
import { remark } from "remark";
import remarkHtml from "remark-html";
import { readFile } from "node:fs/promises";

export type ParsedLesson = {
  html: string;
  frontmatter: Record<string, unknown>;
  rawContent: string;
};

export async function parseMarkdownFile(filePath: string): Promise<ParsedLesson> {
  const file = await readFile(filePath, "utf8");
  const { content, data } = matter(file);
  const processed = await remark().use(remarkHtml).process(content);

  return {
    html: processed.toString(),
    frontmatter: data,
    rawContent: content,
  };
}
