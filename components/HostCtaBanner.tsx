export default function HostCtaBanner() {
  return (
    <div className="overflow-hidden rounded-3xl bg-teal-600">
      <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto] sm:gap-0">
        <div className="p-8 sm:p-10">
          <p className="font-display text-2xl font-bold text-white sm:text-3xl">
            ¿Tienes una casa con encanto?
          </p>
          <p className="mt-2 max-w-md text-sm text-teal-50">
            Publícala en Casitas y cobra con confianza: liquidaciones claras, fianzas
            gestionadas y reembolsos automáticos, todo con la tecnología de pagos de Nuvei.
          </p>
          <button className="mt-5 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-teal-700 shadow-sm transition hover:bg-sand-50">
            Conviértete en anfitrión
          </button>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/host-portrait.jpg"
          alt="Anfitrión de Casitas"
          className="h-full max-h-64 w-full object-cover sm:w-72"
        />
      </div>
    </div>
  );
}
