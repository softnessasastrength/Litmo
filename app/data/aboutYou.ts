/**
 * A first-draft, editable option set — not a definitive taxonomy. Matches
 * common patterns from current mainstream apps (a broad list plus an
 * explicit self-describe option) rather than assuming any fixed list is
 * complete. Revisit with real research/community input before this becomes
 * more than a prototype.
 */
export const genderOptions = [
  "Woman",
  "Man",
  "Non-binary",
  "Genderfluid",
  "Genderqueer",
  "Transgender woman",
  "Transgender man",
  "Agender",
  "Two-Spirit",
] as const;

export const orientationOptions = [
  "Straight",
  "Gay",
  "Lesbian",
  "Bisexual",
  "Pansexual",
  "Asexual",
  "Demisexual",
  "Queer",
  "Questioning",
] as const;

export type AboutYouAnswers = {
  name: string;
  age: string;
  gender: string;
  genderCustom: string;
  orientation: string;
  orientationCustom: string;
};

export const initialAboutYouAnswers: AboutYouAnswers = {
  name: "",
  age: "",
  gender: "",
  genderCustom: "",
  orientation: "",
  orientationCustom: "",
};
