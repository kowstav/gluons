"""Local invoice2data bridge. No URLs, external AI, commands or dynamic templates."""
import json
import sys
import re
from types import ModuleType
from invoice2data import extract_data
from invoice2data.extract.invoice_template import InvoiceTemplate
from invoice2data.extract.loader import prepare_template

sys.stdin.reconfigure(encoding='utf-8')

payload = json.loads(sys.stdin.read(30000))
text = payload['text']
if not isinstance(text, str) or len(text) > 6000:
    raise ValueError('Invalid text')
if re.search(r'\b(EUR|GBP|INR|CAD|AUD)\b|[€£₹]', text, re.I) or not re.search(r'\bUSD\b|\$', text, re.I):
    raise ValueError('Only explicitly identified USD invoices are supported')
text = re.sub(r'(?im)^invoice', 'Invoice', text)
template = InvoiceTemplate(prepare_template({
    'template_name': 'gluons-checked-usd',
    'issuer': 'Owner-reviewed supplier document',
    'keywords': ['Invoice'],
    'fields': {
        'invoice_number': r'(?im)^invoice(?:\s*(?:number|no\.?|#))?\s*:\s*([A-Za-z0-9-]+)',
        'date': r'(?im)^date:\s*(\d{4}-\d{2}-\d{2})',
        'amount': r'(?im)^(?:grand total|total):\s*(?:USD\s*|\$\s*)([\d,.]+)',
        'currency': {'parser': 'static', 'value': 'USD'},
    },
    'options': {'currency': 'USD', 'date_formats': ['%Y-%m-%d'], 'decimal_separator': '.'},
}))
reader = ModuleType('gluons_checked_text')
reader.to_text = lambda _: text
result = extract_data('stdin.txt', templates=[template], input_module=reader, ai_fallback=False, raise_on_error=True)
print(json.dumps(result, default=str))
