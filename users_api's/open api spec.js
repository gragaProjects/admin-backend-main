const mongoose = require('mongoose');
const { Schema } = mongoose;

const addressSchema = new Schema({
  description: String,
  landmark: String,
  pinCode: String,
  region: String,
  state: String,
  country: String,
  location: {
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 }
  }
});

const timeSlotSchema = new Schema({
  day: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  },
  slots: [String]
});


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

const AdminSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    dob: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    profilePic: String,
    role: { type: String, default: 'admin' },
    permissions: [{
      type: String,
      enum: [
        'manage_users',
        'manage_doctors',
        'manage_nurses',
        'manage_navigators',
        'manage_members',
        'manage_schools',
        'manage_products',
        'manage_orders',
        'manage_subscriptions',
        'manage_content',
        'view_reports',
        'manage_settings'
      ]
    }],
    lastLogin: Date,
    isActive: { type: Boolean, default: true }
  }, { timestamps: true });

  const AppointmentSchema = new Schema({
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    navigatorId: { type: Schema.Types.ObjectId, ref: 'Navigator' },
    appointedBy: { type: Schema.Types.ObjectId, ref: 'User' },
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

  const AssessmentSchema = new Schema({
    studentId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
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

  const DoctorSchema = new Schema({
    doctorId: { 
      type: String, 
      unique: true 
    },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    profilePic: String,
    digitalSignature: String,
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    specializations: [String],
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
    offlineAddress: addressSchema,
    areas: [{
      pincode: String,
      region: String
    }],
    navigatorAssigned: { type: Boolean, default: false },
    navigatorId: { type: Schema.Types.ObjectId, ref: 'Navigator' },
    role: { type: String, default: 'doctor' },
    total_assigned_members: { type: Number, default: 0 },
    rating: { type: Number, default: 0 }
  }, { timestamps: true });

  const workplaceSchema = new Schema({
    providerId: { 
      type: Schema.Types.ObjectId, 
      ref: 'HealthcareProvider',
      required: true 
    },
    type: { 
      type: String,
      enum: ['hospital', 'clinic', 'diagnostic_center', 'pharmacy', 'nursing_home'],
      required: true 
    },
    name: { 
      type: String,
      required: true 
    },
    timeSlots: [timeSlotSchema],
    consultationFees: { 
      type: Number,
      required: true 
    }
  });
  
  const EmpanelledDoctorSchema = new Schema({
    empanelledDoctorId: { 
      type: String, 
      required: true, 
      unique: true
    },
    profilePic: String,
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    qualification: [String],
    experienceInYrs: Number,
    // medicalCouncilRegistrationNumber: { type: String },
    // languagesSpoken: [String],
    // serviceTypes: [String],
    speciality: String,
    specializedIn: String,
    workplaces: [workplaceSchema],
    average_consultation_fees: {
      type: Number,
      default: 0,
      set: function(v) {
        if (!this.workplaces || this.workplaces.length === 0) return 0;
        const total = this.workplaces.reduce((sum, workplace) => sum + workplace.consultationFees, 0);
        return total / this.workplaces.length;
      }
    },
    role: { type: String, default: 'empanelled_doctor' },
    rating: { type: Number, default: 0 }
  }, { timestamps: true });

  const HealthcareProviderSchema = new Schema({
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['hospital', 'clinic', 'diagnostic_center', 'pharmacy', 'nursing_home']
    },
    profilePic: String,
    address: addressSchema,
    contactNumber: String,
    email: String,
    website: String,
    servicesOffered: [String],
    operationHours: [timeSlotSchema]
  }, { timestamps: true });

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
    treatmentGiven: String,
    medicineProvided: {
      inventoryId: { type: Schema.Types.ObjectId, ref: 'Inventory' },
      quantity: Number
    }
  }, { timestamps: true });


  const inventorySchema = new mongoose.Schema({
    category: {
      type: String,
      required: true
    },
    item_name: {
      type: String,
      required: true
    },
    current_stock: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      required: true
    },
    minimum_stock: {
      type: Number,
      required: true
    },
    maximum_stock: {
      type: Number,
      required: true
    },
    expiry_date: {
      type: Date,
      required: true
    }
  }, {
    timestamps: true
  });
  

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
      type: String,
      description: String
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
  

  const MemberSchema = new Schema({
    memberId: { 
      type: String, 
      unique: true
    },
    profilePic: String,
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
    bloodGroup: String,
    heightInFt: Number,
    weightInKg: Number,
    emergencyContact: {
      name: String,
      relation: { type: String, enum: ['father', 'mother', 'guardian', 'spouse', 'other', 'son', 'daughter'] },
      phone: String
    },
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
    additionalInfo: String,
    subscriptions: [{
      planType: String,
      startDate: Date,
      endDate: Date,
      status: String
    }],
    addons: [String],
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
    }
  }, { timestamps: true });
  

  const NavigatorSchema = new Schema({
    navigatorId: { 
      type: String, 
      unique: true 
    },
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
    rating: { type: Number, default: 0 }
  }, { timestamps: true });


  const NotificationSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, required: true },
    title: String,
    message: String,
    type: String,
    relatedId: Schema.Types.ObjectId,
    isRead: { type: Boolean, default: false }
  }, { timestamps: true });

  const NurseSchema = new Schema({
    nurseId: { 
      type: String, 
      unique: true 
    },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    dob: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    profilePic: String,
    schoolAssigned: { type: Boolean, default: false },
    schoolId: { type: String, ref: 'School' },
    role: { type: String, default: 'nurse' },
    languagesSpoken: [String],
    introduction: String
  }, { timestamps: true });
  

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

  const SchoolSchema = new Schema({
    schoolId: { 
      type: String, 
      unique: true 
    },
    name: { type: String, required: true },
    logo: { type: String },
    description: String,
    address: addressSchema,
    contactNumber: String,
    email: String,
    website: String,
    grades: [{
      class: { type: String, enum: ['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'] },
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

  const settingsSchema = new Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    value: {
        type: Schema.Types.Mixed  // Can store any type of data
    },
    category: {
        type: String,
        default: 'general'
    },
    description: {
        type: String
    }
}, {
    timestamps: true,
    strict: false  // Allows for flexible document structure
});

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
  