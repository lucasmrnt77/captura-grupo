import { test } from "node:test"
import assert from "node:assert/strict"
import { modoTeste } from "../lib/teste.ts"

test("modo teste: só com o token certo", () => {
  assert.equal(modoTeste(undefined, null, "abc"), "nao")
  assert.equal(modoTeste("true", "abc", "abc"), "nao")
  assert.equal(modoTeste(true, "abc", "abc"), "sim")
  assert.equal(modoTeste(true, "errado", "abc"), "negado")
  assert.equal(modoTeste(true, null, "abc"), "negado")
  assert.equal(modoTeste(true, "abc", ""), "negado")
  assert.equal(modoTeste(true, "abc", undefined), "negado")
})
