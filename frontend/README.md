# frontend — the client applications

Astro + Tailwind CSS. They are the **three differentiated interfaces** the statement asks for, with separated
responsibilities: each one talks to the API with the role that corresponds to it.

For now `frontend/` only contains this README: the application is still to be created (see "Pending").

## The three applications

| Application | Who uses it (role) | What for |
| --- | --- | --- |
| Users | `user` | register, see available resources by zone, reserve, start and finish rides, check their history |
| Maintenance and operations | `maintenance`, `admin` | see resources with low battery or breakdown, withdraw and reinstate them, record tasks and purchases, manage relocation orders |
| Operational dashboard | `maintenance`, `admin` | fleet state, reservations and rides per time slot, zones with deficit or excess, orders and system health |

## Which routes each one uses

The complete route table, with method, role and status, is in `backend/README.md` (generated from
`backend/functions.json`). Here only the split, by prefix:

| Application | Route prefixes |
| --- | --- |
| Users | `/auth/*`, `/profiles/me`, `/zones`, `/availability`, `/reservations`, `/rides`, `/incidents` (create), `/history/me`, `/notifications` |
| Maintenance and operations | `/vehicles`, `/acquisitions`, `/telemetry/attention`, `/incidents`, `/maintenance-orders/*`, `/relocation-orders/*`, `/availability/summary`, `/history/vehicles/{vehicleId}`, `/history/correlations/{correlationId}` |
| Operational dashboard | `/analytics/dashboard`, `/analytics/marts/{mart}`, `/analytics/health`, `/analytics/failed-events` (`admin` only) |

The dashboard paints its first screen with **a single call** (`GET /analytics/dashboard`), designed to load
fast on mobile, and asks for the detail of each chart only when needed.

Authentication is a signed token that travels in the `Authorization` header; `identity-authorize` validates it
in API Gateway. The frontend never computes business logic: neither costs nor availability.

## Mobile performance

It is measured with Lighthouse in mobile mode and cared for by design: Astro sends no JavaScript except in
islands, and these are hydrated only when visible. The concrete budget for JavaScript, images and fonts is still
to be set.

## Pending

- **Create the project:** decide whether it is three Astro applications or one with three role-protected areas,
  and document how to run, build and test it (real commands from `package.json`).
- **API client:** a single interface with a test implementation (simulated data) and one against the real
  backend, chosen by an environment variable.
- **Mobile performance budget** and the latest measurement.
- **Deployment:** what is published and where (see `infrastructure/README.md`).
