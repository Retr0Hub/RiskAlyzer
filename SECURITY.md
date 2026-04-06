# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| `main` branch | ✅ Active |
| All other branches | ❌ Not supported |

Only the latest code on the `main` branch receives security fixes.

---

## Reporting a Vulnerability

**Please do NOT open a public GitHub issue for security vulnerabilities.**

Instead, report them privately:

1. **GitHub Private Advisory** (preferred):  
   Go to [Security → Advisories → New draft](https://github.com/Retr0Hub/RiskAlyzer/security/advisories/new) and submit a draft advisory.

2. **Email**:  
   Contact the maintainer directly through the GitHub profile at [github.com/Retr0Hub](https://github.com/Retr0Hub).  
   Include in your report:
   - A clear description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (optional but welcome)

We aim to acknowledge reports within **48 hours** and provide a resolution timeline within **7 days**.

---

## Scope

### In scope
- Authentication bypasses or privilege escalation
- Unauthorised access to another user's Firestore data
- Injection vulnerabilities (XSS, CSRF, etc.)
- Exposure of API keys / secrets through the application

### Out of scope
- Issues requiring physical access to the device
- Third-party service vulnerabilities (Firebase, Google APIs, Open-Meteo)
- Issues in `node_modules` not caused by our code
- Best-practice deviations without a concrete exploit

---

## Known Limitations

### Client-side API Key (`VITE_GEMINI_API_KEY`)

The Gemini API key is currently bundled into the client-side JavaScript at build time (standard Vite behaviour for `VITE_*` variables). This means anyone who inspects the page source can read it.

**Planned mitigation:** Move AI inference calls to a Firebase Cloud Function so the key never reaches the browser.

**In the meantime:** Restrict your Gemini API key in [Google AI Studio](https://aistudio.google.com) or [Google Cloud Console](https://console.cloud.google.com) to:
- Specific referrer domains (your Firebase Hosting domain)
- Quota limits appropriate for personal use

### Health Data Disclaimer

All health estimates produced by BreathSense are **illustrative and educational only**. They are not clinical diagnoses. No sensitive health data is transmitted to third parties beyond what is necessary for AI inference (sent to Google's Gemini API over HTTPS).

---

## Dependencies

We use `npm audit` and GitHub Dependabot to monitor known vulnerabilities in dependencies. If you discover a vulnerable package being used, please report it as described above.

---

*Last updated: April 2025*
