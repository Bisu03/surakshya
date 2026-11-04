import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoConnection";
import {
  ipdDischargeUpdate,
  normalizeDischargePayload,
} from "@/lib/dischargeData";
import { requirePermission } from "@/lib/serverAuth";
import { formattedTime } from "@/lib/timeGenerate";
import Discharge from "@/models/Discharge.models";
import Ipd from "@/models/Ipd.models";
import "@/models/Patient.models";
import "@/models/Doctor.models";

const validRegId = (value) => /^\d+$/.test(String(value || "").trim());

export async function GET(req, context) {
  await connectDB();
  const authorization = await requirePermission("discharge", "view");
  if (authorization.response) return authorization.response;

  try {
    const { slug } = await context.params;
    if (!validRegId(slug)) {
      return NextResponse.json(
        { success: false, message: "REGID must be a valid number" },
        { status: 400 }
      );
    }

    const existing = await Discharge.findOne({ reg_id: String(slug) })
      .populate("patient")
      .populate("ipd")
      .populate("consultant")
      .lean();

    if (existing) {
      return NextResponse.json({ success: true, data: existing });
    }

    const ipd = await Ipd.findOne({ reg_id: Number(slug) })
      .populate("patient")
      .populate("consultant")
      .lean();

    if (!ipd) {
      return NextResponse.json(
        { success: false, message: "IPD admission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        reg_id: String(ipd.reg_id),
        mrd_id: String(ipd.mrd_id),
        patient: ipd.patient,
        ipd,
        consultant: ipd.consultant,
        admit_type: ipd.admit_type || "",
        admit_date: ipd.admit_date || "",
        provisional_diagnosis: ipd.provisional_diagnosis || "",
        present_complain: ipd.present_complain || "",
        key_finding: ipd.key_finding || "",
        final_diagnosis: "",
        past_history: "",
        drug_allergy: "",
        coursein_hp: "",
        treatment_given: "",
        procedures: "",
        post_operative_progress: "",
        referred_to: [],
        laboratory_investigations: "",
        radiology_investigations: "",
        other_investigations: "",
        condition_discharge: "",
        advice_discharge: "",
        diet: "",
        drugs: [],
        activity: "",
        special_instructions: "",
        follow_up: "",
        discharge_date: "",
        discharge_time: "",
      },
    });
  } catch (error) {
    console.error("Unable to load discharge details:", error);
    return NextResponse.json(
      { success: false, message: "Unable to load discharge details" },
      { status: 500 }
    );
  }
}

export async function PUT(req, context) {
  await connectDB();
  const authorization = await requirePermission("discharge", "edit");
  if (authorization.response) return authorization.response;

  try {
    const { slug } = await context.params;
    if (!validRegId(slug)) {
      return NextResponse.json(
        { success: false, message: "REGID must be a valid number" },
        { status: 400 }
      );
    }

    const ipd = await Ipd.findOne({ reg_id: Number(slug) });
    if (!ipd) {
      return NextResponse.json(
        { success: false, message: "IPD admission not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const payload = normalizeDischargePayload(body);
    if (payload.discharge_date && !payload.discharge_time) {
      payload.discharge_time = formattedTime();
    }

    const saved = await Discharge.findOneAndUpdate(
      { reg_id: String(ipd.reg_id) },
      {
        $set: {
          ...payload,
          reg_id: String(ipd.reg_id),
          mrd_id: String(ipd.mrd_id),
          patient: ipd.patient,
          ipd: ipd._id,
          consultant: ipd.consultant,
          admit_type: ipd.admit_type || "",
          admit_date: ipd.admit_date || "",
          provisional_diagnosis: ipd.provisional_diagnosis || "",
        },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    )
      .populate("patient")
      .populate("ipd")
      .populate("consultant");

    const ipdUpdate = ipdDischargeUpdate(payload);
    if (ipdUpdate) await Ipd.findByIdAndUpdate(ipd._id, ipdUpdate);

    return NextResponse.json({
      success: true,
      message: "Discharge summary saved successfully",
      data: saved,
    });
  } catch (error) {
    console.error("Unable to save discharge summary:", error);
    return NextResponse.json(
      { success: false, message: "Unable to save discharge summary" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, context) {
  await connectDB();
  const authorization = await requirePermission("discharge", "delete");
  if (authorization.response) return authorization.response;

  try {
    const { slug } = await context.params;
    if (!mongoose.isValidObjectId(slug)) {
      return NextResponse.json(
        { success: false, message: "Invalid discharge record ID" },
        { status: 400 }
      );
    }

    const deleted = await Discharge.findByIdAndDelete(slug);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Discharge record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Discharge record deleted successfully",
    });
  } catch (error) {
    console.error("Unable to delete discharge record:", error);
    return NextResponse.json(
      { success: false, message: "Unable to delete discharge record" },
      { status: 500 }
    );
  }
}
