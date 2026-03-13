import { CartClient } from "@/components/cart/CartClient";
import { getCartItems } from "@/lib/data";
import { getSessionUser } from "@/lib/session";

export default async function CartPage() {
  const user = await getSessionUser();
  const items = user ? await getCartItems(user.id) : [];

  return (
    <CartClient
      items={items}
      defaultLocation={user?.location}
      defaultAddress={user?.shippingAddress}
    />
  );
}
