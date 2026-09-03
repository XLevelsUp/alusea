import InstagramFeedClient from "./InstagramFeedClient";
import type { InstagramMedia } from "./InstagramFeedClient";

const FIELDS = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";

async function fetchInstagramMedia(token: string): Promise<InstagramMedia[]> {
  try {
    // Fetch a larger page since the account mixes media types, then keep videos only
    const res = await fetch(
      `https://graph.instagram.com/me/media?fields=${FIELDS}&limit=20&access_token=${token}`,
      // Revalidate hourly so new reels show up (and take the center spot) automatically
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      console.error("Instagram feed fetch failed:", res.status, await res.text());
      return [];
    }

    const json: { data?: InstagramMedia[] } = await res.json();
    return (json.data ?? [])
      // Instagram's API occasionally omits media_url for a reel (CDN/processing
      // state on their end) — without it there's nothing playable to embed, so
      // skip those rather than showing a card whose video can never load.
      .filter((item) => item.media_type === "VIDEO" && !!item.media_url)
      .slice(0, 4);
  } catch (error) {
    console.error("Instagram feed error:", error);
    return [];
  }
}

export default async function InstagramFeed() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token || token === "your_instagram_long_lived_access_token") return null;

  const items = await fetchInstagramMedia(token);
  if (items.length === 0) return null;

  return <InstagramFeedClient items={items} />;
}
