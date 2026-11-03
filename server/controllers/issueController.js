const mongoose = require('mongoose');
const Issue = require('../models/Issue');
const Supervisor = require('../models/Supervisor');

const detectImageContentType = (buffer) => {
  if (!Buffer.isBuffer(buffer)) {
    buffer = Buffer.from(buffer?.buffer || buffer || []);
  }
  if (!buffer || buffer.length < 4) return null;
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return 'image/jpeg';
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png';
  }
  if (buffer.subarray(0, 6).toString('ascii') === 'GIF87a' || buffer.subarray(0, 6).toString('ascii') === 'GIF89a') {
    return 'image/gif';
  }
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
};

const parseNumber = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const getLocationValue = (body, key) =>
  body[key] ?? body.location?.[key] ?? body[`location[${key}]`] ?? '';

const getSupervisorIds = (value) => {
  if (value === undefined || value === null || value === '') return [];
  const values = Array.isArray(value) ? value : [value];
  return [...new Set(values.map((item) => String(item).trim()).filter(Boolean))];
};

const validateSupervisorAssignment = async (issue, supervisorIds, actorRole) => {
  if (!supervisorIds.length) return [];
  if (supervisorIds.some((id) => !mongoose.isValidObjectId(id))) {
    const error = new Error('Invalid supervisor selection.');
    error.statusCode = 400;
    throw error;
  }
  const supervisors = await Supervisor.find({ _id: { $in: supervisorIds }, active: true }).lean();
  if (supervisors.length !== supervisorIds.length) {
    const error = new Error('One or more selected supervisors are unavailable.');
    error.statusCode = 400;
    throw error;
  }
  const required = issue.priority === 'High' ? 2 : 1;
  if (supervisorIds.length !== required) {
    const error = new Error(
      `${issue.priority === 'High' ? 'High-priority' : 'Low- and medium-priority'} complaints require exactly ${required} supervisor${required > 1 ? 's' : ''}.`
    );
    error.statusCode = 400;
    throw error;
  }
  if (actorRole === 'admin' && issue.priority === 'High') {
    const error = new Error('High-priority supervisors must be assigned by the Gov. Officer.');
    error.statusCode = 403;
    throw error;
  }
  return supervisors;
};

const getCoordinates = (body) => ({
  latitude: parseNumber(body.latitude ?? body.coordinates?.latitude ?? body['coordinates[latitude]']),
  longitude: parseNumber(body.longitude ?? body.coordinates?.longitude ?? body['coordinates[longitude]']),
});

const serializeIssue = (issue) => {
  const value = issue.toObject ? issue.toObject() : issue;
  if (value.image) {
    value.image = {
      filename: value.image.filename,
      contentType: value.image.contentType,
      size: value.image.size,
      url: `/api/issues/${value._id}/image`,
    };
  }
  return value;
};

const createIssue = async (req, res, next) => {
  try {
    const title = req.body.title?.trim();
    const description = req.body.description?.trim();
    const category = req.body.category;
    const priority = req.body.priority || 'Medium';
    const address = getLocationValue(req.body, 'address').trim();
    const city = getLocationValue(req.body, 'city').trim();
    const state = getLocationValue(req.body, 'state').trim();
    const pincode = getLocationValue(req.body, 'pincode').trim();
    const coordinates = getCoordinates(req.body);

    if (!title || !description || !category || !address || !city || !state || !pincode) {
      return res.status(400).json({ message: 'Title, description, category, and complete location are required.' });
    }
    if (!['Low', 'Medium', 'High'].includes(priority)) {
      return res.status(400).json({ message: 'Invalid issue priority.' });
    }
    if (Number.isNaN(coordinates.latitude) || Number.isNaN(coordinates.longitude)) {
      return res.status(400).json({ message: 'Location coordinates must be valid numbers.' });
    }
    if ((coordinates.latitude === undefined) !== (coordinates.longitude === undefined)) {
      return res.status(400).json({ message: 'Both latitude and longitude are required together.' });
    }

    const issueData = {
      user: req.user._id,
      title,
      description,
      category,
      location: { address, city, state, pincode },
      priority,
      history: [{ status: 'Pending', priority, remarks: 'Complaint submitted by citizen.', actor: req.user._id }],
      officerApproval: priority === 'High' ? 'Pending' : 'Pending',
      workflowOwner: priority === 'High' ? 'officer' : 'admin',
    };
    if (coordinates.latitude !== undefined) issueData.location.coordinates = coordinates;
    if (req.file) {
      const contentType = detectImageContentType(req.file.buffer);
      if (!contentType) {
        return res.status(400).json({ message: 'The uploaded file is not a supported image.' });
      }
      issueData.image = {
        data: req.file.buffer,
        contentType,
        filename: req.file.originalname,
        size: req.file.size,
      };
    }

    const issue = await Issue.create(issueData);
    const populated = await Issue.findById(issue._id)
      .populate('user', 'name email phone')
      .populate('supervisors', 'name employeeId localBody location phone');
    res.status(201).json(serializeIssue(populated));
  } catch (error) {
    next(error);
  }
};

