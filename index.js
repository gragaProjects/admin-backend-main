const mongoose = require('mongoose');
const { Schema } = mongoose;
const mongoosePaginate = require('mongoose-paginate-v2');

// Common sub-schemas
const addressSchema = new Schema({
  description: String,
  pinCode: String,
  region: String,
  landmark: String,
  state: String,
  country: String,
  location: {
    latitude: Number,
    longitude: Number
  }
});

const timeSlotSchema = new Schema({
  day: String,
  from: String,
  to: String
});

// Auth Schema
const AuthCredentialSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true },
  userType: {
    type: String,
    enum: ['admin', 'navigator', 'nurse', 'doctor', 'empanelled_doctor', 'member'],
    required: true
  },
  memberId: {
    type: String,
    sparse: true,
    unique: true,
    required: function() {
      return this.userType === 'member';
    }
  },
  email: String,
  phoneNumber: { type: String, required: true },
  password: String,
  lastOtp: {
    code: String,
    expiresAt: Date
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Add pagination plugin
AuthCredentialSchema.plugin(mongoosePaginate);

// Admin Schema
const AdminSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  profilePicture: String,
  role: {
    type: String,
    default: 'admin'
  }
}, { timestamps: true });

// Navigator Schema
const NavigatorSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  dob: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  profilePic: String,
  role: { type: String, default: 'navigator' },
  languagesSpoken: [String],
  introduction: String,
  total_assigned_members: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
}, { timestamps: true });

// Nurse Schema
const NurseSchema = new Schema({
  name: { type: String, required: true },
  schoolId: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  dob: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  profilePic: String,
  role: { type: String, default: 'nurse' },
  languagesSpoken: [String],
  introduction: String
}, { timestamps: true });

// Doctor Schema
const DoctorSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  qualification: [String],
  medicalCouncilRegistrationNumber: { type: String, required: true },
  experienceYears: Number,
  languagesSpoken: [String],
  serviceTypes: [{
    type: String,
    enum: ['online', 'offline']
  }],
  introduction: String,
  onlineConsultationTimeSlots: [timeSlotSchema],
  offlineConsultationTimeSlots: [timeSlotSchema],
  profilePic: String,
  digitalSignature: String,
  areas: [String],
  role: { type: String, default: 'doctor' },
  total_assigned_members: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
}, { timestamps: true });

// Add pagination plugin to Doctor schema
DoctorSchema.plugin(mongoosePaginate);

// Empanelled Doctor Schema
const EmpanelledDoctorSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  qualification: [String],
  medicalCouncilRegistrationNumber: { type: String, required: true },
  experienceInYrs: Number,
  languagesSpoken: [String],
  serviceType: [String],
  introduction: String,
  specializations: [String],
  specializedIn: String,
  workplaces: [{
    providerId: { type: Schema.Types.ObjectId, ref: 'HealthcareProvider' },
    type: String,
    name: String,
    offline: {
      consultationFees: Number,
      timeSlots: [timeSlotSchema]
    },
    online: {
      consultationFees: Number,
      timeSlots: [timeSlotSchema]
    }
  }],
  average_consultation_fees: Number,
  profilePic: String,
  role: { type: String, default: 'empanelled_doctor' },
  rating: { type: Number, default: 0 },
}, { timestamps: true });

// Healthcare Provider Schema
const HealthcareProviderSchema = new Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['hospital', 'clinic', 'diagnostic_center', 'pharmacy', 'nursing_home']
  },
  address: addressSchema,
  contactNumber: String,
  email: String,
  website: String,
  servicesOffered: [String],
  operationHours: [timeSlotSchema]
}, { timestamps: true });

