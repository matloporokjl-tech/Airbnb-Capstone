# Airbnb Capstone - API Documentation

## 1. Project Overview

This API powers the Airbnb Capstone application.

It provides user authentication, property management, property searching,
host profiles and guest reservations.

### Technologies

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JSON Web Tokens (JWT)
- bcryptjs
- Multer (planned for image uploads)

## 2. Base URL

Local development:

`http://localhost:5000`

All API endpoints use the `/api` prefix, including the health check.

## 3. Authentication

Protected endpoints require a JWT access token.

Include the token in the request header:

`Authorization: Bearer YOUR_JWT_TOKEN`

### User registration

**POST** `/api/users/register`

Creates a new guest account.

Request body:

```json
{
  "username": "Airbnb Guest",
  "email": "guest@example.com",
  "password": "ExamplePassword123"
}
```

New public registrations receive the `user` role by default.

### User login

**POST** `/api/users/login`

Authenticates an existing user and returns a JWT.

Request body:

```json
{
  "email": "guest@example.com",
  "password": "ExamplePassword123"
}
```

### Get current user

**GET** `/api/users/me`

Requires authentication.

Returns the signed-in user's account and host profile information.

### Update host profile

**PUT** `/api/users/profile`

Requires authentication and the `host` or `admin` role.

Request body:

```json
{
  "bio": "I love welcoming guests and helping them enjoy their stay.",
  "profileImage": "https://example.com/host-photo.jpg",
  "hostLocation": "Cape Town, South Africa"
}
```

## 4. Accommodation endpoints

### Get all accommodations

**GET** `/api/accommodations`

Public endpoint.

Optional query parameters:

| Parameter | Description |
|---|---|
| `destination` | Search by property location |
| `guests` | Minimum guest capacity |
| `minPrice` | Minimum nightly price |
| `maxPrice` | Maximum nightly price |
| `type` | Accommodation type |
| `checkIn` | Requested check-in date |
| `checkOut` | Requested check-out date |
| `page` | Results page |
| `limit` | Number of results, maximum 50 |

Example:

`GET /api/accommodations?destination=Cape%20Town&guests=2`

### Get host accommodations

### Get host accommodations

**GET** `/api/accommodations/host/me`

Requires authentication and the `host` or `admin` role.

Returns properties owned by the authenticated user.

Administrators who need to view all platform properties should use
`GET /api/accommodations` instead.

### Get accommodation by ID

**GET** `/api/accommodations/:id`

Public endpoint.

Returns one property, including its host's public profile details.

### Create accommodation

**POST** `/api/accommodations`

Requires authentication and the `host` or `admin` role.

Request body:

```json
{
  "title": "Modern Apartment in Cape Town",
  "location": "Cape Town, South Africa",
  "description": "A comfortable apartment close to local attractions.",
  "type": "Entire place",
  "guests": 4,
  "bedrooms": 2,
  "bathrooms": 2,
  "sleepingArrangements": "One queen bed and two single beds.",
  "amenities": [
    "WiFi",
    "Kitchen",
    "Free parking"
  ],
  "images": [
    "https://example.com/apartment.jpg"
  ],
  "price": 1500,
  "weeklyDiscount": 10,
  "cleaningFee": 350,
  "serviceFee": 200,
  "occupancyTaxes": 100,
  "houseRules": "No smoking indoors. No parties.",
  "safetyInfo": "Smoke alarm and fire extinguisher available.",
  "cancellationPolicy": "Contact the host for cancellation terms.",
  "enhancedCleaning": true,
  "selfCheckIn": true
}
```

The host is assigned automatically from the authenticated user.
Clients cannot assign themselves as another host.

### Update accommodation

**PUT** `/api/accommodations/:id`

Requires authentication and the `host` or `admin` role.

Hosts can update their own properties. Administrators can update properties across hosts.

The request body accepts the approved property fields described under Create accommodation.

### Delete accommodation

**DELETE** `/api/accommodations/:id`

Requires authentication and the `host` or `admin` role.

Hosts can delete their own properties. Administrators can manage properties across hosts.

Properties with active reservations cannot be deleted.

## 5. Reservation endpoints

### Create reservation

**POST** `/api/reservations`

Requires authentication.

Request body:

```json
{
  "accommodationId": "PROPERTY_OBJECT_ID",
  "checkIn": "2027-01-10",
  "checkOut": "2027-01-13",
  "guests": 2
}
```

The server calculates the booking price using the saved property price and fees.

It checks:

- The dates are valid.
- The property exists.
- The number of guests does not exceed capacity.
- The host is not booking their own property.
- The requested dates do not overlap an active reservation.

New reservations are created with `pending` status.

### Get guest reservations

**GET** `/api/reservations/user`

Requires authentication.

Returns reservations belonging to the signed-in guest.

### Get host reservations

**GET** `/api/reservations/host`

Requires authentication and the `host` or `admin` role.

Returns reservations for the signed-in host's properties.

### Get all reservations

**GET** `/api/reservations/admin/all`

Requires authentication and the `admin` role.

Returns reservations across all properties and hosts.

### Get reservation by ID

**GET** `/api/reservations/:id`

Requires authentication.

Access is restricted to the relevant guest, host or administrator.

### Update reservation

**PUT** `/api/reservations/:id`

Requires authentication.

The permitted changes depend on the user's role and reservation status.

Guests can manage their own eligible pending reservations.
Hosts and administrators can manage reservation statuses according to the backend rules.

Example status update:

```json
{
  "status": "confirmed"
}
```

### Delete reservation

**DELETE** `/api/reservations/:id`

Requires authentication.

Access is restricted by the reservation ownership rules in the backend.

## 6. Health check

**GET** `/api/health`

Public endpoint.

Checks that the API server is running.

Example response:

```json
{
  "success": true,
  "message": "Airbnb Capstone API is running!"
}
```

## 7. User roles and permissions

| Feature | Guest (`user`) | Host (`host`) | Admin (`admin`) |
|---|---|---|---|
| Search properties | Yes | Yes | Yes |
| View property details | Yes | Yes | Yes |
| Make reservations | Yes | Yes | Yes |
| View own reservations | Yes | Yes | Yes |
| Manage own listings | No | Yes | Yes |
| Manage all listings | No | No | Yes |
| Manage host reservations | No | Own properties | All properties |
| Update host profile | No | Yes | Yes |

Public registration only assigns the `user` role.
Host and admin roles must be assigned through a controlled process.

## 8. Common HTTP status codes

| Status | Meaning |
|---|---|
| 200 | Request successful |
| 201 | Resource created |
| 400 | Invalid request or validation failure |
| 401 | Authentication required or invalid token |
| 403 | User does not have permission |
| 404 | Resource not found |
| 409 | Conflict, such as overlapping reservations |
| 500 | Internal server error |

## 9. Security

The API uses:

- JWT authentication.
- bcrypt password hashing.
- Role-based access control.
- Protected listing and reservation operations.
- Express Helmet security headers.
- CORS configuration.
- Request rate limiting.
- Express Validator request validation.

## 10. Development and deployment notes

Local backend:

`http://localhost:5000`

Local frontend:

`http://localhost:5173`

Environment variables are stored in the server's `.env` file.

Never commit database credentials, JWT secrets or passwords to GitHub.

The application currently accepts public image URLs.
Direct image-upload functionality remains to be completed.

Payment processing is not currently implemented.
