"use client";

import DoctorForm from "@/components/component/Doctor";
import Heading from "@/components/Heading";
import Loading from "@/components/Loading";
import Tab from "@/components/Tab";
import Spinner from "@/components/ui/Spinner";
import { getCompactAge } from "@/lib/ageCount";
import { getDate } from "@/lib/currentDate";
import {
  ADMISSION_TYPE_OPTIONS,
  PAYMENT_MODE_OPTIONS,
  detectHealthSchemes,
} from "@/lib/healthScheme";
import { createData, fetchData } from "@/services/apiService";
import { withAuth } from "@/services/withAuth";
import { ErrorHandeling } from "@/utils/errorHandling";
import { SuccessHandling } from "@/utils/successHandling";
import { TabLinks } from "@/utils/tablinks";
import { hasPermission } from "@/lib/permissions";
import { useQueryClient } from "@tanstack/react-query";
import { debounce } from "lodash";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AsyncSelect from "react-select/async";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { FaPlusCircle } from "react-icons/fa";

const MiddleSection = lazy(() => import("@/components/Middlesection"));

const initialAdmission = {
  mrd_id: "",
  fullname: "",
  father_husband_name: "",
  phone_number: "",
  dob: "",
  age: "",
  gender: "",
  marital_status: "",
  occupation: "",
  blood_group: "",
  address: "",
  aadhar: "",
  guardian_name: "",
  guardian_relationship: "",
  guardian_phone: "",
  religion: "",
  nationality: "Indian",
  landline: "",
  village: "",
  post_office: "",
  police_station: "",
  district: "",
  pin_code: "",
  state: "",
  referr_by: "",
  department: "",
  referral_contact_person: "",
  referral_contact_number: "",
  consultant: {},
  admission_charge: "200",
  initial_deposit: "",
  admit_type: "",
  paidby: "",
  corporate_name: "",
  corporate_address: "",
  tpa_name: "",
  admit_date: getDate(),
  admit_time: "",
  hight: "",
  weight: "",
  bp: "",
  present_complain: "",
  key_finding: "",
  medical_case: "",
  provisional_diagnosis: "",
  consent_given_by: "",
  responsible_for_payment: "",
  consent_accepted: false,
  swasthya_sathi_acknowledged: false,
};

const fieldClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200";

function Field({ label, name, value, onChange, type = "text", required, rows }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {rows ? (
        <textarea
          name={name}
          value={value ?? ""}
          onChange={onChange}
          rows={rows}
          className={fieldClass}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value ?? ""}
          onChange={onChange}
          required={required}
          min={type === "number" ? 0 : undefined}
          step={type === "number" ? "0.01" : undefined}
          className={fieldClass}
        />
      )}
    </label>
  );
}

