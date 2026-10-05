import { test } from "node:test"
import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { montarEventoMeta, calcularFbc } from "../lib/meta.ts"

const sha = (v: string) => createHash("sha256").update(v).digest("hex")

test("evento Meta: dados com hash e event_id igual ao do pixel", () => {
  const ev = montarEventoMeta({
    eventId: "abc-123", email: " Teste@Gmail.com ", telefone: "59899860812", paisCodigo: "UY",
    url: "https://x.com/?utm_source=fb&email=a@b.com&tel=598", ip: "1.2.3.4", userAgent: "UA", fbp: "fb.1.1.2", fbc: null,
  }, 1_700_000_000_000)
  assert.equal(ev.event_id, "abc-123")
  assert.equal(ev.event_time, 1_700_000_000)
  assert.equal(ev.action_source, "website")
  assert.deepEqual(ev.user_data.em, [sha("teste@gmail.com")])
  assert.deepEqual(ev.user_data.ph, [sha("59899860812")])
  assert.deepEqual(ev.user_data.country, [sha("uy")])
  assert.equal(ev.user_data.fbp, "fb.1.1.2")
  assert.equal("fbc" in ev.user_data, false)
  assert.equal(ev.event_source_url, "https://x.com/?utm_source=fb")
})

test("fbc: cookie tem prioridade; senão monta pelo fbclid", () => {
  assert.equal(calcularFbc("fb.1.9.zzz", "abc", 5), "fb.1.9.zzz")
  assert.equal(calcularFbc(null, "abc", 5), "fb.1.5.abc")
  assert.equal(calcularFbc(null, null), null)
})
