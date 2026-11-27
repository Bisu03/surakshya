import Billing from "@/models/Billing.models";
import Counter from "@/models/Counter.models";
import Ipd from "@/models/Ipd.models";
import Patient from "@/models/Patient.models";
import { reserveSequence } from "@/lib/sequence";

// REGIDs can be typed in by hand on the admission form, so the "regid" counter
// may run into a number that is already taken. Everything that hands out or
// accepts a REGID goes through these helpers so a number is never used twice.

const MAX_SKIP = 1000;

// A positive whole number, or null.
export function parseRegId(value) {
  const text = String(value ?? "").trim();
  if (!/^\d+$/.test(text)) return null;
  const number = Number(text);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

// Taken once any admission, patient registration or bill carries it.
export async function isRegIdTaken(regId) {
  const [ipd, patient, billing] = await Promise.all([
    Ipd.exists({ reg_id: regId }),
    Patient.exists({ reg_id: regId }),
    Billing.exists({ reg_id: String(regId) }),
  ]);
  return Boolean(ipd || patient || billing);
}

// The number reserveRegId() would hand out next, without reserving it.
export async function peekNextRegId() {
  const counter = await Counter.findOne({ id: "regid" }).lean();
  let next = (counter?.seq || 0) + 1;
  for (let i = 0; i < MAX_SKIP && (await isRegIdTaken(next)); i++) next++;
  return next;
}

// Reserve the next free REGID, skipping numbers that were entered by hand.
export async function reserveRegId() {
  for (let i = 0; i < MAX_SKIP; i++) {
    const regId = await reserveSequence("regid");
    if (!(await isRegIdTaken(regId))) return regId;
  }
  throw new Error("Unable to find a free IPD ID");
}
