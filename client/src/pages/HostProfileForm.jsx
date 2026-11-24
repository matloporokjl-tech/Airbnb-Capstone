import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import "./HostProfileForm.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

function HostProfileForm() {
  const { token, user } = useAuth();

  const [profile, setProfile] = useState({
    bio: "",
    profileImage: "",
    hostLocation: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${API_URL}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load your profile.");
        }

        const currentUser = data.user || data.data?.user || data.data || data;

        setProfile({
          bio: currentUser.bio || "",
          profileImage: currentUser.profileImage || "",
          hostLocation: currentUser.hostLocation || "",
        });
      } catch (err) {
        setError(err.message || "Unable to load your profile.");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
      setError("Please sign in to manage your host profile.");
    }
  }, [token]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setProfile((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    try {
      setSaving(true);

      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save your profile.");
      }

      const savedUser = data.user || data.data?.user;

      if (savedUser) {
        setProfile({
          bio: savedUser.bio || "",
          profileImage: savedUser.profileImage || "",
          hostLocation: savedUser.hostLocation || "",
        });
      }

      setMessage("Your host profile has been saved.");
    } catch (err) {
      setError(err.message || "Unable to save your profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="host-profile-section">
        <p>Loading host profile...</p>
      </section>
    );
  }

  return (
    <section className="host-profile-section">
      <div className="host-profile-heading">
        <div>
          <h2>Meet the host profile</h2>
          <p>
            Introduce yourself to guests who are considering your property.
          </p>
        </div>

        <div className="host-profile-preview">
          {profile.profileImage ? (
            <img
              src={profile.profileImage}
              alt={`${user?.username || "Host"} profile`}
            />
          ) : (
            <span>
              {(user?.username || "H").charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {error && <p className="host-profile-message error">{error}</p>}
      {message && <p className="host-profile-message success">{message}</p>}

      <form className="host-profile-form" onSubmit={handleSubmit}>
        <label>
          Host name
          <input
            type="text"
            value={user?.username || "Host"}
            disabled
          />
          <small>Your account username is displayed to guests.</small>
        </label>

        <label>
          Profile picture URL
          <input
            type="url"
            name="profileImage"
            value={profile.profileImage}
            onChange={handleChange}
            placeholder="https://example.com/your-photo.jpg"
          />
          <small>Paste a publicly accessible image URL.</small>
        </label>

        <label>
          Where are you based?
          <input
            type="text"
            name="hostLocation"
            value={profile.hostLocation}
            onChange={handleChange}
            placeholder="Cape Town, South Africa"
            maxLength={120}
          />
        </label>

        <label>
          Your biography
          <textarea
            name="bio"
            value={profile.bio}
            onChange={handleChange}
            placeholder="Introduce yourself and tell guests a little about your hosting style..."
            rows={5}
            maxLength={500}
          />
          <small>{profile.bio.length}/500 characters</small>
        </label>

        <button type="submit" disabled={saving}>
          {saving ? "Saving profile..." : "Save host profile"}
        </button>
      </form>
    </section>
  );
}

export default HostProfileForm;