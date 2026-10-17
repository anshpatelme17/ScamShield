"""India-specific scam detection rules.

Rules are contextual: keyword presence alone is not enough. Negated security
warnings (e.g. "Never share your OTP or UPI PIN") must NOT be flagged.
"""

from __future__ import annotations

import re

from app.analyzers.base import make_finding, snippet
from app.extractors import ExtractedIndicators
from app.models import Confidence, Finding, FindingCategory

_NEGATORS = re.compile(r"(?i)\b(never|not|no|don'?t|do\s+not|nobody|avoid|without)\b")
_SOLICIT = re.compile(
    r"(?i)\b(enter|share|provide|send|tell|submit|confirm|verify|update|reveal|"
    r"forward|type|fill|give)\b"
)
_SECRET = re.compile(
    r"(?i)\b(otp|one[\s-]?time\s+password|upi[\s-]?pin|cvv|card\s+pin|password|pin)\b"
)

_KYC = re.compile(r"(?i)\b(know\s+your\s+customer|kyc)\b")
_KYC_ACTION = re.compile(
    r"(?i)\b(update|complete|verify|expir(?:e|es|ed|ing|y)|deactivat\w*|suspend\w*|"
    r"block\w*|reactivat\w*|pending|link|submit|freeze|frozen)\b"
)

_SUSPEND = re.compile(
    r"(?i)\b(suspend\w*|block\w*|deactivat\w*|freez\w*|clos\w*|expir\w*)\b"
)
_ACCOUNT = re.compile(
    r"(?i)\b(account|card|sim|service|connection|number|wallet|atm|policy|subscription)\b"
)

_COLLECT = re.compile(
    r"(?i)\b(collect\s+request|payment\s+request|approve\s+(?:the\s+)?request|"
    r"accept\s+(?:the\s+)?request|approve\s+(?:the\s+)?(?:payment|collect)|"
    r"request\s+money|approve\s+to\s+receive)\b"
)

_ARREST = re.compile(
    r"(?i)\b(digital\s+arrest|cbi|crime\s+branch|cyber\s+cell|narcotics?|customs?|"
    r"enforcement\s+directorate|fbi|police|money\s+laundering|arrest\s+warrant|"
    r"summons|fir|income\s+tax)\b"
)
_ARREST_THREAT = re.compile(
    r"(?i)\b(arrest|warrant|legal\s+action|case|investigation|court|penalty|jail|"
    r"prison|seize|seizure|frozen|non[\s-]?bailable|custody)\b"
)

_JOB_CUE = re.compile(
    r"(?i)\b(work\s+from\s+home|part[\s-]?time\s+job|data\s+entry|online\s+job|"
    r"simple\s+task|daily\s+task|hiring|recruit\w*|earn\s+(?:money|daily|per)|"
    r"earn\s+up\s+to|easy\s+money|home\s+based)\b"
)
_JOB_ASK = re.compile(
    r"(?i)\b(registration\s+fee|security\s+deposit|joining\s+fee|processing\s+fee|"
    r"telegram|whatsapp|install\s+(?:this|the)\s+app|deposit|commission|salary|"
    r"per\s+day|daily\s+income)\b"
)

_INVEST = re.compile(
    r"(?i)\b(guaranteed\s+return|assured\s+return|double\s+your\s+money|"
    r"multiply\s+your\s+money|high\s+return|trading\s+(?:tips|group)|stock\s+tips|"
    r"sure\s?shot|intraday|forex|crypto|profit\s+guarantee|investment\s+plan|"
    r"portfolio\s+manager|sebi\s+registered)\b"
)

_LOAN = re.compile(
    r"(?i)\b(loan|pre[\s-]?approved|instant\s+loan|personal\s+loan|credit\s+line)\b"
)
_LOAN_ASK = re.compile(
    r"(?i)\b(processing\s+fee|advance\s+(?:fee|payment)|gst|charges|upfront|deposit|"
    r"registration)\b"
)

