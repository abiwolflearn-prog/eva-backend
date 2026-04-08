const mongoose = require('mongoose');

const TeacherSchema = new mongoose.Schema({
    name: { type: String, required: true },
    college: { type: String, required: true },
    program: { type: String, required: true },
    courseName: { type: String, required: true },
    year: { type: Number, required: true },
    semester: { type: Number, required: true },
    averageRating: { type: Number, default: 0 },
    ratingBreakdown: {
        teaching: { type: Number, default: 0 },
        communication: { type: Number, default: 0 },
        organization: { type: Number, default: 0 },
        fairGrading: { type: Number, default: 0 }
    },
    totalEvaluations: { type: Number, default: 0 }
});

module.exports = mongoose.model('Teacher', TeacherSchema);
