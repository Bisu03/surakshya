"use client";

import Loading from "@/components/Loading";
import PrintUi from "@/components/ui/PrintUi";
import { formatDate } from "@/lib/formateDate";
import { HOSPITAL } from "@/lib/hospitalBrand";
import { fetchData } from "@/services/apiService";
import { withAuth } from "@/services/withAuth";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useParams } from "next/navigation";

// Printed copy of the hospital's 4-page paper Discharge Summary. Only the
// patient's identity is filled in from the admission; every section is left
// as blank writing space. Text typed on the Discharge screen (optional) is
// printed inside the matching section.

const MEDICATION_ROWS = 14;

const URGENT_CARE_SIGNS = [
  "Fever",
  "Chest Pain",
  "Stroke",
  "Infection",
  "Severe and sudden Abdominal pain",
  "Low Blood Glucose level",
  "Uncontrolled Bleeding",
  "Loss of consciousness",
  "Sudden Paralysis and slurred speech",
  "Blood vomiting",
  "Any unusual Symptoms",
];

const clean = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const joinText = (...values) => values.map(clean).filter(Boolean).join("\n");

function Field({ label, value, className = "" }) {
  return (
    <div className={`ds-field ${className}`}>
      <span className="ds-field-label">{label}</span>
      <span className="ds-field-value">{clean(value)}</span>
    </div>
  );
}

// A titled block of blank writing space. `heightMm` is the minimum space left
// for handwriting; typed text (if any) is printed at the top of it.
function Section({ title, heightMm, text, bullet = true, children }) {
  return (
    <section className="ds-section" style={{ minHeight: `${heightMm}mm` }}>
      <h3 className={`ds-section-title ${bullet ? "has-bullet" : ""}`}>
        {title}
      </h3>
      {children}
      {clean(text) && <p className="ds-section-text">{clean(text)}</p>}
    </section>
  );
}

function SubSection({ marker, title, heightMm, text }) {
  return (
    <div className="ds-subsection" style={{ minHeight: `${heightMm}mm` }}>
      <p className="ds-subsection-title">
        <span className="ds-marker">{marker}</span> {title} :
      </p>
      {clean(text) && <p className="ds-section-text">{clean(text)}</p>}
    </div>
  );
}

function PatientStrip({ name, ipNo }) {
  return (
    <div className="ds-strip">
      <Field label="Patient's Name" value={name} />
      <Field label="REGID" value={ipNo} />
    </div>
  );
}

function SignatureBlock({ title }) {
  return (
    <div className="ds-signature">
      <p className="ds-signature-title">{title}</p>
      <Field label="Name :" />
      <Field label="Regn No :" />
      <Field label="Date & Time :" />
    </div>
  );
}

