import re

MAX_ERROR_CHARACTERS = 300


def clean_error(error: Exception) -> str:
    """Error text for the log, without the Groq organisation id, the AI's failed output or long numbers such as phone numbers."""
    text = str(error).split("failed_generation")[0]
    text = re.sub(r"org_\w+", "org_hidden", text)
    return re.sub(r"\d{7,}", "[number hidden]", text)[:MAX_ERROR_CHARACTERS]
