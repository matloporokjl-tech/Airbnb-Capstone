import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import HostProfileForm from "./HostProfileForm";
import "./HostDashboardPage.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const initialForm = {
  title: "",
  location: "",
  description: "",
  sleepingArrangements: "",
  houseRules: "",
  safetyInfo: "",
  cancellationPolicy: "",
  type: "Entire place",
  guests: "2",
  bedrooms: "1",
  bathrooms: "1",
  amenities: "",
  images: "",
  price: "",
  weeklyDiscount: "0",
  cleaningFee: "0",
  serviceFee: "0",
  occupancyTaxes: "0",
};

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const getListingsFromResponse = (data) => {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data.accommodations)) {
    return data.accommodations;
  }

  if (Array.isArray(data.data)) {
    return data.data;
  }

  if (Array.isArray(data.data?.accommodations)) {
    return data.data.accommodations;
  }

  return [];
};

function HostDashboardPage() {
  const { token, user, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const role = String(user?.role || "").toLowerCase();

  const canManageListings = ["host", "admin"].includes(role);

  const listingsEndpoint =
    role === "admin"
      ? `${API_URL}/api/accommodations?limit=50`
      : `${API_URL}/api/accommodations/host/me`;

  const [listings, setListings] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login?redirect=%2Fhost", {
        replace: true,
      });
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    if (!isLoggedIn || !token || !canManageListings) {
      setLoading(false);
      return;
    }

    const fetchListings = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(listingsEndpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load your listings."
          );
        }

        setListings(getListingsFromResponse(data));
      } catch (err) {
        setError(
          err.message || "Unable to load your listings."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [
    isLoggedIn,
    token,
    canManageListings,
    listingsEndpoint,
  ]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // Clear the form.
  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setError("");
    setMessage("");
  };

  const handleEdit = (listing) => {
    setForm({
      title: listing.title || "",
      location: listing.location || "",
      description: listing.description || "",
      type: listing.type || "Entire place",
      guests: String(listing.guests ?? 2),
      bedrooms: String(listing.bedrooms ?? 1),
      bathrooms: String(listing.bathrooms ?? 1),
      sleepingArrangements: listing.sleepingArrangements || "",
      houseRules: listing.houseRules || "",
      safetyInfo: listing.safetyInfo || "",
      cancellationPolicy: listing.cancellationPolicy || "",

      amenities: Array.isArray(listing.amenities)
        ? listing.amenities.join("\n")
        : "",

      images: Array.isArray(listing.images)
        ? listing.images
            .map((image) =>
              typeof image === "string" ? image : image?.url
            )
            .filter(Boolean)
            .join("\n")
        : "",

      price: String(listing.price ?? ""),
      weeklyDiscount: String(listing.weeklyDiscount ?? 0),
      cleaningFee: String(listing.cleaningFee ?? 0),
      serviceFee: String(listing.serviceFee ?? 0),
      occupancyTaxes: String(listing.occupancyTaxes ?? 0),
    });

    setEditingId(listing._id);
    setError("");
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };


  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    const payload = {
      title: form.title.trim(),
      location: form.location.trim(),
      description: form.description.trim(),
      sleepingArrangements: form.sleepingArrangements.trim(),
      houseRules: form.houseRules.trim(),
      safetyInfo: form.safetyInfo.trim(),
      cancellationPolicy: form.cancellationPolicy.trim(),
      type: form.type,
      guests: Number(form.guests),
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),

      amenities: form.amenities
        .split(/[\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean),

      images: form.images
        .split(/\n/)
        .map((item) => item.trim())
        .filter(Boolean),

      price: Number(form.price),
      weeklyDiscount: Number(form.weeklyDiscount),
      cleaningFee: Number(form.cleaningFee),
      serviceFee: Number(form.serviceFee),
      occupancyTaxes: Number(form.occupancyTaxes),
    };

    if (
      !payload.title ||
      !payload.location ||
      !payload.description ||
      !payload.price
    ) {
      setError("Please complete the required property details.");
      return;
    }

    if (
      payload.guests < 1 ||
      payload.bedrooms < 0 ||
      payload.bathrooms < 0 ||
      payload.price <= 0 ||
      payload.weeklyDiscount < 0 ||
      payload.weeklyDiscount > 100
    ) {
      setError("Please check the numbers entered in the form.");
      return;
    }

    try {
      setSaving(true);

      const endpoint = editingId
        ? `${API_URL}/api/accommodations/${editingId}`
        : `${API_URL}/api/accommodations`;

      const response = await fetch(endpoint, {
        method: editingId ? "PUT" : "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to save this property."
        );
      }

      const savedListing =
        data.accommodation ||
        data.data?.accommodation ||
        data.listing ||
        data.data?.listing ||
        data.data;

      if (savedListing?._id) {
        if (editingId) {
          setListings((current) =>
            current.map((listing) =>
              listing._id === editingId
                ? savedListing
                : listing
            )
          );
        } else {
          setListings((current) => [
            savedListing,
            ...current,
          ]);
        }
      } else {

        const refreshResponse = await fetch(listingsEndpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const refreshData = await refreshResponse.json();

        if (!refreshResponse.ok) {
          throw new Error(
            refreshData.message ||
              "Property saved, but the listing could not refresh."
          );
        }

        setListings(getListingsFromResponse(refreshData));
      }

      setMessage(
        editingId
          ? "Your property has been updated."
          : "Your property has been added."
      );

      setForm(initialForm);
      setEditingId(null);
    } catch (err) {
      setError(
        err.message || "Unable to save your property."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (listingId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this property?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(listingId);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/api/accommodations/${listingId}`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to delete this property."
        );
      }

      setListings((current) =>
        current.filter(
          (listing) => listing._id !== listingId
        )
      );

      if (editingId === listingId) {
        resetForm();
      }

      setMessage("Your property has been deleted.");
    } catch (err) {
      setError(
        err.message || "Unable to delete this property."
      );
    } finally {
      setDeletingId("");
    }
  };

  if (!isLoggedIn) {
    return (
      <main className="host-status">
        <p>Redirecting to login...</p>
      </main>
    );
  }

  if (!canManageListings) {
    return (
      <main className="host-status">
        <h1>Host access required</h1>

        <p>
          Your account does not currently have permission to
          manage property listings. A host or admin account is
          required.
        </p>

        <Link to="/">Back to homepage</Link>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="host-status">
        <p>Loading your host dashboard...</p>
      </main>
    );
  }

  return (
    <main className="host-dashboard">

      <header className="host-dashboard-heading">
        <div>
          <h1>
            {role === "admin" ? "All property listings" : "Your listings"}
          </h1>

          <p>
            {role === "admin"
              ? "Manage property listings across the Airbnb platform."
              : "Create and manage your Airbnb properties."}
          </p>
        </div>

        <div className="host-dashboard-actions">
          <span className="host-listing-count">
            {listings.length}{" "}
            {listings.length === 1 ? "listing" : "listings"}
          </span>

          <Link
            to="/host/reservations"
            className="host-reservations-link"
          >
            Manage reservations
          </Link>
        </div>
      </header>


      {error && (
        <p className="host-message host-error">
          {error}
        </p>
      )}

      {message && (
        <p className="host-message host-success">
          {message}
        </p>
      )}

      {role === "host" && <HostProfileForm />}


      <section className="host-form-section">
        <h2>
          {editingId ? "Update property" : "Add a new property"}
        </h2>

        <form
          className="host-listing-form"
          onSubmit={handleSubmit}
        >
          <label>
            Property title *
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Modern apartment in Cape Town"
              maxLength={120}
              required
            />
          </label>

          <label>
            Location *
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="Cape Town, South Africa"
              required
            />
          </label>

          <label className="host-full-width">
            Description *
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe your property..."
              rows={4}
              required
            />
          </label>
          <label className="host-full-width">
  Sleeping arrangements
  <textarea
    name="sleepingArrangements"
    value={form.sleepingArrangements}
    onChange={handleChange}
    placeholder="Example: Bedroom 1 has a queen bed. Bedroom 2 has two single beds."
    rows={3}
  />
</label>

{/* House rules */}
<label className="host-full-width">
  House rules
  <textarea
    name="houseRules"
    value={form.houseRules}
    onChange={handleChange}
    placeholder="Example: No smoking indoors. No parties. Please respect quiet hours."
    rows={3}
  />
</label>

<label className="host-full-width">
  Safety information
  <textarea
    name="safetyInfo"
    value={form.safetyInfo}
    onChange={handleChange}
    placeholder="Example: Smoke alarms, fire extinguisher and first-aid kit available."
    rows={3}
  />
</label>

<label className="host-full-width">
  Cancellation policy
  <textarea
    name="cancellationPolicy"
    value={form.cancellationPolicy}
    onChange={handleChange}
    placeholder="Describe the cancellation terms guests should know."
    rows={3}
  />
</label>

          <label>
            Property type
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
            >
              <option>Entire place</option>
              <option>Private room</option>
              <option>Shared room</option>
              <option>Hotel room</option>
            </select>
          </label>

          <label>
            Maximum guests *
            <input
              type="number"
              name="guests"
              min="1"
              max="50"
              value={form.guests}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Bedrooms
            <input
              type="number"
              name="bedrooms"
              min="0"
              value={form.bedrooms}
              onChange={handleChange}
            />
          </label>

          <label>
            Bathrooms
            <input
              type="number"
              name="bathrooms"
              min="0"
              value={form.bathrooms}
              onChange={handleChange}
            />
          </label>

          <label className="host-full-width">
            Amenities
            <textarea
              name="amenities"
              value={form.amenities}
              onChange={handleChange}
              placeholder={"WiFi\nKitchen\nFree parking\nSwimming pool"}
              rows={4}
            />

            <small>Enter one amenity per line.</small>
          </label>

          <label className="host-full-width">
            Property image URLs
            <textarea
              name="images"
              value={form.images}
              onChange={handleChange}
              placeholder="Paste one image URL per line"
              rows={4}
            />

            <small>
              Enter publicly accessible image URLs, one per line.
            </small>
          </label>

          <label>
            Price per night (ZAR) *
            <input
              type="number"
              name="price"
              min="1"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Weekly discount (%)
            <input
              type="number"
              name="weeklyDiscount"
              min="0"
              max="100"
              step="0.1"
              value={form.weeklyDiscount}
              onChange={handleChange}
            />
          </label>

          <label>
            Cleaning fee (ZAR)
            <input
              type="number"
              name="cleaningFee"
              min="0"
              step="0.01"
              value={form.cleaningFee}
              onChange={handleChange}
            />
          </label>

          <label>
            Service fee (ZAR)
            <input
              type="number"
              name="serviceFee"
              min="0"
              step="0.01"
              value={form.serviceFee}
              onChange={handleChange}
            />
          </label>

          <label>
            Occupancy taxes (ZAR)
            <input
              type="number"
              name="occupancyTaxes"
              min="0"
              step="0.01"
              value={form.occupancyTaxes}
              onChange={handleChange}
            />
          </label>

          <div className="host-form-actions host-full-width">
            <button type="submit" disabled={saving}>
              {saving
                ? "Saving..."
                : editingId
                  ? "Update property"
                  : "Add property"}
            </button>

            {editingId && (
              <button
                type="button"
                className="host-secondary-button"
                onClick={resetForm}
              >
                Stop editing
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="host-existing-listings">
        <h2>
          {role === "admin" ? "Platform properties" : "Your properties"}
        </h2>

        {listings.length === 0 ? (
          <div className="host-empty-state">
            <h3>No properties found</h3>

            <p>
              Use the form above to create your first listing.
            </p>
          </div>
        ) : (
          <div className="host-listing-grid">
            {listings.map((listing) => {
              const image = Array.isArray(listing.images)
                ? listing.images
                    .map((item) =>
                      typeof item === "string" ? item : item?.url
                    )
                    .find(Boolean)
                : "";

              return (
                <article
                  className="host-listing-card"
                  key={listing._id}
                >
                  {image ? (
                    <img
                      className="host-listing-image"
                      src={image}
                      alt={listing.title}
                    />
                  ) : (
                    <div className="host-listing-image host-no-image">
                      No image available
                    </div>
                  )}

                  <div className="host-listing-card-content">
                    <h3>{listing.title}</h3>

                    <p>{listing.location}</p>

                    {role === "admin" && (
                      <p>
                        Host:{" "}
                        {typeof listing.host === "object"
                          ? listing.host?.username || "Unavailable"
                          : "Host"}
                      </p>
                    )}

                    <strong>
                      {formatPrice(listing.price)} / night
                    </strong>

                    <div className="host-card-actions">
                      <Link to={`/listing/${listing._id}`}>
                        View
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleEdit(listing)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="host-delete-button"
                        onClick={() => handleDelete(listing._id)}
                        disabled={deletingId === listing._id}
                      >
                        {deletingId === listing._id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
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

export default HostDashboardPage;