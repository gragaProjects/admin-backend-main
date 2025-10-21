const mongoose = require('mongoose');
const { Schema } = mongoose;
const { addressSchema, noteSchema } = require('./schemas/common');

const MemberSchema = new Schema({
  memberId: {
    type: String,
    unique: true,
    sparse: true
  },
  profilePic: String,
  AHIdentityCard: { type: String },
  isStudent: { type: Boolean, default: false },
  isSubprofile: { type: Boolean, default: false },
  primaryMemberId: { type: Schema.Types.ObjectId, ref: 'Member' },
  subprofileIds: [{ type: Schema.Types.ObjectId, ref: 'Member' }],
  name: { type: String },
  email: String,
  phone: { type: String, required: true },
  secondaryPhone: String,
  dob: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  bloodGroup: String,
  heightInFt: Number,
  weightInKg: Number,
  emergencyContact: {
    name: String,
    relation: { type: String, enum: ['father', 'mother', 'guardian', 'spouse', 'other', 'son', 'daughter'] },
    phone: String
  },
  address: [addressSchema],
  employmentStatus: {
    type: String,
    enum: ['employed', 'unemployed', 'self_employed', 'retired', 'student', 'homemaker']
  },
  educationLevel: {
    type: String,
    enum: ['primary', 'secondary', 'higher_secondary', 'graduate', 'post_graduate', 'doctorate']
  },
  maritalStatus: {
    type: String,
    enum: ['single', 'married', 'divorced', 'widowed']
  },
  termsConditionsAccepted: { type: Boolean, default: false },
  onBoarded: { type: Boolean, default: false },
  additionalInfo: String,
  isMember: { type: Boolean, default: false },
  membershipStatus: {
    isRegistered: {
      type: Boolean,
      default: false
    },
    registrationDate: Date,
    hasOneTimeRegistrationDiscount: {
      type: Boolean,
      default: false
    },
    premiumMembership: {
      isActive: {
        type: Boolean,
        default: false
      },
      startDate: Date,
      expiryDate: Date,
      renewalCount: {
        type: Number,
        default: 0
      }
    }
  },
  active: { type: Boolean, default: true },
  studentDetails: {
    type: {
      schoolId: { type: String, ref: 'School' },
      schoolName: String,
      grade: String,
      section: String,
      guardians: [{
        name: String,
        relation: { type: String, enum: ['father', 'mother', 'guardian'] },
        phone: String
      }],
      alternatePhone: Number
    },
    required: false
  },
  healthcareTeam: {
    navigator: {
      _id: { type: Schema.Types.ObjectId, ref: 'Navigator' },
      name: String,
      assignedDate: Date
    },
    doctor: {
      _id: { type: Schema.Types.ObjectId, ref: 'Doctor' },
      name: String,
      assignedDate: Date
    },
    nurse: {
      _id: { type: Schema.Types.ObjectId, ref: 'Nurse' },
      name: String,
      assignedDate: Date
    }
  },
  notes: [noteSchema]
}, { timestamps: true });

// Add pre-save middleware to handle the async memberId generation
// Add pre-save middleware to handle the async memberId generation
MemberSchema.pre('save', async function(next) {
  if (!this.memberId && this.isMember === true) {
    // Find the last memberId
    const lastMember = await this.constructor.findOne({}, { memberId: 1 }, { sort: { memberId: -1 } });
    
    if (!lastMember || !lastMember.memberId) {
      this.memberId = 'AAA00';  // First member or no memberId
    } else {
      const prefix = lastMember.memberId.slice(0, 3);
      const num = parseInt(lastMember.memberId.slice(3));
      
      if (num < 99) {
        // If number hasn't reached 99, increment it
        this.memberId = `${prefix}${String(num + 1).padStart(2, '0')}`;
      } else {
        // If number reached 99, increment the prefix
        const lastChar = prefix.charAt(2);
        const newLastChar = String.fromCharCode(lastChar.charCodeAt(0) + 1);
        this.memberId = `${prefix.slice(0, 2)}${newLastChar}00`;
      }
    }
  }
  next();
});

// Add indexes
MemberSchema.index({ phone: 1 });
MemberSchema.index({ email: 1 });

module.exports = mongoose.model('Member', MemberSchema); 