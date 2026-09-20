import sqlite3
conn = sqlite3.connect('backend/control_obra.db')
c = conn.cursor()
c.execute("INSERT INTO contracts (project_id, provider, concept, unit_price) VALUES (1, 'Hormigones Paco', 'Hormigón HA-25', 65.50)")
c.execute("INSERT INTO contracts (project_id, provider, concept, unit_price) VALUES (1, 'Excavaciones López', 'Retroexcavadora Giratoria', 45.00)")
conn.commit()
conn.close()
