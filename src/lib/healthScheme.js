// Single source of truth for the IPD admission "Admission Type" and
// "Payment Mode" dropdowns and for government health-scheme detection.
//
// These options are plain strings (no DB enum), and combined selections such
// as "Ayushman Bharat + Cash" are supported. The admission-consent print reads
// admit_type + paidby and maps any detected scheme(s) to Bengali text, so the
// detection below must stay tolerant of combined values and spelling variants.

export const ADMISSION_TYPE_OPTIONS = [
  "General",
  "Emergency",
  "Corporate",
  "Insurance / TPA",
  "Swasthya Sathi",
  "Ayushman Bharat",
  "Ayushman Bharat + Cash",
  "Swasthya Sathi + Cash",
  "Ayushman Bharat + Swasthya Sathi",
];

export const PAYMENT_MODE_OPTIONS = [
  "Cash",
  "UPI",
  "Debit / Credit Card",
  "Credit",
  "Corporate",
  "TPA / Cashless",
  "Demand Draft",
  "Cheque",
  "Purchase Order",
  "Swasthya Sathi",
  "Ayushman Bharat",
  "Cash + Online",
  "Ayushman Bharat + Cash",
  "Swasthya Sathi + Cash",
  "Ayushman Bharat + Swasthya Sathi",
];

// Canonical scheme names, in the order they should appear when combined.
export const HEALTH_SCHEMES = ["Ayushman Bharat", "Swasthya Sathi"];

// Substrings that identify each scheme inside a free-form admit_type / paidby
// value. Tolerant of "Swasthya Sathi", "Sasthyasathi", "Sasthyasati", etc.
const SCHEME_NEEDLES = {
  "Ayushman Bharat": ["ayushman", "ayusman"],
  "Swasthya Sathi": ["swasthya", "sasthya"],
};

// Returns the canonical scheme names present in the given values (any number
// of admit_type / paidby strings), e.g. ["Ayushman Bharat", "Swasthya Sathi"].
export function detectHealthSchemes(...values) {
  const haystack = values
    .map((value) => (value == null ? "" : String(value)))
    .join(" ")
    .toLowerCase();
  return HEALTH_SCHEMES.filter((scheme) =>
    SCHEME_NEEDLES[scheme].some((needle) => haystack.includes(needle))
  );
}
