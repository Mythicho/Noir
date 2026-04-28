/**
 * NOIR ISOMORPHIC DATABASE ADAPTER
 * 
 * Synchronous local-first storage adapter. 
 * Allows the entire site to run inside the browser without errors.
 * 
 * TO PLUG IN THE PRODUCTION SERVER IN THE FUTURE:
 * In a real backend deployment, you would replace these methods with
 * async/fetch calls (see server/payments_stripe_example.js). To keep
 * this single-file app perfectly functional out of the box, all methods
 * here operate synchronously on localStorage.
 */

import { PRODUCTS, type Product } from "../data/products";

export type CustomerProfile = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  pin: string;
  notes: string;
  photo: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  address: string;
  city: string;
  pin: string;
  notes: string;
  photo: string;
  isAdmin: boolean;
  createdAt: string;
};

export type OrderItem = {
  id: string;
  name: string;
  price: number;
  origin: string;
  image: string;
  qty: number;
};

export type OrderStatus =
  | "Placed"
  | "Sourcing"
  | "Imported"
  | "Out for delivery"
  | "Delivered"
  | "Cancelled"
  | "Pending_Payment";

export type Order = {
  id: string;
  email: string;
  customer: CustomerProfile;
  items: OrderItem[];
  subtotal: number;
  handling: number;
  total: number;
  status: OrderStatus;
  placedAt: string;
  updatedAt: string;
  trackingId: string;
  notes: string;
  paymentMethod: string;
};

export type Customer = CustomerProfile & {
  id: string;
  createdAt: string;
  lastOrderAt: string | null;
  ordersCount: number;
  lifetimeValue: number;
};

export type SubscriptionPlan = "monthly" | "yearly";
export type SubscriptionStatus = "active" | "paused" | "cancelled";

export type Subscription = {
  id: string;
  email: string;
  customerName: string;
  budget: number;
  plan: SubscriptionPlan;
  frequency: number;
  countries: string[];
  status: SubscriptionStatus;
  startedAt: string;
  nextDelivery: string;
  boxesDelivered: number;
  cancelledAt: string | null;
  pausedAt: string | null;
  notes: string;
};

const DB = {
  customers: "noir-db:customers",
  orders: "noir-db:orders",
  products: "noir-db:products",
  session: "noir-db:session",
  users: "noir-db:users",
  auth: "noir-db:auth",
  subscriptions: "noir-db:subscriptions",
};

function read<T>(key: string, fallback: T): T {
  try {
    const r = localStorage.getItem(key);
    return r ? (JSON.parse(r) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("noir-db:update", { detail: { key } }));
}
function uid(p: string) {
  return `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export const ORDER_STATUSES: OrderStatus[] = [
  "Placed",
  "Sourcing",
  "Imported",
  "Out for delivery",
  "Delivered",
  "Cancelled",
  "Pending_Payment",
];
export const PROGRESS_STEPS: OrderStatus[] = [
  "Placed",
  "Sourcing",
  "Imported",
  "Out for delivery",
  "Delivered",
];
export const COUNTRY_OPTIONS = ["Japan", "South Korea", "USA", "Mexico", "Germany", "UK", "France", "Thailand", "Italy", "Australia"];
export const FREQUENCY_OPTIONS = [1, 2, 3];
export const MIN_SUB_PRICE = 499;

/* ── PRODUCTS ── */
export const productsApi = {
  list(): Product[] {
    const overrides = read<Record<string, Partial<Product>>>(DB.products, {});
    const custom = read<Product[]>("noir-db:custom-products", []);
    const base = PRODUCTS.map((p) => ({ ...p, ...(overrides[p.id] || {}) }));
    return [...base, ...custom].filter((p) => !p._deleted);
  },
  get(id: string) {
    return productsApi.list().find((p) => p.id === id);
  },
  update(id: string, patch: Partial<Product>) {
    const custom = read<Product[]>("noir-db:custom-products", []);
    const customIdx = custom.findIndex((p) => p.id === id);
    if (customIdx >= 0) {
      custom[customIdx] = { ...custom[customIdx], ...patch };
      write("noir-db:custom-products", custom);
      return;
    }
    const o = read<Record<string, Partial<Product>>>(DB.products, {});
    o[id] = { ...(o[id] || {}), ...patch };
    write(DB.products, o);
  },
  create(product: Omit<Product, "id">): Product {
    const custom = read<Product[]>("noir-db:custom-products", []);
    const newProduct: Product = {
      ...product,
      id: `prod_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    };
    custom.push(newProduct);
    write("noir-db:custom-products", custom);
    return newProduct;
  },
  delete(id: string) {
    const custom = read<Product[]>("noir-db:custom-products", []);
    const customIdx = custom.findIndex((p) => p.id === id);
    if (customIdx >= 0) {
      custom.splice(customIdx, 1);
      write("noir-db:custom-products", custom);
      return;
    }
    const o = read<Record<string, Partial<Product>>>(DB.products, {});
    o[id] = { ...(o[id] || {}), _deleted: true } as Partial<Product>;
    write(DB.products, o);
  },
};

