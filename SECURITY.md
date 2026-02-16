# Security Policy

## Supported versions

We apply security-related updates to the current default branch (`main`). We do not maintain separate branches for older versions.

## Reporting a vulnerability

If you believe you’ve found a security vulnerability, please report it responsibly:

1. **Do not** open a public issue for the vulnerability.
2. Open a **private security advisory** on GitHub:  
   [Repository] → **Security** → **Advisories** → **Report a vulnerability**  
   or email the maintainers if you need another channel (see the repo for contact details).
3. Include a clear description, steps to reproduce, and impact if possible.
4. Allow time for a fix before any public disclosure.

We’ll acknowledge your report and will work with you to understand and address the issue. We appreciate responsible disclosure and will credit you in the advisory (unless you prefer to stay anonymous).

## Scope

This project provides Cursor IDE agent configuration files and an install script. Security considerations include:

- Safety of the install script (e.g. what it downloads and executes).
- Safety and integrity of the agent and rule content (no malicious or unsafe instructions).

If you’re unsure whether something is in scope, report it and we’ll triage.
