// Fixed identity of the nursing home, printed exactly as on the logo and the
// pre-printed paper forms. This is intentionally static: it is not read from
// the hospital settings stored in the database.
export const HOSPITAL = {
  name: "SURAKSHYA NURSING HOME",
  nameBn: "সুরক্ষা নার্সিং হোম",
  shortName: "SNH",
  places: ["Dharinda", "Tamluk", "Purba Medinipur"],
  placesBn: ["ধারিন্দা", "তমলুক", "পূর্ব মেদিনীপুর"],
  pin: "721636",
  phone: "(03228) 263365",
  mobile: "8372056083",
  email: "surakshyanursinghome17@gmail.com",
  logo: "/surakshya-logo.jpg",
};

// "Dharinda, Tamluk, Purba Medinipur, PIN - 721636"
export const HOSPITAL_ADDRESS = `${HOSPITAL.places.join(", ")}, PIN - ${HOSPITAL.pin}`;

// "Ph.- (03228) 263365, Mob.- 8372056083"
export const HOSPITAL_CONTACT = `Ph.- ${HOSPITAL.phone}, Mob.- ${HOSPITAL.mobile}`;
