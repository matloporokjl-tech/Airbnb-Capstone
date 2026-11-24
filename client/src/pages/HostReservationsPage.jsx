import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import "./HostReservationsPage.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const formatDate = (dateValue) => {
  if (!dateValue) return "Date unavailable";

  const date = new Date(
    `${String(dateValue).slice(0, 10)}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getReservationsFromResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.reservations)) return data.reservations;
  if (Array.isArray(data.data?.reservations)) {
    return data.data.reservations;
  }
  if (Array.isArray(data.data)) return data.data;

  return [];
};

function HostReservationsPage() {
  const { token, user, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const role = String(user?.role || "").toLowerCase();
  const canManageReservations = ["host", "admin"].includes(role);

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login?redirect=%2Fhost%2Freservations", {
        replace: true,
      });
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    if (!isLoggedIn || !token || !canManageReservations) {
      setLoading(false);
      return;
    }

    const fetchReservations = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/reservations/host`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load your reservations."
          );
        }

        setReservations(getReservationsFromResponse(data));
      } catch (err) {
        setError(
          err.message || "Unable to load your reservations."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [isLoggedIn, token, canManageReservations]);

  const handleStatusUpdate = async (reservationId, status) => {
    if (status === "cancelled") {
      const confirmed = window.confirm(
        "Are you sure you want to cancel this reservation?"
      );

      if (!confirmed) return;
    }

    try {
      setUpdatingId(reservationId);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/api/reservations/${reservationId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to update this reservation."
        );
      }

      setReservations((current) =>
        current.map((reservation) =>
          reservation._id === reservationId
            ? { ...reservation, status }
            : reservation
        )
      );

      setMessage(
        status === "confirmed"
          ? "Reservation confirmed successfully."
          : "Reservation cancelled successfully."
      );
    } catch (err) {
      setError(
        err.message || "Unable to update this reservation."
      );
    } finally {
      setUpdatingId("");
    }
  };

  if (!isLoggedIn) {
    return (
      <main className="host-reservations-status">
        <p>Redirecting to login...</p>
      </main>
    );
  }

  if (!canManageReservations) {
    return (
      <main className="host-reservations-status">
        <h1>Host access required</h1>
        <p>
          You need a host or admin account to manage property
          reservations.
        </p>
        <Link to="/">Back to homepage</Link>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="host-reservations-status">
        <p>Loading your reservations...</p>
      </main>
    );
  }

  return (
    <main className="host-reservations-page">
      <header className="host-reservations-heading">
        <div>
          <h1>Guest reservations</h1>
          <p>
            View and manage bookings made for your properties.
          </p>
        </div>

        <Link to="/host" className="host-reservations-back">
          Back to listings
        </Link>
      </header>

      {error && (
        <p className="host-reservations-message error">
          {error}
        </p>
      )}

      {message && (
        <p className="host-reservations-message success">
          {message}
        </p>
      )}

      {reservations.length === 0 ? (
        <section className="host-reservations-empty">
          <h2>No guest reservations yet</h2>
          <p>
            When guests book one of your properties, their
            reservations will appear here.
          </p>
          <Link to="/host">Return to your listings</Link>
        </section>
      ) : (
        <section className="host-reservations-list">
          {reservations.map((reservation) => {
            const accommodation = reservation.accommodation || {};
            const guest = reservation.guest || {};

            const firstImage = Array.isArray(accommodation.images)
              ? accommodation.images
                  .map((image) =>
                    typeof image === "string" ? image : image?.url
                  )
                  .find(Boolean)
              : "";

            const status = String(
              reservation.status || "pending"
            ).toLowerCase();

            const total =
              reservation.priceBreakdown?.total ??
              reservation.total ??
              reservation.totalPrice ??
              0;

            const canConfirm = status === "pending";
            const canCancel =
              status === "pending" || status === "confirmed";

            const guestName =
              guest.username ||
              guest.name ||
              guest.email ||
              "Guest";

            return (
              <article
                className="host-reservation-card"
                key={reservation._id}
              >
                <div className="host-reservation-image">
                  {firstImage ? (
                    <img
                      src={firstImage}
                      alt={accommodation.title || "Property"}
                    />
                  ) : (
                    <span>No property image</span>
                  )}
                </div>

                <div className="host-reservation-details">
                  <div className="host-reservation-top">
                    <div>
                      <h2>
                        {accommodation.title || "Accommodation"}
                      </h2>

                      <p className="host-reservation-location">
                        {accommodation.location || "Location unavailable"}
                      </p>
                    </div>

                    <span
                      className={`host-reservation-status status-${status}`}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="host-guest-information">
                    <strong>Guest: {guestName}</strong>

                    {guest.email && guest.username && (
                      <span>{guest.email}</span>
                    )}
                  </div>

                  <div className="host-reservation-dates">
                    <div>
                      <span>CHECK-IN</span>
                      <strong>
                        {formatDate(reservation.checkIn)}
                      </strong>
                    </div>

                    <div>
                      <span>CHECK-OUT</span>
                      <strong>
                        {formatDate(reservation.checkOut)}
                      </strong>
                    </div>

                    <div>
                      <span>GUESTS</span>
                      <strong>{reservation.guests || 1}</strong>
                    </div>
                  </div>

                  <div className="host-reservation-bottom">
                    <strong className="host-reservation-total">
                      {formatPrice(total)}
                    </strong>

                    <div className="host-reservation-actions">
                      {accommodation._id && (
                        <Link
                          to={`/listing/${accommodation._id}`}
                          className="host-view-property"
                        >
                          View property
                        </Link>
                      )}

                      {canConfirm && (
                        <button
                          type="button"
                          className="host-confirm-button"
                          onClick={() =>
                            handleStatusUpdate(
                              reservation._id,
                              "confirmed"
                            )
                          }
                          disabled={updatingId === reservation._id}
                        >
                          {updatingId === reservation._id
                            ? "Updating..."
                            : "Confirm booking"}
                        </button>
                      )}

                      {canCancel && (
                        <button
                          type="button"
                          className="host-cancel-button"
                          onClick={() =>
                            handleStatusUpdate(
                              reservation._id,
                              "cancelled"
                            )
                          }
                          disabled={updatingId === reservation._id}
                        >
                          Cancel booking
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

export default HostReservationsPage;