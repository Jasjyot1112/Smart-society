/**
 * Rule-based NLP Service for Complaint Classification
 * Classifies complaints into categories and assigns priority
 * without any external API dependency.
 */

const categoryKeywords = {
  electrical: [
    'electricity', 'light', 'fan', 'switch', 'wire', 'circuit', 'power', 'outage',
    'short circuit', 'bulb', 'socket', 'plug', 'generator', 'inverter', 'meter',
    'mcb', 'fuse', 'spark', 'shock', 'voltage', 'wiring', 'electrician',
  ],
  plumbing: [
    'water', 'pipe', 'leak', 'drain', 'tap', 'faucet', 'toilet', 'flush',
    'blockage', 'clog', 'sewage', 'drainage', 'bathroom', 'kitchen sink',
    'geyser', 'water heater', 'tank', 'overflow', 'burst', 'plumber', 'seepage',
  ],
  security: [
    'theft', 'stolen', 'break in', 'suspicious', 'intruder', 'cctv', 'camera',
    'guard', 'key', 'lock', 'gate', 'entry', 'unauthorized', 'threat', 'danger',
    'crime', 'robbery', 'violence', 'harassment', 'trespassing',
  ],
  cleanliness: [
    'dirty', 'garbage', 'waste', 'trash', 'bin', 'smell', 'odor', 'stench',
    'cleaning', 'sweep', 'mop', 'hygiene', 'insect', 'pest', 'cockroach',
    'rat', 'mosquito', 'filth', 'unhygienic', 'litter', 'dustbin', 'staircase',
  ],
  noise: [
    'noise', 'loud', 'sound', 'music', 'party', 'disturbance', 'barking',
    'dog', 'drilling', 'construction', 'night', 'sleep', 'peace', 'disturb',
  ],
  lift: [
    'lift', 'elevator', 'stuck', 'floor', 'door', 'cabin', 'motor', 'amc',
    'maintenance', 'broken', 'not working', 'malfunction',
  ],
  parking: [
    'parking', 'car', 'vehicle', 'bike', 'scooter', 'slot', 'block', 'illegally',
    'wrong spot', 'two wheeler', 'four wheeler', 'motorcycle',
  ],
  common_area: [
    'hall', 'lobby', 'corridor', 'staircase', 'roof', 'terrace', 'garden',
    'playground', 'gym', 'pool', 'club', 'notice board', 'mailbox',
  ],
};

const urgentKeywords = [
  'urgent', 'emergency', 'immediately', 'asap', 'danger', 'hazard', 'fire',
  'flood', 'burst', 'explosion', 'gas leak', 'injury', 'accident', 'death',
  'crime', 'theft', 'robbery', 'violence', 'threat', 'short circuit', 'spark',
  'stuck', 'trapped', 'bleeding', 'not working since days', 'days ago',
];

const highPriorityKeywords = [
  'broken', 'not working', 'leaking', 'blocked', 'failed', 'stopped', 'severe',
  'multiple', 'entire', 'whole building', 'no water', 'no electricity', 'days',
];

/**
 * Classify complaint text into a category
 * Returns the best matching category or 'other'
 */
const classifyCategory = (text) => {
  const lowerText = text.toLowerCase();
  const scores = {};

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    scores[category] = 0;
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        // Longer keyword matches score higher
        scores[category] += keyword.split(' ').length;
      }
    }
  }

  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return 'other';

  return Object.keys(scores).find((cat) => scores[cat] === maxScore) || 'other';
};

/**
 * Assign priority based on keywords
 */
const assignPriority = (text) => {
  const lowerText = text.toLowerCase();

  for (const keyword of urgentKeywords) {
    if (lowerText.includes(keyword)) return 'urgent';
  }
  for (const keyword of highPriorityKeywords) {
    if (lowerText.includes(keyword)) return 'high';
  }
  return 'normal';
};

/**
 * Main function: classify a complaint
 * @param {string} title
 * @param {string} description
 * @returns {{ category: string, priority: string }}
 */
const classifyComplaint = (title, description) => {
  const combinedText = `${title} ${description}`;
  const category = classifyCategory(combinedText);
  const priority = assignPriority(combinedText);
  return { category, priority };
};

module.exports = { classifyComplaint, classifyCategory, assignPriority };
