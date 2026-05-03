const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const { auth, checkRole } = require('../middleware/auth');

// Get tasks for user
router.get('/', auth, async (req, res) => {
  try {
    const { projectId, status } = req.query;
    let query = {};
    
    if (req.user.role !== 'Admin') {
      // Members see only their tasks
      query.assignedTo = req.user._id;
    }
    
    if (projectId) query.project = projectId;
    if (status) query.status = status;
    
    const tasks = await Task.find(query)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');
    
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tasks by project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    let query = { project: req.params.projectId };
    
    if (req.user.role !== 'Admin') {
      query.assignedTo = req.user._id;
    }
    
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');
    
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create task (with role-based assignment validation)
router.post('/', auth, [
  body('title').notEmpty().trim(),
  body('description').notEmpty(),
  body('project').notEmpty(),
  body('assignedTo').notEmpty(),
  body('dueDate').isISO8601(),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Urgent'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Check if project exists and user has access
    const project = await Project.findById(req.body.project);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const hasAccess = req.user.role === 'Admin' ||
      project.owner.toString() === req.user._id.toString() ||
      project.teamMembers.some(m => m.user.toString() === req.user._id.toString());
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }
    
    // ROLE-BASED VALIDATION: Members can only assign tasks to themselves
    if (req.user.role !== 'Admin' && req.body.assignedTo !== req.user._id.toString()) {
      return res.status(403).json({ 
        error: 'Members can only assign tasks to themselves. Please create task for yourself.' 
      });
    }
    
    // Check if assigned user exists
    const assignedUser = await User.findById(req.body.assignedTo);
    if (!assignedUser) {
      return res.status(404).json({ error: 'Assigned user not found' });
    }
    
    // Create task
    const task = new Task({
      ...req.body,
      assignedBy: req.user._id
    });
    
    await task.save();
    
    // Populate task details
    const populatedTask = await Task.findById(task._id)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');
    
    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update task status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['Pending', 'In Progress', 'Completed', 'Overdue'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Check if user is assigned to task or is admin
    const isAssigned = task.assignedTo.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';
    
    if (!isAssigned && !isAdmin) {
      return res.status(403).json({ error: 'Access denied. You can only update your own tasks.' });
    }
    
    task.status = status;
    if (status === 'Completed') {
      task.completedAt = new Date();
    }
    
    await task.save();
    
    const updatedTask = await Task.findById(task._id)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');
    
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update task (full update)
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Check if user is admin or task creator or assigned user
    const isAdmin = req.user.role === 'Admin';
    const isTaskCreator = task.assignedBy.toString() === req.user._id.toString();
    const isAssignedUser = task.assignedTo.toString() === req.user._id.toString();
    
    if (!isAdmin && !isTaskCreator && !isAssignedUser) {
      return res.status(403).json({ error: 'Access denied. Only admins, task creators, or assigned users can update tasks.' });
    }
    
    // Members cannot reassign tasks to others
    if (!isAdmin && req.body.assignedTo && req.body.assignedTo !== task.assignedTo.toString()) {
      return res.status(403).json({ error: 'Members cannot reassign tasks to other users.' });
    }
    
    const updates = ['title', 'description', 'status', 'priority', 'dueDate'];
    updates.forEach(update => {
      if (req.body[update] !== undefined) {
        task[update] = req.body[update];
      }
    });
    
    if (task.status === 'Completed' && !task.completedAt) {
      task.completedAt = new Date();
    }
    
    await task.save();
    
    const updatedTask = await Task.findById(task._id)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');
    
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete task (Admin OR Task Creator OR Assigned User)
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Allow Admin OR the user who created the task OR the user assigned to task
    const isAdmin = req.user.role === 'Admin';
    const isTaskCreator = task.assignedBy.toString() === req.user._id.toString();
    const isAssignedUser = task.assignedTo.toString() === req.user._id.toString();
    
    if (!isAdmin && !isTaskCreator && !isAssignedUser) {
      return res.status(403).json({ 
        error: 'Access denied. Only task creator, assigned user, or admin can delete.' 
      });
    }
    
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get task statistics for dashboard
router.get('/stats/summary', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'Admin') {
      query.assignedTo = req.user._id;
    }
    
    const tasks = await Task.find(query);
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'Pending').length;
    const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
    const overdueTasks = tasks.filter(t => t.status === 'Overdue').length;
    
    res.json({
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      overdueTasks
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;