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
import { useState } from "react";

// Admission form (ভর্তির ফর্ম) printed exactly like the hospital's paper form,
// as a Bengali page, an English page, or both. Patient details are filled in
// from the admission; signatures and the discharge strip are left blank.

const clean = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const TEXT = {
  bn: {
    badge: "ভর্তির ফর্ম",
    hospitalName: HOSPITAL.nameBn,
    places: HOSPITAL.placesBn.join(" ● "),
    regNo: "রেজি নং -",
    patientName: "রোগীর নাম - শ্রী / শ্রীমতী",
    age: "বয়স",
    fatherHusband: "পিতা / স্বামী",
    village: "গ্রাম",
    po: "পোঃ",
    ps: "থানা",
    district: "জেলা",
    admissionDate: "ভর্তির তারিখ",
    time: "সময়",
    diagnosis: "প্রাথমিক রোগ (Prov. Diagnosis)",
    doctor: "চিকিৎসাধীন ডাক্তারের নাম -",
    rules: [
      "অন্য রোগীর জরুরী অবস্থায় প্রয়োজন হইলে নার্সিংহোম কর্তৃপক্ষ আপনার রোগীর শয্যা পরিবর্তন করিতে পারেন।",
      "ডাক্তারবাবুর অনুমতি ছাড়া রোগী ভর্তি করা ও ছুটি দেওয়া হয় না।",
      "রোগীর নিকট বাড়ীর একজন লোক থাকতে পারবে।",
      "রোগীর ছুটি হইয়া গেলে ১ ঘন্টার মধ্যে বাড়ীর লোক (গার্জেন) রোগীকে নিয়ে যেতে বাধ্য থাকিবেন।",
      "সকল রকম রোগী ভর্তির অগ্রিম জমা দিতে হইবে ও ছুটির আগের দিন সমুদয় চার্জ মিটাইয়া দিতে বাধ্য থাকিবেন।",
      "আমি বুঝি যে, উক্ত ডাক্তারবাবু বা ডাক্তারবাবুদের পক্ষে পরবর্তী সময়ে রোগীর কোন জটিলতার ক্ষেত্রে ঠিক সময়ে হাজির হওয়া সম্ভব নাও হতে পারে। সেক্ষেত্রে অন্য ডাক্তার বাবুর সাহায্য নেওয়া হতে পারে এবং ঐ ডাক্তারবাবুর চিকিৎসায় আমার সম্মতি রহিল।",
      "আমার কাছে এটাও পরিষ্কার যে, চিকিৎসা কেন্দ্রে / নিরূপণ কেন্দ্রে আমি / আমার আত্মীয় চিকিৎসিত হচ্ছি বা হচ্ছেন, সেটিতে সবসময় I.C.C.U / I.T.U ইত্যাদি বিশেষ সাজসজ্জা নাও থাকতে পারে; সেক্ষেত্রে অনুরূপ জরুরী পরিস্থিতির খাতিরে, সংশ্লিষ্ট কর্তৃপক্ষ প্রয়োজনীয় বিশেষ সাজসজ্জাযুক্ত প্রতিষ্ঠানে রোগী স্থানান্তরের ব্যবস্থা করতে পারেন। এরূপ অবস্থার জন্য প্রতিষ্ঠানটি বা ডাক্তারবাবুকে দায়ী করা চলবে না।",
      "আমাকে পুরোপুরি অবহিত করা হয়েছে যে, প্রয়োজনীয় মেডিক্যাল প্যাথোলজিক্যাল, রেডিওলজিক্যাল, সাইটোলজিক্যাল এবং অন্যান্য অনুরূপ রোগ নির্ণয় পদ্ধতি রিপোর্টের ভিত্তিতেই চিকিৎসা ও শল্য প্রভৃতি কৌশল রচনা করেছেন সংশ্লিষ্ট ডাক্তারবাবু, পরবর্তীকালে উক্ত রিপোর্টজনিত চিকিৎসা বিভ্রাটের জন্য ডাক্তারবাবু কোন মতেই দায়বদ্ধ থাকবেন না।",
    ],
    consentMy: "আমার",
    consentSriSmt: "শ্রী / শ্রীমতী",
    consentBody: `কে ${HOSPITAL.nameBn}ে ভর্তি করাইয়া রাজী হইলাম এবং নার্সিং হোমের সমস্ত খরচাদি অফিস হইতে বুঝিয়া লইয়া বহন করিতে এবং নিয়ম মানিয়া চলিতে বাধ্য থাকিব। সকল প্রকার নিয়মকানুন জানিয়া ও বুঝিয়া, নার্সিংহোম কর্তৃপক্ষকে সর্বতোভাবে সহায়তা করিব। আমার / আমাদের রোগীর অবস্থা খুবই সংকটজনক, আমার / আমাদের রোগীর যেকোন সময় অঘটন ঘটিতে পারে, নার্সিংহোমের ডাক্তারবাবু আমাকে / আমাদেরকে একথা বলা সত্ত্বেও আমরা সবকিছু জেনেও অন্য কোথাও না নিয়ে গিয়ে ডাক্তারবাবুকে চিকিৎসা করার / অপারেশন করার অনুমতি দিলাম। চিকিৎসা চলাকালীন আমার / আমাদের রোগীর কোনরূপ অঘটন ঘটিলে / ক্ষতি হইলে, আমি / আমরা / আমাদের আত্মীয় পরিজন কেউই ডাক্তারবাবু বা নার্সিংহোমের কর্তৃপক্ষকে কোনরূপ দায়ী করিব না বা ক্ষতিপূরণ চাইব না বরং আমাদের রোগীর চিকিৎসা চলাকালীন নার্সিংহোমের সমূহ পাওনা মিটাইয়া দিয়া যাইব। এতদসত্ত্বেও আমার / আমাদের যদি কেউ নার্সিংহোমের কর্তৃপক্ষ বা ডাক্তারবাবুকে দায়ী করেন বা ডাক্তারবাবু / নার্সিংহোমের বিরুদ্ধে কোনরূপ আইনানুগ ব্যবস্থা নেন তা আইনত বাতিল বলিয়া গণ্য হইবে। সবকিছু বুঝিয়া / জানিয়া সম্পূর্ণ সুস্থ ও সরল মস্তিষ্কে আমি / আমরা এই শর্তে রাজী থাকিয়া এই মর্মে স্বাক্ষর / টিপ সহি করিলাম।`,
    witnesses: "সাক্ষীগণ :-",
    witnessMarks: ["ক)", "খ)"],
    guardianSignature: "অভিভাবকের স্বাক্ষর",
    guardianFields: ["গ্রাম", "পোষ্ট", "থানা", "জেলা", "ফোন নং"],
    dischargeDate: "ছুটির তারিখ",
    dischargeNote:
      "আমার রোগী / রোগিণীর চিকিৎসা সম্পর্কীয় সমস্ত রকম কাগজপত্র বুঝিয়া পাইলাম এবং রোগী / রোগিণীকে সুস্থ করিয়া লইয়া গেলাম।",
    signature: "স্বাক্ষর",
  },
  en: {
    badge: "ADMISSION FORM",
    hospitalName: HOSPITAL.name,
    places: HOSPITAL.places.join(" ● "),
    regNo: "REGID -",
    patientName: "Patient's Name - Sri / Smt.",
    age: "Age",
    fatherHusband: "Father / Husband",
    village: "Village",
    po: "P.O.",
    ps: "P.S.",
    district: "District",
    admissionDate: "Date of Admission",
    time: "Time",
    diagnosis: "Provisional Diagnosis",
    doctor: "Name of the Treating Doctor -",
    rules: [
      "In an emergency involving another patient, the Nursing Home authority may change your patient's bed if required.",
      "Patients are not admitted or discharged without the doctor's permission.",
      "One family member may stay with the patient.",
      "Once the patient is discharged, the family (guardian) must take the patient home within 1 hour.",
      "An advance deposit is required for every admission, and all charges must be settled on the day before discharge.",
      "I understand that the said doctor(s) may not be able to attend in time if a complication arises later. In that case the help of another doctor may be taken, and I consent to treatment by that doctor.",
      "It is also clear to me that the treatment / diagnostic centre where I / my relative am / is being treated may not always have special facilities such as I.C.C.U / I.T.U. In such an emergency the authority concerned may arrange to transfer the patient to an institution with the necessary facilities, and the institution or the doctor shall not be held responsible for this.",
      "I have been fully informed that the doctor concerned plans the treatment and surgical procedures on the basis of the necessary medical, pathological, radiological, cytological and other similar diagnostic reports, and the doctor shall in no way be liable for any later problem in treatment arising from those reports.",
    ],
    consentMy: "I agree to admit my",
    consentSriSmt: "Sri / Smt.",
    consentBody: `to ${HOSPITAL.name}, and I shall understand from the office and bear all the expenses of the Nursing Home and abide by its rules. Having known and understood all the rules and regulations, I shall co-operate fully with the Nursing Home authority. Although the doctor of the Nursing Home has told me / us that the condition of my / our patient is very critical and that a mishap may occur at any time, knowing everything, we have given the doctor permission to treat / operate without taking the patient elsewhere. If any mishap / harm happens to my / our patient during treatment, I / we / our relatives shall not hold the doctor or the Nursing Home authority responsible in any way or claim any compensation; rather, we shall clear all dues of the Nursing Home during the treatment of our patient. If, despite this, anyone on my / our behalf holds the Nursing Home authority or the doctor responsible or takes any legal action against the doctor / Nursing Home, it shall be deemed legally void. Having understood / known everything, in a completely sound and clear state of mind, I / we agree to these terms and put my / our signature / thumb impression to this effect.`,
    witnesses: "Witnesses :-",
    witnessMarks: ["a)", "b)"],
    guardianSignature: "Signature of Guardian",
    guardianFields: ["Village", "Post", "P.S.", "District", "Phone No."],
    dischargeDate: "Date of Discharge",
    dischargeNote:
      "I have received and understood all the papers relating to the treatment of my patient, and I am taking the patient home in good health.",
    signature: "Signature",
  },
};