// Member Schema
const MemberSchema = new Schema({
  memberId: { type: String, required: true, unique: true },
  AHIdentityCard: { type: String },
  isStudent: { type: Boolean, default: false },
  isSubprofile: { type: Boolean, default: false },
  primaryMemberId: { type: Schema.Types.ObjectId, ref: 'Member' },
  subprofileIds: [{ type: Schema.Types.ObjectId, ref: 'Member' }],
  name: { type: String, required: true },
  email: String,
  phone: { type: String, required: true },
  dob: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  profilePic: String,
  emergencyContact: {
    name: String,
    relation: String,
    phone: String
  },
  bloodGroup: String,
  heightInFt: Number,
  weightInKg: Number,
  additionalInfo: String,
  address: addressSchema,
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
  subscriptions: [{
    planType: String,
    startDate: Date,
    endDate: Date,
    status: String
  }],
  addons: [String],
  active: { type: Boolean, default: true },
  studentDetails: {
    schoolId: String,
    institution: String,
    grade: String,
    section: String,
    guardians: [{
      name: String,
      relation: String,
      phone: String
    }],
    alternatePhone: Number
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
  }
}, { timestamps: true });

// Medical History Schema
const MedicalHistorySchema = new Schema({
  memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  medicalReports: [{
    name: String,
    files: [String]
  }],
  treatingDoctors: [{
    name: String,
    hospitalName: String,
    speciality: String
  }],
  followUps: [{
    date: Date,
    specialistDetails: String,
    remarks: String
  }],
  familyHistory: [{
    condition: String,
    relationship: {
      type: String,
      enum: ['father', 'mother', 'sibling', 'grandparent', 'other']
    }
  }],
  allergies: [{
    medications: String,
    food: String,
    other: String
  }],
  currentMedications: [{
    name: String,
    dosage: String,
    frequency: String
  }],
  surgeries: [{
    procedure: String,
    date: Date,
    surgeonName: String
  }],
  previousMedicalConditions: [{
    condition: String,
    diagnosedAt: Date,
    treatmentReceived: String,
    notes: String,
    status: {
      type: String,
      enum: ['active', 'resolved', 'inremission', 'chronic']
    }
  }],
  immunizations: [{
    vaccine: String,
    date: Date
  }],
  medicalTestResults: [{
    name: String,
    date: Date,
    results: String
  }],
  currentSymptoms: [{
    symptom: String,
    concerns: String
  }],
  lifestyleHabits: {
    smoking: {
      type: String,
      enum: ['never', 'occasional', 'daily']
    },
    alcoholConsumption: {
      type: String,
      enum: ['never', 'occasional', 'daily']
    },
    exercise: {
      type: String,
      enum: ['never', 'occasional', 'daily']
    }
  },
  healthInsurance: [{
    provider: String,
    policyNumber: String,
    expiryDate: Date
  }]
}, { timestamps: true });

// Add indexes to MedicalHistory schema
MedicalHistorySchema.index({ memberId: 1 });
MedicalHistorySchema.index({ 'surgeries.date': 1 });
MedicalHistorySchema.index({ 'immunizations.date': 1 });

// School Schema
const SchoolSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  address: addressSchema,
  contactNumber: String,
  email: String,
  website: String,
  grades: [{
    class: String,
    section: [{
      name: String,
      studentsCount: Number
    }]
  }],
  principal: {
    name: String,
    email: String,
    phone: String
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Assessment Schema
const AssessmentSchema = new Schema({
  memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  name: String,
  heightInFt: Number,
  weightInKg: Number,
  bmi: Number,
  temperatureInCelsius: Number,
  temperatureInFahrenheit: Number,
  pulseRateBpm: Number,
  spo2Percentage: Number,
  bp: String,
  oralHealth: {
    type: String,
    enum: ['good', 'fair', 'poor']
  },
  dentalIssues: String,
  visionLeft: String,
  visionRight: String,
  hearingComments: String,
  additionalComments: String,
  doctorSignature: String
}, { timestamps: true });

// Infirmary Schema
const InfirmarySchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  date: Date,
  time: String,
  consentFrom: {
    type: String,
    enum: ['parent', 'guardian', 'student', 'doctor', 'nurse', 'other']
  },
  complaints: String,
  details: String,
  treatmentGiven: String
}, { timestamps: true });

