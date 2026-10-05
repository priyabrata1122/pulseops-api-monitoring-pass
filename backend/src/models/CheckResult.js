const mongoose = require('mongoose');

const checkResultSchema = new mongoose.Schema(
  {
    monitor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Monitor',
      required: true,
      index: true,
    },
    statusCode: {
      type: Number,
      default: null,
    },
    latencyMs: {
      type: Number,
      default: null,
    },
    success: {
      type: Boolean,
      required: true,
    },
    errorMessage: {
      type: String,
      maxlength: 1000,
      default: null,
    },
    checkedAt: {
      type: Date,
      default: Date.now,
      index: true,
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

checkResultSchema.index({ monitor: 1, checkedAt: -1 });

module.exports = mongoose.model('CheckResult', checkResultSchema);
