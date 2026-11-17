export type PaymentMethodId = "bacs" | "cheque" | "cod";

// Offline methods only (no real payments). Ids match `place_order`.
export const PAYMENT_METHODS: {
  id: PaymentMethodId;
  label: string;
  description: string;
}[] = [
  {
    id: "bacs",
    label: "Direct bank transfer",
    description:
      "Make your payment directly into our bank account. Please use your Order ID as the payment reference. Your order will not be shipped until the funds have cleared in our account.",
  },
  {
    id: "cheque",
    label: "Check payments",
    description:
      "Please send a check to Store Name, Store Street, Store Town, Store State / County, Store Postcode.",
  },
  {
    id: "cod",
    label: "Cash on delivery",
    description: "Pay with cash upon delivery.",
  },
];

export const paymentLabel = (id: string) =>
  PAYMENT_METHODS.find((m) => m.id === id)?.label ?? id;
