const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    monitor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Monitor',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['IN_APP', 'WEBHOOK', 'MOCK_EMAIL'],
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'SENT', 'FAILED'],
      default: 'PENDING',
    },
    message: {
      type: String,
      maxlength: 2000,
      default: null,
    },
    webhookUrl: {
      type: String,
      default: null,
    },
    failureReason: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    sentAt: {
      type: Date,
      default: null,
    },
  },
  {
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

alertSchema.index({ monitor: 1, createdAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);
