// Ensure tests run deterministically against the local catalog rules
process.env.OPENAI_API_KEY = '';
process.env.ANTHROPIC_API_KEY = '';
process.env.GEMINI_API_KEY = '';

const assert = require('assert');
const app = require('../backend/server');
const http = require('http');

let server;
const PORT = 3001;

function makeRequest(path, method = 'GET', postData = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('Starting SkillPath API integration tests...');
  server = app.listen(PORT);

  try {
    // 1. Healthcheck
    const health = await makeRequest('/api/health');
    assert.strictEqual(health.status, 200, 'Healthcheck status should be 200');
    assert.strictEqual(health.body.status, 'healthy');
    console.log('✓ Healthcheck passed');

    // 2. Courses API
    const coursesRes = await makeRequest('/api/courses');
    assert.strictEqual(coursesRes.status, 200);
    assert.ok(coursesRes.body.count >= 10, 'Should return at least 10 courses');
    console.log(`✓ Get courses passed (${coursesRes.body.count} courses found)`);

    // 3. Courses Filter by Subject
    const pythonCourses = await makeRequest('/api/courses?subject=Python');
    assert.strictEqual(pythonCourses.status, 200);
    assert.ok(pythonCourses.body.data.length >= 2, 'Should find Python courses');
    console.log(`✓ Subject filter passed (${pythonCourses.body.data.length} Python courses)`);

    // 4. Learning Paths API
    const pathsRes = await makeRequest('/api/paths');
    assert.strictEqual(pathsRes.status, 200);
    assert.ok(pathsRes.body.count >= 4, 'Should return curated learning paths');
    console.log(`✓ Get paths passed (${pathsRes.body.count} paths found)`);

    // 5. Generate Path with Constraints
    const genRes = await makeRequest('/api/paths/generate', 'POST', {
      goal: 'Python',
      experienceLevel: 'beginner',
      weeklyHours: '8-10',
      budget: 'free',
      credentialNeed: 'course-completion',
      learningStyle: 'hands-on'
    });
    assert.strictEqual(genRes.status, 200);
    assert.ok(genRes.body.data.id, 'Generated path should have ID');
    assert.strictEqual(genRes.body.data.budgetPreference, 'free');
    console.log('✓ Generate path with constraints passed');

    // 6. Validate Course Stats
    const statsRes = await makeRequest('/api/courses/stats');
    assert.strictEqual(statsRes.status, 200);
    assert.ok(statsRes.body.data.verifiedCount > 0);
    console.log(`✓ Course stats verified: ${statsRes.body.data.verifiedCount} verified, ${statsRes.body.data.sampleCount} sample`);

    // 7. Internships API
    const internRes = await makeRequest('/api/internships');
    assert.strictEqual(internRes.status, 200);
    assert.ok(internRes.body.count >= 5, 'Should return at least 5 internships');
    console.log(`✓ Get internships passed (${internRes.body.count} internships found)`);

    // 8. Internships Remote Filter
    const remoteIntern = await makeRequest('/api/internships?remoteStatus=Remote');
    assert.strictEqual(remoteIntern.status, 200);
    assert.ok(remoteIntern.body.data.length >= 4, 'Should find remote internships');
    console.log(`✓ Remote internships filter passed (${remoteIntern.body.data.length} found)`);

    // 9. Coach Presets
    const presetsRes = await makeRequest('/api/coach/presets');
    assert.strictEqual(presetsRes.status, 200);
    assert.ok(presetsRes.body.data.length >= 3, 'Should have coach presets');
    console.log(`✓ Coach presets passed (${presetsRes.body.data.length} presets found)`);

    // 10. Coach Diagnostic Inquiry
    const coachRes = await makeRequest('/api/coach/ask', 'POST', {
      query: 'I want to transition into Data Analytics with 8 hrs/week',
      goal: 'Data Analysis'
    });
    assert.strictEqual(coachRes.status, 200);
    assert.ok(coachRes.body.data.recommendation.pathTitle);
    assert.ok(coachRes.body.data.rationale);
    assert.ok(coachRes.body.data.recommendedCourses.length > 0);
    console.log(`✓ Coach diagnostic passed (Recommended: ${coachRes.body.data.recommendation.pathTitle})`);

    // 11. Coach Custom User Question - CS50 Pricing & Free Audit
    const cs50Res = await makeRequest('/api/coach/ask', 'POST', {
      query: 'Is CS50 Python really free or do I have to pay edX?'
    });
    assert.strictEqual(cs50Res.status, 200);
    assert.strictEqual(cs50Res.body.data.topic, 'cs50_python');
    assert.ok(cs50Res.body.data.directAnswer.includes('Harvard'));
    assert.ok(cs50Res.body.data.directAnswer.includes('free'));
    assert.strictEqual(cs50Res.body.data.isRulesBased, true);
    console.log('✓ Coach open-ended question (CS50 free status) passed');

    // 12. Coach Custom User Question - Internships & Mentorships
    const internQueryRes = await makeRequest('/api/coach/ask', 'POST', {
      query: 'How do I apply for Outreachy or Google Summer of Code?'
    });
    assert.strictEqual(internQueryRes.status, 200);
    assert.strictEqual(internQueryRes.body.data.topic, 'internships');
    assert.ok(internQueryRes.body.data.directAnswer.includes('Outreachy'));
    assert.ok(internQueryRes.body.data.recommendedInternships.length > 0);
    console.log('✓ Coach open-ended question (Internships & GSoC/Outreachy) passed');

    // 13. Coach Custom User Question - Degree vs Portfolio
    const degreeQueryRes = await makeRequest('/api/coach/ask', 'POST', {
      query: 'Can I get a software engineering job without a computer science degree?'
    });
    assert.strictEqual(degreeQueryRes.status, 200);
    assert.strictEqual(degreeQueryRes.body.data.topic, 'career_without_degree');
    assert.ok(degreeQueryRes.body.data.directAnswer.includes('GitHub'));
    console.log('✓ Coach open-ended question (Degree vs Portfolio proof) passed');

    // 14. Coach Out-of-Scope Query Handling
    const outOfScopeRes = await makeRequest('/api/coach/ask', 'POST', {
      query: 'What is the weather forecast for tomorrow?'
    });
    assert.strictEqual(outOfScopeRes.status, 200);
    assert.strictEqual(outOfScopeRes.body.data.isOutOfScope, true);
    assert.ok(outOfScopeRes.body.data.directAnswer.includes('SkillPath Learning Coach'));
    console.log('✓ Coach out-of-scope question polite redirection passed');

    // 15. Coach Figma Specific Course Inquiry (Exact user test query)
    const figmaRes = await makeRequest('/api/coach/ask', 'POST', {
      query: 'Tell me about a course to learn Figma.'
    });
    assert.strictEqual(figmaRes.status, 200);
    assert.strictEqual(figmaRes.body.data.topic, 'figma_course');
    assert.strictEqual(figmaRes.body.data.recommendedCourses.length, 1);
    assert.strictEqual(figmaRes.body.data.recommendedCourses[0].id, 'ux-google-design');
    assert.ok(figmaRes.body.data.directAnswer.includes('Google UX Design Professional Certificate'));
    assert.ok(figmaRes.body.data.directAnswer.includes('Figma Community'));
    console.log('✓ Coach Figma-specific query grounded in catalog passed');

    // 16. Coach Unlisted Tool Inquiry (Honest fallback without hallucination)
    const unlistedRes = await makeRequest('/api/coach/ask', 'POST', {
      query: 'Tell me about a course to learn Rust.'
    });
    assert.strictEqual(unlistedRes.status, 200);
    assert.strictEqual(unlistedRes.body.data.topic, 'unlisted_tool');
    assert.ok(unlistedRes.body.data.directAnswer.includes('does not list a verified course specifically for RUST'));
    console.log('✓ Coach unlisted tool query honest fallback passed');

    // 17. Coach Free-Form Catalog Search Inquiry
    const fccRes = await makeRequest('/api/coach/ask', 'POST', {
      query: 'What courses does freeCodeCamp offer?'
    });
    assert.strictEqual(fccRes.status, 200);
    assert.strictEqual(fccRes.body.data.topic, 'catalog_search');
    assert.ok(fccRes.body.data.recommendedCourses.some(c => c.provider === 'freeCodeCamp'));
    assert.ok(fccRes.body.data.directAnswer.includes('freeCodeCamp'));
    console.log('✓ Coach free-form catalog search inquiry passed');

    console.log('All API tests passed successfully!');
  } finally {
    server.close();
  }
}

runTests().catch(err => {
  console.error('Test failure:', err);
  if (server) server.close();
  process.exit(1);
});

