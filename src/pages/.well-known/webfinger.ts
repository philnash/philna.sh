import { MASTODON_INSTANCE, MASTODON_USERNAME } from "../../consts";

export function get() {
  return {
    body: JSON.stringify({
      subject: `acct:${MASTODON_USERNAME}@${MASTODON_INSTANCE}`,
      aliases: [
        `https://${MASTODON_INSTANCE}/@${MASTODON_USERNAME}`,
        `https://${MASTODON_INSTANCE}/users/${MASTODON_USERNAME}`,
      ],
      links: [
        {
          rel: "http://webfinger.net/rel/profile-page",
          type: "text/html",
          href: `https://${MASTODON_INSTANCE}/@${MASTODON_USERNAME}`,
        },
        {
          rel: "self",
          type: "application/activity+json",
          href: `https://${MASTODON_INSTANCE}/users/${MASTODON_USERNAME}`,
        },
        {
          rel: "http://ostatus.org/schema/1.0/subscribe",
          template: `https://${MASTODON_INSTANCE}/authorize_interaction?uri={uri}`,
        },
      ],
    }),
  };
}
