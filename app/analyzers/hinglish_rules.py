"""India Hinglish/Devanagari scam rules (Phase 9).

Bilingual companion to india_rules.py. Mirrors its categories and rule-id
prefixes with an "-H-" marker. Same contextual standard: keyword presence
alone is not enough, and negated security warnings ("share na karein",
"शेयर न करें") must NOT be flagged.

Language notes:
- Python ``re`` treats Devanagari vowel matras as non-word characters, so a
  trailing ``\\b`` fails on tokens like "केवाईसी". All token boundaries use
  the unified wrapper ``_wb`` (Latin word chars OR any Devanagari char).
- Hindi word order differs from English: the verb often FOLLOWS the secret
  ("OTP share karein") and the negator often FOLLOWS the verb ("share na
  karein"). Solicitation checks therefore look both before and after the
  secret, and negation is checked in the original text around the verb.
- URLs are masked before solicitation analysis so that fragments like
  "/otp/verify" inside a URL cannot trigger credential rules; URLs are
  handled by the dedicated URL heuristics.
- Postal guard: "pin code/पिन कोड" is an address element, not a credential.
"""

from __future__ import annotations

import re

from app.analyzers.base import make_finding, snippet
from app.extractors import URL_PATTERN, ExtractedIndicators
from app.models import Confidence, Finding, FindingCategory

# Latin word chars plus the full Devanagari block (matras included).
_BOUND = "[\\w\\u0900-\\u097F]"


def _wb(tokens: str) -> str:
    """Token boundary that survives Devanagari matras (which are not \\w)."""
    return "(?<![" + "\\w\\u0900-\\u097F" + "])(?:" + tokens + ")(?![\\w\\u0900-\\u097F])"


_WINDOW = 80
_NEG_SPAN = 25

_SECRET = re.compile(
    _wb(
        "otp|one[\\s-]?time[\\s-]?password|upi[\\s-]?pin|cvv|password|pin|"
        "ओटीपी|उपी\\s*पिन|पीआईएन|पिन|सीवीवी|पासवर्ड"
    ),
    re.IGNORECASE,
)

_SOLICIT = re.compile(
    _wb(
        "share|send|tell|provide|type|enter|confirm|verify|fill|press|update|"
        "daal\\w*|dalo|khol\\w*|bata\\w*|bhej\\w*|bhijw\\w*|darj\\w*|"
        "शेयर[\\u0900-\\u097F]*|भेज(?:ा|ो|ें|ना|े|ते|ती|ता)?|भर(?:ना|ा|ो|ें)?|"
        "डाल(?:ना|ा|ो|ें)?|बता(?:ो|ें|इए|एं)?|दर्ज(?:ी|े)?|अपडेट|"
        "खोल(?:ो|ें|ना)?|दो|दें|देना|दिजिए"
    ),
    re.IGNORECASE,
)

_NEG = re.compile(
    _wb(
        "never|not|no|don'?t|do\\s+not|nobody|avoid|without|"
        "na|nahi|nahin|kabhi|mat|"
        "नहीं|ना|न|मत|कभी|बिना|बच(?:ें|ो)"
    ),
    re.IGNORECASE,
)

_PIN_CODE_FOLLOW = re.compile("(?i)^\\s*(?:code|कोड)")

_KYC = re.compile(_wb("kyc|केवाईसी|के\\s*वाईसी"), re.IGNORECASE)
_KYC_ACTION = re.compile(_wb("update|complete|verify|reactivat\\w*|अपडेट|पूरा"), re.IGNORECASE)
_KYC_THREAT = re.compile(
    _wb("expir\\w*|khatam|band|suspend|turant|jaldi|jaroori|ख़त्म|खत्म|बंद|तुरंत|सस्पेंड"),
    re.IGNORECASE,
)

_SUSPEND = re.compile(_wb("suspend\\w*|block\\w*|band|deactivat\\w*|क्लोज|बंद"), re.IGNORECASE)
_ACCOUNT = re.compile(_wb("account|khata|card|sim|खाता|सिम|कार्ड"), re.IGNORECASE)

