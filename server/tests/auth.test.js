
import { after, before, test } from "node:test";
import assert from "node:assert/strict";

import app from "../app.js";
import { authorizeRoles } from "../middleware/auth.js";

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

// ========================================
// AUTHENTICATION API TESTS
// ========================================

test("Protected user profile rejects a request without a token", async () => {
  const response = await fetch(`${baseUrl}/api/users/me`);

  assert.equal(response.status, 401);

  const data = await response.json();

  assert.equal(data.success, false);
  assert.equal(
    data.message,
    "Authentication required. Please log in."
  );
});

test("Protected user profile rejects an invalid JWT", async () => {
  const response = await fetch(`${baseUrl}/api/users/me`, {
    headers: {
      Authorization: "Bearer definitely-not-a-valid-token",
    },
  });

  assert.equal(response.status, 401);

  const data = await response.json();

  assert.equal(data.success, false);
  assert.equal(
    data.message,
    "Your session is invalid or has expired. Please log in again."
  );
});

test("Registration rejects invalid user information", async () => {
  const response = await fetch(`${baseUrl}/api/users/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: "A",
      email: "not-an-email",
      password: "123",
    }),
  });

  assert.equal(response.status, 400);

  const data = await response.json();

  assert.equal(data.success, false);
  assert.ok(Array.isArray(data.errors));
  assert.ok(data.errors.length > 0);
});

test("Login rejects an invalid email address", async () => {
  const response = await fetch(`${baseUrl}/api/users/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "not-an-email",
      password: "password123",
    }),
  });

  assert.equal(response.status, 400);

  const data = await response.json();

  assert.equal(data.success, false);
  assert.ok(Array.isArray(data.errors));
});

// ========================================
// ROLE AUTHORIZATION UNIT TESTS
// ========================================

function createMockResponse() {
  return {
    statusCode: 200,
    body: null,

    status(code) {
      this.statusCode = code;
      return this;
    },

    json(data) {
      this.body = data;
      return this;
    },
  };
}

test("Role authorization rejects a request without a user", () => {
  const req = {};
  const res = createMockResponse();
  let nextCalled = false;

  authorizeRoles("admin")(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 401);
  assert.equal(nextCalled, false);
});

test("Role authorization rejects a user without the required role", () => {
  const req = {
    user: {
      role: "user",
    },
  };

  const res = createMockResponse();
  let nextCalled = false;

  authorizeRoles("admin")(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 403);
  assert.equal(nextCalled, false);
});

test("Role authorization allows an administrator", () => {
  const req = {
    user: {
      role: "admin",
    },
  };

  const res = createMockResponse();
  let nextCalled = false;

  authorizeRoles("admin")(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
});