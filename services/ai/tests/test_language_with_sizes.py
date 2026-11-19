"""Sizes like "8ft" made the language check read an English message as Telugu, so they're left out of the check."""
import alusea_ai_service.translation as translation


class Answer:
    def raise_for_status(self):
        pass

    def json(self):
        return {"language_code": "en-IN"}


def test_sizes_are_left_out_of_the_language_check(monkeypatch):
    sent = []
    monkeypatch.setattr(translation.httpx, "post", lambda url, **kwargs: sent.append(kwargs["json"]["input"]) or Answer())
    assert translation.checked_language("8ft height 6 ft width..i need price", "en-IN") == "en-IN"
    assert sent == ["height width..i need price"]


def test_only_a_size_is_english_without_asking(monkeypatch):
    monkeypatch.setattr(translation.httpx, "post", lambda *args, **kwargs: (_ for _ in ()).throw(AssertionError("no check needed")))
    assert translation.checked_language("8 x 10 ft", "en-IN") == "en-IN"
    assert translation.checked_language("12 sq ft", "en-IN") == "en-IN"


def test_place_names_and_short_leftovers_never_reach_sarvam(monkeypatch):
    """Sarvam read "RS Puram showroom address" as Tamil and "sliding door price" as Malayalam."""
    monkeypatch.setattr(translation.httpx, "post", lambda *args, **kwargs: (_ for _ in ()).throw(AssertionError("no check")))
    assert translation.language_in_letters("RS Puram showroom address", "en-IN", "en-IN") == "en-IN"
    assert translation.language_in_letters("8 x 10 ft sliding door price", "en-IN", "en-IN") == "en-IN"
    assert translation.language_in_letters("Coimbatore Alusea showroom timing", "en-IN", "ta-IN") == "ta-IN"
