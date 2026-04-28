import { useState } from "react";

const products = [
  {
    id: 1,
    name: "White Truffle Chips",
    origin: "Alba, Italy",
    price: 2499,
    description: "Hand-cut potato crisps infused with authentic Alba white truffle",
    category: "Savory",
  },
  {
    id: 2,
    name: "Yuzu Mochi Collection",
    origin: "Kyoto, Japan",
    price: 1899,
    description: "Delicate rice cakes filled with premium yuzu citrus cream",
    category: "Sweet",
  },
  {
    id: 3,
    name: "Oscietra Caviar Blinis",
    origin: "Caspian Sea",
    price: 4999,
    description: "Golden blinis paired with sustainably sourced Oscietra caviar",
    category: "Luxury",
  },
  {
    id: 4,
    name: "A5 Wagyu Jerky",
    origin: "Miyazaki, Japan",
    price: 3499,
    description: "Slow-dried A5 grade Wagyu beef with subtle umami seasoning",
    category: "Savory",
  },
  {
    id: 5,
    name: "Saffron Honey Almonds",
    origin: "Kashmir, India",
    price: 1299,
    description: "Roasted Marcona almonds glazed with Kashmiri saffron honey",
    category: "Sweet",
  },
  {
    id: 6,
    name: "Black Garlic Chocolate",
    origin: "Brussels, Belgium",
    price: 1699,
    description: "Single-origin dark chocolate with fermented black garlic",
    category: "Sweet",
  },
];

function formatPrice(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export default function App() {
  const [cart, setCart] = useState<typeof products>([]);

  const addToCart = (product: (typeof products)[0]) => {
    setCart((prev) => [...prev, product]);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-semibold tracking-tight">
            <span className="text-[var(--primary)]">NOIR</span>
          </h1>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#products" className="text-sm text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]">
              Collection
            </a>
            <a href="#about" className="text-sm text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]">
              About
            </a>
            <a href="#subscribe" className="text-sm text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]">
              Subscribe
            </a>
          </nav>
          <button className="relative rounded-full bg-[var(--secondary)] px-4 py-2 text-sm font-medium transition hover:bg-[var(--muted)]">
            Cart ({cart.length})
            {cart.length > 0 && (
              <span className="ml-2 text-[var(--primary)]">{formatPrice(cartTotal)}</span>
            )}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-24 md:py-32">
        <div className="mx-auto max-w-7xl text-center">
          <p className="mb-4 text-sm uppercase tracking-[0.2em] text-[var(--primary)]">
            Imported Luxury Snacks
          </p>
          <h2 className="mx-auto max-w-4xl text-4xl font-light leading-tight tracking-tight md:text-6xl lg:text-7xl">
            Curated indulgences from the{" "}
            <span className="italic text-[var(--primary)]">world&apos;s finest</span>{" "}
            artisans
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--muted-foreground)]">
            Truffle, caviar, yuzu, wagyu — discover rare flavors delivered to your door.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#products"
              className="rounded-full bg-[var(--primary)] px-8 py-3 text-sm font-semibold text-[var(--primary-foreground)] transition hover:opacity-90"
            >
              Shop Collection
            </a>
            <a
              href="#subscribe"
              className="rounded-full border border-[var(--border)] px-8 py-3 text-sm font-medium transition hover:bg-[var(--secondary)]"
            >
              Monthly Box — ₹4,999/mo
            </a>
          </div>
        </div>
        {/* Decorative gradient */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[var(--primary)]/10 via-transparent to-transparent" />
      </section>

      {/* Products */}
      <section id="products" className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h3 className="text-3xl font-light tracking-tight md:text-4xl">The Collection</h3>
            <p className="mt-3 text-[var(--muted-foreground)]">
              Each piece sourced directly from artisan producers
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <article
                key={product.id}
                className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 transition hover:border-[var(--primary)]/50"
              >
                <div className="mb-4 flex items-start justify-between">
                  <span className="rounded-full bg-[var(--secondary)] px-3 py-1 text-xs text-[var(--muted-foreground)]">
                    {product.category}
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)]">{product.origin}</span>
                </div>
                <h4 className="text-xl font-medium">{product.name}</h4>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
                  {product.description}
                </p>
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-lg font-semibold text-[var(--primary)]">
                    {formatPrice(product.price)}
                  </span>
                  <button
                    onClick={() => addToCart(product)}
                    className="rounded-full bg-[var(--secondary)] px-4 py-2 text-sm font-medium transition hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)]"
                  >
                    Add to Cart
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Subscribe */}
      <section id="subscribe" className="border-t border-[var(--border)] px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-sm uppercase tracking-[0.2em] text-[var(--primary)]">
            Monthly Subscription
          </span>
          <h3 className="mt-4 text-3xl font-light tracking-tight md:text-4xl">
            The NOIR Box
          </h3>
          <p className="mt-4 text-[var(--muted-foreground)]">
            A curated selection of 5-7 luxury snacks delivered monthly. Cancel anytime.
          </p>
          <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="text-left">
                <p className="text-3xl font-semibold">
                  ₹4,999<span className="text-lg font-normal text-[var(--muted-foreground)]">/month</span>
                </p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Free shipping • Skip or cancel anytime
                </p>
              </div>
              <button className="w-full rounded-full bg-[var(--primary)] px-8 py-3 text-sm font-semibold text-[var(--primary-foreground)] transition hover:opacity-90 md:w-auto">
                Start Subscription
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] px-6 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <p className="text-sm text-[var(--muted-foreground)]">
            © 2024 NOIR. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]">
              Privacy
            </a>
            <a href="#" className="text-sm text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]">
              Terms
            </a>
            <a href="#" className="text-sm text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
