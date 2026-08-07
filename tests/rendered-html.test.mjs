import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Medusa operations dashboard", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Medusa - Control EPP<\/title>/i);
  assert.match(html, /Centro de vigilancia industrial/);
  assert.match(html, /Operacion en tiempo real/);
  assert.match(html, /Barra superior movil/);
  assert.match(html, /Navegacion movil/);
  assert.match(html, /Camara del dispositivo/);
  assert.match(html, /Iniciar camara/);
  assert.match(html, /Analisis continuo en espera/);
  assert.match(html, /cada 1\.5 s/);
  assert.match(html, /Capturar evidencia/);
  assert.match(html, /Eventos recientes/);
  assert.match(html, /Reglas activas/);
  assert.match(html, /Fuentes de video/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("analyzes a frame through the mock vision API", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `api-${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/api/analyze-frame", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        frame: "data:image/jpeg;base64,ZmFrZS1mcmFtZS1kYXRh",
        source: "test-camera",
      }),
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.mode, "mock");
  assert.equal(payload.source, "test-camera");
  assert.ok(payload.summary.people >= 1);
  assert.ok(Array.isArray(payload.detections));
  assert.ok(payload.detections.length >= 3);
});

test("removes disposable starter preview code paths", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(page, /SkeletonPreview|codex-preview/);
  assert.doesNotMatch(layout, /Starter Project|_sites-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
