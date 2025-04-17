const DoubtThreadSchema = new mongoose.Schema({
    section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'Instructor', required: true },
  }, { timestamps: true });
  
  const MessageSchema = new mongoose.Schema({
    threadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoubtThread',
      required: true
    },
    senderType: {
      type: String,
      enum: ['user', 'instructor'],
      required: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Instructor',
        required: true
    },
    messageText: {
      type: [String],
      required: true
    },
    attachments: [String],
  }, {timestamps: true});
  