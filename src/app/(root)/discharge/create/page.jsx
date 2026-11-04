"use client";

import Heading from "@/components/Heading";
import Loading from "@/components/Loading";
import Tab from "@/components/Tab";
import Spinner from "@/components/ui/Spinner";
import { formatDate } from "@/lib/formateDate";
import { hasPermission } from "@/lib/permissions";
import { fetchData, updateData } from "@/services/apiService";
import { withAuth } from "@/services/withAuth";
import { ErrorHandeling } from "@/utils/errorHandling";
import { SuccessHandling } from "@/utils/successHandling";
import { TabLinks } from "@/utils/tablinks";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import toast from "react-hot-toast";
import { FaPrint } from "react-icons/fa";

const MiddleSection = lazy(() => import("@/components/Middlesection"));

const REFERRAL_LINES = 4;

// Nothing on this screen is mandatory: the summary can be printed blank and
// completed by hand. Anything typed here is printed in the matching section.
const createInitialState = () => ({
  reg_id: "",
  mrd_id: "",
  patient: null,
  ipd: null,
  consultant: null,
  final_diagnosis: "",
  present_complain: "",
  past_history: "",
  drug_allergy: "",
  key_finding: "",
  laboratory_investigations: "",
  radiology_investigations: "",
  other_investigations: "",
  coursein_hp: "",
  treatment_given: "",
  referred_to: Array(REFERRAL_LINES).fill(""),
  procedures: "",
  post_operative_progress: "",
  condition_discharge: "",
  drugs: [],
  diet: "",
  special_instructions: "",
  follow_up: "",
  discharge_date: "",
  discharge_time: "",
});

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200";

function NarrativeField({ label, name, value, onChange, rows = 4 }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <textarea
        name={name}
        value={value ?? ""}
        onChange={onChange}
        rows={rows}
        className={inputClass}
      />
    </label>
  );
}

