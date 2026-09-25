/** Enough of a Role to populate a dropdown (e.g. assigning a role while inviting a new
 * staff member) — not the full model with its permission list. */
export interface RoleLookup {
  id: string;
  name: string;
  slug: string;
}
