const { Member, AuthCredential, Doctor, Nurse, Navigator, MedicalHistory } = require('../models/index');
const { logger } = require('../utils/logger');
const csv = require('csv-parse');
const fs = require('fs');
const emailService = require('../utils/email');
const mongoose = require('mongoose');
const path = require('path');
const pdfService = require('../utils/pdfService');

class MemberController {
  /**
   * Create new member
   */
  async createMember(req, res) {
    try {
      const {
        name,
        email,
        phone,
        dob,
        gender,
        profilePic,
        AHIdentityCard,
        emergencyContact,
        bloodGroup,
        heightInFt,
        weightInKg,
        additionalInfo,
        address,
        employmentStatus,
        educationLevel,
        maritalStatus,
        subscriptions,
        addons,
        isStudent,
        studentDetails,
        isSubprofile,
        primaryMemberId,
        active,
        onBoarded,
        termsConditionsAccepted,
        isMember
      } = req.body;

      // Check if member already exists
      /*const existingMember = await Member.findOne({
        $or: [
          ...(email ? [{ email }] : []),
          { phone }
        ]
      });

      if (existingMember) {
        return res.status(400).json({
          status: 'error',
          message: 'Member already exists with this email or phone'
        });
      }*/

      // Validate subprofile
      if (isSubprofile && !primaryMemberId) {
        return res.status(400).json({
          status: 'error',
          message: 'Primary member ID is required for subprofiles'
        });
      }

      // Validate student details
      if (isStudent && !studentDetails) {
        return res.status(400).json({
          status: 'error',
          message: 'Student details are required for student members'
        });
      }

      // Create member
      const member = new Member({
        name,
        email,
        phone,
        dob,
        gender,
        profilePic,
        AHIdentityCard,
        emergencyContact,
        bloodGroup,
        heightInFt,
        weightInKg,
        additionalInfo,
        address,
        employmentStatus,
        educationLevel,
        maritalStatus,
        subscriptions,
        addons,
        isStudent,
        studentDetails,
        isSubprofile,
        primaryMemberId,
        active,
        onBoarded,
        termsConditionsAccepted,
        isMember: true,
        membershipStatus: {
          isRegistered: true,
          registrationDate: Date.now(),
          hasOneTimeRegistrationDiscount: false,
          premiumMembership: {
            isActive: true,
            startDate: Date.now(),
            expiryDate: Date.now() + (365.25 * 24 * 60 * 60 * 1000), // Account for leap years
            renewalCount: 0
          }
        }
      });

      // Save the member to trigger the pre-save middleware
      await member.save();

      // If this is a subprofile, update the primary member's subprofileIds
      if (isSubprofile && primaryMemberId) {
        await Member.findByIdAndUpdate(
          primaryMemberId,
          { $push: { subprofileIds: member._id } }
        );
      }

      // Create medical history for the member
      await MedicalHistory.create({
        memberId: member._id,
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
        lifestyleHabits: {},
        healthInsurance: []
      });
      console.log('Medical history created for member:', member._id);

      //create a auth credential for the navigator
      const authCredential = await AuthCredential.create({
        userId: member._id,
        email,
        phoneNumber: phone,
        phone,
        password: null,
        userType: 'member',
        memberId: member.memberId,
        temporaryPassword: {
          password: null,
          expiresAt: null
        },
        isFirstLogin: false,
        passwordResetRequired: true
      });

      await authCredential.save();

      //send a welcome email to the member
      const toObj = {
        name: name,
        email: email
       }
       emailService.sendEmail('welcome', toObj,{
        number:phone,
        name:name
       });

      res.status(201).json({
        status: 'success',
        data: member
      });
    } catch (error) {
      logger.error('Create member error:', error);
      
      // More specific error handling
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          status: 'error',
          message: 'Validation error',
          details: Object.values(error.errors).map(err => err.message)
        });
      }
      
      res.status(500).json({
        status: 'error',
        message: 'Error creating member',
        details: error.message
      });
    }
  }

  /**
   * Get all members with filters
   */
  async getAllMembers(req, res) {
    try {
      const {
        page = 1,
        limit = 300,
        search,
        isStudent,
        isSubprofile,
        primaryMemberId,
        schoolId,
        navigatorId,
        doctorId,
        nurseId,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        grade,
        section
      } = req.query;

      const query = {
        $or: [
          { isMember: true },
          { $and: [{ isMember: false }, { isSubprofile: true }] }
        ],
        active: true
      };

      // Add date range filter
      if (startDate || endDate) {
        query.createdAt = {};
        
        if (startDate) {
          query.createdAt.$gte = new Date(startDate);
        }
        
        if (endDate) {
          // Add one day to endDate to include the entire end date
          const endDateTime = new Date(endDate);
          endDateTime.setDate(endDateTime.getDate() + 1);
          query.createdAt.$lte = endDateTime;
        }
      }

      // Search by name, email, phone, or memberId
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { memberId: { $regex: search, $options: 'i' } }
        ];
      }

      // Handle navigator assignment filter
      if (navigatorId) {
        if (navigatorId === 'NOT_ASSIGNED') {
          query.$or = query.$or || [];
          query.$or.push(
            { 'healthcareTeam.navigator': { $exists: false } },
            { 'healthcareTeam.navigator': null },
            { 'healthcareTeam.navigator._id': { $exists: false } }
          );
        } else {
          query['healthcareTeam.navigator._id'] = new mongoose.Types.ObjectId(navigatorId);
        }
      }

      // Handle doctor assignment filter
      if (doctorId) {
        if (doctorId === 'NOT_ASSIGNED') {
          query.$or = query.$or || [];
          query.$or.push(
            { 'healthcareTeam.doctor': { $exists: false } },
            { 'healthcareTeam.doctor': null },
            { 'healthcareTeam.doctor._id': { $exists: false } }
          );
        } else {
          query['healthcareTeam.doctor._id'] = new mongoose.Types.ObjectId(doctorId);
        }
      }

      // Handle nurse assignment filter
      if (nurseId) {
        if (nurseId === 'NOT_ASSIGNED') {
          query.$or = query.$or || [];
          query.$or.push(
            { 'healthcareTeam.nurse': { $exists: false } },
            { 'healthcareTeam.nurse': null },
            { 'healthcareTeam.nurse._id': { $exists: false } }
          );
        } else {
          query['healthcareTeam.nurse._id'] = new mongoose.Types.ObjectId(nurseId);
        }
      }

      // Rest of the filters remain unchanged
      if (isStudent !== undefined) {
        query.isStudent = isStudent === 'true';
      }

      if (isSubprofile !== undefined) {
        query.isSubprofile = isSubprofile === 'true';
      }

      if (primaryMemberId) {
        query.primaryMemberId = primaryMemberId;
      }

      if (schoolId) {
        query['studentDetails.schoolId'] = schoolId;
      }

      // Add grade filter for students
      if (grade) {
        query['studentDetails.grade'] = grade;
      }

      // Add section filter for students
      if (section) {
        query['studentDetails.section'] = section;
      }

      const members = await Member.find(query)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate('healthcareTeam.doctor._id', 'name email phone qualification doctorId profilePic')
        .populate('healthcareTeam.nurse._id', 'name email phone nurseId profilePic')
        .populate('healthcareTeam.navigator._id', 'name email phone navigatorId profilePic')
        .populate('primaryMemberId', 'name memberId')
        .populate('subprofileIds', 'name memberId');

      const total = await Member.countDocuments(query);

      res.json({
        status: 'success',
        data: members,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      logger.error('Get all members error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error fetching members'
      });
    }
  }

  /**
   * Get member by ID
   */
  async getMember(req, res) {
    try {
      const member = await Member.findById(req.params.id)
        .populate('healthcareTeam.doctor._id', 'name email phone qualification doctorId profilePic')
        .populate('healthcareTeam.nurse._id', 'name email phone nurseId profilePic')
        .populate('healthcareTeam.navigator._id', 'name email phone navigatorId profilePic')
        .populate('primaryMemberId', 'name memberId')
        .populate('subprofileIds', 'name memberId');

      if (!member) {
        return res.status(404).json({
          status: 'error',
          message: 'Member not found'
        });
      }

      res.json({
        status: 'success',
        data: member
      });
    } catch (error) {
      logger.error('Get member error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error fetching member'
      });
    }
  }

  /**
   * Update member
   */
  async updateMember(req, res) {
    try {
      const {
        name,
        email,
        phone,
        dob,
        gender,
        profilePic,
        AHIdentityCard,
        emergencyContact,
        bloodGroup,
        heightInFt,
        weightInKg,
        additionalInfo,
        address,
        employmentStatus,
        educationLevel,
        maritalStatus,
        subscriptions,
        addons,
        isStudent,
        studentDetails,
        active,
        primaryMemberId
      } = req.body;

      const member = await Member.findById(req.params.id);

      if (!member) {
        return res.status(404).json({
          status: 'error',
          message: 'Member not found'
        });
      }

      // Validate student details if changing isStudent
      if (isStudent && !studentDetails && !member.studentDetails) {
        return res.status(400).json({
          status: 'error',
          message: 'Student details are required when converting to student member'
        });
      }

      let primaryMember = null;
      if(primaryMemberId && primaryMemberId._id){
        primaryMember = await Member.findById(primaryMemberId._id);
        if(!primaryMember){
          return res.status(400).json({
            status: 'error',
            message: 'Primary member not found'
          });
        }
        //remove from the primary member's subprofileIds
        const index = Member.findOne({subprofileIds: {$in: [new mongoose.Types.ObjectId(member._id) ]}})
        if(index.length > 0){
          index.subprofileIds = index.subprofileIds.filter(id => id.toString() !== member._id);
          await index.save();
        }
        //add the member to the primary member's subprofileIds
        primaryMember.subprofileIds.push(new mongoose.Types.ObjectId(member._id));
        await primaryMember.save();
      }
      const updatedMember = await Member.findByIdAndUpdate(
        req.params.id,
        {
          ...(name && { name }),
          ...(primaryMember && { primaryMemberId: new mongoose.Types.ObjectId(primaryMember._id) }),
          ...(email && { email }),
          ...(phone && { phone }),
          ...(dob && { dob }),
          ...(gender && { gender }),
          ...(profilePic && { profilePic }),
          ...(AHIdentityCard && { AHIdentityCard }),
          ...(emergencyContact && { emergencyContact }),
          ...(bloodGroup && { bloodGroup }),
          ...(heightInFt && { heightInFt }),
          ...(weightInKg && { weightInKg }),
          ...(additionalInfo && { additionalInfo }),
          ...(address && { address }),
          ...(employmentStatus && { employmentStatus }),
          ...(educationLevel && { educationLevel }),
          ...(maritalStatus && { maritalStatus }),
          ...(subscriptions && { subscriptions }),
          ...(addons && { addons }),
          ...(typeof isStudent !== 'undefined' && { isStudent }),
          ...(studentDetails && { studentDetails }),
          ...(typeof active !== 'undefined' && { active })
        },
        { new: true, runValidators: true }
      );

      res.json({
        status: 'success',
        data: updatedMember
      });
    } catch (error) {
      logger.error('Update member error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error updating member',
        details: error.message
      });
    }
  }

  /**
   * Assign healthcare team
   */
  async assignHealthcareTeam(req, res) {
    try {
      const { doctorId, nurseId, navigatorId } = req.body;
      const memberId = req.params.id;

      const member = await Member.findById(memberId);
      if (!member) {
        return res.status(404).json({
          status: 'error',
          message: 'Member not found'
        });
      }

      // Validate and update doctor
      if (doctorId) {
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
          return res.status(404).json({
            status: 'error',
            message: 'Doctor not found'
          });
        }
        member.healthcareTeam.doctor = {
          _id: doctorId,
          name: doctor.name,
          assignedDate: new Date()
        };

        // Save member first to ensure the new assignment is counted
        await member.save();
        
        // Update total_assigned_members count for doctor
        const totalDoctorMembers = await Member.countDocuments({
          'healthcareTeam.doctor._id': new mongoose.Types.ObjectId(doctorId)
        });
        
        await Doctor.findByIdAndUpdate(doctorId, {
          total_assigned_members: totalDoctorMembers
        });
      }

      // Validate and update nurse
      if (nurseId) {
        const nurse = await Nurse.findById(nurseId);
        if (!nurse) {
          return res.status(404).json({
            status: 'error',
            message: 'Nurse not found'
          });
        }
        member.healthcareTeam.nurse = {
          _id: nurseId,
          name: nurse.name,
          assignedDate: new Date()
        };
      }

      // Validate and update navigator
      if (navigatorId) {
        const navigator = await Navigator.findById(navigatorId);
        if (!navigator) {
          return res.status(404).json({
            status: 'error',
            message: 'Navigator not found'
          });
        }
        member.healthcareTeam.navigator = {
          _id: navigatorId,
          name: navigator.name,
          assignedDate: new Date()
        };

        // Save member first to ensure the new assignment is counted
        await member.save();
        
        // Update total_assigned_members count for navigator
        const totalNavigatorMembers = await Member.countDocuments({
          'healthcareTeam.navigator._id': new mongoose.Types.ObjectId(navigatorId)
        });
        
        await Navigator.findByIdAndUpdate(navigatorId, {
          total_assigned_members: totalNavigatorMembers
        });
      }

      if (!doctorId && !navigatorId) {
        await member.save();
      }

      res.json({
        status: 'success',
        data: member
      });
    } catch (error) {
      logger.error('Assign healthcare team error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error assigning healthcare team'
      });
    }
  }

  async deleteMember(req, res) {
    try {
      const member = await Member.findById(req.params.id);
      
      if (!member) {
        return res.status(404).json({
          status: 'error',
          message: 'Member not found'
        });
      }

      await Member.findByIdAndDelete(req.params.id);
      res.json({ status: 'success', message: 'Member deleted successfully' });
    } catch (error) {
      logger.error('Delete member error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error deleting member',
        details: error.message
      });
    }
  }
  
  async assignNavigator(req, res) {
    try {
      const { memberIds, navigatorId } = req.body;
      
      // Validate memberIds and navigatorId
      if (!Array.isArray(memberIds) || !memberIds.length) {
        return res.status(400).json({
          status: 'error',
          message: 'Member IDs are required'
        });
      }

      if (!navigatorId) {
        return res.status(400).json({
          status: 'error',
          message: 'Navigator ID is required'
        });
      }

      const navigator = await Navigator.findById(navigatorId);
      if (!navigator) {
        return res.status(404).json({
          status: 'error',
          message: 'Navigator not found'
        });
      }

      const members = await Member.find({ _id: { $in: memberIds } });
      if (members.length !== memberIds.length) {
        return res.status(404).json({
          status: 'error',
          message: 'One or more members not found'
        });
      }

      for (const member of members) {
        member.healthcareTeam.navigator = {
          _id: new mongoose.Types.ObjectId(navigatorId),
          name: navigator.name,
          assignedDate: new Date()
        };
        await member.save();
      }

      // Update total_assigned_members count
      const totalMembers = await Member.countDocuments({
        'healthcareTeam.navigator._id': new mongoose.Types.ObjectId(navigatorId)
      });
      
      await Navigator.findByIdAndUpdate(navigatorId, {
        total_assigned_members: totalMembers
      });

      res.json({ status: 'success', message: 'Navigators assigned successfully' });
    } catch (error) {
      logger.error('Assign navigator error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error assigning navigator',
        details: error.message
      });
    }
  }

  async assignDoctor(req, res) {
    try {
      const { memberIds, doctorId } = req.body;
      
      // Validate memberIds and doctorId
      if (!Array.isArray(memberIds) || !memberIds.length) {
        return res.status(400).json({
          status: 'error',
          message: 'Member IDs are required'
        });
      }

      if (!doctorId) {
        return res.status(400).json({
          status: 'error',
          message: 'Doctor ID is required'
        });
      }

      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({
          status: 'error',
          message: 'Doctor not found'
        });
      }

      const members = await Member.find({ _id: { $in: memberIds } });
      if (members.length !== memberIds.length) {
        return res.status(404).json({
          status: 'error',
          message: 'One or more members not found'
        });
      }

      for (const member of members) {
        member.healthcareTeam.doctor = {
          _id: new mongoose.Types.ObjectId(doctorId),
          name: doctor.name,
          assignedDate: new Date()
        };
        await member.save();
      }

      // Update total_assigned_members count for doctor
      const totalMembers = await Member.countDocuments({
        'healthcareTeam.doctor._id': new mongoose.Types.ObjectId(doctorId)
      });
      
      await Doctor.findByIdAndUpdate(doctorId, {
        total_assigned_members: totalMembers
      });

      res.json({ status: 'success', message: 'Doctors assigned successfully' });
    } catch (error) {
      logger.error('Assign doctor error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error assigning doctor',
        details: error.message
      });
    }
  }

  async assignNurse(req, res) {
    try {
      const { memberIds, nurseId } = req.body;
      
      // Validate memberIds and nurseId
      if (!Array.isArray(memberIds) || !memberIds.length) {
        return res.status(400).json({
          status: 'error',
          message: 'Member IDs are required'
        });
      }

      if (!nurseId) {
        return res.status(400).json({
          status: 'error',
          message: 'Nurse ID is required'
        });
      }

      const nurse = await Nurse.findById(nurseId);
      if (!nurse) {
        return res.status(404).json({
          status: 'error',
          message: 'Nurse not found'
        });
      }

      const members = await Member.find({ _id: { $in: memberIds }, isStudent: true });
      if (members.length !== memberIds.length) {
        return res.status(404).json({
          status: 'error',
          message: 'One or more members not found'
        });
      }

      for (const member of members) {
        member.healthcareTeam.nurse = {
          _id: new mongoose.Types.ObjectId(nurseId),
          name: nurse.name,
          assignedDate: new Date()
        };
        await member.save();
      }

      res.json({ status: 'success', message: 'Nurses assigned successfully' });
    } catch (error) {
      logger.error('Assign nurse error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error assigning nurse',
        details: error.message
      });
    }
  }

  /**
   * Bulk upload regular members from CSV
   */
  async bulkInsertMembers(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          status: 'error',
          message: 'Please upload a CSV file'
        });
      }

      const results = [];
      const errors = [];
      const memberMap = new Map(); // To store row_no to memberId mapping

      // Create a readable stream from the uploaded file
      const stream = fs.createReadStream(req.file.path)
        .pipe(csv.parse({ columns: true, trim: true }));

      // First pass: Create all non-subprofile members
      for await (const row of stream) {
        try {
          // Check if row_no exists
          if (!row.row_no) {
            return res.status(400).json({
              status: 'error',
              message: 'Row number is required'
            });
          }

          // Skip subprofiles in first pass
          if (row.isSubprofile === 'true') {
            continue;
          }

          // Create new member
          const member = new Member({
            name: row.name,
            email: row.email,
            phone: row.phone,
            dob: row.dob,
            gender: row.gender,
            bloodGroup: row.bloodGroup,
            heightInFt: row.heightInFt,
            weightInKg: row.weightInKg,
            address: [{
              description: row['address.description'] || '',
              landmark: row['address.landmark'] || '',
              pinCode: row['address.pinCode'] || '',
              region: row['address.region'] || '',
              city: row['address.city'] || '',
              state: row['address.state'] || '',
              country: row['address.country'] || ''
            }],
            onBoarded: true,
            termsAndConditionsAccepted: true,
            isMember: true,
            employmentStatus: row.employmentStatus,
            educationLevel: row.educationLevel,
            maritalStatus: row.maritalStatus,
            additionalInfo: row.additionalInfo,
            emergencyContact: {
              name: row['emergencyContact.name'],
              relation: row['emergencyContact.relation'],
              phone: row['emergencyContact.phone']
            },
            isStudent: false,
            isSubprofile: false,
            active: true
          });

          await member.save();
          memberMap.set(row.row_no, member.memberId); // Store mapping of row_no to memberId
          results.push(member);

          // Create medical history for the member
          await MedicalHistory.create({
            memberId: member._id,
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
            lifestyleHabits: {},
            healthInsurance: []
          });
          console.log('Medical history created for member:', member._id);

          //create a auth credential for the navigator
          const authCredential = await AuthCredential.create({
            userId: member._id,
            email: row.email,
            phoneNumber: row.phone,
            password: null,
            userType: 'member',
            memberId: member.memberId,
            temporaryPassword: {
              password: null,
              expiresAt: null
            },
            isFirstLogin: false,
            passwordResetRequired: true
          });

          await authCredential.save();

          // Send welcome email
          if (member.email) {
            const msg = `Welcome to Assist Health. You can login to your account using your phone number: ${member.phone} & OTP`;
            await emailService.sendEmail(member.email, 'Welcome to Assist Health', msg);
          }

        } catch (error) {
          errors.push({
            row: row,
            error: error.message
          });
        }
      }

      // Second pass: Create subprofile members
      const subprofileStream = fs.createReadStream(req.file.path)
        .pipe(csv.parse({ columns: true, trim: true }));

      for await (const row of subprofileStream) {
        try {
          // Only process subprofiles
          if (row.isSubprofile !== 'true') {
            continue;
          }

          // Validate primary member exists
          const rowNo = memberMap.get(row.primaryMemberId);
          if (!rowNo) {
            errors.push({
              row: row,
              error: `Primary member with row number ${row.primaryMemberId} not found`
            });
            continue;
          }

          //get the memberId from the rowNo
          const primaryMemberId = memberMap.get(rowNo);
          console.log('Primary member ID:', primaryMemberId);

          // Create subprofile member
          const member = new Member({
            name: row.name,
            email: row.email,
            phone: row.phone,
            dob: row.dob,
            gender: row.gender,
            bloodGroup: row.bloodGroup,
            heightInFt: row.heightInFt,
            weightInKg: row.weightInKg,
            address: [{
              description: row['address.description'] || '',
              landmark: row['address.landmark'] || '',
              pinCode: row['address.pinCode'] || '',
              region: row['address.region'] || '',
              city: row['address.city'] || '',
              state: row['address.state'] || '',
              country: row['address.country'] || ''
            }],
            onBoarded: true,
            employmentStatus: row.employmentStatus,
            educationLevel: row.educationLevel,
            maritalStatus: row.maritalStatus,
            additionalInfo: row.additionalInfo,
            emergencyContact: {
              name: row['emergencyContact.name'],
              relation: row['emergencyContact.relation'],
              phone: row['emergencyContact.phone']
            },
            isStudent: false,
            isSubprofile: true,
            primaryMemberId: primaryMemberId,
            active: true
          });

          await member.save();
          results.push(member);

          // Update primary member's subprofileIds
          await Member.findByIdAndUpdate(
            primaryMemberId,
            { $push: { subprofileIds: member._id } }
          );

          // Create medical history for the member
          await MedicalHistory.create({
            memberId: member._id,
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
            lifestyleHabits: {},
            healthInsurance: []
          });
          console.log('Medical history created for member:', member._id);

          //create a auth credential for the navigator
          const authCredential = await AuthCredential.create({
            userId: member._id,
            email: row.email,
            phoneNumber: row.phone,
            password: null,
            userType: 'member',
            memberId: member.memberId,
            temporaryPassword: {
              password: null,
              expiresAt: null
            },
            isFirstLogin: false,
            passwordResetRequired: true
          });

          await authCredential.save();
          
          // Send welcome email
          if (member.email) {
            const msg = `Welcome to Assist Health. You can login to your account using your phone number: ${member.phone} & OTP`;
            await emailService.sendEmail(member.email, 'Welcome to Assist Health', msg);
          }

        } catch (error) {
          errors.push({
            row: row,
            error: error.message
          });
        }
      }

      // Clean up the uploaded file
      fs.unlinkSync(req.file.path);

      res.json({
        status: 'success',
        data: {
          successful: results.length,
          failed: errors.length,
          errors: errors
        }
      });

    } catch (error) {
      logger.error('Bulk insert members error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error processing bulk insert',
        details: error.message
      });
    }
  }
  
  /**
   * Bulk update members from CSV
   */
  async bulkUpdateMembers(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          status: 'error',
          message: 'Please upload a CSV file'
        });
      }

      const results = [];
      const errors = [];

      // Create a readable stream from the uploaded file
      const stream = fs.createReadStream(req.file.path)
        .pipe(csv.parse({ columns: true, trim: true }));

      for await (const row of stream) {
        try {
          // Check if memberId exists in the row
          if (!row.memberId) {
            errors.push({
              row: row,
              error: 'Member ID is required for all rows'
            });
            continue;
          }

          // Check for existing member
          const existingMember = await Member.findOne({
            memberId: row.memberId
          });

          if (!existingMember) {
            errors.push({
              row: row,
              error: `Member not found with ID ${row.memberId}`
            });
            continue;
          }

          // Update basic fields
          if (row.name) existingMember.name = row.name;
          if (row.email) existingMember.email = row.email;
          if (row.phone) existingMember.phone = row.phone;
          if (row.dob) existingMember.dob = new Date(row.dob);
          if (row.gender) existingMember.gender = row.gender;
          if (row.bloodGroup) existingMember.bloodGroup = row.bloodGroup;
          if (row.heightInFt) existingMember.heightInFt = parseFloat(row.heightInFt);
          if (row.weightInKg) existingMember.weightInKg = parseFloat(row.weightInKg);
          if (row.employmentStatus) existingMember.employmentStatus = row.employmentStatus;
          if (row.educationLevel) existingMember.educationLevel = row.educationLevel;
          if (row.maritalStatus) existingMember.maritalStatus = row.maritalStatus;
          if (row.additionalInfo) existingMember.additionalInfo = row.additionalInfo;

          // Update emergency contact
          if (row['emergencyContact.name'] || row['emergencyContact.relation'] || row['emergencyContact.phone']) {
            existingMember.emergencyContact = {
              ...existingMember.emergencyContact,
              ...(row['emergencyContact.name'] && { name: row['emergencyContact.name'] }),
              ...(row['emergencyContact.relation'] && { relation: row['emergencyContact.relation'] }),
              ...(row['emergencyContact.phone'] && { phone: row['emergencyContact.phone'] })
            };
          }

          // Update address
          if (row['address.description'] || row['address.landmark'] || row['address.pinCode'] || 
              row['address.region'] || row['address.city'] || row['address.state'] || row['address.country']) {
            const address = {
              description: row['address.description'] || '',
              landmark: row['address.landmark'] || '',
              pinCode: row['address.pinCode'] || '',
              region: row['address.region'] || '',
              city: row['address.city'] || '',
              state: row['address.state'] || '',
              country: row['address.country'] || ''
            };
            existingMember.address = [address];
          }

          // Update subprofile related fields
          if (row.isSubprofile !== undefined) {
            existingMember.isSubprofile = row.isSubprofile === 'true';
          }
          if (row.primaryMemberId) {
            existingMember.primaryMemberId = row.primaryMemberId;
          }

          await existingMember.save();
          results.push(existingMember);
        } catch (error) {
          errors.push({
            row: row,
            error: error.message
          });
        }
      }

      // Clean up the uploaded file
      fs.unlinkSync(req.file.path);

      res.json({
        status: 'success',
        data: {
          successful: results.length,
          failed: errors.length,
          errors: errors
        }
      });

    } catch (error) {
      logger.error('Bulk update members error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error processing bulk update',
        details: error.message
      });
    }
  }

  
  /**
   * Bulk upload student members from CSV
   */
  async bulkInsertStudentMembers(req, res) {
    try {

      const schoolId = req.params.schoolId;
      if (!schoolId) {
        return res.status(400).json({
          status: 'error',
          message: 'School ID is required'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          status: 'error',
          message: 'Please upload a CSV file'
        });
      }

      const results = [];
      const errors = [];

      // Create a readable stream from the uploaded file
      const stream = fs.createReadStream(req.file.path)
        .pipe(csv.parse({ columns: true, trim: true }));

      // First validate all rows for required schoolId
      const rows = [];
      for await (const row of stream) {
        rows.push(row);
        if (!row['studentDetails.schoolId'] || row['studentDetails.schoolId'] !== schoolId) {
          return res.status(400).json({
            status: 'error',
            message: 'School ID is required for all students and should be equal to the schoolId provided',
            details: `Missing schoolId in row`
          });
        }
      }

      const membersTobeMailed = [];
      // Process all rows after validation
      for (const row of rows) {
        try {
          // Create new student member
          const member = new Member({
            name: row.name,
            email: row.email,
            phone: row.phone,
            dob: row.dob,
            gender: row.gender,
            bloodGroup: row.bloodGroup,
            heightInFt: row.heightInFt,
            weightInKg: row.weightInKg,
            address: [{
              description: row['address.description'] || '',
              landmark: row['address.landmark'] || '',
              pinCode: row['address.pinCode'] || '',
              region: row['address.region'] || '',
              city: row['address.city'] || '',
              state: row['address.state'] || '',
              country: row['address.country'] || ''
            }],
            additionalInfo: row.additionalInfo,
            isStudent: true,
            onBoarded: true,
            active: true,
            studentDetails: {
              schoolId: row['studentDetails.schoolId'],
              schoolName: row['studentDetails.schoolName'],
              grade: row['studentDetails.grade'],
              section: row['studentDetails.section'],
              alternatePhone: row['studentDetails.alternatePhone'],
              guardians: [
                {
                  name: row['studentDetails.guardians[0].name'],
                  relation: row['studentDetails.guardians[0].relation'],
                  phone: row['studentDetails.guardians[0].phone']
                }
              ]
            }
          });

          // Add second guardian if provided
          if (row['studentDetails.guardians[1].name']) {
            member.studentDetails.guardians.push({
              name: row['studentDetails.guardians[1].name'],
              relation: row['studentDetails.guardians[1].relation'],
              phone: row['studentDetails.guardians[1].phone']
            });
          }

          await member.save();
          results.push(member);

          // Create auth credential for the student
          const authCredential = await AuthCredential.create({
            userId: member._id,
            email: member.email,
            phoneNumber: member.phone,
            password: null,
            userType: 'member',
            memberId: member.memberId,
            temporaryPassword: {
              password: null,
              expiresAt: null
            },
            isFirstLogin: false,
            passwordResetRequired: true
          });

          await authCredential.save();

          membersTobeMailed.push({
            email: member.email,
            name: member.name,
            phone: member.phone
          });
          

        } catch (error) {
          errors.push({
            row: row,
            error: error.message
          });
        }
      }

      // Clean up the uploaded file
      fs.unlinkSync(req.file.path);

      res.json({
        status: 'success',
        data: {
          successful: results.length,
          failed: errors.length,
          errors: errors
        }
      });

      // Send welcome email
      if (membersTobeMailed.length > 0) {
        for (const member of membersTobeMailed) {
          const msg = `Welcome to Assist Health. You can login to your account using your phone number: ${member.phone} & OTP`;
          await emailService.sendEmail(member.email, 'Welcome to Assist Health', msg);
        }
      }
    } catch (error) {
      logger.error('Bulk insert student members error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error processing bulk insert',
        details: error.message
      });
    }
  }

  async bulkUpdateStudentMembers(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          status: 'error',
          message: 'Please upload a CSV file'
        });
      }

      const results = [];
      const errors = [];

      // Create a readable stream from the uploaded file
      const stream = fs.createReadStream(req.file.path)
        .pipe(csv.parse({ columns: true, trim: true }));

      // First validate all rows for required memberId
      const rows = [];
      for await (const row of stream) {
        rows.push(row);
        if (!row.memberId) {
          return res.status(400).json({
            status: 'error',
            message: 'Member ID is required for all students',
            details: 'Each row must contain a memberId field'
          });
        }
      }

      // Process all rows after validation
      for (const row of rows) {
        try {
          // Find existing student member
          const existingMember = await Member.findOne({
            memberId: row.memberId,
            isStudent: true
          });

          if (!existingMember) {
            errors.push({
              row: row,
              error: `Student not found with memberId ${row.memberId}`
            });
            continue;
          }

          // Update basic fields if provided
          if (row.name) existingMember.name = row.name;
          if (row.email) existingMember.email = row.email;
          if (row.phone) existingMember.phone = row.phone;
          if (row.dob) existingMember.dob = new Date(row.dob);
          if (row.gender) existingMember.gender = row.gender;
          if (row.bloodGroup) existingMember.bloodGroup = row.bloodGroup;
          if (row.heightInFt) existingMember.heightInFt = parseFloat(row.heightInFt);
          if (row.weightInKg) existingMember.weightInKg = parseFloat(row.weightInKg);
          if (row.additionalInfo) existingMember.additionalInfo = row.additionalInfo;

          // Update address if any address field is provided
          if (row['address.description'] || row['address.landmark'] || row['address.pinCode'] || 
              row['address.region'] || row['address.city'] || row['address.state'] || row['address.country']) {
            existingMember.address = [{
              description: row['address.description'] || existingMember.address[0]?.description || '',
              landmark: row['address.landmark'] || existingMember.address[0]?.landmark || '',
              pinCode: row['address.pinCode'] || existingMember.address[0]?.pinCode || '',
              region: row['address.region'] || existingMember.address[0]?.region || '',
              city: row['address.city'] || existingMember.address[0]?.city || '',
              state: row['address.state'] || existingMember.address[0]?.state || '',
              country: row['address.country'] || existingMember.address[0]?.country || ''
            }];
          }

          // Update student details if any student field is provided
          if (row['studentDetails.schoolId'] || row['studentDetails.schoolName'] || 
              row['studentDetails.grade'] || row['studentDetails.section'] || 
              row['studentDetails.alternatePhone']) {
            existingMember.studentDetails = {
              ...existingMember.studentDetails,
              ...(row['studentDetails.schoolId'] && { schoolId: row['studentDetails.schoolId'] }),
              ...(row['studentDetails.schoolName'] && { schoolName: row['studentDetails.schoolName'] }),
              ...(row['studentDetails.grade'] && { grade: row['studentDetails.grade'] }),
              ...(row['studentDetails.section'] && { section: row['studentDetails.section'] }),
              ...(row['studentDetails.alternatePhone'] && { alternatePhone: row['studentDetails.alternatePhone'] })
            };
          }

          // Update guardians if provided
          if (row['studentDetails.guardians[0].name'] || row['studentDetails.guardians[0].relation'] || 
              row['studentDetails.guardians[0].phone']) {
            const guardian1 = {
              name: row['studentDetails.guardians[0].name'] || existingMember.studentDetails?.guardians[0]?.name || '',
              relation: row['studentDetails.guardians[0].relation'] || existingMember.studentDetails?.guardians[0]?.relation || '',
              phone: row['studentDetails.guardians[0].phone'] || existingMember.studentDetails?.guardians[0]?.phone || ''
            };
            existingMember.studentDetails.guardians = [guardian1];

            // Add second guardian if provided
            if (row['studentDetails.guardians[1].name'] || row['studentDetails.guardians[1].relation'] || 
                row['studentDetails.guardians[1].phone']) {
              const guardian2 = {
                name: row['studentDetails.guardians[1].name'] || existingMember.studentDetails?.guardians[1]?.name || '',
                relation: row['studentDetails.guardians[1].relation'] || existingMember.studentDetails?.guardians[1]?.relation || '',
                phone: row['studentDetails.guardians[1].phone'] || existingMember.studentDetails?.guardians[1]?.phone || ''
              };
              existingMember.studentDetails.guardians.push(guardian2);
            }
          }

          await existingMember.save();
          results.push(existingMember);

        } catch (error) {
          errors.push({
            row: row,
            error: error.message
          });
        }
      }

      // Clean up the uploaded file
      fs.unlinkSync(req.file.path);

      res.json({
        status: 'success',
        data: {
          successful: results.length,
          failed: errors.length,
          errors: errors
        }
      });

    } catch (error) {
      logger.error('Bulk update student members error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error processing bulk update',
        details: error.message
      });
    }
  }

  // Create a note for a member
  async createNote(req, res) {
    try {
      const { id } = req.params;
      const { note } = req.body;
      
      const member = await Member.findById(id);
      if (!member) {
        return res.status(404).json({ message: 'Member not found' });
      }

      const newNote = {
        note,
        createdAt: new Date()
      };

      member.notes.push(newNote);
      await member.save();

      res.status(201).json({ message: 'Note created successfully', note: newNote });
    } catch (error) {
      res.status(500).json({ message: 'Error creating note', error: error.message });
    }
  }

  // Get all notes for a member
  async getNotes(req, res) {
    try {
      const { id } = req.params;
      
      const member = await Member.findById(id);
      if (!member) {
        return res.status(404).json({ message: 'Member not found' });
      }

      res.status(200).json({ notes: member.notes });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching notes', error: error.message });
    }
  }

  // Update a specific note
  async updateNote(req, res) {
    try {
      const { id, noteId } = req.params;
      const { note } = req.body;
      
      const member = await Member.findById(id);
      if (!member) {
        return res.status(404).json({ message: 'Member not found' });
      }

      const noteToUpdate = member.notes.id(noteId);
      if (!noteToUpdate) {
        return res.status(404).json({ message: 'Note not found' });
      }

      noteToUpdate.note = note || noteToUpdate.note;

      await member.save();

      res.status(200).json({ message: 'Note updated successfully', note: noteToUpdate });
    } catch (error) {
      res.status(500).json({ message: 'Error updating note', error: error.message });
    }
  }

  // Delete a specific note
  async deleteNote(req, res) {
    try {
      const { id, noteId } = req.params;
      
      const member = await Member.findById(id);
      if (!member) {
        return res.status(404).json({ message: 'Member not found' });
      }

      const noteToDelete = member.notes.id(noteId);
      if (!noteToDelete) {
        return res.status(404).json({ message: 'Note not found' });
      }

      member.notes.pull(noteId);
      await member.save();

      res.status(200).json({ message: 'Note deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting note', error: error.message });
    }
  }

  async renewMembership(req, res) {
    try {
      const { id } = req.params;

      const member = await Member.findById(id);
      if (!member) {
        return res.status(404).json({ message: 'Member not found' });
      }

      //check if member has active premium membership
      if(member.membershipStatus.premiumMembership.isActive) {
        return res.status(400).json({ message: 'Member already has an active premium membership' });
      }

      //update the membership status
      member.membershipStatus.premiumMembership.isActive = true;
      member.membershipStatus.premiumMembership.startDate = Date.now();
      member.membershipStatus.premiumMembership.expiryDate = Date.now() + (365.25 * 24 * 60 * 60 * 1000);
      member.membershipStatus.premiumMembership.renewalCount += 1;
      await member.save();

      res.status(200).json({ message: 'Membership renewed successfully', data: member.membershipStatus.premiumMembership });
      
    } catch (error) {
      res.status(500).json({ message: 'Error renewing membership', error: error.message });
    }
  }

  /**
   * Generate membership card PDF for a member
   */
  async generateMembershipCard(req, res) {
    try {
      const member = await Member.findById(req.params.id);
      if (!member) {
        return res.status(404).json({
          status: 'error',
          message: 'Member not found'
        });
      }

      const memberData = {
        name: member.name,
        memberId: member.memberId,
        validDate: member.membershipStatus?.premiumMembership?.expiryDate || 
                  new Date(Date.now() + (365.25 * 24 * 60 * 60 * 1000))
      };

      const result = await pdfService.generateMembershipCardPdf(memberData, res);

      res.json({
        status: 'success',
        data: result
      });
    } catch (error) {
      logger.error('Membership card generation error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error generating membership card'
      });
    }
  }
}

module.exports = new MemberController(); 