function Line({ label, value, className = "" }) {
  return (
    <div className={`af-line ${className}`}>
      <span className="af-label">{label}</span>
      <span className="af-dots">{clean(value)}</span>
    </div>
  );
}

function AdmissionSheet({ lang, admission, isSecond }) {
  const t = TEXT[lang];
  const patient = admission.patient || {};
  const consultant = admission.consultant || {};

  return (
    <main className={`af-sheet af-${lang} ${isSecond ? "is-second" : ""}`}>
      <header className="af-header">
        <Image
          src={HOSPITAL.logo}
          alt={`${HOSPITAL.name} logo`}
          width={90}
          height={90}
          priority
          className="af-logo"
        />
        <div className="af-header-copy">
          <span className="af-badge">{t.badge}</span>
          <h1 className="af-hospital-name">{t.hospitalName}</h1>
          <p className="af-places">{t.places}</p>
          <p className="af-reg">
            {t.regNo} <strong>{clean(admission.reg_id)}</strong>
          </p>
        </div>
        <p className="af-phone">
          Ph.- {HOSPITAL.phone}, {HOSPITAL.mobile}
        </p>
      </header>

      <section className="af-fields">
        <div className="af-row af-row-name">
          <Line label={t.patientName} value={patient.fullname} />
          <Line label={t.age} value={patient.age} />
        </div>
        <Line label={t.fatherHusband} value={patient.father_husband_name} />
        <div className="af-row af-row-half">
          <Line label={t.village} value={patient.village} />
          <Line label={t.po} value={patient.post_office} />
        </div>
        <div className="af-row af-row-half">
          <Line label={t.ps} value={patient.police_station} />
          <Line label={t.district} value={patient.district} />
        </div>
        <div className="af-row af-row-half">
          <Line
            label={t.admissionDate}
            value={formatDate(clean(admission.admit_date))}
          />
          <Line label={t.time} value={admission.admit_time} />
        </div>
        <Line label={t.diagnosis} value={admission.provisional_diagnosis} />
        <Line label={t.doctor} value={consultant.drname} />
      </section>

      <ul className="af-rules">
        {t.rules.map((rule, index) => (
          <li key={index}>{rule}</li>
        ))}
      </ul>

      <p className="af-consent">
        {t.consentMy} <span className="af-blank af-blank-short" />{" "}
        {t.consentSriSmt}{" "}
        <span className="af-blank af-blank-name">{clean(patient.fullname)}</span>{" "}
        {t.consentBody}
      </p>

      <section className="af-signatures">
        <div className="af-witnesses">
          <p className="af-witness-title">{t.witnesses}</p>
          {t.witnessMarks.map((mark) => (
            <Line key={mark} label={mark} />
          ))}
        </div>
        <div className="af-guardian">
          <div className="af-signature-line" />
          <p className="af-guardian-title">{t.guardianSignature}</p>
          {t.guardianFields.map((label, index) => (
            <Line
              key={label}
              label={label}
              value={
                index === t.guardianFields.length - 1
                  ? patient.guardian_phone
                  : ""
              }
            />
          ))}
        </div>
      </section>

      <footer className="af-discharge">
        <div className="af-row af-row-discharge">
          <Line label={t.dischargeDate} />
          <Line label={t.time} />
        </div>
        <p className="af-discharge-note">{t.dischargeNote}</p>
        <div className="af-discharge-sign">
          <div className="af-signature-line" />
          <p>{t.signature}</p>
        </div>
      </footer>
    </main>
  );
}

