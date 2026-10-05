const mongoose = require('mongoose');

const monitorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    url: {
      type: String,
      required: [true, 'URL is required'],
      trim: true,
      maxlength: [500, 'URL cannot exceed 500 characters'],
    },
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
      default: 'GET',
    },
    expectedStatusCode: {
      type: Number,
      default: 200,
      min: 100,
      max: 599,
    },
    intervalSeconds: {
      type: Number,
      default: 60,
      min: 10,
      max: 3600,
    },
    timeoutSeconds: {
      type: Number,
      default: 10,
      min: 1,
      max: 60,
    },
    active: {
      type: Boolean,
      default: true,
    },
    lastCheckedAt: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
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

monitorSchema.index({ active: 1, lastCheckedAt: 1 });

module.exports = mongoose.model('Monitor', monitorSchema);
