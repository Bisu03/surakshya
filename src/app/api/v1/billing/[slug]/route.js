import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoConnection"; // MongoDB connection utility

import Billing from "@/models//Billing.models"; // Mongoose  model
import Discharge from "@/models/Discharge.models";
import "@/models/Patient.models";
import Doctor from "@/models/Doctor.models";
import { formattedTime } from "@/lib/timeGenerate";
import IpdModels from "@/models/Ipd.models";
import { requirePermission } from "@/lib/serverAuth";
import { calculateBill } from "@/lib/money";
import { reserveSequence, releaseSequence } from "@/lib/sequence";

export async function GET(req, context) {
  // Connect to the database
  await connectDB();

  // Get the session
  const authorization = await requirePermission("ipd_billing", "view");
  if (authorization.response) return authorization.response;
  try {
    const { slug } = await context.params;
    const data = await Billing.findOne({
      reg_id: slug,
    })
      .populate("patient")
      .populate("ipd");

    if (!data) {
      const pdata = await IpdModels.findOne({
        reg_id: slug
      })
      if (!pdata) {
        return NextResponse.json(
          { success: false, message: "IPD admission not found" },
          { status: 404 }
        );
      }

      const cdata = await Doctor.findById(pdata.consultant);
      if (!cdata) {
        return NextResponse.json(
          { success: false, message: "Consultant not found" },
          { status: 404 }
        );
      }
      const consultant = cdata.toObject();

      const bdata = await Billing.create({
        reg_id: pdata.reg_id,
        mrd_id: pdata.mrd_id,
        consultant_cart: {
          items: [{ ...consultant, doctor_visit: 1 }],
          total: Number(consultant.charge) || 0,
        },
        patient: pdata.patient,
        ipd: pdata._id,
      })
      if (bdata) {
        const data = await Billing.findById(bdata._id)
          .populate("patient")
          .populate("ipd");
        return NextResponse.json({ success: true, data }, { status: 200 });
      }
    }
    // Return the message
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req, context) {
  await connectDB();
  let reservedBillNo;
  try {
    const { slug } = await context.params;
    const body = await req.json();
    const authorization = await requirePermission(
      "ipd_billing",
      body.isDone === true ? "finalize" : "edit"
    );
    if (authorization.response) return authorization.response;

    const currentBill = await Billing.findOne({ reg_id: slug });
    if (!currentBill) {
      return NextResponse.json(
        { success: false, message: "Billing record not found" },
        { status: 404 }
      );
    }
    const calculated = calculateBill({
      consultantCart: body.consultant_cart,
      serviceCart: body.service_cart,
      medicineCart: body.medicine_cart,
      accessoryCart: body.accessory_cart,
      discount: body.amount?.discount,
      previouslyPaid: currentBill.amount?.paid || 0,
      newPayment: body.paid_amount,
    });
    const update = {
      consultant_cart: body.consultant_cart,
      service_cart: body.service_cart,
      medicine_cart: calculated.medicineCart,
      accessory_cart: calculated.accessoryCart,
      amount: calculated.amount,
      paid_amount: body.paid_amount,
      paidby: body.paidby,
      payment_date: body.payment_date,
      billing_date: body.billing_date,
      billing_time: body.billing_time || formattedTime(),
      isDone: body.isDone === true,
      ...(body.advances !== undefined ? { advances: body.advances } : {}),
    };
    let updatedBill;
    if (body.isDone === true) {
      if (body.bill_no) {
        updatedBill = await Billing.findOneAndUpdate(
          { reg_id: slug },
          update,
          { new: true }
        );
      } else {
        reservedBillNo = await reserveSequence("billno");

        updatedBill = await Billing.findOneAndUpdate(
          { reg_id: slug },
          {
            ...update,
            bill_no: reservedBillNo,
          },
          { new: true }
        );
        if (updatedBill) {
          await Discharge.findOneAndUpdate(
            {
              reg_id: slug,
            },
            {
              bill_no: reservedBillNo,
              discharge_date: body?.billing_date || null,
              discharge_time: body?.billing_time
                ? body?.billing_time
                : formattedTime(),
            }
          );
        }
      }
    } else {
      updatedBill = await Billing.findOneAndUpdate(
        { reg_id: slug },
        update,
        { new: true }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Billing Updated Successfully",
      data: updatedBill,
    });
  } catch (error) {
    // Reclaim the reserved bill number so a failed finalize does not skip it.
    await releaseSequence("billno", reservedBillNo);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req, context) {
  await connectDB();
  const authorization = await requirePermission("ipd_billing", "delete");
  if (authorization.response) return authorization.response;

  try {
    const { slug } = await context.params;
    await Billing.findByIdAndDelete(slug);

    return NextResponse.json({
      success: true,
      message: "Billing Deleted Successfully",
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