function IpdAdmissionPrint() {
  const { slug } = useParams();
  // "both" (default) prints a Bengali page and an English page. "bn" / "en"
  // print a single language. The selector is hidden on the printout.
  const [printLang, setPrintLang] = useState("both");
  const { data, error, isLoading, isError } = useQuery({
    queryKey: ["ipddetails", slug],
    queryFn: () => fetchData(`/ipd?id=${slug}`),
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
      <PrintUi path="/ipd/record">
        <div className="m-6 border border-red-300 bg-red-50 p-4 text-red-700">
          {error?.response?.data?.message || "Unable to load IPD admission"}
        </div>
      </PrintUi>
    );
  }

  const admission = data?.data || {};
  const showBengali = printLang === "bn" || printLang === "both";
  const showEnglish = printLang === "en" || printLang === "both";

  const langOptions = [
    { key: "both", label: "বাংলা + English" },
    { key: "bn", label: "বাংলা" },
    { key: "en", label: "English" },
  ];

  return (
    <PrintUi path="/ipd/record">
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 8mm;
        }

        .af-sheet,
        .af-sheet * {
          box-sizing: border-box;
        }

        .af-sheet {
          width: 194mm;
          margin: 0 auto;
          padding: 2mm 3mm;
          background: #fff;
          color: #1f2a6b;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 9.6pt;
          line-height: 1.35;
        }

        .af-bn {
          font-family: "Noto Sans Bengali", "Nirmala UI", "Vrinda",
            "Shonar Bangla", "Kohinoor Bangla", Arial, sans-serif;
        }

        .af-sheet.is-second {
          margin-top: 10mm;
        }

        .af-header {
          position: relative;
          display: grid;
          grid-template-columns: 26mm 1fr 26mm;
          align-items: center;
          border-bottom: 0.35mm solid #1f2a6b;
          padding-bottom: 1.5mm;
          text-align: center;
        }

        .af-logo {
          width: 24mm;
          height: 24mm;
          object-fit: contain;
        }

        .af-badge {
          display: inline-block;
          border-radius: 1.5mm;
          background: #1f2a6b;
          padding: 0.5mm 4mm;
          color: #fff;
          font-size: 10pt;
          font-weight: 700;
        }

        .af-hospital-name {
          margin: 1mm 0 0;
          font-size: 24pt;
          font-weight: 800;
          line-height: 1.1;
        }

        .af-en .af-hospital-name {
          font-family: "Cooper Black", "Bookman Old Style", Georgia, serif;
          font-size: 21pt;
        }

        .af-places {
          margin: 0.5mm 0 0;
          font-size: 11pt;
          font-weight: 700;
        }

        .af-reg {
          margin: 0.5mm 0 0;
          font-size: 10pt;
        }

        .af-phone {
          position: absolute;
          top: 0;
          right: 0;
          margin: 0;
          font-size: 9pt;
          font-weight: 700;
          white-space: nowrap;
        }

        .af-fields {
          display: grid;
          gap: 2.2mm;
          margin-top: 2.5mm;
        }

        .af-row {
          display: grid;
          gap: 4mm;
        }

        .af-row-name {
          grid-template-columns: 1fr 36mm;
        }

        .af-row-half,
        .af-row-discharge {
          grid-template-columns: 1fr 1fr;
        }

        .af-line {
          display: flex;
          min-width: 0;
          align-items: flex-end;
          gap: 1.5mm;
          white-space: nowrap;
        }

        .af-label {
          flex: 0 0 auto;
        }

        .af-dots {
          min-width: 0;
          min-height: 4.6mm;
          flex: 1 1 auto;
          overflow: hidden;
          border-bottom: 0.25mm dotted #1f2a6b;
          padding: 0 1mm 0.3mm;
          color: #000;
          font-family: Arial, Helvetica, sans-serif;
          font-weight: 700;
          text-overflow: ellipsis;
        }

        .af-rules {
          margin: 3mm 0 0;
          padding: 0 0 0 5mm;
          list-style: none;
        }

        .af-rules li {
          position: relative;
          margin: 0 0 1mm;
          text-align: justify;
        }

        .af-rules li::before {
          content: "";
          position: absolute;
          top: 1.4mm;
          left: -4.5mm;
          width: 2.4mm;
          height: 2.4mm;
          border-radius: 50%;
          background: #1f4fbf;
        }

        .af-consent {
          margin: 2.5mm 0 0;
          text-align: justify;
        }

        .af-blank {
          display: inline-block;
          border-bottom: 0.25mm dotted #1f2a6b;
          vertical-align: bottom;
        }

        .af-blank-short {
          width: 22mm;
        }

        .af-blank-name {
          min-width: 50mm;
          padding: 0 1mm;
          color: #000;
          font-family: Arial, Helvetica, sans-serif;
          font-weight: 700;
        }

        .af-signatures {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12mm;
          margin-top: 5mm;
        }

        .af-witnesses,
        .af-guardian {
          display: grid;
          align-content: start;
          gap: 2.4mm;
        }

        .af-witness-title {
          margin: 0;
          font-weight: 700;
        }

        .af-signature-line {
          height: 7mm;
          border-bottom: 0.25mm solid #1f2a6b;
        }

        .af-guardian-title {
          margin: 0;
          text-align: center;
          font-weight: 700;
        }

        .af-discharge {
          margin-top: 4mm;
          border-top: 0.6mm double #1f2a6b;
          padding-top: 2.5mm;
        }

        .af-discharge-note {
          margin: 2mm 0 0;
        }

        .af-discharge-sign {
          width: 60mm;
          margin: 2mm 0 0 auto;
          text-align: center;
        }

        .af-discharge-sign p {
          margin: 0.5mm 0 0;
        }

        @media print {
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }

          .af-sheet {
            /* auto keeps the sheet centred when the print dialog scales it */
            margin: 0 auto !important;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .af-sheet.is-second {
            break-before: page;
            page-break-before: always;
          }
        }
      `}</style>

      <div className="print:hidden mb-4 flex flex-wrap items-center justify-center gap-2">
        <span className="text-sm font-medium text-gray-600">
          Print language:
        </span>
        {langOptions.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setPrintLang(option.key)}
            className={`rounded-lg border px-4 py-1.5 text-sm transition-colors ${
              printLang === option.key
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {showBengali && (
        <AdmissionSheet lang="bn" admission={admission} isSecond={false} />
      )}
      {showEnglish && (
        <AdmissionSheet lang="en" admission={admission} isSecond={showBengali} />
      )}
    </PrintUi>
  );
}

export default withAuth(IpdAdmissionPrint);