_COLLECT = re.compile(
    _wb(
        "collect\\s*request|payment\\s*request|request\\s*approve|approve\\s*request|"
        "पेमेंट\\s*रिक्वेस्ट|कलेक्ट\\s*रिक्वेस्ट"
    ),
    re.IGNORECASE,
)

_ARREST_CUE = re.compile(
    _wb(
        "cyber\\s*cell|cyber\\s*police|cbi|digital\\s*arrest|arrest\\s*warrant|"
        "साइबर\\s*सेल|साइबर\\s*पुलिस|वारंट"
    ),
    re.IGNORECASE,
)
_ARREST_THREAT = re.compile(
    _wb(
        "arrest\\w*|jail|custody|funds?\\s*transfer|case\\s*register|"
        "जेल|गिरफ्तार|फंड\\s*ट्रांसफर|केस\\s*दर्ज"
    ),
    re.IGNORECASE,
)

_JOB_CUE = re.compile(
    _wb(
        "ghar\\s*bait\\w*|ghar\\s*(?:se|ka)\\s*kaam|part[\\s-]?time|"
        "daily\\s*kaam|online\\s*kaam|simple\\s*task|daily\\s*task|घर\\s*बैठे|घर\\s*से\\s*काम"
    ),
    re.IGNORECASE,
)
_JOB_ASK = re.compile(
    _wb(
        "registration\\s*fe?e|joining\\s*fe?e|security\\s*deposit|processing\\s*fe?e|"
        "telegram|whatsapp|per\\s*day|daily\\s*income|fees?\\s*dena|"
        "टेलीग्राम|व्हाट्सएप|फीस"
    ),
    re.IGNORECASE,
)

_INVEST = re.compile(
    _wb(
        "guaranteed\\s*return|paisa\\s*double|double\\s*(?:paisa|kar)|stock\\s*tips|"
        "trading\\s*tips|crypto|daily\\s*profit|assured\\s*profit|"
        "गारंटीड\\s*रिटर्न|पैसा\\s*डबल"
    ),
    re.IGNORECASE,
)

_LOAN = re.compile(_wb("loan|pre[\\s-]?approved|instant\\s*loan|लोन"), re.IGNORECASE)
_LOAN_ASK = re.compile(
    _wb(
        "processing\\s*fe?e|advance\\s*fe?e|registration|deposit|charges?|"
        "प्रोसेसिंग\\s*फीस|एडवांस|जमा"
    ),
    re.IGNORECASE,
)

_ELEC = re.compile(_wb("bijli|electricity|बिजली"), re.IGNORECASE)
_ELEC_THREAT = re.compile(
    _wb(
        "cut\\s*jayegi|kat\\s*jayegi|disconnect\\w*|overdue|bakaya|unpaid|"
        "band\\s*ho\\s*jayegi|कट\\s*जाएगी|बकाया|कनेक्शन\\s*बंद"
    ),
    re.IGNORECASE,
)

_APK = re.compile(_wb("\\.apk|apk|एपीके|ऐप\\s*फाइल"), re.IGNORECASE)

_SEX_CUE = re.compile(
    _wb(
        "private\\s*video|video\\s*call|mms|nangi|morph\\w*|recording|photos?|"
        "वीडियो\\s*कॉल|रिकॉर्ड|फोटो"
    ),
    re.IGNORECASE,
)
_SEX_THREAT = re.compile(
    _wb(
        "viral|leak|blackmail|paise\\s*bhejo|paise\\s*do|warna|"
        "वायरल|ब्लैकमेल|पैसे\\s*भेजो"
    ),
    re.IGNORECASE,
)


