const express = require('express');
const Evaluation = require('../models/Evaluation');
const Teacher = require('../models/Teacher');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// POST new evaluation
router.post('/', protect, async (req, res) => {
    const { teacherId, college, program, year, semester, rating, criteria, comment } = req.body;
    try {
        // Prevent duplicate evaluation
        const existingEval = await Evaluation.findOne({ student: req.user._id, teacher: teacherId });
        if (existingEval) return res.status(400).json({ message: 'You have already evaluated this teacher' });

        const evaluation = await Evaluation.create({
            student: req.user._id,
            teacher: teacherId,
            college,
            program,
            year,
            semester,
            rating,
            criteria,
            comment
        });

        // Update teacher average ratings
        const teacher = await Teacher.findById(teacherId);
        if (teacher) {
            const evals = await Evaluation.find({ teacher: teacherId });
            const total = evals.length;
            
            let sumRating = 0;
            evals.forEach(e => {
                sumRating += e.rating;
            });

            teacher.averageRating = sumRating / total;
            teacher.totalEvaluations = total;
            
            await teacher.save();
        }

        res.status(201).json(evaluation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET evaluations by teacher ID
router.get('/teacher/:id', protect, async (req, res) => {
    try {
        const evaluations = await Evaluation.find({ teacher: req.params.id })
            .populate('student', 'name')
            .sort('-createdAt');
            
        res.json(evaluations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET analytics: average rating per college
// IMPORTANT: Must be defined BEFORE /:id to prevent Express matching 'analytics' as an ID
router.get('/analytics', protect, async (req, res) => {
    try {
        const stats = await Evaluation.aggregate([
            {
                $group: {
                    _id: '$college',
                    averageRating: { $avg: '$rating' },
                    totalEvaluations: { $sum: 1 }
                }
            },
            { $sort: { averageRating: -1 } }
        ]);

        const formattedStats = stats.map(s => ({
            college: s._id,
            averageRating: s.averageRating.toFixed(2),
            totalEvaluations: s.totalEvaluations
        }));

        const topCollege = formattedStats.length > 0 ? formattedStats[0] : null;

        res.json({
            colleges: formattedStats,
            topCollege
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET my evaluations
// IMPORTANT: Must be defined BEFORE /:id to prevent Express matching 'me' as an ID
router.get('/me', protect, async (req, res) => {
    try {
        const evaluations = await Evaluation.find({ student: req.user._id })
            .populate('teacher', 'name courseName')
            .sort('-createdAt');
        res.json(evaluations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET evaluation by ID
router.get('/:id', protect, async (req, res) => {
    try {
        const evaluation = await Evaluation.findById(req.params.id);
        if (!evaluation) return res.status(404).json({ message: 'Evaluation not found' });
        res.json(evaluation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT update evaluation
router.put('/:id', protect, async (req, res) => {
    const { rating, criteria, comment } = req.body;
    try {
        const evaluation = await Evaluation.findById(req.params.id);
        if (!evaluation) return res.status(404).json({ message: 'Evaluation not found' });
        
        // Ensure user owns this evaluation
        if (evaluation.student.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        evaluation.rating = rating || evaluation.rating;
        evaluation.criteria = criteria || evaluation.criteria;
        evaluation.comment = comment || evaluation.comment;

        await evaluation.save();

        // Update teacher average ratings
        const teacherId = evaluation.teacher;
        const evals = await Evaluation.find({ teacher: teacherId });
        const teacher = await Teacher.findById(teacherId);
        
        if (teacher) {
            const total = evals.length;
            const sumRating = evals.reduce((acc, curr) => acc + curr.rating, 0);
            teacher.averageRating = sumRating / total;
            teacher.totalEvaluations = total;
            await teacher.save();
        }

        res.json(evaluation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE evaluation
router.delete('/:id', protect, async (req, res) => {
    try {
        const evaluation = await Evaluation.findById(req.params.id);
        if (!evaluation) return res.status(404).json({ message: 'Evaluation not found' });
        
        // Ensure user owns this evaluation
        if (evaluation.student.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const teacherId = evaluation.teacher;
        await evaluation.deleteOne();

        // Update teacher average ratings
        const evals = await Evaluation.find({ teacher: teacherId });
        const teacher = await Teacher.findById(teacherId);
        
        if (teacher) {
            const total = evals.length;
            if (total > 0) {
                const sumRating = evals.reduce((acc, curr) => acc + curr.rating, 0);
                teacher.averageRating = sumRating / total;
            } else {
                teacher.averageRating = 0;
            }
            teacher.totalEvaluations = total;
            await teacher.save();
        }

        res.json({ message: 'Evaluation removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
