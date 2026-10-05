import { test } from "node:test"
import assert from "node:assert/strict"
import { montarTelefone, emailValido, paisPorCodigo } from "../lib/paises.ts"

const UY = paisPorCodigo("uy")!
const AR = paisPorCodigo("AR")!

test("telefone: adiciona DDI e tira 0 inicial", () => {
  assert.equal(montarTelefone("099 860 812", UY), "59899860812")
  assert.equal(montarTelefone("99860812", UY), "59899860812")
  assert.equal(montarTelefone("011 2345-6789", AR), "541123456789")
})
test("telefone: não duplica DDI colado", () => {
  assert.equal(montarTelefone("+598 99 860 812", UY), "59899860812")
  assert.equal(montarTelefone("59899860812", UY), "59899860812")
  assert.equal(montarTelefone("+54 9 11 2345 6789", UY), "5491123456789")
})
test("telefone: rejeita lixo", () => {
  assert.equal(montarTelefone("", UY), null)
  assert.equal(montarTelefone("123", UY), null)
  assert.equal(montarTelefone("1234567890123456789", UY), null)
})
test("email", () => {
  assert.ok(emailValido("ms95trader@gmail.com"))
  assert.ok(!emailValido("ms95trader@gmail"))
  assert.ok(!emailValido("a b@c.com"))
})
