import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Tenant ID is required'],
      index: true,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false,
    },
    status: {
      type: String,
      enum: ['active', 'invited', 'suspended', 'inactive'],
      default: 'active',
      index: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
    },
    lastLoginIp: {
      type: String,
    },
    passwordChangedAt: {
      type: Date,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
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
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.passwordHash;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index: email must be unique within a tenant for active (non-deleted) accounts
userSchema.index({ tenantId: 1, email: 1 }, { unique: true });
userSchema.index({ tenantId: 1, status: 1 });
userSchema.index({ tenantId: 1, isDeleted: 1 });

// Full name virtual
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Compare password using bcrypt
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Check if account is currently locked
userSchema.methods.isLocked = function () {
  return Boolean(this.lockUntil && this.lockUntil > new Date());
};

// Increment login attempts and lock account for 15 minutes after 5 consecutive failures
userSchema.methods.incrementLoginAttempts = async function () {
  const doc = await this.model('User').findById(this._id);
  if (!doc) return;

  // If a previous lock has expired, reset attempts counter to 1
  if (doc.lockUntil && doc.lockUntil <= new Date()) {
    return this.model('User').updateOne(
      { _id: this._id },
      { $set: { failedLoginAttempts: 1 }, $unset: { lockUntil: 1 } }
    );
  }

  const newAttempts = (doc.failedLoginAttempts || 0) + 1;
  const updates = { failedLoginAttempts: newAttempts };
  if (newAttempts >= 5) {
    updates.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
  }

  return this.model('User').updateOne({ _id: this._id }, { $set: updates });
};

// Reset failed login attempts on successful login
userSchema.methods.resetLoginAttempts = async function (ipAddress) {
  return this.model('User').updateOne(
    { _id: this._id },
    {
      $set: {
        failedLoginAttempts: 0,
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
      $unset: { lockUntil: 1 },
    }
  );
};

const User = mongoose.model('User', userSchema);

export default User;
