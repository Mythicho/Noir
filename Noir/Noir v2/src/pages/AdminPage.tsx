import { useEffect, useMemo, useState } from "react";
import {
  customersApi,
  ordersApi,
  productsApi,
  subscriptionsApi,
  ORDER_STATUSES,
  PROGRESS_STEPS,
  FREQUENCY_OPTIONS,
  type Order,
  type OrderStatus,
} from "../backend/db";
import { authApi, adminApi } from "../backend/api";
import type { Product } from "../data/products";

const fmt = (n: number) => `Rs. ${n.toLocaleString("en-IN")}`;

function useDb<T>(read: () => T): [T, () => void] {
  const [value, setValue] = useState(read);
  const refresh = () => setValue(read());
  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener("noir-db:update", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("noir-db:update", handler);
      window.removeEventListener("storage", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return [value, refresh];
}

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function RefreshBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="liquid-glass glass-edge rounded-full w-10 h-10 flex items-center justify-center text-lg hover:bg-white/10 transition-colors"
      title="Refresh data"
    >
      ↻
    </button>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="liquid-glass glass-edge rounded-2xl p-5">
      <div className="text-[10px] tracking-[0.3em] uppercase text-white/50">{label}</div>
      <div className="font-display text-3xl mt-2">{value}</div>
      {sub && <div className="text-xs text-white/45 mt-1">{sub}</div>}
    </div>
  );
}

