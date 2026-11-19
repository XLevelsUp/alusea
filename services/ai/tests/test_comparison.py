"""The "uPVC vs aluminium" suggestion always gets the same structured answer, with no AI call."""
import pytest

import alusea_ai_service.main as main
from alusea_ai_service.small_talk import COMPARISON, comparison


@pytest.mark.parametrize("message", ["uPVC vs aluminium", "upvc or aluminium?", "Aluminum vs uPVC", "uPVC vs aluminium, which is better?"])
def test_the_comparison_is_recognised(message):
    assert comparison(message, "en-IN") == COMPARISON["en-IN"]


@pytest.mark.parametrize("message", ["Is uPVC vs aluminium cheaper for a 10 ft door?", "aluminium sliding door", "uPVC"])
def test_other_questions_go_to_the_ai(message):
    assert comparison(message, "en-IN") is None


def test_every_language_has_the_same_structure():
    english_lines = COMPARISON["en-IN"].count("\n")
    for language, text in COMPARISON.items():
        assert text.count("•") == 6, language
        assert text.count("\n") == english_lines, language
        assert "lifetime service" in text, language


def test_the_suggestion_answers_without_the_ai(client, fake_services, monkeypatch):
    def no_ai(*args, **kwargs):
        raise AssertionError("The AI shouldn't be asked")

    monkeypatch.setattr(main, "generate_reply", no_ai)
    monkeypatch.setattr(main, "translate_reply", no_ai)
    for language in COMPARISON:
        answer = client.post("/chat", json={"message": "uPVC vs aluminium", "language": language})
        assert answer.status_code == 200
        assert answer.json()["content"] == COMPARISON[language]
