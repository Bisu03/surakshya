const mongoose = require('mongoose');

// Parameter Schema (for individual test parameters or sub-test parameters)
const parameterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  field: {
    type: String,
    enum: ['numeric', 'text', 'boolean'],
    required: true,
    trim: true,
  },
  units: {
    type: String,
    trim: true,
  },
  range: {
    type: String,
    trim: true,
  },
  testMethod: {
    type: String,
    trim: true,
  },
  priority: {
    type: Number,
    default: 0, // Lower number means higher priority
  },
});

// SubTest Schema (for grouped parameters like RBC Indices)
const subTestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  parameters: [parameterSchema],
  priority: {
    type: Number,
    default: 0, // Lower number means higher priority
  },
});

// Test Item Schema (unifies parameters and subTests)
const testItemSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['parameter', 'subTest'],
    required: true,
  },
  data: {
    type: mongoose.Schema.Types.Mixed, // Stores parameterSchema or subTestSchema
    required: true,
  },
  priority: {
    type: Number,
    default: 0, // Lower number means higher priority
  },
});

// Lab Test Schema
const labTestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  department: {
    type: String,
    trim: true,
  },
  sampleType: {
    type: String,
    trim: true,
  },
  instrument: {
    type: String,
    trim: true,
  },
  comment: {
    type: String,
    trim: true,
  },
  suffix: {
    type: String,
    trim: true,
  },
  assessment: {
    type: String,
  },
  reporting_details: {
    type: Array
  },
  type: {
    type: String,
    enum: ['single field', 'multiple fields'],
    default: 'single field',
    trim: true,
  },
  testItems: [testItemSchema], // Unified array for parameters and subtests
}, { timestamps: true });

module.exports = mongoose.models.pathology_test || mongoose.model("pathology_test", labTestSchema);