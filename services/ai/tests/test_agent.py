import json

import httpx
import pytest
from groq import APITimeoutError, InternalServerError, RateLimitError

import alusea_ai_service.agent as agent
from conftest import ai_answer, fake_groq

REQUEST = httpx.Request("POST", "https://api.groq.com/test")


class FakeLimit(RateLimitError):
    def __init__(self, wait="20s"):
        Exception.__init__(self, f"Rate limit reached. Please try again in {wait}.")


def failing_models(monkeypatch, problems):
    """Groq that fails on the models given, and answers on the rest."""
    tried = []

    def create(messages, **request):
        tried.append(request["model"])
        if request["model"] in problems:
            raise problems[request["model"]]()
        return ai_answer(f"from {request['model']}")

    monkeypatch.setattr(agent, "groq_client", lambda key, fake=fake_groq(create): fake)
    return tried


@pytest.mark.parametrize("problem", [
    FakeLimit,
    lambda: APITimeoutError(request=REQUEST),
    lambda: InternalServerError("server error", response=httpx.Response(500, request=REQUEST), body=None),
])
def test_a_failing_main_model_moves_to_the_backup(monkeypatch, problem):
    tried = failing_models(monkeypatch, {agent.MODEL: problem})
    assert agent.generate_reply([], "Hello there friend") == f"from {agent.GROQ_BACKUP_MODEL}"
    assert tried == [agent.MODEL, agent.GROQ_BACKUP_MODEL]


def test_the_free_backup_is_tried_last(monkeypatch):
    failing_models(monkeypatch, {agent.MODEL: FakeLimit, agent.GROQ_BACKUP_MODEL: FakeLimit})
    monkeypatch.setattr(agent, "ask_backup", lambda messages, request: ai_answer("from the free backup"))
    assert agent.generate_reply([], "Hello there friend") == "from the free backup"


def test_all_models_down_raises_the_limit_with_its_wait(monkeypatch):
    failing_models(monkeypatch, {agent.MODEL: FakeLimit, agent.GROQ_BACKUP_MODEL: lambda: FakeLimit("12s")})
    monkeypatch.setattr(agent, "ask_backup", lambda messages, request: None)
    with pytest.raises(RateLimitError, match="12s"):
        agent.generate_reply([], "Hello there friend")


def test_an_empty_reply_is_asked_for_once_more(monkeypatch):
    answers = iter([ai_answer(None), ai_answer("Which room is this for?")])
    monkeypatch.setattr(agent, "groq_client", lambda key, fake=fake_groq(lambda **request: next(answers)): fake)
    assert agent.generate_reply([], "kitchen ku paakanu") == "Which room is this for?"


def test_two_empty_replies_fail(monkeypatch):
    monkeypatch.setattr(agent, "groq_client", lambda key, fake=fake_groq(lambda **request: ai_answer("")): fake)
    with pytest.raises(RuntimeError):
        agent.generate_reply([], "kitchen ku paakanu")


def test_blank_tool_values_count_as_no_filter():
    assert agent.parse_arguments('{"cat": "", "category": "", "max_price": ""}') == {}
    assert agent.parse_arguments('{"category": "Doors", "max_price": 500}') == {"category": "Doors", "max_price": 500}


def test_a_quantity_of_zero_is_refused():
    result = agent.run_tool("estimate_price", '{"id": "71fbe747-bfd7-4ac7-afcb-a9ff4d954232", "width": 8, "height": 10, "quantity": 0}')
    assert "error" in result


def test_the_full_product_list_goes_to_the_ai_in_short_form(monkeypatch):
    products = [{"id": f"id{number}", "name": f"Product {number}", "category": "Doors", "description": "Long text", "specs": {"glass": "x"}} for number in range(11)]
    monkeypatch.setattr(agent, "get_products", lambda *args: products)
    short = agent.run_tool("get_products", "{}")
    assert set(short["products"][0]) == {"id", "name", "category"} and "note" in short
    full = agent.run_tool("get_products", '{"category": "Doors"}')
    assert "specs" in full["products"][0]
    assert "price" not in json.dumps(short)


def test_tool_failures_become_a_message_the_ai_can_explain(monkeypatch):
    def broken(*args):
        raise RuntimeError("catalogue down")

    monkeypatch.setattr(agent, "get_products", broken)
    assert agent.run_tool("get_products", '{"category": "Doors"}') == {"error": "The catalogue is unavailable right now."}


def test_the_default_model_is_qwen():
    source = open(agent.__file__, encoding="utf-8").read()
    assert 'os.getenv("GROQ_MODEL", "qwen/' in source
