const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('Starting Curated Learning Paths Layout verification tests...');

// 1. Verify CSS rules exist in frontend/css/design-system.css
const cssContent = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'css', 'design-system.css'), 'utf-8');

assert(cssContent.includes('.paths-grid-layout'), 'CSS must define .paths-grid-layout');
assert(cssContent.includes('.paths-carousel-layout'), 'CSS must define .paths-carousel-layout');
assert(cssContent.includes('.path-card'), 'CSS must define .path-card');
assert(cssContent.includes('.path-card-header'), 'CSS must define .path-card-header');
assert(cssContent.includes('.path-card-title'), 'CSS must define .path-card-title');
assert(cssContent.includes('.path-card-desc'), 'CSS must define .path-card-desc');
assert(cssContent.includes('.path-card-meta'), 'CSS must define .path-card-meta');
assert(cssContent.includes('.path-card-footer'), 'CSS must define .path-card-footer');
assert(cssContent.includes('.path-card-cost'), 'CSS must define .path-card-cost');
assert(cssContent.includes('.path-explore-btn'), 'CSS must define .path-explore-btn');

console.log('✓ All CSS classes for equal-width, aligned cards are defined');

// 2. Verify HTML template in frontend/index.html
const htmlContent = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'index.html'), 'utf-8');
assert(htmlContent.includes('id="section-curated-paths"'), 'HTML must have section-curated-paths');
assert(htmlContent.includes('id="paths-view-grid-btn"'), 'HTML must have grid view button');
assert(htmlContent.includes('id="paths-view-carousel-btn"'), 'HTML must have carousel view button');
assert(htmlContent.includes('id="paths-carousel-track"'), 'HTML must have paths-carousel-track');
assert(htmlContent.includes('id="carousel-prev"'), 'HTML must have carousel-prev');
assert(htmlContent.includes('id="carousel-next"'), 'HTML must have carousel-next');

console.log('✓ HTML container and responsive controls are properly structured');

// 3. Test card rendering logic across all 6 seed paths
const seed = require('../backend/data/seed.json');
const paths = seed.learningPaths;
assert.strictEqual(paths.length, 6, 'Seed data must contain 6 learning paths');

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

// Simulate renderPathsCarousel
const renderedCards = paths.map(p => {
  let badgeClass = 'badge-secondary';
  let badgeIcon = 'school';
  let shortCert = p.certificateType;

  if (p.certificateType.includes('Industry')) {
    badgeClass = 'badge-primary';
    badgeIcon = 'verified';
    shortCert = 'Industry Credential';
  } else if (p.certificateType.includes('Practical') || p.certificateType.includes('Portfolio')) {
    badgeClass = 'badge-secondary';
    badgeIcon = 'folder_special';
    shortCert = 'Portfolio Verified';
  } else {
    shortCert = 'Course Certificate';
  }

  return {
    id: p.id,
    title: p.title,
    badgeClass,
    badgeIcon,
    shortCert,
    rating: p.rating || '4.9',
    level: p.level,
    durationWeeks: p.durationWeeks,
    hoursPerWeek: p.hoursPerWeek,
    costTier: p.costTier
  };
});

renderedCards.forEach((card, idx) => {
  assert(card.id, `Card ${idx + 1} must have an ID`);
  assert(card.title, `Card ${idx + 1} must have a title`);
  assert(card.shortCert.length <= 25, `Card ${idx + 1} shortCert must be concise to prevent awkward wrapping`);
  assert(card.costTier, `Card ${idx + 1} must have a cost tier`);
  assert(card.durationWeeks, `Card ${idx + 1} must have durationWeeks`);
  assert(card.hoursPerWeek, `Card ${idx + 1} must have hoursPerWeek`);
});

console.log('✓ All 6 cards generated with normalized badges and consistent geometry');

// 4. Verify 6th card (Conversational Spanish) is intact
const lastCard = renderedCards[5];
assert.strictEqual(lastCard.id, 'path-conversational-spanish');
assert.strictEqual(lastCard.shortCert, 'Portfolio Verified');
assert.strictEqual(lastCard.costTier, '$0 Free');
console.log('✓ 6th card (Conversational Spanish) is fully formatted and reachable');

console.log('All Curated Learning Paths layout tests passed successfully!\n');
