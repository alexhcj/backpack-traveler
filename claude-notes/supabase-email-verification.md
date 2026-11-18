# Supabase email verification — setup checklist

Code is done (`/verify-email`, `/email-verified`, `/auth/confirm`, actions `auth.verifyOtp` / `auth.resendCode`).
This file lists what has to be configured in the Supabase dashboard (project `hzibisccskwlwouszepc`).

## Why it does not work "out of the box" in dev
Supabase's built-in mail service only delivers to **team members' addresses** and is limited to a few emails per hour. Any other address (or a second signup within the hour) never receives the code. Fix = custom SMTP (step 3). Until then you can confirm test users by SQL (step 6).

## Checklist

1. **Confirm email ON** — Authentication → Sign In / Providers → Email → "Confirm email".
2. **URLs** — Authentication → URL Configuration
   - Site URL: `http://localhost:4321` (change to the real domain in production)
   - Redirect URLs: add `http://localhost:4321/**` (and the production URL later)
3. **Custom SMTP** — Authentication → Emails → SMTP Settings → "Enable custom SMTP" (see options below). Enter credentials only in the dashboard, never in chat or in git.
4. **Email template** — Authentication → Emails → Templates → "Confirm signup"
   - Subject: `Your Backpack Traveler verification code`
   - Body: paste `supabase/email-templates/confirm-signup.html` (everything below the top comment)
5. **Test** — register with a real address → code arrives → `/verify-email` → `/email-verified`. Also test: wrong code, "Resend code" (30s cooldown), the "Confirm my email" link.
6. **Dev shortcut (optional)** — confirm a test user without email:
   ```sql
   update auth.users set email_confirmed_at = now() where email = 'test@example.com';
   ```
7. **Before launch** — switch to a transactional provider on your own domain (SPF/DKIM verified), raise the email rate limit (Authentication → Rate Limits), re-check Site URL.

## SMTP options (fill the dashboard form: sender email, sender name, host, port, username, password)

| Use | Provider | Host | Port | Username | Password | Sender email |
|---|---|---|---|---|---|---|
| **Dev, no real mails** | Mailtrap Email Testing (sandbox inbox) | `sandbox.smtp.mailtrap.io` | `2525` | from the inbox "SMTP settings" | from the same page | anything, e.g. `noreply@backpacktraveler.test` |
| **Dev, real inbox** | Gmail | `smtp.gmail.com` | `465` | your Gmail address | a Google **App Password** (needs 2-step verification; myaccount.google.com/apppasswords) | the same Gmail address |
| **Production** | Resend | `smtp.resend.com` | `465` | `resend` | your Resend API key | `noreply@<your verified domain>` |
| **Production** | Brevo | `smtp-relay.brevo.com` | `587` (or `465`) | SMTP login from Brevo → SMTP & API | SMTP key | a verified sender |

Notes
- Mailtrap sandbox captures every email in a web inbox: ideal for development (no spam risk, no real addresses needed).
- Resend only sends to other people once a domain is verified; before that it can only send to your own account address.
- After enabling custom SMTP Supabase raises the limit to 30 emails/hour (adjustable).
- The "Sender email address", "Host", "Username" and "Password" fields are required (red in the form until filled).

## Resend → Supabase (step by step)

Docs: https://resend.com/docs/send-with-supabase-smtp · https://supabase.com/docs/guides/auth/auth-smtp

**Prerequisite:** a Resend account. For a quick dev test without a domain you can send from `onboarding@resend.dev`, but only **to the email address of your own Resend account**. To email real users, verify a domain.

1. **Add a domain** — Resend → Domains → Add domain (e.g. `mail.yourdomain.com`, a subdomain is recommended). Add the DNS records Resend shows (SPF `TXT`, DKIM `TXT`/`CNAME`, optional DMARC) at your DNS host. Wait until the status is **Verified**.
2. **Create an API key** — Resend → API Keys → Create → permission "Sending access" (restrict to the domain). Copy it once; keep it out of git and chat.
3. **Connect to Supabase** — pick one:
   - **Integration (least typing):** Resend → Integrations → Supabase → connect the project `hzibisccskwlwouszepc`. It creates an API key and fills the SMTP settings.
   - **Manual:** Supabase → Authentication → Emails → SMTP Settings → enable custom SMTP:
     - Sender email: `noreply@<your verified domain>` (dev without domain: `onboarding@resend.dev`)
     - Sender name: `Backpack Traveler`
     - Host: `smtp.resend.com` · Port: `465`
     - Username: `resend` · Password: the API key
4. **Rate limit** — Authentication → Rate Limits → raise "emails per hour" (new custom SMTP starts at about 30/hour).
5. **Template** — paste `supabase/email-templates/confirm-signup.html` into "Confirm signup" (see checklist above).
6. **Test** — register with a real address; check Resend → Logs for the delivery.

Optional, for later transactional mail (order receipts): put `RESEND_API_KEY` in `.env` (gitignored) and send through the Resend API from a server action.
