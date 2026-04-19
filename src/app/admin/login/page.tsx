import { redirect } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isLoggedIn()) redirect("/admin");
  return (
    <div className="min-h-screen flex items-center justify-center stage-bg px-4">
      <div className="w-full max-w-sm p-8 rounded-xl border border-gold/30 bg-navy/80 backdrop-blur">
        <h1
          className="gold-gradient-text text-center mb-6 py-1"
          style={{
            fontFamily: "var(--font-script)",
            fontSize: "2.25rem",
            lineHeight: 1.2,
          }}
        >
          Admin
        </h1>
        <LoginForm />
      </div>
    </div>
  );
}
