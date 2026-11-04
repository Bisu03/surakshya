// Display formatting helpers for patient identifiers.
// These only affect how values are shown (static/display), never the stored
// mrd_id / reg_id fields in the database.

export const ipNo = (value) =>
  value || value === 0 ? `REGID${value}` : "";

export const prsNo = (value) =>
  value || value === 0 ? `UHID${value}` : "";

// "69" + "Male" -> "69Y/M". Adds a trailing "Y" only if the age looks numeric
// and doesn't already carry a unit letter.
export const ageSex = (age, gender) => {
  const rawAge = age === null || age === undefined ? "" : String(age).trim();
  const withUnit =
    rawAge && /^\d+$/.test(rawAge) ? `${rawAge}Y` : rawAge;
  const sex = gender ? String(gender).trim().charAt(0).toUpperCase() : "";
  if (withUnit && sex) return `${withUnit}/${sex}`;
  return withUnit || sex || "";
};
