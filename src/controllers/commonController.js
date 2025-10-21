const { logger } = require('../utils/logger');
const axios = require('axios');
const https = require('https');
const { Setting } = require('../models');

class CommonController {
    /**
     * Get pincode details
     */
    async getPincodeDetails(req, res) {
        const { pincode } = req.params;
        try {
            //make this api call to https://api.postalpincode.in/pincode/${pincode}
            const response = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`, {
                httpsAgent: new https.Agent({  
                    rejectUnauthorized: false
                })
            });
            const pincodeDetails = response.data;
            res.status(200).json(pincodeDetails);
        } catch (error) {
            logger.error(error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    async getSettings(req, res) {
        const settings = await Setting.find();
        res.status(200).json({
                status: 'success',
                data: settings
        });
    }

    async updateSettings(req, res) {
        const { id } = req.params;
        const settings = req.body;
        const updatedSettings = await Setting.findByIdAndUpdate({ _id: id }, settings, { new: true });
        res.status(200).json({
            status: 'success',
            data: updatedSettings
        });
    }
}

module.exports = new CommonController();
