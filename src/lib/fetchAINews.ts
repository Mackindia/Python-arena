import { connectDB } from "@/src/lib/mongodb";
import AINews from "@/src/models/AINews";
import he from "he";
import Parser from "rss-parser";

function decodeEntities(str: string): string {
  if (!str) return "";
  try {
    return he.decode(str);
  } catch (e) {
    return str
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&rsquo;/g, "'")
      .replace(/&lsquo;/g, "'")
      .replace(/&ldquo;/g, '"')
      .replace(/&rdquo;/g, '"')
      .replace(/&nbsp;/g, " ");
  }
}

export async function fetchAINews() {
  await connectDB();
  const feedUrl = "https://www.artificialintelligence-news.com/feed/";
  let parsedArticles: any[] = [];
  const now = new Date();

  try {
    const parser = new Parser();
    const feed = await parser.parseURL(feedUrl);
    
    parsedArticles = feed.items.map((item: any) => {
      const title = decodeEntities(item.title || "");
      let description = item.contentSnippet || item.content || "Latest AI industry update";
      description = decodeEntities(description.replace(/<[^>]*>/g, "").substring(0, 200).trim());

      // Extract image using regex
      let image = "https://images.unsplash.com/photo-1677442136019-21780efad99a?w=600&auto=format&fit=crop&q=60";
      const imageMatch = (item.content || item.description || "").match(/<img.*?src="(.*?)"/);
      if (imageMatch && imageMatch[1]) {
        image = imageMatch[1];
      } else if (item.enclosure?.url) {
        image = item.enclosure.url;
      }

      return {
        title,
        description,
        image,
        link: item.link || "",
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        fetchedAt: now,
      };
    });
  } catch (err) {
    // Fallback: Custom regex XML parser if rss-parser is not available
    const res = await fetch(feedUrl);
    const xmlText = await res.text();
    const itemsRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemsRegex.exec(xmlText)) !== null) {
      const itemContent = match[1];

      const getTagValue = (tag: string) => {
        const regex = new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\/${tag}>`);
        const m = itemContent.match(regex);
        return m ? m[1].trim() : "";
      };

      const title = decodeEntities(getTagValue("title"));
      const link = getTagValue("link");
      const pubDate = getTagValue("pubDate");
      
      let description = getTagValue("description");
      description = decodeEntities(description.replace(/<[^>]*>/g, "").substring(0, 200).trim());

      let image = "https://images.unsplash.com/photo-1677442136019-21780efad99a?w=600&auto=format&fit=crop&q=60";
      const imageMatch = itemContent.match(/<img.*?src="(.*?)"/);
      if (imageMatch && imageMatch[1]) {
        image = imageMatch[1];
      } else {
        const enclosureMatch = itemContent.match(/<enclosure[^>]*url="([^"]*)"/);
        if (enclosureMatch) {
          image = enclosureMatch[1];
        }
      }

      parsedArticles.push({
        title,
        link,
        publishedAt: pubDate ? new Date(pubDate) : new Date(),
        description: description || "Latest AI industry update",
        image,
        fetchedAt: now,
      });
    }
  }

  // Insert only new articles, ignore duplicates
  let newArticlesInserted = 0;
  for (const article of parsedArticles) {
    try {
      const existing = await AINews.findOne({ link: article.link });
      if (!existing) {
        await AINews.create(article);
        newArticlesInserted++;
      } else {
        existing.fetchedAt = now;
        await existing.save();
      }
    } catch (dbErr) {
      console.error("Error inserting article:", article.title, dbErr);
    }
  }

  console.log(`Fetched news: ${parsedArticles.length} items. Newly inserted: ${newArticlesInserted}.`);

  // Cleanup: Keep only the latest 50 articles
  const count = await AINews.countDocuments();
  if (count > 50) {
    const extraCount = count - 50;
    const oldestArticles = await AINews.find()
      .sort({ publishedAt: 1 })
      .limit(extraCount);
    
    const idsToDelete = oldestArticles.map(a => a._id);
    if (idsToDelete.length > 0) {
      await AINews.deleteMany({ _id: { $in: idsToDelete } });
      console.log(`Auto Cleanup: Deleted ${idsToDelete.length} old articles beyond the 50 limit.`);
    }
  }

  return { success: true, inserted: newArticlesInserted };
}