const getMyIssues = async (req, res, next) => {
  try {
    const issues = await Issue.find({ user: req.user._id }).select('-image.data -image.contentType')
      .populate('user', 'name email')
      .populate('supervisors', 'name employeeId localBody location phone')
      .sort({ createdAt: -1 }).lean();
    res.json(issues.map(serializeIssue));
  } catch (error) {
    next(error);
  }
};

const getAllIssues = async (req, res, next) => {
  try {
    const { status, category, priority, assignedTo, search } = req.query;
    // High-priority complaints belong exclusively to the Gov. Officer workflow.
    const filter = { priority: { $ne: 'High' } };
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority && priority !== 'High') filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (search?.trim()) {
      const expression = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: expression, $options: 'i' } },
        { description: { $regex: expression, $options: 'i' } },
        { 'location.address': { $regex: expression, $options: 'i' } },
        { 'location.city': { $regex: expression, $options: 'i' } },
      ];
    }
    const issues = await Issue.find(filter).select('-image.data -image.contentType')
      .populate('user', 'name email phone')
      .populate('supervisors', 'name employeeId localBody location phone')
      .sort({ createdAt: -1 }).lean();
    res.json(issues.map(serializeIssue));
  } catch (error) {
    next(error);
  }
};

const getIssueById = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid issue id.' });
    const issue = await Issue.findById(req.params.id).select('-image.data -image.contentType')
      .populate('user', 'name email phone')
      .populate('supervisors', 'name employeeId localBody location phone')
      .populate('history.actor', 'name role').lean();
    if (!issue) return res.status(404).json({ message: 'Issue not found.' });
    if (req.user.role === 'admin' && issue.priority === 'High') {
      return res.status(403).json({ message: 'High-priority complaints are handled only by the Gov. Officer.' });
    }
    const officerCanView = req.user.role === 'govOfficer' &&
      (issue.priority === 'High' || issue.officerApproval === 'Pending');
    if (req.user.role !== 'admin' && !officerCanView && issue.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this issue.' });
    }
    res.json(serializeIssue(issue));
  } catch (error) {
    next(error);
  }
};

const getIssueImage = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id).select('+image.data +image.contentType user');
    if (!issue?.image?.data) return res.status(404).json({ message: 'Issue image not found.' });
    if (req.user.role === 'admin' && issue.priority === 'High') {
      return res.status(403).json({ message: 'High-priority complaint images are restricted to the Gov. Officer and citizen.' });
    }
    const isOwner = issue.user && issue.user.toString() === req.user._id.toString();
    const canView = req.user.role === 'admin' || req.user.role === 'govOfficer' || isOwner;
    if (!canView) {
      return res.status(403).json({ message: 'Not authorized to view this image.' });
    }
    const imageData = Buffer.isBuffer(issue.image.data)
      ? issue.image.data
      : Buffer.from(issue.image.data.buffer || issue.image.data);
    const detectedContentType = detectImageContentType(imageData);
    if (!detectedContentType) return res.status(415).json({ message: 'Stored complaint image is invalid.' });
    res.set('Content-Type', detectedContentType);
    res.set('Cache-Control', 'private, max-age=300');
    res.send(imageData);
  } catch (error) {
    next(error);
  }
};

const updateIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found.' });
    if (req.user.role === 'admin' && issue.priority === 'High') {
      return res.status(403).json({ message: 'High-priority complaints are handled only by the Gov. Officer.' });
    }
    const {
      status,
      priority,
      assignedTo,
      supervisor,
      supervisors: requestedSupervisors,
      adminRemarks,
      requestOfficerApproval,
    } = req.body;
    const supervisorIds = getSupervisorIds(requestedSupervisors);
    const changed =
      status !== undefined ||
      priority !== undefined ||
      assignedTo !== undefined ||
      supervisor !== undefined ||
      requestedSupervisors !== undefined ||
      adminRemarks !== undefined ||
      requestOfficerApproval === true;
    if (!changed) return res.status(400).json({ message: 'At least one issue field must be updated.' });
    if (status !== undefined && !['Pending', 'In Progress', 'Resolved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid issue status.' });
    }
    if (priority !== undefined && !['Low', 'Medium', 'High'].includes(priority)) {
      return res.status(400).json({ message: 'Invalid issue priority.' });
    }
    if (
      req.user.role === 'admin' &&
      issue.priority !== 'High' &&
      issue.officerApproval !== 'Approved' &&
      requestOfficerApproval !== true &&
      (status !== undefined || assignedTo !== undefined || supervisor !== undefined || requestedSupervisors !== undefined)
    ) {
      return res.status(403).json({ message: 'Get Gov. Officer approval before assigning or progressing this complaint.' });
    }
    if (
      req.user.role === 'admin' &&
      issue.priority === 'High' &&
      (status !== undefined || assignedTo !== undefined || supervisor !== undefined || requestedSupervisors !== undefined || adminRemarks !== undefined)
    ) {
      return res.status(403).json({ message: 'High-priority complaints must be handled by the Gov. Officer.' });
    }
    if (requestOfficerApproval === true) {
      if (issue.priority === 'High') {
        return res.status(400).json({ message: 'High-priority issues are sent to the Gov. Officer automatically.' });
      }
      issue.officerApproval = 'Pending';
      issue.workflowOwner = 'officer';
      issue.approvalRequestedAt = new Date();
      issue.approvalRequestedBy = req.user._id;
    }
    if (status !== undefined) issue.status = status;
    if (priority !== undefined) issue.priority = priority;
    if (assignedTo !== undefined) issue.assignedTo = String(assignedTo).trim();
    if (supervisor !== undefined) issue.supervisor = String(supervisor).trim();
    if (requestedSupervisors !== undefined) {
      const selected = await validateSupervisorAssignment(issue, supervisorIds, req.user.role);
      issue.supervisors = selected.map(({ _id }) => _id);
      issue.supervisor = selected.map(({ name, employeeId }) => `${name} (${employeeId})`).join(', ');
    }
    if (adminRemarks !== undefined) issue.adminRemarks = String(adminRemarks).trim();
    if (priority === 'High') {
      issue.officerApproval = 'Pending';
      issue.workflowOwner = 'officer';
    }
    if (priority && priority !== 'High' && issue.officerApproval === 'Approved') {
      issue.workflowOwner = 'admin';
    }
    issue.history.push({
      status: issue.status,
      priority: issue.priority,
      assignedTo: issue.assignedTo,
      supervisor: issue.supervisor,
      remarks: issue.adminRemarks || issue.officerRemarks,
      actor: req.user._id,
    });
    const updated = await issue.save();
    const populated = await Issue.findById(updated._id).select('-image.data -image.contentType')
      .populate('user', 'name email phone')
      .populate('supervisors', 'name employeeId localBody location phone')
      .populate('history.actor', 'name role');
    res.json(serializeIssue(populated));
  } catch (error) {
    next(error);
  }
};

const deleteIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found.' });
    if (issue.priority === 'High') {
      return res.status(403).json({ message: 'High-priority complaints are handled only by the Gov. Officer.' });
    }
    await issue.deleteOne();
    res.json({ message: 'Issue removed successfully.' });
  } catch (error) {
    next(error);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const [counts, categoryBreakdown] = await Promise.all([
      Issue.aggregate([
        { $match: { priority: { $ne: 'High' } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Issue.aggregate([
        { $match: { priority: { $ne: 'High' } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);
    const byStatus = Object.fromEntries(counts.map(({ _id, count }) => [_id, count]));
    res.json({
      total: counts.reduce((total, item) => total + item.count, 0),
      pending: byStatus.Pending || 0,
      inProgress: byStatus['In Progress'] || 0,
      resolved: byStatus.Resolved || 0,
      rejected: byStatus.Rejected || 0,
      categoryBreakdown,
    });
  } catch (error) {
    next(error);
  }
};

const getOfficerIssues = async (req, res, next) => {
  try {
    const issues = await Issue.find({
      $or: [
        { priority: 'High', status: { $nin: ['Resolved', 'Rejected'] } },
        { officerApproval: 'Pending' },
      ],
    })
      .select('-image.data -image.contentType')
      .populate('user', 'name email phone')
      .sort({ priority: -1, createdAt: -1 })
      .lean();
    res.json(issues.map(serializeIssue));
  } catch (error) {
    next(error);
  }
};

const updateOfficerIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found.' });
    const {
      action,
      status,
      assignedTo,
      supervisor,
      supervisors: requestedSupervisors,
      officerRemarks,
    } = req.body;
    const supervisorIds = getSupervisorIds(requestedSupervisors);

    if (issue.priority !== 'High' && issue.officerApproval !== 'Pending') {
      return res.status(403).json({ message: 'This complaint is not waiting for Gov. Officer action.' });
    }
    if (action === 'approve') {
      issue.officerApproval = 'Approved';
      issue.workflowOwner = 'admin';
      issue.officerRemarks = String(officerRemarks || '').trim();
      issue.approvalRequestedAt = issue.approvalRequestedAt || new Date();
    } else if (action === 'reject') {
      issue.officerApproval = 'Rejected';
      issue.workflowOwner = 'officer';
      issue.status = 'Rejected';
      issue.officerRemarks = String(officerRemarks || '').trim();
    } else if (issue.priority === 'High') {
      if (status !== undefined && !['Pending', 'In Progress', 'Resolved', 'Rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid issue status.' });
      }
      if (status !== undefined) issue.status = status;
      if (assignedTo !== undefined) issue.assignedTo = String(assignedTo).trim();
      if (supervisor !== undefined) issue.supervisor = String(supervisor).trim();
      if (requestedSupervisors !== undefined) {
        const selected = await validateSupervisorAssignment(issue, supervisorIds, req.user.role);
        issue.supervisors = selected.map(({ _id }) => _id);
        issue.supervisor = selected.map(({ name, employeeId }) => `${name} (${employeeId})`).join(', ');
      }
      if (officerRemarks !== undefined) issue.officerRemarks = String(officerRemarks).trim();
      issue.officerApproval = 'Approved';
      issue.workflowOwner = 'officer';
    } else {
      return res.status(400).json({ message: 'Choose approve or reject for this complaint.' });
    }

    issue.history.push({
      status: issue.status,
      priority: issue.priority,
      assignedTo: issue.assignedTo,
      supervisor: issue.supervisor,
      remarks: issue.officerRemarks || 'Gov. Officer action recorded.',
      actor: req.user._id,
    });
    const updated = await issue.save();
    const populated = await Issue.findById(updated._id)
      .select('-image.data -image.contentType')
      .populate('user', 'name email phone')
      .populate('supervisors', 'name employeeId localBody location phone')
      .populate('history.actor', 'name role');
    res.json(serializeIssue(populated));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createIssue,
  getMyIssues,
  getAllIssues,
  getIssueById,
  getIssueImage,
  updateIssue,
  deleteIssue,
  getDashboardStats,
  getOfficerIssues,
  updateOfficerIssue,
};
