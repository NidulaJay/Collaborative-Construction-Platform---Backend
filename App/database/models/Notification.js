const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  type: { type: String, required: true,enum: ['project', 'message', 'task', 'document']},
  seen: { type: Boolean, default: false },
  time: { type: Date, default: Date.now },
  userId: {type: mongoose.Schema.Types.ObjectId,ref: 'User',required: true},
  userEmail: {type: String,required: true}
}, {
  timestamps: true 
});

notificationSchema.virtual('id').get(function() {
  return this._id;
});

notificationSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;