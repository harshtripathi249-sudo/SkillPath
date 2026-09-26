const fs = require('fs');
const path = require('path');

const SEED_FILE = path.join(__dirname, '..', 'data', 'seed.json');

function loadData() {
  try {
    const raw = fs.readFileSync(SEED_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading seed data:', err.message);
    return { courses: [], learningPaths: [] };
  }
}

/**
 * Filter and search courses with validation
 */
function getCourses({ search, subject, level, price, certificateStatus, featured } = {}) {
  const data = loadData();
  let results = [...data.courses];

  if (featured === 'true' || featured === true) {
    results = results.filter(c => c.isFeatured === true);
  }

  if (subject && subject !== 'all') {
    const sLower = subject.toLowerCase();
    results = results.filter(c => c.subject.toLowerCase() === sLower || c.subject.toLowerCase().includes(sLower));
  }

  if (level && level !== 'all') {
    const lLower = level.toLowerCase();
    results = results.filter(c => c.level.toLowerCase().includes(lLower) || c.level.toLowerCase() === 'all levels');
  }

  if (price && price !== 'all') {
    if (price === 'free') {
      results = results.filter(c => c.isCourseFree === true);
    } else if (price === 'paid') {
      results = results.filter(c => c.isCourseFree === false);
    }
  }

  if (certificateStatus && certificateStatus !== 'all') {
    results = results.filter(c => c.certificateStatus === certificateStatus);
  }

  if (search && search.trim()) {
    const query = search.trim().toLowerCase();
    results = results.filter(c => {
      const inTitle = c.title.toLowerCase().includes(query);
      const inProvider = c.provider.toLowerCase().includes(query);
      const inSubject = c.subject.toLowerCase().includes(query);
      const inDesc = c.description.toLowerCase().includes(query);
      const inTags = Array.isArray(c.tags) && c.tags.some(t => t.toLowerCase().includes(query));
      return inTitle || inProvider || inSubject || inDesc || inTags;
    });
  }

  return results;
}

function getCourseById(id) {
  const data = loadData();
  return data.courses.find(c => c.id === id) || null;
}

function getCourseStats() {
  const data = loadData();
  const verifiedCount = data.courses.filter(c => c.isVerified).length;
  const sampleCount = data.courses.length - verifiedCount;
  const freeCourseCount = data.courses.filter(c => c.isCourseFree).length;
  const subjects = [...new Set(data.courses.map(c => c.subject))];

  return {
    totalCourses: data.courses.length,
    verifiedCount,
    sampleCount,
    freeCourseCount,
    subjects
  };
}

module.exports = {
  loadData,
  getCourses,
  getCourseById,
  getCourseStats
};
