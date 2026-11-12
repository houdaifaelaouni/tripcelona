import { BadgeEuro, Bus, Compass, Users } from "lucide-react";

/** Facts already stated elsewhere on the site, as a strip under the hero. */
const items = [
  { icon: Bus, title: "Autobús ida y vuelta", body: "Salida desde Estació del Nord" },
  { icon: Compass, title: "Guía de Tripcelona", body: "Durante todo el viaje" },
  { icon: BadgeEuro, title: "Precios asequibles", body: "Para viajar mucho y a menudo" },
  { icon: Users, title: "Comunidad viajera", body: "Trato directo, sin intermediarios" },
];

export function FeatureStrip() {
  return (
    <section aria-label="Por qué viajar con Tripcelona" className="border-b border-secondary">
      <ul className="container-site grid gap-x-6 gap-y-7 py-8 sm:grid-cols-2 md:py-10 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex items-start gap-3">
            <Icon
              aria-hidden
              strokeWidth={1.6}
              className="mt-0.5 size-6 shrink-0 text-brand-secondary"
            />
            <span className="text-sm leading-snug">
              <strong className="block font-semibold text-primary">{title}</strong>
              <span className="text-tertiary">{body}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
