import Link from "next/link";

type Product = {
  id: string;
  ownerId: string;
  title: string;
  category: string;
  price: number;
  rating: number;
  frontImage: string;
};

export function ProductCard({
  product
}: {
  product: Product;
}) {
  return (
    <article className="product-card">
      <img src={product.frontImage} alt={product.title} className="product-thumb" />
      <div className="product-copy">
        <span className="product-category-tag">{product.category}</span>
        <div className="product-card-heading">
          <h3>{product.title}</h3>
          <strong className="product-card-price">UGX {product.price.toLocaleString()}</strong>
        </div>
        <p className="product-card-rating">Rating {product.rating}/5</p>
        <div className="product-card-cta">
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
}