_ELEC = re.compile(
    r"(?i)\b(electricity|power\s+(?:supply|cut|connection)|energy\s+bill|"
    r"electricity\s+bill|meter|kwh|bses|msedcl|tneb|adani\s+electricity)\b"
)
_ELEC_THREAT = re.compile(
    r"(?i)\b(disconnect\w*|cut\s+off|shut\s+down|due\s+tonight|pay\s+immediately|"
    r"overdue|unpaid|switched\s+off|will\s+be\s+cut)\b"
)

_APK_REF = re.compile(
    r"(?i)(\.apk\b|install\s+(?:this|the)\s+(?:app|application)|"
    r"download\s+(?:this|the)\s+(?:app|application)|update\s+(?:this|the)\s+app)"
)

_SEX = re.compile(
    r"(?i)\b(video\s+call|private\s+video|intimate|nude|naked|morph\w*|your\s+photos|"
    r"webcam|recording|screenshot)\b"
)
_SEX_THREAT = re.compile(
    r"(?i)\b(leak|viral|publish|expose|ruin|family|friends|money|pay|blackmail|"
    r"share\s+(?:it|them|the))\b"
)

def _secret_solicitation(text: str) -> re.Match[str] | None:
    for secret in _SECRET.finditer(text):
        window_start = max(0, secret.start() - 80)
        window = text[window_start:secret.start()]
        verbs = list(_SOLICIT.finditer(window))
        if not verbs:
            continue
        verb_abs = window_start + verbs[-1].start()
        before_verb = text[max(0, verb_abs - 25):verb_abs]
        if _NEGATORS.search(before_verb):
            continue
        return secret
    return None


