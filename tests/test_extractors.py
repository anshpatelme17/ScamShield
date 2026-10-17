from app.extractors import extract_indicators, extract_urls


def test_extract_urls_basic():
    text = "Pay at http://scam.example or https://bit.ly/x and www.foo.com now"
    urls = extract_urls(text)
    assert "http://scam.example" in urls
    assert "https://bit.ly/x" in urls
    assert "www.foo.com" in urls


def test_extract_urls_strips_trailing_punctuation():
    assert extract_urls("Visit http://example.com.") == ("http://example.com",)


def test_extract_indicators_upi_valid_handle():
    indicators = extract_indicators("Send to ramesh@ybl please")
    assert "ramesh@ybl" in indicators.upi_ids


def test_extract_indicators_email_not_treated_as_upi():
    indicators = extract_indicators("mail me at john@example.com")
    assert indicators.upi_ids == ()


def test_extract_indicators_phone_apk_amount():
    indicators = extract_indicators("Call 9876543210. Install app.apk. Pay Rs.500 now")
    assert "9876543210" in indicators.phone_numbers
    assert "app.apk" in indicators.apk_references
    assert "500" in indicators.amounts_inr