def _negated_around_verb(
    masked_window: str, window_abs_start: int, original: str
) -> bool:
    """True if the final solicitation verb in the window is negated.

    Negation is checked in the ORIGINAL text at absolute positions so a
    clipped window cannot cut a negator in half.
    """
    for verb in reversed(list(_SOLICIT.finditer(masked_window))):
        verb_abs_start = window_abs_start + verb.start()
        verb_abs_end = window_abs_start + verb.end()
        before = original[max(0, verb_abs_start - _NEG_SPAN) : verb_abs_start]
        after = original[verb_abs_end : verb_abs_end + _NEG_SPAN]
        if not (_NEG.search(before) or _NEG.search(after)):
            return False
    return True


def _is_postal_pin(text: str, end: int, token: str) -> bool:
    if token.strip().lower() in ("pin", "पिन"):
        return bool(_PIN_CODE_FOLLOW.match(text, end))
    return False


def _solicited(text: str) -> str | None:
    masked = URL_PATTERN.sub(lambda m: " " * len(m.group(0)), text)
    secrets = [
        (match.start(), match.end(), match.group(0))
        for match in _SECRET.finditer(masked)
    ]
    for start, end, token in sorted(secrets):
        if _is_postal_pin(masked, end, token):
            continue
        before_start = max(0, start - _WINDOW)
        if not _negated_around_verb(masked[before_start:start], before_start, text):
            return token
        if not _negated_around_verb(masked[end : end + _WINDOW], end, text):
            return token
    return None


def _is_pin_token(token: str) -> bool:
    return "pin" in token.lower() or "पिन" in token


