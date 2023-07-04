import ga4mp from "@analytics-debugger/ga4mp";
const ga4track = ga4mp(["G-M4KGRYKHK2"], {
  user_id: undefined,
  non_personalized_ads: true,
});
ga4track.trackEvent("page_view");
