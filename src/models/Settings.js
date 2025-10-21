const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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

const Settings = mongoose.model('Settings', settingsSchema);
module.exports = Settings; 