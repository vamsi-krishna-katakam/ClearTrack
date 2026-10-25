import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    default: 'General Compliance',
    trim: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deadline: {
    type: Date,
    required: true
  },
  progressStatus: {
    type: String,
    enum: ['Pending', 'In Progress', 'Submitted for Review'],
    default: 'Pending'
  },
  reviewStatus: {
    type: String,
    enum: ['Not Reviewed', 'Verified', 'Changes Requested'],
    default: 'Not Reviewed'
  },
  completionNotes: {
    type: String,
    default: ''
  },
  latestReviewComment: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Derived status: Overdue is calculated dynamically, never stored
taskSchema.virtual('isOverdue').get(function() {
  if (this.reviewStatus === 'Verified') return false;
  return new Date() > this.deadline;
});

taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

const Task = mongoose.model('Task', taskSchema);
export default Task;
