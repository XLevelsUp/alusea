// Syncs products into Meta's Commerce Catalog so they're browsable in WhatsApp. Auth: long-lived USER token, catalog_management scope, manual renewal — see .env.example.

const GRAPH_API_VERSION = "v23.0";

// Always production: Meta fetches these itself and rejects localhost (subcode 1803071).
const MARKETING_URL = process.env.META_PUBLIC_SITE_URL || "https://www.alusea.in";

type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  image_url: string;
  image_urls?: string[];
  price_per_sqft?: number | null;
};

function isConfigured(): boolean {
  return !!process.env.META_CATALOG_ID && !!process.env.META_CATALOG_ACCESS_TOKEN;
}

// Images are stored as relative paths or absolute Supabase URLs; Meta needs them fully-qualified.
function toAbsoluteImageUrl(url: string): string {
  const absolute = /^https?:\/\//i.test(url)
    ? url
    : `${MARKETING_URL}${url.startsWith("/") ? "" : "/"}${url}`;

  // "+" not %20: Graph re-encodes the % and stores %2520, which 404s.
  return absolute.replace(/ /g, "+");
}

function toCatalogItem(product: Product) {
  const startingPrice = product.price_per_sqft ?? 1500;

  return {
    retailer_id: product.id,
    name: product.name,
    description: product.description,
    availability: "in stock",
    condition: "new",
    // Integer in paise, not a formatted string: 150000 renders as ₹1,500.00.
    price: String(Math.max(0, Math.round(startingPrice * 100))),
    currency: "INR",
    image_url: toAbsoluteImageUrl(product.image_urls?.[0] || product.image_url),
    additional_image_urls: (product.image_urls || []).slice(1).map(toAbsoluteImageUrl),
    url: `${MARKETING_URL}/catalogue/${product.id}`,
    category: product.category,
    brand: "Alusea",
  };
}

async function graphRequest(path: string, params: Record<string, string>) {
  const token = process.env.META_CATALOG_ACCESS_TOKEN!;
  const url = new URL(`https://graph.facebook.com/${GRAPH_API_VERSION}${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  url.searchParams.set("access_token", token);

  const res = await fetch(url.toString(), { method: "POST" });
  const json = await res.json();

  if (!res.ok || json.error) {
    const message = json?.error?.message || `HTTP ${res.status}`;
    throw new Error(`Meta Catalog API error: ${message}`);
  }

  return json;
}

// Add and edit share this call: Meta treats a matching retailer_id as an update.
export async function syncProductToCatalog(product: Product): Promise<void> {
  if (!isConfigured()) {
    console.warn("Meta Catalog not configured (META_CATALOG_ID/META_CATALOG_ACCESS_TOKEN missing) — skipping catalog sync.");
    return;
  }

  const catalogId = process.env.META_CATALOG_ID!;
  const item = toCatalogItem(product);

  try {
    await graphRequest(`/${catalogId}/products`, {
      retailer_id: item.retailer_id,
      name: item.name,
      description: item.description,
      availability: item.availability,
      condition: item.condition,
      price: item.price,
      currency: item.currency,
      image_url: item.image_url,
      url: item.url,
      brand: item.brand,
      category: item.category,
      // Graph expects the extra gallery images as a JSON-encoded array.
      ...(item.additional_image_urls.length
        ? { additional_image_urls: JSON.stringify(item.additional_image_urls) }
        : {}),
    });
  } catch (error) {
    // Catalog sync failures shouldn't block saving the product in Supabase —
    // log loudly so it's visible, but let the admin action succeed.
    console.error(`Failed to sync product "${product.name}" (${product.id}) to Meta Catalog:`, error);
  }
}

// Deletes via items_batch (the products edge has no DELETE); async, so success means queued.
export async function removeProductFromCatalog(productId: string): Promise<void> {
  if (!isConfigured()) return;

  const catalogId = process.env.META_CATALOG_ID!;

  try {
    await graphRequest(`/${catalogId}/items_batch`, {
      item_type: "PRODUCT_ITEM",
      requests: JSON.stringify([{ method: "DELETE", data: { id: productId } }]),
    });
  } catch (error) {
    console.error(`Failed to remove product ${productId} from Meta Catalog:`, error);
  }
}
