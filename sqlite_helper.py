import sqlite3
import sys
import json
import os

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Missing arguments"}))
        return

    db_path = sys.argv[1]
    action = sys.argv[2]

    if not os.path.exists(db_path):
        print(json.dumps({"error": f"Database file not found: {db_path}"}))
        return

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        if action == "validate":
            # 1. Table Validation
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='bible'")
            table_exists = cursor.fetchone()
            if not table_exists:
                print(json.dumps({
                    "valid": False, 
                    "error": "Table 'bible' not found in database. The database must contain a table named 'bible'."
                }))
                return

            # 2. Column Validation
            cursor.execute("PRAGMA table_info(bible)")
            columns = {col[1].lower(): col[2] for col in cursor.fetchall()}
            required = ["book", "chapter", "versecount", "verse"]
            missing = [r for r in required if r not in columns]
            
            if missing:
                print(json.dumps({
                    "valid": False, 
                    "error": f"Missing required columns in 'bible' table: {', '.join(missing)}."
                }))
                return

            # 3. Basic metrics
            cursor.execute("SELECT COUNT(DISTINCT Book) FROM bible")
            books_count = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(DISTINCT Book || '-' || Chapter) FROM bible")
            chapters_count = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM bible")
            verses_count = cursor.fetchone()[0]

            # 4. Language Detection (Sample first 50 verses)
            cursor.execute("SELECT verse FROM bible WHERE verse IS NOT NULL LIMIT 50")
            sample_verses = [r[0] for r in cursor.fetchall()]
            
            language = "English"
            tamil_chars = 0
            for verse in sample_verses:
                if not verse: continue
                for char in verse:
                    if 0x0B80 <= ord(char) <= 0x0BFF:
                        tamil_chars += 1
            if tamil_chars > 20:
                language = "Tamil"

            # 5. Duplicate Book+Chapter+Verse detection
            cursor.execute("""
                SELECT Book, Chapter, Versecount, COUNT(*) as cnt 
                FROM bible 
                GROUP BY Book, Chapter, Versecount 
                HAVING cnt > 1 
                LIMIT 10
            """)
            duplicate_refs = [
                {"book": r[0], "chapter": r[1], "verse": r[2], "count": r[3]} 
                for r in cursor.fetchall()
            ]

            # 6. Duplicate text detection (identical verses)
            cursor.execute("""
                SELECT verse, COUNT(*) as cnt 
                FROM bible 
                WHERE verse IS NOT NULL AND verse != ''
                GROUP BY verse 
                HAVING cnt > 1 
                LIMIT 10
            """)
            duplicate_verses = [
                {"text": r[0][:60] + "..." if len(r[0]) > 60 else r[0], "count": r[1]} 
                for r in cursor.fetchall()
            ]

            # 7. Missing sequential verses detection
            # For a quick sample, let's scan a few chapters and check if there are missing sequential verses
            cursor.execute("SELECT DISTINCT Book, Chapter FROM bible LIMIT 20")
            sample_chapters = cursor.fetchall()
            missing_verses = []
            
            for b, c in sample_chapters:
                cursor.execute("SELECT Versecount FROM bible WHERE Book = ? AND Chapter = ? ORDER BY Versecount", (b, c))
                v_counts = [r[0] for r in cursor.fetchall() if isinstance(r[0], int)]
                if len(v_counts) > 1:
                    full_range = set(range(min(v_counts), max(v_counts) + 1))
                    gaps = list(full_range - set(v_counts))
                    if gaps:
                        missing_verses.append({
                            "book": b,
                            "chapter": c,
                            "missing": gaps[:5] # limit report size
                        })
                if len(missing_verses) >= 5:
                    break

            print(json.dumps({
                "valid": True,
                "language": language,
                "booksCount": books_count,
                "chaptersCount": chapters_count,
                "versesCount": verses_count,
                "validationReport": {
                    "duplicateBookChapterVerses": duplicate_refs,
                    "duplicateVerseTexts": duplicate_verses,
                    "missingSequentialVerses": missing_verses,
                    "hasDuplicates": len(duplicate_refs) > 0,
                    "hasMissing": len(missing_verses) > 0
                }
            }))

        elif action == "books":
            # List distinct books
            cursor.execute("SELECT DISTINCT Book FROM bible ORDER BY Book")
            books = [r[0] for r in cursor.fetchall()]
            print(json.dumps({"books": books}))

        elif action == "chapters":
            if len(sys.argv) < 4:
                print(json.dumps({"error": "Missing Book ID"}))
                return
            book_id = sys.argv[3]
            cursor.execute("SELECT DISTINCT Chapter FROM bible WHERE Book = ? ORDER BY Chapter", (book_id,))
            chapters = [r[0] for r in cursor.fetchall()]
            print(json.dumps({"chapters": chapters}))

        elif action == "verses":
            if len(sys.argv) < 5:
                print(json.dumps({"error": "Missing Book ID or Chapter ID"}))
                return
            book_id = sys.argv[3]
            chapter_id = sys.argv[4]
            cursor.execute("SELECT Versecount, verse FROM bible WHERE Book = ? AND Chapter = ? ORDER BY Versecount", (book_id, chapter_id))
            verses = [{"versecount": r[0], "verse": r[1]} for r in cursor.fetchall()]
            print(json.dumps({"verses": verses}))

        elif action == "search":
            if len(sys.argv) < 4:
                print(json.dumps({"error": "Missing query"}))
                return
            query = sys.argv[3]
            cursor.execute("SELECT Book, Chapter, Versecount, verse FROM bible WHERE verse LIKE ? LIMIT 100", (f"%{query}%",))
            results = [{"book": r[0], "chapter": r[1], "versecount": r[2], "verse": r[3]} for r in cursor.fetchall()]
            print(json.dumps({"results": results}))

        else:
            print(json.dumps({"error": f"Unknown action: {action}"}))

        conn.close()

    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
