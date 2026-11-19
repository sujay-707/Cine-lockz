
import { Outlet, useLocation } from "react-router-dom";

import Navbar from "../Navbar";
import "../../styles/admin/AdminLayout.css";

const pageDetails = {
  "/admin": {
    title: "Dashboard",
    subtitle: "Welcome back! Here's your cinema overview.",
  },
  "/admin/movies": {
    title: "Manage Movies",
    subtitle: "Add, update and manage your movie catalog.",
  },
  "/admin/theatres": {
    title: "Manage Theatres",
    subtitle: "Manage cinema locations and screens.",
  },
  "/admin/shows": {
    title: "Manage Shows",
    subtitle: "Schedule movies and manage showtimes.",
  },
  "/admin/bookings": {
    title: "Manage Bookings",
    subtitle: "View and manage customer reservations.",
  },
};

export default function AdminLayout() {
  const location = useLocation();

  const currentPage =
    pageDetails[location.pathname] || pageDetails["/admin"];

  return (
    <div className="admin-layout">
      <Navbar />

      <main className="admin-main">
        <section className="admin-top-heading">
          <div>
            <h1>{currentPage.title}</h1>
            <p>{currentPage.subtitle}</p>
          </div>
        </section>

        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
