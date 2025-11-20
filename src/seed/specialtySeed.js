// admin-backend-main/src/seed/specialtySeed.js
const mongoose = require('mongoose');
const Specialty = require('../models/Specialty');
const SubSpecialty = require('../models/SubSpecialty');

const DATA = {
  Cardiology: ['Interventional Cardiology','Non-Invasive Cardiology','Pediatric Cardiology','Electrophysiology'],
  Neurology: ['Stroke Specialist','Epileptologist','Neurocritical Care'],
  Orthopedics: ['Joint Replacement','Spine Surgery','Sports Injury'],
  Dermatology: ['Acne Treatment','Laser Procedures','Cosmetic Dermatology'],
  Pediatrics: ['Child Consultation','Vaccination','Neonatology']
};

mongoose.connect('mongodb://127.0.0.1:27017/assisthealth', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('Connected. Seeding specialties...');
    for (const [spec, subs] of Object.entries(DATA)) {
      let sp = await Specialty.findOne({ name: spec });
      if (!sp) sp = await Specialty.create({ name: spec });
      console.log('✔ Specialty:', sp.name);

      for (const sub of subs) {
        const exists = await SubSpecialty.findOne({ name: sub, specialtyId: sp._id });
        if (!exists) {
          await SubSpecialty.create({ name: sub, specialtyId: sp._id });
          console.log('   → SubSpecialty added:', sub);
        } else {
          console.log('   → SubSpecialty exists:', sub);
        }
      }
    }
    console.log('Seeding completed.');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