// Appointment Schema
const AppointmentSchema = new Schema({
  memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
  navigatorId: { type: Schema.Types.ObjectId, ref: 'Navigator' },
  appointmentDateTime: Date,
  status: {
    type: String,
    enum: ['pending', 'ongoing', 'cancelled', 'completed']
  },
  appointmentType: {
    type: String,
    enum: ['online', 'offline']
  },
  additionalInfo: String,
  notes: String,
  prescription: {
    chiefComplaints: String,
    allergies: String,
    history: String,
    diagnosis: String,
    medicines: [{
      name: String,
      dosage: String,
      frequency: String,
      duration: String,
      investigations: String,
      treatmentPlan: String
    }],
    additionalInstructions: String
  }
}, { timestamps: true });

// Product Schema
const ProductSchema = new Schema({
  name: { type: String, required: true },
  category: String,
  mrp: Number,
  discountInPercentage: Number,
  sellingPrice: Number,
  description: String,
  stock: Number,
  images: [String]
}, { timestamps: true });

// Blog Schema
const BlogSchema = new Schema({
  title: { type: String, required: true },
  content: String,
  author: {
    type: {
      type: String,
      enum: ['admin', 'navigator', 'doctor', 'empanelled_doctor', 'member', 'student', 'nurse']
    },
    name: String
  },
  featuredImage: String,
  readTimeMins: Number,
  category: String,
  tags: [String],
  publishDate: Date,
  status: {
    type: String,
    enum: ['draft', 'published']
  }
}, { timestamps: true });

// Order Schema
const OrderSchema = new Schema({
  memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  items: [{
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,
    price: Number
  }],
  totalAmount: Number,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
  },
  shippingAddress: String,
  paymentDetails: {
    method: String,
    transactionId: String,
    status: String
  },
  orderDate: Date,
  deliveryDate: Date
}, { timestamps: true });

// Notification Schema
const NotificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true },
  title: String,
  message: String,
  type: String,
  relatedId: Schema.Types.ObjectId,
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

// Subscription Plan Schema
const SubscriptionPlanSchema = new Schema({
  name: { type: String, required: true },
  code: {
    type: String,
    enum: ['BASE_PLAN', 'STUDENT_PLAN', 'PREMIUM_PLAN'],
    required: true
  },
  description: String,
  price: Number,
  duration: {
    value: Number,
    unit: {
      type: String,
      enum: ['days', 'months', 'years']
    }
  },
  features: [{
    name: String,
    description: String,
    limit: Number
  }],
  benefits: [String],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Addon Schema
const AddonSchema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  description: String,
  price: Number,
  duration: {
    value: Number,
    unit: {
      type: String,
      enum: ['days', 'months', 'years']
    }
  },
  compatiblePlans: [{
    type: String,
    enum: ['BASE_PLAN', 'STUDENT_PLAN', 'PREMIUM_PLAN']
  }],
  features: [{
    name: String,
    description: String,
    limit: Number
  }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Export all models
module.exports = {
  AuthCredential: mongoose.model('AuthCredential', AuthCredentialSchema),
  Admin: mongoose.model('Admin', AdminSchema),
  Navigator: mongoose.model('Navigator', NavigatorSchema),
  Nurse: mongoose.model('Nurse', NurseSchema),
  Doctor: mongoose.model('Doctor', DoctorSchema),
  EmpanelledDoctor: mongoose.model('EmpanelledDoctor', EmpanelledDoctorSchema),
  HealthcareProvider: mongoose.model('HealthcareProvider', HealthcareProviderSchema),
  Member: mongoose.model('Member', MemberSchema),
  MedicalHistory: mongoose.model('MedicalHistory', MedicalHistorySchema),
  School: mongoose.model('School', SchoolSchema),
  Assessment: mongoose.model('Assessment', AssessmentSchema),
  Infirmary: mongoose.model('Infirmary', InfirmarySchema),
  Appointment: mongoose.model('Appointment', AppointmentSchema),
  Product: mongoose.model('Product', ProductSchema),
  Blog: mongoose.model('Blog', BlogSchema),
  Order: mongoose.model('Order', OrderSchema),
  Notification: mongoose.model('Notification', NotificationSchema),
  SubscriptionPlan: mongoose.model('SubscriptionPlan', SubscriptionPlanSchema),
  Addon: mongoose.model('Addon', AddonSchema)
}; 