/* ── CUSTOMERS ── */
export const customersApi = {
  list(): Customer[] {
    return read<Customer[]>(DB.customers, []);
  },
  upsert(profile: CustomerProfile): Customer {
    const list = customersApi.list();
    const ex = list.find((c) => c.email.toLowerCase() === profile.email.toLowerCase() && profile.email);
    const now = new Date().toISOString();
    if (ex) {
      Object.assign(ex, profile);
      write(DB.customers, list);
      return ex;
    }
    const c: Customer = { ...profile, id: uid("cus"), createdAt: now, lastOrderAt: null, ordersCount: 0, lifetimeValue: 0 };
    list.push(c);
    write(DB.customers, list);
    return c;
  },
  remove(id: string) {
    write(DB.customers, customersApi.list().filter((c) => c.id !== id));
  },
};

/* ── USERS (AUTHENTICATION) ── */
export const usersApi = {
  list(): User[] {
    return read<User[]>(DB.users, []);
  },
  signup(d: any): User | { error: string } {
    const users = this.list();
    if (users.find((u) => u.email.toLowerCase() === d.email.toLowerCase())) {
      return { error: "An account with this email already exists." };
    }
    const isAdmin = d.email.toLowerCase() === "mythicho" && d.password === "noiradmin";
    const user: User = {
      id: uid("usr"), name: d.name, email: d.email, password: d.password, phone: d.phone || "",
      address: d.address || "", city: d.city || "", pin: d.pin || "", notes: "", photo: "",
      isAdmin, createdAt: new Date().toISOString(),
    };
    users.push(user);
    write(DB.users, users);
    write(DB.auth, { userId: user.id, email: user.email, isAdmin: user.isAdmin });
    customersApi.upsert(user);
    return user;
  },
  login(email: string, password: string): User | { error: string } {
    const isMagicAdmin = email.toLowerCase() === "mythicho" && password === "noiradmin";
    if (isMagicAdmin) {
      let admin = this.list().find((u) => u.email.toLowerCase() === "mythicho");
      if (!admin) {
        const users = this.list();
        admin = {
          id: uid("usr"), name: "Mythic Admin", email: "mythicho", password: "noiradmin",
          phone: "", address: "", city: "", pin: "", notes: "", photo: "", isAdmin: true, createdAt: new Date().toISOString(),
        };
        users.push(admin);
        write(DB.users, users);
      }
      write(DB.auth, { userId: admin.id, email: admin.email, isAdmin: true });
      return admin;
    }
    const user = this.list().find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) return { error: "Invalid email or password." };
    write(DB.auth, { userId: user.id, email: user.email, isAdmin: user.isAdmin });
    return user;
  },
  getAuth() {
    return read<{ userId: string; email: string; isAdmin: boolean } | null>(DB.auth, null);
  },
  getCurrentUser(): User | null {
    const a = this.getAuth();
    if (!a) return null;
    return this.list().find((u) => u.id === a.userId) || null;
  },
  logout() {
    localStorage.removeItem(DB.auth);
    window.dispatchEvent(new CustomEvent("noir-db:update", { detail: { key: DB.auth } }));
  },
  updateProfile(id: string, patch: Partial<User>) {
    const users = this.list();
    const i = users.findIndex((u) => u.id === id);
    if (i >= 0) {
      users[i] = { ...users[i], ...patch };
      write(DB.users, users);
    }
  },
};

