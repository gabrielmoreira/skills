# Before / After Mappings

## DTO → local input

### Before
`CreateNoteRequest` with optional transport fields flows into the use case.

### After
`CreateNoteInput` is the smaller required local shape used by behavior code.

## Provider enum → local status

### Before
`StripeChargeStatus` appears in business logic.

### After
`PaymentResult = 'paid' | 'waiting' | 'rejected'` appears in business logic.

## Provider naming → local naming

### Before
`dbSecretArn` is treated as the whole domain concept.

### After
`databaseCredentialsSource` is the local concept; the ARN stays inside that source shape.

## SDK type → app-facing view

### Before
A `Stripe.PaymentIntent` travels through local modules.

### After
A `PaymentIntentView` carries only the fields and meaning the app needs.

## Host concern → app concern

### Before
An Express request object reaches domain behavior.

### After
The edge parses request data into a smaller local input before calling behavior.
