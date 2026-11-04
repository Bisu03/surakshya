// File: /models/PharmacyConfig.js
import mongoose from "mongoose";

// Create the PharmacyConfig schema
const pharmacyConfigSchema = new mongoose.Schema({
  pid: { type: String, default: "pharmacyinfo" },
  storeName: { type: String },
  address: { type: String },
  dist: { type: String },
  pin: { type: String },
  phone: { type: String },
  email: { type: String },
  hospitalCode: { type: String },
  gstNumber: { type: String },
  regNumber: { type: String },
  licenceNumber: { type: String },
  pan: { type: String },
  bank: { type: String },
  branch: { type: String },
  account: { type: String },
  ifsc: { type: String },
  logo: { type: String },
  language: { type: String, default: "English" },
  timezone: { type: String },
  currency: { type: String },
  currencySymbol: { type: String },
});

// Check if the model is already defined in mongoose.models
const PharmacyConfig =
  mongoose.models.pharmacy_config ||
  mongoose.model("pharmacy_config", pharmacyConfigSchema);

export default PharmacyConfig;
