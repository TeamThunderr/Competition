const natural = require('natural');
const { trainingData } = require('./naiveBayes.training');

let classifier;

// Initialize and train the classifier on module load
const initClassifier = () => {
    classifier = new natural.BayesClassifier();
    
    // Add documents
    trainingData.forEach(item => {
        classifier.addDocument(item.text, item.label);
    });
    
    // Train the model
    classifier.train();
    console.log(`[NaiveBayes] Classifier trained on ${trainingData.length} examples`);
};

// Initial training
initClassifier();

/**
 * Classifies an email text as 'competition' or 'irrelevant'.
 * Returns confidence based on the scores of the labels.
 * 
 * @param {string} emailText The raw email text snippet or body
 * @returns {object} { label: string, confident: boolean }
 */
const classifyEmail = (emailText) => {
    if (!emailText) return { label: 'irrelevant', confident: false };
    
    const label = classifier.classify(emailText);
    const classifications = classifier.getClassifications(emailText);
    
    // classifications is an array sorted by value descending, e.g. [{ label: 'competition', value: 0.8 }, { label: 'irrelevant', value: 0.2 }]
    // Confident if top score is > 1.5x the second score
    let confident = false;
    if (classifications && classifications.length >= 2) {
        const topScore = classifications[0].value;
        const secondScore = classifications[1].value;
        
        // Handle cases where secondScore might be 0 to avoid division by zero or Infinity
        if (secondScore === 0) {
            confident = true;
        } else {
            confident = (topScore / secondScore) > 1.5;
        }
    } else {
        confident = true; // Only one class evaluated (shouldn't happen with 2 classes, but safe fallback)
    }

    return { label, confident };
};

module.exports = { classifyEmail, initClassifier };