/* ── ORDERS ── */
export const ordersApi = {
  list(): Order[] {
    return read<Order[]>(DB.orders, []).sort((a, b) => +new Date(b.placedAt) - +new Date(a.placedAt));
  },
  byEmail(email: string): Order[] {
    return ordersApi.list().filter((o) => o.email.toLowerCase() === email.toLowerCase());
  },
  create(input: {
    email: string;
    customer: CustomerProfile;
    items: OrderItem[];
    handling: number;
    notes?: string;
    paymentMethod?: string;
  }): Order {
    const subtotal = input.items.reduce((s, it) => s + it.price * it.qty, 0);
    const now = new Date().toISOString();
    const order: Order = {
      id: `NOIR-${Date.now().toString().slice(-7)}`, email: input.email, customer: input.customer,
      items: input.items, subtotal, handling: input.handling, total: subtotal + input.handling,
      status: input.paymentMethod === "Cash on Delivery" ? "Placed" : "Pending_Payment",
      placedAt: now, updatedAt: now, 
      trackingId: input.paymentMethod === "Cash on Delivery" ? `TRK${Math.random().toString(36).slice(2, 10).toUpperCase()}` : "TRK_AWAITING_PAYMENT",
      notes: input.notes || "", paymentMethod: input.paymentMethod || "Cash on Delivery",
    };
    const all = read<Order[]>(DB.orders, []);
    all.unshift(order);
    write(DB.orders, all);
    
    const cus = customersApi.upsert(input.customer);
    const cl = customersApi.list();
    const ci = cl.findIndex((c) => c.id === cus.id);
    if (ci >= 0) {
      cl[ci].ordersCount += 1;
      cl[ci].lifetimeValue += order.total;
      cl[ci].lastOrderAt = now;
      write(DB.customers, cl);
    }

    // MOCK PAYMENT WEBHOOK (For non-COD payments, we simulate the payment completing 1.5s later)
    if (input.paymentMethod !== "Cash on Delivery") {
      setTimeout(() => {
        const freshOrders = read<Order[]>(DB.orders, []);
        const target = freshOrders.find((o) => o.id === order.id);
        if (target && target.status === "Pending_Payment") {
          target.status = "Placed";
          target.trackingId = `TRK${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
          target.updatedAt = new Date().toISOString();
          write(DB.orders, freshOrders);
        }
      }, 1500);
    }

    return order;
  },
  updateStatus(id: string, status: OrderStatus) {
    const all = read<Order[]>(DB.orders, []);
    const o = all.find((x) => x.id === id);
    if (!o) return;
    o.status = status;
    o.updatedAt = new Date().toISOString();
    write(DB.orders, all);
  },
  remove(id: string) {
    write(DB.orders, read<Order[]>(DB.orders, []).filter((o) => o.id !== id));
  },
};

/* ── SUBSCRIPTIONS ── */
export const subscriptionsApi = {
  list(): Subscription[] {
    return read<Subscription[]>(DB.subscriptions, []).sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt));
  },
  byEmail(email: string): Subscription[] {
    return subscriptionsApi.list().filter((s) => s.email.toLowerCase() === email.toLowerCase());
  },
  create(input: {
    email: string;
    customerName: string;
    budget: number;
    plan: SubscriptionPlan;
    frequency: number;
    countries: string[];
    notes?: string;
  }): Subscription {
    const now = new Date();
    const next = new Date(now);
    next.setDate(next.getDate() + Math.ceil(30 / input.frequency));
    const sub: Subscription = {
      id: `SUB-${Date.now().toString().slice(-7)}`, email: input.email, customerName: input.customerName,
      budget: input.budget, plan: input.plan, frequency: input.frequency, countries: input.countries,
      status: "active", startedAt: now.toISOString(), nextDelivery: next.toISOString(),
      boxesDelivered: 0, cancelledAt: null, pausedAt: null, notes: input.notes || "",
    };
    const all = read<Subscription[]>(DB.subscriptions, []);
    all.unshift(sub);
    write(DB.subscriptions, all);
    return sub;
  },
  updateStatus(id: string, status: SubscriptionStatus) {
    const all = read<Subscription[]>(DB.subscriptions, []);
    const s = all.find((x) => x.id === id);
    if (!s) return;
    s.status = status;
    if (status === "cancelled") s.cancelledAt = new Date().toISOString();
    if (status === "paused") s.pausedAt = new Date().toISOString();
    if (status === "active") { s.pausedAt = null; s.cancelledAt = null; }
    write(DB.subscriptions, all);
  },
  updateFrequency(id: string, frequency: number) {
    const all = read<Subscription[]>(DB.subscriptions, []);
    const s = all.find((x) => x.id === id);
    if (!s) return;
    s.frequency = frequency;
    const next = new Date();
    next.setDate(next.getDate() + Math.ceil(30 / frequency));
    s.nextDelivery = next.toISOString();
    write(DB.subscriptions, all);
  },
};

/* ── SESSION ── */
export const sessionApi = {
  get(): CustomerProfile | null { return read<CustomerProfile | null>(DB.session, null); },
  set(profile: CustomerProfile) { write(DB.session, profile); customersApi.upsert(profile); },
  clear() { localStorage.removeItem(DB.session); },
};

/* ── ANALYTICS ── */
export const analyticsApi = {
  summary() {
    const orders = ordersApi.list();
    const customers = customersApi.list();
    const subs = subscriptionsApi.list();
    const revenue = orders.filter(o => o.status !== "Cancelled" && o.status !== "Pending_Payment").reduce((s, o) => s + o.total, 0);
    const pending = orders.filter((o) => o.status !== "Delivered" && o.status !== "Cancelled" && o.status !== "Pending_Payment").length;
    const aov = orders.length ? Math.round(revenue / orders.length) : 0;
    const today = new Date().toDateString();
    const ordersToday = orders.filter((o) => new Date(o.placedAt).toDateString() === today).length;
    const subsActive = subs.filter((s) => s.status === "active").length;
    const subsMRR = subs.filter((s) => s.status === "active").reduce((s, sub) => s + (sub.plan === "yearly" ? Math.round(sub.budget * 0.9) : sub.budget), 0);

    return { revenue, orderCount: orders.length, customerCount: customers.length, pending, aov, ordersToday, subsActive, subsMRR, subsTotal: subs.length };
  },
  topProducts(limit = 5) {
    const counts: Record<string, { name: string; qty: number; revenue: number; image: string }> = {};
    ordersApi.list().forEach((o) =>
      o.items.forEach((it) => {
        if (!counts[it.id]) counts[it.id] = { name: it.name, qty: 0, revenue: 0, image: it.image };
        counts[it.id].qty += it.qty; counts[it.id].revenue += it.price * it.qty;
      })
    );
    return Object.entries(counts).map(([id, v]) => ({ id, ...v })).sort((a, b) => b.revenue - a.revenue).slice(0, limit);
  },
  revenueLast14Days() {
    const buckets: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      buckets[d.toISOString().slice(0, 10)] = 0;
    }
    ordersApi.list().forEach((o) => {
      const day = o.placedAt.slice(0, 10);
      if (day in buckets) buckets[day] += o.total;
    });
    return Object.entries(buckets).map(([date, value]) => ({ date, value }));
  },
};

/* ── SEED DEMO DATA ── */
const SEED_KEY = "noir-db:seeded";
export function seedDemoData() {
  if (localStorage.getItem(SEED_KEY)) return;
  localStorage.setItem(SEED_KEY, "1");

  const demoCustomers: CustomerProfile[] = [
    { name: "Aarav Mehta", email: "aarav@example.com", phone: "+91 98201 12345", address: "Flat 14B, Marine Drive", city: "Mumbai", pin: "400020", notes: "Buzz twice.", photo: "" },
    { name: "Sara Khan", email: "sara@example.com", phone: "+91 99887 22113", address: "House 7, Jubilee Hills", city: "Hyderabad", pin: "500033", notes: "Leave at door.", photo: "" },
  ];

  const prods = productsApi.list();
  demoCustomers.forEach((c) => customersApi.upsert(c));

  ordersApi.create({ email: demoCustomers[0].email, customer: demoCustomers[0], items: [{ ...prods[0], qty: 2 } as OrderItem, { ...prods[2], qty: 1 } as OrderItem], handling: 299, paymentMethod: "UPI" });
  ordersApi.create({ email: demoCustomers[1].email, customer: demoCustomers[1], items: [{ ...prods[1], qty: 3 } as OrderItem], handling: 299, paymentMethod: "Credit/Debit Card" });

  const orders = read<Order[]>(DB.orders, []);
  if (orders.length) { orders[0].status = "Delivered"; write(DB.orders, orders); }
  if (orders.length > 1) { orders[1].status = "Sourcing"; write(DB.orders, orders); }

  const users = usersApi.list();
  if (!users.find((u) => u.email === "aarav@example.com")) {
    users.push({ id: uid("usr"), name: "Aarav Mehta", email: "aarav@example.com", password: "aarav123", phone: "+91 98201 12345", address: "Flat 14B, Marine Drive", city: "Mumbai", pin: "400020", notes: "", photo: "", isAdmin: false, createdAt: new Date().toISOString() });
  }
  if (!users.find((u) => u.email.toLowerCase() === "mythicho")) {
    users.push({ id: uid("usr"), name: "Mythic Admin", email: "mythicho", password: "noiradmin", phone: "", address: "", city: "", pin: "", notes: "", photo: "", isAdmin: true, createdAt: new Date().toISOString() });
  }
  write(DB.users, users);
}
