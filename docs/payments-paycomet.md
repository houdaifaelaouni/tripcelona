# PAYCOMET (Banco Sabadell TPV Virtual)

The owner's bank contract (2026-11-13) is a **TPV Virtual Banco Sabadell** run on the PAYCOMET platform, so the site can take card payments through PAYCOMET as well as Redsys. Redsys stays the default; PAYCOMET is switched on with one environment variable.

## How it works
1. "Pagar con tarjeta" posts to `/api/pagos/iniciar`. The server creates a payment row with a fresh order reference and calls `POST https://rest.paycomet.com/v1/form` (operation type 1, card only, 3D Secure on). PAYCOMET answers with a hosted-page URL and the customer is redirected to it.
2. The customer pays on PAYCOMET's page and returns to `/reservar/confirmada` (URLOK) or `/reservar/pendiente?pago=error` (URLKO).
3. PAYCOMET posts the result to the notification URL, `POST /api/pagos/paycomet/notificacion`. That, not the browser returning, confirms the booking. The `NotificationHash` is checked (`SHA512(AccountCode + TpvID + TransactionType + Order + Amount + Currency + md5(password) + BankDateTime + Response)`), the terminal and customer code must be ours, and the amount must match the booking. Approved means `Response = OK` and `ErrorID = 0`.
4. Refunds (cancelled departures, admin refunds, automatic refund of a payment the booking cannot use) call `POST /v1/payments/{order}/refund` with the bank authorisation code saved from the notification.

Sandbox and live use the same host; the **terminal number** decides which one runs.

## Environment variables (Vercel)
| Variable | Value |
| --- | --- |
| `PAYMENT_PROVIDER` | `paycomet` (anything else, or unset, keeps Redsys) |
| `PAYCOMET_API_KEY` | API key from the control panel (needs Authorization and Refund privileges) |
| `PAYCOMET_TERMINAL` | Previews: sandbox terminal. Production: the real terminal |
| `PAYCOMET_CUSTOMER_CODE` | "Código de cliente" (the `AccountCode` in notifications), shown in the panel |
| `PAYCOMET_PASSWORD` | The terminal's password, used only to check notification signatures |
| `PAYCOMET_ORIGINAL_IP` | Optional. IP sent with refunds; default `127.0.0.1`. Set it if the API key is restricted by IP |

## Control panel setup (Mis productos > Configurar producto)
- Notification URL (URLNOTIFY): `https://<site>/api/pagos/paycomet/notificacion`, type "POST". Do not use OK/KO URLs for this. PAYCOMET notifies from 99.81.26.182, 99.80.172.90 and 99.81.94.3; do not geo-block or redirect them.
- Keep 3D Secure enabled. The sandbox limit per operation is 250 EUR.
- Sandbox test cards: 4539 2320 7664 8253, 5445 2888 5220 0883, 6011 4546 3881 2167, 3779 6009 5195 350. Month 05, year = current + 1, CVV 123. Error 102 means the card data sent was wrong.

## Before going live
- `pnpm check:env` passes with the production values (it requires the four PAYCOMET variables when `PAYMENT_PROVIDER=paycomet`).
- A sandbox payment on a preview confirms the booking, and a cancelled departure refunds it.
- The legal text mentions the PSD2 / GDPR notes and the shipping and returns cost policy that the bank asks for (see the bank's welcome email).
