import json
import subprocess
import sys
from pathlib import Path

runner = str(Path(__file__).with_name('invoice.py'))
result = subprocess.run([sys.executable, runner], input=json.dumps({'text': 'Invoice: GL-100\nDate: 2026-10-30\nTotal: USD 48.50'}), text=True, capture_output=True, check=True)
data = json.loads(result.stdout)
assert data['amount'] == 48.5 and data['invoice_number'] == 'GL-100'
upper = subprocess.run([sys.executable, runner], input=json.dumps({'text': 'INVOICE: GL-100\nDATE: 2026-10-30\nTOTAL: USD 48.50'}), text=True, capture_output=True, check=True)
assert json.loads(upper.stdout)['amount'] == 48.5
failed = subprocess.run([sys.executable, runner], input=json.dumps({'text':'No invoice fields here'}), text=True, capture_output=True)
assert failed.returncode != 0
print('invoice2data real extraction and no-match rejection passed')
