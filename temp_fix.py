import re
import os

files = [
    'frontend/src/app/encargado/page.tsx',
    'frontend/src/app/jefe-obra/page.tsx',
    'frontend/src/app/historico/page.tsx',
    'frontend/src/app/importar/page.tsx'
]

for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    # Replace "http://127.0.0.1:8000/..." with `http://${window.location.hostname}:8000/...`
    content = re.sub(r'"http://127\.0\.0\.1:8000([^"]+)"', r'`http://${window.location.hostname}:8000\1`', content)
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)
print('Frontend API URLs updated successfully!')
