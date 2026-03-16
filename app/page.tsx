import Link from "next/link";
import { DualModeHome } from "@/components/home/DualModeHome";
import { getProducts } from "@/lib/data";

type HomeProduct = {
  id: string;
  ownerId: string;
  title: string;
  description?: string;
  category: string;
  price: number;
  frontImage: string;
};

export default async function HomePage({
  searchParams
}: {
  searchParams?: Promise<{
    q?: string;
  }>;
}) {
  const params = await searchParams;
  let products: HomeProduct[] = [];

  try {
    products = (await getProducts({ limit: 48, imageMode: "front" })) as HomeProduct[];
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load products right now.";

    return (
      <div className="stack-page">
        <section className="stack-card">
          <span className="eyebrow">Database</span>
          <h1>Unable to load products</h1>
          <p className="muted">
            ShopNet could not reach MongoDB. Check your Atlas network access and
            `MONGODB_URI`, then refresh this page.
          </p>
          <p className="muted">{message}</p>
          <Link href="/products" className="button button-secondary">
            Open products page
          </Link>
        </section>
      </div>
    );
  }

  const query = params?.q?.trim().toLowerCase() || "";
  const hasQuery = Boolean(query);
  const filteredProducts = hasQuery
    ? products.filter((product) =>
        [product.title, product.description || "", product.category]
          .join(" ")
          .toLowerCase()
          .includes(query)
      )
    : products;
  const noMatch = hasQuery && filteredProducts.length === 0;
  const activeProducts = noMatch ? products : filteredProducts;

  return (
    <DualModeHome
      products={activeProducts}
      query={params?.q}
      totalMatches={filteredProducts.length}
      noMatch={noMatch}
    />
  );
}
