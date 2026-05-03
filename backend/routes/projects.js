const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const User = require('../models/User');
const Task = require('../models/Task');
const { auth } = require('../middleware/auth');

// Get all projects for user
router.get('/', auth, async (req, res) => {
  try {
    let projects;
    if (req.user.role === 'Admin') {
      // Admin sees ALL projects
      projects = await Project.find()
        .populate('owner', 'name email')
        .populate('teamMembers.user', 'name email');
    } else {
      // Members see only their projects (owned or member of)
      projects = await Project.find({
        $or: [
          { owner: req.user._id },
          { 'teamMembers.user': req.user._id }
        ]
      }).populate('owner', 'name email')
        .populate('teamMembers.user', 'name email');
    }
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single project
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('teamMembers.user', 'name email');
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check access
    const hasAccess = req.user.role === 'Admin' ||
      project.owner.toString() === req.user._id.toString() ||
      project.teamMembers.some(m => m.user.toString() === req.user._id.toString());
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create project - Allow EVERYONE (both Admin and Member)
router.post('/', auth, [
  body('name').notEmpty().withMessage('Project name is required').trim(),
  body('description').notEmpty().withMessage('Description is required'),
  body('dueDate').isISO8601().withMessage('Valid due date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    console.log('Creating project for user:', req.user.email, 'Role:', req.user.role);
    console.log('Project data:', req.body);
    
    // Both Admin and Member can create projects
    const project = new Project({
      name: req.body.name,
      description: req.body.description,
      dueDate: req.body.dueDate,
      owner: req.user._id,
      status: 'Active',
      teamMembers: [{ user: req.user._id, role: req.user.role }]
    });
    
    await project.save();
    
    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('teamMembers.user', 'name email');
    
    console.log('Project created successfully:', populatedProject);
    res.status(201).json(populatedProject);
  } catch (error) {
    console.error('Project creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add team member (Admin only)
router.post('/:id/members', auth, async (req, res) => {
  try {
    // Only Admin can add members
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Only admins can add team members' });
    }
    
    const { email, role } = req.body;
    
    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role are required' });
    }
    
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if already a member
    if (project.teamMembers.some(m => m.user.toString() === user._id.toString())) {
      return res.status(400).json({ error: 'User already a team member' });
    }
    
    project.teamMembers.push({ user: user._id, role });
    await project.save();
    
    const updatedProject = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('teamMembers.user', 'name email');
    
    res.json(updatedProject);
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update project (Admin or Project Owner only)
router.put('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check if user is owner or admin
    if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Access denied. Only project owner or admin can update.' });
    }
    
    const updates = ['name', 'description', 'status', 'dueDate'];
    updates.forEach(update => {
      if (req.body[update] !== undefined) {
        project[update] = req.body[update];
      }
    });
    
    await project.save();
    
    const updatedProject = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('teamMembers.user', 'name email');
    
    res.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete project (Admin or Project Owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Allow Admin OR Project Owner to delete
    if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Access denied. Only project owner or admin can delete.' });
    }
    
    // Delete all tasks associated with this project
    await Task.deleteMany({ project: req.params.id });
    
    // Delete the project
    await Project.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Project and all associated tasks deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;