import type { Metadata } from "next";
import { Flash } from "@/components/admin/flash";
import { PageTitle, Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/field";
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
      <PageTitle>Nueva reserva manual</PageTitle>
      <Flash error={error} />
      <Panel>
        <form action={createManualBooking} className="grid max-w-2xl gap-4 md:grid-cols-2">
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
          <Select label="Pago" name="payment" defaultValue="cash">
            <option value="cash">Pagado en efectivo</option>
            <option value="transfer">Pagado por transferencia</option>
            <option value="pending">Pendiente: enviar enlace de pago</option>
          </Select>
          <Input label="Nombre y apellidos" name="name" required />
          <Input label="Email" name="email" type="email" required />
          <Input label="Teléfono" name="phone" type="tel" />
          <Textarea label="Comentarios" name="pickupNote" rows={2} />
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" name="notify" defaultChecked /> Enviar email de confirmación al
            cliente
          </label>
          <p className="text-sm text-muted md:col-span-2">
            El precio se calcula con el precio de la salida. Las plazas se descuentan igual que en
            la web.
          </p>
          <Button type="submit" className="self-start">
            Crear reserva
          </Button>
        </form>
      </Panel>
    </>
  );
}
