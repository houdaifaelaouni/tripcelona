import type { Metadata } from "next";
import { Flash } from "@/components/admin/flash";
import { PageTitle, Panel, ProgressSteps } from "@/components/admin/ui";
import { Button } from "@/components/admin/button";
import { Checkbox, Input, Select, Textarea } from "@/components/admin/fields";
import { createManualBooking } from "@/lib/admin/booking-actions";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";
import { formatDateShort, formatPrice, formatTime } from "@/lib/tours/format";

export const metadata: Metadata = { title: "Nueva reserva" };

export default async function NewBooking({ searchParams }: PageProps<"/admin/reservas/nueva">) {
  await requireStaff("owner");
  const { error } = await searchParams;
  const db = await createClient();
  const { data: departures } = await db
    .from("tour_departures")
    .select("id, starts_at, capacity, seats_taken, price_cents, status, tours!inner(title, status)")
    .gt("starts_at", new Date().toISOString())
    .eq("status", "open")
    .eq("tours.status", "published")
    .order("starts_at");

  return (
    <>
      <PageTitle back={{ href: "/admin/reservas", label: "Reservas" }}>
        Nueva reserva manual
      </PageTitle>
      <Flash error={error} />
      <div className="grid items-start gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <div className="lg:sticky lg:top-8">
          <ProgressSteps
            steps={[
              { id: "paso-salida", title: "Salida", description: "Fecha y número de viajeros." },
              { id: "paso-cliente", title: "Cliente", description: "A nombre de quién va." },
              { id: "paso-pago", title: "Pago", description: "Cómo ha pagado y aviso." },
            ]}
          />
        </div>
        <Panel>
          <form action={createManualBooking} className="flex max-w-2xl flex-col gap-8">
            <fieldset id="paso-salida" className="grid scroll-mt-8 gap-4 md:grid-cols-2">
              <legend className="mb-4 text-lg font-semibold text-primary">1. Salida</legend>
              <Select
                label="Salida"
                name="departureId"
                required
                className="md:col-span-2"
                defaultValue=""
              >
                <option value="" disabled>
                  Elige una salida
                </option>
                {(departures ?? []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {formatDateShort(d.starts_at)} {formatTime(d.starts_at)} · {d.tours.title} ·{" "}
                    {formatPrice(d.price_cents)} · quedan {d.capacity - d.seats_taken}
                  </option>
                ))}
              </Select>
              <Input
                label="Viajeros"
                name="travellers"
                type="number"
                min={1}
                defaultValue={1}
                required
              />
            </fieldset>
            <fieldset
              id="paso-cliente"
              className="grid scroll-mt-8 gap-4 border-t border-secondary pt-6 md:grid-cols-2"
            >
              <legend className="float-left mb-4 w-full text-lg font-semibold text-primary">
                2. Cliente
              </legend>
              <Input label="Nombre y apellidos" name="name" required />
              <Input label="Email" name="email" type="email" required />
              <Input label="Teléfono" name="phone" type="tel" />
              <Textarea label="Comentarios" name="pickupNote" rows={2} />
            </fieldset>
            <fieldset
              id="paso-pago"
              className="grid scroll-mt-8 gap-4 border-t border-secondary pt-6 md:grid-cols-2"
            >
              <legend className="float-left mb-4 w-full text-lg font-semibold text-primary">
                3. Pago
              </legend>
              <Select label="Pago" name="payment" defaultValue="cash">
                <option value="cash">Pagado en efectivo</option>
                <option value="transfer">Pagado por transferencia</option>
                <option value="pending">Pendiente: enviar enlace de pago</option>
              </Select>
              <div className="md:col-span-2">
                <Checkbox
                  name="notify"
                  defaultChecked
                  label="Enviar email de confirmación al cliente"
                />
              </div>
              <p className="text-sm text-tertiary md:col-span-2">
                El precio se calcula con el precio de la salida. Las plazas se descuentan igual que
                en la web.
              </p>
              <Button type="submit" className="self-start">
                Crear reserva
              </Button>
            </fieldset>
          </form>
        </Panel>
      </div>
    </>
  );
}
