import * as Sentry from "@sentry/astro";

Sentry.init({
  dsn: "https://e8afede6acb62b288d18111f8efe8468@o4510739418382336.ingest.de.sentry.io/4510739421397072",
  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/astro/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});
