# Ravindu & Wathsala — Engagement Invitation

Interactive engagement invitation: animated envelope that opens to reveal event
details, a live countdown, an embedded Google Map, and an RSVP form wired to
Google Forms.

## Run locally

```bash
npm run dev
```

Open http://localhost:3000

## Edit event details

All copy (names, date, venue, quote) lives in `src/app/config.ts`.

## Wire up the Google Form for RSVPs

1. Go to https://forms.google.com and create a new form titled something like
   "Ravindu & Wathsala — RSVP".
2. Add these three fields **in this order** (the type matters):
   - **Your name** — Short answer (required)
   - **Will you attend?** — Multiple choice with options `Yes` and `No`
     (required)
   - **A message for the couple** — Paragraph (optional)
3. In the form editor, click **Responses → Link to Sheets** to collect responses
   into a Google Sheet.
4. Click **Send → Link** and copy the form's shareable link. It will look like:
   `https://docs.google.com/forms/d/e/FORM_ID/viewform`
5. You need two things from the form: (a) the submit URL, and (b) the
   `entry.XXXXXX` ID of each field. To get them:
   - Open the live form in your browser, right-click → **View page source**.
   - Search the source for `entry.` — you'll see three IDs like
     `entry.123456789`. Note them in the order they appear (name, attending,
     message).
   - Replace `viewform` at the end of the form URL with `formResponse` to get
     the submit URL.
6. Open `src/app/config.ts` and fill in the `rsvp` object:

   ```ts
   export const rsvp = {
     formActionUrl:
       "https://docs.google.com/forms/d/e/YOUR_FORM_ID/formResponse",
     fields: {
       name: "entry.123456789",
       attending: "entry.234567890",
       message: "entry.345678901",
     },
   };
   ```

7. Restart `npm run dev`. Submitting the RSVP form on the page will now append
   rows to your linked Google Sheet.

> **Note:** submissions use `mode: "no-cors"`, so the browser will not report
> success/failure from Google. The UI optimistically shows the thank-you screen
> after the request is sent. Check your Sheet to verify arrivals during testing.

## Admin + per-invitee PDF downloads (Supabase)

Each invitee gets a unique shareable link (`/i/<slug>`) that shows the full
engagement invitation plus a floating **Download PDF** button wired to a PDF you
uploaded for them in the admin panel.

### 1. Supabase project setup

In your Supabase project:

**a. Create the table.** SQL editor → New query → run:

```sql
create extension if not exists pgcrypto;

create table if not exists public.invitees (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  pdf_path    text not null,
  created_at  timestamptz not null default now()
);

create index if not exists invitees_slug_idx on public.invitees (slug);
```

This project talks to Supabase with the **service role key** from the server,
so you do not need to create Row Level Security policies.

**b. Create a private Storage bucket** called `invitations` (Storage → New
bucket → **uncheck** "Public bucket").

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```
SUPABASE_URL=https://YOUR-REF.supabase.co         # or NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=...                     # Project Settings → API
SUPABASE_STORAGE_BUCKET=invitations
ADMIN_USERNAME=Ravindu
ADMIN_PASSWORD=your-password
SESSION_SECRET=<32 random bytes, base64url>       # see .env.example for gen cmd
```

Restart `npm run dev` after editing env vars.

### 3. Flow

1. Go to http://localhost:3000/admin/login and sign in.
2. Enter the invitee's name, pick their PDF, click **Add invitee**.
3. A unique `/i/<slug>` URL is generated — click **Copy link** and send it
   (WhatsApp, SMS, etc.) to that person.
4. When they open the link, they see the engagement invitation with a floating
   **Download PDF** button. Tapping it streams the PDF you uploaded.
5. **Delete** removes both the DB row and the stored PDF.

Notes:

- Links are unguessable (12 random bytes, URL-safe). Anyone with the link can
  download the file — treat the URL as the secret.
- Max PDF size: 15 MB (change in `src/app/api/admin/invitees/route.ts`).
- The root `/` page still shows the public invitation with no download button.

## Deploy

Push to GitHub and import into Vercel — no configuration needed (set the
same env vars in the Vercel project dashboard). Or run
`npm run build && npm start` on any Node host.
