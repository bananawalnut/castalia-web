use castalia_wallet_wasm::{
    ValidationContext, ValidationError, prepare_membership_presentation_verification,
    validate_onboarding_envelope_json,
};

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

fn membership_application() -> serde_json::Value {
    serde_json::json!({
        "factoryId": "1111111111111111111111111111111111111111111111111111111111111111",
        "programId": "2222222222222222222222222222222222222222222222222222222222222222",
        "applicantOfficialDreggCellId": "3333333333333333333333333333333333333333333333333333333333333333",
        "ownerPublicKey": "03a107bff3ce10be1d70dd18e74bc09967e4d6309ba50d5f1ddc8664125531b8",
        "applicationKind": 7,
        "applicationVersion": 1,
        "applicationNonce": 7,
        "membershipClass": 1,
        "jurisdictionCode": 0,
        "applicationFlags": 0,
        "createdAt": 1_700_000_000
    })
}

fn membership_presentation() -> serde_json::Value {
    serde_json::json!({
        "schema": "castalia.wallet-membership-presentation.v2",
        "ownerPublicKey": "03a107bff3ce10be1d70dd18e74bc09967e4d6309ba50d5f1ddc8664125531b8",
        "challenge": {
            "version": 2,
            "challengeId": "AAECAwQFBgcICQoLDA0ODw",
            "nonce": "EBESExQVFhcYGRobHB0eHw",
            "origin": "https://castalia.example",
            "audience": "castalia-control-local",
            "operation": "castalia.membership.enroll",
            "ownerPublicKey": "03a107bff3ce10be1d70dd18e74bc09967e4d6309ba50d5f1ddc8664125531b8",
            "applicationCommitment": "f21ed04a6d39c8abcb5ebefd13bf0046c67daf967e18618e6e8fde54a68356b5",
            "signatureSuite": 1,
            "issuedAt": 1_700_000_000_123_u64,
            "expiresAt": 1_700_000_060_123_u64
        },
        "signatureSuite": "Ed25519",
        "signature": "6vScDhYJnMFhyuLTswLunqzhj1R5a7f9IGWI-5_sfQnBr1D3rSaH0-ZM7_D5HCJ1ngmRTtVhLmMlFeARfcUHCQ"
    })
}

fn prepare_membership(
    application: &serde_json::Value,
    presentation: &serde_json::Value,
) -> serde_json::Value {
    serde_json::from_str(&prepare_membership_presentation_verification(
        &application.to_string(),
        &presentation.to_string(),
        "https://castalia.example",
        "castalia-control-local",
        "03a107bff3ce10be1d70dd18e74bc09967e4d6309ba50d5f1ddc8664125531b8",
        1_700_000_010_000_f64,
    ))
    .unwrap()
}

#[test]
fn prepares_the_exact_wallet_v2_signature_for_webcrypto_verification() {
    let decision = prepare_membership(&membership_application(), &membership_presentation());
    assert_eq!(decision["allowed"], true);
    assert_eq!(
        decision["ownerPublicKey"],
        "03a107bff3ce10be1d70dd18e74bc09967e4d6309ba50d5f1ddc8664125531b8"
    );
    assert_eq!(
        decision["signatureHex"],
        "eaf49c0e16099cc161cae2d3b302ee9eace18f54796bb7fd206588fb9fec7d09c1af50f7ad2687d3e64ceff0f91c22759e09914ed5612e632515e0117dc50709"
    );
    assert_eq!(
        decision["transcriptHex"],
        "63617374616c69612f77616c6c65742d6d656d626572736869702d656e726f6c6c6d656e742f763200020000000000000010000000000102030405060708090a0b0c0d0e0f10000000101112131415161718191a1b1c1d1e1f1800000068747470733a2f2f63617374616c69612e6578616d706c651600000063617374616c69612d636f6e74726f6c2d6c6f63616c1a00000063617374616c69612e6d656d626572736869702e656e726f6c6c2000000003a107bff3ce10be1d70dd18e74bc09967e4d6309ba50d5f1ddc8664125531b820000000f21ed04a6d39c8abcb5ebefd13bf0046c67daf967e18618e6e8fde54a68356b501000000000000007b68e5cf8b010000db52e6cf8b010000"
    );
}

#[test]
fn rejects_application_context_and_signature_shape_tampering() {
    let mut application = membership_application();
    application["membershipClass"] = 2.into();
    let decision = prepare_membership(&application, &membership_presentation());
    assert_eq!(decision["allowed"], false);
    assert_eq!(decision["reason"], "application-commitment-mismatch");

    let mut presentation = membership_presentation();
    presentation["challenge"]["audience"] = "other-control".into();
    let decision = prepare_membership(&membership_application(), &presentation);
    assert_eq!(decision["allowed"], false);
    assert_eq!(decision["reason"], "wrong-audience");

    let mut presentation = membership_presentation();
    presentation["signature"] = "not-a-signature".into();
    let decision = prepare_membership(&membership_application(), &presentation);
    assert_eq!(decision["allowed"], false);
    assert_eq!(decision["reason"], "invalid-signature");
}
