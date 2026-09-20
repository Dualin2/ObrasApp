import sqlite3

def run_migration():
    conn = sqlite3.connect('backend/control_obra.db')
    c = conn.cursor()
    
    # Crear tabla de contratos
    c.execute('''
    CREATE TABLE IF NOT EXISTS contracts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER,
        provider VARCHAR,
        concept VARCHAR,
        unit_price FLOAT,
        FOREIGN KEY(project_id) REFERENCES projects(id)
    )
    ''')
    
    # Añadir columna a delivery_notes
    try:
        c.execute('ALTER TABLE delivery_notes ADD COLUMN contract_id INTEGER REFERENCES contracts(id)')
    except sqlite3.OperationalError as e:
        print("Column may already exist:", e)
        
    conn.commit()
    conn.close()
    print("Database updated for contracts!")

if __name__ == "__main__":
    run_migration()
