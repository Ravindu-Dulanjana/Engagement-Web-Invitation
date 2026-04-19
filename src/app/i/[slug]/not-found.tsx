export default function NotFound() {
  return (
    <div className="min-h-screen stage-bg flex items-center justify-center px-4">
      <div className="text-center">
        <p
          className="gold-gradient-text py-1 mb-2"
          style={{
            fontFamily: "var(--font-script)",
            fontSize: "2.5rem",
            lineHeight: 1.2,
          }}
        >
          Invitation not found
        </p>
        <p className="text-cream/70 text-sm">
          The link you used may be incorrect or has been removed.
        </p>
      </div>
    </div>
  );
}
