const payloads = {
  "scam_url": {
    "case_file": {
      "case_id": "9f2f605bed5244cdb876bc572eadbe41",
      "schema_version": "0.1.0",
      "generated_at": "2026-10-18T05:19:25.175054Z",
      "input_type": "text",
      "input_length": 179,
      "input_sha256": "31e3cfb83ac300a99981d6bb781efa15e2e4b75444282eef0446728c2cb529c6",
      "findings": [
        {
          "id": "F-001",
          "title": "URL uses a frequently abused top-level domain",
          "category": "url_anomaly",
          "status": "rule_match",
          "source": "local_rule",
          "evidence": [
            "http://kbc-lottery-winner.tk/claim"
          ],
          "rule_id": "URL-TLD-001",
          "limitations": "Some TLDs are disproportionately used in phishing. Not proof by itself.",
          "recommended_action": "Verify the sender through an official channel before following.",
          "confidence": null
        },
        {
          "id": "F-002",
          "title": "URL does not use HTTPS",
          "category": "url_anomaly",
          "status": "rule_match",
          "source": "local_rule",
          "evidence": [
            "http://kbc-lottery-winner.tk/claim"
          ],
          "rule_id": "URL-HTTP-001",
          "limitations": "The connection would be unencrypted. Absence of HTTPS is a weak signal.",
          "recommended_action": "Avoid entering any personal or payment details on non-HTTPS pages.",
          "confidence": null
        }
      ],
      "limitations": [],
      "checks_not_completed": [],
      "verdict": "suspicious",
      "verdict_reasons": [
        "2 distinct URL anomalies found: URL-HTTP-001, URL-TLD-001."
      ],
      "verdict_reason_specs": [
        { "key": "verdictreason.urlAnomalies", "args": ["URL-HTTP-001", "URL-TLD-001"] }
      ],
      "disclaimer": "This report lists indicators found by deterministic local checks. It is not proof that a message is fraudulent, and the absence of indicators is not proof that it is safe. Always verify through official, independent channels."
    },
    "explanation": {
      "verdict": "suspicious",
      "headline": "Warning signs found",
      "summary": "This submission shows warning signs consistent with known scam patterns. Verify independently before acting on it.",
      "key_points": [
        "F-001: URL uses a frequently abused top-level domain",
        "F-002: URL does not use HTTPS"
      ],
      "unverified": [
        "F-001: Some TLDs are disproportionately used in phishing. Not proof by itself.",
        "F-001: quoted text is untrusted input, not verified fact",
        "F-002: The connection would be unencrypted. Absence of HTTPS is a weak signal.",
        "F-002: quoted text is untrusted input, not verified fact"
      ],
      "actions": [
        "Verify the sender through an official channel before following.",
        "Avoid entering any personal or payment details on non-HTTPS pages.",
        "Do not act on this message until verified."
      ],
      "reporting": "Report suspected fraud in India via the National Cyber Crime Reporting Portal (cybercrime.gov.in) or the cyber crime helpline 1930. For financial fraud, also inform your bank immediately."
    }
  },
  "benign": {
    "case_file": {
      "case_id": "b91df87b61bb47a08fbe0e1cde52b8ba",
      "schema_version": "0.1.0",
      "generated_at": "2026-10-18T05:19:25.178554Z",
      "input_type": "text",
      "input_length": 55,
      "input_sha256": "b3efd1e78cffc8a4715c762e738097eda154e4cd9d3f33a81025ad3807cefa2f",
      "findings": [],
      "limitations": [],
      "checks_not_completed": [],
      "verdict": "no_strong_warning_signs_found",
      "verdict_reasons": [
        "No scam indicators matched any rule."
      ],
      "verdict_reason_specs": [
        { "key": "verdictreason.none", "args": [] }
      ],
      "disclaimer": "This report lists indicators found by deterministic local checks. It is not proof that a message is fraudulent, and the absence of indicators is not proof that it is safe. Always verify through official, independent channels."
    },
    "explanation": {
      "verdict": "no_strong_warning_signs_found",
      "headline": "No strong warning signs found",
      "summary": "The checks found no strong warning signs. This is NOT proof that the submission is safe: scams change constantly and no check list is complete. If anything feels off, verify through official channels.",
      "key_points": [
        "No indicator matched any rule in the current rule set."
      ],
      "unverified": [],
      "actions": [
        "Stay alert; verify unexpected requests through official channels."
      ],
      "reporting": "Report suspected fraud in India via the National Cyber Crime Reporting Portal (cybercrime.gov.in) or the cyber crime helpline 1930. For financial fraud, also inform your bank immediately."
    }
  },
  "phone_valid": {
    "case_file": {
      "case_id": "09ab6bc24a4c4740a30ceece7f0571b7",
      "schema_version": "0.1.0",
      "generated_at": "2026-10-20T06:48:26.819257Z",
      "input_type": "phone_number",
      "input_length": 15,
      "input_sha256": "d2ea48c82e363f3464f5a28de5d6680527c7120fc64bb5538f2bca91978f7c5b",
      "findings": [
        {
          "id": "F-001",
          "title": "Indian mobile number validated (format only)",
          "category": "other",
          "status": "observed",
          "source": "local_rule",
          "evidence": ["+919876543210"],
          "rule_id": "IN-PHONE-FMT-001",
          "limitations": "Only the number format was checked locally (10 digits starting 6-9, optional +91/0091/0 prefix). Number reputation could not be verified: this offline build has no phone-reputation source available locally. A valid format does not make a number trustworthy, and an unfamiliar number is not treated as fraudulent.",
          "recommended_action": "Do not trust a number just because it is formatted correctly. Call back through the official number published on the organisation's website. Report fraud attempts to cybercrime.gov.in or helpline 1930.",
          "confidence": "low"
        }
      ],
      "limitations": [],
      "checks_not_completed": [],
      "verdict": "no_strong_warning_signs_found",
      "verdict_reasons": [
        "No scam indicators matched any rule."
      ],
      "verdict_reason_specs": [
        { "key": "verdictreason.none", "args": [] }
      ],
      "disclaimer": "This report lists indicators found by deterministic local checks. It is not proof that a message is fraudulent, and the absence of indicators is not proof that it is safe. Always verify through official, independent channels."
    },
    "explanation": {
      "verdict": "no_strong_warning_signs_found",
      "headline": "No strong warning signs found",
      "summary": "The checks found no strong warning signs. This is NOT proof that the submission is safe: scams change constantly and no check list is complete. If anything feels off, verify through official channels.",
      "key_points": [
        "No indicator matched any rule in the current rule set."
      ],
      "unverified": [
        "F-001: Only the number format was checked locally (10 digits starting 6-9, optional +91/0091/0 prefix). Number reputation could not be verified: this offline build has no phone-reputation source available locally. A valid format does not make a number trustworthy, and an unfamiliar number is not treated as fraudulent."
      ],
      "actions": [
        "Do not trust a number just because it is formatted correctly. Call back through the official number published on the organisation's website. Report fraud attempts to cybercrime.gov.in or helpline 1930.",
        "Stay alert; verify unexpected requests through official channels."
      ],
      "reporting": "Report suspected fraud in India via the National Cyber Crime Reporting Portal (cybercrime.gov.in) or the cyber crime helpline 1930. For financial fraud, also inform your bank immediately."
    }
  }
};
export default payloads;