function FormSection({ title, page, children }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
      <div className="mb-4 flex items-center justify-between border-b pb-2">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          Printed page {page}
        </span>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function CreateDischarge() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const formRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("regid") || ""
  );
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(createInitialState);
  const [medicineName, setMedicineName] = useState("");
  const [medicineOptions, setMedicineOptions] = useState([]);
  const [dosage, setDosage] = useState("");
  const [route, setRoute] = useState("");
  const [duration, setDuration] = useState("");
  const [frequency, setFrequency] = useState("");
  const [editingMedicineIndex, setEditingMedicineIndex] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleReferralChange = (index, value) => {
    setFormData((current) => {
      const referred_to = [...current.referred_to];
      referred_to[index] = value;
      return { ...current, referred_to };
    });
  };

  const resetMedicineEditor = () => {
    setMedicineName("");
    setDosage("");
    setRoute("");
    setDuration("");
    setFrequency("");
    setEditingMedicineIndex(null);
  };

  const normalizeLoadedData = (data) => {
    const clinicalFinding = [
      data?.key_finding,
      data?.general_appreance &&
      data.general_appreance !== data?.key_finding
        ? data.general_appreance
        : "",
    ]
      .filter(Boolean)
      .join("\n");
    const referrals = Array.isArray(data?.referred_to) ? data.referred_to : [];

    return {
      ...createInitialState(),
      ...data,
      final_diagnosis: data?.final_diagnosis || "",
      present_complain: data?.present_complain || "",
      past_history: data?.past_history || "",
      drug_allergy: data?.drug_allergy || "",
      key_finding: clinicalFinding,
      laboratory_investigations: data?.laboratory_investigations || "",
      radiology_investigations: data?.radiology_investigations || "",
      other_investigations:
        data?.other_investigations || data?.summary_key_inv || "",
      coursein_hp: data?.coursein_hp || "",
      treatment_given: data?.treatment_given || "",
      referred_to: Array.from(
        { length: REFERRAL_LINES },
        (_, index) => referrals[index] || ""
      ),
      procedures: data?.procedures || data?.surgery || data?.surgery_note || "",
      post_operative_progress: data?.post_operative_progress || "",
      condition_discharge: data?.condition_discharge || "",
      drugs: Array.isArray(data?.drugs) ? data.drugs : [],
      diet: data?.diet || "",
      special_instructions: data?.special_instructions || "",
      follow_up:
        data?.follow_up ||
        (data?.review_date ? formatDate(data.review_date) : ""),
      discharge_date: data?.discharge_date || "",
      discharge_time: data?.discharge_time || "",
    };
  };

  const handleGetPatient = async () => {
    const regId = searchTerm.trim();
    if (!regId) return;

    setLoading(true);
    try {
      const response = await fetchData(`/discharge/${regId}`);
      setFormData(normalizeLoadedData(response.data));
      resetMedicineEditor();
    } catch (error) {
      ErrorHandeling(error);
    } finally {
      setLoading(false);
    }
  };

  // The drug name is free text; matching medicines from the catalogue are only
  // offered as suggestions while typing.
  useEffect(() => {
    const term = medicineName.trim();
    if (term.length < 2) {
      setMedicineOptions([]);
      return undefined;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetchData(
          `/admin/medicine?name=${encodeURIComponent(term)}`
        );
        setMedicineOptions(
          [...new Set((response.data || []).map((medicine) => medicine.name))]
            .filter(Boolean)
            .slice(0, 20)
        );
      } catch {
        setMedicineOptions([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [medicineName]);

  const handleSaveMedicine = () => {
    const name = medicineName.trim();
    if (!name) {
      toast.error("Type a drug name first");
      return;
    }

    const item = {
      name,
      dosage: dosage.trim(),
      route: route.trim(),
      duration: duration.trim(),
      frequency: frequency.trim(),
    };

    setFormData((current) => {
      const drugs = [...current.drugs];
      if (editingMedicineIndex === null) drugs.push(item);
      else drugs[editingMedicineIndex] = item;
      return { ...current, drugs };
    });
    resetMedicineEditor();
  };

  // Enter in any medication box adds the row instead of submitting the form.
  const addMedicineOnEnter = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    handleSaveMedicine();
  };

  const handleEditMedicine = (index) => {
    const medicine = formData.drugs[index];
    setMedicineName(medicine.name || "");
    setDosage(medicine.dosage || "");
    setRoute(medicine.route || "");
    setDuration(medicine.duration || "");
    setFrequency(medicine.frequency || "");
    setEditingMedicineIndex(index);
  };

  const handleRemoveMedicine = (index) => {
    setFormData((current) => ({
      ...current,
      drugs: current.drugs.filter((_, itemIndex) => itemIndex !== index),
    }));
    if (editingMedicineIndex === index) resetMedicineEditor();
  };

  const mutation = useMutation({
    mutationFn: ({ regId, payload }) =>
      updateData("discharge", regId, payload),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dischargerecord"] });
      SuccessHandling(response.message);
      router.push(`/discharge/print/${variables.regId}`);
    },
    onError: ErrorHandeling,
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    const regId = String(formData.reg_id || searchTerm).trim();
    if (!regId) return;
    mutation.mutate({ regId, payload: formData });
  };

  const submitWithShortcut = useCallback(() => {
    formRef.current?.requestSubmit();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "F5") {
        event.preventDefault();
        if (!mutation.isPending) submitWithShortcut();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mutation.isPending, submitWithShortcut]);

  useEffect(() => {
    if (searchParams.get("regid")) handleGetPatient();
    // Load only when the route supplies an initial IP.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "loading") return <Loading />;
  if (session && !hasPermission(session.user, "discharge", "view")) {
    return (
      <div className="p-6">
        You do not have permission to view discharge summaries.
      </div>
    );
  }

  const canEdit = hasPermission(session?.user, "discharge", "edit");

  return (
    <Suspense fallback={<Loading />}>
      <Tab tabs={TabLinks} category="IPD" />
      <div className="flex w-full">
        <MiddleSection>
          <div className="w-full space-y-5">
            <Heading heading="Discharge Summary">
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter REGID"
                  className={inputClass}
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleGetPatient();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleGetPatient}
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? <Spinner /> : "Search"}
                </button>
              </div>
            </Heading>

            <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">
                    Patient
                  </p>
                  <p className="font-semibold">
                    {formData.patient?.fullname || "Search an IPD admission"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">
                    UHID / REGID
                  </p>
                  <p className="font-semibold">
                    {formData.mrd_id || "—"} / {formData.reg_id || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">
                    Age / Sex
                  </p>
                  <p className="font-semibold">
                    {formData.patient?.age || "—"} /{" "}
                    {formData.patient?.gender || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">
                    Admitting Consultant
                  </p>
                  <p className="font-semibold">
                    {formData.consultant?.drname || "—"}
                  </p>
                </div>
              </div>
              {formData.reg_id && (
                <div className="mt-4 flex flex-wrap items-center gap-3 border-t pt-4">
                  <Link
                    href={`/discharge/print/${formData.reg_id}`}
                    className="btn btn-success"
                  >
                    <FaPrint /> Print Discharge Summary
                  </Link>
                  <span className="text-sm text-gray-600">
                    Prints the patient&apos;s details with every section
                    blank, ready to fill in by hand. Typing below is optional.
                  </span>
                </div>
              )}
            </section>

            {canEdit && (
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
                <FormSection title="Diagnosis and History" page="1">
                  <NarrativeField
                    label="Final Diagnosis"
                    name="final_diagnosis"
                    value={formData.final_diagnosis}
                    onChange={handleChange}
                  />
                  <NarrativeField
                    label="A. Presenting Complaints"
                    name="present_complain"
                    value={formData.present_complain}
                    onChange={handleChange}
                  />
                  <NarrativeField
                    label="B. Past Medical/Surgical/Family/Other History"
                    name="past_history"
                    value={formData.past_history}
                    onChange={handleChange}
                  />
                  <NarrativeField
                    label="C. History of Drug Allergy"
                    name="drug_allergy"
                    value={formData.drug_allergy}
                    onChange={handleChange}
                    rows={2}
                  />
                  <NarrativeField
                    label="Clinical Finding on Admission"
                    name="key_finding"
                    value={formData.key_finding}
                    onChange={handleChange}
                  />
                </FormSection>

                <FormSection title="Investigations and Treatment" page="2">
                  <NarrativeField
                    label="Laboratory Investigations"
                    name="laboratory_investigations"
                    value={formData.laboratory_investigations}
                    onChange={handleChange}
                    rows={3}
                  />
                  <NarrativeField
                    label="Radiology Investigations"
                    name="radiology_investigations"
                    value={formData.radiology_investigations}
                    onChange={handleChange}
                    rows={3}
                  />
                  <NarrativeField
                    label="Other Investigations"
                    name="other_investigations"
                    value={formData.other_investigations}
                    onChange={handleChange}
                    rows={2}
                  />
                  <NarrativeField
                    label="Course of treatment in Hospital"
                    name="coursein_hp"
                    value={formData.coursein_hp}
                    onChange={handleChange}
                    rows={5}
                  />
                  <NarrativeField
                    label="Treatment Given"
                    name="treatment_given"
                    value={formData.treatment_given}
                    onChange={handleChange}
                    rows={3}
                  />
                  <div className="space-y-1.5">
                    <span className="text-sm font-medium text-gray-700">
                      The patient was referred to
                    </span>
                    <div className="grid gap-2 md:grid-cols-2">
                      {formData.referred_to.map((value, index) => (
                        <label key={index} className="flex items-center gap-2">
                          <span className="w-5 text-sm font-semibold">
                            {index + 1}.
                          </span>
                          <input
                            value={value}
                            onChange={(event) =>
                              handleReferralChange(index, event.target.value)
                            }
                            className={inputClass}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                  <NarrativeField
                    label="OT details / procedure performed (if applicable)"
                    name="procedures"
                    value={formData.procedures}
                    onChange={handleChange}
                    rows={3}
                  />
                  <NarrativeField
                    label="Post-Operative progress (if applicable)"
                    name="post_operative_progress"
                    value={formData.post_operative_progress}
                    onChange={handleChange}
                    rows={2}
                  />
                  <NarrativeField
                    label="Condition of the patient at the time of discharge"
                    name="condition_discharge"
                    value={formData.condition_discharge}
                    onChange={handleChange}
                    rows={2}
                  />
                </FormSection>

                <FormSection title="Medication advice on discharge" page="3">
                  {formData.drugs.length > 0 && (
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left">Drug Name</th>
                            <th className="px-3 py-2 text-left">Dosage</th>
                            <th className="px-3 py-2 text-left">Route</th>
                            <th className="px-3 py-2 text-left">Frequency</th>
                            <th className="px-3 py-2 text-left">Duration</th>
                            <th className="px-3 py-2 text-left">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.drugs.map((drug, index) => (
                            <tr key={`${drug.name}-${index}`} className="border-t">
                              <td className="px-3 py-2">{drug.name}</td>
                              <td className="px-3 py-2">{drug.dosage}</td>
                              <td className="px-3 py-2">{drug.route}</td>
                              <td className="px-3 py-2">{drug.frequency}</td>
                              <td className="px-3 py-2">{drug.duration}</td>
                              <td className="space-x-3 px-3 py-2">
                                <button
                                  type="button"
                                  onClick={() => handleEditMedicine(index)}
                                  className="text-blue-600 hover:underline"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMedicine(index)}
                                  className="text-red-600 hover:underline"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="grid items-end gap-4 md:grid-cols-5">
                    <label className="block space-y-1.5">
                      <span className="text-sm font-medium text-gray-700">
                        Drug Name
                      </span>
                      <input
                        list="discharge-medicine-options"
                        value={medicineName}
                        onChange={(event) => setMedicineName(event.target.value)}
                        onKeyDown={addMedicineOnEnter}
                        className={inputClass}
                        placeholder="Type medicine name"
                        autoComplete="off"
                      />
                      <datalist id="discharge-medicine-options">
                        {medicineOptions.map((name) => (
                          <option key={name} value={name} />
                        ))}
                      </datalist>
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-sm font-medium text-gray-700">
                        Dosage
                      </span>
                      <input
                        value={dosage}
                        onChange={(event) => setDosage(event.target.value)}
                        onKeyDown={addMedicineOnEnter}
                        className={inputClass}
                        placeholder="e.g. 500 mg"
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-sm font-medium text-gray-700">
                        Route
                      </span>
                      <input
                        value={route}
                        onChange={(event) => setRoute(event.target.value)}
                        onKeyDown={addMedicineOnEnter}
                        className={inputClass}
                        placeholder="e.g. Oral"
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-sm font-medium text-gray-700">
                        Frequency
                      </span>
                      <input
                        value={frequency}
                        onChange={(event) => setFrequency(event.target.value)}
                        onKeyDown={addMedicineOnEnter}
                        className={inputClass}
                        placeholder="e.g. twice daily"
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-sm font-medium text-gray-700">
                        Duration
                      </span>
                      <input
                        value={duration}
                        onChange={(event) => setDuration(event.target.value)}
                        onKeyDown={addMedicineOnEnter}
                        className={inputClass}
                        placeholder="e.g. 7 days"
                      />
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveMedicine}
                      className="btn btn-secondary"
                    >
                      {editingMedicineIndex === null
                        ? "Add medication"
                        : "Update medication"}
                    </button>
                    {editingMedicineIndex !== null && (
                      <button
                        type="button"
                        onClick={resetMedicineEditor}
                        className="btn btn-ghost"
                      >
                        Cancel edit
                      </button>
                    )}
                  </div>
                </FormSection>

                <FormSection title="Advice and Follow-up" page="3">
                  <NarrativeField
                    label="Diet advice"
                    name="diet"
                    value={formData.diet}
                    onChange={handleChange}
                    rows={2}
                  />
                  <NarrativeField
                    label="Other Instruction"
                    name="special_instructions"
                    value={formData.special_instructions}
                    onChange={handleChange}
                    rows={3}
                  />
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-gray-700">
                      Follow-up Date
                    </span>
                    <input
                      name="follow_up"
                      value={formData.follow_up}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="e.g. 15-11-2026"
                    />
                  </label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block space-y-1.5">
                      <span className="text-sm font-medium text-gray-700">
                        Date of Discharge / LAMA
                      </span>
                      <input
                        type="date"
                        name="discharge_date"
                        value={formData.discharge_date}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-sm font-medium text-gray-700">
                        Discharge Time
                      </span>
                      <input
                        type="time"
                        name="discharge_time"
                        value={formData.discharge_time}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </label>
                  </div>
                </FormSection>

                <div className="flex justify-end pb-6">
                  <button
                    type="submit"
                    disabled={mutation.isPending || !formData.reg_id}
                    className="btn btn-primary min-w-56"
                  >
                    {mutation.isPending ? (
                      <Spinner />
                    ) : (
                      <>
                        Save &amp; Print{" "}
                        <kbd className="kbd kbd-sm">F5</kbd>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </MiddleSection>
      </div>
    </Suspense>
  );
}

export default withAuth(CreateDischarge);
