"use client";

import { useEffect, useMemo, useState } from "react";
import { paymentMethods, demoLocations } from "@/lib/constants";
import { calculateCartTotals } from "@/lib/pricing";
import { CheckoutButton } from "@/components/cart/CheckoutButton";
import { CartItemActions } from "@/components/cart/CartItemActions";

type CartItem = {
  quantity: number;
  product: {
    id: string;
    title: string;
    price: number;
    frontImage: string;
    sideImage: string;
    backImage: string;
  };
};

export function CartClient({
  items,
  defaultLocation,
  defaultAddress
}: {
  items: CartItem[];
  defaultLocation?: string;
  defaultAddress?: string;
}) {
  const [location, setLocation] = useState(defaultLocation || "Kampala");
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const [couponCode, setCouponCode] = useState("");

  useEffect(() => {
    if (defaultLocation) {
      setLocation(defaultLocation);
    }
  }, [defaultLocation]);

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        return sum + item.product.price * item.quantity;
      }, 0),
    [items]
  );

  const totals = calculateCartTotals(subtotal, location, paymentMethod, couponCode);

  return (
    <section className="cart-layout">
      <div className="stack-card">
        <div className="section-header">
          <div>
            <span className="eyebrow">Cart</span>
            <h1>Review all product views before you pay</h1>
          </div>
        </div>

        {items.length === 0 ? (
          <p className="muted">Your cart is empty. Add products from the products page.</p>
        ) : (
          <div className="cart-items">
            {items.map((item) => (
              <article key={item.product.id} className="cart-item">
                <div className="cart-gallery">
                  <img src={item.product.frontImage} alt={`${item.product.title} front`} />
                  <img src={item.product.sideImage} alt={`${item.product.title} side`} />
                  <img src={item.product.backImage} alt={`${item.product.title} back`} />
                </div>
                <div>
                  <h3>{item.product.title}</h3>
                  <p>Quantity: {item.quantity}</p>
                  <p>Price: UGX {item.product.price.toLocaleString()}</p>
                  <CartItemActions productId={item.product.id} quantity={item.quantity} />
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <aside className="stack-card">
        <span className="eyebrow">Checkout</span>
        <h2>Payment and delivery</h2>

        <label>
          Delivery location
          <select value={location} onChange={(event) => setLocation(event.target.value)}>
            {demoLocations.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label>
          Shipping address
          <textarea rows={3} readOnly value={defaultAddress || "Add a shipping address in your profile."} />
        </label>

        <label>
          Payment method
          <select
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
          >
            {paymentMethods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </label>

        <label>
          Coupon code
          <input
            value={couponCode}
            onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
            placeholder="SHOPNET5 or SHOPNET10"
          />
        </label>

        <div className="price-box">
          <p>
            <span>Subtotal</span>
            <strong>UGX {totals.subtotal.toLocaleString()}</strong>
          </p>
          <p>
            <span>Delivery</span>
            <strong>UGX {totals.deliveryFee.toLocaleString()}</strong>
          </p>
          <p>
            <span>Discount</span>
            <strong>-UGX {totals.discountAmount.toLocaleString()}</strong>
          </p>
          <p>
            <span>Payment charge</span>
            <strong>UGX {totals.mobileMoneyCharge.toLocaleString()}</strong>
          </p>
          <p className="price-total">
            <span>Total</span>
            <strong>UGX {totals.total.toLocaleString()}</strong>
          </p>
        </div>

        <p className="muted">
          Totals update automatically based on the buyer location and selected payment
          option.
        </p>

        <CheckoutButton
          location={location}
          paymentMethod={paymentMethod}
          couponCode={couponCode}
          disabled={items.length === 0}
        />
      </aside>
    </section>
  );
}
