
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const formatPrice = (price) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(price || 0);

export default function SearchPage() {
  const [searchParams] = useSearchParams();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const queryString = searchParams.toString();

  useEffect(() => {
    const controller = new AbortController();

    const fetchProperties = async () => {
      try {
        setLoading(true);
        setError("");

        const query = queryString ? `?${queryString}` : "";

        const response = await fetch(
          `${API_URL}/api/accommodations${query}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Unable to retrieve properties.");
        }

        const data = await response.json();

        setProperties(data.accommodations || []);
      } catch (error) {
        if (error.name !== "AbortError") {
          setError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchProperties();

    return () => controller.abort();
  }, [queryString]);

  const destination = searchParams.get("destination");
  const guests = searchParams.get("guests");

  return (
    <main className="search-page">
      <div className="search-page-heading">
        <div>
          <p className="small-eyebrow">FIND YOUR NEXT STAY</p>

          <h1>
            {destination
              ? `Stays in ${destination}`
              : "Explore available stays"}
          </h1>

          <p>
            {guests ? `${guests} guest(s)` : "Discover places to stay"}
          </p>
        </div>

        <span className="result-count">
          {properties.length} properties found
        </span>
      </div>

      {loading && (
        <p className="loading-message">Finding your next stay...</p>
      )}

      {error && (
        <p className="error-message">{error}</p>
      )}

      {!loading && !error && properties.length === 0 && (
        <div className="empty-results">
          <h2>No properties found</h2>
          <p>
            Try another destination or change your search filters.
          </p>
          <Link to="/" className="primary-button">
            Back to homepage
          </Link>
        </div>
      )}

      {!loading && !error && properties.length > 0 && (
        <div className="property-results-grid">
          {properties.map((property) => (
            <Link
              to={`/listing/${property._id}`}
              className="property-card"
              key={property._id}
            >
              <div className="property-image">
                <img
                  src={
                    property.images?.[0] ||
                    "https://placehold.co/600x400?text=Property"
                  }
                  alt={property.title}
                />

                <span className="property-type">
                  {property.type}
                </span>
              </div>

              <div className="property-information">
                <div className="property-title-row">
                  <h3>{property.title}</h3>
                  <span>★ {property.rating || "New"}</span>
                </div>

                <p>{property.location}</p>

                <p>
                  {property.guests} guests · {property.bedrooms} bedrooms ·
                  {" "}{property.bathrooms} bathrooms
                </p>

                <p className="property-price">
                  <strong>{formatPrice(property.price)}</strong>
                  {" "}night
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