function RevenueChart({ data }: { data: { date: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="liquid-glass glass-edge rounded-3xl p-6">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <div className="text-[10px] tracking-[0.3em] uppercase text-white/50">Revenue · 14 days</div>
          <div className="font-display text-2xl mt-1">{fmt(data.reduce((s, d) => s + d.value, 0))}</div>
        </div>
      </div>
      <div className="flex items-end gap-1 h-40">
        {data.map((d) => (
          <div key={d.date} className="flex-1 flex flex-col items-center justify-end group">
            <div
              className="w-full rounded-md bg-white/85 group-hover:bg-white transition-all"
              style={{ height: `${(d.value / max) * 100}%`, minHeight: 2 }}
              title={`${d.date}: ${fmt(d.value)}`}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-white/40">
        <span>{data[0]?.date.slice(5)}</span>
        <span>{data[data.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  );
}

function AdminLogin({ onAuth }: { onAuth: () => void }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  
  const handleLogin = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await authApi.login(email, pw);
      if (!res.user.isAdmin) {
        setErr("This account does not have admin access.");
      } else {
        onAuth();
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 noise">
      <div className="liquid-glass-strong glass-edge rounded-[36px] p-10 w-full max-w-md">
        <div className="text-[10px] tracking-[0.4em] uppercase text-white/50 mb-3">— Admin console</div>
        <h1 className="font-display text-4xl">NOIR Operations</h1>
        <p className="mt-3 text-white/60 text-sm">
          Sign in with your admin credentials to access the dashboard.
        </p>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="mt-6 w-full liquid-glass glass-edge rounded-2xl px-4 py-3 bg-transparent outline-none placeholder:text-white/40"
          disabled={loading}
        />
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Password"
          className="mt-3 w-full liquid-glass glass-edge rounded-2xl px-4 py-3 bg-transparent outline-none placeholder:text-white/40"
          disabled={loading}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
        />
        {err && <div className="text-xs text-red-300 mt-2">{err}</div>}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="mt-5 w-full bg-white text-black rounded-full py-3 font-medium disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in to Dashboard"}
        </button>
        <a href="#/" className="block mt-4 text-center text-xs text-white/50 hover:text-white">← Back to store</a>
      </div>
    </div>
  );
}

type Tab = "overview" | "orders" | "customers" | "products" | "subscriptions" | "settings";

export default function AdminPage({ onLogout }: { onLogout: () => void }) {
  const [authed, setAuthed] = useState(authApi.isAuthenticated());

  const handleLogout = async () => {
    try {
      await authApi.logout();
      setAuthed(false);
      onLogout();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const [tab, setTab] = useState<Tab>("overview");

  if (!authed) return <AdminLogin onAuth={() => setAuthed(true)} />;

  return (
    <div className="min-h-screen noise pb-24">
      <div className="max-w-7xl mx-auto px-6 pt-10">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="text-[10px] tracking-[0.4em] uppercase text-white/50">— Operations console</div>
            <h1 className="font-display text-5xl mt-2">NOIR / Admin</h1>
          </div>
          <div className="flex items-center gap-2">
            <a href="#/" className="liquid-glass glass-edge rounded-full px-5 py-2.5 text-sm">← Storefront</a>
            <button
              onClick={handleLogout}
              className="liquid-glass glass-edge rounded-full px-5 py-2.5 text-sm"
            >
              Sign out
            </button>
          </div>
        </div>

        <nav className="liquid-glass glass-edge rounded-full p-1 inline-flex flex-wrap mb-8">
          {(["overview", "orders", "customers", "products", "subscriptions", "settings"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 text-xs tracking-[0.2em] uppercase rounded-full transition-colors ${
                tab === t ? "bg-white text-black" : "text-white/70 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>

        {tab === "overview" && <Overview />}
        {tab === "orders" && <Orders />}
        {tab === "customers" && <Customers />}
        {tab === "products" && <Products />}
        {tab === "subscriptions" && <AdminSubscriptions />}
        {tab === "settings" && <Settings />}
      </div>
    </div>
  );
}

function Overview() {
  const [summary, refreshSummary] = useDb(() => analyticsApi.summary());
  const [chart, refreshChart] = useDb(() => analyticsApi.revenueLast14Days());
  const [topProducts] = useDb(() => analyticsApi.topProducts());
  const [recent, refreshRecent] = useDb(() => ordersApi.list().slice(0, 5));

  const refreshAll = () => {
    refreshSummary();
    refreshChart();
    refreshRecent();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end"><RefreshBtn onClick={refreshAll} /></div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard label="Revenue" value={fmt(summary.revenue)} />
        <StatCard label="Orders" value={String(summary.orderCount)} />
        <StatCard label="Customers" value={String(summary.customerCount)} />
        <StatCard label="Pending" value={String(summary.pending)} sub="awaiting fulfillment" />
        <StatCard label="AOV" value={fmt(summary.aov)} sub="avg order value" />
        <StatCard label="Today" value={String(summary.ordersToday)} sub="orders placed today" />
        <StatCard label="Active Subs" value={String(summary.subsActive)} sub={summary.subsMRR ? `MRR ${fmt(summary.subsMRR)}` : undefined} />
        <StatCard label="Subs Total" value={String(summary.subsTotal)} />
      </div>
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <RevenueChart data={chart} />
        <div className="liquid-glass glass-edge rounded-3xl p-6">
          <div className="text-[10px] tracking-[0.3em] uppercase text-white/50 mb-3">Top products</div>
          <div className="space-y-3">
            {topProducts.length === 0 && <div className="text-white/50 text-sm">No sales yet.</div>}
            {topProducts.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <img src={p.image} alt={p.name} className="w-12 h-12 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{p.name}</div>
                  <div className="text-xs text-white/50">{p.qty} sold</div>
                </div>
                <div className="text-sm">{fmt(p.revenue)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="liquid-glass glass-edge rounded-3xl p-6">
        <div className="text-[10px] tracking-[0.3em] uppercase text-white/50 mb-4">Recent orders</div>
        <OrdersTable orders={recent} />
      </div>
    </div>
  );
}

function OrdersTable({ orders }: { orders: Order[] }) {
  return (
    <div className="overflow-x-auto -mx-2">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[10px] tracking-[0.3em] uppercase text-white/45">
            <th className="px-3 py-2">Order</th>
            <th className="px-3 py-2">Customer</th>
            <th className="px-3 py-2">Placed</th>
            <th className="px-3 py-2">Payment</th>
            <th className="px-3 py-2">Total</th>
            <th className="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 && (
            <tr><td colSpan={6} className="px-3 py-6 text-white/45 text-center">No orders yet.</td></tr>
          )}
          {orders.map((o) => (
            <tr key={o.id} className="border-t border-white/8">
              <td className="px-3 py-3 font-mono text-xs">{o.id}</td>
              <td className="px-3 py-3">
                <div>{o.customer.name || "—"}</div>
                <div className="text-xs text-white/50">{o.email}</div>
              </td>
              <td className="px-3 py-3 text-xs text-white/55 whitespace-nowrap">
                {new Date(o.placedAt).toLocaleDateString()}
                <br />
                <span className="text-white/35">{new Date(o.placedAt).toLocaleTimeString()}</span>
              </td>
              <td className="px-3 py-3 text-xs text-white/65">{o.paymentMethod}</td>
              <td className="px-3 py-3">{fmt(o.total)}</td>
              <td className="px-3 py-3">
                <span className="liquid-glass glass-edge rounded-full px-3 py-1 text-[10px] tracking-[0.2em] uppercase">{o.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Orders() {
  const [orders, refresh] = useDb(() => ordersApi.list());
  const [filter, setFilter] = useState<"All" | OrderStatus>("All");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Order | null>(null);

  const visible = useMemo(() => {
    return orders.filter((o) => {
      if (filter !== "All" && o.status !== filter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        o.id.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q) ||
        o.customer.name.toLowerCase().includes(q) ||
        o.customer.city.toLowerCase().includes(q) ||
        o.paymentMethod.toLowerCase().includes(q)
      );
    });
  }, [orders, filter, query]);

  const exportCsv = () =>
    downloadCsv(
      `noir-orders-${new Date().toISOString().slice(0, 10)}.csv`,
      visible.map((o) => ({
        id: o.id,
        placed: o.placedAt,
        status: o.status,
        customer: o.customer.name,
        email: o.email,
        phone: o.customer.phone,
        address: `${o.customer.address}, ${o.customer.city} ${o.customer.pin}`,
        paymentMethod: o.paymentMethod,
        items: o.items.map((i) => `${i.qty}x ${i.name}`).join(" | "),
        subtotal: o.subtotal,
        handling: o.handling,
        total: o.total,
        tracking: o.trackingId,
      }))
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 items-center flex-wrap">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search id, email, name, city, payment"
            className="liquid-glass glass-edge rounded-full px-4 py-2.5 text-sm bg-transparent outline-none w-72"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as "All" | OrderStatus)}
            className="liquid-glass glass-edge rounded-full px-4 py-2.5 text-sm bg-transparent outline-none"
          >
            <option className="bg-black" value="All">All statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option className="bg-black" key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <RefreshBtn onClick={refresh} />
          <button onClick={exportCsv} className="liquid-glass glass-edge rounded-full px-5 py-2.5 text-sm">Export CSV</button>
        </div>
      </div>

      <div className="liquid-glass glass-edge rounded-3xl p-4">
        <OrdersTable orders={visible} />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {visible.map((o) => (
          <button
            key={o.id}
            onClick={() => setActive(o)}
            className="liquid-glass glass-edge rounded-2xl p-4 text-left hover:bg-white/5"
          >
            <div className="flex justify-between text-xs text-white/55">
              <span className="font-mono">{o.id}</span>
              <span>{new Date(o.placedAt).toLocaleDateString()}</span>
            </div>
            <div className="mt-2 font-display text-xl">{o.customer.name || o.email}</div>
            <div className="text-xs text-white/50 mt-1">
              {o.items.length} line items · {fmt(o.total)} · {o.paymentMethod}
            </div>
            <div className="mt-3 inline-block text-[10px] tracking-[0.2em] uppercase liquid-glass glass-edge rounded-full px-3 py-1">
              {o.status}
            </div>
          </button>
        ))}
      </div>

      {active && (
        <OrderDetail
          order={active}
          onClose={() => setActive(null)}
          onChange={() => {
            refresh();
            const fresh = ordersApi.list().find((o) => o.id === active.id);
            setActive(fresh || null);
          }}
        />
      )}
    </div>
  );
}

function OrderDetail({
  order,
  onClose,
  onChange,
}: {
  order: Order;
  onClose: () => void;
  onChange: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="liquid-glass-strong glass-edge rounded-[32px] w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-white/50">Order</div>
            <div className="font-display text-3xl mt-1">{order.id}</div>
            <div className="text-xs text-white/50 mt-1">Tracking: {order.trackingId}</div>
          </div>
          <button onClick={onClose} className="text-2xl">×</button>
        </div>

        {/* time + payment row */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div className="liquid-glass glass-edge rounded-2xl p-4">
            <div className="text-[10px] tracking-[0.3em] uppercase text-white/50 mb-1">Placed</div>
            <div className="text-sm">{new Date(order.placedAt).toLocaleDateString()}</div>
            <div className="text-xs text-white/55">{new Date(order.placedAt).toLocaleTimeString()}</div>
          </div>
          <div className="liquid-glass glass-edge rounded-2xl p-4">
            <div className="text-[10px] tracking-[0.3em] uppercase text-white/50 mb-1">Payment</div>
            <div className="text-sm">{order.paymentMethod}</div>
          </div>
          <div className="liquid-glass glass-edge rounded-2xl p-4">
            <div className="text-[10px] tracking-[0.3em] uppercase text-white/50 mb-1">Last updated</div>
            <div className="text-sm">{new Date(order.updatedAt).toLocaleDateString()}</div>
            <div className="text-xs text-white/55">{new Date(order.updatedAt).toLocaleTimeString()}</div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="liquid-glass glass-edge rounded-2xl p-4">
            <div className="text-[10px] tracking-[0.3em] uppercase text-white/50 mb-2">Customer</div>
            <div>{order.customer.name || "—"}</div>
            <div className="text-sm text-white/60">{order.email}</div>
            <div className="text-sm text-white/60">{order.customer.phone}</div>
          </div>
          <div className="liquid-glass glass-edge rounded-2xl p-4">
            <div className="text-[10px] tracking-[0.3em] uppercase text-white/50 mb-2">Shipping address</div>
            <div className="text-sm text-white/80 whitespace-pre-line">
              {order.customer.address || "—"}{"\n"}
              {[order.customer.city, order.customer.pin].filter(Boolean).join(" ")}
            </div>
            {order.customer.notes && (
              <div className="text-xs text-white/50 mt-2">Notes: {order.customer.notes}</div>
            )}
          </div>
        </div>

        <div className="liquid-glass glass-edge rounded-2xl p-4 mb-6">
          <div className="text-[10px] tracking-[0.3em] uppercase text-white/50 mb-3">Items</div>
          <div className="space-y-3">
            {order.items.map((it) => (
              <div key={it.id} className="flex items-center gap-3">
                <img src={it.image} alt={it.name} className="w-12 h-12 rounded-xl object-cover" />
                <div className="flex-1">
                  <div className="text-sm">{it.name}</div>
                  <div className="text-xs text-white/50">{it.origin}</div>
                </div>
                <div className="text-sm">{it.qty} × {fmt(it.price)}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/10 text-sm space-y-1">
            <div className="flex justify-between text-white/65"><span>Subtotal</span><span>{fmt(order.subtotal)}</span></div>
            <div className="flex justify-between text-white/65"><span>Import handling</span><span>{fmt(order.handling)}</span></div>
            <div className="flex justify-between text-lg pt-2"><span>Total</span><span>{fmt(order.total)}</span></div>
          </div>
        </div>

        {/* progress bar preview (what user sees) */}
        <div className="liquid-glass glass-edge rounded-2xl p-4 mb-6">
          <div className="text-[10px] tracking-[0.3em] uppercase text-white/50 mb-4">Delivery progress (user view)</div>
          <OrderProgressBar status={order.status} />
        </div>

        <div className="liquid-glass glass-edge rounded-2xl p-4 mb-6">
          <div className="text-[10px] tracking-[0.3em] uppercase text-white/50 mb-3">Update status</div>
          <div className="flex flex-wrap gap-2">
            {ORDER_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => {
                  ordersApi.updateStatus(order.id, s);
                  onChange();
                }}
                className={`rounded-full px-4 py-2 text-xs tracking-wider uppercase transition-colors ${
                  order.status === s ? "bg-white text-black" : "liquid-glass glass-edge text-white/70"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
              if (confirm(`Delete order ${order.id}? This cannot be undone.`)) {
                ordersApi.remove(order.id);
                onChange();
                onClose();
              }
            }}
            className="liquid-glass glass-edge rounded-full px-5 py-2.5 text-sm"
          >
            Delete
          </button>
          <button onClick={onClose} className="bg-white text-black rounded-full px-5 py-2.5 text-sm font-medium">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export function OrderProgressBar({ status }: { status: OrderStatus }) {
  if (status === "Cancelled") {
    return (
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-red-400/40" />
        <span className="text-xs tracking-[0.2em] uppercase text-red-300/80 shrink-0">Cancelled</span>
      </div>
    );
  }
  const idx = PROGRESS_STEPS.indexOf(status);
  return (
    <div className="flex items-start gap-0">
      {PROGRESS_STEPS.map((step, i) => (
        <div key={step} className="flex-1 flex flex-col items-center relative">
          <div className="w-full flex items-center">
            <div
              className={`w-3 h-3 rounded-full shrink-0 z-10 border-2 ${
                i <= idx ? "bg-white border-white" : "bg-transparent border-white/30"
              }`}
            />
            {i < PROGRESS_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 ${i < idx ? "bg-white" : "bg-white/20"}`} />
            )}
          </div>
          <span
            className={`text-[9px] mt-2 text-center leading-tight ${
              i <= idx ? "text-white" : "text-white/35"
            }`}
          >
            {step}
          </span>
        </div>
      ))}
    </div>
  );
}

function Customers() {
  const [customers, refresh] = useDb(() => customersApi.list());
  const [query, setQuery] = useState("");

  const visible = customers
    .filter((c) =>
      [c.name, c.email, c.city, c.phone].join(" ").toLowerCase().includes(query.toLowerCase())
    )
    .sort((a, b) => b.lifetimeValue - a.lifetimeValue);

  const exportCsv = () =>
    downloadCsv(
      `noir-customers-${new Date().toISOString().slice(0, 10)}.csv`,
      visible.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        address: c.address,
        city: c.city,
        pin: c.pin,
        ordersCount: c.ordersCount,
        lifetimeValue: c.lifetimeValue,
      }))
    );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email, city, phone"
          className="liquid-glass glass-edge rounded-full px-4 py-2.5 text-sm bg-transparent outline-none w-80"
        />
        <div className="flex gap-2">
          <RefreshBtn onClick={refresh} />
          <button onClick={exportCsv} className="liquid-glass glass-edge rounded-full px-5 py-2.5 text-sm">Export CSV</button>
        </div>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.length === 0 && <div className="text-white/50">No customers yet.</div>}
        {visible.map((c) => (
          <div key={c.id} className="liquid-glass glass-edge rounded-3xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full liquid-glass glass-edge flex items-center justify-center overflow-hidden">
                {c.photo ? <img src={c.photo} alt={c.name} className="w-full h-full object-cover" /> : <span className="text-xl">👤</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display text-xl truncate">{c.name || "Unnamed"}</div>
                <div className="text-xs text-white/55 truncate">{c.email}</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><div className="text-[10px] tracking-[0.3em] uppercase text-white/50">Orders</div><div>{c.ordersCount}</div></div>
              <div><div className="text-[10px] tracking-[0.3em] uppercase text-white/50">LTV</div><div>{fmt(c.lifetimeValue)}</div></div>
              <div><div className="text-[10px] tracking-[0.3em] uppercase text-white/50">Phone</div><div>{c.phone || "—"}</div></div>
              <div><div className="text-[10px] tracking-[0.3em] uppercase text-white/50">City</div><div>{c.city || "—"}</div></div>
            </div>
            <div className="mt-3 text-xs text-white/55">{c.address}</div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => { customersApi.remove(c.id); refresh(); }} className="liquid-glass glass-edge rounded-full px-4 py-1.5 text-xs">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Products() {
  const [items, refresh] = useDb(() => productsApi.list());
  const [editing, setEditing] = useState<Product | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const update = (id: string, patch: Partial<Product>) => {
    productsApi.update(id, patch);
    refresh();
  };

  const toggleStock = (p: Product) => {
    update(p.id, { outOfStock: !p.outOfStock });
  };

  const deleteProduct = (p: Product) => {
    if (confirm(`Delete "${p.name}"? This cannot be undone.`)) {
      productsApi.delete(p.id);
      refresh();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <button onClick={() => setShowAdd(true)} className="bg-white text-black rounded-full px-5 py-2.5 text-sm font-medium">
          + Add New Product
        </button>
        <RefreshBtn onClick={refresh} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {items.map((p) => (
          <div key={p.id} className={`liquid-glass glass-edge rounded-3xl p-5 ${p.outOfStock ? "opacity-60" : ""}`}>
            <div className="flex gap-4">
              <div className="relative">
                <img src={p.image} alt={p.name} className="w-24 h-24 rounded-2xl object-cover" />
                {p.outOfStock && (
                  <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center">
                    <span className="text-[9px] tracking-wider uppercase text-red-300">Out of Stock</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display text-xl truncate">{p.name}</div>
                <div className="text-xs text-white/55">{p.origin} · {p.category}</div>
                <div className="text-sm mt-1">{fmt(p.price)}</div>
                <div className="mt-2 flex gap-2 flex-wrap">
                  <button onClick={() => setEditing(p)} className="liquid-glass glass-edge rounded-full px-3 py-1 text-[10px] tracking-wider uppercase">Edit</button>
                  <button onClick={() => toggleStock(p)} className={`rounded-full px-3 py-1 text-[10px] tracking-wider uppercase ${p.outOfStock ? "bg-green-500/20 text-green-300" : "bg-orange-500/20 text-orange-300"}`}>
                    {p.outOfStock ? "Mark In Stock" : "Mark Out of Stock"}
                  </button>
                  <button onClick={() => deleteProduct(p)} className="liquid-glass glass-edge rounded-full px-3 py-1 text-[10px] tracking-wider uppercase text-red-300/80">Delete</button>
                </div>
              </div>
            </div>
            {/* Gallery preview */}
            {p.gallery && p.gallery.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {p.gallery.map((img, i) => (
                  <img key={i} src={img} alt={`${p.name} ${i + 1}`} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {editing && (
        <ProductEditModal product={editing} onClose={() => setEditing(null)} onSave={(patch) => { update(editing.id, patch); setEditing(null); }} />
      )}

      {showAdd && (
        <ProductAddModal onClose={() => setShowAdd(false)} onSave={(p) => { productsApi.create(p); refresh(); setShowAdd(false); }} />
      )}
    </div>
  );
}

function ProductEditModal({ product, onClose, onSave }: { product: Product; onClose: () => void; onSave: (patch: Partial<Product>) => void }) {
  const [form, setForm] = useState({
    name: product.name,
    origin: product.origin,
    category: product.category,
    price: product.price,
    blurb: product.blurb,
    description: product.description,
    image: product.image,
    gallery: product.gallery || [],
    tastingNotes: product.tastingNotes || [],
    importNote: product.importNote || "",
  });
  const [newGalleryUrl, setNewGalleryUrl] = useState("");
  const [newTastingNote, setNewTastingNote] = useState("");

  const addGalleryImage = () => {
    if (newGalleryUrl.trim()) {
      setForm((f) => ({ ...f, gallery: [...f.gallery, newGalleryUrl.trim()] }));
      setNewGalleryUrl("");
    }
  };

  const removeGalleryImage = (index: number) => {
    setForm((f) => ({ ...f, gallery: f.gallery.filter((_, i) => i !== index) }));
  };

  const addTastingNote = () => {
    if (newTastingNote.trim()) {
      setForm((f) => ({ ...f, tastingNotes: [...f.tastingNotes, newTastingNote.trim()] }));
      setNewTastingNote("");
    }
  };

  const removeTastingNote = (index: number) => {
    setForm((f) => ({ ...f, tastingNotes: f.tastingNotes.filter((_, i) => i !== index) }));
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="liquid-glass-strong glass-edge rounded-[32px] w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-white/50">Edit Product</div>
            <div className="font-display text-3xl mt-1">{product.name}</div>
          </div>
          <button onClick={onClose} className="text-2xl">×</button>
        </div>

        <div className="space-y-4">
          {/* Main image */}
          <div className="flex gap-4 items-start">
            <img src={form.image} alt={form.name} className="w-32 h-32 rounded-2xl object-cover" />
            <label className="flex-1 block">
              <span className="text-[10px] tracking-[0.3em] uppercase text-white/50">Main Image URL</span>
              <input value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} className="mt-1 w-full liquid-glass glass-edge rounded-xl px-3 py-2 text-sm bg-transparent outline-none" />
            </label>
          </div>

          {/* Gallery */}
          <div>
            <span className="text-[10px] tracking-[0.3em] uppercase text-white/50">Gallery Images</span>
            <div className="flex gap-2 mt-2 flex-wrap">
              {form.gallery.map((img, i) => (
                <div key={i} className="relative group">
                  <img src={img} alt={`Gallery ${i + 1}`} className="w-20 h-20 rounded-xl object-cover" />
                  <button onClick={() => removeGalleryImage(i)} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <input value={newGalleryUrl} onChange={(e) => setNewGalleryUrl(e.target.value)} placeholder="Paste image URL" className="flex-1 liquid-glass glass-edge rounded-xl px-3 py-2 text-sm bg-transparent outline-none" />
              <button onClick={addGalleryImage} className="liquid-glass glass-edge rounded-xl px-4 py-2 text-sm">Add</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-[10px] tracking-[0.3em] uppercase text-white/50">Name</span>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="mt-1 w-full liquid-glass glass-edge rounded-xl px-3 py-2 text-sm bg-transparent outline-none" />
            </label>
            <label className="block">
              <span className="text-[10px] tracking-[0.3em] uppercase text-white/50">Price (Rs.)</span>
              <input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} className="mt-1 w-full liquid-glass glass-edge rounded-xl px-3 py-2 text-sm bg-transparent outline-none" />
            </label>
            <label className="block">
              <span className="text-[10px] tracking-[0.3em] uppercase text-white/50">Origin</span>
              <input value={form.origin} onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))} className="mt-1 w-full liquid-glass glass-edge rounded-xl px-3 py-2 text-sm bg-transparent outline-none" />
            </label>
            <label className="block">
              <span className="text-[10px] tracking-[0.3em] uppercase text-white/50">Category</span>
              <input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="mt-1 w-full liquid-glass glass-edge rounded-xl px-3 py-2 text-sm bg-transparent outline-none" />
            </label>
          </div>

          <label className="block">
            <span className="text-[10px] tracking-[0.3em] uppercase text-white/50">Short Blurb</span>
            <input value={form.blurb} onChange={(e) => setForm((f) => ({ ...f, blurb: e.target.value }))} className="mt-1 w-full liquid-glass glass-edge rounded-xl px-3 py-2 text-sm bg-transparent outline-none" />
          </label>

          <label className="block">
            <span className="text-[10px] tracking-[0.3em] uppercase text-white/50">Full Description</span>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="mt-1 w-full min-h-24 liquid-glass glass-edge rounded-xl px-3 py-2 text-sm bg-transparent outline-none" />
          </label>

          <label className="block">
            <span className="text-[10px] tracking-[0.3em] uppercase text-white/50">Import Note</span>
            <input value={form.importNote} onChange={(e) => setForm((f) => ({ ...f, importNote: e.target.value }))} className="mt-1 w-full liquid-glass glass-edge rounded-xl px-3 py-2 text-sm bg-transparent outline-none" />
          </label>

          {/* Tasting Notes */}
          <div>
            <span className="text-[10px] tracking-[0.3em] uppercase text-white/50">Tasting Notes</span>
            <div className="flex gap-2 mt-2 flex-wrap">
              {form.tastingNotes.map((note, i) => (
                <span key={i} className="liquid-glass glass-edge rounded-full px-3 py-1 text-xs flex items-center gap-2">
                  {note}
                  <button onClick={() => removeTastingNote(i)} className="text-white/50 hover:text-white">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <input value={newTastingNote} onChange={(e) => setNewTastingNote(e.target.value)} placeholder="Add tasting note" className="flex-1 liquid-glass glass-edge rounded-xl px-3 py-2 text-sm bg-transparent outline-none" />
              <button onClick={addTastingNote} className="liquid-glass glass-edge rounded-xl px-4 py-2 text-sm">Add</button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-white/10">
          <button onClick={onClose} className="liquid-glass glass-edge rounded-full px-5 py-2.5 text-sm">Cancel</button>
          <button onClick={() => onSave(form)} className="bg-white text-black rounded-full px-5 py-2.5 text-sm font-medium">Save Changes</button>
        </div>
      </div>
    </div>
  );
}

function ProductAddModal({ onClose, onSave }: { onClose: () => void; onSave: (p: Omit<Product, "id">) => void }) {
  const [form, setForm] = useState({
    name: "",
    origin: "",
    category: "Japanese",
    price: 999,
    blurb: "",
    description: "",
    image: "https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=800&q=80",
    gallery: [] as string[],
    tastingNotes: [] as string[],
    importNote: "Imported on demand based on availability.",
    outOfStock: false,
  });
  const [newGalleryUrl, setNewGalleryUrl] = useState("");
  const [newTastingNote, setNewTastingNote] = useState("");

  const addGalleryImage = () => {
    if (newGalleryUrl.trim()) {
      setForm((f) => ({ ...f, gallery: [...f.gallery, newGalleryUrl.trim()] }));
      setNewGalleryUrl("");
    }
  };

  const addTastingNote = () => {
    if (newTastingNote.trim()) {
      setForm((f) => ({ ...f, tastingNotes: [...f.tastingNotes, newTastingNote.trim()] }));
      setNewTastingNote("");
    }
  };

  const handleSave = () => {
    if (!form.name.trim()) { alert("Product name is required"); return; }
    onSave({ ...form, gallery: form.gallery.length ? form.gallery : [form.image] });
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="liquid-glass-strong glass-edge rounded-[32px] w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-white/50">Add New Product</div>
            <div className="font-display text-3xl mt-1">Create Product</div>
          </div>
          <button onClick={onClose} className="text-2xl">×</button>
        </div>

        <div className="space-y-4">
          {/* Main image */}
          <div className="flex gap-4 items-start">
            <img src={form.image} alt="Preview" className="w-32 h-32 rounded-2xl object-cover" />
            <label className="flex-1 block">
              <span className="text-[10px] tracking-[0.3em] uppercase text-white/50">Main Image URL</span>
              <input value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} className="mt-1 w-full liquid-glass glass-edge rounded-xl px-3 py-2 text-sm bg-transparent outline-none" />
            </label>
          </div>

          {/* Gallery */}
          <div>
            <span className="text-[10px] tracking-[0.3em] uppercase text-white/50">Gallery Images (optional)</span>
            <div className="flex gap-2 mt-2 flex-wrap">
              {form.gallery.map((img, i) => (
                <div key={i} className="relative group">
                  <img src={img} alt={`Gallery ${i + 1}`} className="w-16 h-16 rounded-xl object-cover" />
                  <button onClick={() => setForm((f) => ({ ...f, gallery: f.gallery.filter((_, idx) => idx !== i) }))} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <input value={newGalleryUrl} onChange={(e) => setNewGalleryUrl(e.target.value)} placeholder="Paste image URL" className="flex-1 liquid-glass glass-edge rounded-xl px-3 py-2 text-sm bg-transparent outline-none" />
              <button onClick={addGalleryImage} className="liquid-glass glass-edge rounded-xl px-4 py-2 text-sm">Add</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-[10px] tracking-[0.3em] uppercase text-white/50">Name *</span>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="mt-1 w-full liquid-glass glass-edge rounded-xl px-3 py-2 text-sm bg-transparent outline-none" placeholder="e.g. Japanese Matcha KitKat" />
            </label>
            <label className="block">
              <span className="text-[10px] tracking-[0.3em] uppercase text-white/50">Price (Rs.)</span>
              <input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} className="mt-1 w-full liquid-glass glass-edge rounded-xl px-3 py-2 text-sm bg-transparent outline-none" />
            </label>
            <label className="block">
              <span className="text-[10px] tracking-[0.3em] uppercase text-white/50">Origin</span>
              <input value={form.origin} onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))} className="mt-1 w-full liquid-glass glass-edge rounded-xl px-3 py-2 text-sm bg-transparent outline-none" placeholder="e.g. Tokyo, Japan" />
            </label>
            <label className="block">
              <span className="text-[10px] tracking-[0.3em] uppercase text-white/50">Category</span>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="mt-1 w-full liquid-glass glass-edge rounded-xl px-3 py-2 text-sm bg-transparent outline-none">
                <option className="bg-black">Japanese</option>
                <option className="bg-black">Korean</option>
                <option className="bg-black">American</option>
                <option className="bg-black">Drinks</option>
                <option className="bg-black">Snacks</option>
                <option className="bg-black">Candy</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-[10px] tracking-[0.3em] uppercase text-white/50">Short Blurb</span>
            <input value={form.blurb} onChange={(e) => setForm((f) => ({ ...f, blurb: e.target.value }))} className="mt-1 w-full liquid-glass glass-edge rounded-xl px-3 py-2 text-sm bg-transparent outline-none" placeholder="One-line description for product card" />
          </label>

          <label className="block">
            <span className="text-[10px] tracking-[0.3em] uppercase text-white/50">Full Description</span>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="mt-1 w-full min-h-24 liquid-glass glass-edge rounded-xl px-3 py-2 text-sm bg-transparent outline-none" placeholder="Detailed description for product page" />
          </label>

          <label className="block">
            <span className="text-[10px] tracking-[0.3em] uppercase text-white/50">Import Note</span>
            <input value={form.importNote} onChange={(e) => setForm((f) => ({ ...f, importNote: e.target.value }))} className="mt-1 w-full liquid-glass glass-edge rounded-xl px-3 py-2 text-sm bg-transparent outline-none" />
          </label>

          {/* Tasting Notes */}
          <div>
            <span className="text-[10px] tracking-[0.3em] uppercase text-white/50">Tasting Notes</span>
            <div className="flex gap-2 mt-2 flex-wrap">
              {form.tastingNotes.map((note, i) => (
                <span key={i} className="liquid-glass glass-edge rounded-full px-3 py-1 text-xs flex items-center gap-2">
                  {note}
                  <button onClick={() => setForm((f) => ({ ...f, tastingNotes: f.tastingNotes.filter((_, idx) => idx !== i) }))} className="text-white/50 hover:text-white">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <input value={newTastingNote} onChange={(e) => setNewTastingNote(e.target.value)} placeholder="e.g. Spicy, Umami, Sweet" className="flex-1 liquid-glass glass-edge rounded-xl px-3 py-2 text-sm bg-transparent outline-none" />
              <button onClick={addTastingNote} className="liquid-glass glass-edge rounded-xl px-4 py-2 text-sm">Add</button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-white/10">
          <button onClick={onClose} className="liquid-glass glass-edge rounded-full px-5 py-2.5 text-sm">Cancel</button>
          <button onClick={handleSave} className="bg-white text-black rounded-full px-5 py-2.5 text-sm font-medium">Add Product</button>
        </div>
      </div>
    </div>
  );
}

function AdminSubscriptions() {
  const [subs, refresh] = useDb(() => subscriptionsApi.list());

  const updateStatus = (id: string, status: "active" | "paused" | "cancelled") => {
    subscriptionsApi.updateStatus(id, status);
    refresh();
  };

  const updateFreq = (id: string, freq: number) => {
    subscriptionsApi.updateFrequency(id, freq);
    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><RefreshBtn onClick={refresh} /></div>
      {subs.length === 0 && <div className="liquid-glass glass-edge rounded-2xl p-8 text-center text-white/50">No subscriptions yet.</div>}
      <div className="grid md:grid-cols-2 gap-4">
        {subs.map((s) => {
          const effective = s.plan === "yearly" ? Math.round(s.budget * 0.9) : s.budget;
          const nextDays = Math.max(0, Math.ceil((+new Date(s.nextDelivery) - +new Date()) / (1000 * 60 * 60 * 24)));
          return (
            <div key={s.id} className={`liquid-glass glass-edge rounded-3xl p-5 ${s.status === "cancelled" ? "opacity-50" : ""}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-mono text-xs text-white/50">{s.id}</div>
                  <div className="font-display text-xl mt-1">{s.customerName || s.email}</div>
                  <div className="text-xs text-white/55">{s.email}</div>
                </div>
                <span className={`text-[10px] tracking-wider uppercase ${s.status === "active" ? "text-green-300" : s.status === "paused" ? "text-yellow-300" : "text-red-300"}`}>{s.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div><div className="text-[10px] tracking-[0.3em] uppercase text-white/50">Plan</div><div>{s.plan} · {fmt(effective)}/mo</div></div>
                <div><div className="text-[10px] tracking-[0.3em] uppercase text-white/50">Frequency</div><div>{s.frequency}×/mo</div></div>
                <div><div className="text-[10px] tracking-[0.3em] uppercase text-white/50">Countries</div><div className="truncate">{s.countries.join(", ")}</div></div>
                <div><div className="text-[10px] tracking-[0.3em] uppercase text-white/50">Next delivery</div><div>{s.status === "active" ? `${nextDays} days` : "—"}</div></div>
              </div>
              <div className="flex flex-wrap gap-2 pt-3 border-t border-white/10">
                {(["active", "paused", "cancelled"] as const).map((st) => (
                  <button key={st} onClick={() => updateStatus(s.id, st)} className={`rounded-full px-3 py-1 text-[10px] tracking-wider uppercase transition-colors ${s.status === st ? "bg-white text-black" : "liquid-glass glass-edge text-white/60"}`}>{st}</button>
                ))}
                <span className="text-white/30">|</span>
                {FREQUENCY_OPTIONS.map((f) => (
                  <button key={f} onClick={() => updateFreq(s.id, f)} className={`rounded-full px-3 py-1 text-[10px] tracking-wider uppercase transition-colors ${s.frequency === f ? "bg-white text-black" : "liquid-glass glass-edge text-white/60"}`}>{f}×/mo</button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Settings() {
  const wipe = () => {
    if (confirm("Wipe all backend data?")) {
      [
        "noir-db:customers",
        "noir-db:orders",
        "noir-db:products",
        "noir-db:custom-products",
        "noir-db:session",
        "noir-db:users",
        "noir-db:auth",
        "noir-db:seeded",
        "noir-db:subscriptions",
      ].forEach((k) => localStorage.removeItem(k));
      location.reload();
    }
  };
  const exportAll = () => {
    const dump = { customers: customersApi.list(), orders: ordersApi.list(), users: usersApi.list(), exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `noir-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="liquid-glass glass-edge rounded-3xl p-6">
        <div className="text-[10px] tracking-[0.3em] uppercase text-white/50 mb-2">Backend</div>
        <div className="font-display text-2xl">Browser-storage backend</div>
        <p className="text-sm text-white/65 mt-2 leading-relaxed">Data lives in localStorage. All changes persist across refreshes.</p>
        <button onClick={exportAll} className="mt-4 bg-white text-black rounded-full px-5 py-2.5 text-sm">Download backup</button>
      </div>
      <div className="liquid-glass glass-edge rounded-3xl p-6 border border-red-500/20">
        <div className="text-[10px] tracking-[0.3em] uppercase text-red-300/80 mb-2">Danger zone</div>
        <div className="font-display text-2xl">Wipe backend</div>
        <button onClick={wipe} className="mt-4 liquid-glass glass-edge rounded-full px-5 py-2.5 text-sm">Wipe everything</button>
      </div>
    </div>
  );
}
