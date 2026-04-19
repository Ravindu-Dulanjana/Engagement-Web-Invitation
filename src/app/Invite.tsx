"use client";

import { useEffect, useMemo, useState } from "react";
import { event, rsvp } from "./config";

function CornerOrnament({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  return (
    <svg
      className={`corner-ornament ${pos}`}
      viewBox="0 0 90 90"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      aria-hidden
    >
      <path d="M4 4 L40 4 M4 4 L4 40" />
      <path d="M4 14 Q24 14 34 4" />
      <path d="M14 4 Q14 24 4 34" />
      <circle cx="34" cy="14" r="2.2" fill="currentColor" stroke="none" />
      <circle cx="14" cy="34" r="2.2" fill="currentColor" stroke="none" />
      <path d="M20 20 Q28 12 40 20 Q32 28 20 20 Z" opacity="0.6" />
    </svg>
  );
}

function Particles({ count = 22 }: { count?: number }) {
  const [items, setItems] = useState<
    Array<{
      id: number;
      left: number;
      size: number;
      duration: number;
      delay: number;
      drift: number;
      opacity: number;
    }>
  >([]);
  useEffect(() => {
    const isMobile =
      typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches;
    const n = isMobile ? Math.min(count, 12) : count;
    setItems(
      Array.from({ length: n }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 3 + Math.random() * 6,
        duration: 12 + Math.random() * 16,
        delay: -Math.random() * 20,
        drift: (Math.random() - 0.5) * 120,
        opacity: 0.4 + Math.random() * 0.5,
      })),
    );
  }, [count]);
  return (
    <div className="particles" aria-hidden>
      {items.map((p) => (
        <span
          key={p.id}
          className="particle"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            opacity: p.opacity,
            // @ts-expect-error CSS custom property
            "--drift": `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

function Sparkles() {
  const [items, setItems] = useState<
    Array<{
      id: number;
      top: number;
      left: number;
      delay: number;
      duration: number;
    }>
  >([]);
  useEffect(() => {
    setItems(
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        top: Math.random() * 80 + 10,
        left: Math.random() * 80 + 10,
        delay: Math.random() * 3,
        duration: 2.5 + Math.random() * 2,
      })),
    );
  }, []);
  return (
    <>
      {items.map((s) => (
        <span
          key={s.id}
          className="sparkle"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
          aria-hidden
        />
      ))}
    </>
  );
}

function AnimatedText({
  text,
  className,
  baseDelay = 0,
  step = 50,
  style,
}: {
  text: string;
  className?: string;
  baseDelay?: number;
  step?: number;
  style?: React.CSSProperties;
}) {
  return (
    <span className={className} style={style}>
      {Array.from(text).map((ch, i) => (
        <span
          key={i}
          className="reveal-letter"
          style={{ animationDelay: `${baseDelay + i * step}ms` }}
        >
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </span>
  );
}

type RsvpStatus = "idle" | "sending" | "sent" | "error";

function useCountdown(targetISO: string) {
  const target = useMemo(() => new Date(targetISO).getTime(), [targetISO]);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (now === null) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, done: false, ready: false };
  }
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return { days, hours, minutes, seconds, done: diff === 0, ready: true };
}

function CountdownBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center min-w-[48px] sm:min-w-[82px]">
      <div className="text-2xl sm:text-5xl font-light gold-gradient-text tabular-nums">
        {String(value).padStart(2, "0")}
      </div>
      <div className="text-[9px] sm:text-xs tracking-[0.2em] sm:tracking-[0.25em] uppercase text-cream/70 mt-1">
        {label}
      </div>
    </div>
  );
}

function Countdown() {
  const { days, hours, minutes, seconds, done, ready } = useCountdown(event.dateISO);
  if (!ready) {
    return <div className="h-[68px] sm:h-[108px]" aria-hidden />;
  }
  if (done) {
    return (
      <p className="text-xl sm:text-2xl gold-gradient-text font-light tracking-wide">
        Today is the day.
      </p>
    );
  }
  return (
    <div className="flex items-center gap-1.5 sm:gap-5">
      <CountdownBox value={days} label="Days" />
      <span className="text-gold/50 text-lg sm:text-2xl">:</span>
      <CountdownBox value={hours} label="Hours" />
      <span className="text-gold/50 text-lg sm:text-2xl">:</span>
      <CountdownBox value={minutes} label="Minutes" />
      <span className="text-gold/50 text-lg sm:text-2xl">:</span>
      <CountdownBox value={seconds} label="Seconds" />
    </div>
  );
}

function RsvpForm() {
  const [status, setStatus] = useState<RsvpStatus>("idle");
  const [name, setName] = useState("");
  const [attending, setAttending] = useState<"Yes" | "No" | "">("");
  const [message, setMessage] = useState("");

  const configured = Boolean(
    rsvp.formActionUrl &&
      rsvp.fields.name &&
      rsvp.fields.attending &&
      rsvp.fields.message,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!attending) return;
    if (!configured) {
      setStatus("error");
      return;
    }
    setStatus("sending");
    try {
      const body = new FormData();
      body.append(rsvp.fields.name, name);
      body.append(rsvp.fields.attending, attending);
      body.append(rsvp.fields.message, message);
      await fetch(rsvp.formActionUrl, {
        method: "POST",
        mode: "no-cors",
        body,
      });
      setStatus("sent");
      setName("");
      setAttending("");
      setMessage("");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="text-center py-6">
        <p className="text-2xl gold-gradient-text font-light">Thank you</p>
        <p className="text-cream/80 mt-2">
          Your response has been received. We can&apos;t wait to see you.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs tracking-[0.25em] uppercase text-gold/80 mb-1">
          Your name
        </label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="field-input"
          placeholder="Full name"
        />
      </div>

      <div>
        <label className="block text-xs tracking-[0.25em] uppercase text-gold/80 mb-2">
          Will you attend?
        </label>
        <div className="flex gap-3">
          {(["Yes", "No"] as const).map((v) => (
            <button
              type="button"
              key={v}
              onClick={() => setAttending(v)}
              className={`flex-1 py-3 rounded-md border transition ${
                attending === v
                  ? "border-gold bg-gold/15 text-gold-bright"
                  : "border-gold/25 text-cream/80 hover:border-gold/50"
              }`}
              aria-pressed={attending === v}
            >
              {v === "Yes" ? "Joyfully accept" : "Regretfully decline"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs tracking-[0.25em] uppercase text-gold/80 mb-1">
          A message for the couple (optional)
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="field-input min-h-[90px] resize-y"
          placeholder="Your wishes & blessings"
        />
      </div>

      <button
        type="submit"
        disabled={status === "sending" || !attending}
        className="btn-gold w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "sending" ? "Sending…" : "Send RSVP"}
      </button>

      {status === "error" && (
        <p className="text-sm text-red-300/90 text-center">
          {configured
            ? "Something went wrong. Please try again."
            : "RSVP form is not yet configured. See README for setup steps."}
        </p>
      )}
    </form>
  );
}

function MapBlock() {
  const embed = `https://maps.google.com/maps?q=${encodeURIComponent(
    event.mapEmbedQuery,
  )}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  return (
    <div className="space-y-4">
      <div className="aspect-video w-full overflow-hidden rounded-lg border border-gold/30 shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
        <iframe
          title={`${event.venueName} map`}
          src={embed}
          className="w-full h-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <div className="text-center">
        <a
          href={event.mapShortUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Open in Google Maps
        </a>
      </div>
    </div>
  );
}

export default function Invite({
  downloadSlug,
  inviteeName,
}: {
  downloadSlug?: string;
  inviteeName?: string;
} = {}) {
  const [open, setOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => setRevealed(true), 1400);
    return () => clearTimeout(t);
  }, [open]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden stage-bg">
      <div className="starfield absolute inset-0" aria-hidden />

      {/* Stage: closed envelope */}
      <div
        className={`fixed inset-0 z-20 flex flex-col items-center justify-center px-4 transition-opacity duration-700 ${
          revealed ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <CornerOrnament pos="tl" />
        <CornerOrnament pos="tr" />
        <CornerOrnament pos="bl" />
        <CornerOrnament pos="br" />

        <Particles count={22} />
        <Sparkles />
        <div className="aura" aria-hidden />

        <div className="relative z-10 flex flex-col items-center">
          <AnimatedText
            text={`${event.groom} & ${event.bride}`}
            className="gold-gradient-text mb-2 sm:mb-3 py-1"
            baseDelay={200}
            step={60}
            style={{
              fontFamily: "var(--font-script)",
              fontSize: "clamp(1.5rem, 7vw, 2.5rem)",
              lineHeight: 1.2,
            }}
          />

          <div
            className="gold-rule mb-4 sm:mb-6"
            style={{ opacity: 0, animation: "letterIn 0.8s ease-out 1.2s forwards" }}
            aria-hidden
          >
            <span className="text-[9px] sm:text-[10px] tracking-[0.4em] sm:tracking-[0.45em] uppercase">
              An Invitation
            </span>
          </div>

          <button
            type="button"
            aria-label="Open invitation"
            onClick={() => setOpen(true)}
            className="envelope-entrance cursor-pointer"
            style={{ animationDelay: "600ms", touchAction: "manipulation" }}
          >
            <div className="envelope-float">
              <div
                className={`envelope relative w-[240px] h-[172px] sm:w-[380px] sm:h-[270px] ${
                  open ? "is-open" : ""
                }`}
              >
                <div className="envelope-body absolute inset-0 rounded-md" />
                <div className="envelope-card">
                  <span
                    className="gold-gradient-text text-3xl sm:text-5xl py-1"
                    style={{ fontFamily: "var(--font-script)", lineHeight: 1.2 }}
                  >
                    R &amp; W
                  </span>
                </div>
                <div className="envelope-flap rounded-t-md" />
                <div className="envelope-seal">R&amp;W</div>
              </div>
            </div>
          </button>

          {!open && (
            <p
              className="mt-8 sm:mt-12 text-cream/70 text-[11px] sm:text-sm tracking-[0.35em] sm:tracking-[0.4em] uppercase pulse-hint"
              style={{ animation: "letterIn 1s ease-out 1.8s both, softPulse 2.4s ease-in-out 2.8s infinite" }}
            >
              Tap to open ↓
            </p>
          )}
        </div>
      </div>

      {/* Revealed invitation */}
      <main
        className={`relative z-10 max-w-2xl mx-auto px-5 sm:px-8 py-16 sm:py-24 transition-all duration-1000 ${
          revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
        aria-hidden={!revealed}
      >
        <section className="text-center">
          <p className="text-xs sm:text-sm tracking-[0.35em] uppercase text-cream/70">
            You are warmly invited to the
          </p>
          <p
            className="gold-gradient-text mt-2 py-1"
            style={{
              fontFamily: "var(--font-script)",
              fontSize: "clamp(2.25rem, 7vw, 3.75rem)",
              lineHeight: 1.2,
              letterSpacing: "0.01em",
            }}
          >
            Engagement Ceremony
          </p>
          <div className="ornament my-6" aria-hidden>
            <span className="text-gold/80">❦</span>
          </div>
          <p className="text-cream/70 text-sm tracking-[0.15em] italic mb-1">
            {event.groomParents}
          </p>
          <h1
            className="gold-gradient-text py-2"
            style={{
              fontFamily: "var(--font-script)",
              fontSize: "clamp(2.75rem, 9vw, 5rem)",
              lineHeight: 1.15,
            }}
          >
            {event.groom}
          </h1>
          <p
            className="gold-gradient-text my-3"
            style={{
              fontFamily: "var(--font-script)",
              fontSize: "1.75rem",
              lineHeight: 1.2,
            }}
          >
            &amp;
          </p>
          <p className="text-cream/70 text-sm tracking-[0.15em] italic mb-1">
            {event.brideParents}
          </p>
          <h1
            className="gold-gradient-text py-2"
            style={{
              fontFamily: "var(--font-script)",
              fontSize: "clamp(2.75rem, 9vw, 5rem)",
              lineHeight: 1.15,
            }}
          >
            {event.bride}
          </h1>
          <p className="mt-8 text-cream/85 italic text-lg max-w-md mx-auto leading-relaxed">
            “{event.quote}”
          </p>
        </section>

        <div className="ornament my-12" aria-hidden>
          <span className="text-gold/80">✦</span>
        </div>

        <section className="text-center">
          <p className="text-xs tracking-[0.35em] uppercase text-gold/80 mb-3">
            Save the Date
          </p>
          <p className="text-3xl sm:text-4xl text-cream font-light">
            {event.dateDisplay}
          </p>
          <p className="text-lg text-cream/80 mt-1">{event.timeDisplay}</p>

          <div className="mt-8 flex justify-center">
            <Countdown />
          </div>
        </section>

        <div className="ornament my-12" aria-hidden>
          <span className="text-gold/80">✦</span>
        </div>

        <section>
          <p className="text-xs tracking-[0.35em] uppercase text-gold/80 text-center mb-3">
            Celebration at
          </p>
          <p
            className="text-center text-2xl sm:text-3xl gold-gradient-text mb-1 py-1"
            style={{ fontFamily: "var(--font-script)", lineHeight: 1.3 }}
          >
            {event.venueName}
          </p>
          <p className="text-center text-cream/70 text-sm tracking-[0.2em] uppercase mb-6">
            {event.venueSubtitle}
          </p>
          <MapBlock />
        </section>

        <div className="ornament my-12" aria-hidden>
          <span className="text-gold/80">✦</span>
        </div>

        <section>
          <p className="text-xs tracking-[0.35em] uppercase text-gold/80 text-center mb-3">
            Kindly RSVP
          </p>
          <p
            className="text-center text-2xl gold-gradient-text mb-6 py-1"
            style={{ fontFamily: "var(--font-script)", lineHeight: 1.3 }}
          >
            We&apos;d love to hear from you
          </p>
          <RsvpForm />
        </section>

        <footer className="mt-16 text-center">
          <div className="ornament mb-4" aria-hidden>
            <span className="text-gold/60">❦</span>
          </div>
          <p
            className="gold-gradient-text py-1"
            style={{
              fontFamily: "var(--font-script)",
              fontSize: "1.6rem",
              lineHeight: 1.3,
            }}
          >
            With love, {event.groom} &amp; {event.bride}
          </p>
          <p className="mt-6 text-[10px] sm:text-xs tracking-[0.2em] text-cream/55">
            {event.contactLabel}{" "}
            <a
              href={`tel:${event.contactPhone.replace(/[^0-9+]/g, "")}`}
              className="text-gold/80 hover:text-gold-bright underline-offset-2 hover:underline"
            >
              {event.contactPhone}
            </a>
          </p>
        </footer>
      </main>

      {downloadSlug && revealed && (
        <a
          href={`/api/i/${downloadSlug}/download`}
          className="download-fab"
          aria-label={
            inviteeName
              ? `Download invitation for ${inviteeName}`
              : "Download invitation"
          }
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>Download PDF</span>
        </a>
      )}
    </div>
  );
}
