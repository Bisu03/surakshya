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
import Patient from "@/models/Patient.models";
import "@/models/Doctor.models";

const escapeRegex = (value) =>
  String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function GET(req) {
  await connectDB();
  const authorization = await requirePermission("discharge", "view");
  if (authorization.response) return authorization.response;

  try {
    const { searchParams } = new URL(req.url);
    const regId = searchParams.get("reg_id")?.trim();
    const search = searchParams.get("search")?.trim();
    const startDate = searchParams.get("startDate")?.trim();
    const endDate = searchParams.get("endDate")?.trim();

    if (regId) {
      const record = await Discharge.findOne({ reg_id: regId })
        .populate("patient")
        .populate("ipd")
        .populate("consultant");

      if (!record) {
        return NextResponse.json(
          { success: false, message: "Discharge record not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: record });
    }

    const query = {};
    if (startDate || endDate) {
      query.discharge_date = {};
      if (startDate) query.discharge_date.$gte = startDate;
      if (endDate) query.discharge_date.$lte = endDate;
    }

    if (search) {
      const safeSearch = escapeRegex(search);
      const patients = await Patient.find({
        fullname: { $regex: safeSearch, $options: "i" },
      })
        .select("_id")
        .lean();

      query.$or = [
        { mrd_id: { $regex: safeSearch, $options: "i" } },
        { patient: { $in: patients.map((patient) => patient._id) } },
      ];
      if (/^\d+$/.test(search)) query.$or.push({ reg_id: search });
    }

    const records = await Discharge.find(query)
      .populate("patient")
      .populate("ipd")
      .populate("consultant")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    console.error("Unable to load discharge records:", error);
    return NextResponse.json(
      { success: false, message: "Unable to load discharge records" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  await connectDB();
  const authorization = await requirePermission("discharge", "create");
  if (authorization.response) return authorization.response;

  try {
    const body = await req.json();
    const regId = String(body.reg_id || "").trim();
    if (!/^\d+$/.test(regId)) {
      return NextResponse.json(
        { success: false, message: "REGID must be a valid number" },
        { status: 400 }
      );
    }

    const ipd = await Ipd.findOne({ reg_id: Number(regId) });
    if (!ipd) {
      return NextResponse.json(
        { success: false, message: "IPD admission not found" },
        { status: 404 }
      );
    }
    if (await Discharge.exists({ reg_id: String(ipd.reg_id) })) {
      return NextResponse.json(
        {
          success: false,
          message: "A discharge record already exists; update that record instead",
        },
        { status: 409 }
      );
    }

    const payload = normalizeDischargePayload(body);
    if (payload.discharge_date && !payload.discharge_time) {
      payload.discharge_time = formattedTime();
    }

    const record = await Discharge.create({
      ...payload,
      reg_id: String(ipd.reg_id),
      mrd_id: String(ipd.mrd_id),
      patient: ipd.patient,
      ipd: ipd._id,
      consultant: ipd.consultant,
      admit_type: ipd.admit_type || "",
      admit_date: ipd.admit_date || "",
      provisional_diagnosis: ipd.provisional_diagnosis || "",
    });

    const ipdUpdate = ipdDischargeUpdate(payload);
    if (ipdUpdate) await Ipd.findByIdAndUpdate(ipd._id, ipdUpdate);

    return NextResponse.json(
      {
        success: true,
        message: "Discharge summary created successfully",
        data: record,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unable to create discharge summary:", error);
    return NextResponse.json(
      { success: false, message: "Unable to create discharge summary" },
      { status: 500 }
    );
  }
}
