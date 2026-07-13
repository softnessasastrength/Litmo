/**
 * ConsentAcceptGate — explicit Accept + equal-weight Decline for share/post-tap.
 *
 * WHAT: Blocks content behind a banner of non-claims plus two actions:
 *       Accept (catalog primary) and Decline (request_decline grammar).
 * WHY:  NFC scan, QR decode, and nearby payload ready are NOT consent.
 *       postTapAutoAcceptMs is null forever — this gate is the second step.
 *       Without a shared component, screens drift into “auto-open on scan”.
 * CONSENT: SHARE kind. Accept authorizes review of a payload only when the
 *       point’s neverMeans say so (e.g. TL review-only). Decline is complete
 *       no with no explanation required.
 * EDGE CASES:
 *   - busy true → both buttons disabled (in-flight accept must not double-fire).
 *   - Accept/Decline labels overridable for context; a11y still from catalog.
 *   - neverMeans shown (first two) so the user sees non-claims before Accept.
 *   - Scan/decode success alone never mounts content — parent keeps payload
 *     closed until onAccept.
 * NEVER:
 *   - Accept ≠ dual seal, ≠ session start, ≠ Soft Signal practice complete.
 *   - Decline never requires a reason modal (forbidden by grammar).
 *   - Gate is not Soft Signal (stop path is SoftSignalButton).
 * SEE: docs/CODE_COMMENT_STANDARD.md, CONSENT_TIMING.postTapAutoAcceptMs,
 *      nfc_post_tap_accept / share_tl_accept / qr_invite_accept points.
 */

import { Text, View } from "react-native";
import { Button } from "./ui";
import {
  CONSENT_POINTS,
  type ConsentPointId,
  assertConsentPoint,
} from "../lib/consentInteractionCore";
import { fonts, radius, type AppColors } from "../theme";
import { useThemedStyles } from "../hooks/useThemedStyles";

type Props = {
  /**
   * Must be a share/post-tap style ConsentPointId.
   * assertConsentPoint fails closed if id is missing from catalog.
   */
  pointId: ConsentPointId;
  /**
   * Human disclaimer specific to this payload (what they are about to open).
   * Shown above Accept so “what” is not buried under the button.
   */
  disclaimer: string;
  /** Parent opens review content only after this fires. */
  onAccept: () => void;
  /**
   * Parent discards / closes without opening.
   * Must not open a “why did you decline?” modal.
   */
  onDecline: () => void;
  acceptLabel?: string;
  declineLabel?: string;
  /** In-flight network or crypto — disable both to prevent double accept. */
  busy?: boolean;
};

/**
 * WHAT: Render explicit accept/decline gate for share and post-tap surfaces.
 * WHY:  Single place to enforce “scan ≠ accept” and equal decline affordance.
 * CONSENT: Share accept is review-oriented; never session dual seal.
 * EDGE CASES: busy disables both; neverMeans preview; catalog a11y.
 * NEVER: Auto-accept; reason-required decline; treat Accept as touch consent.
 * SEE: Module header.
 */
export function ConsentAcceptGate({
  pointId,
  disclaimer,
  onAccept,
  onDecline,
  acceptLabel,
  declineLabel,
  busy,
}: Props) {
  const styles = useThemedStyles(makeStyles);
  // Closed catalog — inventing free-form point ids is a product defect.
  const spec = assertConsentPoint(pointId);

  return (
    // Outer wrap not a single a11y node — banner and buttons own their roles.
    <View style={styles.wrap} accessible={false}>
      <View style={styles.banner} accessible accessibilityRole="text">
        {/* Uppercase title is a non-color cue: explicit accept required. */}
        <Text style={styles.bannerTitle}>EXPLICIT ACCEPT REQUIRED</Text>
        {/* Context-specific “what you open” — parent must not leave this empty. */}
        <Text style={styles.bannerBody}>{disclaimer}</Text>
        {/*
          Surface the first two non-claims so Accept cannot be mistaken for
          touch permission. Full list remains in CONSENT_POINTS for review.
        */}
        <Text style={styles.never}>
          Never means: {spec.neverMeans.slice(0, 2).join(" · ")}
        </Text>
      </View>
      {/*
        Accept: moss primary path (share visual role).
        Disabled while busy so double-tap cannot open twice or race crypto.
      */}
      <Button
        label={acceptLabel ?? spec.copy.primary}
        onPress={onAccept}
        disabled={busy}
        accessibilityLabel={spec.a11yLabel}
        accessibilityHint={spec.a11yHint}
      />
      {/*
        Decline: signal variant = equal visual weight to “not now”, not a
        greyed afterthought. Copy from request_decline + “no explanation needed”
        so we never imply the user owes a story for saying no.
      */}
      <Button
        variant="signal"
        label={
          declineLabel ??
          CONSENT_POINTS.request_decline.copy.primary + " — no explanation needed"
        }
        onPress={onDecline}
        disabled={busy}
        accessibilityLabel={CONSENT_POINTS.request_decline.a11yLabel}
        accessibilityHint={CONSENT_POINTS.request_decline.a11yHint}
      />
    </View>
  );
}

/**
 * WHAT: Styles for the accept gate banner and spacing.
 * WHY:  Moss soft banner for share/prepare attention — not signal rose
 *       (signal is reserved for Soft Signal / hard decline button variant).
 * CONSENT: Banner is inform + non-claims; buttons carry share/decline kinds.
 * EDGE CASES: None pure presentational beyond theme.
 * NEVER: Styling alone must not auto-accept or hide Decline.
 */
function makeStyles(colors: AppColors) {
  return {
    wrap: { gap: 12 },
    banner: {
      backgroundColor: colors.mossSoft,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.moss,
      padding: 14,
      gap: 6,
    },
    bannerTitle: {
      color: colors.moss,
      fontSize: 11,
      fontWeight: "800" as const,
      letterSpacing: 1,
    },
    bannerBody: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: fonts.headline,
    },
    never: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
    },
  };
}
