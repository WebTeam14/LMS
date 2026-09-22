import mongoose from 'mongoose';

const { Schema } = mongoose;

const roleSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      trim: true,
      maxlength: [100, 'Role name cannot exceed 100 characters'],
    },
    code: {
      type: String,
      required: [true, 'Role code is required'],
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9_]+$/, 'Role code must be uppercase alphanumeric with underscores'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters'],
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      default: null, // null indicates system-wide platform role
      index: true,
    },
    permissions: {
      type: [String],
      default: [],
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

// Compound index: Unique role code within a tenant (or global platform if tenantId is null)
roleSchema.index({ tenantId: 1, code: 1 }, { unique: true });

const Role = mongoose.model('Role', roleSchema);

export default Role;
