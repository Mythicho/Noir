import { useEffect, useRef, useState, type ReactNode } from "react";
import CustomCursor from "./components/CustomCursor";
import GlassFilter from "./components/GlassFilter";
import Magnetic from "./components/Magnetic";
import Reveal from "./components/Reveal";
import { type Product } from "./data/products";
import {
  ordersApi,
  productsApi,
  sessionApi,
  FREQUENCY_OPTIONS,
  type CustomerProfile,
  type OrderItem,
  type Subscription,
  type User,
  subscriptionsApi,
  seedDemoData,
} from "./backend/db";
import { authApi, type ApiUser } from "./backend/api";
import AuthPage from "./pages/AuthPage";
import AdminPage from "./pages/AdminPage";
import { OrderProgressBar } from "./pages/AdminPage";
import SubscriptionPage from "./pages/SubscriptionPage";

type Page = "home" | "cart" | "profile" | "product" | "subscription";

const emptyProfile: CustomerProfile = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  pin: "",
  notes: "",
  photo: "",
};

const formatRupees = (price: number) => `Rs. ${price.toLocaleString("en-IN")}`;

/* ═══════════════ SMOOTH SCROLL ═══════════════ */
function SmoothScroll({ children, pageKey }: { children: ReactNode; pageKey: string }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.classList.add("is-smooth");
    return () => document.body.classList.remove("is-smooth");
  }, []);

  useEffect(() => {
    let current = 0;
    let target = 0;
    let raf = 0;
    let ro: ResizeObserver | undefined;
    const measure = () => {
      const content = contentRef.current;
      const spacer = spacerRef.current;
      if (!content || !spacer) return;
      spacer.style.height = `${content.scrollHeight}px`;
    };
    const loop = () => {
      const content = contentRef.current;
      target = window.scrollY;
      current += (target - current) * 0.085;
      if (Math.abs(target - current) < 0.08) current = target;
      if (content) content.style.transform = `translate3d(0, ${-current}px, 0)`;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, current / max));
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`;
      if (readoutRef.current) readoutRef.current.textContent = `${Math.round(progress * 100)}% kinetic scroll`;
      raf = requestAnimationFrame(loop);
    };
    const onAnchorClick = (event: MouseEvent) => {
      const targetEl = event.target as HTMLElement;
      const link = targetEl.closest("a[href^='#']") as HTMLAnchorElement | null;
      if (!link) return;
      const id = link.getAttribute("href")?.slice(1);
      if (!id || id.startsWith("/")) return;
      const section = document.getElementById(id);
      if (!section) return;
      event.preventDefault();
      window.scrollTo({ top: section.offsetTop, behavior: "smooth" });
    };
    window.scrollTo(0, 0);
    current = 0;
    target = 0;
    measure();
    setTimeout(measure, 80);
    if (contentRef.current) {
      ro = new ResizeObserver(measure);
      ro.observe(contentRef.current);
    }
    document.addEventListener("click", onAnchorClick);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      document.removeEventListener("click", onAnchorClick);
    };
  }, [pageKey]);

  return (
    <>
      <div ref={progressRef} className="scroll-progress" />
      <div ref={readoutRef} className="kinetic-readout hidden lg:block" />
      <div ref={contentRef} className="smooth-content">{children}</div>
      <div ref={spacerRef} aria-hidden />
    </>
  );
}

/* ═══════════════ NAV ═══════════════ */
function Nav({
  cartCount,
  user,
  onNavigate,
  onLogin,
  onLogout,
}: {
  cartCount: number;
  user: ApiUser | null;
  onNavigate: (page: Page, section?: string) => void;
  onLogin: () => void;
  onLogout: () => void;
}) {
  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[min(1200px,92vw)]">
      <div className="liquid-glass glass-edge rounded-full px-3 py-2 flex items-center justify-between">
        <button onClick={() => onNavigate("home", "top")} className="flex items-center gap-2 pl-3">
          <span className="w-2 h-2 rounded-full bg-white" />
          <span className="font-display text-xl tracking-[0.2em]">NOIR</span>
        </button>
        <nav className="hidden md:flex items-center gap-1 text-sm">
          {["Catalogue", "Origins", "Concierge", "Journal"].map((item) => (
            <Magnetic key={item} strength={0.25}>
              <button onClick={() => onNavigate("home", item.toLowerCase())} className="px-4 py-2 rounded-full hover:bg-white/10 transition-colors">
                {item}
              </button>
            </Magnetic>
          ))}
          <Magnetic strength={0.3}>
            <button onClick={() => onNavigate("subscription")} className="relative bg-white text-black rounded-full px-5 py-2 text-sm font-medium hover:bg-white/90 transition-colors overflow-hidden">
              <span className="relative z-10">✦ Subscribe</span>
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-white/0 via-white/50 to-white/0 animate-pulse" style={{ animationDuration: "3s" }} />
            </button>
          </Magnetic>
        </nav>
        <div className="flex items-center gap-2">
          {!user && (
            <Magnetic strength={0.3}>
              <button onClick={onLogin} className="liquid-glass glass-edge rounded-full px-5 py-2 text-sm">
                Login
              </button>
            </Magnetic>
          )}
          {user && (
            <>
              <Magnetic strength={0.25}>
                <button onClick={onLogout} className="liquid-glass glass-edge rounded-full px-4 py-2 text-xs hidden sm:inline-flex">
                  {user.name?.split(" ")[0] || "Account"} ↗
                </button>
              </Magnetic>
              <Magnetic strength={0.25}>
                <button onClick={() => onNavigate("profile")} className="hidden sm:inline-flex liquid-glass glass-edge rounded-full px-4 py-2 text-sm">
                  Profile
                </button>
              </Magnetic>
            </>
          )}
          {user?.isAdmin && (
            <Magnetic strength={0.3}>
              <a href="#/admin" className="liquid-glass glass-edge rounded-full px-4 py-2 text-sm font-medium border border-white/20">
                Admin
              </a>
            </Magnetic>
          )}
          <Magnetic strength={0.3}>
            <button onClick={() => onNavigate("cart")} className="liquid-glass-strong glass-edge rounded-full px-5 py-2 text-sm font-medium border border-white/20">
              Cart · {cartCount}
            </button>
          </Magnetic>
        </div>
      </div>
    </header>
  );
}

/* ═══════════════ HERO ═══════════════ */
function Hero({ onNavigate }: { onNavigate: (page: Page, section?: string) => void }) {
  const orb1 = useRef<HTMLDivElement>(null);
  const orb2 = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (orb1.current) orb1.current.style.transform = `translate3d(${-y * 0.1}px, ${y * 0.34}px, 0)`;
      if (orb2.current) orb2.current.style.transform = `translate3d(${y * 0.16}px, ${y * 0.22}px, 0)`;
      if (title.current) title.current.style.transform = `translate3d(0, ${y * 0.16}px, 0)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section id="top" className="relative min-h-[100svh] flex items-center justify-center overflow-hidden noise">
      <div ref={orb1} className="orb" style={{ width: 700, height: 700, background: "radial-gradient(circle at 30% 30%, #ffffff 0%, #aaaaaa 25%, transparent 65%)", top: "-10%", left: "-10%" }} />
      <div ref={orb2} className="orb" style={{ width: 600, height: 600, background: "radial-gradient(circle at 50% 50%, #6b6b6b 0%, #1a1a1a 40%, transparent 70%)", bottom: "-15%", right: "-10%" }} />
      <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "80px 80px", maskImage: "radial-gradient(ellipse at center, #000 30%, transparent 75%)" }} />
      <div className="relative z-10 text-center px-6 max-w-5xl">
        <div ref={title}>
          <h1 className="font-display text-[clamp(3rem,11vw,10rem)] leading-[0.9] tracking-tight">
            Imported.<br />
            <span className="italic font-light shimmer-text">Indulgent.</span><br />
            Iconic.
          </h1>
          <p className="mt-8 max-w-xl mx-auto text-white/70 text-lg">
            A curated vault of the world's rarest snacks — sourced from quiet ateliers in Kyoto, Piedmont, Salamanca and beyond. Delivered, untouched, to your door.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Magnetic strength={0.4}>
              <button onClick={() => onNavigate("home", "catalogue")} className="group inline-flex items-center gap-3 bg-white text-black rounded-full pl-7 pr-2 py-2 font-medium">
                Explore the Catalogue
                <span className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center transition-transform group-hover:rotate-45">→</span>
              </button>
            </Magnetic>
            <Magnetic strength={0.3}>
              <button onClick={() => onNavigate("home", "concierge")} className="liquid-glass glass-edge rounded-full px-7 py-3.5 text-sm">Speak with Concierge</button>
            </Magnetic>
          </div>
        </div>
      </div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.4em] uppercase text-white/40">scroll</div>
    </section>
  );
}

