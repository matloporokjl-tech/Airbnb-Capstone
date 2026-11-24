
import "dotenv/config";

import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

import app from "../app.js";
import User from "../models/User.js";
import Accommodation from "../models/Accommodation.js";
import Reservation from "../models/Reservation.js";

const TEST_DB_NAME = "airbnb_capstone_test";
const TEST_PASSWORD = "TestPassword123!";

let server;
let baseUrl;

let host;
let otherHost;
let guest;
let secondGuest;
let admin;

let hostToken;
let otherHostToken;
let guestToken;
let secondGuestToken;
let adminToken;

let propertyId;
let reservationId;

let checkIn;
let checkOut;

// ========================================
// DATABASE CONFIGURATION
// ========================================

const getTestDatabaseUri = () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured.");
  }

  const uri = new URL(process.env.MONGODB_URI);

  uri.pathname = `/${TEST_DB_NAME}`;
  uri.searchParams.set("dbName", TEST_DB_NAME);

  return uri.toString();
};

// ========================================
// TEST AUTHENTICATION
// ========================================

const createToken = (user) => {
  return jwt.sign(
    { sub: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: "20m" }
  );
};

// ========================================
// API REQUEST HELPER
// ========================================

const apiRequest = async (path, options = {}) => {
  const headers = {};

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(`${baseUrl}${path}`, {
    method: options.method || "GET",
    headers,
    ...(options.body !== undefined
      ? { body: JSON.stringify(options.body) }
      : {}),
  });
};

// ========================================
// FUTURE BOOKING DATES
// ========================================

const futureDate = (daysFromToday) => {
  const date = new Date();

  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + daysFromToday);

  return date.toISOString().slice(0, 10);
};

// ========================================
// DATABASE AND SERVER SETUP
// ========================================

before(async () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  await mongoose.connect(getTestDatabaseUri(), {
    serverSelectionTimeoutMS: 20000,
  });

  // Never run test cleanup against the live database.
  const connectedDatabase = mongoose.connection.db.databaseName;

  if (connectedDatabase !== TEST_DB_NAME) {
    throw new Error(
      `Safety check failed. Connected to ${connectedDatabase}, not ${TEST_DB_NAME}.`
    );
  }

  console.log(
    `Integration tests using database: ${TEST_DB_NAME}`
  );

  // Clean only the isolated test database.
  await Promise.all([
    Reservation.deleteMany({}),
    Accommodation.deleteMany({}),
    User.deleteMany({}),
  ]);

  // Create test accounts.
  [host, otherHost, guest, secondGuest, admin] =
    await User.create([
      {
        username: "Test Host",
        email: "test-host@example.invalid",
        password: TEST_PASSWORD,
        role: "host",
      },
      {
        username: "Other Test Host",
        email: "other-host@example.invalid",
        password: TEST_PASSWORD,
        role: "host",
      },
      {
        username: "Test Guest",
        email: "test-guest@example.invalid",
        password: TEST_PASSWORD,
        role: "user",
      },
      {
        username: "Second Test Guest",
        email: "second-guest@example.invalid",
        password: TEST_PASSWORD,
        role: "user",
      },
      {
        username: "Test Admin",
        email: "test-admin@example.invalid",
        password: TEST_PASSWORD,
        role: "admin",
      },
    ]);

  // Generate JWTs for the seeded accounts.
  hostToken = createToken(host);
  otherHostToken = createToken(otherHost);
  guestToken = createToken(guest);
  secondGuestToken = createToken(secondGuest);
  adminToken = createToken(admin);

  // Future booking dates.
  checkIn = futureDate(30);
  checkOut = futureDate(32);

  // Start the API on an available local port.
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

// ========================================
// CLEANUP
// ========================================

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

  if (mongoose.connection.readyState === 1) {
    // Check the database again before deleting test records.
    const connectedDatabase =
      mongoose.connection.db.databaseName;

    if (connectedDatabase !== TEST_DB_NAME) {
      throw new Error(
        "Refusing to clean up a database other than the test database."
      );
    }

    await Promise.all([
      Reservation.deleteMany({}),
      Accommodation.deleteMany({}),
      User.deleteMany({}),
    ]);

    await mongoose.disconnect();
  }
});

// ========================================
// INTEGRATION TESTS
// ========================================

