import sqlite3
conn = sqlite3.connect('control_obra.db')
conn.execute('DROP TABLE IF EXISTS users')
conn.execute('CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT, role TEXT)')
conn.execute("INSERT INTO users (username, password, role) VALUES ('master', '1234', 'master')")
conn.execute("INSERT INTO users (username, password, role) VALUES ('encargado', '1234', 'encargado')")
conn.execute("INSERT INTO users (username, password, role) VALUES ('jefe', '1234', 'jefe_obra')")
conn.commit()
