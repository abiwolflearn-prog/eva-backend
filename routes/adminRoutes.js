const express = require('express');
const Teacher = require('../models/Teacher');
const Evaluation = require('../models/Evaluation');
const User = require('../models/User');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

const Setting = require('../models/Setting');

// Get Dashboard Data
router.get('/dashboard', protect, admin, async (req, res) => {
    try {
        const totalTeachers = await Teacher.countDocuments();
        const totalStudents = await User.countDocuments({ role: 'student' });
        const totalEvaluations = await Evaluation.countDocuments();
        
        const teachers = await Teacher.find().sort('-averageRating');
        const topTeachers = teachers.slice(0, 5);
        const lowestTeachers = teachers.slice(-5).reverse();

        res.json({
            stats: { 
                totalTeachers, 
                totalStudents, 
                totalEvaluations, 
                averageRating: teachers.length > 0 ? (teachers.reduce((acc, t) => acc + t.averageRating, 0) / teachers.length).toFixed(1) : 0
            },
            topTeachers,
            lowestTeachers
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// User Management
router.get('/users', protect, admin, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort('-createdAt');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/users/:id/role', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        user.role = user.role === 'admin' ? 'student' : 'admin';
        await user.save();
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/users/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user._id.toString() === req.user._id.toString()) return res.status(400).json({ message: 'Cannot delete yourself' });
        await user.deleteOne();
        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Evaluation Moderation
router.get('/evaluations', protect, admin, async (req, res) => {
    try {
        const evaluations = await Evaluation.find()
            .populate('teacher', 'name college program courseName')
            .populate('student', 'name email')
            .sort('-createdAt');
        res.json(evaluations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/evaluations/:id', protect, admin, async (req, res) => {
    try {
        const evaluation = await Evaluation.findById(req.params.id);
        if (!evaluation) return res.status(404).json({ message: 'Evaluation not found' });
        
        // Update teacher stats before deleting
        const teacher = await Teacher.findById(evaluation.teacher);
        if (teacher) {
            const evals = await Evaluation.find({ teacher: teacher._id, _id: { $ne: evaluation._id } });
            const total = evals.length;
            if (total > 0) {
                teacher.averageRating = evals.reduce((acc, e) => acc + e.rating, 0) / total;
                teacher.totalEvaluations = total;
            } else {
                teacher.averageRating = 0;
                teacher.totalEvaluations = 0;
            }
            await teacher.save();
        }

        await evaluation.deleteOne();
        res.json({ message: 'Evaluation deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// System Settings
router.get('/settings', protect, async (req, res) => {
    try {
        let settings = await Setting.findOne();
        if (!settings) settings = await Setting.create({});
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/settings', protect, admin, async (req, res) => {
    try {
        let settings = await Setting.findOne();
        if (!settings) settings = await Setting.create({});
        
        const { evaluationPeriodOpen, anonymousModeEnabled } = req.body;
        if (evaluationPeriodOpen !== undefined) settings.evaluationPeriodOpen = evaluationPeriodOpen;
        if (anonymousModeEnabled !== undefined) settings.anonymousModeEnabled = anonymousModeEnabled;
        
        await settings.save();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Organized Data (Hierarchical)
router.get('/organized-data', protect, admin, async (req, res) => {
    const { college, program, year, semester } = req.query;
    try {
        const filter = {};
        if (college) filter.college = college;
        if (program) filter.program = program;
        if (year) filter.year = Number(year);
        if (semester) filter.semester = Number(semester);
        
        console.log('Organized Data Request:', { college, program, year, semester });
        console.log('Filter:', filter);

        const [teachers, students, evaluations] = await Promise.all([
            Teacher.find(filter).sort('name'),
            User.find({ ...filter, role: 'student' }).select('-password').sort('name'),
            Evaluation.find(filter)
                .populate('teacher', 'name')
                .populate('student', 'name')
                .sort('-createdAt')
        ]);

        res.json({ teachers, students, evaluations });
    } catch (error) {
        console.error('SERVER ERROR in organized-data:', error);
        res.status(500).json({ message: error.message });
    }
});

// Export Data as Structured JSON for CSV
router.get('/export', protect, admin, async (req, res) => {
    const { college, program, year, semester } = req.query;
    try {
        const filter = {};
        if (college) filter.college = college;
        if (program) filter.program = program;
        if (year) filter.year = Number(year);
        if (semester) filter.semester = Number(semester);

        const evaluations = await Evaluation.find(filter)
            .populate('teacher', 'name courseName')
            .populate('student', 'name')
            .sort('-createdAt');

        const exportData = evaluations.map(ev => ({
            college: ev.college,
            program: ev.program,
            year: ev.year,
            semester: ev.semester,
            teacherName: ev.teacher?.name || 'N/A',
            course: ev.teacher?.courseName || 'N/A',
            studentName: ev.student?.name || 'N/A',
            rating: ev.rating,
            comment: ev.comment,
            date: new Date(ev.createdAt).toLocaleDateString()
        }));

        res.json(exportData);
    } catch (error) {
        console.error('SERVER ERROR in export:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
