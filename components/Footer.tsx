export default function Footer() {
  return (
    <footer className="mt-16 border-t border-sand-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-ink-700 sm:px-6">
        <p className="font-display text-lg font-bold text-coral-600">
          casitas<span className="text-teal-600">.</span>
        </p>
        <p className="mt-2 max-w-xl">
          Casitas es una marca ficticia creada como demo de pagos para mostrar los flujos del
          Web SDK de Nuvei (Simply Connect) en un caso de uso de alquiler vacacional / OTA.
          Ninguna imagen, marca o dato de este sitio corresponde a un negocio real.
        </p>
      </div>
    </footer>
  );
}
