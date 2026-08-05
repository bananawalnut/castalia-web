use castalia_wallet_wasm::{ValidationContext, ValidationError, validate_onboarding_envelope_json};

fn valid_envelope() -> String {
    serde_json::json!({
        "version": "castalia.wallet-onboarding.v1",
        "requestId": "req-01",
        "origin": "https://castalia.example",
        "audience": "castalia-hub",
        "operation": "authenticate",
        "nonce": "nonce-01",
        "issuedAtMs": 1_000,
        "expiresAtMs": 31_000
    })
    .to_string()
}

fn context() -> ValidationContext<'static> {
    ValidationContext {
        expected_origin: "https://castalia.example",
        expected_audience: "castalia-hub",
        now_ms: 10_000,
        maximum_lifetime_ms: 60_000,
    }
}

#[test]
fn accepts_an_exact_short_lived_authentication_envelope() {
    let validated = validate_onboarding_envelope_json(&valid_envelope(), context()).unwrap();
    assert_eq!(validated.request_id, "req-01");
    assert_eq!(validated.nonce, "nonce-01");
}

#[test]
fn rejects_wrong_origin_audience_operation_and_version() {
    for (field, value, expected) in [
        (
            "origin",
            "https://evil.example",
            ValidationError::WrongOrigin,
        ),
        ("audience", "other-service", ValidationError::WrongAudience),
        ("operation", "sign_bytes", ValidationError::WrongOperation),
        (
            "version",
            "castalia.wallet-onboarding.v2",
            ValidationError::UnsupportedVersion,
        ),
    ] {
        let mut envelope: serde_json::Value = serde_json::from_str(&valid_envelope()).unwrap();
        envelope[field] = serde_json::Value::String(value.to_owned());
        assert_eq!(
            validate_onboarding_envelope_json(&envelope.to_string(), context()).unwrap_err(),
            expected
        );
    }
}

#[test]
fn rejects_expired_overlong_empty_and_unknown_input() {
    let mut expired: serde_json::Value = serde_json::from_str(&valid_envelope()).unwrap();
    expired["expiresAtMs"] = 9_999.into();
    assert_eq!(
        validate_onboarding_envelope_json(&expired.to_string(), context()).unwrap_err(),
        ValidationError::Expired
    );

    let mut overlong: serde_json::Value = serde_json::from_str(&valid_envelope()).unwrap();
    overlong["expiresAtMs"] = 70_001.into();
    assert_eq!(
        validate_onboarding_envelope_json(&overlong.to_string(), context()).unwrap_err(),
        ValidationError::LifetimeTooLong
    );

    let mut empty_nonce: serde_json::Value = serde_json::from_str(&valid_envelope()).unwrap();
    empty_nonce["nonce"] = "".into();
    assert_eq!(
        validate_onboarding_envelope_json(&empty_nonce.to_string(), context()).unwrap_err(),
        ValidationError::MissingField
    );

    let mut unknown: serde_json::Value = serde_json::from_str(&valid_envelope()).unwrap();
    unknown["privateKey"] = "must-never-cross".into();
    assert_eq!(
        validate_onboarding_envelope_json(&unknown.to_string(), context()).unwrap_err(),
        ValidationError::Malformed
    );
}
