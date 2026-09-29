/**
 * Context Router — explicit, deterministic front door into existing protocols.
 * Containment job: reduce cathedral buffet paralysis when the user has enough
 * capacity to name only what is happening and what they need next.
 *
 * Never: diagnose, score distress, infer partner state, auto-contact anyone,
 * or claim there is one correct protocol. The user can always ignore the route.
 */

export type ContextState =
  | "flooded"
  | "closeness_scared"
  | "need_to_communicate"
  | "post_conflict"
  | "understand_myself";

export type ContextGoal =
  | "settle"
  | "ask"
  | "repair"
  | "understand"
  | "be_close";

export type ContextCapacity = "low" | "some" | "open";

export type ContextRouteInput = {
  state: ContextState;
  goal?: ContextGoal;
  capacity?: ContextCapacity;
};

export type ContextRoute = {
  href: string;
  title: string;
  why: string;
};

const route = (href: string, title: string, why: string): ContextRoute => ({
  href,
  title,
  why,
});

/**
 * Pick one existing door from explicit answers only.
 * Ordering is intentional: low capacity / flood gets the smallest immediate
 * regulation surface before reflective or communication work.
 */
export function routeContext(input: ContextRouteInput): ContextRoute {
  if (input.state === "flooded" || input.capacity === "low") {
    return route(
      "/flood",
      "Flood Protocol",
      "Capacity is low or language is disappearing. Start with the smallest landing path; no essay required.",
    );
  }

  if (input.state === "post_conflict" || input.goal === "repair") {
    return route(
      "/reconcile",
      "Post-Fight Reconciliation",
      "The immediate job is repair, not proving who was right. Rehearse a return without auto-sending anything.",
    );
  }

  if (input.state === "need_to_communicate" || input.goal === "ask") {
    return route(
      "/pre-renn",
      "Pre-Renn Regulation Gate",
      "You want to reach outward. Check capacity and purpose first so contact stays a choice instead of a pressure-release valve.",
    );
  }

  if (input.state === "closeness_scared") {
    if (input.goal === "be_close" && input.capacity === "open") {
      return route(
        "/parallel-play",
        "Parallel Play But Make It Sacred",
        "Closeness is wanted and capacity is open. Try a form of connection that does not require performance or touch.",
      );
    }
    return route(
      "/need-scared",
      "I Need You But I'm Scared You'll Leave",
      "Both need and fear are present. Hold both poles before turning either one into a verdict about the relationship.",
    );
  }

  if (input.goal === "be_close") {
    return route(
      "/parallel-play",
      "Parallel Play But Make It Sacred",
      "You want connection without needing to manufacture intensity. Quiet co-presence counts.",
    );
  }

  return route(
    "/weather",
    "Nervous System Weather",
    "Nothing needs to be solved yet. Name the current sky before choosing a heavier protocol.",
  );
}