def analyze_hinglish_rules(
    text: str, indicators: ExtractedIndicators
) -> list[Finding]:
    findings: list[Finding] = []
    has_link = bool(indicators.urls)

    secret = _solicited(text)
    if secret is not None:
        is_pin = _is_pin_token(secret)
        findings.append(
            make_finding(
                rule_id="IN-H-SECRET-001",
                category=(
                    FindingCategory.UPI_PIN_REQUEST
                    if is_pin
                    else FindingCategory.OTP_CREDENTIAL_THEFT
                ),
                title=(
                    "Request to enter or share a UPI PIN (Hinglish/Devanagari)"
                    if is_pin
                    else "Request to enter or share an OTP (Hinglish/Devanagari)"
                ),
                evidence=snippet(text, _SECRET.search(text)),
                limitations=(
                    "Pattern match only; it does not confirm the sender's identity."
                ),
                recommended_action=(
                    "Never enter your UPI PIN or share an OTP to receive money. "
                    "Decline and verify with your bank through official channels."
                ),
                confidence=Confidence.HIGH,
            )
        )

    if _KYC.search(text) and _KYC_ACTION.search(text) and _KYC_THREAT.search(text):
        findings.append(
            make_finding(
                rule_id="IN-H-KYC-001",
                category=FindingCategory.BANK_KYC_IMPERSONATION,
                title="KYC update or expiry claim (Hinglish/Devanagari)",
                evidence=snippet(text, _KYC.search(text)),
                limitations=(
                    "Genuine banks also send KYC reminders; this rule requires "
                    "expiry/urgency wording alongside KYC. It flags the pattern, "
                    "not the sender."
                ),
                recommended_action=(
                    "Do not use links in the message. Open your bank's official app "
                    "or visit a branch to check KYC status."
                ),
            )
        )

    if _SUSPEND.search(text) and _ACCOUNT.search(text):
        findings.append(
            make_finding(
                rule_id="IN-H-SUSPEND-001",
                category=FindingCategory.ACCOUNT_SUSPENSION,
                title="Account or service suspension threat (Hinglish/Devanagari)",
                evidence=snippet(text, _SUSPEND.search(text)),
                recommended_action=(
                    "Contact your bank or service provider using the number on "
                    "their official website, not the one in the message."
                ),
            )
        )

    if _COLLECT.search(text):
        findings.append(
            make_finding(
                rule_id="IN-H-COLLECT-001",
                category=FindingCategory.UPI_COLLECT_REQUEST,
                title="UPI collect or payment request (Hinglish/Devanagari)",
                evidence=snippet(text, _COLLECT.search(text)),
                limitations=(
                    "Approving a collect request sends money FROM your account; "
                    "it never receives money."
                ),
                recommended_action=(
                    "Do not approve UPI collect or payment requests from unknown "
                    "parties."
                ),
            )
        )

    if _ARREST_CUE.search(text) and (_ARREST_THREAT.search(text) or has_link):
        findings.append(
            make_finding(
                rule_id="IN-H-ARREST-001",
                category=FindingCategory.DIGITAL_ARREST,
                title="Law-enforcement or 'digital arrest' pressure (Hinglish)",
                evidence=snippet(text, _ARREST_CUE.search(text)),
                limitations=(
                    "Police and agencies do not conduct investigations over calls "
                    "or chat demanding payment."
                ),
                recommended_action=(
                    "Do not pay. Verify any claim by contacting the concerned "
                    "office or the cyber crime helpline 1930."
                ),
                confidence=Confidence.MEDIUM,
            )
        )

    if _JOB_CUE.search(text) and (_JOB_ASK.search(text) or has_link):
        findings.append(
            make_finding(
                rule_id="IN-H-JOB-001",
                category=FindingCategory.FAKE_JOB_TASK,
                title="Work-from-home or task-based job offer (Hinglish)",
                evidence=snippet(text, _JOB_CUE.search(text)),
                recommended_action=(
                    "Genuine employers do not ask for registration or security "
                    "fees. Never pay to get a job."
                ),
            )
        )

    if _INVEST.search(text):
        findings.append(
            make_finding(
                rule_id="IN-H-INVEST-001",
                category=FindingCategory.INVESTMENT_TRADING,
                title="Investment or trading return claim (Hinglish/Devanagari)",
                evidence=snippet(text, _INVEST.search(text)),
                limitations=(
                    "Guaranteed or unusually high returns are a hallmark of "
                    "investment fraud; legitimate markets never guarantee returns."
                ),
                recommended_action=(
                    "Check whether the adviser is registered with SEBI before "
                    "investing any money."
                ),
            )
        )

    if _LOAN.search(text) and _LOAN_ASK.search(text):
        findings.append(
            make_finding(
                rule_id="IN-H-LOAN-001",
                category=FindingCategory.FAKE_LOAN,
                title="Upfront-fee loan offer (Hinglish/Devanagari)",
                evidence=snippet(text, _LOAN.search(text)),
                recommended_action=(
                    "Legitimate lenders do not ask for advance fees via personal "
                    "links or chat apps."
                ),
            )
        )

    if _ELEC.search(text) and (_ELEC_THREAT.search(text) or has_link):
        findings.append(
            make_finding(
                rule_id="IN-H-ELEC-001",
                category=FindingCategory.ELECTRICITY_DISCONNECTION,
                title="Electricity disconnection threat (Hinglish/Devanagari)",
                evidence=snippet(text, _ELEC.search(text)),
                recommended_action=(
                    "Pay only through your official electricity board app or "
                    "website."
                ),
            )
        )

    if _APK.search(text) or indicators.apk_references:
        match = _APK.search(text)
        findings.append(
            make_finding(
                rule_id="IN-H-APK-001",
                category=FindingCategory.MALICIOUS_APK,
                title="APK file or app-install request (Hinglish/Devanagari)",
                evidence=snippet(text, match),
                limitations=(
                    "APK files installed outside the Play Store can be malicious. "
                    "This rule does not analyze the file itself."
                ),
                recommended_action=(
                    "Do not install APK files sent over chat. Install apps only "
                    "from official app stores."
                ),
            )
        )

    if _SEX_CUE.search(text) and _SEX_THREAT.search(text):
        findings.append(
            make_finding(
                rule_id="IN-H-SEXTORT-001",
                category=FindingCategory.SEXTORTION,
                title="Sextortion or blackmail coercion (Hinglish/Devanagari)",
                evidence=snippet(text, _SEX_CUE.search(text)),
                recommended_action=(
                    "Do not pay. Preserve evidence and report to the cyber crime "
                    "helpline 1930 or cybercrime.gov.in."
                ),
                confidence=Confidence.MEDIUM,
            )
        )

    return findings
