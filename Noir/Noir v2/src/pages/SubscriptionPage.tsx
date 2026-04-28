import { useEffect, useState } from "react";
import {
  subscriptionsApi,
  COUNTRY_OPTIONS,
  FREQUENCY_OPTIONS,
  MIN_SUB_PRICE,
  type Subscription,
  type SubscriptionPlan,
  type User,
} from "../backend/db";
import Reveal from "../components/Reveal";
import Magnetic from "../components/Magnetic";

const fmt = (n: number) => `Rs. ${n.toLocaleString("en-IN")}`;

function daysUntil(dateStr: string) {
  const diff = +new Date(dateStr) - +new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function frequencyLabel(f: number) {
  if (f === 1) return "1 box / month";
  return `${f} boxes / month`;
}

function planLabel(plan: SubscriptionPlan, budget: number) {
  if (plan === "yearly") {
    const yearly = Math.round(budget * 0.9) * 12;
    return `Yearly · ${fmt(yearly)}/yr`;
  }
  return `Monthly · ${fmt(budget)}/mo`;
}

/* ─────────────────────── PLAN EXPLAINER ─────────────────────── */
function PlanExplainer() {
  return (
    <Reveal>
      <section className="max-w-5xl mx-auto px-6 mb-20">
        <div className="text-[10px] tracking-[0.4em] uppercase text-white/50 mb-4">
          — How it works
        </div>
        <h2 className="font-display text-5xl md:text-7xl leading-[0.95]">
          Your personal{" "}
          <span className="italic font-light">snack discovery</span> box.
        </h2>
        <p className="mt-6 text-white/70 max-w-2xl text-lg leading-relaxed">
          Every month (or more) a curated surprise box lands at your doorstep —
          packed with imported snacks from the countries you choose. KitKat from
          Japan, buldak from Korea, Takis from the US and more. You set the
          budget, you pick the countries, we handle the sourcing and delivery.
        </p>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "Pick your countries",
              desc: "Choose from 10 origin countries. Each box is curated from your selections.",
            },
            {
              step: "02",
              title: "Set your budget",
              desc: "Start from ₹499. Higher budget = more premium products and bigger portions.",
            },
            {
              step: "03",
              title: "Choose your plan",
              desc: "Monthly or yearly (save 10%). Adjust frequency from 1 to 3 boxes per month.",
            },
          ].map((s) => (
            <div key={s.step} className="liquid-glass glass-edge rounded-3xl p-7">
              <div className="font-display text-5xl text-white/20">{s.step}</div>
              <div className="font-display text-2xl mt-3">{s.title}</div>
              <p className="text-sm text-white/60 mt-2 leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </Reveal>
  );
}

/* ─────────────────────── SUBSCRIBE FORM ─────────────────────── */
function SubscribeForm({ user, onSubscribed }: { user: User | null; onSubscribed: () => void }) {
  const [budget, setBudget] = useState(1200);
  const [plan, setPlan] = useState<SubscriptionPlan>("monthly");
  const [frequency, setFrequency] = useState(1);
  const [countries, setCountries] = useState<string[]>(["Japan", "South Korea"]);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");

  const toggleCountry = (c: string) => {
    setCountries((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const yearlyMonthly = Math.round(budget * 0.9);

  const subscribe = () => {
    if (!user) {
      setStatus("Please sign in to subscribe.");
      return;
    }
    if (budget < MIN_SUB_PRICE) {
      setStatus(`Minimum budget is ${fmt(MIN_SUB_PRICE)}.`);
      return;
    }
    if (countries.length === 0) {
      setStatus("Select at least one country.");
      return;
    }
    subscriptionsApi.create({
      email: user.email,
      customerName: user.name,
      budget,
      plan,
      frequency,
      countries,
      notes,
    });
    onSubscribed();
    setStatus(
      `Subscribed! Your first box is on its way. Plan: ${planLabel(plan, budget)}.`
    );
  };

  return (
    <Reveal delay={100}>
      <section className="max-w-5xl mx-auto px-6 mb-20">
        <div className="text-[10px] tracking-[0.4em] uppercase text-white/50 mb-4">
          — Build your box
        </div>
        <div className="grid lg:grid-cols-[1fr_420px] gap-8">
          {/* Left: configure */}
          <div className="space-y-6">
            {/* Countries */}
            <div className="liquid-glass glass-edge rounded-3xl p-6">
              <div className="text-[10px] tracking-[0.3em] uppercase text-white/50 mb-4">
                Countries
              </div>
              <div className="flex flex-wrap gap-2">
                {COUNTRY_OPTIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => toggleCountry(c)}
                    className={`rounded-full px-4 py-2 text-sm transition-colors ${
                      countries.includes(c)
                        ? "bg-white text-black"
                        : "liquid-glass glass-edge text-white/70 hover:text-white"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget slider */}
            <div className="liquid-glass glass-edge rounded-3xl p-6">
              <div className="text-[10px] tracking-[0.3em] uppercase text-white/50 mb-4">
                Monthly budget
              </div>
              <div className="font-display text-5xl mb-4">{fmt(budget)}</div>
              <input
                type="range"
                min={499}
                max={9999}
                step={100}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full accent-white"
              />
              <div className="flex justify-between text-xs text-white/40 mt-1">
                <span>₹499</span>
                <span>₹9,999</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[999, 1499, 2499].map((v) => (
                  <button
                    key={v}
                    onClick={() => setBudget(v)}
                    className={`rounded-2xl py-2 text-sm transition-colors ${
                      budget === v
                        ? "bg-white text-black"
                        : "liquid-glass glass-edge text-white/70"
                    }`}
                  >
                    {fmt(v)}
                  </button>
                ))}
              </div>
            </div>

            {/* Frequency */}
            <div className="liquid-glass glass-edge rounded-3xl p-6">
              <div className="text-[10px] tracking-[0.3em] uppercase text-white/50 mb-4">
                Frequency
              </div>
              <div className="flex gap-3">
                {FREQUENCY_OPTIONS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFrequency(f)}
                    className={`flex-1 rounded-2xl py-3 text-sm transition-colors ${
                      frequency === f
                        ? "bg-white text-black"
                        : "liquid-glass glass-edge text-white/70"
                    }`}
                  >
                    {frequencyLabel(f)}
                  </button>
                ))}
              </div>
            </div>

            {/* Plan */}
            <div className="liquid-glass glass-edge rounded-3xl p-6">
              <div className="text-[10px] tracking-[0.3em] uppercase text-white/50 mb-4">
                Plan
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPlan("monthly")}
                  className={`rounded-2xl p-5 text-left transition-colors ${
                    plan === "monthly"
                      ? "bg-white text-black"
                      : "liquid-glass glass-edge text-white/70"
                  }`}
                >
                  <div className="font-display text-2xl">Monthly</div>
                  <div className="text-sm mt-1">{fmt(budget)}/month</div>
                  <div
                    className={`text-xs mt-2 ${
                      plan === "monthly" ? "text-black/50" : "text-white/40"
                    }`}
                  >
                    Billed every month
                  </div>
                </button>
                <button
                  onClick={() => setPlan("yearly")}
                  className={`relative rounded-2xl p-5 text-left transition-colors ${
                    plan === "yearly"
                      ? "bg-white text-black"
                      : "liquid-glass glass-edge text-white/70"
                  }`}
                >
                  <div
                    className={`absolute top-3 right-3 text-[10px] tracking-wider uppercase font-medium px-2 py-0.5 rounded-full ${
                      plan === "yearly" ? "bg-black text-white" : "bg-white text-black"
                    }`}
                  >
                    Save 10%
                  </div>
                  <div className="font-display text-2xl">Yearly</div>
                  <div className="text-sm mt-1">{fmt(yearlyMonthly)}/month</div>
                  <div
                    className={`text-xs mt-2 ${
                      plan === "yearly" ? "text-black/50" : "text-white/40"
                    }`}
                  >
                    {fmt(yearlyMonthly * 12)}/yr · billed yearly
                  </div>
                </button>
              </div>
            </div>

            {/* Notes */}
            <div className="liquid-glass glass-edge rounded-3xl p-6">
              <div className="text-[10px] tracking-[0.3em] uppercase text-white/50 mb-4">
                Allergies / preferences (optional)
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. No pork, no shellfish, love spicy snacks, avoid caffeine..."
                className="w-full min-h-24 liquid-glass glass-edge rounded-2xl px-4 py-3 bg-transparent outline-none placeholder:text-white/30"
              />
            </div>
          </div>

          {/* Right: summary + subscribe */}
          <aside className="liquid-glass-strong glass-edge rounded-[32px] p-7 h-max sticky top-28">
            <div className="font-display text-3xl mb-6">Your Subscription</div>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between text-white/70">
                <span>Plan</span>
                <span>{plan === "monthly" ? "Monthly" : "Yearly (10% off)"}</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Budget</span>
                <span>{fmt(budget)}/month</span>
              </div>
              {plan === "yearly" && (
                <div className="flex justify-between text-white/70">
                  <span>Effective monthly</span>
                  <span>{fmt(yearlyMonthly)}</span>
                </div>
              )}
              <div className="flex justify-between text-white/70">
                <span>Frequency</span>
                <span>{frequencyLabel(frequency)}</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Countries</span>
                <span>{countries.length ? countries.join(", ") : "None selected"}</span>
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex justify-between text-xl">
                <span>Total</span>
                <span>
                  {plan === "yearly"
                    ? `${fmt(yearlyMonthly * 12)}/yr`
                    : `${fmt(budget)}/mo`}
                </span>
              </div>
              {plan === "yearly" && (
                <div className="text-xs text-green-300/70 text-right">
                  You save {fmt((budget - yearlyMonthly) * 12)} per year
                </div>
              )}
            </div>
            <Magnetic strength={0.35} className="mt-8">
              <button
                onClick={subscribe}
                className="w-full bg-white text-black rounded-full py-3.5 font-medium"
              >
                {user ? "Subscribe Now" : "Sign in to Subscribe"}
              </button>
            </Magnetic>
            {status && (
              <div className="mt-4 liquid-glass glass-edge rounded-2xl p-4 text-sm text-white/75">
                {status}
              </div>
            )}
          </aside>
        </div>
      </section>
    </Reveal>
  );
}

/* ─────────────────────── MY SUBS ─────────────────────── */
function MySubscriptions({ user }: { user: User | null }) {
  const [subs, setSubs] = useState<Subscription[]>(
    user ? subscriptionsApi.byEmail(user.email) : []
  );

  useEffect(() => {
    if (user) setSubs(subs);
  }, [user]);

  if (!user) return null;

  const updateFreq = (id: string, freq: number) => {
    subscriptionsApi.updateFrequency(id, freq);
    setSubs(subscriptionsApi.byEmail(user.email));
  };

  const cancelSub = (id: string) => {
    subscriptionsApi.updateStatus(id, "cancelled");
    setSubs(subscriptionsApi.byEmail(user.email));
  };

  if (subs.length === 0) return null;

  return (
    <Reveal>
      <section className="max-w-5xl mx-auto px-6 mb-20">
        <div className="text-[10px] tracking-[0.4em] uppercase text-white/50 mb-6">
          — Your active subscriptions
        </div>
        <div className="space-y-4">
          {subs.map((s) => (
            <div
              key={s.id}
              className={`liquid-glass glass-edge rounded-3xl p-6 ${
                s.status === "cancelled" ? "opacity-50" : ""
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="font-mono text-xs text-white/50">{s.id}</div>
                  <div className="font-display text-2xl mt-1">
                    {s.countries.join(" · ")} Surprise Box
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-2xl">
                    {planLabel(s.plan, s.budget)}
                  </div>
                  <div className="text-xs text-white/50">
                    {s.boxesDelivered} boxes delivered
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                <div>
                  <div className="text-[10px] tracking-[0.3em] uppercase text-white/50">
                    Status
                  </div>
                  <span
                    className={`text-xs tracking-wider uppercase ${
                      s.status === "active"
                        ? "text-green-300"
                        : s.status === "paused"
                        ? "text-yellow-300"
                        : "text-red-300"
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
                <div>
                  <div className="text-[10px] tracking-[0.3em] uppercase text-white/50">
                    Started
                  </div>
                  <div>{new Date(s.startedAt).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-[10px] tracking-[0.3em] uppercase text-white/50">
                    Next box in
                  </div>
                  <div>{daysUntil(s.nextDelivery)} days</div>
                </div>
                <div>
                  <div className="text-[10px] tracking-[0.3em] uppercase text-white/50">
                    Countries
                  </div>
                  <div className="truncate">{s.countries.join(", ")}</div>
                </div>
              </div>

              {/* Frequency controls */}
              {s.status !== "cancelled" && (
                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/10">
                  <span className="text-[10px] tracking-[0.3em] uppercase text-white/50">
                    Frequency
                  </span>
                  {FREQUENCY_OPTIONS.map((f) => (
                    <button
                      key={f}
                      onClick={() => updateFreq(s.id, f)}
                      className={`rounded-full px-4 py-1.5 text-xs transition-colors ${
                        s.frequency === f
                          ? "bg-white text-black"
                          : "liquid-glass glass-edge text-white/60"
                      }`}
                    >
                      {frequencyLabel(f)}
                    </button>
                  ))}
                  <button
                    onClick={() => cancelSub(s.id)}
                    className="ml-auto liquid-glass glass-edge rounded-full px-4 py-1.5 text-xs text-red-300/80 hover:text-red-300"
                  >
                    Cancel subscription
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </Reveal>
  );
}

/* ─────────────────────── FAQ ─────────────────────── */
function FAQ() {
  const faqs = [
    {
      q: "What's in a surprise box?",
      a: "Every box is hand-curated from the countries you select. We rotate products each delivery so you never repeat a snack.",
    },
    {
      q: "Can I change my plan later?",
      a: "Yes. You can switch between monthly and yearly, adjust your budget, or update your countries at any time.",
    },
    {
      q: "How does yearly billing work?",
      a: "You pay the full year upfront at a 10% discount on the monthly rate. For example, a ₹1,200/month plan costs ₹1,080/month × 12 = ₹12,960/year.",
    },
    {
      q: "What if I have allergies?",
      a: "Add your allergies or dietary preferences in the notes field. We do our best to accommodate, but always check the label when you receive the box.",
    },
  ];
  return (
    <Reveal>
      <section className="max-w-5xl mx-auto px-6 pb-32">
        <div className="text-[10px] tracking-[0.4em] uppercase text-white/50 mb-6">
          — FAQ
        </div>
        <div className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="liquid-glass glass-edge rounded-2xl p-6">
              <div className="font-display text-xl">{f.q}</div>
              <p className="text-sm text-white/60 mt-2">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </Reveal>
  );
}

/* ─────────────────────── MAIN PAGE ─────────────────────── */
export default function SubscriptionPage({
  user,
  onNavigate,
}: {
  user: User | null;
  onNavigate: (page: string, section?: string) => void;
}) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <main className="min-h-screen noise">
      {/* Hero */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "80px 80px",
            maskImage:
              "radial-gradient(ellipse at center, #000 30%, transparent 75%)",
          }}
        />
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 liquid-glass glass-edge rounded-full px-4 py-1.5 text-xs tracking-[0.3em] uppercase mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            New
          </div>
          <h1 className="font-display text-[clamp(3rem,10vw,9rem)] leading-[0.9] tracking-tight">
            The NOIR<br />
            <span className="italic font-light">Surprise Box</span>
          </h1>
          <p className="mt-8 max-w-2xl mx-auto text-white/70 text-lg leading-relaxed">
            A curated monthly box of imported snacks from the countries you
            love. Japan, Korea, USA, Mexico and more — delivered to your door
            with zero effort. Choose your budget, pick your countries, subscribe
            once and forget.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Magnetic strength={0.4}>
              <a
                href="#build"
                className="group inline-flex items-center gap-3 bg-white text-black rounded-full pl-7 pr-2 py-2 font-medium"
              >
                Build Your Box
                <span className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center transition-transform group-hover:rotate-45">
                  →
                </span>
              </a>
            </Magnetic>
            {user && (
              <Magnetic strength={0.3}>
                <button
                  onClick={() => onNavigate("cart", "orders")}
                  className="liquid-glass glass-edge rounded-full px-7 py-3.5 text-sm"
                >
                  View My Subscriptions
                </button>
              </Magnetic>
            )}
          </div>
        </div>
      </section>

      <PlanExplainer />

      <div id="build">
        <SubscribeForm
          user={user}
          onSubscribed={() => setRefreshKey((k) => k + 1)}
        />
      </div>

      <div key={refreshKey}>
        <MySubscriptions user={user} />
      </div>

      <FAQ />
    </main>
  );
}
