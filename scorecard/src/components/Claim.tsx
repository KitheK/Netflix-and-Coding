import type { TextClaim } from "../lib/schemas";

export function Claim({ claim, as: Tag = "p" }: { claim: TextClaim; as?: "p" | "span" | "li" }) {
  return (
    <Tag className="claim" data-provenance={claim.provenance}>
      {claim.text}
    </Tag>
  );
}
