import mongoose from 'mongoose';

const { Schema } = mongoose;

const tenantSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Tenant name is required'],
      trim: true,
      maxlength: [150, 'Tenant name cannot exceed 150 characters'],
    },
    code: {
      type: String,
      required: [true, 'Tenant code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: [true, 'Tenant slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    domain: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'inactive'],
      default: 'active',
      index: true,
    },
    settings: {
      allowSelfRegistration: {
        type: Boolean,
        default: true,
      },
      mfaRequired: {
        type: Boolean,
        default: false,
      },
      timezone: {
        type: String,
        default: 'UTC',
      },
      branding: {
        logoUrl: { type: String, default: '' },
        primaryColor: { type: String, default: '#4f46e5' },
      },
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

tenantSchema.index({ code: 1, isDeleted: 1 });
tenantSchema.index({ domain: 1, isDeleted: 1 });

const Tenant = mongoose.model('Tenant', tenantSchema);

export default Tenant;
