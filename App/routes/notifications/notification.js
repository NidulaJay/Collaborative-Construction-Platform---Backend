const express = require('express');
const router = express.Router();
const Notification = require('../../database/models/Notification');
const { SessionCheck } = require('../../controllers/userCommonFunctions');

router.use(express.json({ limit: '50mb' }));
router.use(express.urlencoded({ extended: true, limit: '50mb' }));

router.post("/", async (req, res) => {
  try {
    const Session = await SessionCheck(req, res);
    if (Session) {
      const { id, email } = req.body;
      console.log('id is' , id)
      
      if (Session._id.toString() !== id) {
        return res.status(403).json({ error: 'Unauthorized access' });
      }

      const notifications = await Notification.find({ 
        userId: id 
      }).sort({ time: -1 }); 
      
      res.json(notifications);
    }
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/read", async (req, res) => {
  try {
    const Session = await SessionCheck(req, res);
    if (Session) {
      const Nid  = req.body.Nid;
      const UserId  = req.body.user.id;
      const email  = req.body.user.email;
      
      const notification = await Notification.findById(Nid);
      
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      
      if (notification.userId.toString() !== Session._id.toString()) {
        return res.status(403).json({ error: 'Unauthorized access' });
      }
      
      notification.seen = true;
      await notification.save();
      
      res.json({ success: true, notification });
    }
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/mark-all-read", async (req, res) => {
  try {
    const Session = await SessionCheck(req, res);
    if (Session) {
      const { id, email } = req.body;
      
      if (Session._id.toString() !== id) {
        return res.status(403).json({ error: 'Unauthorized access' });
      }
      
      const result = await Notification.updateMany(
        { userId: id, seen: false },
        { $set: { seen: true } }
      );
      
      res.json({ 
        success: true, 
        modifiedCount: result.modifiedCount 
      });
    }
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/unread-count", async (req, res) => {
  try {
    const Session = await SessionCheck(req, res);
    if (Session) {
      const { id, email } = req.body;
      
      if (Session._id.toString() !== id) {
        return res.status(403).json({ error: 'Unauthorized access' });
      }
      
      const count = await Notification.countDocuments({
        userId: id,
        seen: false
      });
      
      res.json({ count });
    }
  } catch (err) {
    console.error('Error counting unread notifications:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/create", async (req, res) => {
  try {
    const notification = new Notification({
      userId: req.body.id,
      userEmail: req.body.email,
      message : req.body.message,
      type : req.body.type,
      seen: false,
      time: new Date()
    });
    
    await notification.save();
    return notification;
  } catch (err) {
    console.error('Error creating notification:', err);
    throw err;
  }
});

module.exports = router;