import Link from "next/link";

export function Hero() {
  return (
    <section className="hero">
      <div className="hero-copy">
        <span className="eyebrow">Marketplace inspired by Amazon, Jumia, and Alibaba</span>
        <h1>Sell, discover, chat, and checkout in one connected ShopNet experience.</h1>
        <p>
          ShopNet lets users create strong accounts, list products with front, side,
          and back images, chat with guests, and calculate delivery-aware totals
          automatically.
        </p>
        <div className="hero-actions">
          <Link href="/auth" className="button">
            Create account
          </Link>
          <Link href="/products" className="button button-secondary">
            Explore products
          </Link>
        </div>
      </div>

      <div className="hero-grid">
        <div className="hero-panel warm">
          <strong>Seller tools</strong>
          <p>Category selector, size, rating, stock, and three product angles.</p>
        </div>
        <div className="hero-panel dark">
          <strong>Smart cart</strong>
          <p>Location-based totals with delivery and mobile money charges.</p>
        </div>
        <div className="hero-panel light">
          <strong>Guest chat</strong>
          <p>Visitors can contact sellers directly from the website.</p>
        </div>
      </div>
    </section>
  );
}
