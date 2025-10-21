const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

// Import models
const Member = require('../src/models/member.model');
const MedicalHistory = require('../src/models/medical-history.model');
const { logger } = require('../src/utils/logger');

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://digitalconquest:UDlofuJT1YsAwO7P@assisthealth-cluster.wam0sh4.mongodb.net/production';

// Valid enum values from schema
const RELATIONSHIP_ENUM = ['father', 'mother', 'sibling', 'grandparent', 'other'];
const STATUS_ENUM = ['active', 'resolved', 'inremission', 'chronic'];
const LIFESTYLE_ENUM = ['never', 'occasional', 'daily'];

// Helper function to validate and default enum values
function validateEnum(value, enumValues, defaultValue) {
    if (!value) return defaultValue;
    const normalized = value.toLowerCase().trim();
    return enumValues.includes(normalized) ? normalized : defaultValue;
}

// Helper function to parse date
function parseDate(dateStr) {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
}

async function connectToDatabase() {
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to Database successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

// Function to clear medical history collection
async function clearMedicalHistory() {
    try {
        const result = await MedicalHistory.deleteMany({});
        console.log(`Cleared ${result.deletedCount} medical history records`);
    } catch (error) {
        console.error('Error clearing medical history:', error);
        throw error;
    }
}

// Cache for member mapping
const memberCache = new Map();

async function findMemberInMongoDB(oldMemberId, members) {
    try {
        // Check cache first
        if (memberCache.has(oldMemberId)) {
            return memberCache.get(oldMemberId);
        }

        // Find member details from convert.json members array
        const memberData = members.find(m => m.id.toString() === oldMemberId.toString());
        
        if (!memberData) {
            console.log(`Member not found in convert.json for id: ${oldMemberId}`);
            return null;
        }

        // Find member in MongoDB using unique identifiers
        const mongoMember = await Member.findOne({
            $or: [
                { 'additionalInfo.oldMemberId': memberData.member_id },
                { email: memberData.email },
                { 
                    $and: [
                        { name: memberData.name },
                        { phone: memberData.number }
                    ]
                }
            ]
        });

        if (!mongoMember) {
            console.log(`Member not found in MongoDB for convert.json id: ${oldMemberId}, name: ${memberData.name}`);
            return null;
        }

        // Cache the result
        memberCache.set(oldMemberId, mongoMember);
        return mongoMember;

    } catch (error) {
        console.error(`Error finding member ${oldMemberId}:`, error);
        return null;
    }
}

async function createOrUpdateMedicalHistory(memberId, data) {
    try {
        let medicalHistory = await MedicalHistory.findOne({ memberId });
        
        if (!medicalHistory) {
            medicalHistory = new MedicalHistory({ 
                memberId,
                medicalReports: [],
                treatingDoctors: [],
                followUps: [],
                familyHistory: [],
                allergies: [],
                currentMedications: [],
                surgeries: [],
                previousMedicalConditions: [],
                immunizations: [],
                medicalTestResults: [],
                currentSymptoms: [],
                lifestyleHabits: {
                    smoking: 'never',
                    alcoholConsumption: 'never',
                    exercise: 'never'
                },
                healthInsurance: []
            });
        }

        // Update medical history with data
        if (data.allergies) {
            const formattedAllergies = data.allergies.map(a => ({
                medications: a.medications || '',
                food: a.food || '',
                other: a.other || ''
            }));
            medicalHistory.allergies.push(...formattedAllergies);
        }

        if (data.currentMedications) {
            const formattedMedications = data.currentMedications.map(m => ({
                name: m.name || '',
                dosage: m.dosage || '',
                frequency: m.frequency || ''
            }));
            medicalHistory.currentMedications.push(...formattedMedications);
        }

        if (data.currentSymptoms) {
            const formattedSymptoms = data.currentSymptoms.map(s => ({
                symptom: s.symptom || '',
                concerns: s.concerns || ''
            }));
            medicalHistory.currentSymptoms.push(...formattedSymptoms);
        }

        if (data.familyHistory) {
            const formattedHistory = data.familyHistory.map(h => ({
                condition: h.condition || '',
                relationship: validateEnum(h.relationship, RELATIONSHIP_ENUM, 'other')
            }));
            medicalHistory.familyHistory.push(...formattedHistory);
        }

        if (data.immunizations) {
            const formattedImmunizations = data.immunizations.map(i => ({
                vaccine: i.vaccine || '',
                date: parseDate(i.date)
            }));
            medicalHistory.immunizations.push(...formattedImmunizations);
        }

        if (data.previousMedicalConditions) {
            const formattedConditions = data.previousMedicalConditions.map(c => ({
                condition: c.condition || '',
                diagnosedAt: parseDate(c.diagnosed_at),
                treatmentReceived: c.treatment_received || '',
                notes: c.notes || '',
                status: validateEnum(c.status, STATUS_ENUM, 'active')
            }));
            medicalHistory.previousMedicalConditions.push(...formattedConditions);
        }

        if (data.medicalTestResults) {
            const formattedTests = data.medicalTestResults.map(t => ({
                name: t.name || '',
                date: parseDate(t.date),
                results: t.results || ''
            }));
            medicalHistory.medicalTestResults.push(...formattedTests);
        }

        if (data.treatingDoctors) {
            const formattedDoctors = data.treatingDoctors.map(d => ({
                name: d.name || '',
                hospitalName: d.hospital || '',
                speciality: d.speciality || ''
            }));
            medicalHistory.treatingDoctors.push(...formattedDoctors);
        }

        if (data.lifestyleHabits) {
            medicalHistory.lifestyleHabits = {
                smoking: validateEnum(data.lifestyleHabits.smoking, LIFESTYLE_ENUM, 'never'),
                alcoholConsumption: validateEnum(data.lifestyleHabits.alcohol, LIFESTYLE_ENUM, 'never'),
                exercise: validateEnum(data.lifestyleHabits.exercise, LIFESTYLE_ENUM, 'never')
            };
        }

        await medicalHistory.save();
        console.log(`Medical history updated for member ${memberId}`);
    } catch (error) {
        console.error(`Error updating medical history for member ${memberId}:`, error);
    }
}

async function processMedicalHistoryData() {
    try {
        // Read convert.json file
        const jsonData = JSON.parse(await fs.readFile(path.join(__dirname, 'convert.json'), 'utf8'));

        // Get members array from convert.json
        const members = jsonData.members || [];
        
        // Arrays to process
        const {
            allergies = [],
            current_medication = [],
            current_symptoms_concerns = [],
            family_medical_history = [],
            immunization_history = [],
            medical_history = [],
            previous_medical_conditions = [],
            test_results = [],
            consultations_1 = [] // Added treating doctors array
        } = jsonData;

        // Process each member's medical history
        const processedMembers = new Set();

        // Process allergies
        for (const allergy of allergies) {
            if (!allergy.is_active) continue;
            
            const member = await findMemberInMongoDB(allergy.member_id, members);
            if (member) {
                await createOrUpdateMedicalHistory(member._id, {
                    allergies: [{
                        medications: allergy.medications || '',
                        food: allergy.food || '',
                        other: allergy.other || ''
                    }]
                });
                processedMembers.add(member._id.toString());
            }
        }

        // Process current medications
        for (const medication of current_medication) {
            if (!medication.is_active) continue;
            
            const member = await findMemberInMongoDB(medication.member_id, members);
            if (member) {
                await createOrUpdateMedicalHistory(member._id, {
                    currentMedications: [{
                        name: medication.name || '',
                        dosage: medication.dosage || '',
                        frequency: medication.frequency || ''
                    }]
                });
                processedMembers.add(member._id.toString());
            }
        }

        // Process current symptoms
        for (const symptom of current_symptoms_concerns) {
            if (!symptom.is_active) continue;
            
            const member = await findMemberInMongoDB(symptom.member_id, members);
            if (member) {
                await createOrUpdateMedicalHistory(member._id, {
                    currentSymptoms: [{
                        symptom: symptom.symptom || '',
                        concerns: symptom.concerns || ''
                    }]
                });
                processedMembers.add(member._id.toString());
            }
        }

        // Process family history
        for (const history of family_medical_history) {
            if (!history.is_active) continue;
            
            const member = await findMemberInMongoDB(history.member_id, members);
            if (member) {
                await createOrUpdateMedicalHistory(member._id, {
                    familyHistory: [{
                        condition: history.condition || '',
                        relationship: validateEnum(history.relationship, RELATIONSHIP_ENUM, 'other')
                    }]
                });
                processedMembers.add(member._id.toString());
            }
        }

        // Process immunizations
        for (const immunization of immunization_history) {
            if (!immunization.is_active) continue;
            
            const member = await findMemberInMongoDB(immunization.member_id, members);
            if (member) {
                await createOrUpdateMedicalHistory(member._id, {
                    immunizations: [{
                        vaccine: immunization.vaccine || '',
                        date: parseDate(immunization.date)
                    }]
                });
                processedMembers.add(member._id.toString());
            }
        }

        // Process previous medical conditions
        for (const condition of previous_medical_conditions) {
            if (!condition.is_active) continue;
            
            const member = await findMemberInMongoDB(condition.member_id, members);
            if (member) {
                await createOrUpdateMedicalHistory(member._id, {
                    previousMedicalConditions: [{
                        condition: condition.condition || '',
                        diagnosedAt: parseDate(condition.diagnosed_at),
                        treatmentReceived: condition.treatment_received || '',
                        notes: condition.notes || '',
                        status: validateEnum(condition.status, STATUS_ENUM, 'active')
                    }]
                });
                processedMembers.add(member._id.toString());
            }
        }

        // Process test results
        for (const test of test_results) {
            if (!test.is_active) continue;
            
            const member = await findMemberInMongoDB(test.member_id, members);
            if (member) {
                await createOrUpdateMedicalHistory(member._id, {
                    medicalTestResults: [{
                        name: test.name || '',
                        date: parseDate(test.date),
                        results: test.results || ''
                    }]
                });
                processedMembers.add(member._id.toString());
            }
        }

        // Process treating doctors from consultations
        for (const consultation of consultations_1) {
            if (!consultation.is_active) continue;
            
            const member = await findMemberInMongoDB(consultation.member_id, members);
            if (member) {
                await createOrUpdateMedicalHistory(member._id, {
                    treatingDoctors: [{
                        name: consultation.treating_doctor || '',
                        hospitalName: consultation.hospital || '',
                        speciality: consultation.speciality || ''
                    }]
                });
                processedMembers.add(member._id.toString());
            }
        }

        // Process lifestyle habits from medical history
        for (const history of medical_history) {
            if (!history.is_active) continue;
            
            const member = await findMemberInMongoDB(history.member_id, members);
            if (member) {
                await createOrUpdateMedicalHistory(member._id, {
                    lifestyleHabits: {
                        smoking: validateEnum(history.smoking, LIFESTYLE_ENUM, 'never'),
                        alcoholConsumption: validateEnum(history.alcohol, LIFESTYLE_ENUM, 'never'),
                        exercise: validateEnum(history.exercise_habits, LIFESTYLE_ENUM, 'never')
                    }
                });
                processedMembers.add(member._id.toString());
            }
        }

        console.log(`Processed medical history for ${processedMembers.size} members`);
        
    } catch (error) {
        console.error('Error processing medical history data:', error);
    }
}

// Update the script execution to clear data first
connectToDatabase()
    .then(async () => {
        console.log('Starting medical history bulk insert process...');
        
        // First clear existing medical history
        await clearMedicalHistory();
        
        // Then process new data
        await processMedicalHistoryData();
        
        console.log('Medical history bulk insert completed');
    })
    .catch(error => {
        console.error('Error running script:', error);
    })
    .finally(() => {
        mongoose.disconnect();
        console.log('Database connection closed');
    });