export type FinalCtaMode = "badge" | "text";

/** Site switches for decisions that are still open. */
export class SiteConfig {
  /** D10. "badge" until Gor chooses a text button for the final CTA. */
  static readonly finalCta: FinalCtaMode = "badge";

  /** D6. Null hides the Contact link so it cannot be a dead link. */
  static readonly contactHref: string | null = null;

  /**
   * D12. Null until someone accepts launching with no public contact.
   * `by` is the person, `at` is the ISO date. check:launch also requires
   * ACCEPT_NO_CONTACT=true in the environment that builds the launch.
   */
  static readonly acceptNoContact: { by: string; at: string } | null = null;

  /**
   * D3. Null until Gor or his brother has seen the Umami test event
   * on lingumaster.app. `by` is the person, `at` is the ISO date.
   * The Website ID is a Netlify production environment variable, not a field here.
   */
  static readonly analytics = {
    testEventSeen: null as { by: string; at: string } | null,
  };
}
