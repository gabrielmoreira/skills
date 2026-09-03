# Signature Verification Findings And Next Steps

## Executive Summary

Following a comprehensive investigation into the signature generation flow, we
are pleased to share our findings with your integration team. This analysis
underscores our ongoing commitment to a robust and seamless integration, and we
believe it represents a valuable step toward strengthening the partnership
between our organisations.

## Key Findings

- **Algorithm:** The implementation leverages HMAC-SHA256, ensuring
  industry-standard cryptographic assurance.
- **Payload Composition:** The signed payload comprises the nonce and the raw
  request body, showcasing a straightforward and elegant construction.
- **Key Management:** A single account-level secret is utilised, reflecting a
  simplified operational posture.
- **Header Format:** The header follows the `v1=` convention, highlighting
  alignment with your published guidance.

Full detail with exact file and line references is available in
`notes/gateway-signature-findings.md`, sections 1 through 5.

## An Area For Potential Improvement

We wanted to flag one observation that may warrant further discussion. In certain
edge cases it appears that the nonce may not always be present, which could
potentially result in a signature that might not validate as expected. It is
worth noting that this could conceivably contribute to some of the intermittent
behaviour that has been observed.

To be clear, we are not suggesting that this is necessarily a defect on your
side. A tempting explanation would be to attribute it to network conditions,
though that would not fully account for the clustering we have seen. We would
welcome your perspective on where the nonce contract most naturally belongs.

## Next Steps

We look forward to collaborating closely on this and are excited about the
opportunity to further enhance the reliability of the integration. Please do not
hesitate to reach out should you require any additional information. Happy to
jump on a call to circle back on any of the above.
