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
