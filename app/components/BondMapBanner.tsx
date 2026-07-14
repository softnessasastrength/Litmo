/**
 * BondMapBanner — shared Relationship Model strip for containment protocols.
 * Model is not consent. Soft Signal freeness never reduced by this chrome.
 */
import { Body, Button, Card } from "./ui";
import {
  modelBannerLine,
  type RelationshipModel,
} from "../lib/relationshipModelCore";

type Props = {
  model: RelationshipModel | null;
  /** Extra muted line when closenessStyle is touch_primary */
  touchPrimaryNote?: string;
  /** When no model sealed yet */
  emptyNote?: string;
  onOpenModel: () => void;
};

export function BondMapBanner({
  model,
  touchPrimaryNote,
  emptyNote = "No Relationship Model yet. Seal a bond map so protocols can share climate without dumping on a human. Model is not consent. Soft Signal free.",
  onOpenModel,
}: Props) {
  if (!model) {
    return (
      <Card>
        <Body muted>{emptyNote}</Body>
        <Button
          variant="secondary"
          label="Seal Relationship Model"
          onPress={onOpenModel}
        />
      </Card>
    );
  }

  return (
    <Card>
      <Body muted>Bond map: {modelBannerLine(model)}</Body>
      {model.closenessStyle === "touch_primary" && touchPrimaryNote ? (
        <Body muted>{touchPrimaryNote}</Body>
      ) : (
        <Body muted>
          Model is not consent. Soft Signal free. Banner does not seal a session.
        </Body>
      )}
      <Button
        variant="secondary"
        label="Open Relationship Model"
        onPress={onOpenModel}
      />
    </Card>
  );
}
