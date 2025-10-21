const { Package } = require('../models');
const { logger } = require('../utils/logger');

class PackageController {

    async createPackage(req, res) {
        try {
            const { title, description, durationInMonths, durationInDays, price, active } = req.body;
            const newPackage = await Package.create({ title, description, durationInMonths, durationInDays, price, active });
            return res.status(201).json({
                status: 'success',
                data: newPackage
            });
        } catch (error) {
            logger.error(error);
            return res.status(500).json({
                status: 'error',
                message: 'Error creating package'
            });
        }
    }

    async getPackages(req, res) {
        try {
            const packages = await Package.find();
            return res.status(200).json({
                status: 'success',
                data: packages
            });
        } catch (error) {
            logger.error(error);
            return res.status(500).json({
                status: 'error',
                message: 'Error getting packages'
            });
        }
    }

    async getPackageById(req, res) {
        try {
            const foundPackage = await Package.findById(req.params.id);
            return res.status(200).json({
                status: 'success',
                data: foundPackage
            });
        } catch (error) {
            logger.error(error);
            return res.status(500).json({
                status: 'error',
                message: 'Error getting package'
            });
        }
    }

    async updatePackage(req, res) {
        try {
            const updatedPackage = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!updatedPackage) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Package not found'
                });
            }
            return res.status(200).json({
                status: 'success',
                data: updatedPackage
            });
        } catch (error) {
            logger.error(error);
            return res.status(500).json({
                status: 'error',
                message: 'Error updating package'
            });
        }
    }

    async deletePackage(req, res) {
        try {
            const deletedPackage = await Package.findByIdAndDelete(req.params.id);
            return res.status(200).json({
                status: 'success',
                message: 'Package deleted successfully'
            });
        } catch (error) {
            logger.error(error);
            return res.status(500).json({
                status: 'error',
                message: 'Error deleting package'
            });
        }
    }
    

}

module.exports = new PackageController();