function DischargePrint() {
  const { slug } = useParams();
  const { data, error, isLoading, isError } = useQuery({
    queryKey: ["discharge-print", slug],
    queryFn: () => fetchData(`/discharge/${slug}`),
    enabled: Boolean(slug),
    retry: (failureCount, requestError) => {
      const status = requestError?.response?.status;
      return ![400, 401, 403, 404].includes(status) && failureCount < 2;
    },
    staleTime: 300000,
  });

  if (isLoading) return <Loading />;
  if (isError) {
    return (
      <PrintUi path="/discharge/create">
        <div className="m-6 border border-red-300 bg-red-50 p-4 text-red-700">
          {error?.response?.data?.message || "Unable to load discharge summary"}
        </div>
      </PrintUi>
    );
  }

  const record = data?.data || {};
  const patient = record.patient || {};
  const ipd = record.ipd || {};
  const consultant = record.consultant || {};

  const admittedOn = [
    formatDate(clean(record.admit_date) || clean(ipd.admit_date)),
    clean(ipd.admit_time),
  ]
    .filter(Boolean)
    .join("  ");
  const dischargedOn = [
    formatDate(clean(record.discharge_date)),
    clean(record.discharge_time),
  ]
    .filter(Boolean)
    .join("  ");

  const investigations = joinText(
    record.laboratory_investigations,
    record.radiology_investigations,
    record.other_investigations,
    record.summary_key_inv
  );
  const otherInstructions = joinText(
    record.special_instructions,
    record.advice_discharge,
    record.advice,
    record.activity
  );
  const followUp =
    clean(record.follow_up) ||
    (record.review_date ? formatDate(record.review_date) : "");
  const referredTo = Array.isArray(record.referred_to) ? record.referred_to : [];
  const drugs = Array.isArray(record.drugs) ? record.drugs : [];
  const medicationRows = Array.from(
    { length: Math.max(MEDICATION_ROWS, drugs.length) },
    (_, index) => drugs[index] || {}
  );

  return (
    <PrintUi path="/discharge/create">
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 7mm;
        }

        .ds-document,
        .ds-document * {
          box-sizing: border-box;
        }

        .ds-page {
          display: flex;
          flex-direction: column;
          width: 196mm;
          min-height: 283mm;
          margin: 0 auto 8mm;
          border: 0.35mm solid #111;
          padding: 4mm 7mm;
          background: #fff;
          color: #111;
          font-family: Calibri, Carlito, Arial, Helvetica, sans-serif;
          font-size: 11pt;
          line-height: 1.3;
        }

        .ds-header {
          display: grid;
          grid-template-columns: 24mm 1fr 24mm;
          align-items: center;
          text-align: center;
        }

        .ds-hospital-name {
          margin: 0;
          font-family: "Cooper Black", "Bookman Old Style", Georgia, serif;
          font-size: 22pt;
          font-weight: 700;
          letter-spacing: 0.3pt;
        }

        .ds-hospital-line {
          margin: 1mm 0 0;
          font-size: 12pt;
          font-weight: 700;
        }

        .ds-title {
          margin: 3mm 0 4mm;
          font-size: 18pt;
          font-weight: 700;
          text-align: center;
          text-decoration: underline;
          text-underline-offset: 1.2mm;
        }

        .ds-patient {
          display: grid;
          gap: 2.5mm;
          margin: 0 -7mm 2mm;
          border-bottom: 0.35mm solid #111;
          padding: 2mm 7mm 3mm;
          font-size: 9.5pt;
        }

        .ds-row {
          display: grid;
          gap: 3mm;
        }

        .ds-row-name {
          grid-template-columns: 1fr 28mm 24mm;
        }

        .ds-row-ip {
          grid-template-columns: 40mm 30mm 1fr;
        }

        .ds-row-dates {
          grid-template-columns: 1fr 1fr;
        }

        .ds-field {
          display: flex;
          min-width: 0;
          align-items: flex-end;
          gap: 1mm;
          white-space: nowrap;
        }

        .ds-field-label {
          flex: 0 0 auto;
        }

        .ds-field-value {
          min-width: 0;
          min-height: 4.5mm;
          flex: 1 1 auto;
          overflow: hidden;
          border-bottom: 0.25mm dotted #333;
          padding: 0 1mm 0.3mm;
          font-weight: 700;
          text-overflow: ellipsis;
        }

        .ds-strip {
          display: grid;
          grid-template-columns: 1fr 50mm;
          gap: 6mm;
          margin-bottom: 4mm;
          font-size: 9.5pt;
        }

        .ds-section {
          padding-left: 12mm;
          margin-top: 2mm;
        }

        .ds-section-title {
          position: relative;
          margin: 0;
          font-size: 12pt;
          font-weight: 700;
        }

        .ds-section-title.has-bullet::before {
          content: "•";
          position: absolute;
          left: -6mm;
        }

        .ds-section-note {
          margin: 0;
          font-size: 12pt;
        }

        .ds-section-text {
          margin: 1.5mm 0 0;
          white-space: pre-wrap;
        }

        .ds-subsection {
          margin-top: 2mm;
          font-size: 12pt;
        }

        .ds-subsection-title {
          margin: 0;
        }

        .ds-marker {
          font-weight: 700;
        }

        .ds-referrals {
          margin: 3mm 0 0 -12mm;
          padding: 0;
          list-style: none;
        }

        .ds-referrals li {
          display: flex;
          gap: 4mm;
          height: 9mm;
          align-items: flex-end;
          font-weight: 700;
        }

        .ds-referrals span:last-child {
          flex: 1;
          border-bottom: 0.25mm dotted #999;
          font-weight: 400;
        }

        .ds-medication {
          width: 100%;
          margin-top: 2mm;
          border-collapse: collapse;
          font-size: 11pt;
        }

        .ds-medication th,
        .ds-medication td {
          border: 0.3mm solid #111;
          padding: 0.8mm 1.5mm;
          text-align: left;
        }

        .ds-medication th {
          font-weight: 700;
          text-align: center;
        }

        .ds-medication td {
          height: 9mm;
        }

        .ds-urgent {
          margin: 2mm 0 0 6mm;
          padding: 0;
          font-weight: 700;
          list-style: disc;
        }

        .ds-urgent li {
          margin: 0.6mm 0;
        }

        .ds-warning {
          margin: 10mm 0 0;
          font-size: 12pt;
          font-weight: 700;
          line-height: 1.45;
        }

        .ds-numbers {
          margin: 6mm 0 0 6mm;
          padding: 0;
          font-weight: 700;
        }

        .ds-numbers li {
          margin-bottom: 8mm;
        }

        .ds-signatures {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14mm;
          margin-top: 6mm;
          font-weight: 700;
        }

        .ds-signature {
          display: grid;
          gap: 3.5mm;
        }

        .ds-signature-title {
          margin: 0 0 1mm;
        }

        .ds-signature .ds-field-value {
          font-weight: 400;
        }

        @media print {
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }

          .ds-page {
            /* auto keeps the sheet centred when the print dialog scales it */
            margin: 0 auto !important;
            break-after: page;
            page-break-after: always;
          }

          .ds-page:last-child {
            break-after: auto;
            page-break-after: auto;
          }
        }
      `}</style>

      <div className="ds-document">
        {/* Page 1 */}
        <article className="ds-page">
          <header className="ds-header">
            <Image
              src={HOSPITAL.logo}
              alt={`${HOSPITAL.name} logo`}
              width={86}
              height={86}
              priority
              style={{ width: "22mm", height: "22mm", objectFit: "contain" }}
            />
            <div>
              <h1 className="ds-hospital-name">{HOSPITAL.name}</h1>
              <p className="ds-hospital-line">
                {HOSPITAL.places.join(" * ").toUpperCase()} * PIN-{HOSPITAL.pin}
              </p>
              <p className="ds-hospital-line">
                Phone – {HOSPITAL.phone} * Mobile – {HOSPITAL.mobile}
              </p>
            </div>
            <span aria-hidden="true" />
          </header>
          <h2 className="ds-title">DISCHARGE SUMMARY</h2>

          <section className="ds-patient">
            <div className="ds-row ds-row-name">
              <Field label="Patient's Name" value={patient.fullname} />
              <Field label="Age" value={patient.age} />
              <Field label="Sex" value={patient.gender} />
            </div>
            <div className="ds-row ds-row-ip">
              <Field label="REGID" value={record.reg_id} />
              <Field label="Bed No" />
              <Field label="Admitting Consultant:" value={consultant.drname} />
            </div>
            <div className="ds-row ds-row-dates">
              <Field label="Date of Discharge/ LAMA" value={dischargedOn} />
              <Field label="Date & Time of Admission" value={admittedOn} />
            </div>
          </section>

          <Section
            title="Final Diagnosis :"
            heightMm={42}
            text={record.final_diagnosis}
          />
          <Section title="History:" heightMm={0} />
          <div className="ds-section">
            <SubSection
              marker="A."
              title="Presenting Complaints"
              heightMm={26}
              text={record.present_complain}
            />
            <SubSection
              marker="B."
              title="Past Medical/Surgical/Family/Other History"
              heightMm={30}
              text={record.past_history}
            />
            <SubSection
              marker="C."
              title="History of Drug Allergy"
              heightMm={18}
              text={record.drug_allergy}
            />
          </div>
          <Section
            title="Clinical Finding on Admission :"
            heightMm={48}
            text={joinText(record.key_finding, record.general_appreance)}
          />
        </article>

        {/* Page 2 */}
        <article className="ds-page">
          <PatientStrip name={patient.fullname} ipNo={record.reg_id} />
          <Section
            title="Investigations:"
            heightMm={58}
            text={investigations}
          >
            <p className="ds-section-note">
              ( All investigations are attached and handed over to patient/
              Relatives along with this Discharge paper. Only important
              investigations are mentioned here.)
            </p>
          </Section>
          <Section
            title="Course of treatment in Hospital :"
            heightMm={40}
            text={joinText(record.coursein_hp, record.treatment_given)}
          />
          <Section title="The patient was referred to:" heightMm={0}>
            <ol className="ds-referrals">
              {[0, 1, 2, 3].map((index) => (
                <li key={index}>
                  <span>{index + 1}.</span>
                  <span>{clean(referredTo[index])}</span>
                </li>
              ))}
            </ol>
          </Section>
          <Section
            title="OT details/ procedure performed ( If Applicable) :"
            heightMm={38}
            text={joinText(record.procedures, record.surgery, record.surgery_note)}
          />
          <Section
            title="Post- Operative progress : (If Applicable) :"
            heightMm={26}
            text={record.post_operative_progress}
          />
          <Section
            title="Condition of the patient at the time of discharge :"
            heightMm={26}
            text={record.condition_discharge}
          />
        </article>

        {/* Page 3 */}
        <article className="ds-page">
          <PatientStrip name={patient.fullname} ipNo={record.reg_id} />
          <Section title="Medication advice on discharge :" heightMm={0} />
          <table className="ds-medication">
            <thead>
              <tr>
                <th style={{ width: "9mm" }}>Sl.</th>
                <th>Drug Name</th>
                <th style={{ width: "27mm" }}>Dosage</th>
                <th style={{ width: "27mm" }}>Route</th>
                <th style={{ width: "27mm" }}>Frequency</th>
                <th style={{ width: "27mm" }}>Duration</th>
              </tr>
            </thead>
            <tbody>
              {medicationRows.map((drug, index) => (
                <tr key={index}>
                  <td>{clean(drug.name) ? index + 1 : ""}</td>
                  <td>{clean(drug.name)}</td>
                  <td>{clean(drug.dosage)}</td>
                  <td>{clean(drug.route)}</td>
                  <td>{clean(drug.frequency)}</td>
                  <td>{clean(drug.duration)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Section title="Diet advice :" heightMm={24} text={record.diet} />
          <Section
            title="Other Instruction :"
            heightMm={24}
            text={otherInstructions}
          />
          <Section title="Follow-up Date :" heightMm={16} text={followUp} />
        </article>

        {/* Page 4 */}
        <article className="ds-page">
          <PatientStrip name={patient.fullname} ipNo={record.reg_id} />
          <h3 className="ds-section-title">Details When To Seek Urgent Care :</h3>
          <ul className="ds-urgent">
            {URGENT_CARE_SIGNS.map((sign) => (
              <li key={sign}>{sign}</li>
            ))}
          </ul>

          <p className="ds-warning">
            *** In case you continue to be sick despite medication with no
            relief of signs and symptoms or feel very unwell and new symptoms
            develop, or in case of any medical emergency, please contact the
            Hospital emergency and attend the Emergency Department immediately
            or contact any other Hospital.
          </p>

          <ol className="ds-numbers">
            <li>Emergency police number -</li>
            <li>
              Phone number for OPD Appointment (7 days prior to follow-up
              dates) -
            </li>
            <li>Ambulance phone number -</li>
          </ol>

          <div className="ds-signatures">
            <SignatureBlock title="Signature of Consultant" />
            <SignatureBlock title="Signature of Duty Doctor" />
          </div>
        </article>
      </div>
    </PrintUi>
  );
}

export default withAuth(DischargePrint);
