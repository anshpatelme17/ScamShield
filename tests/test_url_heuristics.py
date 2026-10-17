from app.analyzers.url_heuristics import analyze_urls
from app.models import FindingStatus


def _rule_ids(urls):
    return {f.rule_id for f in analyze_urls(tuple(urls))}


def test_clean_url_produces_no_findings():
    assert _rule_ids(["https://www.example.com/about"]) == set()


def test_ip_address_url_flagged():
    assert "URL-IP-001" in _rule_ids(["http://192.168.0.10/pay"])


def test_shortener_url_flagged():
    assert "URL-SHORT-001" in _rule_ids(["https://bit.ly/3abcxyz"])


def test_risky_tld_flagged():
    assert "URL-TLD-001" in _rule_ids(["http://backend-verify-hk.top/login"])


def test_userinfo_at_syntax_flagged():
    assert "URL-USERINFO-001" in _rule_ids(["http://secure-bank.com@evil.example.net/x"])


def test_sensitive_keyword_path_flagged():
    assert "URL-KEYWORD-001" in _rule_ids(["https://bank.example.co.in/session/verify"])


def test_non_https_flagged():
    assert "URL-HTTP-001" in _rule_ids(["http://newsletter.example.org/june"])


def test_punycode_flagged():
    assert "URL-PUNYCODE-001" in _rule_ids(["https://xn--pypal-4ve.com/login"])


def test_each_rule_fires_once_across_multiple_urls():
    findings = analyze_urls(
        ("http://192.168.0.10/a", "http://10.0.0.5/b", "https://bit.ly/short")
    )
    ip_rules = [f for f in findings if f.rule_id == "URL-IP-001"]
    assert len(ip_rules) == 1
    assert analyze_urls(("https://bit.ly/short",))[0].rule_id == "URL-SHORT-001"


def test_unparseable_url_produces_check_failed():
    findings = analyze_urls(("http://",))
    assert [f.rule_id for f in findings] == ["URL-ERR-001"]
    assert findings[0].status is FindingStatus.CHECK_FAILED