function Marquee() {
  const items = ["Matcha KitKat", "✦", "Buldak Ramen", "✦", "Takis Fuego", "✦", "Pocky", "✦", "Honey Butter Chips", "✦", "Ramune Soda", "✦", "Hot Cheetos", "✦", "Oreo Cakesters", "✦"];
  return (
    <div className="relative py-10 border-y border-white/10 overflow-hidden">
      <div className="flex marquee-track whitespace-nowrap will-change-transform">
        {[...items, ...items].map((t, i) => <span key={i} className="font-display text-4xl md:text-6xl px-8 text-white/80">{t}</span>)}
      </div>
    </div>
  );
}

function ScrollText() {
  const ref = useRef<HTMLElement>(null);
  const words = "Every scroll uncovers a new provenance, a different temperature, a sharper note of salt, smoke, citrus, cacao and ceremony.".split(" ");
  useEffect(() => {
    const update = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / (rect.height + window.innerHeight * 0.5)));
      el.querySelectorAll<HTMLElement>(".scroll-word").forEach((word, i, all) => {
        const local = Math.min(1, Math.max(0, (progress - (i / all.length) * 0.72) * 4.5));
        word.style.setProperty("--word-opacity", `${0.18 + local * 0.82}`);
        word.style.setProperty("--word-y", `${18 - local * 18}px`);
        word.style.setProperty("--word-blur", `${6 - local * 6}px`);
      });
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);
  return (
    <section ref={ref} className="relative py-40 px-6 border-b border-white/10">
      <div className="max-w-6xl mx-auto text-center">
        <div className="text-[10px] tracking-[0.4em] uppercase text-white/50 mb-8">— Scroll tasting</div>
        <p className="font-display text-5xl md:text-8xl leading-[1.05]">
          {words.map((word, i) => <span key={i} className="scroll-word mr-3 md:mr-5">{word}</span>)}
        </p>
      </div>
    </section>
  );
}

