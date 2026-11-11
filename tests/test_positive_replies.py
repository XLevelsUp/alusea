"""Sara never refuses: a reply that says what she can't do is asked for once more, positively."""
import pytest

import alusea_ai_service.agent as agent
import alusea_ai_service.prompt as prompt
from conftest import ai_answer, fake_groq


def answering(monkeypatch, *replies):
    sent = []
    answers = iter(replies)

    def create(messages, **request):
        sent.append(messages)
        return ai_answer(next(answers))

    monkeypatch.setattr(agent, "client", fake_groq(create))
    return sent


@pytest.mark.parametrize("refusal", ["I can't promise a discount.", "We cannot reduce the price.", "That's not possible right now.", "I can’t do that."])
def test_a_refusal_is_asked_for_again_positively(monkeypatch, refusal):
    sent = answering(monkeypatch, refusal, "Our team will work out the best price for your order. Shall they call you?")
    assert agent.generate_reply([], "Can you reduce the price?") == "Our team will work out the best price for your order. Shall they call you?"
    assert agent.POSITIVE_REMINDER in sent[1][-1]["content"]


def test_a_second_refusal_is_used_rather_than_failing(monkeypatch):
    answering(monkeypatch, "I can't promise a discount.", "I cannot promise that.")
    assert agent.generate_reply([], "Can you reduce the price?") == "I cannot promise that."


def test_a_positive_reply_is_not_asked_again(monkeypatch):
    sent = answering(monkeypatch, "Our team will work out the best price for you.")
    agent.generate_reply([], "Can you reduce the price?")
    assert len(sent) == 1


def test_the_instructions_never_refuse_a_discount():
    assert "never refuse or say no" in prompt.SYSTEM_PROMPT
    assert "never refuse or say no" in prompt.call_prompt("ta-IN")
    assert "not possible" in prompt.SYSTEM_PROMPT
