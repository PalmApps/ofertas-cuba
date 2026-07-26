import assert from "node:assert/strict";
import test from "node:test";
import { extractPrice } from "./price.js";

test("extractPrice reads amount with currency", () => {
  assert.equal(extractPrice("Laptop Lenovo 350 USD Camaguey"), 350);
  assert.equal(extractPrice("Vendo arroz 5000 CUP La Habana"), 5000);
  assert.equal(extractPrice("Precio: 120 USD"), 120);
});

test("extractPrice ignores product model numbers", () => {
  assert.equal(extractPrice("Vendo iPhone 13 Pro Max 256GB"), null);
  assert.equal(extractPrice("Samsung Galaxy S23 ultra"), null);
});

test("extractPrice prefers explicit price over model", () => {
  assert.equal(extractPrice("iPhone 13 Pro 850 USD La Habana"), 850);
});

test("extractPrice ignores contact spam without currency", () => {
  assert.equal(
    extractPrice(
      "soy de camaguey informacion de contacto y servicio ubicacion camaguey contacto 6",
    ),
    null,
  );
});

test("extractPrice ignores loose keywords without currency", () => {
  assert.equal(extractPrice("tienes un auto en molina motor recambios"), null);
});
