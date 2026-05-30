# Engineering Standards

This file defines repository-wide engineering expectations for all contributors.

## Core Principles

- Ship production-grade code.
- Prioritize correctness, maintainability, readability, and security.
- Keep implementations explicit, deterministic, and testable.
- Avoid unnecessary abstractions and hidden side effects.
- Keep changes scoped, reversible, and well-documented.

## Quality Requirements

- Follow PEP 8 in Python modules and standard TypeScript conventions in frontend code.
- Use type hints/types for public interfaces.
- Validate external inputs before processing.
- Handle failures with actionable errors and safe fallbacks.
- Avoid hardcoded runtime secrets and environment-specific endpoints.
- Minimize duplication through shared utilities.

## Reliability and Edge Cases

Always consider:

- null/empty values
- invalid data types
- oversized payloads
- retry and timeout behavior
- concurrency and race conditions
- partial failures and cleanup paths
- backward compatibility during migrations

## Security Rules

Never:

- commit or print secrets
- hardcode credentials
- disable security checks
- expose environment variables in logs

Forbidden paths:

```text
.env
.env.*
*.pem
*.key
*.crt
*.p12
*.pfx
id_rsa
id_ed25519
secrets.*
credentials.*
```
