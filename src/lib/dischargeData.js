// Every field is optional: the discharge summary is printed on the hospital's
// paper format and may be filled in by hand, so nothing has to be typed here.
export const DISCHARGE_TEXT_FIELDS = [
  "final_diagnosis",
  "present_complain",
  "past_history",
  "drug_allergy",
  "key_finding",
  "coursein_hp",
  "treatment_given",
  "procedures",
  "post_operative_progress",
  "laboratory_investigations",
  "radiology_investigations",
  "other_investigations",
  "condition_discharge",
  "advice_discharge",
  "diet",
  "activity",
  "special_instructions",
  "follow_up",
];

// The paper form has four "referred to" lines.
const REFERRAL_LINES = 4;

const clean = (value) =>
  value === null || value === undefined ? "" : String(value).trim();

export function normalizeDischargePayload(body = {}) {
  const payload = Object.fromEntries(
    DISCHARGE_TEXT_FIELDS.map((field) => [field, clean(body[field])])
  );

  payload.discharge_date = clean(body.discharge_date);
  payload.discharge_time = clean(body.discharge_time);
  payload.referred_to = Array.isArray(body.referred_to)
    ? body.referred_to.slice(0, REFERRAL_LINES).map(clean)
    : [];
  payload.drugs = Array.isArray(body.drugs)
    ? body.drugs
        .map((drug) => ({
          name: clean(drug?.name),
          dosage: clean(drug?.dosage),
          route: clean(drug?.route),
          duration: clean(drug?.duration),
          frequency: clean(drug?.frequency),
        }))
        .filter((drug) => drug.name)
    : [];

  return payload;
}

// Discharge date/time are copied onto the IPD admission only when entered, so
// saving a summary without them never clears dates set elsewhere.
export function ipdDischargeUpdate(payload) {
  if (!payload.discharge_date) return null;
  return {
    discharge_date: payload.discharge_date,
    discharge_time: payload.discharge_time,
  };
}
