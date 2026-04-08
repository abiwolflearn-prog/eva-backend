const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    evaluationPeriodOpen: {
        type: Boolean,
        default: true
    },
    anonymousModeEnabled: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
