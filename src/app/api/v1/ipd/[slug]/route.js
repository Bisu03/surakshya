import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoConnection";
import { requirePermission } from "@/lib/serverAuth";
import Billing from "@/models/Billing.models";
import Discharge from "@/models/Discharge.models";
import Doctor from "@/models/Doctor.models";
import Ipd from "@/models/Ipd.models";
import Patient from "@/models/Patient.models";

const patientFields = [
  "fullname",
  "father_husband_name",
  "phone_number",
  "age",
  "dob",
  "gender",
  "marital_status",
  "occupation",
  "blood_group",
  "address",
  "aadhar",
  "guardian_name",
  "guardian_relationship",
  "religion",
  "guardian_phone",
  "nationality",
  "landline",
  "village",
  "post_office",
  "police_station",
  "district",
  "pin_code",
  "state",
];

const ipdFields = [
  "hight",
  "weight",
  "bp",
  "admission_charge",
  "admit_type",
  "paidby",
  "department",
  "initial_deposit",
  "corporate_name",
  "corporate_address",
  "referral_contact_person",
  "referral_contact_number",
  "tpa_name",
  "consent_given_by",
  "responsible_for_payment",
  "consent_accepted",
  "swasthya_sathi_acknowledged",
  "admit_date",
  "admit_time",
  "present_complain",
  "medical_case",
  "key_finding",
  "provisional_diagnosis",
  "referr_by",
];

function pick(source, fields) {
  return Object.fromEntries(
    fields.filter((field) => source[field] !== undefined).map((field) => [field, source[field]])
  );
}

export async function GET(req, context) {
  await connectDB();
  const authorization = await requirePermission("ipd", "view");
  if (authorization.response) return authorization.response;

  const { slug } = await context.params;
  if (!mongoose.isValidObjectId(slug)) {
    return NextResponse.json(
      { success: false, message: "Invalid IPD admission ID" },
      { status: 400 }
    );
  }
  const data = await Ipd.findById(slug).populate("patient").populate("consultant");
  if (!data) {
    return NextResponse.json(
      { success: false, message: "IPD admission not found" },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true, data });
}

export async function PUT(req, context) {
  await connectDB();
  const authorization = await requirePermission("ipd", "edit");
  if (authorization.response) return authorization.response;

  try {
    const { slug } = await context.params;
    if (!mongoose.isValidObjectId(slug)) {
      return NextResponse.json(
        { success: false, message: "Invalid IPD admission ID" },
        { status: 400 }
      );
    }
    const body = await req.json();
    const ipd = await Ipd.findById(slug);
    if (!ipd) {
      return NextResponse.json(
        { success: false, message: "IPD admission not found" },
        { status: 404 }
      );
    }
    const patient = await Patient.findById(ipd.patient);
    if (!patient) {
      return NextResponse.json(
        { success: false, message: "Linked patient not found" },
        { status: 404 }
      );
    }

    const consultantId = body.consultant?._id || body.consultant;
    if (!mongoose.isValidObjectId(consultantId) || !(await Doctor.exists({ _id: consultantId }))) {
      return NextResponse.json(
        { success: false, message: "A valid consultant is required" },
        { status: 400 }
      );
    }
    if (!String(body.fullname || "").trim() || !String(body.phone_number || "").trim()) {
      return NextResponse.json(
        { success: false, message: "Patient name and phone number are required" },
        { status: 400 }
      );
    }
    if (!String(body.father_husband_name || "").trim()) {
      return NextResponse.json(
        { success: false, message: "Father / Husband name is required" },
        { status: 400 }
      );
    }
    if (body.pin_code && !/^\d{6}$/.test(String(body.pin_code).trim())) {
      return NextResponse.json(
        { success: false, message: "PIN code must contain 6 digits" },
        { status: 400 }
      );
    }
    const initialDeposit = Number(body.initial_deposit || 0);
    if (!Number.isFinite(initialDeposit) || initialDeposit < 0) {
      return NextResponse.json(
        { success: false, message: "Initial deposit must be a valid non-negative amount" },
        { status: 400 }
      );
    }
    body.initial_deposit = initialDeposit;

    Object.assign(patient, pick(body, patientFields));
    patient.admited_by = authorization.session.user.username;
    await patient.save();

    Object.assign(ipd, pick(body, ipdFields));
    ipd.consultant = consultantId;
    ipd.admited_by = authorization.session.user.username;
    await ipd.save();

    await Discharge.findOneAndUpdate(
      { ipd: ipd._id },
      {
        consultant: consultantId,
        present_complain: ipd.present_complain,
        key_finding: ipd.key_finding,
        admit_date: ipd.admit_date,
        provisional_diagnosis: ipd.provisional_diagnosis,
      }
    );

    const data = await Ipd.findById(ipd._id).populate("patient").populate("consultant");
    return NextResponse.json({
      success: true,
      message: "IPD admission updated successfully",
      data,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Unable to update IPD admission", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req, context) {
  await connectDB();
  const authorization = await requirePermission("ipd", "delete");
  if (authorization.response) return authorization.response;

  const { slug } = await context.params;
  const ipd = await Ipd.findById(slug);
  if (!ipd) {
    return NextResponse.json(
      { success: false, message: "IPD admission not found" },
      { status: 404 }
    );
  }
  await Promise.all([
    Billing.deleteMany({ ipd: ipd._id }),
    Discharge.deleteMany({ ipd: ipd._id }),
    ipd.deleteOne(),
  ]);
  return NextResponse.json({ success: true, message: "IPD admission deleted" });
}
