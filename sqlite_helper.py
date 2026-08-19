import json
import os
import sqlite3
import sys
from typing import Any


def output(payload: dict[str, Any]) -> None:
    # Keep stdout machine-readable. The Node server parses stdout as JSON.
    print(json.dumps(payload, ensure_ascii=False))


def main() -> None:
    if len(sys.argv) < 3:
        output({"error": "Missing arguments"})
        return

    db_path = os.path.abspath(sys.argv[1])
    action = sys.argv[2].strip().lower()

    if not os.path.isfile(db_path):
        output({"error": f"Database file not found: {db_path}"})
        return

    conn = None
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        if action == "validate":
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='bible'")
            if cursor.fetchone() is None:
                output({
                    "valid": False,
                    "error": "Table 'bible' not found. The database must contain a table named 'bible'.",
                })
                return

            cursor.execute("PRAGMA table_info(bible)")
            columns = {str(row[1]).lower() for row in cursor.fetchall()}
            required = {"book", "chapter", "versecount", "verse"}
            missing = sorted(required - columns)
            if missing:
                output({
                    "valid": False,
                    "error": f"Missing required columns in 'bible' table: {', '.join(missing)}.",
                })
                return

            cursor.execute("SELECT COUNT(DISTINCT Book) FROM bible")
            books_count = int(cursor.fetchone()[0] or 0)

            cursor.execute("SELECT COUNT(DISTINCT Book || '-' || Chapter) FROM bible")
            chapters_count = int(cursor.fetchone()[0] or 0)

            cursor.execute("SELECT COUNT(*) FROM bible")
            verses_count = int(cursor.fetchone()[0] or 0)

            cursor.execute("SELECT verse FROM bible WHERE verse IS NOT NULL LIMIT 100")
            sample_verses = [row[0] for row in cursor.fetchall()]
            tamil_chars = sum(
                1
                for verse in sample_verses
                if verse
                for char in str(verse)
                if 0x0B80 <= ord(char) <= 0x0BFF
            )
            language = "Tamil" if tamil_chars > 20 else "English"

            cursor.execute("""
                SELECT Book, Chapter, Versecount, COUNT(*) AS cnt
                FROM bible
                GROUP BY Book, Chapter, Versecount
                HAVING COUNT(*) > 1
                ORDER BY Book, Chapter, Versecount
                LIMIT 100
            """)
            duplicate_refs = [
                {"book": row[0], "chapter": row[1], "verse": row[2], "count": row[3]}
                for row in cursor.fetchall()
            ]

            cursor.execute("""
                SELECT verse, COUNT(*) AS cnt
                FROM bible
                WHERE verse IS NOT NULL AND TRIM(verse) <> ''
                GROUP BY verse
                HAVING COUNT(*) > 1
                LIMIT 100
            """)
            duplicate_verses = []
            for text, count in cursor.fetchall():
                text = str(text)
                duplicate_verses.append({
                    "text": text[:60] + "..." if len(text) > 60 else text,
                    "count": count,
                })

            # Check every distinct book/chapter instead of only the first 20.
            cursor.execute("SELECT DISTINCT Book, Chapter FROM bible ORDER BY Book, Chapter")
            missing_verses = []
            for book, chapter in cursor.fetchall():
                cursor.execute(
                    "SELECT Versecount FROM bible WHERE Book = ? AND Chapter = ? ORDER BY Versecount",
                    (book, chapter),
                )
                raw_counts = [row[0] for row in cursor.fetchall()]
                try:
                    verse_numbers = sorted({int(value) for value in raw_counts})
                except (TypeError, ValueError):
                    verse_numbers = []

                if len(verse_numbers) > 1:
                    expected = set(range(verse_numbers[0], verse_numbers[-1] + 1))
                    gaps = sorted(expected - set(verse_numbers))
                    if gaps:
                        missing_verses.append({
                            "book": book,
                            "chapter": chapter,
                            "missing": gaps[:20],
                        })
                        if len(missing_verses) >= 100:
                            break

            output({
                "valid": True,
                "language": language,
                "booksCount": books_count,
                "chaptersCount": chapters_count,
                "versesCount": verses_count,
                "validationReport": {
                    "duplicateBookChapterVerses": duplicate_refs,
                    "duplicateVerseTexts": duplicate_verses,
                    "missingSequentialVerses": missing_verses,
                    "hasDuplicates": bool(duplicate_refs),
                    "hasMissing": bool(missing_verses),
                },
            })

        elif action == "books":
            cursor.execute("SELECT DISTINCT Book FROM bible ORDER BY Book")
            output({"books": [row[0] for row in cursor.fetchall()]})

        elif action == "chapters":
            if len(sys.argv) < 4:
                output({"error": "Missing Book ID"})
                return
            book_id = sys.argv[3]
            cursor.execute(
                "SELECT DISTINCT Chapter FROM bible WHERE Book = ? ORDER BY Chapter",
                (book_id,),
            )
            output({"chapters": [row[0] for row in cursor.fetchall()]})

        elif action == "verses":
            if len(sys.argv) < 5:
                output({"error": "Missing Book ID or Chapter ID"})
                return
            book_id = sys.argv[3]
            chapter_id = sys.argv[4]
            cursor.execute(
                "SELECT Versecount, verse FROM bible WHERE Book = ? AND Chapter = ? ORDER BY Versecount",
                (book_id, chapter_id),
            )
            output({
                "verses": [
                    {"versecount": row[0], "verse": row[1]}
                    for row in cursor.fetchall()
                ]
            })

        elif action == "search":
            if len(sys.argv) < 4:
                output({"error": "Missing query"})
                return
            query = sys.argv[3]
            cursor.execute(
                "SELECT Book, Chapter, Versecount, verse FROM bible WHERE verse LIKE ? LIMIT 100",
                (f"%{query}%",),
            )
            output({
                "results": [
                    {"book": row[0], "chapter": row[1], "versecount": row[2], "verse": row[3]}
                    for row in cursor.fetchall()
                ]
            })

        else:
            output({"error": f"Unknown action: {action}"})

    except sqlite3.DatabaseError as exc:
        output({"error": f"SQLite error: {exc}"})
    except Exception as exc:
        output({"error": str(exc)})
    finally:
        if conn is not None:
            conn.close()


if __name__ == "__main__":
    main()
