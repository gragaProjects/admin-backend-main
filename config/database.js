const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(`mongodb+srv://developer:fY1M9JnsW9wtErRZ@assisthealth.lo9s6km.mongodb.net/production?retryWrites=true&w=majority&appName=assisthealth`);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB; 