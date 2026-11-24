import { Routes, Route, Link } from "react-router";

import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";

import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import ListingPage from "./pages/ListingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ReservationsPage from "./pages/ReservationsPage";
import HostDashboardPage from "./pages/HostDashboardPage";
import HostReservationsPage from "./pages/HostReservationsPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";

import "./App.css";


function SimplePage({ title, description }) {
  return (
    <main className="listing-status">
      <h1>{title}</h1>
      <p>{description}</p>

      <Link to="/" className="listing-back-link">
        Back to homepage
      </Link>
    </main>
  );
}

function App() {
  return (
    <div className="app">


      <SiteHeader />


      <Routes>


        <Route
          path="/"
          element={<HomePage />}
        />


        <Route
          path="/search"
          element={<SearchPage />}
        />


        <Route
          path="/listing/:id"
          element={<ListingPage />}
        />


        <Route
          path="/login"
          element={<LoginPage />}
        />


        <Route
          path="/register"
          element={<RegisterPage />}
        />


        <Route
          path="/reservations"
          element={<ReservationsPage />}
        />


        <Route
          path="/host"
          element={<HostDashboardPage />}
        />


        <Route
          path="*"
          element={
            <SimplePage
              title="Page not found"
              description="Sorry, the page you are looking for could not be found."
            />
          }
        />
        <Route
        path="/host/reservations"
        element={<HostReservationsPage />}
        />
        <Route
  path="/admin"
  element={<AdminDashboardPage />}
/>

<Route
  path="/admin/dashboard"
  element={<AdminDashboardPage />}
/>
      </Routes>

      {/* Website footer */}
      <SiteFooter />

    </div>
  );
}

export default App;