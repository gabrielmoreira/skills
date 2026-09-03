# How the gateway builds its signature

Answers to the five questions, with the code that settles each one.

## 1. What algorithm signs it

HMAC-SHA256. `src/gateway/sign.ts:14` constructs it with `createHmac("sha256",
secret)`, and the digest is taken as base64 at `src/gateway/sign.ts:16`. There is
no configuration path that selects a different algorithm; the string is a
literal. An earlier branch (`src/gateway/legacy-sign.ts:9`) used SHA1 and is no
longer reachable, since the only caller was removed in the January cutover.

## 2. Exactly what byte string is signed

The nonce, a literal dot, and the raw request body, in that order, as UTF-8.
`src/gateway/sign.ts:15` builds it as a template string. The body is the exact
bytes that go on the wire, not a re-serialisation: `src/gateway/client.ts:41`
serialises once into a local, signs that local at line 44, and sends the same
local at line 47. This matters because our serialiser orders object keys by
insertion, and a second serialisation of the same object can reorder them.

## 3. Which key it uses

The account secret, not a per-request or per-device key. It is read once at
`src/gateway/config.ts:22` from the secret store and held for the process
lifetime. There is exactly one, and rotation is handled by the runbook rather
than by the code holding two.

## 4. The exact header value format

`X-Signature: v1=<base64>`, assembled at `src/gateway/client.ts:52`. The `v1=`
prefix is a literal. The gateway accepts no other prefix, which we know because
`src/gateway/client.ts:58` retries once on a 401 without the prefix and that
retry has never succeeded in the logs.

## 5. Under what condition the header is attached at all

Always, on every request that carries a body. `src/gateway/client.ts:38` gates it
on `body !== undefined`, and every call site passes a body. There is no feature
flag and no environment in which it is skipped.

## What happens when the nonce is missing

This is the part they will argue about, so it is stated precisely.

If `nonce` is undefined, `src/gateway/sign.ts:15` produces the string
`"undefined." + body`, because template interpolation stringifies it. The
signature is well formed and wrong. The gateway returns 401 with the same body it
returns for a wrong secret, so a missing nonce and a rotated secret are
indistinguishable from the response alone.

We found this because `src/gateway/client.ts:31` reads the nonce from a header
the upstream proxy sets, and that proxy drops the header for requests it serves
from cache. Cached requests therefore sign with `"undefined."` and fail, which is
why the failures cluster and look intermittent.

The fix is theirs or ours depending on whose contract the nonce belongs to, and
that is the question this note exists to put to them.
