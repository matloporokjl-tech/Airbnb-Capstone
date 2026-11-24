import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";

export default function SiteHeader() {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();

  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [showProfile, setShowProfile] = useState(false);
  const [error, setError] = useState("");

  const displayName =
    user?.username ||
    user?.name ||
    user?.email ||
    "Account";

  const profileInitial = displayName.charAt(0).toUpperCase();

  const handleSearch = (event) => {
    event.preventDefault();
    setError("");

    if (!destination.trim()) {
      setError("Please enter a destination.");
      return;
    }

    if (checkIn && checkOut && checkOut <= checkIn) {
      setError("Check-out must be after check-in.");
      return;
    }

    const params = new URLSearchParams({
      destination: destination.trim(),
      guests: String(guests),
    });

    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);

    navigate(`/search?${params.toString()}`);
  };

  const handleLogout = () => {
    logout();
    setShowProfile(false);
    navigate("/", { replace: true });
  };

  return (
    <header className="site-header">
      <div className="header-top">
        <Link to="/" className="airbnb-logo">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNDw7zXBRCnydrUlNUHaIxDjWXVxeQdvlcUb3E78SeWQ&s"
            alt="Airbnb"
            className="airbnb-logo-image"
          />
        </Link>

        <nav className="header-navigation">
          <Link to="/" className="nav-link active-nav">
            Stays
          </Link>

          <Link to="/#experiences" className="nav-link">
            Experiences
          </Link>
        </nav>

        <div className="profile-area">
  <Link to="/host" className="host-link">
    Become a host
  </Link>

          <button
            type="button"
            className="profile-button"
            aria-label="Open profile menu"
            aria-expanded={showProfile}
            onClick={() => setShowProfile(!showProfile)}
          >
            <span className="menu-icon">☰</span>

            <span className="user-icon">
              {isLoggedIn ? profileInitial : "●"}
            </span>
          </button>

          {showProfile && (
            <div className="profile-dropdown">
              {isLoggedIn ? (
                <>
                  <div className="profile-user-name">
                    <strong>{displayName}</strong>
                    <small>Signed in</small>
                  </div>

                  <div className="dropdown-divider" />

                  <Link
                    to="/reservations"
                    onClick={() => setShowProfile(false)}
                  >
                    My reservations
                  </Link>

                  <Link
                    to="/host"
                    onClick={() => setShowProfile(false)}
                  >
                    Become a host
                  </Link>

                  <div className="dropdown-divider" />

                  <button
                    type="button"
                    className="logout-button"
                    onClick={handleLogout}
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setShowProfile(false)}
                  >
                    Log in
                  </Link>

                  <Link
                    to="/register"
                    onClick={() => setShowProfile(false)}
                  >
                    Sign up
                  </Link>

                  <div className="dropdown-divider" />

                  <Link
                    to="/host"
                    onClick={() => setShowProfile(false)}
                  >
                    Become a host
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="search-wrapper">
        <form className="header-search" onSubmit={handleSearch}>
          <div className="search-field destination-field">
            <label htmlFor="destination">Where</label>
            <input
              id="destination"
              type="text"
              placeholder="Search destinations"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
            />
          </div>

          <div className="search-field">
            <label htmlFor="checkIn">Check in</label>
            <input
              id="checkIn"
              type="date"
              value={checkIn}
              onChange={(event) => setCheckIn(event.target.value)}
            />
          </div>

          <div className="search-field">
            <label htmlFor="checkOut">Check out</label>
            <input
              id="checkOut"
              type="date"
              value={checkOut}
              min={checkIn || undefined}
              onChange={(event) => setCheckOut(event.target.value)}
            />
          </div>

          <div className="search-field guests-field">
            <label htmlFor="guests">Who</label>
            <input
              id="guests"
              type="number"
              min="1"
              max="16"
              value={guests}
              onChange={(event) =>
                setGuests(
                  Math.min(16, Math.max(1, Number(event.target.value) || 1))
                )
              }
            />
          </div>

          <button className="search-submit" type="submit">
            <span className="search-symbol">⌕</span>
            <span>Search</span>
          </button>
        </form>

        {error && <p className="search-error">{error}</p>}
      </div>
    </header>
  );
}