import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import "./ListingPage.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

const getLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getTomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return getLocalDate(date);
};

const calculateNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;

  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);

  return Math.round((end - start) / (1000 * 60 * 60 * 24));
};

function ListingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [checkIn, setCheckIn] = useState(
    searchParams.get("checkIn") || ""
  );
  const [checkOut, setCheckOut] = useState(
    searchParams.get("checkOut") || ""
  );
  const [guests, setGuests] = useState(
    Number(searchParams.get("guests")) || 1
  );

  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/accommodations/${id}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load this property."
          );
        }

        const property =
          data.accommodation ||
          data.listing ||
          data.property ||
          data.data?.accommodation ||
          data.data?.listing ||
          data.data?.property ||
          data.data ||
          data;

        if (!property || !property._id) {
          throw new Error("The property could not be found.");
        }

        setListing(property);

        setGuests((currentGuests) =>
          Math.min(Math.max(currentGuests, 1), property.guests || 1)
        );
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  const images = useMemo(() => {
    if (!Array.isArray(listing?.images)) return [];

    return listing.images
      .map((image) =>
        typeof image === "string" ? image : image?.url
      )
      .filter(Boolean)
      .slice(0, 5);
  }, [listing]);

  const nights = calculateNights(checkIn, checkOut);

  const pricePerNight = Number(listing?.price) || 0;
  const weeklyDiscount = Number(listing?.weeklyDiscount) || 0;

  const subtotal = pricePerNight * nights;

  const discountAmount =
    nights >= 7 ? subtotal * (weeklyDiscount / 100) : 0;

  const cleaningFee = Number(listing?.cleaningFee) || 0;
  const serviceFee = Number(listing?.serviceFee) || 0;
  const occupancyTaxes = Number(listing?.occupancyTaxes) || 0;

  const total =
    subtotal -
    discountAmount +
    cleaningFee +
    serviceFee +
    occupancyTaxes;

  const reviewCount = Array.isArray(listing?.reviews)
    ? listing.reviews.length
    : Number(listing?.reviews) || 0;

  const getHostName = () => {
    if (typeof listing?.host === "object") {
      return (
        listing.host.username ||
        listing.host.name ||
        "Airbnb host"
      );
    }

    return "Airbnb host";
  };

  const handleReserve = async (event) => {
    event.preventDefault();

    setBookingMessage("");
    setBookingSuccess(false);

    if (!checkIn || !checkOut) {
      setBookingMessage("Please select your check-in and check-out dates.");
      return;
    }

    if (nights < 1) {
      setBookingMessage("Check-out must be after check-in.");
      return;
    }

    if (guests < 1 || guests > Number(listing.guests)) {
      setBookingMessage("Please select a valid number of guests.");
      return;
    }

    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("airbnbToken") ||
      localStorage.getItem("authToken");

    if (!token) {
      setBookingMessage("Please sign in before making a reservation.");

      navigate(
        `/login?redirect=${encodeURIComponent(
          `/listing/${id}`
        )}`
      );

      return;
    }

    try {
      setBookingLoading(true);

      const response = await fetch(`${API_URL}/api/reservations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accommodationId: listing._id,
          checkIn,
          checkOut,
          guests: Number(guests),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Your reservation could not be completed."
        );
      }

      setBookingSuccess(true);
      setBookingMessage(
        "Your reservation request has been submitted successfully."
      );
    } catch (err) {
      setBookingMessage(
        err.message || "Something went wrong with your reservation."
      );
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="listing-status">
        <p>Loading property details...</p>
      </main>
    );
  }

  if (error || !listing) {
    return (
      <main className="listing-status">
        <h2>Unable to display this property</h2>
        <p>{error || "Property not found."}</p>
        <Link to="/search" className="listing-back-link">
          Back to search
        </Link>
      </main>
    );
  }

  return (
    <main className="listing-page">
      <div className="listing-heading">
        <h1>{listing.title}</h1>

        <div className="listing-subheading">
          <span>
            ★ {Number(listing.rating || 0).toFixed(1)}
          </span>
          <span>
            {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
          </span>
          <span>{listing.location}</span>
        </div>
      </div>

      <section className="listing-gallery">
        <div className="listing-main-image">
          {images[0] ? (
            <img src={images[0]} alt={listing.title} />
          ) : (
            <div className="listing-image-placeholder">
              No property photo available
            </div>
          )}
        </div>

        {Array.from({ length: 4 }).map((_, index) => (
          <div className="listing-small-image" key={index}>
            {images[index + 1] ? (
              <img
                src={images[index + 1]}
                alt={`${listing.title} ${index + 2}`}
              />
            ) : (
              <div className="listing-image-placeholder">
                Photo not added
              </div>
            )}
          </div>
        ))}
      </section>

      <div className="listing-content">
        <div className="listing-information">
          <section className="listing-intro">
  <h2>
    {listing.type || "Accommodation"} hosted by{" "}
    {getHostName()}
  </h2>

  <p>
    {listing.guests} guests · {listing.bedrooms} bedrooms ·{" "}
    {listing.bathrooms} bathrooms
  </p>

     <a href="#meet-host" className="meet-host-link">
    Meet the host ↓
       </a>
        </section>
         <section className="listing-host-profile" id="meet-host">
  <div className="listing-host-heading">
    <div className="listing-host-photo">
      {listing.host?.profileImage ? (
        <img
          src={listing.host.profileImage}
          alt={getHostName()}
        />
      ) : (
        <span>
          {getHostName().charAt(0).toUpperCase()}
        </span>
      )}
    </div>

    <div>
      <h2>Meet your host</h2>
      <strong>{getHostName()}</strong>

      {listing.host?.hostLocation && (
        <p>{listing.host.hostLocation}</p>
      )}
    </div>
  </div>

  <p className="listing-host-bio">
    {listing.host?.bio ||
      "Your host has not added a biography yet."}
  </p>
</section>

          <div className="listing-divider" />

          <section className="listing-highlights">
            <div>
              <strong>Comfortable stay</strong>
              <p>Explore the details and amenities of this property.</p>
            </div>

            {listing.enhancedCleaning && (
              <div>
                <strong>Enhanced cleaning</strong>
                <p>This property indicates enhanced cleaning.</p>
              </div>
            )}

            {listing.selfCheckIn && (
              <div>
                <strong>Self check-in</strong>
                <p>This property offers self check-in.</p>
              </div>
            )}
          </section>

          <div className="listing-divider" />

          <section className="listing-description">
            <h2>About this place</h2>
            <p>{listing.description || "No description has been provided yet."}</p>
          </section>

          <div className="listing-divider" />

          <section className="listing-amenities">
            <h2>What this place offers</h2>

            {Array.isArray(listing.amenities) &&
            listing.amenities.length > 0 ? (
              <div className="amenities-grid">
                {listing.amenities.map((amenity, index) => (
                  <div key={`${amenity}-${index}`}>
                    <span>✓</span> {amenity}
                  </div>
                ))}
              </div>
            ) : (
              <p>No amenities have been listed yet.</p>
            )}
          </section>

          <div className="listing-divider" />

          <section className="listing-house-details">
            <h2>Important information</h2>

            <div>
              <h3>Sleeping arrangements</h3>
              <p>
                {listing.sleepingArrangements ||
                  `${listing.bedrooms || 0} bedroom(s). Further sleeping details have not been provided.`}
              </p>
            </div>

            <div>
              <h3>House rules</h3>
              <p>
                {listing.houseRules ||
                  "House rules have not been provided for this property."}
              </p>
            </div>

            <div>
              <h3>Safety information</h3>
              <p>
                {listing.safetyInfo ||
                  "Safety information has not been provided for this property."}
              </p>
            </div>

            <div>
              <h3>Cancellation policy</h3>
              <p>
                {listing.cancellationPolicy ||
                  "Cancellation details have not been provided for this property."}
              </p>
            </div>
          </section>
        </div>

        <aside className="booking-card">
          <h2>
            {formatPrice(pricePerNight)}
            <span> / night</span>
          </h2>

          <form onSubmit={handleReserve}>
            <div className="booking-dates">
              <label>
                CHECK-IN
                <input
                  type="date"
                  value={checkIn}
                  min={getTomorrow()}
                  onChange={(event) => {
                    setCheckIn(event.target.value);

                    if (
                      checkOut &&
                      event.target.value >= checkOut
                    ) {
                      setCheckOut("");
                    }
                  }}
                />
              </label>

              <label>
                CHECK-OUT
                <input
                  type="date"
                  value={checkOut}
                  min={checkIn || getTomorrow()}
                  onChange={(event) =>
                    setCheckOut(event.target.value)
                  }
                />
              </label>
            </div>

            <label className="booking-guests">
              GUESTS
              <select
                value={guests}
                onChange={(event) =>
                  setGuests(Number(event.target.value))
                }
              >
                {Array.from(
                  {
                    length: Math.max(
                      1,
                      Number(listing.guests) || 1
                    ),
                  },
                  (_, index) => index + 1
                ).map((number) => (
                  <option value={number} key={number}>
                    {number} {number === 1 ? "guest" : "guests"}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              className="booking-button"
              disabled={bookingLoading}
            >
              {bookingLoading
                ? "Submitting..."
                : "Reserve"}
            </button>

            {bookingMessage && (
              <p
                className={
                  bookingSuccess
                    ? "booking-message success"
                    : "booking-message"
                }
              >
                {bookingMessage}
              </p>
            )}

            {!bookingSuccess && (
              <p className="booking-note">
                You won't be charged just by viewing this estimate.
              </p>
            )}

            <div className="booking-price-breakdown">
              <div>
                <span>
                  {formatPrice(pricePerNight)} × {nights || 0} nights
                </span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div>
                  <span>
                    Weekly discount ({weeklyDiscount}%)
                  </span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}

              <div>
                <span>Cleaning fee</span>
                <span>{formatPrice(cleaningFee)}</span>
              </div>

              <div>
                <span>Service fee</span>
                <span>{formatPrice(serviceFee)}</span>
              </div>

              <div>
                <span>Occupancy taxes</span>
                <span>{formatPrice(occupancyTaxes)}</span>
              </div>
            </div>

            <div className="booking-total">
              <strong>Estimated total</strong>
              <strong>{nights > 0 ? formatPrice(total) : "—"}</strong>
            </div>
          </form>
        </aside>
      </div>
    </main>
  );
}

export default ListingPage;
