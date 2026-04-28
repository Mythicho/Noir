import { useState } from "react";
import { authApi, type ApiUser } from "../backend/api";

type AuthResult = { user: ApiUser; token: string } | { error: string };

function isError(r: AuthResult): r is { error: string } {
  return "error" in r;
}

export default function AuthPage({
  onAuth,
}: {
  onAuth: (user: ApiUser) => void;
}) {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErr("");
    setLoading(true);
    
    try {
      let result: AuthResult;
      if (tab === "signup") {
        if (!name.trim()) {
          setErr("Name is required.");
          setLoading(false);
          return;
        }
        if (password.length < 4) {
          setErr("Password must be at least 4 characters.");
          setLoading(false);
          return;
        }
        if (password !== confirm) {
          setErr("Passwords do not match.");
          setLoading(false);
          return;
        }
        const res = await authApi.signup({
          name,
          email,
          password,
          phone,
        });
        result = { user: res.user, token: res.token };
      } else {
        if (!email || !password) {
          setErr("Enter your email and password.");
          setLoading(false);
          return;
        }
        const res = await authApi.login(email, password);
        result = { user: res.user, token: res.token };
      }
      
      if (isError(result)) {
        setErr(result.error);
        setLoading(false);
        return;
      }
      onAuth(result.user);
      setLoading(false);
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 noise relative">
      {/* decorative orbs */}
      <div
        className="orb"
        style={{
          width: 500,
          height: 500,
          background:
            "radial-gradient(circle at 30% 30%, #ffffff 0%, #888888 25%, transparent 65%)",
          top: "-20%",
          left: "-15%",
        }}
      />
      <div
        className="orb"
        style={{
          width: 400,
          height: 400,
          background:
            "radial-gradient(circle at 50% 50%, #555555 0%, #111111 40%, transparent 70%)",
          bottom: "-15%",
          right: "-10%",
        }}
      />

      <div className="relative z-10 w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="font-display text-6xl tracking-[0.15em]">NOIR</div>
          <p className="text-white/50 text-sm mt-2">
            Luxury imported snacks · India
          </p>
        </div>

        <div className="liquid-glass-strong glass-edge rounded-[36px] p-8 md:p-10">
          {/* tabs */}
          <div className="liquid-glass glass-edge rounded-full p-1 flex mb-8">
            {(["login", "signup"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setErr("");
                }}
                className={`flex-1 py-2.5 text-xs tracking-[0.25em] uppercase rounded-full transition-colors ${
                  tab === t
                    ? "bg-white text-black font-medium"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {t === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {tab === "signup" && (
              <Field
                label="Full name"
                value={name}
                onChange={setName}
                placeholder="Aarav Mehta"
              />
            )}
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@email.com"
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder={tab === "signup" ? "At least 4 characters" : "Your password"}
            />
            {tab === "signup" && (
              <>
                <Field
                  label="Confirm password"
                  type="password"
                  value={confirm}
                  onChange={setConfirm}
                  placeholder="Re-enter password"
                />
                <Field
                  label="Phone number"
                  type="tel"
                  value={phone}
                  onChange={setPhone}
                  placeholder="+91 98765 43210"
                />
              </>
            )}

            {err && (
              <div className="liquid-glass glass-edge rounded-2xl px-4 py-3 text-sm text-red-200/90 border border-red-400/20">
                {err}
              </div>
            )}

            <button
              onClick={submit}
              disabled={loading}
              className="w-full bg-white text-black rounded-full py-3.5 font-medium disabled:opacity-50"
            >
              {loading
                ? "..."
                : tab === "login"
                ? "Sign In"
                : "Create Account"}
            </button>
          </div>

          {tab === "login" && (
            <p className="text-center text-xs text-white/45 mt-6">
              Demo account: <span className="text-white/70">aarav@example.com</span> /{" "}
              <span className="text-white/70">aarav123</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] tracking-[0.3em] uppercase text-white/50">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full liquid-glass glass-edge rounded-2xl px-4 py-3 bg-transparent outline-none placeholder:text-white/30"
      />
    </label>
  );
}
