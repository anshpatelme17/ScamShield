"""Central configuration constants. No secrets are stored here."""

MAX_INPUT_LENGTH = 10_000

MAX_IMAGE_BYTES = 2_000_000

MAX_PAYLOADS_PER_SCHEME = 8

SCHEMA_VERSION = "0.1.0"

DEFAULT_DISCLAIMER = (
    "This report lists indicators found by deterministic local checks. "
    "It is not proof that a message is fraudulent, and the absence of "
    "indicators is not proof that it is safe. Always verify through "
    "official, independent channels."
)

REPORTING_GUIDANCE = (
    "Report suspected fraud in India via the National Cyber Crime Reporting "
    "Portal (cybercrime.gov.in) or the cyber crime helpline 1930. "
    "For financial fraud, also inform your bank immediately."
)
