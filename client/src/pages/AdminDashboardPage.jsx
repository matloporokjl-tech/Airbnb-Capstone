import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import "./AdminDashboardPage.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const getAccommodations = (data) => {
  if (Array.isArray(data?.accommodations)) return data.accommodations;
  if (Array.isArray(data?.data?.accommodations)) {
    return data.data.accommodations;
  }
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const getReservations = (data) => {
  if (Array.isArray(data?.reservations)) return data.reservations;
  if (Array.isArray(data?.data?.reservations)) {
    return data.data.reservations;
  }
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

function AdminDashboardPage() {
  const { token, user, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const isAdmin = String(user?.role || "").toLowerCase() === "admin";

  const [listings, setListings] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login?redirect=%2Fadmin%2Fdashboard", {
        replace: true,
      });
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    if (!isLoggedIn || !token || !isAdmin) {
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        const [listingResponse, reservationResponse] =
          await Promise.all([
            fetch(`${API_URL}/api/accommodations?limit=50`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }),

            fetch(`${API_URL}/api/reservations/admin/all`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }),
          ]);

        const listingData = await listingResponse.json();
        const reservationData = await reservationResponse.json();

        if (!listingResponse.ok) {
          throw new Error(
            listingData.message || "Unable to load property listings."
          );
        }

        if (!reservationResponse.ok) {
          throw new Error(
            reservationData.message || "Unable to load reservations."
          );
        }

        setListings(getAccommodations(listingData));
        setReservations(getReservations(reservationData));
      } catch (err) {
        setError(err.message || "Unable to load the admin dashboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isLoggedIn, token, isAdmin]);

  if (!isLoggedIn) {
    return (
      <main className="admin-status">
        <p>Redirecting to login...</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="admin-status">
        <h1>Admin access required</h1>
        <p>
          This dashboard is restricted to accounts with the admin role.
        </p>
        <Link to="/">Back to homepage</Link>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="admin-status">
        <p>Loading admin dashboard...</p>
      </main>
    );
  }

  const pendingReservations = reservations.filter(
    (reservation) => reservation.status === "pending"
  ).length;

  const confirmedReservations = reservations.filter(
    (reservation) => reservation.status === "confirmed"
  ).length;

  const uniqueHosts = new Set(
    listings
      .map((listing) =>
        typeof listing.host === "object"
          ? listing.host?._id
          : listing.host
      )
      .filter(Boolean)
  );

  return (
    <main className="admin-dashboard">
      <header className="admin-dashboard-heading">
        <div>
          <p className="admin-eyebrow">AIRBNB CAPSTONE</p>
          <h1>Admin Dashboard</h1>
          <p>
            Welcome, {user?.username || user?.email || "Administrator"}.
            Manage properties and monitor guest reservations.
          </p>
        </div>

        <span className="admin-role-label">Administrator</span>
      </header>

      {error && (
        <div className="admin-message">
          {error}
        </div>
      )}

      <section className="admin-stat-grid">
        <article className="admin-stat-card">
          <span>Total properties</span>
          <strong>{listings.length}</strong>
        </article>

        <article className="admin-stat-card">
          <span>Total reservations</span>
          <strong>{reservations.length}</strong>
        </article>

        <article className="admin-stat-card">
          <span>Pending reservations</span>
          <strong>{pendingReservations}</strong>
        </article>

        <article className="admin-stat-card">
          <span>Confirmed reservations</span>
          <strong>{confirmedReservations}</strong>
        </article>

        <article className="admin-stat-card">
          <span>Hosts with listings</span>
          <strong>{uniqueHosts.size}</strong>
        </article>
      </section>

      <section className="admin-quick-actions">
        <div>
          <h2>Manage the platform</h2>
          <p>Open the management pages for more detailed actions.</p>
        </div>

        <div className="admin-action-buttons">
          <Link to="/host" className="admin-primary-link">
            Manage all listings
          </Link>

          <Link to="/host/reservations" className="admin-secondary-link">
            Manage reservations
          </Link>
        </div>
      </section>

      <section className="admin-listings-section">
        <div className="admin-section-heading">
          <div>
            <h2>Property listings</h2>
            <p>Properties currently available in the database.</p>
          </div>

          <Link to="/host" className="admin-text-link">
            Open listing manager
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="admin-empty-state">
            <h3>No properties found</h3>
            <p>There are currently no property listings to display.</p>
            <Link to="/host">Add a property</Link>
          </div>
        ) : (
          <div className="admin-listing-grid">
            {listings.map((listing) => {
              const image = Array.isArray(listing.images)
                ? listing.images
                    .map((item) =>
                      typeof item === "string" ? item : item?.url
                    )
                    .find(Boolean)
                : "";

              const hostName =
                typeof listing.host === "object"
                  ? listing.host?.username
                  : "Host";

              return (
                <article
                  className="admin-listing-card"
                  key={listing._id}
                >
                  {image ? (
                    <img
                      src={image}
                      alt={listing.title}
                    />
                  ) : (
                    <div className="admin-listing-no-image">
                      No image available
                    </div>
                  )}

                  <div className="admin-listing-content">
                    <h3>{listing.title}</h3>
                    <p>{listing.location}</p>
                    <p className="admin-listing-host">
                      Host: {hostName || "Not available"}
                    </p>

                    <strong>
                      {formatPrice(listing.price)} / night
                    </strong>

                    <Link to={`/listing/${listing._id}`}>
                      View property
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default AdminDashboardPage;