const GRAPH = "https://graph.facebook.com/v21.0";

export type IgConfig =
  | { ok: true; userId: string; token: string }
  | { ok: false; error: string };

export type IgCheckResult =
  | { ok: true; configured: true; userId: string; username: string }
  | { ok: false; configured: boolean; error: string };

export type IgPublishResult =
  | { ok: true; mediaId: string; permalink: string }
  | { ok: false; error: string };

type GraphErrorBody = {
  error?: { code?: number; error_subcode?: number; type?: string; message?: string };
};

export function isIgDryRun(): boolean {
  const value = (process.env.IG_DRY_RUN || "").trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

export function getIgConfig(): IgConfig {
  const userId = process.env.INSTAGRAM_USER_ID?.trim();
  const token = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  if (!userId || !token) {
    return {
      ok: false,
      error:
        "Instagram not configured: set INSTAGRAM_USER_ID and INSTAGRAM_ACCESS_TOKEN in the environment (or IG_DRY_RUN=true to simulate publishing).",
    };
  }
  return { ok: true, userId, token };
}

export function mapGraphError(data: GraphErrorBody, status: number): string {
  const err = data?.error;
  if (!err) return `Instagram API error (HTTP ${status}).`;
  if (err.code === 190) {
    if (err.error_subcode === 463 || err.error_subcode === 458) {
      return "Instagram token expired — generate a new long-lived token and update INSTAGRAM_ACCESS_TOKEN.";
    }
    return `Instagram auth failed: ${err.message || "invalid token"} (update INSTAGRAM_ACCESS_TOKEN).`;
  }
  if (err.code === 4 || err.code === 17 || status === 429) {
    return `Instagram rate limit hit: ${err.message || "too many requests"} — retry later.`;
  }
  if (err.code === 10 || err.code === 100) {
    return `Instagram permission/object error: ${err.message || "check ig-user-id and instagram_content_publish permission"}.`;
  }
  return err.message || `Instagram API error (code ${err.code ?? status}).`;
}

async function graphGet(path: string, params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${GRAPH}/${path}?${qs}`);
  const data = (await res.json().catch(() => ({}))) as GraphErrorBody & Record<string, unknown>;
  return { res, data };
}

async function graphPost(path: string, params: Record<string, string>) {
  const body = new URLSearchParams(params);
  const res = await fetch(`${GRAPH}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = (await res.json().catch(() => ({}))) as GraphErrorBody & Record<string, unknown>;
  return { res, data };
}

export async function checkInstagramConnection(): Promise<IgCheckResult> {
  if (isIgDryRun()) {
    return { ok: true, configured: true, userId: "dry-run", username: "dry-run (simulated)" };
  }

  const cfg = getIgConfig();
  if (!cfg.ok) {
    return { ok: false, configured: false, error: cfg.error };
  }

  try {
    const { res, data } = await graphGet(cfg.userId, {
      fields: "id,username",
      access_token: cfg.token,
    });
    if (!res.ok || data.error) {
      return { ok: false, configured: true, error: mapGraphError(data, res.status) };
    }
    return {
      ok: true,
      configured: true,
      userId: String(data.id ?? cfg.userId),
      username: String(data.username ?? ""),
    };
  } catch (error) {
    return {
      ok: false,
      configured: true,
      error: error instanceof Error ? error.message : "Network error contacting Instagram.",
    };
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function publishToInstagram(
  input: {
    imageUrl: string;
    caption: string;
  },
  attempt = 0,
): Promise<IgPublishResult> {
  if (isIgDryRun()) {
    const mediaId = `dry-run-${Date.now()}`;
    console.info(`[instagram] IG_DRY_RUN enabled — simulated publish, no media created (${mediaId}).`);
    return { ok: true, mediaId, permalink: "" };
  }

  const cfg = getIgConfig();
  if (!cfg.ok) {
    return { ok: false, error: cfg.error };
  }
  if (!input.imageUrl) {
    return { ok: false, error: "Post has no image URL." };
  }

  try {
    const create = await graphPost(`${cfg.userId}/media`, {
      image_url: input.imageUrl,
      caption: input.caption,
      access_token: cfg.token,
    });
    if (create.res.status === 429 || create.data.error?.code === 4) {
      if (attempt >= 2) {
        return { ok: false, error: "Instagram rate limit persisted after retries." };
      }
      await sleep(30000);
      return publishToInstagram(input, attempt + 1);
    }
    if (!create.res.ok || create.data.error) {
      return { ok: false, error: mapGraphError(create.data, create.res.status) };
    }
    const creationId = String(create.data.id ?? "");
    if (!creationId) {
      return { ok: false, error: "Instagram did not return a container id." };
    }

    let statusCode = "";
    for (let i = 0; i < 15; i++) {
      const poll = await graphGet(creationId, {
        fields: "status_code",
        access_token: cfg.token,
      });
      if (poll.data.error) {
        return { ok: false, error: mapGraphError(poll.data, poll.res.status) };
      }
      statusCode = String(poll.data.status_code ?? "");
      if (statusCode === "FINISHED") break;
      if (statusCode === "ERROR") {
        return { ok: false, error: "Instagram failed to process the image container." };
      }
      await sleep(2000);
    }
    if (statusCode !== "FINISHED") {
      return { ok: false, error: `Image container not ready (status: ${statusCode || "unknown"}).` };
    }

    const publish = await graphPost(`${cfg.userId}/media_publish`, {
      creation_id: creationId,
      access_token: cfg.token,
    });
    if (!publish.res.ok || publish.data.error) {
      return { ok: false, error: mapGraphError(publish.data, publish.res.status) };
    }
    const mediaId = String(publish.data.id ?? "");
    if (!mediaId) {
      return { ok: false, error: "Instagram did not return a media id." };
    }

    const details = await graphGet(mediaId, {
      fields: "permalink,username",
      access_token: cfg.token,
    });
    return {
      ok: true,
      mediaId,
      permalink: String(details.data.permalink ?? ""),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Network error contacting Instagram.",
    };
  }
}
