const Event = require('../models/Event');
const { broadcast } = require('../config/socket');

// @desc    Create a new event
// @route   POST /api/events
const createEvent = async (req, res) => {
  const { title, description, date, time, location } = req.body;

  const event = await Event.create({
    society: req.user.society,
    title,
    description,
    date,
    time,
    location,
    createdBy: req.user._id,
  });

  await event.populate('createdBy', 'name');

  // Trigger real-time alert via socket
  broadcast('notification', {
    title: `🎉 Upcoming Event: ${title}`,
    message: `Join us on ${new Date(date).toLocaleDateString()} at ${time} in ${location}`,
    type: 'general',
    link: '/resident/events'
  });

  res.status(201).json({ success: true, data: event });
};

// @desc    Get all events
// @route   GET /api/events
const getEvents = async (req, res) => {
  const { timeline, page = 1, limit = 20 } = req.query;
  const query = { society: req.user.society };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (timeline === 'upcoming') {
    query.date = { $gte: today };
  } else if (timeline === 'past') {
    query.date = { $lt: today };
  }

  const events = await Event.find(query)
    .populate('createdBy', 'name')
    .sort({ date: timeline === 'past' ? -1 : 1, time: 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Event.countDocuments(query);

  res.status(200).json({
    success: true,
    count,
    pages: Math.ceil(count / limit),
    data: events,
  });
};

// @desc    RSVP to an event
// @route   POST /api/events/:id/rsvp
const rsvpEvent = async (req, res) => {
  const { rsvp } = req.body; // true or false
  const event = await Event.findOne({ _id: req.params.id, society: req.user.society });

  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  const userId = req.user._id.toString();
  const index = event.attendees.findIndex(id => id.toString() === userId);

  if (rsvp && index === -1) {
    event.attendees.push(userId);
  } else if (!rsvp && index !== -1) {
    event.attendees.splice(index, 1);
  }

  await event.save();
  res.status(200).json({ success: true, data: event });
};

// @desc    Delete event
// @route   DELETE /api/events/:id
const deleteEvent = async (req, res) => {
  const event = await Event.findOne({ _id: req.params.id, society: req.user.society });
  
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
  
  await event.deleteOne();
  res.status(200).json({ success: true, message: 'Event deleted successfully' });
};

module.exports = { createEvent, getEvents, rsvpEvent, deleteEvent };
