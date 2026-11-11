import re

import httpx

from alusea_ai_service.tools import BASE_URL, HEADERS, SITE_URL, area_sq_ft, log_query

PRODUCT_MARKER = re.compile(r"\[product:\s*([^\]\s]*)\s*\]", re.IGNORECASE)
ESTIMATE_MARKER = re.compile(r"\[estimate:([0-9a-f-]{36}):([\d.]+):([\d.]+):(\d+)\]", re.IGNORECASE)
BUDGET_MARKER = re.compile(r"\[budget:([0-9a-f-]{36}):(\d+)\]", re.IGNORECASE)
UUID_PATTERN = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.IGNORECASE)
LIST_LINE = re.compile(r"^[ \t]*(?:[-•*]|\d+\.)[ \t]+.*$", re.MULTILINE)


def close_blank_lines(text: str) -> str:
    """Reduce any run of blank lines to one, and trim the ends."""
    return re.sub(r"\s*\n\s*\n\s*", "\n\n", text).strip()


def remove_markers(reply: str) -> str:
    return BUDGET_MARKER.sub("", ESTIMATE_MARKER.sub("", PRODUCT_MARKER.sub("", reply)))


def markers_in(reply: str) -> list[str]:
    return [found[0] for marker in (ESTIMATE_MARKER, BUDGET_MARKER, PRODUCT_MARKER) for found in marker.finditer(reply)]


def split_reply(reply: str) -> tuple[str, list[str], dict[str, tuple[float, float, int]], dict[str, int]]:
    """Take the markers out of a reply, and return the text, the product ids, and any sizes and budgets to work out."""
    budgets = {product_id.lower(): int(amount) for product_id, amount in BUDGET_MARKER.findall(reply)}
    sizes = {}
    for product_id, width, height, quantity in ESTIMATE_MARKER.findall(reply):
        try:
            sizes[product_id.lower()] = (float(width), float(height), int(quantity))
        except ValueError:
            continue

    ids = [*sizes, *budgets]
    for found in PRODUCT_MARKER.findall(reply):
        product_id = found.lower()
        if UUID_PATTERN.match(product_id) and product_id not in ids:
            ids.append(product_id)
    # Removing a marker leaves its empty line behind.
    return close_blank_lines(remove_markers(reply)), ids, sizes, budgets


def set_cards(
    reply: str,
    product_ids: list[str],
    estimates: list[dict] | None = None,
    budget: int | None = None,
) -> str:
    """Replace a reply's markers, so its cards come from your code's results and not the model's choice."""
    markers = [
        f"[estimate:{item['id']}:{item['width_ft']}:{item['height_ft']}:{item['quantity']}]"
        for item in estimates or []
    ]
    if not markers and budget:
        markers = [f"[budget:{product_id}:{budget}]" for product_id in product_ids]
    if not markers:
        markers = [f"[product:{product_id}]" for product_id in product_ids]
    return "\n\n".join([remove_markers(reply).strip(), *markers]).strip()


def load_cards(ids: list[str]) -> list[dict]:
    """Read card details from the catalogue. An id that isn't a real product simply returns nothing."""
    if not ids:
        return []
    try:
        response = httpx.get(
            f"{BASE_URL}/products",
            headers=HEADERS,
            params={
                "id": f"in.({','.join(ids)})",
                "select": "id,name,category,description,price_per_sqft,image_url",
            },
            timeout=10,
        )
        log_query(response)
        response.raise_for_status()
    except httpx.HTTPError as error:
        # The answer is still useful without its cards.
        print(f"Could not load product cards: {error}")
        return []

    rows = {row["id"]: row for row in response.json()}
    return [
        {**rows[product_id], "url": f"{SITE_URL}/catalogue/{product_id}"}
        for product_id in ids
        if product_id in rows
    ]


def present(content: str) -> dict:
    """Turn a saved reply into text plus product cards for the page."""
    text, ids, sizes, budgets = split_reply(content)
    cards = load_cards(ids)
    for card in cards:
        if card["id"] in sizes:
            area = area_sq_ft(*sizes[card["id"]])
            card["estimate"] = {"area_sq_ft": area, "amount": round(area * card["price_per_sqft"])}
        elif card["id"] in budgets and card["price_per_sqft"]:
            amount = budgets[card["id"]]
            card["budget"] = {"amount": amount, "area_sq_ft": int(amount // card["price_per_sqft"])}
    if cards:
        # The cards already list the products, so a bullet list in the text would only repeat them.
        # If that leaves no text, the page shows its own intro in the visitor's language.
        text = close_blank_lines(LIST_LINE.sub("", text))
    return {"content": text, "products": cards}