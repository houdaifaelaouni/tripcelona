import type { Metadata } from "next";
import { Heart, Search, Share } from "lucide-react";
import { PageTitle, Panel } from "@/components/admin/ui";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import {
  Checkbox,
  Input,
  Radio,
  RadioGroup,
  Select,
  Switch,
  Textarea,
} from "@/components/ui/field";
import { IconButton } from "@/components/ui/icon-button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { Spinner } from "@/components/ui/spinner";

export const metadata: Metadata = { title: "Componentes" };

/**
 * Living inventory of the UI primitives (docs/ui-rebuild/scrum-plan.md, UI-1.4).
 * Staff-only because it lives under the admin panel; nothing here is linked
 * from the public site.
 */
export default function ComponentsPage() {
  return (
    <div className="space-y-8">
      <PageTitle>Componentes</PageTitle>

      <Panel title="Tipografía">
        <div className="space-y-3">
          <p className="text-display-xl font-bold">Display XL · 28/700</p>
          <p className="text-display-lg font-medium">Display LG · 22/500</p>
          <p className="text-display-md font-bold">Display MD · 21/700</p>
          <p className="text-display-sm font-semibold">Display SM · 20/600</p>
          <p className="text-base font-semibold">Título · 16/600</p>
          <p className="text-base">Texto · 16/400. Excursiones en grupo desde Barcelona.</p>
          <p className="text-meta text-muted">Meta · 14/400 · 15 nov · Salida 08:00</p>
          <p className="text-caption text-muted">Leyenda · 13/400</p>
        </div>
      </Panel>

      <Panel title="Botones">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Reservar</Button>
          <Button variant="secondary">Secundario</Button>
          <Button variant="outline">Contorno</Button>
          <Button variant="ghost">Texto</Button>
          <Button variant="whatsapp">WhatsApp</Button>
          <Button shape="pill" size="sm">
            Píldora
          </Button>
          <Button disabled>Desactivado</Button>
          <ButtonLink href="/admin" variant="outline" size="sm">
            Enlace
          </ButtonLink>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <IconButton label="Buscar" tone="brand" size="lg">
            <Search size={18} aria-hidden />
          </IconButton>
          <IconButton label="Compartir" tone="outline">
            <Share size={16} aria-hidden />
          </IconButton>
          <IconButton label="Guardar" size="sm">
            <Heart size={14} aria-hidden />
          </IconButton>
          <Spinner />
        </div>
      </Panel>

      <Panel title="Insignias y tarjetas">
        <div className="flex flex-wrap gap-2">
          <Badge>Neutra</Badge>
          <Badge tone="brand">Marca</Badge>
          <Badge tone="accent">Destacada</Badge>
          <Badge tone="success">Pagada</Badge>
          <Badge tone="danger">Cancelada</Badge>
          <Badge tone="light">Clara</Badge>
        </div>
        <Card className="mt-4 max-w-sm p-6">
          <p className="text-base font-semibold">Tarjeta</p>
          <p className="text-meta text-muted">Esquinas de 14 px, borde fino y una sola sombra.</p>
        </Card>
      </Panel>

      <Panel title="Campos">
        <div className="grid max-w-2xl gap-6 md:grid-cols-2">
          <Input label="Nombre" name="demo-name" placeholder="Tu nombre" required />
          <Input
            label="Email"
            name="demo-email"
            type="email"
            defaultValue="no-es-un-email"
            error="Introduce un email válido."
          />
          <Select label="Zona" name="demo-area" hint="Filtra por zona.">
            <option>Todas</option>
            <option>La Garrotxa</option>
          </Select>
          <Input label="Desactivado" name="demo-disabled" disabled defaultValue="Solo lectura" />
          <div className="md:col-span-2">
            <Textarea label="Mensaje" name="demo-msg" rows={3} />
          </div>
          <Checkbox name="demo-check" label="Acepto la política de privacidad" required />
          <Switch name="demo-switch" label="Banner activo" hint="Se muestra en todo el sitio." />
          <RadioGroup legend="Tipo de grupo">
            <Radio name="demo-radio" value="a" label="Empresa" defaultChecked />
            <Radio name="demo-radio" value="b" label="Escuela" hint="Grupos de estudiantes" />
          </RadioGroup>
          <QuantityStepper
            label="Personas"
            hint="Adultos y niños"
            name="demo-qty"
            min={1}
            max={20}
          />
        </div>
      </Panel>
    </div>
  );
}
