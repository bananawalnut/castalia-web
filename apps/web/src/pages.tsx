import { Link, useParams } from "react-router";
import { Status } from "@castalia/ui";

export function Communities() {
  return (
    <>
      <h1>Choose a community</h1>
      <p>
        Castalia is a fixture-only preview. Community access is not connected.
      </p>
      <section aria-labelledby="zenith">
        <h2 id="zenith">Zenith</h2>
        <Status>Unavailable</Status>
        <p>
          <Link to="/community/zenith/forum">View Zenith forum</Link>
        </p>
      </section>
    </>
  );
}
export function Forum() {
  const { slug } = useParams();
  return slug === "zenith" ? (
    <>
      <h1>Zenith forum</h1>
      <h2>Forum unavailable</h2>
      <p>
        Messages, membership, sign-in, and posting are unavailable. No Matrix
        connection was attempted.
      </p>
      <p>
        <Link to="/">Back to communities</Link>{" "}
        <Link to="/docs">Read the documentation</Link>
      </p>
    </>
  ) : (
    <>
      <h1>Community unavailable</h1>
      <p>
        No fixture matches this community. No Matrix or registry lookup
        occurred.
      </p>
    </>
  );
}
export function Create() {
  return (
    <>
      <h1>Create a community</h1>
      <h2>Requests unavailable</h2>
      <p>Example name (fixture-only)</p>
      <input
        aria-label="Example name (fixture-only)"
        value="Zenith example"
        readOnly
        disabled
      />
    </>
  );
}
export function Request() {
  const { requestId } = useParams();
  return requestId === "example-request" ? (
    <>
      <h1>Community request</h1>
      <h2>Example request</h2>
      <Status>Fixture only — not submitted</Status>
    </>
  ) : (
    <>
      <h1>Request not found</h1>
      <p>No registry lookup occurred.</p>
    </>
  );
}
export function Docs() {
  return (
    <>
      <h1>Documentation</h1>
      <h2>Scaffold documentation</h2>
      <p>
        This preview does not provide a live API, Matrix access, or production
        behavior.
      </p>
      <Link to="/docs/api">API</Link>{" "}
      <Link to="/docs/specs">Specifications</Link>{" "}
      <Link to="/docs/architecture/rfc-exchange">
        RFC exchange architecture
      </Link>
    </>
  );
}
export function ApiDocs() {
  return (
    <>
      <h1>API reference</h1>
      <h2>Contract source only</h2>
      <p>
        Local fixture contract documentation; no live API or authentication
        flow.
      </p>
    </>
  );
}
export function Specs() {
  return (
    <>
      <h1>Contract specifications</h1>
      <h2>Fixture schemas</h2>
      <p>Schemas describe fixtures, not runtime behavior.</p>
    </>
  );
}
export function NotFound() {
  return (
    <>
      <h1>Page not found</h1>
      <p>
        <Link to="/">Communities</Link> <Link to="/docs">Docs</Link>
      </p>
    </>
  );
}
