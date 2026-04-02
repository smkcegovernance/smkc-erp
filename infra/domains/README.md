# Domain and Routing Strategy

## Initial Strategy

- Primary host: `smkc.in`
- Department routes: `smkc.in/{department}`

## Future Subdomain Strategy

- Department host: `{department}.smkc.in`
- Use edge/router mapping to dispatch by host header.

## Promotion Criteria (Route -> Subdomain)

- Distinct security/compliance boundary.
- High independent traffic profile.
- Separate release cadence or ownership.
- Operational need for isolated scaling.