function SelectField({ label, name, value, onChange, options, required }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <select
        name={name}
        value={value ?? ""}
        onChange={onChange}
        required={required}
        className={fieldClass}
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
      <h2 className="mb-4 border-b pb-2 text-lg font-semibold">{title}</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

function IpdAdmission() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const router = useRouter();
  const [form, setForm] = useState(initialAdmission);
  const [consultant, setConsultant] = useState(null);
  const [uhId, setUhId] = useState("");
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const submittingRef = useRef(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleDobChange = (event) => {
    const dob = event.target.value;
    setForm((current) => ({ ...current, dob, age: getCompactAge(dob) }));
  };

  const searchPatient = async () => {
    if (!uhId.trim()) return toast.error("Enter a UHID");
    setSearching(true);
    try {
      const response = await fetchData(`/patient/${uhId.trim()}`);
      const patient = response?.data;
      setForm((current) => ({
        ...current,
        mrd_id: patient?.mrd_id || "",
        fullname: patient?.fullname || "",
        father_husband_name: patient?.father_husband_name || "",
        phone_number: patient?.phone_number || "",
        dob: patient?.dob || "",
        age: patient?.age || getCompactAge(patient?.dob || ""),
        gender: patient?.gender || "",
        marital_status:
          patient?.marital_status === "Single"
            ? "Unmarried"
            : patient?.marital_status || "",
        occupation: patient?.occupation || "",
        blood_group: patient?.blood_group || "",
        address: patient?.address || "",
        aadhar: patient?.aadhar || "",
        guardian_name: patient?.guardian_name || "",
        guardian_relationship: patient?.guardian_relationship || "",
        guardian_phone: patient?.guardian_phone || "",
        religion: patient?.religion || "",
        nationality: patient?.nationality || "Indian",
        landline: patient?.landline || "",
        village: patient?.village || "",
        post_office: patient?.post_office || "",
        police_station: patient?.police_station || "",
        district: patient?.district || "",
        pin_code: patient?.pin_code || "",
        state: patient?.state || "",
      }));
    } catch (error) {
      ErrorHandeling(error);
    } finally {
      setSearching(false);
    }
  };

  const loadDoctors = useMemo(
    () =>
      debounce(async (inputValue) => {
        try {
          const response = await fetchData(`/doctor?drname=${inputValue}`);
          return (response.data || []).map((doctor) => ({
            value: doctor,
            label: `${doctor.drname}${doctor.category ? ` (${doctor.category})` : ""}`,
          }));
        } catch (error) {
          ErrorHandeling(error);
          return [];
        }
      }, 300),
    []
  );

  useEffect(() => () => loadDoctors.cancel(), [loadDoctors]);

  const submit = useCallback(async () => {
    if (!form.fullname.trim() || !form.phone_number.trim()) {
      return toast.error("Patient name and phone number are required");
    }
    if (!form.father_husband_name?.trim()) {
      return toast.error("Father / Husband name is required");
    }
    if (!consultant?.value) return toast.error("Please select a consultant");
    if (!form.admit_type) return toast.error("Please select admission type");
    if (!form.paidby) return toast.error("Please select payment mode");
    if (!form.consent_accepted) {
      return toast.error("Please acknowledge the admission consent");
    }

    // Synchronous re-entrancy guard: blocks F5 key-repeat / double-click
    // bursts from firing multiple POSTs before React re-renders the disabled
    // button, which would otherwise create duplicate admissions and skip numbers.
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSaving(true);
    try {
      const response = await createData("/ipd", {
        ...form,
        consultant: consultant.value,
        admited_by: session?.user?.username,
      });
      queryClient.invalidateQueries({ queryKey: ["ipdarecord"] });
      SuccessHandling(response.message);
      router.push(`/ipd/print/${response.data.reg_id}`);
    } catch (error) {
      ErrorHandeling(error);
    } finally {
      submittingRef.current = false;
      setSaving(false);
    }
  }, [consultant, form, queryClient, router, session?.user?.username]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "F5") {
        event.preventDefault();
        submit();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [submit]);

  if (session && !hasPermission(session.user, "ipd", "create")) {
    return <div className="p-6">You do not have permission to create IPD admissions.</div>;
  }

  const governmentScheme = detectHealthSchemes(
    form.admit_type,
    form.paidby
  ).join(" & ");

  return (
    <Suspense fallback={<Loading />}>
      <Tab tabs={TabLinks} category="IPD" />
      <div className="flex w-full">
        <MiddleSection>
          <div className="w-full space-y-5">
            <Heading heading="IPD Admission">
              <div className="flex gap-2">
                <input
                  value={uhId}
                  onChange={(event) => setUhId(event.target.value)}
                  placeholder="Enter UHID"
                  className={fieldClass}
                />
                <button
                  type="button"
                  onClick={searchPatient}
                  disabled={searching}
                  className="btn btn-primary"
                >
                  {searching ? <Spinner /> : "Search"}
                </button>
              </div>
            </Heading>

            <Section title="Patient Identification">
              <Field label="Full Name" name="fullname" value={form.fullname} onChange={handleChange} required />
              <Field label="Father / Husband Name" name="father_husband_name" value={form.father_husband_name} onChange={handleChange} required />
              <Field label="Mobile Number" name="phone_number" value={form.phone_number} onChange={handleChange} required />
              <Field label="Landline / Alternate Phone" name="landline" value={form.landline} onChange={handleChange} />
              <Field label="Date of Birth" name="dob" type="date" value={form.dob} onChange={handleDobChange} />
              <Field label="Age" name="age" value={form.age} onChange={handleChange} />
              <SelectField label="Gender" name="gender" value={form.gender} onChange={handleChange} options={["Male", "Female", "Other"]} />
              <SelectField label="Marital Status" name="marital_status" value={form.marital_status} onChange={handleChange} options={["Married", "Unmarried", "Widow/Widower", "Divorced", "Other"]} />
              <Field label="Occupation" name="occupation" value={form.occupation} onChange={handleChange} />
              <SelectField label="Blood Group" name="blood_group" value={form.blood_group} onChange={handleChange} options={["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]} />
              <SelectField label="Religion" name="religion" value={form.religion} onChange={handleChange} options={["Hindu", "Muslim", "Christian", "Sikh", "Buddhist", "Jain", "Other"]} />
              <SelectField label="Nationality" name="nationality" value={form.nationality} onChange={handleChange} options={["Indian", "Other"]} />
              <Field label="Aadhaar Number" name="aadhar" value={form.aadhar} onChange={handleChange} />
            </Section>

            <Section title="Address and Next of Kin">
              <Field label="Residential Address" name="address" value={form.address} onChange={handleChange} />
              <Field label="Village / Locality" name="village" value={form.village} onChange={handleChange} />
              <Field label="Post Office" name="post_office" value={form.post_office} onChange={handleChange} />
              <Field label="Police Station" name="police_station" value={form.police_station} onChange={handleChange} />
              <Field label="District" name="district" value={form.district} onChange={handleChange} />
              <Field label="PIN Code" name="pin_code" value={form.pin_code} onChange={handleChange} />
              <Field label="State" name="state" value={form.state} onChange={handleChange} />
              <Field label="Guardian / Next of Kin" name="guardian_name" value={form.guardian_name} onChange={handleChange} />
              <Field label="Relationship with Patient" name="guardian_relationship" value={form.guardian_relationship} onChange={handleChange} />
              <Field label="Guardian Phone" name="guardian_phone" value={form.guardian_phone} onChange={handleChange} />
              <Field label="Person Responsible for Payment" name="responsible_for_payment" value={form.responsible_for_payment} onChange={handleChange} />
              <Field label="Consent Given By" name="consent_given_by" value={form.consent_given_by} onChange={handleChange} />
            </Section>

            <Section title="Admission and Payment">
              <Field label="Admission Date" name="admit_date" type="date" value={form.admit_date} onChange={handleChange} required />
              <Field label="Admission Time" name="admit_time" type="time" value={form.admit_time} onChange={handleChange} />
              <Field label="Department" name="department" value={form.department} onChange={handleChange} />
              <div>
                <span className="mb-1 block text-sm font-medium text-gray-700">Consultant *</span>
                <div className="flex gap-2">
                  <AsyncSelect
                    cacheOptions
                    defaultOptions
                    loadOptions={loadDoctors}
                    value={consultant}
                    onChange={setConsultant}
                    className="min-w-0 flex-1"
                    placeholder="Search consultant..."
                  />
                  <DoctorForm btn={<FaPlusCircle />} />
                </div>
              </div>
              <SelectField label="Admission Type" name="admit_type" value={form.admit_type} onChange={handleChange} required options={ADMISSION_TYPE_OPTIONS} />
              <SelectField label="Payment Mode" name="paidby" value={form.paidby} onChange={handleChange} required options={PAYMENT_MODE_OPTIONS} />
              <Field label="Admission Charge" name="admission_charge" type="number" value={form.admission_charge} onChange={handleChange} />
              <Field label="Initial Deposit" name="initial_deposit" type="number" value={form.initial_deposit} onChange={handleChange} />
              <Field label="Referral Doctor" name="referr_by" value={form.referr_by} onChange={handleChange} />
              <Field label="Referral Contact Person" name="referral_contact_person" value={form.referral_contact_person} onChange={handleChange} />
              <Field label="Referral Contact Number" name="referral_contact_number" value={form.referral_contact_number} onChange={handleChange} />
              <Field label="Corporate Name" name="corporate_name" value={form.corporate_name} onChange={handleChange} />
              <Field label="Corporate Address" name="corporate_address" value={form.corporate_address} onChange={handleChange} />
              <Field label="TPA Name" name="tpa_name" value={form.tpa_name} onChange={handleChange} />
            </Section>

            <Section title="Clinical Information">
              <Field label="Height (cm)" name="hight" value={form.hight} onChange={handleChange} />
              <Field label="Weight (kg)" name="weight" value={form.weight} onChange={handleChange} />
              <Field label="Blood Pressure" name="bp" value={form.bp} onChange={handleChange} />
              <Field label="Present Complaint" name="present_complain" value={form.present_complain} onChange={handleChange} rows={3} />
              <Field label="Key Findings" name="key_finding" value={form.key_finding} onChange={handleChange} rows={3} />
              <Field label="Medical Case" name="medical_case" value={form.medical_case} onChange={handleChange} rows={3} />
              <Field label="Provisional Diagnosis" name="provisional_diagnosis" value={form.provisional_diagnosis} onChange={handleChange} rows={3} />
            </Section>

            <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              {governmentScheme && (
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={form.swasthya_sathi_acknowledged}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        swasthya_sathi_acknowledged: event.target.checked,
                      }))
                    }
                    className="checkbox checkbox-primary mt-1"
                  />
                  <span>{governmentScheme} registration and payment conditions have been explained.</span>
                </label>
              )}
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={form.consent_accepted}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      consent_accepted: event.target.checked,
                    }))
                  }
                  className="checkbox checkbox-primary mt-1"
                />
                <span>
                  The treatment risks, payment responsibility and hospital admission
                  consent have been explained and acknowledged.
                </span>
              </label>
            </section>

            <div className="flex justify-end gap-2 pb-6">
              <button
                type="button"
                onClick={() => {
                  setForm(initialAdmission);
                  setConsultant(null);
                }}
                className="btn btn-ghost"
              >
                Clear
              </button>
              <button type="button" onClick={submit} disabled={saving} className="btn btn-primary min-w-52">
                {saving ? <Spinner /> : <>Admit Patient <kbd className="kbd kbd-sm">F5</kbd></>}
              </button>
            </div>
          </div>
        </MiddleSection>
      </div>
    </Suspense>
  );
}

export default withAuth(IpdAdmission);
