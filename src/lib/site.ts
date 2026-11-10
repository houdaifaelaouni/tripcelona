/**
 * Site-wide shell content. Labels, links and contact data are copied from the
 * live tripcelona.com header/footer (read 2026-11-10). From Sprint 8 (FR-86)
 * contact data moves to the `settings` table so the owner can edit it.
 */

export const site = {
  name: "Tripcelona",
  tagline: "Excursiones en grupo por Cataluña",
  phoneDisplay: "+34 666 69 69 54",
  phoneHref: "tel:+34666696954",
  whatsappHref: "https://wa.me/34666696954",
  // TODO(PO): branded contact email. The live site shows a personal Gmail,
  // which PRD §5.5 says must be replaced, so no email is published here.
  email: null as string | null,
  meetingPoint: "Estació del Nord, C/ d'Alí Bei 80, Barcelona",
  meetingPointMapHref: "https://www.google.com/maps/search/Estaci%C3%B3+del+Nord+Barcelona",
} as const;

export type NavItem = { label: string; href: string; children?: NavItem[] };

export const primaryNav: NavItem[] = [
  { label: "Inicio", href: "/" },
  {
    label: "Ofertas de viajes",
    href: "/ofertas-de-viajes",
    children: [
      { label: "Crea tu tour", href: "/crea-tu-tour" },
      { label: "Agenda de eventos", href: "/eventos" },
    ],
  },
  { label: "Sobre nosotros", href: "/sobre-nosotros" },
  { label: "Blog", href: "/blog" },
  { label: "FAQ", href: "/preguntas-frecuentes" },
  { label: "Contáctanos", href: "/contactanos" },
];

/** Hero search destinations: live-site labels, mapped to catalog area filters. */
export const destinations = [
  { label: "Fageda d'en Jordà y Castellfollit", area: "la-garrotxa" },
  { label: "Queralbs y Vall de Núria", area: "ripolles" },
  { label: "Aigüestortes y Sant Maurici", area: "pallars" },
  { label: "Rupit y Tavertet", area: "osona" },
  { label: "Alquézar y las Pasarelas del Vero", area: "huesca" },
] as const;

export const footerColumns: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Acerca de Tripcelona",
    links: [
      { label: "Inicio", href: "/" },
      { label: "Ofertas de viajes", href: "/ofertas-de-viajes" },
      { label: "Sobre nosotros", href: "/sobre-nosotros" },
      { label: "Contáctanos", href: "/contactanos" },
      { label: "Preguntas frecuentes", href: "/preguntas-frecuentes" },
    ],
  },
  {
    title: "Destinos",
    links: [
      {
        label: "Ripollès",
        href: "/excursiones/el-reto-del-pirineo-exploracion-de-queralbs-y-el-mitico-vall-de-nuria",
      },
      {
        label: "La Garrotxa",
        href: "/excursiones/la-ruta-del-fuego-exploracion-en-fageda-den-jorda-y-castellfollit-de-la-roca",
      },
      {
        label: "Aigüestortes",
        href: "/excursiones/el-corazon-salvaje-del-pirineo-aiguestortes-y-el-lago-de-sant-maurici",
      },
      {
        label: "Rupit y Tavertet",
        href: "/excursiones/la-magia-rural-de-cataluna-escapada-a-rupit-y-tavertet",
      },
    ],
  },
  {
    title: "Información legal",
    links: [
      { label: "Política de privacidad", href: "/politica-de-privacidad" },
      { label: "Cancelación y devoluciones", href: "/politica-de-devoluciones" },
      { label: "Condiciones de contratación", href: "/condiciones-de-contratacion" },
      { label: "Política de cookies", href: "/politica-de-cookies" },
      { label: "Aviso legal", href: "/aviso-legal" },
    ],
  },
];
