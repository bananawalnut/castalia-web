/** Generated from the canonical Castalia fixture contract. Do not edit. */

export interface paths {
  "/api/v1/communities": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List fixture communities */
    get: operations["listFixtureCommunities"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/community-requests/example-request": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Read the example fixture request */
    get: operations["getFixtureCommunityRequest"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/session": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Read the unavailable fixture session */
    get: operations["getFixtureSession"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/health": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Read fixture process health */
    get: operations["getHealth"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
}
export type webhooks = Record<string, never>;
export interface components {
  schemas: {
    /** Fixture community request */
    "community-request.schema": {
      /**
       * Format: date-time
       * @constant
       */
      createdAt: "2026-01-01T00:00:00.000Z";
      /** @constant */
      id: "example-request";
      /** @constant */
      label: "Example request";
      /** @constant */
      status: "fixture_only_not_submitted";
    };
    /** Fixture community */
    "community.schema": {
      /** @constant */
      availability: "unavailable";
      /** @constant */
      name: "Zenith";
      /** @constant */
      slug: "zenith";
    };
    /** Fixture session */
    "session.schema": {
      /** @constant */
      fixtureMode: true;
      /** @constant */
      status: "unavailable";
    };
  };
  responses: never;
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
  listFixtureCommunities: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Permitted fixture community read */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["community.schema"][];
        };
      };
    };
  };
  getFixtureCommunityRequest: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Permitted example request read */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["community-request.schema"];
        };
      };
    };
  };
  getFixtureSession: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Unavailable fixture session */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["session.schema"];
        };
      };
    };
  };
  getHealth: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Process health and fixture posture */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": {
            /** @constant */
            fixtureMode: true;
            /** @constant */
            status: "ok";
          };
        };
      };
    };
  };
}
