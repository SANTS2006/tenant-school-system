"""Turns a teacher-uploaded question file into a plain list of question dicts, ready for
apps.quizzes.services.create_quiz_from_questions.

Expected format (works equally well typed in Notepad or Word, saved as .txt or .docx):

    1. What is 2 + 2?
    A) 3
    B) 4*
    C) 5
    D) 6

    2. What is the capital of France?
    A) London
    B) Berlin
    C) Paris*
    D) Madrid

- A question line starts with a number followed by "." or ")".
- An option line starts with a single letter followed by "." or ")".
- The correct option has a trailing "*" (with or without a space before it) — exactly one
  option per question must be marked this way.
- Blank lines between questions are optional; extra blank lines are ignored.

No third-party dependency for .docx: it's a zip archive of XML, and every visible paragraph of
text lives in <w:t> runs inside <w:p> paragraphs in word/document.xml — extracting those with the
standard library's zipfile + a couple of regexes is all a heading-free, table-free question file
needs (the same technique used elsewhere in this project to read a plain .docx's text).
"""

import re
import zipfile
from io import BytesIO

QUESTION_LINE = re.compile(r"^\s*(\d+)[.)]\s*(.+)$")
OPTION_LINE = re.compile(r"^\s*([A-Za-z])[.)]\s*(.+?)\s*(\*)?\s*$")


class QuizFileError(ValueError):
    """Raised for a file that can't be read or doesn't parse into at least one valid,
    fully-specified question — the message is shown to the teacher as-is, so it always names
    the specific line/question at fault rather than a generic "invalid file"."""


def _extract_docx_text(raw: bytes) -> str:
    try:
        with zipfile.ZipFile(BytesIO(raw)) as archive:
            xml = archive.read("word/document.xml").decode("utf-8", errors="replace")
    except (zipfile.BadZipFile, KeyError) as exc:
        raise QuizFileError("This doesn't look like a valid .docx file.") from exc

    # Each <w:p>...</w:p> is one paragraph; join every <w:t> run inside it, then treat each
    # paragraph as one line — mirrors how the same content reads in Word itself.
    paragraphs = re.split(r"</w:p>", xml)
    lines = []
    for paragraph in paragraphs:
        runs = re.findall(r"<w:t[^>]*>(.*?)</w:t>", paragraph, flags=re.DOTALL)
        text = "".join(runs).strip()
        if text:
            lines.append(text)
    return "\n".join(lines)


def _extract_text(file) -> str:
    raw = file.read()
    name = (getattr(file, "name", "") or "").lower()
    if name.endswith(".docx"):
        return _extract_docx_text(raw)
    for encoding in ("utf-8-sig", "utf-8", "latin-1"):
        try:
            return raw.decode(encoding)
        except UnicodeDecodeError:
            continue
    raise QuizFileError("Could not read this file as text. Save it as .txt or .docx and try again.")


def parse_quiz_file(file) -> list[dict]:
    """Returns `[{"text": str, "points": 1, "options": [{"text": str, "is_correct": bool}, ...]}]`.
    Raises QuizFileError, with a message naming the offending question number, for anything that
    doesn't parse cleanly — a file this can't confidently interpret should never silently produce
    a partial or wrong quiz."""
    text = _extract_text(file)

    questions: list[dict] = []
    current: dict | None = None

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue

        question_match = QUESTION_LINE.match(line)
        option_match = OPTION_LINE.match(line) if not question_match else None

        if question_match:
            current = {"text": question_match.group(2).strip(), "points": 1, "options": []}
            questions.append(current)
        elif option_match:
            if current is None:
                raise QuizFileError(f'Found an option ("{line}") before any question.')
            current["options"].append(
                {"text": option_match.group(2).strip(), "is_correct": option_match.group(3) == "*"}
            )
        else:
            raise QuizFileError(
                f'Could not read this line — it\'s neither a numbered question nor a lettered '
                f'option: "{line}"'
            )

    if not questions:
        raise QuizFileError("No questions were found in this file.")

    for index, question in enumerate(questions, start=1):
        if len(question["options"]) < 2:
            raise QuizFileError(f"Question {index} needs at least two options.")
        correct_count = sum(1 for option in question["options"] if option["is_correct"])
        if correct_count == 0:
            raise QuizFileError(
                f'Question {index} has no correct option marked — mark the right answer with a '
                f'trailing "*", e.g. "B) 4*".'
            )
        if correct_count > 1:
            raise QuizFileError(f"Question {index} has more than one option marked correct.")

    return questions
