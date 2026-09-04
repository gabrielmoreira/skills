# Compliance reporting request

The platform team asks that every error raised in every service carry these six
fields so a quarterly report can be generated without per-service work.

| Field | Meaning |
| --- | --- |
| `code` | stable machine readable identifier |
| `severity` | one of info, warning, critical |
| `dataSubjectId` | the person whose data the failing operation touched |
| `lawfulBasis` | the basis under which that data was being processed |
| `retentionClass` | how long the record involved is kept |
| `processorRegion` | where the processing happened |

Most failures in this service are validation and upstream timeouts, which touch
no data subject and have no lawful basis or retention class of their own.