/* ═══════════════ PRODUCT CARD ═══════════════ */
function ProductCard({ p, onAdd, onDetails }: { p: Product; onAdd: (p: Product) => void; onDetails: (p: Product) => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const card = cardRef.current;
    if (!card) return;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `perspective(900px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg) translateY(-6px)`;
  };
  const onLeave = () => { if (cardRef.current) cardRef.current.style.transform = "perspective(900px) rotateX(0) rotateY(0) translateY(0)"; };
  return (
    <div ref={cardRef} onMouseMove={onMove} onMouseLeave={onLeave} className="glide group relative rounded-3xl overflow-hidden h-[420px] flex flex-col justify-between" style={{ background: "linear-gradient(180deg, #0a0a0a 0%, #050505 100%)", border: "1px solid rgba(255,255,255,0.08)", transition: "transform .5s cubic-bezier(.2,.8,.2,1)" }}>
      <div className="absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" style={{ background: "radial-gradient(400px circle at 50% 0%, rgba(255,255,255,0.18), transparent 60%)" }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <img src={p.image} alt={p.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-90 transition-all duration-700 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
      </div>
      <div className="relative p-6 flex justify-between items-start">
        <span className="text-[10px] tracking-[0.3em] uppercase text-white/50">{p.category}</span>
        <span className="text-[10px] tracking-[0.3em] uppercase text-white/50">{p.origin}</span>
      </div>
      <div className="relative p-6">
        <div className="liquid-glass glass-edge rounded-2xl p-5 -mx-2">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-display text-2xl leading-tight">{p.name}</h3>
            <span className="text-xl font-light shrink-0">{formatRupees(p.price)}</span>
          </div>
          <p className="text-sm text-white/60 mt-2 leading-relaxed">{p.blurb}</p>
          <div className="mt-4 flex items-center justify-between">
            <Magnetic strength={0.3}><button onClick={() => onAdd(p)} className="bg-white text-black text-xs font-medium tracking-wider uppercase rounded-full px-5 py-2.5 hover:bg-white/90">Add to Cart</button></Magnetic>
            <button onClick={() => onDetails(p)} className="text-xs tracking-[0.2em] uppercase text-white/60 hover:text-white">Details →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ CATALOGUE ═══════════════ */
function Catalogue({ onAdd, onDetails }: { onAdd: (p: Product) => void; onDetails: (p: Product) => void }) {
  const [filter, setFilter] = useState<string>("All");
  const all = productsApi.list().filter((p) => !p.outOfStock); // Hide out-of-stock from storefront
  const items = all.filter((p) => filter === "All" || p.category === filter);
  const filters: string[] = ["All", ...Array.from(new Set(all.map((p) => p.category)))];
  return (
    <section id="catalogue" className="relative py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <div className="text-[10px] tracking-[0.4em] uppercase text-white/50 mb-4">— The Vault</div>
              <h2 className="font-display text-6xl md:text-8xl leading-[0.9]">Curated <span className="italic font-light">obsessions.</span></h2>
            </div>
            <div className="liquid-glass glass-edge rounded-full p-1 inline-flex">
              {filters.map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`px-5 py-2 text-xs tracking-[0.2em] uppercase rounded-full transition-colors ${filter === f ? "bg-white text-black" : "text-white/70 hover:text-white"}`}>{f}</button>
              ))}
            </div>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((p, i) => <Reveal key={p.id} delay={i * 80}><ProductCard p={p} onAdd={onAdd} onDetails={onDetails} /></Reveal>)}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ ORIGINS ═══════════════ */
function Origins() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const progress = 1 - rect.top / window.innerHeight;
      ref.current.querySelectorAll<HTMLElement>("[data-paral]").forEach((c) => {
        const speed = parseFloat(c.dataset.paral || "0");
        c.style.transform = `translateY(${progress * speed}px)`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const origins = [
    { city: "Kyoto", country: "Japan", coord: "35.0°N · 135.7°E", note: "Matcha · Yuzu", x: "8%", y: "20%", speed: -80 },
    { city: "Piedmont", country: "Italy", coord: "44.7°N · 7.9°E", note: "Truffle · Hazelnut", x: "70%", y: "10%", speed: 60 },
    { city: "Salamanca", country: "Spain", coord: "40.9°N · 5.6°W", note: "Iberico · Bellota", x: "12%", y: "65%", speed: 100 },
    { city: "Isfahan", country: "Iran", coord: "32.6°N · 51.6°E", note: "Saffron · Almond", x: "60%", y: "70%", speed: -60 },
  ];
  return (
    <section id="origins" ref={ref} className="relative py-40 px-6 overflow-hidden noise">
      <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)", backgroundSize: "30px 30px", maskImage: "radial-gradient(ellipse at center, #000 20%, transparent 70%)" }} />
      <div className="max-w-7xl mx-auto relative">
        <Reveal><div className="text-center mb-20"><div className="text-[10px] tracking-[0.4em] uppercase text-white/50 mb-4">— Origins</div><h2 className="font-display text-6xl md:text-8xl leading-[0.9]">Sourced from <br /><span className="italic font-light">quiet corners</span> of the world.</h2></div></Reveal>
        <div className="relative h-[600px]">
          {origins.map((o) => (
            <div key={o.city} data-paral={o.speed} className="absolute" style={{ left: o.x, top: o.y, willChange: "transform" }}>
              <Magnetic strength={0.3}><div className="liquid-glass glass-edge rounded-2xl p-6 w-64">
                <div className="text-[10px] tracking-[0.3em] uppercase text-white/50">{o.coord}</div>
                <div className="font-display text-3xl mt-2">{o.city}</div>
                <div className="text-sm text-white/60">{o.country}</div>
                <div className="mt-4 pt-4 border-t border-white/10 text-xs tracking-wider uppercase text-white/70">{o.note}</div>
              </div></Magnetic>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Concierge() {
  return (
    <section id="concierge" className="relative py-32 px-6">
      <div className="max-w-5xl mx-auto">
        <Reveal><div className="liquid-glass-strong glass-edge rounded-[40px] p-12 md:p-20 text-center">
          <div className="text-[10px] tracking-[0.4em] uppercase text-white/50 mb-6">— Concierge</div>
          <h2 className="font-display text-5xl md:text-7xl leading-[0.95]">A private buyer for your <br /><span className="italic font-light">most discerning cravings.</span></h2>
          <p className="mt-8 text-white/70 max-w-xl mx-auto">Our concierge sources unlisted seasonal lots, custom hampers and priority delivery in major Indian metros. Tell us what you crave.</p>
          <form className="mt-10 max-w-lg mx-auto flex items-center gap-2 liquid-glass glass-edge rounded-full p-2">
            <input type="email" placeholder="your@email.com" className="flex-1 bg-transparent outline-none px-4 text-sm placeholder:text-white/40" />
            <Magnetic strength={0.35}><button type="button" className="bg-white text-black rounded-full px-6 py-2.5 text-sm font-medium">Request Access</button></Magnetic>
          </form>
        </div></Reveal>
      </div>
    </section>
  );
}

function Journal() {
  const posts = [
    { tag: "Tasting Notes", title: "On the volatile poetry of fresh truffle.", date: "Nov 2026" },
    { tag: "Field Report", title: "Three days inside an Uji matcha cellar.", date: "Oct 2026" },
    { tag: "Provenance", title: "Why bellota acorns matter a lot.", date: "Sep 2026" },
  ];
  return (
    <section id="journal" className="relative py-32 px-6 border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        <Reveal><div className="flex items-end justify-between mb-16"><h2 className="font-display text-5xl md:text-7xl leading-[0.95]">The <span className="italic font-light">Journal</span></h2></div></Reveal>
        <div className="grid md:grid-cols-3 gap-5">
          {posts.map((p, i) => (
            <Reveal key={p.title} delay={i * 100}>
              <Magnetic strength={0.1}><article className="glide liquid-glass glass-edge rounded-3xl p-8 h-72 flex flex-col justify-between cursor-none">
                <span className="text-[10px] tracking-[0.3em] uppercase text-white/50">{p.tag}</span>
                <div><h3 className="font-display text-2xl leading-snug">{p.title}</h3><div className="mt-4 text-xs text-white/50">{p.date}</div></div>
              </article></Magnetic>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative pt-32 pb-12 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-display text-[clamp(4rem,18vw,18rem)] leading-[0.85] tracking-tight">NOIR.</h2>
        <div className="mt-12 grid md:grid-cols-4 gap-10 border-t border-white/10 pt-12">
          {[["Shop", "Catalogue", "New Arrivals", "Hampers", "Gift Cards"], ["Company", "About", "Origins", "Press", "Careers"], ["Care", "Concierge", "Shipping", "Returns", "FAQ"]].map((col) => (
            <div key={col[0]}><div className="text-xs tracking-[0.3em] uppercase text-white/50 mb-4">{col[0]}</div><ul className="space-y-2 text-white/80">{col.slice(1).map((item) => <li key={item}>{item}</li>)}</ul></div>
          ))}
          <div><div className="text-xs tracking-[0.3em] uppercase text-white/50 mb-4">Stay close</div><p className="text-white/70 text-sm">Whispers, drops and tasting events — straight to your inbox.</p><Magnetic strength={0.3} className="mt-4"><button className="liquid-glass glass-edge rounded-full px-5 py-2.5 text-sm">Subscribe →</button></Magnetic></div>
        </div>
        <div className="mt-16 flex flex-col md:flex-row justify-between text-xs text-white/40 gap-4">
          <span>© 2026 NOIR Maison. All rights reserved.</span>
          <span>Crafted with liquid glass · Imported on demand.</span>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════ PRODUCT DETAIL ═══════════════ */
function ProductPage({ product, onAdd, onNavigate }: { product: Product; onAdd: (p: Product) => void; onNavigate: (page: Page, section?: string) => void }) {
  return (
    <main className="min-h-screen pt-32 px-6 pb-24 noise">
      <div className="max-w-7xl mx-auto">
        <button onClick={() => onNavigate("home", "catalogue")} className="mb-8 text-xs tracking-[0.3em] uppercase text-white/60 hover:text-white">← Back to catalogue</button>
        <div className="grid lg:grid-cols-[1.1fr_.9fr] gap-8 items-start">
          <Reveal><div className="relative rounded-[42px] overflow-hidden min-h-[620px] liquid-glass glass-edge">
            <img src={product.image} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8 flex gap-3 overflow-x-auto">
              {product.gallery.map((src) => (<img key={src} src={src} alt={product.name} className="w-28 h-28 rounded-2xl object-cover border border-white/15" />))}
            </div>
          </div></Reveal>
          <Reveal delay={120}><section className="liquid-glass-strong glass-edge rounded-[42px] p-8 md:p-10">
            <div className="text-[10px] tracking-[0.4em] uppercase text-white/50 mb-4">{product.origin} · {product.category}</div>
            <h1 className="font-display text-5xl md:text-7xl leading-[0.9]">{product.name}</h1>
            <div className="mt-6 font-display text-4xl">{formatRupees(product.price)}</div>
            <p className="mt-8 text-white/70 leading-relaxed text-lg">{product.description}</p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {product.tastingNotes.map((note) => (<div key={note} className="liquid-glass glass-edge rounded-2xl px-4 py-3 text-sm text-white/75">{note}</div>))}
            </div>
            <div className="mt-8 border-t border-white/10 pt-6"><div className="text-xs tracking-[0.3em] uppercase text-white/50 mb-2">Import note</div><p className="text-sm text-white/65">{product.importNote}</p></div>
            <div className="mt-9 flex flex-col sm:flex-row gap-3">
              <Magnetic strength={0.35}><button onClick={() => onAdd(product)} className="bg-white text-black rounded-full px-8 py-3.5 font-medium">Add to cart</button></Magnetic>
              <button onClick={() => { onAdd(product); onNavigate("cart"); }} className="liquid-glass glass-edge rounded-full px-8 py-3.5 text-sm">Buy now</button>
            </div>
          </section></Reveal>
        </div>
      </div>
    </main>
  );
}

/* ═══════════════ CART + ORDERS PAGE ═══════════════ */
function CartPage({
  items,
  onRemove,
  onNavigate,
  user,
  onPurchase,
}: {
  items: Product[];
  onRemove: (id: string) => void;
  onNavigate: (page: Page, section?: string) => void;
  user: User | null;
  onPurchase: () => void;
}) {
  const [tab, setTab] = useState<"cart" | "orders">("cart");
  const total = items.reduce((s, p) => s + p.price, 0);
  const handling = items.length ? 299 : 0;
  const [email, setEmail] = useState(user?.email || "");
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const [status, setStatus] = useState("");
  const [orders, setOrders] = useState(user ? ordersApi.byEmail(user.email) : []);
  const [subs, setSubs] = useState<Subscription[]>(user ? subscriptionsApi.byEmail(user.email) : []);

  // refresh orders + subs when tab changes to orders
  useEffect(() => {
    if (tab === "orders" && user) {
      setOrders(ordersApi.byEmail(user.email));
      setSubs(subscriptionsApi.byEmail(user.email));
    }
  }, [tab, user]);

  const placeOrder = async () => {
    if (!items.length) { setStatus("Your cart is empty."); return; }
    const finalEmail = email || user?.email;
    if (!finalEmail) { setStatus("Add an email address before checkout."); return; }

    setStatus("Processing...");

    try {
      if (paymentMethod === "Cash on Delivery") {
        // Handle COD orders directly
        const grouped: Record<string, OrderItem> = {};
        items.forEach((p) => {
          if (!grouped[p.id]) grouped[p.id] = { id: p.id, name: p.name, price: p.price, origin: p.origin, image: p.image, qty: 0 };
          grouped[p.id].qty += 1;
        });
        const customerProfile: CustomerProfile = {
          name: user?.name || "",
          email: finalEmail,
          phone: user?.phone || "",
          address: user?.address || "",
          city: user?.city || "",
          pin: user?.pin || "",
          notes: "",
          photo: user?.photo || "",
        };
        const order = ordersApi.create({
          email: finalEmail,
          customer: customerProfile,
          items: Object.values(grouped),
          handling,
          paymentMethod,
        });
        onPurchase();
        setOrders(ordersApi.byEmail(finalEmail));
        setTab("orders");
        setStatus(`Order ${order.id} placed! Tracking: ${order.trackingId}`);
      } else {
        // Handle online payments with Razorpay
        const grouped: Record<string, OrderItem> = {};
        items.forEach((p) => {
          if (!grouped[p.id]) grouped[p.id] = { id: p.id, name: p.name, price: p.price, origin: p.origin, image: p.image, qty: 0 };
          grouped[p.id].qty += 1;
        });

        const customerProfile: CustomerProfile = {
          name: user?.name || "",
          email: finalEmail,
          phone: user?.phone || "",
          address: user?.address || "",
          city: user?.city || "",
          pin: user?.pin || "",
          notes: "",
          photo: user?.photo || "",
        };

        // Create Razorpay order
        const response = await fetch(`${API_URL}/api/payments/create-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(getStoredToken() ? { 'Authorization': `Bearer ${getStoredToken()}` } : {})
          },
          body: JSON.stringify({
            items: Object.values(grouped),
            customerEmail: finalEmail,
            customerProfile
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create payment order');
        }

        const orderData = await response.json();

        // Initialize Razorpay checkout
        const options = {
          key: orderData.key,
          amount: orderData.amount,
          currency: orderData.currency,
          order_id: orderData.razorpayOrderId,
          name: 'NOIR - Luxury Imported Snacks',
          description: `Order ${orderData.orderId}`,
          prefill: {
            name: customerProfile.name,
            email: customerProfile.email,
            contact: customerProfile.phone,
          },
          notes: {
            orderId: orderData.orderId,
          },
          theme: {
            color: '#000000',
          },
          handler: function (response: any) {
            // Payment successful
            onPurchase();
            setOrders(ordersApi.byEmail(finalEmail));
            setTab("orders");
            setStatus(`Payment successful! Order ${orderData.orderId} placed.`);
          },
          modal: {
            ondismiss: function() {
              setStatus("Payment cancelled. You can try again.");
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (error) {
      console.error('Payment error:', error);
      setStatus("Payment failed. Please try again.");
    }
  };

  return (
    <main className="min-h-screen pt-32 px-6 pb-24 noise">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="text-[10px] tracking-[0.4em] uppercase text-white/50 mb-4">— Your space</div>
            <h1 className="font-display text-6xl md:text-8xl leading-[0.9]">
              {tab === "cart" ? <>Your <span className="italic font-light">cart.</span></> : <>My <span className="italic font-light">orders.</span></>}
            </h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setTab("cart")} className={`rounded-full px-5 py-2.5 text-xs tracking-[0.2em] uppercase transition-colors ${tab === "cart" ? "bg-white text-black" : "liquid-glass glass-edge text-white/70"}`}>
              Cart · {items.length}
            </button>
            <button onClick={() => setTab("orders")} className={`rounded-full px-5 py-2.5 text-xs tracking-[0.2em] uppercase transition-colors ${tab === "orders" ? "bg-white text-black" : "liquid-glass glass-edge text-white/70"}`}>
              ↻ My Orders
            </button>
            <Magnetic strength={0.3}><button onClick={() => onNavigate("home", "catalogue")} className="liquid-glass glass-edge rounded-full px-5 py-2.5 text-sm hidden md:inline-flex">Continue shopping</button></Magnetic>
          </div>
        </div>

        {status && <div className="liquid-glass glass-edge rounded-2xl p-4 text-sm text-white/75 mb-6">{status}</div>}

        {tab === "cart" && (
          <div className="grid lg:grid-cols-[1fr_380px] gap-6">
            <div className="space-y-4">
              {items.length === 0 && <div className="liquid-glass glass-edge rounded-[32px] p-12 text-center text-white/60">Your cart is empty. Discover something rare.</div>}
              {items.map((p, i) => (
                <Reveal key={p.id + i} delay={i * 60}>
                  <div className="liquid-glass glass-edge rounded-[28px] p-5 flex items-center gap-5">
                    <img src={p.image} alt={p.name} className="w-20 h-20 rounded-2xl object-cover" />
                    <div className="flex-1"><div className="font-display text-2xl">{p.name}</div><div className="text-sm text-white/50">{p.origin}</div></div>
                    <div className="text-lg">{formatRupees(p.price)}</div>
                    <button onClick={() => onRemove(p.id)} className="text-white/40 hover:text-white text-2xl">×</button>
                  </div>
                </Reveal>
              ))}
            </div>
            <aside className="liquid-glass-strong glass-edge rounded-[32px] p-7 h-max sticky top-28">
              <div className="font-display text-3xl mb-6">Order Summary</div>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between text-white/70"><span>Subtotal</span><span>{formatRupees(total)}</span></div>
                <div className="flex justify-between text-white/70"><span>Import handling</span><span>{formatRupees(handling)}</span></div>
                <div className="h-px bg-white/10" />
                <div className="flex justify-between text-xl"><span>Total</span><span>{formatRupees(total + handling)}</span></div>
              </div>
              <label className="block mt-6">
                <span className="text-[10px] tracking-[0.3em] uppercase text-white/50">Receipt email</span>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="mt-2 w-full liquid-glass glass-edge rounded-2xl px-4 py-3 bg-transparent outline-none placeholder:text-white/30" />
              </label>
              <label className="block mt-4">
                <span className="text-[10px] tracking-[0.3em] uppercase text-white/50">Payment method</span>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="mt-2 w-full liquid-glass glass-edge rounded-2xl px-4 py-3 bg-transparent outline-none text-sm">
                  <option className="bg-black">Cash on Delivery</option>
                  <option className="bg-black">UPI</option>
                  <option className="bg-black">Credit/Debit Card</option>
                  <option className="bg-black">Net Banking</option>
                </select>
              </label>
              <div className="mt-4 text-xs text-white/50 leading-relaxed">
                Delivery: {user?.address ? `${user.address}, ${user.city} ${user.pin}` : "Add a delivery profile for faster shipping."}
              </div>
              <button onClick={placeOrder} className="mt-8 w-full bg-white text-black rounded-full py-3 font-medium disabled:opacity-40" disabled={!items.length}>
                Place import order
              </button>
              <button onClick={() => onNavigate("profile")} className="mt-3 w-full liquid-glass glass-edge rounded-full py-3 text-sm">Add delivery profile</button>
            </aside>
          </div>
        )}

        {tab === "orders" && (
          <div className="space-y-4">
            {!user && (
              <div className="liquid-glass glass-edge rounded-[32px] p-12 text-center text-white/60">
                Sign in to view your orders.
              </div>
            )}
            {user && orders.length === 0 && (
              <div className="liquid-glass glass-edge rounded-[32px] p-12 text-center text-white/60">
                No orders yet. Start exploring the catalogue.
              </div>
            )}
            {orders.map((o) => (
              <Reveal key={o.id}>
                <div className="liquid-glass glass-edge rounded-[28px] p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                      <div className="font-display text-2xl">{o.id}</div>
                      <div className="text-xs text-white/50 mt-1">
                        {new Date(o.placedAt).toLocaleDateString()} · {new Date(o.placedAt).toLocaleTimeString()} · {o.paymentMethod}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-2xl">{formatRupees(o.total)}</div>
                      <div className="text-xs text-white/50">Tracking: {o.trackingId}</div>
                    </div>
                  </div>

                  {/* items */}
                  <div className="flex gap-3 overflow-x-auto pb-2 mb-5">
                    {o.items.map((it) => (
                      <div key={it.id + it.qty} className="flex items-center gap-2 liquid-glass glass-edge rounded-xl px-3 py-2 shrink-0">
                        <img src={it.image} alt={it.name} className="w-10 h-10 rounded-lg object-cover" />
                        <div>
                          <div className="text-xs">{it.name}</div>
                          <div className="text-[10px] text-white/50">{it.qty} × {formatRupees(it.price)}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* progress bar */}
                  <OrderProgressBar status={o.status} />
                  <div className="text-[10px] text-white/35 mt-2">Last updated: {new Date(o.updatedAt).toLocaleString()}</div>
                </div>
              </Reveal>
            ))}

            {/* ── Subscriptions section ── */}
            {user && subs.length > 0 && (
              <div className="mt-8">
                <div className="text-[10px] tracking-[0.4em] uppercase text-white/50 mb-4">— Your subscriptions</div>
                {subs.map((s) => {
                  const daysLeft = Math.max(0, Math.ceil((+new Date(s.nextDelivery) - +new Date()) / (1000 * 60 * 60 * 24)));
                  const effective = s.plan === "yearly" ? Math.round(s.budget * 0.9) : s.budget;
                  return (
                    <Reveal key={s.id}>
                      <div className={`liquid-glass glass-edge rounded-[28px] p-6 mb-4 ${s.status === "cancelled" ? "opacity-50" : ""}`}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                          <div>
                            <div className="font-mono text-xs text-white/50">{s.id}</div>
                            <div className="font-display text-2xl mt-1">{s.countries.join(" · ")} Surprise Box</div>
                          </div>
                          <div className="text-right">
                            <div className="font-display text-2xl">{formatRupees(effective)}/mo</div>
                            <div className="text-xs text-white/50">{s.plan === "yearly" ? "Yearly plan (10% off)" : "Monthly plan"}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                          <div>
                            <div className="text-[10px] tracking-[0.3em] uppercase text-white/50">Status</div>
                            <span className={`text-xs tracking-wider uppercase ${s.status === "active" ? "text-green-300" : s.status === "paused" ? "text-yellow-300" : "text-red-300"}`}>{s.status}</span>
                          </div>
                          <div>
                            <div className="text-[10px] tracking-[0.3em] uppercase text-white/50">Next delivery</div>
                            <div>{s.status === "active" ? `In ${daysLeft} days` : "—"}</div>
                          </div>
                          <div>
                            <div className="text-[10px] tracking-[0.3em] uppercase text-white/50">Frequency</div>
                            <div>{s.frequency === 1 ? "1 box/mo" : `${s.frequency} boxes/mo`}</div>
                          </div>
                          <div>
                            <div className="text-[10px] tracking-[0.3em] uppercase text-white/50">Boxes delivered</div>
                            <div>{s.boxesDelivered}</div>
                          </div>
                        </div>
                        {s.status !== "cancelled" && (
                          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/10">
                            <span className="text-[10px] tracking-[0.3em] uppercase text-white/50">Change frequency</span>
                            {FREQUENCY_OPTIONS.map((f) => (
                              <button key={f} onClick={() => { subscriptionsApi.updateFrequency(s.id, f); setSubs(subscriptionsApi.byEmail(user.email)); }} className={`rounded-full px-4 py-1.5 text-xs transition-colors ${s.frequency === f ? "bg-white text-black" : "liquid-glass glass-edge text-white/60"}`}>
                                {f === 1 ? "1/mo" : `${f}/mo`}
                              </button>
                            ))}
                            <button onClick={() => { subscriptionsApi.updateStatus(s.id, s.status === "paused" ? "active" : "paused"); setSubs(subscriptionsApi.byEmail(user.email)); }} className="ml-auto liquid-glass glass-edge rounded-full px-4 py-1.5 text-xs">{s.status === "paused" ? "Resume" : "Pause"}</button>
                            <button onClick={() => { subscriptionsApi.updateStatus(s.id, "cancelled"); setSubs(subscriptionsApi.byEmail(user.email)); }} className="liquid-glass glass-edge rounded-full px-4 py-1.5 text-xs text-red-300/80">Cancel</button>
                          </div>
                        )}
                        <button onClick={() => onNavigate("subscription")} className="mt-3 text-xs text-white/40 hover:text-white">Manage in subscription hub →</button>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

/* ═══════════════ PROFILE ═══════════════ */
function ProfilePage({ user, onSave }: { user: User | null; onSave: (p: CustomerProfile) => void }) {
  const [form, setForm] = useState<CustomerProfile>({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    city: user?.city || "",
    pin: user?.pin || "",
    notes: "",
    photo: user?.photo || "",
  });
  const [saved, setSaved] = useState(false);
  const fields: Array<[keyof CustomerProfile, string, string, string]> = [
    ["name", "Full name", "text", "Aarav Mehta"],
    ["email", "Email", "email", "aarav@domain.com"],
    ["phone", "Phone number", "tel", "+91 98765 43210"],
    ["address", "Address line", "text", "Apartment, street, landmark"],
    ["city", "City", "text", "Mumbai"],
    ["pin", "PIN code", "text", "400001"],
  ];
  const updateField = (key: keyof CustomerProfile, value: string) => {
    setForm((c) => ({ ...c, [key]: value }));
    setSaved(false);
  };
  const saveProfile = () => {
    onSave(form);
    if (user) usersApi.updateProfile(user.id, form);
    setSaved(true);
  };

  return (
    <main className="min-h-screen pt-32 px-6 pb-24 noise">
      <div className="max-w-5xl mx-auto">
        <Reveal><div className="mb-12">
          <div className="text-[10px] tracking-[0.4em] uppercase text-white/50 mb-4">— Customer profile</div>
          <h1 className="font-display text-6xl md:text-8xl leading-[0.9]">Delivery <span className="italic font-light">identity.</span></h1>
          <p className="mt-6 text-white/65 max-w-xl">Save your profile picture, name, number, email and address for faster imported-snack drops.</p>
        </div></Reveal>
        <Reveal><form className="liquid-glass-strong glass-edge rounded-[40px] p-6 md:p-10 grid md:grid-cols-[260px_1fr] gap-10">
          <div className="text-center">
            <div className="mx-auto w-44 h-44 rounded-full liquid-glass glass-edge flex items-center justify-center overflow-hidden text-6xl">
              {form.photo ? <img src={form.photo} alt="Profile preview" className="w-full h-full object-cover" /> : "👤"}
            </div>
            <label className="mt-5 inline-block bg-white text-black rounded-full px-5 py-2.5 text-sm font-medium">
              Upload profile pic
              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => updateField("photo", String(reader.result || ""));
                reader.readAsDataURL(file);
              }} />
            </label>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {fields.map(([key, label, type, placeholder]) => (
              <label key={key} className="block">
                <span className="text-[10px] tracking-[0.3em] uppercase text-white/50">{label}</span>
                <input type={type} value={String(form[key])} onChange={(e) => updateField(key, e.target.value)} placeholder={placeholder} className="mt-2 w-full liquid-glass glass-edge rounded-2xl px-4 py-3 bg-transparent outline-none placeholder:text-white/30" />
              </label>
            ))}
            <label className="sm:col-span-2 block">
              <span className="text-[10px] tracking-[0.3em] uppercase text-white/50">Delivery notes</span>
              <textarea value={form.notes} onChange={(e) => updateField("notes", e.target.value)} placeholder="Gate code, preferred time, allergy details" className="mt-2 w-full min-h-32 liquid-glass glass-edge rounded-2xl px-4 py-3 bg-transparent outline-none placeholder:text-white/30" />
            </label>
            <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
              {saved && <span className="self-center text-sm text-white/60 mr-auto">Profile saved.</span>}
              <button type="button" onClick={() => setForm(emptyProfile)} className="liquid-glass glass-edge rounded-full px-6 py-3 text-sm">Clear</button>
              <button type="button" onClick={saveProfile} className="bg-white text-black rounded-full px-7 py-3 text-sm font-medium">Save Profile</button>
            </div>
          </div>
        </form></Reveal>
      </div>
    </main>
  );
}

/* ═══════════════ COMPOSITES ═══════════════ */
function HomePage({ onAdd, onNavigate, onDetails }: { onAdd: (p: Product) => void; onNavigate: (page: Page, section?: string) => void; onDetails: (p: Product) => void }) {
  return <><Hero onNavigate={onNavigate} /><Marquee /><ScrollText /><Catalogue onAdd={onAdd} onDetails={onDetails} /><Origins /><Concierge /><Journal /><Footer /></>;
}

/* ═══════════════ ROOT APP ═══════════════ */
function isAdminRoute() {
  return window.location.hash.startsWith("#/admin");
}

export default function App() {
  useEffect(() => { seedDemoData(); }, []);

  const [route, setRoute] = useState(isAdminRoute() ? "admin" : "store");
  const [authKey, setAuthKey] = useState(0);
  const refreshAuth = () => setAuthKey((k) => k + 1);

  useEffect(() => {
    const onHash = () => setRoute(isAdminRoute() ? "admin" : "store");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  if (route === "admin") {
    return (
      <div className="bg-black text-white min-h-screen relative">
        <GlassFilter />
        <CustomCursor />
        <AdminPage onLogout={refreshAuth} />
      </div>
    );
  }

  return <Storefront key={authKey} refreshAuth={refreshAuth} />;
}

function Storefront({ refreshAuth }: { refreshAuth: () => void }) {
  const allProducts = productsApi.list();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authPage, setAuthPage] = useState(false);
  const [cart, setCart] = useState<Product[]>(() => {
    try { return JSON.parse(localStorage.getItem("noir-cart") || "[]") as Product[]; } catch { return []; }
  });
  const [profile, setProfile] = useState<CustomerProfile>(() => {
    const session = sessionApi.get();
    if (session) return { ...emptyProfile, ...session };
    return emptyProfile;
  });
  const [selectedProduct, setSelectedProduct] = useState<Product>(allProducts[0]);
  const [page, setPage] = useState<Page>("home");

  // Fetch current user from backend on mount
  useEffect(() => {
    const fetchUser = async () => {
      if (authApi.isAuthenticated()) {
        try {
          const currentUser = await authApi.getMe();
          setUser(currentUser);
          setProfile(prev => ({
            ...prev,
            name: currentUser.name,
            email: currentUser.email,
            phone: currentUser.phone,
            address: currentUser.address,
            city: currentUser.city,
            pin: currentUser.pin,
            notes: currentUser.notes,
            photo: currentUser.photo
          }));
        } catch (err) {
          console.error("Failed to fetch user:", err);
          authApi.logout?.().catch(() => {});
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  useEffect(() => { localStorage.setItem("noir-cart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => {
    localStorage.setItem("noir-profile", JSON.stringify(profile));
    if (profile.email) sessionApi.set(profile);
  }, [profile]);

  const navigate = (nextPage: Page, section?: string) => {
    setPage(nextPage);
    setAuthPage(false);
    requestAnimationFrame(() => {
      if (nextPage !== "home" || !section) { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
      setTimeout(() => { const el = document.getElementById(section); window.scrollTo({ top: el?.offsetTop || 0, behavior: "smooth" }); }, 80);
    });
  };

  const addToCart = (p: Product) => { setCart((c) => [...c, p]); setPage("cart"); };
  const showDetails = (p: Product) => { setSelectedProduct(p); setPage("product"); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const removeFromCart = (id: string) => {
    setCart((c) => {
      const idx = c.findIndex((p) => p.id === id);
      if (idx === -1) return c;
      const copy = [...c]; copy.splice(idx, 1); return copy;
    });
  };

  if (loading) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="font-display text-4xl mb-4">NOIR</div>
          <div className="text-white/50">Connecting...</div>
        </div>
      </div>
    );
  }

  if (authPage && !user) {
    return (
      <div className="bg-black text-white min-h-screen relative">
        <GlassFilter />
        <CustomCursor />
        <div className="fixed top-4 left-4 z-50">
          <button onClick={() => setAuthPage(false)} className="liquid-glass glass-edge rounded-full px-5 py-2.5 text-sm">← Back</button>
        </div>
        <AuthPage onAuth={(user) => { 
          setUser(user);
          setProfile(prev => ({
            ...prev,
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address,
            city: user.city,
            pin: user.pin,
            notes: user.notes,
            photo: user.photo
          }));
          setAuthPage(false);
        }} />
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await authApi.logout();
      setUser(null);
      setCart([]);
      setProfile(emptyProfile);
      refreshAuth();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen relative">
      <GlassFilter />
      <CustomCursor />
      <Nav
        cartCount={cart.length}
        user={user}
        onNavigate={navigate}
        onLogin={() => setAuthPage(true)}
        onLogout={handleLogout}
      />
      <SmoothScroll pageKey={page}>
        {page === "home" && <HomePage onAdd={addToCart} onNavigate={navigate} onDetails={showDetails} />}
        {page === "product" && <ProductPage product={selectedProduct} onAdd={addToCart} onNavigate={navigate} />}
        {page === "cart" && <CartPage items={cart} onRemove={removeFromCart} onNavigate={navigate} user={user} onPurchase={() => setCart([])} />}
        {page === "profile" && <ProfilePage user={user} profile={profile} onSave={setProfile} />}
        {page === "subscription" && <SubscriptionPage user={user} onNavigate={(p, s) => navigate(p as Page, s)} />}
      </SmoothScroll>
    </div>
  );
}
