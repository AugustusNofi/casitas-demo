export type Currency = "EUR" | "GBP" | "USD";

export type Destination =
  | "costa-brava"
  | "andalucia"
  | "algarve"
  | "sardinia"
  | "greek-islands";

export interface Listing {
  id: string;
  destination: Destination;
  destinationLabel: string;
  title: string;
  type: "Apartamento" | "Villa" | "Casa rural";
  pricePerNightEur: number;
  rating: number;
  reviewCount: number;
  maxGuests: number;
  bedrooms: number;
  freeCancellation: boolean;
  amenities: Array<"pool" | "pet-friendly" | "sea-view" | "wifi" | "kitchen" | "parking">;
  images: string[];
  description: string;
  hostName: string;
}

export type BookingStatus =
  | "pending"
  | "deposit_paid"
  | "paid_in_full"
  | "hold_active"
  | "hold_released"
  | "hold_claimed"
  | "refunded"
  | "partially_refunded"
  | "cancelled";

export type PaymentFlow = "instant" | "deposit" | "security_deposit";
export type OpenOrderMode = PaymentFlow;

export interface TimelineEvent {
  id: string;
  bookingId: string;
  type:
    | "booking_created"
    | "authorized"
    | "captured"
    | "settled"
    | "deposit_charged"
    | "balance_scheduled"
    | "balance_charged"
    | "hold_placed"
    | "hold_released"
    | "hold_claimed"
    | "refunded"
    | "cancelled"
    | "dmn_received";
  label: string;
  detail?: string;
  amount?: number;
  currency?: Currency;
  transactionId?: string;
  source: "guest" | "admin" | "system" | "nuvei_dmn";
  createdAt: string;
}

export interface Booking {
  id: string;
  listingId: string;
  listingTitle: string;
  guestName: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  currency: Currency;
  totalAmount: number;
  status: BookingStatus;
  flow: PaymentFlow;
  pendingIntent?: "instant" | "deposit" | "security_deposit";

  // Flow 2 — deposit + balance
  depositAmount?: number;
  balanceAmount?: number;
  balanceScheduledFor?: string;
  balanceChargedAt?: string;
  userTokenId?: string;
  userPaymentOptionId?: string;
  cardLast4?: string;
  cardBrand?: string;

  // Flow 3 — security deposit hold
  securityDepositAmount?: number;
  holdTransactionId?: string;

  // Flow 4 — cancellation
  freeCancellationUntil: string;
  cancellationPolicyPct: number; // % refunded if cancelled after the free window
  refundedAmount?: number;

  // Nuvei references
  transactionIds: Record<string, string>;

  createdAt: string;
  updatedAt: string;
}
