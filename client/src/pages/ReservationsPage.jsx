import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import "./ReservationsPage.css";

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
  if (!dateValue) return "Date not provided";

  const date = new Date(`${String(dateValue).slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "Date not provided";

  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getReservationsFromResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.reservations)) return data.reservations;
  if (Array.isArray(data.bookings)) return data.bookings;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.data?.reservations)) return data.data.reservations;
  if (Array.isArray(data.data?.bookings)) return data.data.bookings;

  return [];
};

function ReservationsPage() {
  const { token, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState("");

  useEffect(() => {
    if (!isLoggedIn || !token) {
      navigate("/login?redirect=%2Freservations", { replace: true });
      return;
    }

    const fetchReservations = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/reservations/user`,
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
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [isLoggedIn, token, navigate]);

  const handleCancel = async (reservationId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this reservation?"
    );

    if (!confirmed) return;

    try {
      setCancellingId(reservationId);
      setError("");

      const response = await fetch(
        `${API_URL}/api/reservations/${reservationId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: "cancelled",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to cancel this reservation."
        );
      }

      setReservations((current) =>
        current.map((reservation) =>
          reservation._id === reservationId
            ? { ...reservation, status: "cancelled" }
            : reservation
        )
      );
    } catch (err) {
      setError(err.message || "Unable to cancel this reservation.");
    } finally {
      setCancellingId("");
    }
  };

  if (!isLoggedIn) {
    return (
      <main className="reservations-status">
        <h1>My Reservations</h1>
        <p>Please log in to view your reservations.</p>
        <Link to="/login?redirect=%2Freservations">
          Log in
        </Link>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="reservations-status">
        <p>Loading your reservations...</p>
      </main>
    );
  }

  return (
    <main className="reservations-page">
      <header className="reservations-heading">
        <h1>My Reservations</h1>
        <p>View and manage your upcoming and previous stays.</p>
      </header>

      {error && <p className="reservations-error">{error}</p>}

      {reservations.length === 0 ? (
        <section className="reservations-empty">
          <h2>No reservations yet</h2>
          <p>
            Your bookings will appear here once you reserve a place to stay.
          </p>
          <Link to="/search" className="reservations-browse-button">
            Explore stays
          </Link>
        </section>
      ) : (
        <section className="reservations-list">
          {reservations.map((reservation) => {
            const accommodation = reservation.accommodation || {};
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

            const canCancel =
              status === "pending" || status === "confirmed";

            return (
              <article
                className="reservation-card"
                key={reservation._id}
              >
                <Link
                  to={
                    accommodation._id
                      ? `/listing/${accommodation._id}`
                      : "/search"
                  }
                  className="reservation-image"
                >
                  {firstImage ? (
                    <img
                      src={firstImage}
                      alt={accommodation.title || "Reserved accommodation"}
                    />
                  ) : (
                    <div className="reservation-image-placeholder">
                      No image available
                    </div>
                  )}
                </Link>

                <div className="reservation-details">
                  <div className="reservation-card-top">
                    <div>
                      <h2>
                        {accommodation.title || "Accommodation"}
                      </h2>
                      <p className="reservation-location">
                        {accommodation.location || "Location unavailable"}
                      </p>
                    </div>

                    <span className={`reservation-status status-${status}`}>
                      {status}
                    </span>
                  </div>

                  <div className="reservation-dates">
                    <div>
                      <span>CHECK-IN</span>
                      <strong>{formatDate(reservation.checkIn)}</strong>
                    </div>

                    <div>
                      <span>CHECK-OUT</span>
                      <strong>{formatDate(reservation.checkOut)}</strong>
                    </div>

                    <div>
                      <span>GUESTS</span>
                      <strong>{reservation.guests || 1}</strong>
                    </div>
                  </div>

                  <div className="reservation-card-bottom">
                    <strong className="reservation-total">
                      {formatPrice(total)}
                    </strong>

                    {canCancel && (
                      <button
                        type="button"
                        className="reservation-cancel-button"
                        onClick={() => handleCancel(reservation._id)}
                        disabled={cancellingId === reservation._id}
                      >
                        {cancellingId === reservation._id
                          ? "Cancelling..."
                          : "Cancel reservation"}
                      </button>
                    )}
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

export default ReservationsPage;