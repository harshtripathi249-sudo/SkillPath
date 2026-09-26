const fs = require('fs');
const path = require('path');

const SEED_FILE = path.join(__dirname, '..', 'data', 'seed.json');

function loadData() {
  try {
    const raw = fs.readFileSync(SEED_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading seed data for internships:', err.message);
    return { internships: [] };
  }
}

function getInternships({ search, remoteStatus, compensation, field } = {}) {
  const data = loadData();
  let results = [...(data.internships || [])];

  if (remoteStatus && remoteStatus !== 'all') {
    const rLower = remoteStatus.toLowerCase();
    results = results.filter(i => i.remoteStatus.toLowerCase() === rLower);
  }

  if (compensation && compensation !== 'all') {
    if (compensation === 'paid') {
      results = results.filter(i => i.isPaid === true);
    } else if (compensation === 'unpaid') {
      results = results.filter(i => i.isPaid === false);
    }
  }

  if (field && field !== 'all') {
    const fLower = field.toLowerCase();
    results = results.filter(i => i.field.toLowerCase().includes(fLower) || fLower.includes(i.field.toLowerCase()));
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    results = results.filter(i => {
      const inRole = i.role.toLowerCase().includes(q);
      const inOrg = i.organization.toLowerCase().includes(q);
      const inField = i.field.toLowerCase().includes(q);
      const inDesc = i.description.toLowerCase().includes(q);
      const inLoc = i.location.toLowerCase().includes(q);
      return inRole || inOrg || inField || inDesc || inLoc;
    });
  }

  return results;
}

function getInternshipById(id) {
  const data = loadData();
  return (data.internships || []).find(i => i.id === id) || null;
}

function getInternshipStats() {
  const data = loadData();
  const list = data.internships || [];
  const verifiedCount = list.filter(i => i.isVerified).length;
  const sampleCount = list.length - verifiedCount;
  const remoteCount = list.filter(i => i.remoteStatus === 'Remote').length;
  const paidCount = list.filter(i => i.isPaid).length;
  const fields = [...new Set(list.map(i => i.field))];

  return {
    totalInternships: list.length,
    verifiedCount,
    sampleCount,
    remoteCount,
    paidCount,
    fields
  };
}

module.exports = {
  getInternships,
  getInternshipById,
  getInternshipStats
};