test("Airbnb database-backed API integration", async (t) => {

  // --------------------------------------
  // 1. CREATE PROPERTY
  // --------------------------------------

  await t.test(
    "Host can create a property",
    async () => {
      const response = await apiRequest(
        "/api/accommodations",
        {
          method: "POST",
          token: hostToken,
          body: {
            title: "Integration Test Apartment",
            location: "Test City, South Africa",
            description:
              "A property created during automated testing.",
            type: "Entire place",
            guests: 4,
            bedrooms: 2,
            bathrooms: 2,
            sleepingArrangements:
              "One queen bed and one double bed",
            amenities: ["WiFi", "Kitchen"],
            images: [],
            price: 1500,
            weeklyDiscount: 10,
            cleaningFee: 350,
            serviceFee: 200,
            occupancyTaxes: 100,
            enhancedCleaning: true,
            selfCheckIn: true,
            houseRules: "No smoking.",
            safetyInfo: "Fire extinguisher available.",
            cancellationPolicy: "Flexible cancellation.",
          },
        }
      );

      const responseData = await response.json();

      // Diagnostic information if authentication fails.
      if (response.status !== 201) {
        let decodedToken = null;
        let matchingUser = null;
        let tokenError = null;

        try {
          decodedToken = jwt.verify(
            hostToken,
            process.env.JWT_SECRET
          );

          matchingUser = await User.findById(
            decodedToken.sub
          ).select("username role");
        } catch (error) {
          tokenError = error.message;
        }

        console.error(
          "Host create test diagnostic:",
          {
            status: response.status,
            response: responseData,
            tokenPresent: Boolean(hostToken),
            decodedSubject: decodedToken?.sub,
            matchingUserFound: Boolean(matchingUser),
            matchingUserRole: matchingUser?.role,
            tokenError,
          }
        );
      }

      assert.equal(
        response.status,
        201,
        `Host property creation failed: ${JSON.stringify(responseData)}`
      );

      assert.equal(responseData.success, true);

      assert.equal(
        responseData.message,
        "Accommodation created successfully."
      );

      assert.ok(responseData.accommodation._id);

      propertyId = responseData.accommodation._id;

      assert.equal(
        responseData.accommodation.host.toString(),
        host._id.toString()
      );
    }
  );

  // --------------------------------------
  // 2. GUEST PROPERTY ACCESS
  // --------------------------------------

  await t.test(
    "A regular guest cannot create a property",
    async () => {
      const response = await apiRequest(
        "/api/accommodations",
        {
          method: "POST",
          token: guestToken,
          body: {},
        }
      );

      assert.equal(response.status, 403);

      const data = await response.json();

      assert.equal(data.success, false);
    }
  );

  // --------------------------------------
  // 3. PUBLIC PROPERTY SEARCH
  // --------------------------------------

  await t.test(
    "Public property search returns the created property",
    async (t) => {
      if (!propertyId) {
        return t.skip("Property creation did not succeed.");
      }

      const response = await apiRequest(
        "/api/accommodations?destination=Test%20City&guests=2"
      );

      assert.equal(response.status, 200);

      const data = await response.json();

      assert.equal(data.success, true);
      assert.equal(data.count, 1);

      assert.equal(
        data.accommodations[0].title,
        "Integration Test Apartment"
      );
    }
  );

  // --------------------------------------
  // 4. HOST PROPERTY RETRIEVAL
  // --------------------------------------

  await t.test(
    "Host can retrieve their own properties",
    async () => {
      const response = await apiRequest(
        "/api/accommodations/host/me",
        { token: hostToken }
      );

      assert.equal(response.status, 200);

      const data = await response.json();

      assert.equal(data.success, true);

      if (propertyId) {
        assert.equal(data.count, 1);
      }
    }
  );

  // --------------------------------------
  // 5. PROPERTY OWNERSHIP
  // --------------------------------------

  await t.test(
    "Another host cannot update this property",
    async (t) => {
      if (!propertyId) {
        return t.skip("Property creation did not succeed.");
      }

      const response = await apiRequest(
        `/api/accommodations/${propertyId}`,
        {
          method: "PUT",
          token: otherHostToken,
          body: {
            title: "Unauthorized Property Change",
          },
        }
      );

      assert.equal(response.status, 403);
    }
  );

  // --------------------------------------
  // 6. ADMIN PROPERTY ACCESS
  // --------------------------------------

  await t.test(
    "Administrator can update a property",
    async (t) => {
      if (!propertyId) {
        return t.skip("Property creation did not succeed.");
      }

      const response = await apiRequest(
        `/api/accommodations/${propertyId}`,
        {
          method: "PUT",
          token: adminToken,
          body: {
            title: "Integration Test Apartment Updated",
          },
        }
      );

      assert.equal(response.status, 200);

      const data = await response.json();

      assert.equal(data.success, true);

      assert.equal(
        data.accommodation.title,
        "Integration Test Apartment Updated"
      );
    }
  );

  // ======================================
  // RESERVATION TESTS
  // ======================================

  // --------------------------------------
  // 7. CREATE RESERVATION
  // --------------------------------------

  await t.test(
    "Guest can create a reservation",
    async (t) => {
      if (!propertyId) {
        return t.skip("Property creation did not succeed.");
      }

      const response = await apiRequest(
        "/api/reservations",
        {
          method: "POST",
          token: guestToken,
          body: {
            accommodationId: propertyId,
            checkIn,
            checkOut,
            guests: 2,
          },
        }
      );

      const data = await response.json();

      assert.equal(
        response.status,
        201,
        `Reservation creation failed: ${JSON.stringify(data)}`
      );

      assert.equal(data.success, true);
      assert.equal(data.reservation.status, "pending");
      assert.equal(data.reservation.nights, 2);

      assert.equal(
        data.reservation.priceBreakdown.accommodationSubtotal,
        3000
      );

      assert.equal(
        data.reservation.priceBreakdown.total,
        3650
      );

      reservationId = data.reservation._id;
    }
  );

  // --------------------------------------
  // 8. HOST CANNOT BOOK OWN PROPERTY
  // --------------------------------------

  await t.test(
    "Host cannot reserve their own property",
    async (t) => {
      if (!propertyId) {
        return t.skip("Property creation did not succeed.");
      }

      const response = await apiRequest(
        "/api/reservations",
        {
          method: "POST",
          token: hostToken,
          body: {
            accommodationId: propertyId,
            checkIn: futureDate(40),
            checkOut: futureDate(42),
            guests: 2,
          },
        }
      );

      assert.equal(response.status, 400);

      const data = await response.json();

      assert.equal(data.success, false);

      assert.equal(
        data.message,
        "Hosts cannot reserve their own property."
      );
    }
  );

  // --------------------------------------
  // 9. GUEST CANNOT CONFIRM RESERVATION
  // --------------------------------------

  await t.test(
    "Guest cannot confirm their own reservation",
    async (t) => {
      if (!reservationId) {
        return t.skip("Reservation creation did not succeed.");
      }

      const response = await apiRequest(
        `/api/reservations/${reservationId}`,
        {
          method: "PUT",
          token: guestToken,
          body: {
            status: "confirmed",
          },
        }
      );

      assert.equal(response.status, 403);
    }
  );

  // --------------------------------------
  // 10. RESERVATION OWNERSHIP
  // --------------------------------------

  await t.test(
    "Another guest cannot access this reservation",
    async (t) => {
      if (!reservationId) {
        return t.skip("Reservation creation did not succeed.");
      }

      const response = await apiRequest(
        `/api/reservations/${reservationId}`,
        { token: secondGuestToken }
      );

      assert.equal(response.status, 403);
    }
  );

  // --------------------------------------
  // 11. HOST RESERVATION RETRIEVAL
  // --------------------------------------

  await t.test(
    "Host can view reservations for their properties",
    async () => {
      const response = await apiRequest(
        "/api/reservations/host",
        { token: hostToken }
      );

      assert.equal(response.status, 200);

      const data = await response.json();

      assert.equal(data.success, true);

      if (reservationId) {
        assert.equal(data.count, 1);
      }
    }
  );

  // --------------------------------------
  // 12. HOST CONFIRMS RESERVATION
  // --------------------------------------

  await t.test(
    "Host can confirm a pending reservation",
    async (t) => {
      if (!reservationId) {
        return t.skip("Reservation creation did not succeed.");
      }

      const response = await apiRequest(
        `/api/reservations/${reservationId}`,
        {
          method: "PUT",
          token: hostToken,
          body: {
            status: "confirmed",
          },
        }
      );

      assert.equal(response.status, 200);

      const data = await response.json();

      assert.equal(data.success, true);

      assert.equal(
        data.reservation.status,
        "confirmed"
      );
    }
  );

  // --------------------------------------
  // 13. BOOKING CONFLICT
  // --------------------------------------

  await t.test(
    "Overlapping reservation is rejected",
    async (t) => {
      if (!propertyId || !reservationId) {
        return t.skip(
          "Property or reservation creation did not succeed."
        );
      }

      const response = await apiRequest(
        "/api/reservations",
        {
          method: "POST",
          token: secondGuestToken,
          body: {
            accommodationId: propertyId,
            checkIn,
            checkOut,
            guests: 2,
          },
        }
      );

      assert.equal(response.status, 409);

      const data = await response.json();

      assert.equal(data.success, false);

      assert.equal(
        data.message,
        "This property is unavailable for the selected dates."
      );
    }
  );

  // --------------------------------------
  // 14. PROTECT ACTIVE PROPERTY BOOKINGS
  // --------------------------------------

  await t.test(
    "Host cannot delete a property with an active reservation",
    async (t) => {
      if (!propertyId || !reservationId) {
        return t.skip(
          "Property or reservation creation did not succeed."
        );
      }

      const response = await apiRequest(
        `/api/accommodations/${propertyId}`,
        {
          method: "DELETE",
          token: hostToken,
        }
      );

      assert.equal(response.status, 409);
    }
  );

  // --------------------------------------
  // 15. ADMIN ROLE PROTECTION
  // --------------------------------------

  await t.test(
    "Host cannot access the administrator reservations endpoint",
    async () => {
      const response = await apiRequest(
        "/api/reservations/admin/all",
        { token: hostToken }
      );

      assert.equal(response.status, 403);
    }
  );

  // --------------------------------------
  // 16. ADMIN RESERVATION ACCESS
  // --------------------------------------

  await t.test(
    "Administrator can retrieve all reservations",
    async (t) => {
      if (!reservationId) {
        return t.skip("Reservation creation did not succeed.");
      }

      const response = await apiRequest(
        "/api/reservations/admin/all",
        { token: adminToken }
      );

      assert.equal(response.status, 200);

      const data = await response.json();

      assert.equal(data.success, true);
      assert.equal(data.count, 1);

      assert.equal(
        data.reservations[0]._id,
        reservationId
      );
    }
  );
});
