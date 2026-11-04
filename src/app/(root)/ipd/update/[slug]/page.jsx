"use client";

import axios from "axios";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Heading from "@/components/Heading";
import Loading from "@/components/Loading";
import { getCompactAge } from "@/lib/ageCount";
import { ADMISSION_TYPE_OPTIONS, PAYMENT_MODE_OPTIONS } from "@/lib/healthScheme";
import { hasPermission } from "@/lib/permissions";
import { useSession } from "next-auth/react";

const patientFields = [
  ["fullname", "Full Name", "text", true],
  ["father_husband_name", "Father / Husband Name", "text", true],
  ["phone_number", "Phone Number", "text", true],
  ["dob", "Date of Birth", "date"],
  ["age", "Age", "text"],
  ["gender", "Gender", "select", false, ["Male", "Female", "Other"]],
  [
    "marital_status",
    "Marital Status",
    "select",
    false,
    ["Married", "Unmarried", "Widow/Widower", "Divorced", "Other"],
  ],
  ["occupation", "Occupation", "text"],
  [
    "blood_group",
    "Blood Group",
    "select",
    false,
    ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
  ],
  ["address", "Address", "text"],
  ["aadhar", "Aadhaar", "text"],
  ["guardian_name", "Guardian Name", "text"],
  ["guardian_relationship", "Relationship with Patient", "text"],
  ["guardian_phone", "Guardian Phone", "text"],
  [
    "religion",
    "Religion",
    "select",
    false,
    ["Hindu", "Muslim", "Christian", "Sikh", "Buddhist", "Jain", "Other"],
  ],
  ["nationality", "Nationality", "select", false, ["Indian", "Other"]],
  ["landline", "Landline / Alternate Phone", "text"],
  ["village", "Village / Locality", "text"],
  ["post_office", "Post Office", "text"],
  ["police_station", "Police Station", "text"],
  ["district", "District", "text"],
  ["pin_code", "PIN Code", "text"],
  ["state", "State", "text"],
];

const admissionFields = [
  ["hight", "Height", "text"],
  ["weight", "Weight", "text"],
  ["bp", "Blood Pressure", "text"],
  ["admission_charge", "Admission Charge", "number"],
  ["admit_type", "Admission Type", "select", false, ADMISSION_TYPE_OPTIONS],
  ["paidby", "Payment Type", "select", false, PAYMENT_MODE_OPTIONS],
  ["department", "Department", "text"],
  ["initial_deposit", "Initial Deposit", "number"],
  ["corporate_name", "Corporate Name", "text"],
  ["corporate_address", "Corporate Address", "text"],
  ["referral_contact_person", "Referral Contact Person", "text"],
  ["referral_contact_number", "Referral Contact Number", "text"],
  ["tpa_name", "TPA Name", "text"],
  ["consent_given_by", "Consent Given By", "text"],
  ["responsible_for_payment", "Person Responsible for Payment", "text"],
  ["admit_date", "Admission Date", "date", true],
  ["admit_time", "Admission Time", "time"],
  ["referr_by", "Referred By", "text"],
  ["present_complain", "Present Complaint", "textarea"],
  ["medical_case", "Medical Case", "textarea"],
  ["key_finding", "Key Findings", "textarea"],
  ["provisional_diagnosis", "Provisional Diagnosis", "textarea"],
];

function Field({ definition, value, onChange }) {
  const [name, label, type, required, configuredOptions = []] = definition;
  const className = "w-full rounded-lg border border-gray-300 px-3 py-2";
  const options =
    value && !configuredOptions.includes(value)
      ? [value, ...configuredOptions]
      : configuredOptions;
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">
        {label}{required && <span className="text-red-500"> *</span>}
      </span>
      {type === "textarea" ? (
        <textarea
          name={name}
          value={value ?? ""}
          onChange={onChange}
          className={className}
          rows={3}
        />
      ) : type === "select" ? (
        <select
          name={name}
          value={value ?? ""}
          onChange={onChange}
          className={className}
          required={required}
        >
          <option value="">Select</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          name={name}
          type={type}
          value={value ?? ""}
          onChange={onChange}
          className={className}
          required={required}
          min={type === "number" ? 0 : undefined}
        />
      )}
    </label>
  );
}

export default function UpdateIpdAdmission() {
  const { slug } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [form, setForm] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      axios.get(`/api/v1/ipd/${slug}`),
      axios.get("/api/v1/doctor?drname="),
    ])
      .then(([ipdResponse, doctorResponse]) => {
        const ipd = ipdResponse.data.data;
        setForm({
          ...ipd,
          ...ipd.patient,
          consultant: ipd.consultant?._id || "",
          reg_id: ipd.reg_id,
          mrd_id: ipd.mrd_id,
        });
        const loadedDoctors = doctorResponse.data?.data || [];
        setDoctors(
          ipd.consultant &&
            !loadedDoctors.some((doctor) => doctor._id === ipd.consultant._id)
            ? [ipd.consultant, ...loadedDoctors]
            : loadedDoctors
        );
      })
      .catch((error) =>
        toast.error(error.response?.data?.message || "Unable to load IPD admission")
      );
  }, [slug]);

  if (status === "loading" || !form) return <Loading />;
  if (!hasPermission(session?.user, "ipd", "edit")) {
    return <div className="p-6">You do not have permission to edit IPD admissions.</div>;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "dob" ? { age: getCompactAge(value) } : {}),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await axios.put(`/api/v1/ipd/${slug}`, {
        ...form,
        consultant: form.consultant,
      });
      toast.success(response.data.message);
      router.push(`/ipd/print/${form.reg_id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update admission");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full p-4 md:p-6">
      <Heading heading="Edit IPD Admission">
        <Link href="/ipd/record" className="btn btn-ghost">Back to records</Link>
      </Heading>
      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl bg-white p-5 shadow">
        <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4">
          <div><strong>REGID:</strong> {form.reg_id}</div>
          <div><strong>UHID:</strong> {form.mrd_id}</div>
        </div>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Patient information</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {patientFields.map((field) => (
              <Field
                key={field[0]}
                definition={field}
                value={form[field[0]]}
                onChange={handleChange}
              />
            ))}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              ["consent_accepted", "Admission consent acknowledged"],
              [
                "swasthya_sathi_acknowledged",
                "Government health-scheme conditions acknowledged",
              ],
            ].map(([name, label]) => (
              <label key={name} className="flex items-start gap-3 rounded border p-3">
                <input
                  type="checkbox"
                  checked={form[name] === true}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      [name]: event.target.checked,
                    }))
                  }
                  className="checkbox checkbox-primary"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Admission information</h2>
          <div className="mb-4">
            <label className="block space-y-1">
              <span className="text-sm font-medium">Consultant *</span>
              <select
                name="consultant"
                value={form.consultant}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                required
              >
                <option value="">Select consultant</option>
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>
                    {doctor.drname} {doctor.category ? `(${doctor.category})` : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {admissionFields.map((field) => (
              <Field
                key={field[0]}
                definition={field}
                value={form[field[0]]}
                onChange={handleChange}
              />
            ))}
          </div>
        </section>

        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
