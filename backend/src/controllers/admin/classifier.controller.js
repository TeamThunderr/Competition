const { initClassifier } = require('../../services/gmail/naiveBayes.classifier');
const { trainingData } = require('../../services/gmail/naiveBayes.training');

const retrainClassifier = (req, res) => {
    try {
        // Trigger a fresh training run
        initClassifier();
        
        return res.status(200).json({
            message: "Classifier retrained",
            examples: trainingData.length
        });
    } catch (error) {
        console.error('[Admin] Retrain Classifier Error:', error);
        return res.status(500).json({ error: "Failed to retrain classifier" });
    }
};

module.exports = { retrainClassifier };
