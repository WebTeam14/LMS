import mongoose from 'mongoose';

const { Schema } = mongoose;

const userRoleSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: [true, 'Role ID is required'],
      index: true,
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Tenant ID is required'],
      index: true,
    },
    scope: {
      universityId: { type: Schema.Types.ObjectId, default: null },
      campusId: { type: Schema.Types.ObjectId, default: null },
      schoolId: { type: Schema.Types.ObjectId, default: null },
      departmentId: { type: Schema.Types.ObjectId, default: null },
      programId: { type: Schema.Types.ObjectId, default: null },
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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

// Compound unique index: A user cannot have the exact same role assigned twice in the same tenant
userRoleSchema.index({ userId: 1, roleId: 1, tenantId: 1 }, { unique: true });
userRoleSchema.index({ userId: 1, tenantId: 1 });

const UserRole = mongoose.model('UserRole', userRoleSchema);

export default UserRole;
