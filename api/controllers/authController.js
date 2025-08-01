const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Staff = require('../models/Staffs');
const {authorizeRoles,authenticateToken} = require('../middleware/authMiddleware');
const signup = async (req, res) => {
    const { staff_id, staff_name, email, date_of_birth, password, department, specialization, shift_time, role } = req.body;
    try {
        // Check for existing email (you already have this - good!)
        const existingStaff = await Staff.findOne({ email: email.toLowerCase() });
        if (existingStaff) {
            return res.status(400).json({ message: 'Staff member already exists' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const newStaff = new Staff({ 
            staff_id, 
            staff_name, 
            email: email.toLowerCase(), 
            date_of_birth, 
            password: hashedPassword, 
            department, 
            specialization, 
            shift_time, 
            role
        });
        
        await newStaff.save();
        res.status(201).json({ message: 'Staff signed up successfully' });
    } catch (err) {
        console.error(err);
        // Handle MongoDB duplicate key error as fallback
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            return res.status(400).json({ message: `${field} already exists` });
        }
        res.status(500).json({ message: 'Error signing up' });
    }
};

const login = async (req, res) => {
    const { staff_name, password } = req.body;
    try {
        if (!staff_name || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }
        const staff = await Staff.findOne({ staff_name });
        if (!staff || !(await bcrypt.compare(password, staff.password))) {
            return res.status(400).send('Invalid credentials');
        }
        const token = jwt.sign({ id: staff._id, role: staff.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ token, role: staff.role });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};
const logout = async (req, res) => {
    try {
        // Stateless logout: token is cleared client-side
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
        console.error('Logout error:', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};
//named module export
module.exports = {
    signup,
    login,
    logout
};
