"""Sara's page script must load. One mistake, such as a name declared twice, stops the whole page and leaves it blank."""
import re
import shutil
import subprocess
from pathlib import Path

import pytest

PAGE = Path(__file__).resolve().parents[1] / "src" / "alusea_ai_service" / "static" / "index.html"


@pytest.mark.skipif(not shutil.which("node"), reason="Node.js isn't installed")
def test_the_page_scripts_have_no_errors(tmp_path):
    scripts = re.findall(r"<script>(.*?)</script>", PAGE.read_text(encoding="utf-8"), re.S)
    assert scripts
    for number, script in enumerate(scripts):
        path = tmp_path / f"script-{number}.js"
        path.write_text(script, encoding="utf-8")
        result = subprocess.run(["node", "--check", str(path)], capture_output=True, text=True)
        assert result.returncode == 0, result.stderr


def test_call_fillers_are_shown_in_every_language_and_never_spoken():
    """A slow call reply shows a short "let me check" line on the call screen, in the call's language. No audio is fetched."""
    page = PAGE.read_text(encoding="utf-8")
    fillers = re.findall(r"callFillers: \[(.*?)\],", page)
    assert len(fillers) == 5
    assert all(len(re.findall(r'"[^"]+"', phrases)) == 3 for phrases in fillers)
    assert "/call/fillers" not in page and "fillerAudio" not in page


def test_the_voice_message_bar_is_labelled_in_every_language_and_writes_out_speech_once():
    """✕, ■ and ↑ on the recording bar are read out by screen readers, so each needs a label in all 5 languages.
    Speech is written out once, when ■ or ↑ is tapped, not at every pause, so a cancelled recording costs nothing."""
    page = PAGE.read_text(encoding="utf-8")
    for label in ("micCancel", "micCheck", "micSend"):
        assert len(re.findall(rf'^\s+{label}: "[^"]+",$', page, re.M)) == 5, label
    for element in ("voice-bar", "voice-wave", "voice-time", "voice-cancel", "voice-check", "voice-send"):
        assert f'id="{element}"' in page, element
    listener = re.search(r"async function startListening\(\) \{(.*?)\n    \}\n", page, re.S).group(1)
    assert "writeSpeech" not in listener
    assert page.count("writeSpeech(") == 2  # the function itself, and its one call in finishRecording


def test_changing_language_keeps_the_chat_on_screen():
    """Switching language used to wipe the chat and fetch it again, so a slow or failed fetch made it look lost."""
    page = PAGE.read_text(encoding="utf-8")
    handler = re.search(r'languageSelect\.addEventListener\("change", \(\) => \{(.*?)\n    \}\);', page, re.S).group(1)
    assert "loadHistory" not in handler
    assert "if (!starters.hidden) showGreeting();" in handler
