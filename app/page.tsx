import { DualModeHome } from "@/components/home/DualModeHome";
import { getFilteredProducts, getProducts } from "@/lib/data";

type HomeProduct = {
  id: string;
  title: string;
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
  const [products, filteredProducts] = await Promise.all([
    getProducts() as Promise<HomeProduct[]>,
    getFilteredProducts({
      query: params?.q
    }) as Promise<HomeProduct[]>
  ]);
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
