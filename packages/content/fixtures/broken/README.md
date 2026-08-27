# Deliberately broken content

**Do not fix these.** Every directory here is one authoring mistake, held still, so that
`validate.test.ts` can assert on the exact message the validator produces for it. A validator
is worth exactly what it refuses, and these are what it refuses.

| Directory | The mistake |
|---|---|
| `cyclic/` | `t1-a` -> `t1-c` -> `t1-b` -> `t1-a`, so none of the three can ever unlock |
| `dangling-require/` | requires an id nobody authored |
| `unknown-concept/` | a concept tag that is not in the registry (`whille`) |
| `concept-above-tier/` | a tier 3 quest tagged `class`, first taught in tier 5 |
| `missing-file/` | brief, starter, and tests all point at files that do not exist |
| `duplicate-id/` | two files claiming the same id |
| `no-tier-manifest/` | content in a tier with no manifest, so §5.1a has no denominator |
| `malformed-yaml/` | an unclosed flow sequence — will not parse at all |
| `many-problems/` | four different problems at once, pinning that one run reports them all |

`many-problems/` is also the fixture to run by hand when judging whether the report is any good:

```
npm run validate:content -- --root packages/content/fixtures/broken/many-problems
```
