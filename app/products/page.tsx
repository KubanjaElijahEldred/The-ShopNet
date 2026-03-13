import Link from "next/link";
import { AddProductForm } from "@/components/forms/AddProductForm";
import { getFilteredProducts, getReviewSummaryMap } from "@/lib/data";
import { categories, sortOptions } from "@/lib/constants";
import { getSessionUser } from "@/lib/session";

export default async function ProductsPage({
  searchParams
}: {
  searchParams?: Promise<{
    q?: string;
    category?: string;
    sort?: string;
  }>;
}) {
  const user = await getSessionUser();
  const params = await searchParams;
  const products = await getFilteredProducts({
    query: params?.q,
    category: params?.category,
    sortBy: params?.sort
  });
  const reviewMap = await getReviewSummaryMap();

  return (
    <div className="stack-page">
      <section className="stack-card">
        <span className="eyebrow">Products</span>
        <h1>Browse the ShopNet marketplace</h1>
        <p className="muted">
          Select any product to open its full page, view all angles, and discover
          more items in common.
        </p>
      </section>

      <form className="stack-card filters-bar" action="/products">
        <label>
          Search
          <input
            name="q"
            placeholder="Search products, categories, or descriptions"
            defaultValue={params?.q || ""}
          />
        </label>

        <label>
          Category
          <select name="category" defaultValue={params?.category || ""}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label>
          Sort
          <select name="sort" defaultValue={params?.sort || "newest"}>
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button className="button" type="submit">
          Apply
        </button>
      </form>

      {user ? <AddProductForm /> : null}

      <section className="product-catalog-grid">
        {products.map((product) => {
          const summary = reviewMap.get(product.id);

          return (
            <article key={product.id} className="catalog-card">
              <img src={product.frontImage} alt={product.title} className="catalog-thumb" />
              <div className="catalog-copy">
                <span className="product-category-tag">{product.category}</span>
                <div className="product-card-heading">
                  <h2>{product.title}</h2>
                  <strong className="product-card-price">
                    UGX {product.price.toLocaleString()}
                  </strong>
                </div>
                <p className="product-card-rating">
                  Seller rating {product.rating}/5
                  {summary
                    ? ` · Reviews ${summary.averageRating.toFixed(1)} (${summary.reviewCount})`
                    : ""}
                </p>
                <div className="catalog-meta compact">
                  <span>Size: {product.size}</span>
                  <span>Stock: {product.stock}</span>
                </div>
                <div className="catalog-footer">
                  <Link className="product-card-button" href={`/products/${product.id}`}>
                    Add to Cart
                  </Link>
                  <Link
                    className="product-card-icon product-card-chat-trigger"
                    href={`/chat?productId=${product.id}`}
                    aria-label={`Chat about ${product.title}`}
                  >
                    💬
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
