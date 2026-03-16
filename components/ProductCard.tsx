import Link from "next/link";
import { AddToCartButton } from "@/components/cart/AddToCartButton";

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
      <Link href={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <img src={product.frontImage} alt={product.title} className="product-thumb" />
      </Link>
      <div className="product-copy">
        <span className="product-category-tag">{product.category}</span>
        <div className="product-card-heading">
          <Link href={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <h3>{product.title}</h3>
          </Link>
          <strong className="product-card-price">UGX {product.price.toLocaleString()}</strong>
        </div>
        <p className="product-card-rating">Rating {product.rating}/5</p>
        <div className="product-card-cta">
          <div style={{ flex: 1 }}>
              <AddToCartButton productId={product.id} className="product-card-button" />
          </div>
          <Link
            className="product-card-icon product-card-chat-trigger"
            href={{
              pathname: "/chat",
              query: { productId: product.id, ownerId: product.ownerId }
            }}
            aria-label={`Chat about ${product.title}`}
          >
            💬
          </Link>
        </div>
      </div>
    </article>
  );
}
