// Import all models
const AuthCredential = require('./auth-credential.model');
const Admin = require('./admin.model');
const Navigator = require('./navigator.model');
const Nurse = require('./nurse.model');
const Doctor = require('./doctor.model');
const EmpanelledDoctor = require('./empanelled-doctor.model');
const HealthcareProvider = require('./healthcare-provider.model');
const Member = require('./member.model');
const MedicalHistory = require('./medical-history.model');
const School = require('./school.model');
const Assessment = require('./assessment.model');
const Infirmary = require('./infirmary.model');
const Appointment = require('./appointment.model');
const Product = require('./product.model');
const Blog = require('./blog.model');
const Order = require('./order.model');
const Notification = require('./notification.model');
const Inventory = require('./inventory.model');
const Package = require('./packages.model');
const Setting = require('./Settings');
const Subscription = require('./subscription.model');
const Transaction = require('./transaction.model');

// Export all models
module.exports = {
  AuthCredential,
  Admin,
  Navigator,
  Nurse,
  Doctor,
  EmpanelledDoctor,
  HealthcareProvider,
  Member,
  MedicalHistory,
  School,
  Assessment,
  Infirmary,
  Appointment,
  Product,
  Blog,
  Order,
  Notification,
  Inventory,
  Package,
  Setting,
  Subscription,
  Transaction
}; 