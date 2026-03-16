import { DualModeHome } from "@/components/home/DualModeHome";
import { getProducts } from "@/lib/data";

type HomeProduct = {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  frontImage: string;
  createdAt?: string;
  rating: number;
};

function getHomepageProducts(products: HomeProduct[], query?: string) {
  const normalizedQuery = query?.toLowerCase().trim();

  if (!normalizedQuery) {
    return products;
  }

  const filtered = products.filter((product) =>
    [product.title, product.description, product.category]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery)
  );

  return filtered.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

export default async function HomePage({
  searchParams
}: {
  searchParams?: Promise<{
    q?: string;
  }>;
}) {
  const [params, products] = await Promise.all([
    searchParams,
    getProducts() as Promise<HomeProduct[]>
  ]);
  const filteredProducts = getHomepageProducts(products, params?.q);
  const hasQuery = Boolean(params?.q?.trim());
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
