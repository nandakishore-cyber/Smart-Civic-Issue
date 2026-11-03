const mongoose = require('mongoose');

const statuses = ['Pending', 'In Progress', 'Resolved', 'Rejected'];
const priorities = ['Low', 'Medium', 'High'];
const categories = [
  'Garbage Overflow',
  'Damaged Roads',
  'Water Leakage',
  'Street Lights',
  'Drainage',
  'Other',
];

const issueSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, minlength: 5, maxlength: 120 },
    description: { type: String, required: true, trim: true, minlength: 20, maxlength: 3000 },
    category: { type: String, required: true, enum: categories },
    location: {
      address: { type: String, required: true, trim: true, maxlength: 300 },
      city: { type: String, required: true, trim: true, maxlength: 100 },
      state: { type: String, required: true, trim: true, maxlength: 100 },
      pincode: { type: String, required: true, match: /^\d{6}$/ },
      coordinates: {
        latitude: { type: Number, min: -90, max: 90 },
        longitude: { type: Number, min: -180, max: 180 },
      },
    },
    image: {
      data: { type: Buffer, select: false },
      contentType: { type: String, select: false },
      filename: { type: String, trim: true },
      size: { type: Number, max: 5 * 1024 * 1024 },
    },
    status: { type: String, enum: statuses, default: 'Pending', index: true },
    priority: { type: String, enum: priorities, default: 'Medium', index: true },
    assignedTo: { type: String, default: '', trim: true, maxlength: 120 },
    supervisor: { type: String, default: '', trim: true, maxlength: 120 },
    supervisors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Supervisor' }],
    adminRemarks: { type: String, default: '', trim: true, maxlength: 2000 },
    officerRemarks: { type: String, default: '', trim: true, maxlength: 2000 },
    officerApproval: {
      type: String,
      enum: ['Not Required', 'Pending', 'Approved', 'Rejected'],
      default: 'Pending',
      index: true,
    },
    workflowOwner: {
      type: String,
      enum: ['admin', 'officer'],
      default: 'admin',
      index: true,
    },
    approvalRequestedAt: { type: Date },
    approvalRequestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    history: [
      {
        status: { type: String, enum: statuses, required: true },
        priority: { type: String, enum: priorities, required: true },
        assignedTo: { type: String, default: '' },
        supervisor: { type: String, default: '' },
        remarks: { type: String, default: '' },
        actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Issue', issueSchema);
