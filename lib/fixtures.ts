import type { Listing } from "./types";

export const DESTINATIONS: Array<{ id: Listing["destination"]; label: string; blurb: string }> = [
  { id: "costa-brava", label: "Costa Brava", blurb: "Calas turquesa y pueblos con encanto" },
  { id: "andalucia", label: "Andalucía", blurb: "Patios blancos y pueblos de montaña" },
  { id: "algarve", label: "Algarve", blurb: "Acantilados dorados y playas infinitas" },
  { id: "sardinia", label: "Cerdeña", blurb: "Aguas cristalinas y campiña mediterránea" },
  { id: "greek-islands", label: "Islas Griegas", blurb: "Casas cícladas frente al Egeo" },
];
