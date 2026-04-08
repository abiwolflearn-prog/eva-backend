const mongoose = require('mongoose');

const EvaluationSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    college: { type: String, required: true },
    program: { type: String, required: true },
    year: { type: Number, required: true },
    semester: { type: Number, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    criteria: {
        teachingQuality: { type: Number, default: 0 },
        communication: { type: Number, default: 0 },
        punctuality: { type: Number, default: 0 },
        courseManagement: { type: Number, default: 0 },
        studentSupport: { type: Number, default: 0 },
        professionalism: { type: Number, default: 0 }
    },
    comment: { type: String, default: '' },
}, { timestamps: true });

// Prevent duplicate evaluation per student per teacher
EvaluationSchema.index({ student: 1, teacher: 1 }, { unique: true });

module.exports = mongoose.model('Evaluation', EvaluationSchema);
