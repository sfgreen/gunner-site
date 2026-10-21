"""Copy the "Try the case" cards from the Step Gunner app bundle into lib/wards/cases.json.

The wards articles embed one live Next Best Step chain each, word for word. The card
text lives in the app repo (Gunner/clinical_cards.json, which equals prod content), so
this script is the only way it reaches the site. Re-run it after a card edit ships:

    python3 scripts/sync_wards_cases.py [path/to/gunner/Gunner/clinical_cards.json]
"""
import json
import logging
import pathlib
import sys

log = logging.getLogger(__name__)

HERE = pathlib.Path(__file__).resolve().parent.parent
DEFAULT_BUNDLE = HERE.parent / 'gunner' / 'Gunner' / 'clinical_cards.json'
OUT = HERE / 'lib' / 'wards' / 'cases.json'

# Article key -> NBS card id.
CASE_IDS = {'abg': 1020, 'soap': 1021}
KEEP = ('id', 'world', 'diagnosis', 'triggerMarked', 'question', 'correctAnswer', 'choices', 'whyRight',
        'whyWrong', 'trap', 'chain', 'chainAnswer', 'chainDistractors', 'vitalsStrip', 'evidence')
# NBS 1020's trap calls the K+ of 5.8 "falsely elevated"; it is a true transcellular shift
# (total-body potassium is low). Held off the site until the card wording is settled.
HELD_TRAPS = {'abg'}


def main() -> int:
    logging.basicConfig(level=logging.INFO, format='%(message)s')
    bundle = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_BUNDLE
    raw = json.loads(bundle.read_text(encoding='utf-8'))
    cards = raw if isinstance(raw, list) else next(v for v in raw.values() if isinstance(v, list))
    out = {}
    for key, cid in CASE_IDS.items():
        card = next((c for c in cards if c.get('id') == cid), None)
        if card is None:
            log.error('NBS %s not in %s', cid, bundle)
            return 1
        at = card['chainAnswer']
        if card['correctAnswer'] not in card['choices']:
            log.error('NBS %s: correctAnswer is not one of the choices', cid)
            return 1
        if at + 1 >= len(card['chain']) or len(card['chainDistractors'][at + 1]) != 3:
            log.error('NBS %s: the next fork needs 3 written distractors', cid)
            return 1
        out[key] = {f: card.get(f) for f in KEEP}
        if key in HELD_TRAPS:
            out[key]['trap'] = None
    OUT.write_text(json.dumps(out, indent=1, ensure_ascii=False) + '\n', encoding='utf-8')
    log.info('wrote %s (%s)', OUT.relative_to(HERE), ', '.join(f'{k}=NBS {v}' for k, v in CASE_IDS.items()))
    return 0


if __name__ == '__main__':
    sys.exit(main())
