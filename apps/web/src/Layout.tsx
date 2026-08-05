import { useEffect, useRef } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import { navigation } from "./routes.js";

export function Layout() {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    mainRef.current?.focus({ preventScroll: true });
  }, [location.pathname]);

  return (
    <div className="app-layout">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="app-header">
        <div className="app-header-left">
          <Link className="brand" to="/" aria-label="Castalia home">
            Start
          </Link>
          <nav className="app-nav" aria-label="Primary">
            {navigation.map(({ to, label }) => (
              <NavLink key={to} to={to} end>
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main id="main" className="app-main" ref={mainRef} tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
