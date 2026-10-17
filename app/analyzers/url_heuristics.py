"""Offline URL heuristics.

No URL is ever fetched or resolved. These are structural checks only.
"""

from __future__ import annotations

import ipaddress
from urllib.parse import urlsplit

from app.analyzers.base import make_finding
from app.models import Confidence, Finding, FindingCategory, FindingStatus

_SHORTENERS = frozenset(
    {
        "bit.ly", "tinyurl.com", "t.co", "goo.gl", "rb.gy", "cutt.ly", "is.gd",
        "ow.ly", "shorturl.at", "tiny.cc", "rebrand.ly", "shorturl", "bl.ink",
        "lnkd.in", "s.id", "urlz.fr", "chilp.it",
    }
)
_RISKY_TLDS = frozenset(
    {
        "xyz", "top", "tk", "cf", "gq", "ml", "ga", "zip", "mov", "click",
        "link", "work", "country", "stream", "download", "review", "loan",
    }
)
_SENSITIVE_PATH = (
    "login", "verify", "kyc", "otp", "update", "secure", "account", "refund",
    "prize", "gift", "lottery", "aadhaar", "pan", "reward", "bonus", "wallet",
)


def _is_ip_host(host: str) -> bool:
    try:
        ipaddress.ip_address(host)
    except ValueError:
        return False
    return True


def _add(
    findings: list[Finding], rule_id: str, title: str, url: str, limitations: str,
    action: str, confidence: Confidence | None = None,
) -> None:
    if any(f.rule_id == rule_id for f in findings):
        return
    findings.append(
        make_finding(
            rule_id=rule_id,
            category=FindingCategory.URL_ANOMALY,
            title=title,
            evidence=url,
            status=FindingStatus.RULE_MATCH,
            limitations=limitations,
            recommended_action=action,
            confidence=confidence,
        )
    )


def analyze_urls(urls: tuple[str, ...]) -> list[Finding]:
    findings: list[Finding] = []
    for url in urls:
        try:
            parts = urlsplit(url if "://" in url else f"http://{url}")
        except ValueError:
            continue
        host = (parts.hostname or "").lower()
        if not host:
            continue
        path_query = f"{parts.path}?{parts.query}".lower()

        if _is_ip_host(host):
            _add(
                findings, "URL-IP-001", "URL uses a raw IP address instead of a domain",
                url, "Legitimate services rarely send links with bare IP addresses.",
                "Treat as untrusted; do not enter credentials on this page.",
                Confidence.MEDIUM,
            )
        if host in _SHORTENERS:
            _add(
                findings, "URL-SHORT-001", "URL uses a link shortener",
                url,
                "The destination cannot be verified offline; the real target is hidden.",
                "Expand or avoid the link; never enter credentials after following it.",
                Confidence.MEDIUM,
            )
        tld = host.rsplit(".", 1)[-1]
        if tld in _RISKY_TLDS:
            _add(
                findings, "URL-TLD-001", "URL uses a frequently abused top-level domain",
                url, "Some TLDs are disproportionately used in phishing. Not proof by itself.",
                "Verify the sender through an official channel before following.",
            )
        if "@" in parts.netloc:
            _add(
                findings, "URL-USERINFO-001", "URL hides its host using userinfo 'at' syntax",
                url, "Text before '@' is decorative; the real host is after '@'.",
                "Do not trust the visible part of the link; open the official site directly.",
                Confidence.MEDIUM,
            )
        if host.count("-") >= 3:
            _add(
                findings, "URL-HYPHEN-001", "URL host contains many hyphens",
                url, "Excessive hyphens are common in look-alike domains.",
                "Check the exact spelling against the official domain.",
            )
        if len([label for label in host.split(".") if label]) > 4:
            _add(
                findings, "URL-SUBDOMAIN-001", "URL has an unusually deep subdomain chain",
                url, "Deep subdomains can mimic trusted brands.",
                "Verify the registered domain (the part just before the TLD).",
            )
        if "xn--" in host:
            _add(
                findings, "URL-PUNYCODE-001", "URL host uses punycode (internationalized domain)",
                url, "Punycode can render look-alike characters that resemble real domains.",
                "Compare carefully with the official domain before trusting it.",
            )
        if any(word in path_query for word in _SENSITIVE_PATH):
            _add(
                findings, "URL-KEYWORD-001", "URL path contains sensitive-action keywords",
                url, "Words like login/verify/kyc/refund often appear in phishing URLs.",
                "Reach the service through its official app or typed address instead.",
            )
        if parts.scheme == "http":
            _add(
                findings, "URL-HTTP-001", "URL does not use HTTPS",
                url, "The connection would be unencrypted. Absence of HTTPS is a weak signal.",
                "Avoid entering any personal or payment details on non-HTTPS pages.",
            )
    return findings
