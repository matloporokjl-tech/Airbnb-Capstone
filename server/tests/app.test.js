
import { after, before, test } from "node:test";
import assert from "node:assert/strict";

import app from "../app.js";

let server;
let baseUrl;

before(async () => {
  server = app.listen(0, "127.0.0.1");

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Could not determine the test server address.");
  }

  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
});

test("GET /api/health returns a successful response", async () => {
  const response = await fetch(`${baseUrl}/api/health`);

  assert.equal(response.status, 200);

  const data = await response.json();

  assert.equal(data.success, true);
  assert.equal(data.message, "Airbnb Capstone API is running!");
});

test("Unknown API endpoints return a 404 response", async () => {
  const response = await fetch(`${baseUrl}/api/unknown-test-route`);

  assert.equal(response.status, 404);

  const data = await response.json();

  assert.equal(data.success, false);
  assert.equal(data.message, "API route not found.");
});

test("CORS allows the configured frontend origin", async () => {
  const allowedOrigin =
    process.env.CLIENT_URL || "http://localhost:5174";

  const response = await fetch(`${baseUrl}/api/users/login`, {
    method: "OPTIONS",
    headers: {
      Origin: allowedOrigin,
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type",
    },
  });

  assert.equal(response.status, 204);

  assert.equal(
    response.headers.get("access-control-allow-origin"),
    allowedOrigin
  );
});

test("CORS does not grant access to an unapproved origin", async () => {
  const response = await fetch(`${baseUrl}/api/users/login`, {
    method: "OPTIONS",
    headers: {
      Origin: "http://example.invalid",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type",
    },
  });

  assert.equal(
    response.headers.get("access-control-allow-origin"),
    null
  );
});
