const fs = require('fs');
const path = require('path');

const SEED_FILE = path.join(__dirname, '..', 'data', 'seed.json');

// In-memory runtime cache for paths with user progress updates
let runtimeData = null;

function getRuntimeData() {
  if (!runtimeData) {
    try {
      const raw = fs.readFileSync(SEED_FILE, 'utf8');
      runtimeData = JSON.parse(raw);
    } catch (err) {
      console.error('Error loading seed data for pathService:', err.message);
      runtimeData = { courses: [], learningPaths: [] };
    }
  }
  return runtimeData;
}

function getAllPaths() {
  const data = getRuntimeData();
  return data.learningPaths || [];
}

function getPathById(idOrSlug) {
  const data = getRuntimeData();
  return (data.learningPaths || []).find(
    p => p.id === idOrSlug || p.slug === idOrSlug
  ) || null;
}

/**
 * Generate a distinctly personalized learning path based on learner constraints
 * Constraints schema:
 * {
 *   goal: string (e.g. "Data Analysis", "Python", "Web Development", "UI/UX", "Digital Marketing", "Conversational Spanish")
 *   experienceLevel: "beginner" | "intermediate" | "advanced"
 *   weeklyHours: "3-5" | "8-10" | "15+" | number
 *   budget: "free" | "budget" | "flexible"
 *   credentialNeed: "industry-recognized" | "course-completion" | "none"
 *   learningStyle: "hands-on" | "video" | "docs"
 * }
 */
function generatePath(constraints) {
  const data = getRuntimeData();
  const allPaths = data.learningPaths || [];

  // Match category or keyword
  let matchedBase = null;
  const goalStr = (constraints.goal || '').toLowerCase().trim();

  if (goalStr) {
    matchedBase = allPaths.find(p => 
      p.category.toLowerCase().includes(goalStr) ||
      goalStr.includes(p.category.toLowerCase()) ||
      p.title.toLowerCase().includes(goalStr)
    );
  }

  // Default to Data Analytics if no direct match found
  if (!matchedBase) {
    matchedBase = allPaths[0];
  }

  // Deep clone so base template is unaffected
  const customPath = JSON.parse(JSON.stringify(matchedBase));

  // Modify according to weekly hours
  let hoursPerWeekNum = 8;
  if (constraints.weeklyHours === '3-5') hoursPerWeekNum = 4;
  else if (constraints.weeklyHours === '8-10') hoursPerWeekNum = 9;
  else if (constraints.weeklyHours === '15+') hoursPerWeekNum = 16;
  else if (typeof constraints.weeklyHours === 'number') hoursPerWeekNum = constraints.weeklyHours;

  const totalCourseHours = customPath.milestones.reduce((acc, m) => acc + (m.durationHours || 10), 0);
  customPath.hoursPerWeek = hoursPerWeekNum;
  customPath.durationWeeks = Math.max(2, Math.ceil(totalCourseHours / hoursPerWeekNum));

  // Modify according to experience level
  customPath.learnerLevel = constraints.experienceLevel || 'beginner';
  if (constraints.experienceLevel === 'intermediate') {
    if (customPath.milestones.length > 0) {
      customPath.milestones[0].status = 'completed';
      customPath.milestones[0].score = '100% (Skipped via Baseline)';
      if (customPath.milestones.length > 1) {
        customPath.milestones[1].status = 'in-progress';
      }
    }
  } else if (constraints.experienceLevel === 'advanced') {
    if (customPath.milestones.length > 1) {
      customPath.milestones[0].status = 'completed';
      customPath.milestones[1].status = 'completed';
      if (customPath.milestones.length > 2) {
        customPath.milestones[2].status = 'in-progress';
      }
    }
  }

  // Budget Optimization calculation
  customPath.budgetPreference = constraints.budget || 'budget';
  if (constraints.budget === 'free') {
    customPath.costTier = '$0 Free';
    customPath.savingsEstimate = '$450+ saved using 100% open-source & audited paths';
    customPath.budgetMode = true;
  } else if (constraints.budget === 'flexible') {
    customPath.costTier = '$100 - $300 (Reimbursable)';
    customPath.savingsEstimate = 'Proctored certification vouchers included';
    customPath.budgetMode = false;
  } else {
    customPath.costTier = '$0 - $49';
    customPath.savingsEstimate = '$411 saved using audited tracks & open-source sandboxes';
    customPath.budgetMode = true;
  }

  // Target Credential adjustments
  customPath.credentialNeed = constraints.credentialNeed || 'industry-recognized';
  if (constraints.credentialNeed === 'none') {
    customPath.certificateType = 'Practical Skills & Portfolio Only';
    customPath.savingsEstimate = '$0 Credential Fees — Pure Portfolio Focus';
  } else if (constraints.credentialNeed === 'course-completion') {
    customPath.certificateType = 'Course Completion Certificate';
  } else {
    customPath.certificateType = 'Industry-Recognized';
  }

  // Learning style focus
  customPath.learningStyle = constraints.learningStyle || 'hands-on';

  // Overall Path Rationale tailored to user inputs
  customPath.pathRationale = `Customized for a ${customPath.learnerLevel} committing ${customPath.hoursPerWeek} hrs/week with a ${customPath.budgetPreference === 'free' ? '$0 budget' : customPath.budgetPreference} tier. This path sequences foundations first, emphasizes ${customPath.learningStyle} practice, and provides free audit tracks to save up to ${customPath.savingsEstimate}.`;

  // Attach Stage-level rationales, alternatives, and style tips
  customPath.milestones = customPath.milestones.map((m, idx) => {
    let stageRationale = `Sequenced at step ${m.stage} to establish core proficiency before tackling advanced capstone projects.`;
    if (idx === 0) stageRationale = `Prerequisite foundation: Builds core conceptual vocabulary and zero-friction muscle memory.`;
    else if (idx === 1) stageRationale = `Applied technical mastery: Focuses on industry-standard queries, syntax, and workflows.`;
    else if (idx === customPath.milestones.length - 1) stageRationale = `Validation milestone: Synthesizes learned concepts into an externally verifiable portfolio piece or certification exam.`;

    const alternativeSteps = [];
    if (m.freeAlternative) {
      alternativeSteps.push({
        title: m.freeAlternative.title,
        url: m.freeAlternative.url,
        provider: m.freeAlternative.provider,
        cost: '$0 Free',
        reason: 'Free open-source alternative covering identical concepts'
      });
    }

    return {
      ...m,
      stageRationale,
      alternativeSteps,
      learningStyleTip: constraints.learningStyle === 'hands-on'
        ? 'Hands-on focus: spend 70% of your time executing exercises in the sandbox rather than watching lectures passively.'
        : constraints.learningStyle === 'video'
        ? 'Video focus: follow high-density video demonstrations and replicate instructor steps in real time.'
        : 'Docs & Sandboxes focus: refer directly to official language documentation and test concepts in an isolated terminal.'
    };
  });

  // Generated identifier & timestamp
  customPath.generatedId = `gen-${Date.now()}`;
  customPath.generatedAt = new Date().toISOString();

  return customPath;
}

