use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

const VERSION: &str = "castalia.wallet-onboarding.v1";
const OPERATION: &str = "authenticate";

#[derive(Clone, Copy, Debug)]
pub struct ValidationContext<'a> {
    pub expected_origin: &'a str,
    pub expected_audience: &'a str,
    pub now_ms: u64,
    pub maximum_lifetime_ms: u64,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ValidationError {
    Malformed,
    UnsupportedVersion,
    WrongOrigin,
    WrongAudience,
    WrongOperation,
    MissingField,
    NotYetValid,
    Expired,
    LifetimeTooLong,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ValidatedEnvelope {
    pub request_id: String,
    pub nonce: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct OnboardingEnvelope {
    version: String,
    request_id: String,
    origin: String,
    audience: String,
    operation: String,
    nonce: String,
    issued_at_ms: u64,
    expires_at_ms: u64,
}

pub fn validate_onboarding_envelope_json(
    input: &str,
    context: ValidationContext<'_>,
) -> Result<ValidatedEnvelope, ValidationError> {
    let envelope: OnboardingEnvelope =
        serde_json::from_str(input).map_err(|_| ValidationError::Malformed)?;

    if envelope.version != VERSION {
        return Err(ValidationError::UnsupportedVersion);
    }
    if envelope.origin != context.expected_origin {
        return Err(ValidationError::WrongOrigin);
    }
    if envelope.audience != context.expected_audience {
        return Err(ValidationError::WrongAudience);
    }
    if envelope.operation != OPERATION {
        return Err(ValidationError::WrongOperation);
    }
    if envelope.request_id.is_empty() || envelope.nonce.is_empty() {
        return Err(ValidationError::MissingField);
    }
    if envelope.issued_at_ms > context.now_ms {
        return Err(ValidationError::NotYetValid);
    }
    if envelope.expires_at_ms <= context.now_ms {
        return Err(ValidationError::Expired);
    }
    let lifetime = envelope
        .expires_at_ms
        .checked_sub(envelope.issued_at_ms)
        .ok_or(ValidationError::Malformed)?;
    if lifetime > context.maximum_lifetime_ms {
        return Err(ValidationError::LifetimeTooLong);
    }

    Ok(ValidatedEnvelope {
        request_id: envelope.request_id,
        nonce: envelope.nonce,
    })
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct BrowserDecision {
    allowed: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    reason: Option<ValidationError>,
}

#[wasm_bindgen]
pub fn validate_onboarding_envelope(
    input: &str,
    expected_origin: &str,
    expected_audience: &str,
    now_ms: f64,
) -> String {
    if !now_ms.is_finite() || now_ms < 0.0 || now_ms > u64::MAX as f64 {
        return serde_json::to_string(&BrowserDecision {
            allowed: false,
            reason: Some(ValidationError::Malformed),
        })
        .expect("serializing a fixed validation decision cannot fail");
    }

    let decision = match validate_onboarding_envelope_json(
        input,
        ValidationContext {
            expected_origin,
            expected_audience,
            now_ms: now_ms as u64,
            maximum_lifetime_ms: 60_000,
        },
    ) {
        Ok(_) => BrowserDecision {
            allowed: true,
            reason: None,
        },
        Err(reason) => BrowserDecision {
            allowed: false,
            reason: Some(reason),
        },
    };

    serde_json::to_string(&decision).expect("serializing a fixed validation decision cannot fail")
}
