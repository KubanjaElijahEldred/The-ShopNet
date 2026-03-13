import { couponCodes, deliveryFeesByRegion } from "@/lib/constants";

export function getDeliveryFee(location?: string) {
  if (!location) {
    return deliveryFeesByRegion.Other;
  }

  return deliveryFeesByRegion[location] ?? deliveryFeesByRegion.Other;
}

export function calculateCartTotals(
  subtotal: number,
  location?: string,
  paymentMethod?: string,
  couponCode?: string
) {
  const deliveryFee = getDeliveryFee(location);
  const mobileMoneyCharge =
    paymentMethod && paymentMethod !== "Cash on Delivery"
      ? Math.round(subtotal * 0.015)
      : 0;
  const normalizedCoupon = couponCode?.trim().toUpperCase() || "";
  const discountRate = couponCodes[normalizedCoupon] || 0;
  const discountAmount = Math.round(subtotal * discountRate);

  return {
    subtotal,
    deliveryFee,
    discountAmount,
    mobileMoneyCharge,
    total: subtotal + deliveryFee + mobileMoneyCharge - discountAmount
  };
}
