import type { Booking, Listing, TimelineEvent } from "./types";

export const DESTINATIONS: Array<{ id: Listing["destination"]; label: string; blurb: string }> = [
  { id: "costa-brava", label: "Costa Brava", blurb: "Calas turquesa y pueblos con encanto" },
  { id: "andalucia", label: "Andalucía", blurb: "Patios blancos y pueblos de montaña" },
  { id: "algarve", label: "Algarve", blurb: "Acantilados dorados y playas infinitas" },
  { id: "sardinia", label: "Cerdeña", blurb: "Aguas cristalinas y campiña mediterránea" },
  { id: "greek-islands", label: "Islas Griegas", blurb: "Casas cícladas frente al Egeo" },
];

export function getFixtureListings(): Listing[] {
  return [
    {
      id: "cb-apartment-01",
      destination: "costa-brava",
      destinationLabel: "Costa Brava",
      title: "Apartamento con balcón frente al mar",
      type: "Apartamento",
      pricePerNightEur: 118,
      rating: 4.8,
      reviewCount: 214,
      maxGuests: 4,
      bedrooms: 2,
      freeCancellation: true,
      amenities: ["sea-view", "wifi", "kitchen"],
      images: ["/images/costa-brava-apartment-interior.jpg", "/images/hero-banner.jpg"],
      description:
        "Luminoso apartamento a dos minutos a pie de la cala, con balcón privado y vistas al Mediterráneo. Ideal para desconectar en pareja o en familia.",
      hostName: "Marta",
    },
    {
      id: "cb-villa-01",
      destination: "costa-brava",
      destinationLabel: "Costa Brava",
      title: "Villa con piscina privada sobre la cala",
      type: "Villa",
      pricePerNightEur: 295,
      rating: 4.9,
      reviewCount: 96,
      maxGuests: 8,
      bedrooms: 4,
      freeCancellation: true,
      amenities: ["pool", "sea-view", "wifi", "parking"],
      images: ["/images/costa-brava-villa-pool.jpg", "/images/hero-banner.jpg"],
      description:
        "Villa exclusiva con piscina infinita, terrazas escalonadas y acceso directo a una cala rocosa. Perfecta para grupos que buscan intimidad y vistas de postal.",
      hostName: "Jordi",
    },
    {
      id: "and-casa-01",
      destination: "andalucia",
      destinationLabel: "Andalucía",
      title: "Casa rural con patio andaluz",
      type: "Casa rural",
      pricePerNightEur: 96,
      rating: 4.7,
      reviewCount: 178,
      maxGuests: 6,
      bedrooms: 3,
      freeCancellation: true,
      amenities: ["pet-friendly", "wifi", "kitchen", "parking"],
      images: ["/images/andalucia-casa-rural-courtyard.jpg", "/images/andalucia-white-village-house.jpg"],
      description:
        "Casa tradicional restaurada con un patio interior lleno de geranios y una fuente central. A pasos de la plaza del pueblo blanco.",
      hostName: "Rocío",
    },
    {
      id: "and-house-01",
      destination: "andalucia",
      destinationLabel: "Andalucía",
      title: "Casa blanca en pueblo con encanto",
      type: "Casa rural",
      pricePerNightEur: 84,
      rating: 4.6,
      reviewCount: 132,
      maxGuests: 4,
      bedrooms: 2,
      freeCancellation: false,
      amenities: ["pet-friendly", "wifi", "parking"],
      images: ["/images/andalucia-white-village-house.jpg", "/images/andalucia-casa-rural-courtyard.jpg"],
      description:
        "Casa encalada en una calle empedrada de un pueblo blanco, con macetas de flores en cada balcón y un ambiente auténticamente andaluz.",
      hostName: "Rocío",
    },
    {
      id: "alg-villa-01",
      destination: "algarve",
      destinationLabel: "Algarve",
      title: "Villa moderna con piscina infinita",
      type: "Villa",
      pricePerNightEur: 340,
      rating: 4.9,
      reviewCount: 154,
      maxGuests: 8,
      bedrooms: 4,
      freeCancellation: true,
      amenities: ["pool", "sea-view", "wifi", "parking"],
      images: ["/images/algarve-villa-infinity-pool.jpg", "/images/algarve-apartment-bright-interior.jpg"],
      description:
        "Arquitectura minimalista frente a los acantilados del Algarve, con una piscina infinita que parece fundirse con el océano.",
      hostName: "Miguel",
    },
    {
      id: "alg-apartment-01",
      destination: "algarve",
      destinationLabel: "Algarve",
      title: "Apartamento luminoso junto a la playa",
      type: "Apartamento",
      pricePerNightEur: 102,
      rating: 4.5,
      reviewCount: 201,
      maxGuests: 3,
      bedrooms: 1,
      freeCancellation: true,
      amenities: ["sea-view", "wifi", "kitchen"],
      images: ["/images/algarve-apartment-bright-interior.jpg", "/images/algarve-villa-infinity-pool.jpg"],
      description:
        "Apartamento acogedor con maderas claras y textiles artesanales, a un corto paseo de las mejores playas del Algarve.",
      hostName: "Miguel",
    },
    {
      id: "srd-villa-01",
      destination: "sardinia",
      destinationLabel: "Cerdeña",
      title: "Villa de piedra con pérgola y viñedo",
      type: "Villa",
      pricePerNightEur: 210,
      rating: 4.8,
      reviewCount: 88,
      maxGuests: 6,
      bedrooms: 3,
      freeCancellation: true,
      amenities: ["pool", "pet-friendly", "wifi", "parking"],
      images: ["/images/sardinia-villa-pergola.jpg", "/images/sardinia-seaview-terrace.jpg"],
      description:
        "Villa de piedra rodeada de pinos y viñedos, con una pérgola cubierta de vid perfecta para cenas al aire libre.",
      hostName: "Elena",
    },
    {
      id: "srd-terrace-01",
      destination: "sardinia",
      destinationLabel: "Cerdeña",
      title: "Apartamento con terraza y vistas al mar",
      type: "Apartamento",
      pricePerNightEur: 128,
      rating: 4.7,
      reviewCount: 143,
      maxGuests: 4,
      bedrooms: 2,
      freeCancellation: true,
      amenities: ["sea-view", "wifi", "kitchen"],
      images: ["/images/sardinia-seaview-terrace.jpg", "/images/sardinia-villa-pergola.jpg"],
      description:
        "Terraza privada sobre los acantilados de granito, con vistas al mar turquesa de Cerdeña desde el café de la mañana.",
      hostName: "Elena",
    },
    {
      id: "gr-cycladic-01",
      destination: "greek-islands",
      destinationLabel: "Islas Griegas",
      title: "Casa cícladas de estilo clásico",
      type: "Casa rural",
      pricePerNightEur: 156,
      rating: 4.9,
      reviewCount: 167,
      maxGuests: 5,
      bedrooms: 2,
      freeCancellation: true,
      amenities: ["sea-view", "wifi", "kitchen"],
      images: ["/images/greek-island-cycladic-house.jpg", "/images/greek-island-poolside-sea-view.jpg"],
      description:
        "Casa cúbica encalada con puertas y postigos azul cielo, escalones de piedra y el Egeo asomando al fondo de la calle.",
      hostName: "Dimitra",
    },
    {
      id: "gr-pool-01",
      destination: "greek-islands",
      destinationLabel: "Islas Griegas",
      title: "Terraza con piscina privada frente al Egeo",
      type: "Villa",
      pricePerNightEur: 265,
      rating: 4.9,
      reviewCount: 121,
      maxGuests: 6,
      bedrooms: 3,
      freeCancellation: false,
      amenities: ["pool", "sea-view", "wifi", "parking"],
      images: ["/images/greek-island-poolside-sea-view.jpg", "/images/greek-island-cycladic-house.jpg"],
      description:
        "Piscina privada en una terraza encalada con vistas a las islas vecinas. El lugar perfecto para ver el atardecer del Egeo.",
      hostName: "Dimitra",
    },
  ];
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function getFixtureBookings(): Array<{ booking: Booking; events: TimelineEvent[] }> {
  const now = new Date().toISOString();

  const mk = (
    id: string,
    listingId: string,
    listingTitle: string,
    status: Booking["status"],
    flow: Booking["flow"],
    extra: Partial<Booking> = {}
  ): Booking => ({
    id,
    listingId,
    listingTitle,
    guestName: extra.guestName || "Laura Gómez",
    guestEmail: extra.guestEmail || "laura.gomez@example.com",
    checkIn: daysFromNow(14),
    checkOut: daysFromNow(19),
    guests: 2,
    nights: 5,
    currency: "EUR",
    totalAmount: 590,
    status,
    flow,
    freeCancellationUntil: daysFromNow(7),
    cancellationPolicyPct: 50,
    transactionIds: {},
    createdAt: now,
    updatedAt: now,
    ...extra,
  });

  const bookings: Array<{ booking: Booking; events: TimelineEvent[] }> = [
    {
      booking: mk("demo-paid-full", "cb-villa-01", "Villa con piscina privada sobre la cala", "paid_in_full", "instant", {
        guestName: "Carlos Ibáñez",
        totalAmount: 1475,
        transactionIds: { sale: "DEMO-SEED-TXN-001" },
      }),
      events: [
        { id: "e1", bookingId: "demo-paid-full", type: "booking_created", label: "Reserva creada", source: "guest", createdAt: now },
        { id: "e2", bookingId: "demo-paid-full", type: "settled", label: "Pago completo liquidado", amount: 1475, currency: "EUR", transactionId: "DEMO-SEED-TXN-001", source: "nuvei_dmn", createdAt: now },
      ],
    },
    {
      booking: mk("demo-deposit", "alg-villa-01", "Villa moderna con piscina infinita", "deposit_paid", "deposit", {
        guestName: "Sophie Dubois",
        totalAmount: 1700,
        depositAmount: 510,
        balanceAmount: 1190,
        balanceScheduledFor: daysFromNow(5),
        userTokenId: "demo-user-token-1",
        userPaymentOptionId: "demo-upo-1",
        cardLast4: "1164",
        cardBrand: "VISA",
        transactionIds: { deposit: "DEMO-SEED-TXN-002" },
      }),
      events: [
        { id: "e1", bookingId: "demo-deposit", type: "booking_created", label: "Reserva creada", source: "guest", createdAt: now },
        { id: "e2", bookingId: "demo-deposit", type: "deposit_charged", label: "Depósito del 30% cobrado", amount: 510, currency: "EUR", transactionId: "DEMO-SEED-TXN-002", source: "nuvei_dmn", createdAt: now },
        { id: "e3", bookingId: "demo-deposit", type: "balance_scheduled", label: "Cobro del saldo programado", detail: "Se ejecutará automáticamente con la tarjeta guardada", source: "system", createdAt: now },
      ],
    },
    {
      booking: mk("demo-hold", "gr-pool-01", "Terraza con piscina privada frente al Egeo", "hold_active", "security_deposit", {
        guestName: "Anna Meyer",
        totalAmount: 1325,
        securityDepositAmount: 250,
        holdTransactionId: "DEMO-SEED-TXN-003",
        transactionIds: { hold: "DEMO-SEED-TXN-003" },
      }),
      events: [
        { id: "e1", bookingId: "demo-hold", type: "booking_created", label: "Reserva creada", source: "guest", createdAt: now },
        { id: "e2", bookingId: "demo-hold", type: "hold_placed", label: "Retención de fianza autorizada", amount: 250, currency: "EUR", transactionId: "DEMO-SEED-TXN-003", source: "nuvei_dmn", createdAt: now },
      ],
    },
    {
      booking: mk("demo-refunded", "and-casa-01", "Casa rural con patio andaluz", "refunded", "instant", {
        guestName: "Tom Bakker",
        totalAmount: 480,
        refundedAmount: 480,
        transactionIds: { sale: "DEMO-SEED-TXN-004", refund: "DEMO-SEED-TXN-004R" },
      }),
      events: [
        { id: "e1", bookingId: "demo-refunded", type: "booking_created", label: "Reserva creada", source: "guest", createdAt: now },
        { id: "e2", bookingId: "demo-refunded", type: "settled", label: "Pago completo liquidado", amount: 480, currency: "EUR", transactionId: "DEMO-SEED-TXN-004", source: "nuvei_dmn", createdAt: now },
        { id: "e3", bookingId: "demo-refunded", type: "cancelled", label: "Cancelada dentro del plazo gratuito", source: "guest", createdAt: now },
        { id: "e4", bookingId: "demo-refunded", type: "refunded", label: "Reembolso completo procesado", amount: 480, currency: "EUR", transactionId: "DEMO-SEED-TXN-004R", source: "system", createdAt: now },
      ],
    },
    {
      booking: mk("demo-pending", "srd-villa-01", "Villa de piedra con pérgola y viñedo", "pending", "instant", {
        guestName: "Marco Rossi",
        totalAmount: 1050,
      }),
      events: [{ id: "e1", bookingId: "demo-pending", type: "booking_created", label: "Reserva creada, pago pendiente", source: "guest", createdAt: now }],
    },
  ];

  return bookings;
}
