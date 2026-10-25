import mongoose from 'mongoose';

const evidenceVersionSchema = new mongoose.Schema({
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
    index: true
  },
  versionNumber: {
    type: Number,
    required: true
  },
  evidenceUrls: [{
    type: String,
    required: true,
    trim: true
  }],
  notes: {
    type: String,
    default: '',
    trim: true
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

const EvidenceVersion = mongoose.model('EvidenceVersion', evidenceVersionSchema);
export default EvidenceVersion;
