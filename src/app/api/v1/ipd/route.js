import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoConnection";
import { formattedTime } from "@/lib/timeGenerate";
import { requirePermission } from "@/lib/serverAuth";
import Billing from "@/models/Billing.models";
import Discharge from "@/models/Discharge.models";
import "@/models/Doctor.models";
import Ipd from "@/models/Ipd.models";
import Patient from "@/models/Patient.models";
import { reserveSequence, releaseSequence } from "@/lib/sequence";

export async function GET(req) {
  try {
    await connectDB();
    const authorization = await requirePermission("ipd", "view");
    if (authorization.response) return authorization.response;

    const url = new URL(req.url);
    const fullname = url.searchParams.get("fullname");
    const id = url.searchParams.get("id");
    const regid = url.searchParams.get("regid");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    if (id) {
      if (!/^\d+$/.test(id)) {
        return NextResponse.json(
          { success: false, message: "REGID must be a valid number" },
          { status: 400 }
        );
      }
      const regId = Number(id);
      const data = await Ipd.findOne({ reg_id: regId })
        .populate("patient")
        .populate("consultant");
      if (!data) {
        return NextResponse.json(
          { success: false, message: "IPD admission not found" },
          { status: 404 }
        );
      }
      const billdata = await Billing.findOne({ reg_id: regId });
      return NextResponse.json({ success: true, data, billdata });
    }

    const match = {};
    if (fullname) {
      match["patient.fullname"] = { $regex: fullname, $options: "i" };
    }
    if (regid) match.reg_id = Number(regid);
    if (startDate || endDate) {
      match.admit_date = {};
      if (startDate) match.admit_date.$gte = startDate;
      if (endDate) match.admit_date.$lte = endDate;
    }
    if (Object.keys(match).length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const data = await Ipd.aggregate([
      {
        $lookup: {
          from: "patient_registrations",
          localField: "patient",
          foreignField: "_id",
          as: "patient",
        },
      },
      { $unwind: "$patient" },
      {
        $lookup: {
          from: "doctors",
          localField: "consultant",
          foreignField: "_id",
          as: "consultant",
        },
      },
      { $unwind: { path: "$consultant", preserveNullAndEmptyArrays: true } },
      { $match: match },
      { $sort: { createdAt: -1 } },
    ]);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Unable to load IPD records:", error);
    return NextResponse.json(
      { success: false, message: "Unable to load IPD records" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  await connectDB();
  const authorization = await requirePermission("ipd", "create");
  if (authorization.response) return authorization.response;

  let createdPatientId;
  let createdIpdId;
  let reservedRegId;
  let reservedMrdId;
  try {
    const body = await req.json();
    const consultantId = body.consultant?._id;
    if (!body.fullname?.trim() || !body.phone_number?.trim() || !consultantId) {
      return NextResponse.json(
        { success: false, message: "Patient name, phone number and consultant are required" },
        { status: 400 }
      );
    }
    if (!body.father_husband_name?.trim()) {
      return NextResponse.json(
        { success: false, message: "Father / Husband name is required" },
        { status: 400 }
      );
    }
    if (body.consent_accepted !== true) {
      return NextResponse.json(
        { success: false, message: "Admission consent must be acknowledged" },
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

    // Reserve sequence numbers only after all validation above has passed, so a
    // 400 never burns a number. Reserved values are reclaimed on any failure
    // below (catch block + the existing-patient 404 path).
    reservedRegId = await reserveSequence("regid");
    if (!body.mrd_id) {
      reservedMrdId = await reserveSequence("mrdid");
    }

    const patientFields = {
      fullname: body.fullname.trim(),
      father_husband_name: body.father_husband_name.trim(),
      phone_number: body.phone_number.trim(),
      age: body.age,
      dob: body.dob,
      gender: body.gender,
      marital_status: body.marital_status,
      occupation: body.occupation,
      blood_group: body.blood_group,
      address: body.address,
      aadhar: body.aadhar || undefined,
      guardian_name: body.guardian_name,
      guardian_relationship: body.guardian_relationship,
      religion: body.religion,
      nationality: body.nationality,
      guardian_phone: body.guardian_phone,
      landline: body.landline,
      village: body.village,
      post_office: body.post_office,
      police_station: body.police_station,
      district: body.district,
      pin_code: body.pin_code,
      state: body.state,
      admited_by: authorization.session.user.username,
    };

    let patient;
    if (body.mrd_id) {
      patient = await Patient.findOneAndUpdate(
        { mrd_id: Number(body.mrd_id) },
        patientFields,
        { new: true, runValidators: true }
      );
      if (!patient) {
        // This path burns a regid before the catch can run — reclaim it here.
        await releaseSequence("regid", reservedRegId);
        return NextResponse.json(
          { success: false, message: "Existing patient not found" },
          { status: 404 }
        );
      }
    } else {
      patient = await Patient.create({
        ...patientFields,
        reg_id: reservedRegId,
        mrd_id: reservedMrdId,
      });
      createdPatientId = patient._id;
    }

    const ipd = await Ipd.create({
      reg_id: reservedRegId,
      mrd_id: patient.mrd_id,
      patient: patient._id,
      consultant: consultantId,
      hight: body.hight,
      weight: body.weight,
      bp: body.bp,
      admission_charge: body.admission_charge,
      admit_type: body.admit_type,
      paidby: body.paidby,
      department: body.department,
      initial_deposit: initialDeposit,
      corporate_name: body.corporate_name,
      corporate_address: body.corporate_address,
      referral_contact_person: body.referral_contact_person,
      referral_contact_number: body.referral_contact_number,
      tpa_name: body.tpa_name,
      consent_given_by: body.consent_given_by,
      responsible_for_payment: body.responsible_for_payment,
      consent_accepted: body.consent_accepted === true,
      swasthya_sathi_acknowledged:
        body.swasthya_sathi_acknowledged === true,
      key_finding: body.key_finding,
      admit_date: body.admit_date,
      admit_time: body.admit_time || formattedTime(),
      present_complain: body.present_complain,
      medical_case: body.medical_case,
      provisional_diagnosis: body.provisional_diagnosis,
      referr_by: body.referr_by,
      admited_by: authorization.session.user.username,
    });
    createdIpdId = ipd._id;

    const consultant = body.consultant;
    await Billing.create({
      reg_id: reservedRegId,
      mrd_id: patient.mrd_id,
      patient: patient._id,
      ipd: ipd._id,
      consultant_cart: {
        items: [{ ...consultant, doctor_visit: 1 }],
        total: Number(consultant.charge) || 0,
      },
      service_cart: { items: [], total: 0 },
      medicine_cart: { items: [], total: 0 },
      amount: {
        total: 0,
        discount: 0,
        netTotal: 0,
        paid: initialDeposit,
        due: 0,
      },
    });
    await Discharge.create({
      reg_id: reservedRegId,
      mrd_id: patient.mrd_id,
      patient: patient._id,
      ipd: ipd._id,
      consultant: consultantId,
      present_complain: body.present_complain,
      key_finding: body.key_finding,
      admit_date: body.admit_date,
      provisional_diagnosis: body.provisional_diagnosis,
    });

    return NextResponse.json(
      { success: true, message: "Patient admitted successfully", data: ipd },
      { status: 201 }
    );
  } catch (error) {
    if (createdIpdId) {
      await Promise.allSettled([
        Ipd.findByIdAndDelete(createdIpdId),
        Billing.deleteMany({ ipd: createdIpdId }),
        Discharge.deleteMany({ ipd: createdIpdId }),
      ]);
    }
    if (createdPatientId) await Patient.findByIdAndDelete(createdPatientId);
    // Reclaim the reserved numbers so a failed admission does not skip them.
    await releaseSequence("mrdid", reservedMrdId);
    await releaseSequence("regid", reservedRegId);
    return NextResponse.json(
      { success: false, message: "Unable to admit patient", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  await connectDB();
  const authorization = await requirePermission("ipd", "delete");
  if (authorization.response) return authorization.response;

  const id = new URL(req.url).searchParams.get("id");
  const ipd = await Ipd.findById(id);
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
