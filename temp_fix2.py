import re

files = [
    'frontend/src/app/encargado/page.tsx',
    'frontend/src/app/jefe-obra/page.tsx',
    'frontend/src/app/historico/page.tsx',
    'frontend/src/app/importar/page.tsx'
]

for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We want to replace `http://${window.location.hostname}:8000/api...` with "/api..."
    # A simple way without complex regex:
    # `http://${window.location.hostname}:8000/api/projects/1/work-units` -> "/api/projects/1/work-units"
    
    # Let's replace the exact prefix
    prefix_to_replace = "`http://${window.location.hostname}:8000/api"
    content = content.replace(prefix_to_replace, "\"/api")
    
    # Now we need to fix the trailing backtick. The original was `...` so now it is "...`
    # Let's do regex to replace "\"/api/...`" with "\"/api/...\""
    content = re.sub(r'(\"/api[^`]+)`', r'\1"', content)
    
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Updated relative paths.")
