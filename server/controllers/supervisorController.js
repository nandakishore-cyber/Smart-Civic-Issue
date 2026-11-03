const mongoose = require('mongoose');
const Supervisor = require('../models/Supervisor');

const normalize = (value) => String(value || '').trim();

const listSupervisors = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' && req.query.includeInactive === 'true'
      ? {}
      : { active: true };
    const supervisors = await Supervisor.find(filter).sort({ active: -1, localBody: 1, name: 1 }).lean();
    res.json(supervisors);
  } catch (error) {
    next(error);
  }
};

const createSupervisor = async (req, res, next) => {
  try {
    const { name, employeeId, localBody, location, phone, active } = req.body;
    if (!normalize(name) || !normalize(employeeId) || !normalize(localBody) || !normalize(location)) {
      return res.status(400).json({ message: 'Name, employee ID, local body, and location are required.' });
    }
    const supervisor = await Supervisor.create({
      name: normalize(name),
      employeeId: normalize(employeeId),
      localBody: normalize(localBody),
      location: normalize(location),
      phone: normalize(phone),
      active: active !== false,
    });
    res.status(201).json(supervisor);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'Employee ID already exists.' });
    next(error);
  }
};

const updateSupervisor = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid supervisor id.' });
    const updates = {};
    for (const key of ['name', 'employeeId', 'localBody', 'location', 'phone']) {
      if (req.body[key] !== undefined) updates[key] = normalize(req.body[key]);
    }
    if (req.body.active !== undefined) updates.active = Boolean(req.body.active);
    if (Object.keys(updates).length === 0) return res.status(400).json({ message: 'At least one supervisor field must be updated.' });
    const supervisor = await Supervisor.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!supervisor) return res.status(404).json({ message: 'Supervisor not found.' });
    res.json(supervisor);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'Employee ID already exists.' });
    next(error);
  }
};

const deleteSupervisor = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid supervisor id.' });
    const supervisor = await Supervisor.findByIdAndDelete(req.params.id);
    if (!supervisor) return res.status(404).json({ message: 'Supervisor not found.' });
    res.json({ message: 'Supervisor removed successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { listSupervisors, createSupervisor, updateSupervisor, deleteSupervisor };
