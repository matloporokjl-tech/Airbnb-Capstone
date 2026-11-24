
import { useState } from "react";
import { Link } from "react-router";

const destinations = [
  {
    name: "Cape Town",
    description: "Coastal escapes and city views",
    image:
      "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=700&q=85",
  },
  {
    name: "Bali",
    description: "Tropical stays and island life",
    image:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=700&q=85",
  },
  {
    name: "Paris",
    description: "Romantic streets and culture",
    image:
      "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=700&q=85",
  },
  {
    name: "Santorini",
    description: "Beautiful views by the sea",
    image:
      "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=700&q=85",
  },
];

const getawayTabs = {
  Popular: [
    ["Canmore", "Pet-friendly rentals"],
    ["Benalmádena", "Beachfront rentals"],
    ["Marbella", "House rentals"],
    ["Mijas", "Holiday rentals"],
    ["Prescott", "Pet-friendly rentals"],
    ["Scottsdale", "Apartment rentals"],
    ["Tucson", "Holiday rentals"],
    ["Jasper", "Cabin rentals"],
  ],

  "Arts & culture": [
    ["Paris", "Apartment rentals"],
    ["Rome", "Holiday rentals"],
    ["Florence", "House rentals"],
    ["Barcelona", "Apartment rentals"],
    ["London", "City stays"],
    ["Vienna", "Cultural getaways"],
  ],

  Outdoors: [
    ["Cape Town", "Nature escapes"],
    ["Banff", "Mountain stays"],
    ["Queenstown", "Adventure stays"],
    ["Knysna", "Coastal getaways"],
    ["Kruger", "Safari lodges"],
    ["Drakensberg", "Mountain retreats"],
  ],

  Mountains: [
    ["Zermatt", "Chalet rentals"],
    ["Chamonix", "Mountain stays"],
    ["Banff", "Cabin rentals"],
    ["Aspen", "Holiday rentals"],
    ["Drakensberg", "Nature retreats"],
    ["Queenstown", "Mountain escapes"],
  ],

  Beach: [
    ["Durban", "Beachfront stays"],
    ["Bali", "Beach villas"],
    ["Maldives", "Island escapes"],
    ["Mauritius", "Beach rentals"],
    ["Algarve", "Coastal stays"],
    ["Santorini", "Seaside rentals"],
  ],
};

function SectionHeading({ title, subtitle }) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("Popular");

  return (
    <>


      <section className="hero-banner">
        <div className="hero-overlay">
          <div className="hero-content">
            <p className="hero-eyebrow">FIND YOUR PLACE IN THE WORLD</p>

            <h1>
              You
              <br />
              belong
              <br />
              everywhere.
            </h1>

            <p className="hero-description">
              Discover special places to stay and experiences
              that make every journey unforgettable.
            </p>

            <Link to="/search" className="primary-button hero-button">
              Explore stays
            </Link>
          </div>
        </div>
      </section>


      <section className="content-section" id="inspiration">
        <SectionHeading
          title="Inspiration for your next trip"
          subtitle="Find a place that feels like yours."
        />

        <div className="destination-grid">
          {destinations.map((destination) => (
            <article className="destination-card" key={destination.name}>
              <img src={destination.image} alt={destination.name} />
              <div className="destination-info">
                <h3>{destination.name}</h3>
                <p>{destination.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>


      <section className="content-section experiences-section" id="experiences">
        <SectionHeading
          title="Discover Airbnb Experiences"
          subtitle="Make your trip more memorable."
        />

        <div className="experience-grid">
          <article className="experience-card trip-experience">
            <div className="experience-content">
              <p className="experience-eyebrow">MAKE EVERY MOMENT COUNT</p>
              <h3>Things to do on your trip</h3>
              <p>
                Explore local activities, discover new places
                and create unforgettable memories.
              </p>
              <Link to="/search" className="outline-button">
                Explore experiences
              </Link>
            </div>
          </article>

          <article className="experience-card home-experience">
            <div className="experience-content">
              <p className="experience-eyebrow">NEW WAYS TO CONNECT</p>
              <h3>Things to do at home</h3>
              <p>
                Discover inspiring activities and experiences
                from the comfort of home.
              </p>
              <Link to="/search" className="outline-button">
                Explore experiences
              </Link>
            </div>
          </article>
        </div>
      </section>


      <section className="content-section gift-section">
        <div className="gift-copy">
          <p className="small-eyebrow">GIVE THE GIFT OF TRAVEL</p>
          <h2>
            Shop Airbnb
            <br />
            gift cards.
          </h2>
          <p>
            Give someone the freedom to discover somewhere
            new and create memories of their own.
          </p>
          <a href="#footer" className="dark-button">
            Explore gift cards
          </a>
        </div>

        <div className="gift-image">
          <div className="gift-card-design">
            <span>airbnb</span>
            <strong>Go<br />somewhere.</strong>
            <small>A GIFT OF POSSIBILITY</small>
          </div>
        </div>
      </section>


      <section className="hosting-banner" id="hosting">
        <div className="hosting-content">
          <p className="small-eyebrow">SHARE YOUR SPACE</p>
          <h2>Questions about hosting?</h2>
          <p>
            Turn your extra space into an opportunity
            to welcome people from around the world.
          </p>
          <Link to="/register" className="light-button">
            Learn about hosting
          </Link>
        </div>
      </section>


      <section className="content-section getaways-section" id="getaways">
        <SectionHeading title="Inspiration for future getaways" />

        <div className="getaway-tabs" role="tablist">
          {Object.keys(getawayTabs).map((tab) => (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              className={activeTab === tab ? "getaway-tab active" : "getaway-tab"}
              key={tab}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="getaway-list">
          {getawayTabs[activeTab].map(([place, description]) => (
            <Link
              to={`/search?${new URLSearchParams({ destination: place })}`}
              className="getaway-item"
              key={place}
            >
              <strong>{place}</strong>
              <span>{description}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
