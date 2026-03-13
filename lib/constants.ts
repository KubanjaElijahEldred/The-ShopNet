export const categories = [
  "Fashion",
  "Electronics",
  "Home",
  "Beauty",
  "Sports",
  "Books",
  "Groceries",
  "Accessories"
];

export const sizes = ["XS", "S", "M", "L", "XL", "XXL", "One Size"];

export const paymentMethods = [
  "Cash on Delivery",
  "Airtel Money",
  "MTN Mobile Money"
];

export const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating-desc", label: "Top Rated" }
];

export const orderStatuses = [
  "Pending",
  "Confirmed",
  "Packed",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Return Requested"
];

export const couponCodes: Record<string, number> = {
  SHOPNET5: 0.05,
  SHOPNET10: 0.1
};

export const deliveryFeesByRegion: Record<string, number> = {
  Kampala: 5000,
  Wakiso: 7000,
  Mukono: 9000,
  Entebbe: 10000,
  Jinja: 12000,
  Mbarara: 15000,
  Gulu: 18000,
  Other: 20000
};

export const demoLocations = Object.keys(deliveryFeesByRegion);
