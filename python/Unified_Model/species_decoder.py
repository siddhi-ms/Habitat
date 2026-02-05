"""
Decode species_name_encoded to species name for output/printing only.
Uses data/species_encoding.json.
"""

import json
import os

_encoding = None


def _load_encoding():
    global _encoding
    if _encoding is None:
        path = os.path.join(os.path.dirname(__file__), '..', 'data', 'species_encoding.json')
        with open(path, 'r') as f:
            _encoding = json.load(f)
    return _encoding


def decode_species_for_output(encoded_value):
    """Decode encoded value to species name for printing/output. Returns 'Unknown' if not found."""
    try:
        m = _load_encoding()
        key = str(int(encoded_value))
        return m['encoded_to_species'].get(key, 'Unknown')
    except Exception:
        return 'Unknown'
