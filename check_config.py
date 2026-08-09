import sqlite3

conn = sqlite3.connect("server/data/demo.db")
conn.row_factory = sqlite3.Row
cur = conn.cursor()
cur.execute("SELECT key, value FROM service_config")
for r in cur.fetchall():
    print(dict(r))
conn.close()
