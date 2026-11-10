// Fake Redsys gateway for e2e tests (never production: REDSYS_BASE_URL is ignored there).
// Signs with the public Redsys sandbox key, like the real test environment.
import { createServer } from "node:http";
import { createCipheriv, createHmac } from "node:crypto";
const KEY = "sq7HjrUOBfKmC576ILgskD5srU870gJ7";
const sign = (order, p) => {
  const d = Buffer.alloc(Math.ceil(order.length / 8) * 8);
  d.write(order);
  const c = createCipheriv("des-ede3-cbc", Buffer.from(KEY, "base64"), Buffer.alloc(8));
  c.setAutoPadding(false);
  return createHmac("sha256", Buffer.concat([c.update(d), c.final()]))
    .update(p)
    .digest("base64");
};
const enc = (o) =>
  Buffer.from(JSON.stringify(o)).toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
const body = (req) =>
  new Promise((r) => {
    let s = "";
    req.on("data", (c) => (s += c));
    req.on("end", () => r(s));
  });
const pending = new Map();
createServer(async (req, res) => {
  const raw = await body(req);
  if (req.url === "/sis/realizarPago") {
    const f = new URLSearchParams(raw);
    const p = JSON.parse(Buffer.from(f.get("Ds_MerchantParameters"), "base64").toString());
    const ok = sign(p.DS_MERCHANT_ORDER, f.get("Ds_MerchantParameters")) === f.get("Ds_Signature");
    pending.set(p.DS_MERCHANT_ORDER, p);
    console.log("payment page", p.DS_MERCHANT_ORDER, p.DS_MERCHANT_AMOUNT, "sigOK", ok);
    res.setHeader("content-type", "text/html; charset=utf-8");
    return res.end(`<h1>Fake Redsys</h1><p>Importe: ${(p.DS_MERCHANT_AMOUNT / 100).toFixed(2)} EUR · firma ${ok ? "válida" : "INVÁLIDA"}</p>
<form method="post" action="/decide"><input type="hidden" name="order" value="${p.DS_MERCHANT_ORDER}">
<button name="r" value="0000">Autorizar</button> <button name="r" value="0190">Denegar</button></form>`);
  }
  if (req.url === "/decide") {
    const f = new URLSearchParams(raw);
    const p = pending.get(f.get("order"));
    const params = enc({
      Ds_Order: p.DS_MERCHANT_ORDER,
      Ds_Amount: p.DS_MERCHANT_AMOUNT,
      Ds_Currency: "978",
      Ds_Response: f.get("r"),
      Ds_TransactionType: "0",
      Ds_AuthorisationCode: f.get("r") === "0000" ? "999999" : "",
    });
    const n = new URLSearchParams({
      Ds_SignatureVersion: "HMAC_SHA256_V1",
      Ds_MerchantParameters: params,
      Ds_Signature: sign(p.DS_MERCHANT_ORDER, params),
    });
    const r = await fetch(p.DS_MERCHANT_MERCHANTURL, { method: "POST", body: n });
    console.log("notification", f.get("r"), r.status, await r.text());
    res.writeHead(302, {
      location: f.get("r") === "0000" ? p.DS_MERCHANT_URLOK : p.DS_MERCHANT_URLKO,
    });
    return res.end();
  }
  if (req.url === "/sis/rest/trataPeticionREST") {
    const j = JSON.parse(raw);
    const p = JSON.parse(Buffer.from(j.Ds_MerchantParameters, "base64").toString());
    console.log("refund", p.DS_MERCHANT_ORDER, p.DS_MERCHANT_AMOUNT, p.DS_MERCHANT_TRANSACTIONTYPE);
    const params = enc({
      Ds_Order: p.DS_MERCHANT_ORDER,
      Ds_Amount: p.DS_MERCHANT_AMOUNT,
      Ds_Response: "0900",
      Ds_TransactionType: "3",
    });
    res.setHeader("content-type", "application/json");
    return res.end(
      JSON.stringify({
        Ds_SignatureVersion: "HMAC_SHA256_V1",
        Ds_MerchantParameters: params,
        Ds_Signature: sign(p.DS_MERCHANT_ORDER, params),
      }),
    );
  }
  res.statusCode = 404;
  res.end();
}).listen(Number(process.env.PORT ?? 4010), () => console.log("fake redsys ready"));