def analyze_india_rules(
    text: str, indicators: ExtractedIndicators
) -> list[Finding]:
    findings: list[Finding] = []
    has_link = bool(indicators.urls)

    secret = _secret_solicitation(text)
    if secret is not None:
        token = secret.group(0).lower()
        is_pin = "pin" in token
        findings.append(
            make_finding(
                rule_id="IN-SECRET-001",
                category=(
                    FindingCategory.UPI_PIN_REQUEST
                    if is_pin
                    else FindingCategory.OTP_CREDENTIAL_THEFT
                ),
                title=(
                    "Request to enter or share a UPI PIN"
                    if is_pin
                    else "Request to enter or share an OTP or credential"
                ),
                evidence=snippet(text, secret),
                limitations=(
                    "This is a text pattern match; it does not confirm the sender's identity."
                ),
                recommended_action=(
                    "Never enter your UPI PIN to receive money. Decline and verify with "
                    "your bank through official channels."
                ),
                confidence=Confidence.HIGH,
            )
        )

    if _KYC.search(text) and (_KYC_ACTION.search(text) or has_link):
        findings.append(
            make_finding(
                rule_id="IN-KYC-001",
                category=FindingCategory.BANK_KYC_IMPERSONATION,
                title="KYC update or expiry claim",
                evidence=snippet(text, _KYC.search(text)),
                limitations=(
                    "Banks do send genuine KYC reminders; this rule only flags the "
                    "pattern, not the sender."
                ),
                recommended_action=(
                    "Do not use links in the message. Open your bank's official app or "
                    "visit a branch to check KYC status."
                ),
            )
        )

    if _SUSPEND.search(text) and _ACCOUNT.search(text):
        findings.append(
            make_finding(
                rule_id="IN-SUSPEND-001",
                category=FindingCategory.ACCOUNT_SUSPENSION,
                title="Account or service suspension threat",
                evidence=snippet(text, _SUSPEND.search(text)),
                recommended_action=(
                    "Contact your bank or service provider using the number on their "
                    "official website, not the one in the message."
                ),
            )
        )

    if _COLLECT.search(text):
        findings.append(
            make_finding(
                rule_id="IN-COLLECT-001",
                category=FindingCategory.UPI_COLLECT_REQUEST,
                title="UPI collect or payment request described",
                evidence=snippet(text, _COLLECT.search(text)),
                limitations=(
                    "A collect request must never be approved to receive money. Approving "
                    "it sends money from your account."
                ),
                recommended_action=(
                    "Do not approve UPI collect requests from unknown parties."
                ),
            )
        )

    if _ARREST.search(text) and (_ARREST_THREAT.search(text) or has_link):
        findings.append(
            make_finding(
                rule_id="IN-ARREST-001",
                category=FindingCategory.DIGITAL_ARREST,
                title="Law-enforcement or 'digital arrest' pressure",
                evidence=snippet(text, _ARREST.search(text)),
                limitations=(
                    "Police and agencies do not conduct investigations over calls or "
                    "chat demanding payment."
                ),
                recommended_action=(
                    "Do not pay. Verify any claim by contacting the concerned office or "
                    "the cyber crime helpline 1930."
                ),
                confidence=Confidence.MEDIUM,
            )
        )

    if _JOB_CUE.search(text) and (_JOB_ASK.search(text) or has_link):
        findings.append(
            make_finding(
                rule_id="IN-JOB-001",
                category=FindingCategory.FAKE_JOB_TASK,
                title="Work-from-home or task-based job offer",
                evidence=snippet(text, _JOB_CUE.search(text)),
                recommended_action=(
                    "Genuine employers do not ask for registration or security fees. "
                    "Never pay to get a job."
                ),
            )
        )

    if _INVEST.search(text):
        findings.append(
            make_finding(
                rule_id="IN-INVEST-001",
                category=FindingCategory.INVESTMENT_TRADING,
                title="Investment or trading return claim",
                evidence=snippet(text, _INVEST.search(text)),
                limitations=(
                    "Guaranteed or unusually high returns are a hallmark of investment "
                    "fraud; legitimate markets never guarantee returns."
                ),
                recommended_action=(
                    "Check whether the adviser is registered with SEBI before investing "
                    "any money."
                ),
            )
        )

    if _LOAN.search(text) and _LOAN_ASK.search(text):
        findings.append(
            make_finding(
                rule_id="IN-LOAN-001",
                category=FindingCategory.FAKE_LOAN,
                title="Upfront-fee loan offer",
                evidence=snippet(text, _LOAN.search(text)),
                recommended_action=(
                    "Legitimate lenders do not ask for advance fees via personal links "
                    "or chat apps."
                ),
            )
        )

    if _ELEC.search(text) and (_ELEC_THREAT.search(text) or has_link):
        findings.append(
            make_finding(
                rule_id="IN-ELEC-001",
                category=FindingCategory.ELECTRICITY_DISCONNECTION,
                title="Electricity disconnection threat",
                evidence=snippet(text, _ELEC.search(text)),
                recommended_action=(
                    "Pay only through your official electricity board app or website."
                ),
            )
        )

    if _APK_REF.search(text) or indicators.apk_references:
        match = _APK_REF.search(text)
        findings.append(
            make_finding(
                rule_id="IN-APK-001",
                category=FindingCategory.MALICIOUS_APK,
                title="APK file or app-install request",
                evidence=snippet(text, match),
                limitations=(
                    "APK files installed outside the Play Store can be malicious. "
                    "This rule does not analyze the file itself."
                ),
                recommended_action=(
                    "Do not install APK files sent over chat. Install apps only from "
                    "official app stores."
                ),
            )
        )

    if _SEX.search(text) and _SEX_THREAT.search(text):
        findings.append(
            make_finding(
                rule_id="IN-SEXTORT-001",
                category=FindingCategory.SEXTORTION,
                title="Sextortion or blackmail coercion",
                evidence=snippet(text, _SEX.search(text)),
                recommended_action=(
                    "Do not pay. Preserve evidence and report to the cyber crime "
                    "helpline 1930 or cybercrime.gov.in."
                ),
                confidence=Confidence.MEDIUM,
            )
        )

    return findings
