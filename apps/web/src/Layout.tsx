import { useEffect, useRef } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import { navigation } from "./routes.js";

export function Layout() {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    mainRef.current?.focus();
  }, [location.pathname]);
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header>
        <Link className="brand" to="/">
          Castalia
        </Link>
        <nav aria-label="Primary">
          {navigation.map(({ to, label }) => (
            <NavLink key={to} to={to} end={to === "/"}>
              {label}
            </NavLink>
          ))}
        </nav>
        <span>Session unavailable</span>
      </header>
      <main id="main" ref={mainRef} tabIndex={-1}>
        <Outlet />
      </main>
    </>
  );
}
