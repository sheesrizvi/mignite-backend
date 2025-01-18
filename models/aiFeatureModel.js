const mongoose = require('mongoose');

const FeatureEnum = [
  'CHATBOT',
  'RECOMMENDATION',
  'ANALYTICS',
  'AUTOMATION',
];

const AiFeaturePlanSchema  = new mongoose.Schema({
  feature: {
    type: String,
    enum: FeatureEnum,
    required: true,
  },
  plans: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      required: true,
    },
  ],
}, { timestamps: true });

const AiFeaturePlan = mongoose.model('AiFeaturePlan', AiFeaturePlanSchema);

module.exports = AiFeaturePlan;