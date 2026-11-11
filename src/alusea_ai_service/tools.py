import os
import re
import uuid
from urllib.parse import unquote

import httpx
from dotenv import load_dotenv

from alusea_ai_service.sheet import send_lead
from alusea_ai_service.store import save_lead

load_dotenv()

BASE_URL = f"{os.environ['ALUSEA_SUPABASE_URL']}/rest/v1"
ANON_KEY = os.environ["ALUSEA_ANON_KEY"]
HEADERS = {"apikey": ANON_KEY, "Authorization": f"Bearer {ANON_KEY}"}
SITE_URL = "https://www.alusea.in"
FEET_PER_UNIT = {"ft": 1.0, "in": 1 / 12, "m": 3.28084, "cm": 0.0328084, "mm": 0.00328084}
MAX_SIDE_FT = 100
MAX_QUANTITY = 500
MAX_TOTAL_BUDGET = 100_000_000
MAX_NAME_CHARACTERS = 60
MAX_NOTE_CHARACTERS = 300


def request_callback(name: str | None, phone: str | None, note: str | None, visitor_id: str | None, language: str) -> dict:
    """Save a callback request after checking the phone number looks like an Indian mobile number."""
    name = (name or "").strip()[:MAX_NAME_CHARACTERS]
    digits = re.sub(r"\D", "", str(phone or ""))
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    elif len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]
    if not name:
        return {"error": "The name is missing. Ask for their name."}
    if not re.fullmatch(r"[6-9]\d{9}", digits):
        return {"error": "That doesn't look like a 10-digit mobile number. Ask them to check it."}
    phone = f"+91{digits}"
    note = (note or "").strip()[:MAX_NOTE_CHARACTERS]
    save_lead(visitor_id, name, phone, note, language)
    send_lead(name, phone, note, language)
    return {"saved": True}


def log_query(response: httpx.Response) -> None:
    """Print the database query that was run. The key is sent in headers, so it isn't in this address."""
    print(f"Supabase query: {unquote(str(response.url))} -> {response.status_code}")


def price_of(product_id: str) -> float | None:
    """Look up one product's price for code to compare. It is never passed to the model."""
    try:
        uuid.UUID(product_id)
    except ValueError:
        return None
    response = httpx.get(
        f"{BASE_URL}/products",
        headers=HEADERS,
        params={"id": f"eq.{product_id}", "select": "price_per_sqft"},
        timeout=10,
    )
    log_query(response)
    response.raise_for_status()
    rows = response.json()
    return rows[0]["price_per_sqft"] if rows else None


def get_products(
    category: str | None = None,
    max_price: float | None = None,
    cheaper_than: str | None = None,
    name: str | None = None,
) -> list[dict]:
    """Return products for the model, optionally filtered. Prices are left out on purpose: only the cards show them."""
    params = {
        # Specs come with the list, so answering a question about a product doesn't need a second, costly AI request.
        "select": "id,name,category,description,specs",
        "order": "created_at.desc",
    }
    if cheaper_than:
        price = price_of(cheaper_than)
        if price is None:
            return []
        params["price_per_sqft"] = f"lt.{price}"
    if category:
        # Partial match, so "Windows" also finds "Windows & Sliding".
        params["category"] = f"ilike.*{category.strip()}*"
    if name:
        params["name"] = f"ilike.*{name.strip()}*"
    if max_price is not None and not cheaper_than:
        params["price_per_sqft"] = f"lte.{float(max_price)}"

    response = httpx.get(
        f"{BASE_URL}/products",
        headers=HEADERS,
        params=params,
        timeout=10,
    )
    log_query(response)
    response.raise_for_status()
    return response.json()


def budget_options(budget: float, category: str | None = None) -> dict:
    """Return products for a total budget. The cards work out what it covers, so the model never sees a price."""
    budget = float(budget)
    if not 0 < budget <= MAX_TOTAL_BUDGET:
        return {"error": "That budget is outside what can be worked out here. Offer the sales team's help."}
    return {"budget": round(budget), "products": get_products(category)}


def get_product(product_id: str) -> dict:
    """Return one product's details without its price, or an error the model can explain."""
    try:
        uuid.UUID(product_id)
    except ValueError:
        return {"error": "That is not a valid product id. Use an id from get_products."}

    response = httpx.get(
        f"{BASE_URL}/products",
        headers=HEADERS,
        params={"id": f"eq.{product_id}", "select": "id,name,category,description,specs"},
        timeout=10,
    )
    log_query(response)
    response.raise_for_status()
    rows = response.json()
    if not rows:
        return {"error": "No product has that id."}

    product = rows[0]
    product["page_url"] = f"{SITE_URL}/catalogue/{product['id']}"
    return product


def area_sq_ft(width_ft: float, height_ft: float, quantity: int) -> float:
    """Return the total area, worked out the same way for the tool and the card."""
    return round(width_ft * height_ft * quantity, 2)


def estimate_price(product_id: str, width: float, height: float, unit: str = "ft", quantity: int = 1) -> dict:
    """Check a size for one product. The rupee amount is worked out later for the card, so the model never sees it."""
    try:
        uuid.UUID(product_id)
        feet_per_unit = FEET_PER_UNIT[unit]
        width_ft = round(float(width) * feet_per_unit, 2)
        height_ft = round(float(height) * feet_per_unit, 2)
        quantity = int(quantity)
    except (KeyError, TypeError, ValueError):
        return {"error": "Use a product id from get_products, numbers for the size, and a unit of ft, in, m, cm or mm."}

    if not (0 < width_ft <= MAX_SIDE_FT and 0 < height_ft <= MAX_SIDE_FT and 1 <= quantity <= MAX_QUANTITY):
        return {"error": "That size or quantity is outside what can be estimated here. Offer the sales team's help."}

    response = httpx.get(
        f"{BASE_URL}/products",
        headers=HEADERS,
        params={"id": f"eq.{product_id}", "select": "id,name"},
        timeout=10,
    )
    log_query(response)
    response.raise_for_status()
    rows = response.json()
    if not rows:
        return {"error": "No product has that id."}

    return {
        "id": rows[0]["id"],
        "name": rows[0]["name"],
        "width_ft": width_ft,
        "height_ft": height_ft,
        "quantity": quantity,
        "area_sq_ft": area_sq_ft(width_ft, height_ft, quantity),
    }