function updateTask(pathId, stageNum, taskId, completed) {
  const data = getRuntimeData();
  const pathItem = data.learningPaths.find(p => p.id === pathId || p.slug === pathId);
  if (!pathItem) return { success: false, error: 'Path not found' };

  const milestone = pathItem.milestones.find(m => m.stage === parseInt(stageNum, 10));
  if (!milestone) return { success: false, error: 'Milestone not found' };

  const task = (milestone.tasks || []).find(t => t.id === taskId);
  if (!task) return { success: false, error: 'Task not found' };

  task.completed = completed;
  return { success: true, task, milestone };
}

function validateModule(pathId, stageNum) {
  const data = getRuntimeData();
  const pathItem = data.learningPaths.find(p => p.id === pathId || p.slug === pathId);
  if (!pathItem) return { success: false, error: 'Path not found' };

  const milestone = pathItem.milestones.find(m => m.stage === parseInt(stageNum, 10));
  if (!milestone) return { success: false, error: 'Milestone not found' };

  milestone.status = 'completed';
  milestone.score = milestone.score || '100% Validated';

  // Unlock next milestone if locked
  const nextMilestone = pathItem.milestones.find(m => m.stage === parseInt(stageNum, 10) + 1);
  if (nextMilestone && nextMilestone.status === 'locked') {
    nextMilestone.status = 'in-progress';
  }

  return { success: true, milestone, nextMilestone };
}

module.exports = {
  getAllPaths,
  getPathById,
  generatePath,
  updateTask,
  validateModule
};
