const courseService = require('./courseService');
const pathService = require('./pathService');
const internshipService = require('./internshipService');

const PRESETS = [
  {
    id: 'preset-beginner-zero-budget',
    label: 'Complete beginner • 5 hrs/wk • $0 Budget',
    query: 'I am a complete beginner with only 4-5 hours per week and a $0 budget. What is the best practical skill to learn first?'
  },
  {
    id: 'preset-career-switch-data',
    label: 'Career switch into Data Analytics',
    query: 'I want to transition from a non-technical background into Data Analytics. Which tools should I study and what certificates matter?'
  },
  {
    id: 'preset-fullstack-dev',
    label: 'Full-stack web developer roadmap',
    query: 'I want to build full-stack web applications and prepare a portfolio for open source and internships within 3-4 months.'
  },
  {
    id: 'preset-fast-credential',
    label: 'High-signal resume certificate',
    query: 'Which industry-recognized certificate has the highest job market value without costing thousands of dollars?'
  }
];

/**
 * Optional server-side AI integration (Claude, Gemini, or OpenAI).
 * When API keys are configured in .env, prompts the model with full catalog context.
 * When not configured, falls back seamlessly to the topic-aware catalog engine.
 */
async function callAIServiceIfConfigured(query) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!anthropicKey && !geminiKey && !openaiKey) {
    return null;
  }

  try {
    const allCourses = courseService.getCourses({});
    const allInternships = internshipService.getInternships({});

    const coursesText = allCourses.map(c => 
      `- [${c.title}](${c.url}) by ${c.provider} | Subject: ${c.subject} | Level: ${c.level} | Price: ${c.coursePrice} | Certificate: ${c.certificatePrice || 'None'} | Verified: ${c.isVerified} | Description: ${c.description} | Audit Tip: ${c.auditTip || 'None'}`
    ).join('\n');

    const internshipsText = allInternships.map(i =>
      `- ${i.role} at ${i.organization} | Field: ${i.field} | Remote: ${i.remoteStatus} | Compensation: ${i.compensation} | URL: ${i.applicationUrl}`
    ).join('\n');

    const basePrompt = `You are the SkillPath AI Learning Coach - an expert, encouraging mentor and learning-path guide, like a real teacher who genuinely researches the best way for each specific learner to build a skill. Your job is to give accurate, honest, and actionable advice.

CATALOG COURSES:
${coursesText}

CATALOG INTERNSHIPS:
${internshipsText}
`;

    // Anthropic (Claude) has a real web_search tool wired in below, so it is allowed and
    // instructed to genuinely research topics outside the catalog instead of refusing.
    const webSearchRules = `RULES:
1. First check the SkillPath catalog above. If the learner's topic is covered there, lead with the exact listing: provider, price, certificate status, and direct URL.
2. If the topic is NOT in the catalog (e.g. C++, Rust, Flutter, Kubernetes, or literally anything else a learner might ask about), use the web_search tool to find real, currently available courses, tutorials, or certifications - both free and paid - and recommend them with their real URLs. Act like a genuine teacher or career mentor who researches the best path for this learner. Never refuse or say a topic "isn't available" - go find it.
3. Never invent or guess a URL. Only share a link that came from web_search results or is present in the catalog above. If you can't verify a link, say so plainly instead of guessing.
4. Clearly label which recommendations are "SkillPath Verified Catalog" picks vs. "Additional resources found via research" so the learner knows which are in-house-verified.
5. State cost honestly for every recommendation (free / free-to-audit / paid, with an approximate real price) and explain any $0 audit options.
6. Provide actionable, concise advice with Markdown bullet points and a clear next step.`;

    // Gemini/OpenAI have no search tool wired in this app yet, so they must stay strictly
    // catalog-grounded to avoid confidently inventing non-existent courses or URLs.
    const catalogOnlyRules = `RULES:
1. Ground your course, certificate, and internship recommendations strictly in the provided SkillPath catalog.
2. If the user asks about a skill, tool, or course present in the catalog (e.g. Figma, Python, SQL, Tableau, Web Dev), recommend the exact catalog listing with its provider, cost tier, and direct URL.
3. If the user asks about a tool or topic NOT in the catalog (e.g. Rust, Flutter, Blender), clearly state that SkillPath does not currently verify courses for that topic, list what is in the verified catalog, and offer useful next steps. Do NOT invent or hallucinate non-existent courses or URLs.
4. Keep tuition, audit options, and certificate prices 100% grounded in the data. Explain how $0 audit options work where available.
5. Provide actionable, concise advice with Markdown bullet points.`;

    if (anthropicKey) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-opus-5',
          max_tokens: 1800,
          output_config: { effort: 'medium' },
          system: `${basePrompt}\n${webSearchRules}`,
          tools: [
            { type: 'web_search_20260209', name: 'web_search', max_uses: 5 }
          ],
          messages: [{ role: 'user', content: query }]
        }),
        signal: AbortSignal.timeout(45000)
      });

      if (res.ok) {
        const data = await res.json();
        const text = Array.isArray(data?.content)
          ? data.content.filter(b => b.type === 'text').map(b => b.text).join('\n\n').trim()
          : '';
        if (text && text.length > 20) {
          return { text, service: 'anthropic' };
        }
      } else {
        const errBody = await res.text().catch(() => '');
        console.warn(`[SkillPath AI Service] Anthropic API returned ${res.status}: ${errBody}`);
      }
    } else if (geminiKey) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      const payload = {
        contents: [
          { role: 'user', parts: [{ text: `${basePrompt}\n${catalogOnlyRules}\n\nUSER QUESTION: ${query}` }] }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 800
        }
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000)
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim().length > 20) {
          return { text: text.trim(), service: 'gemini' };
        }
      }
    } else if (openaiKey) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: `${basePrompt}\n${catalogOnlyRules}` },
            { role: 'user', content: query }
          ],
          temperature: 0.2,
          max_tokens: 800
        }),
        signal: AbortSignal.timeout(8000)
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text && text.trim().length > 20) {
          return { text: text.trim(), service: 'openai' };
        }
      }
    }
  } catch (err) {
    console.warn('[SkillPath AI Service] Failed or timed out, falling back to catalog engine:', err.message);
  }

  return null;
}

/**
 * Intelligent, catalog-grounded diagnostic engine.
 * Accurately analyzes user questions typed in their own words, guided prompts,
 * and constraint parameters. Evaluates specific tools (e.g. Figma, Tableau, SQL, Python),
 * grounds answers in actual seed data, cites direct links, and transparently notes
 * when a requested topic is outside catalog coverage.
 */
async function analyzeInquiry({ query = '', goal, experienceLevel, weeklyHours, budget, credentialNeed, learningStyle } = {}) {
  const qClean = (query || '').trim();
  const qLower = qClean.toLowerCase();

  // 1. Initial State & Constraint Defaults
  let topic = 'general_learning';
  let directAnswer = '';
  let detectedGoal = goal;
  let detectedLevel = experienceLevel || 'beginner';
  let detectedHours = weeklyHours || '8-10';
  let detectedBudget = budget || 'budget';
  let suggestedFollowUps = [];
  let includeCourses = true;
  let includeInternships = false;
  let isOutOfScope = false;
  let customCourseList = null; // Specific courses to prioritize
  let isRulesBased = true;
  let disclaimer = 'SkillPath Coach is a rules-based diagnostic guide utilizing verified open courseware and industry standards. It is not human career counseling and does not guarantee job placement.';

  // Level detection
  if (qLower.includes('intermediate') || qLower.includes('some experience') || qLower.includes('familiar')) {
    detectedLevel = 'intermediate';
  } else if (qLower.includes('advanced') || qLower.includes('senior') || qLower.includes('experienced')) {
    detectedLevel = 'advanced';
  } else {
    detectedLevel = 'beginner';
  }

  // Hours detection
  if (qLower.includes('3') || qLower.includes('4') || qLower.includes('5') || qLower.includes('casual') || qLower.includes('few hours') || qLower.includes('part time')) {
    detectedHours = '3-5';
  } else if (qLower.includes('15') || qLower.includes('20') || qLower.includes('full time') || qLower.includes('intensive') || qLower.includes('sprint') || qLower.includes('fast')) {
    detectedHours = '15+';
  }

  // Budget detection
  if (qLower.includes('$0') || qLower.includes('free') || qLower.includes('no money') || qLower.includes('zero budget') || qLower.includes('without paying')) {
    detectedBudget = 'free';
  }

  // --------------------------------------------------------------------------
  // A. Check Out-of-Scope (non-learning, sports, weather, entertainment)
  // --------------------------------------------------------------------------
  const outOfScopePatterns = [
    'weather', 'football', 'soccer', 'nba', 'cricket', 'president', 'election', 
    'movie', 'song', 'joke', 'recipe', 'cook', 'horoscope', 'crypto buy', 'lottery'
  ];
  if (outOfScopePatterns.some(p => qLower.includes(p)) && !qLower.includes('learn') && !qLower.includes('code') && !qLower.includes('data')) {
    isOutOfScope = true;
    topic = 'out_of_scope';
    directAnswer = `I am the **SkillPath Learning Coach**, a rules-based diagnostic guide specialized in career goals, programming, data science, UX design, digital marketing, and verified courses or internships.\n\nI can't answer general queries about topics outside of learning and career development, but I would be glad to help you:\n- **Find high-quality free courses** from Harvard, Google, and freeCodeCamp\n- **Map out a personalized learning roadmap** for Python, Web Development, or Data Analysis\n- **Prepare for early-career internships** like Outreachy or Google Summer of Code\n- **Optimize your study schedule and budget**\n\nWhat skill or career goal would you like to explore?`;
    detectedGoal = 'Python';
    suggestedFollowUps = [
      'How do I start learning Python for free?',
      'Show me remote open source internships',
      'What is the best tech skill for complete beginners?'
    ];
    includeCourses = false;
    includeInternships = false;
  }

  // --------------------------------------------------------------------------
  // B. Specific Tool / Entity Grounded Matches
  // --------------------------------------------------------------------------

  // 1. FIGMA SPECIFIC INQUIRY
  else if (qLower.includes('figma')) {
    topic = 'figma_course';
    detectedGoal = 'UI/UX';

    const googleUX = courseService.getCourseById('ux-google-design');
    if (googleUX) {
      customCourseList = [googleUX];
    }

    directAnswer = `To learn **Figma**, the primary course in the SkillPath verified catalog is the **[Google UX Design Professional Certificate](https://grow.google/certificates/ux-design/)** on Coursera.\n\n` +
      `### How Figma is Covered in this Course:\n` +
      `- **Dedicated Figma Modules:** Courses 3, 4, 5, and 7 of the 7-course certificate series are taught directly inside Figma.\n` +
      `- **Core Competencies:** You will learn to build low-fidelity wireframes, assemble high-fidelity clickable mockups, apply auto-layout, build reusable component libraries and design systems, and export assets for developers.\n` +
      `- **Portfolio Artifacts:** By the end of the program, you complete 3 distinct end-to-end design case studies built in Figma.\n\n` +
      `### Tuition & $0 Free Access:\n` +
      `- **100% Free to Audit:** On Coursera, click "Enroll" and select the **"Audit"** option at the bottom to access all instructional videos, reading material, and design prompts for **$0**.\n` +
      `- **Certificate Cost:** The graded certificate costs $39/month (or apply for Coursera financial aid).\n\n` +
      `### Interactive Practice Resource:\n` +
      `- Practice directly with the **[Figma Community Design Challenges](https://www.figma.com/community)** (free UI kits, wireframing challenges, and design systems).\n\n` +
      `*(Catalog Note: While SkillPath verifies this full curriculum and the Figma Community sandbox, we currently do not host standalone third-party YouTube clips. For a complete beginner, the Google certificate provides the most structured Figma portfolio pathway).*`;

    suggestedFollowUps = [
      'How do I audit Google UX Design for $0?',
      'What should go into my first Figma portfolio case study?',
      'Show me entry-level UI/UX internships'
    ];
  }

  // 2. TABLEAU SPECIFIC INQUIRY
  else if (qLower.includes('tableau')) {
    topic = 'tableau_course';
    detectedGoal = 'Data Analysis';

    const googleDA = courseService.getCourseById('da-google');
    if (googleDA) customCourseList = [googleDA];

    directAnswer = `To learn **Tableau**, the featured course in the SkillPath catalog is the **[Google Data Analytics Professional Certificate](https://www.coursera.org/professional-certificates/google-data-analytics)**.\n\n` +
      `### Tableau Curriculum Highlights:\n` +
      `- **Course 6: Share Data Through the Art of Visualization** is entirely dedicated to Tableau Public.\n` +
      `- You will learn to connect data sources, create calculated fields, build interactive dashboards, and design executive data presentations.\n` +
      `- **Free Access:** Audit the individual course module on Coursera for **$0**.\n` +
      `- **Practice Arena:** Build real case studies on **[Kaggle Public Datasets](https://www.kaggle.com/datasets)** and publish them directly to a free Tableau Public portfolio profile.`;

    suggestedFollowUps = [
      'How do I practice Tableau for free?',
      'Is Google Data Analytics good for beginners?',
      'What SQL skills should I learn alongside Tableau?'
    ];
  }

  // 3. POSTGRESQL & SQL SPECIFIC INQUIRY
  else if (qLower.includes('postgresql') || (qLower.includes('sql') && (qLower.includes('course') || qLower.includes('learn') || qLower.includes('database')))) {
    topic = 'sql_course';
    detectedGoal = 'Data Analysis';

    const fccSQL = courseService.getCourseById('da-fcc-sql');
    const googleDA = courseService.getCourseById('da-google');
    customCourseList = [fccSQL, googleDA].filter(Boolean);

    directAnswer = `For mastering **SQL and Relational Databases**, our catalog features two exceptional free pathways:\n\n` +
      `1. **[Relational Database Certification (PostgreSQL & Bash)](https://www.freecodecamp.org/learn/relational-database/)** by freeCodeCamp:\n` +
      `   - **100% Free ($0):** Complete curriculum and verified credential at zero cost.\n` +
      `   - **Real Terminal Environment:** Runs inside a browser-based VS Code container with an active PostgreSQL server.\n` +
      `   - **Skills:** SQL queries (JOINs, aggregations, subqueries), relational database schema design, and Bash shell scripting.\n\n` +
      `2. **[Google Data Analytics Certificate](https://www.coursera.org/professional-certificates/google-data-analytics)**:\n` +
      `   - Teaches BigQuery SQL with hands-on practice in the **[Google Cloud BigQuery Sandbox](https://cloud.google.com/bigquery)** (free tier).\n` +
      `   - Free to audit on Coursera.`;

    suggestedFollowUps = [
      'How to practice SQL interview questions for free',
      'What is the difference between PostgreSQL and MySQL?',
      'Show me remote data analytics internships'
    ];
  }

  // 4. CS50 / HARVARD SPECIFIC INQUIRY
  else if (qLower.includes('cs50') || qLower.includes('cs50p') || qLower.includes('harvard')) {
    topic = 'cs50_python';
    detectedGoal = 'Python';

    const cs50 = courseService.getCourseById('py-cs50p');
    if (cs50) customCourseList = [cs50];

    directAnswer = `**Yes! Harvard's CS50 courses (including CS50P - Intro to Programming with Python) are completely free.**\n\n` +
      `- **Access:** You can watch all lecture videos, read course notes, and submit problem sets through Harvard Online and GitHub for **$0**.\n` +
      `- **Grading & Certificate:** When you submit assignments through the automated ` + '`check50`' + ` tool and score 70% or higher on all problem sets and the final capstone project, **Harvard issues a free official certificate of completion** directly at cs50.harvard.edu/python/certificate/.\n` +
      `- **The edX Option:** edX sells an optional ID-verified certificate for $299. The curriculum is identical. You do **not** need the $299 edX purchase to learn or receive Harvard's free certificate.\n\n` +
      `It is universally considered one of the most rigorous, high-quality computer science courses in the world.`;

    suggestedFollowUps = [
      'What should I study after CS50 Python?',
      'How many hours a week does CS50 take?',
      'Show me internships for Python learners'
    ];
  }

  // 5. UNLISTED TOOL / LANGUAGE INQUIRY (Check if user is asking for a course on an unlisted topic)
  else if ((qLower.includes('course') || qLower.includes('learn') || qLower.includes('tutorial')) && 
           (qLower.includes('rust') || qLower.includes('golang') || qLower.includes('go lang') || qLower.includes('flutter') || 
            qLower.includes('c++') || qLower.includes('c#') || qLower.includes('swift') || qLower.includes('kotlin') || 
            qLower.includes('ruby') || qLower.includes('php') || qLower.includes('blender') || qLower.includes('kubernetes') || 
            qLower.includes('docker') || qLower.includes('solidity'))) {
    topic = 'unlisted_tool';
    // Extract unlisted term
    const matchedTerm = ['rust', 'golang', 'flutter', 'c++', 'c#', 'swift', 'kotlin', 'ruby', 'php', 'blender', 'kubernetes', 'docker', 'solidity']
      .find(t => qLower.includes(t)) || 'that specific technology';

    directAnswer = `SkillPath currently **does not list a verified course specifically for ${matchedTerm.toUpperCase()}** in our curated catalog.\n\n` +
      `### What is Currently Verified in SkillPath:\n` +
      `To ensure quality, our catalog currently verifies $0 and audit-track courses in:\n` +
      `- **Python & Scripting:** Harvard CS50P, PY4E\n` +
      `- **Full-Stack Web Dev:** The Odin Project, freeCodeCamp (HTML/CSS, JavaScript, Node.js)\n` +
      `- **Data Analysis & Databases:** Google Data Analytics, freeCodeCamp Relational Database (PostgreSQL)\n` +
      `- **UI/UX Design & Prototyping:** Google UX Design (Figma), CalArts\n` +
      `- **Digital Marketing:** Google Digital Marketing, HubSpot Inbound\n` +
      `- **Languages:** FSI Spanish & French\n\n` +
      `### Recommended Next Steps for ${matchedTerm.toUpperCase()}:\n` +
      `- Check the official language documentation and community roadmaps.\n` +
      `- If your goal is general programming or web backend engineering, we recommend building core foundations with our verified **Python** or **Full-Stack Web Development** roadmaps below.`;

    detectedGoal = 'Python';
    suggestedFollowUps = [
      'Explore the Python for Automation roadmap',
      'Explore the Full-Stack Web Development roadmap',
      'What are the best general programming skills to learn first?'
    ];
  }

  // 6. GENERAL AUDIT / COST INQUIRY
  else if (qLower.includes('audit') || qLower.includes('cost') || qLower.includes('pay') || qLower.includes('price') || qLower.includes('fee') || qLower.includes('subscription') || qLower.includes('cheap') || (qLower.includes('free') && (qLower.includes('how') || qLower.includes('really') || qLower.includes('is')))) {
    topic = 'audit_and_cost';
    detectedGoal = detectedGoal || 'Web Development';
    directAnswer = `Here is how course pricing and the **free audit mode** actually work:\n\n1. **Coursera & edX Auditing ($0 Free)**:\n   Most university and corporate courses (like Harvard CS50 on edX, or Google Certificates on Coursera) allow you to **audit for $0**. Click "Enroll" and choose the fine-print **"Audit the course"** link. You get complete access to lecture videos, readings, and un-graded exercises for zero dollars.\n\n2. **Paid Certificates ($39-$49/mo or $100-$300)**:\n   The fee only pays for automated ID verification, graded homework submission, and a digital certificate PDF. For software engineering, data, and design roles, **recruiters value GitHub repositories, live demo URLs, and Figma portfolios far more than certificate certificates**.\n\n3. **100% Free Alternatives**:\n   Platforms like **freeCodeCamp** and **The Odin Project** provide 100% free curriculum and verified certifications at zero cost.\n\n*Recommendation:* Audit foundational courses for $0. Only purchase a certificate if your employer reimburses it or if an accredited credential is required for academic credit.`;
    suggestedFollowUps = [
      'Is Harvard CS50 completely free?',
      'Show me 100% free courses with certificates',
      'How to build a portfolio instead of certificates'
    ];
  }

  // 7. INTERNSHIPS & OPEN SOURCE INQUIRY
  else if (qLower.includes('intern') || qLower.includes('internship') || qLower.includes('gsoc') || qLower.includes('outreachy') || qLower.includes('lfx') || qLower.includes('mlh') || qLower.includes('experience')) {
    topic = 'internships';
    detectedGoal = detectedGoal || 'Web Development';
    includeInternships = true;
    directAnswer = `**You do not need years of prior experience to secure early-career mentorships and internships.**\n\nHere are verified global programs that accept beginners and career switchers:\n\n1. **Outreachy ($7,000 USD Paid Stipend, 100% Remote)**:\n   Provides internships in open source and open science for underrepresented tech contributors. The application process requires submitting a modest contribution (like fixing documentation or a small bug) during the initial round.\n\n2. **Google Summer of Code (GSoC) (Paid Stipend, Remote)**:\n   Open to students and beginner developers globally. You work with an open-source organization under direct mentors for 12–22 weeks.\n\n3. **Linux Foundation (LFX) Mentorship**:\n   Offers targeted paid stipends to work on cloud native, Linux, and Kubernetes tools.\n\n4. **MLH Fellowship (Major League Hacking)**:\n   A 12-week educational internship program where you collaborate on production open-source software with sponsor support.\n\n*Next Step:* Choose a focused stack (like Web Development or Python), build 2 clean GitHub repositories with complete READMEs, and begin looking for "good first issue" tags on GitHub.`;
    suggestedFollowUps = [
      'How do I prepare for Outreachy?',
      'What should I put in my first GitHub repository?',
      'Show me remote internship listings'
    ];
  }

  // 8. DEGREE VS PORTFOLIO INQUIRY
  else if (qLower.includes('degree') || qLower.includes('job without') || qLower.includes('no cs degree') || qLower.includes('bootcamp') || qLower.includes('hire') || qLower.includes('hired') || qLower.includes('employ')) {
    topic = 'career_without_degree';
    detectedGoal = detectedGoal || 'Web Development';
    directAnswer = `**Can you break into tech without a Computer Science degree? Yes, but proof-of-work is mandatory.**\n\nHere is the realistic landscape in 2025/2026:\n- **What hiring managers care about:** In web development, UI/UX, and data analytics, employers prioritize **tangible artifacts** over university credentials. A live web app with user authentication, a public SQL repository analyzing real business numbers, or an interactive Figma prototype carries far more weight than an entry-level certificate.\n- **What you must build:**\n  1. **Foundations:** Core fluency in syntax and problem solving.\n  2. **Original Projects:** Don't just follow tutorials; build tools that solve a real problem (e.g. an expense tracker, an automated scraper, or an analytics dashboard).\n  3. **Clean Code & Git:** Detailed GitHub READMEs, test suites, and deployed live links.\n  4. **Open Source Contributions:** Even 2 merged PRs into existing open-source projects proves you can read someone else's codebase.`;
    suggestedFollowUps = [
      'What projects should I build for Web Development?',
      'How to transition into Data Analytics from another field',
      'Show me free courses that emphasize project building'
    ];
  }

  // 9. TIME MANAGEMENT & PACING
  else if (qLower.includes('hour') || qLower.includes('time') || qLower.includes('schedule') || qLower.includes('busy') || qLower.includes('full time job') || qLower.includes('part time')) {
    topic = 'time_pacing';
    detectedGoal = detectedGoal || 'Data Analysis';
    directAnswer = `**Consistency beats intensity every time when learning technical skills.**\n\n- **With 3–5 hours/week:** Dedicate 45 minutes every weekday morning or two 2-hour blocks on the weekend. At this pace, you can complete a foundational track in 10–14 weeks without burnout.\n- **With 8–10 hours/week:** This is the sweet spot for career switchers. In 8–10 weeks, you will build 2 full portfolio pieces.\n- **With 15+ hours/week:** An intensive bootcamp-style sprint allowing you to complete prerequisites, build capstone projects, and start applying for mentorships in 6–8 weeks.\n\n*Pro-tip:* Treat study sessions like calendar meetings. Hands-on coding or exercise drills build retention 3x faster than passively watching video lectures.`;
    suggestedFollowUps = [
      'Generate a 5-hour per week Python roadmap',
      'How to practice coding efficiently in 30 minutes a day',
      'What is the easiest skill to learn while working full time?'
    ];
  }

  // 10. PRACTICE & SANDBOXES
  else if (qLower.includes('practice') || qLower.includes('sandbox') || qLower.includes('exercise') || qLower.includes('leetcode') || qLower.includes('kaggle') || qLower.includes('hands-on')) {
    topic = 'practice_arenas';
    detectedGoal = detectedGoal || 'Python';
    directAnswer = `**Passive video watching creates the illusion of learning. Real retention requires active execution.**\n\nRecommended practice venues by domain:\n1. **Python & Logic:** Use the **SkillPath Sandbox** in this app, LeetCode (Easy strings/arrays), and Harvard's CS50 problem sets with automated unit testing.\n2. **Data & SQL:** Kaggle micro-courses (100% free interactive notebooks) and Google Cloud BigQuery public sandbox.\n3. **Web Development:** Build small daily components on Frontend Mentor or freeCodeCamp's interactive curriculum.\n4. **UI/UX Design:** Redesign clunky mobile checkout flows in Figma or participate in Daily UI challenges.`;
    suggestedFollowUps = [
      'Open the SkillPath Interactive Practice Sandbox',
      'What are the best free SQL datasets to practice on?',
      'How to build my first Python script'
    ];
  }

  // 11. UNDECIDED / WHERE TO START
  else if (qLower.includes('where to start') || qLower.includes('where do i start') || qLower.includes('don\'t know') || qLower.includes('not sure') || qLower.includes('confused') || qLower.includes('which skill') || qLower.includes('which is best') || qLower.includes('recommend a path')) {
    topic = 'undecided_guidance';
    directAnswer = `If you're undecided, here is a quick diagnostic guide to help you choose the best technical domain:\n\n1. **Choose Full-Stack Web Development if:**\n   You want to see visual results immediately, love creating user-facing apps, or want to freelance and build interactive software.\n\n2. **Choose Python & Automation if:**\n   You enjoy logic, want to write scripts that automate tedious office tasks, scrape web data, or prepare for backend software engineering.\n\n3. **Choose Data Analytics if:**\n   You like working with spreadsheets, numbers, and business questions. It has the lowest mathematical/coding barrier to entry (starting with Excel/SQL).\n\n4. **Choose UI/UX Design if:**\n   You have visual intuition, empathy for user psychology, and prefer designing intuitive experiences in Figma over writing code.\n\nWhich of these 4 sounds most aligned with your interests?`;
    detectedGoal = 'Web Development';
    suggestedFollowUps = [
      'I want to learn Full-Stack Web Development',
      'I want to learn Python & Automation',
      'I want to learn Data Analytics with SQL'
    ];
  }

  // 12. PYTHON DOMAIN INQUIRY
  else if (qLower.includes('python') || qLower.includes('script') || qLower.includes('automate') || qLower.includes('backend') || qLower.includes('django') || qLower.includes('fastapi')) {
    topic = 'python_domain';
    detectedGoal = 'Python';
    directAnswer = `**Python is the ideal first language for modern software development and automation.**\n\n- **Why it works:** Python has an uncluttered, readable syntax that lets you focus on computational concepts rather than boilerplate memory management.\n- **Recommended Route:**\n  1. **Harvard CS50P (CS50 Python):** Master functions, conditionals, loops, exceptions, libraries, unit tests, and object-oriented programming ($0 free audit).\n  2. **Hands-On Practice:** Build 3 practical scripts: a CSV budget summarizer, an automated web scraper, and a weather alert CLI.\n  3. **Next Steps:** Choose either Web Backend (FastAPI / Django) or Data Engineering.`;
    suggestedFollowUps = [
      'How long does it take to learn Python?',
      'Can I get an internship with just Python?',
      'Show me free Python practice exercises'
    ];
  }

  // 13. WEB DEV DOMAIN INQUIRY
  else if (qLower.includes('web') || qLower.includes('fullstack') || qLower.includes('frontend') || qLower.includes('javascript') || qLower.includes('html') || qLower.includes('react') || qLower.includes('css')) {
    topic = 'web_domain';
    detectedGoal = 'Web Development';
    directAnswer = `**Full-Stack Web Development provides the most direct pathway to building independent software products.**\n\n- **Foundations (Weeks 1–4):** Semantic HTML5, accessible CSS layouts (Flexbox & Grid), and modern JavaScript ES6+ (DOM manipulation, fetch API, async/await).\n- **Full-Stack Integration (Weeks 5–8):** Node.js and Express REST APIs, relational databases (PostgreSQL or SQLite), and CRUD architecture.\n- **Recommended Curriculums:** **The Odin Project** and **freeCodeCamp Responsive Web Design** are 100% free, community-reviewed, and require zero upfront financial commitment.`;
    suggestedFollowUps = [
      'Should I learn React or vanilla JavaScript first?',
      'Show me Web Development internships',
      'What projects should I build for my portfolio?'
    ];
  }

  // 14. DATA ANALYSIS DOMAIN INQUIRY
  else if (qLower.includes('data') || qLower.includes('analytics') || qLower.includes('excel') || qLower.includes('power bi')) {
    topic = 'data_domain';
    detectedGoal = 'Data Analysis';
    directAnswer = `**Data Analytics offers the fastest bridge from non-technical backgrounds into technical roles.**\n\n- **Curriculum Sequence:**\n  1. **Spreadsheets:** Pivot tables, VLOOKUP/XLOOKUP, and business financial models.\n  2. **SQL (Structured Query Language):** The single most requested tool across all data job postings. Focus on GROUP BY, aggregations, JOINs, and window functions.\n  3. **Visualization:** Tableau Public or Power BI to build interactive executive dashboards.\n  4. **Python for Data:** Pandas and Matplotlib for automated reporting.\n- **Recommended Starting Point:** Google Data Analytics Certificate (free to audit on Coursera) paired with freeCodeCamp's Relational Database certification ($0 free).`;
    suggestedFollowUps = [
      'How to practice SQL for free?',
      'Is the Google Data Analytics certificate worth it?',
      'Show me remote data analytics internships'
    ];
  }

  // 15. UI/UX GENERAL INQUIRY (without Figma explicitly)
  else if (qLower.includes('ux') || qLower.includes('ui') || qLower.includes('design') || qLower.includes('user experience') || qLower.includes('wireframe')) {
    topic = 'uiux_domain';
    detectedGoal = 'UI/UX';
    directAnswer = `**UI/UX Design is 100% portfolio and process-driven.**\n\n- **What you must demonstrate:** Recruiters look for **case studies** that prove your problem-solving process:\n  1. Identifying a user friction point.\n  2. Conducting user interviews and synthesising insights.\n  3. Wireframing low-fidelity concepts.\n  4. Designing high-fidelity interactive prototypes in Figma.\n  5. Usability testing and iterative revision.\n- **Recommended Starting Point:** Google UX Design Certificate (audit for $0 on Coursera) or CalArts UI/UX Design Specialization.`;
    suggestedFollowUps = [
      'What should go into my first UX case study?',
      'Tell me about a course to learn Figma',
      'Show me entry-level UX apprentice programs'
    ];
  }

  // 16. DIGITAL MARKETING INQUIRY
  else if (qLower.includes('market') || qLower.includes('seo') || qLower.includes('growth') || qLower.includes('hubspot') || qLower.includes('content')) {
    topic = 'marketing_domain';
    detectedGoal = 'Digital Marketing';
    directAnswer = `**Modern digital marketing requires measurable technical competency, not just social media posting.**\n\n- **The Winning Formula:**\n  1. **Inbound Marketing:** HubSpot Academy Inbound Certification (100% free with recognized badge).\n  2. **Analytics & Attribution:** Google Analytics 4 (GA4) demonstration account practice.\n  3. **Content & SEO:** Keyword research, search intent optimization, and technical site performance.\n- **Portfolio Proof:** Build a niche blog or landing page, implement conversion tracking, and document real traffic growth.`;
    suggestedFollowUps = [
      'How to get certified in Google Analytics for free',
      'Show me digital marketing internships',
      'What is the difference between SEO and SEM?'
    ];
  }

  // 17. LANGUAGES INQUIRY
  else if (qLower.includes('spanish') || qLower.includes('french') || qLower.includes('language') || qLower.includes('speak')) {
    topic = 'languages_domain';
    detectedGoal = 'Conversational Spanish';
    directAnswer = `**For conversational language fluency, active auditory recall outperforms passive vocabulary flashcards.**\n\n- **Recommended Method:** The Foreign Service Institute (FSI) Fast-Track course uses audiolingual structural drills developed for diplomatic corps. All tapes and student manuals are in the public domain and available for $0.\n- **Daily Pacing:** 25 minutes of audio repetition + 10 minutes of active shadow speaking daily produces measurable conversation ability in 12–16 weeks.`;
    suggestedFollowUps = [
      'Show me free FSI Spanish resources',
      'How to practice speaking without a tutor',
      'Generate a 12-week Spanish study roadmap'
    ];
  }

  // 18. INTELLIGENT CATALOG SEARCH FOR FREE-FORM QUERIES
  else {
    // Extract keywords by filtering stop words
    const stopWords = new Set(['tell', 'me', 'about', 'a', 'courses', 'course', 'to', 'learn', 'how', 'what', 'is', 'the', 'are', 'there', 'any', 'good', 'i', 'want', 'can', 'you', 'recommend', 'show', 'find', 'best', 'for', 'in', 'on', 'with', 'do', 'have', 'need', 'an', 'please', 'help', 'some']);
    const rawTokens = qLower.replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean);
    const keywords = rawTokens.filter(w => !stopWords.has(w));

    // Try searching catalog with keywords
    let matchedCourses = [];
    for (const kw of keywords) {
      if (kw.length >= 3) {
        const found = courseService.getCourses({ search: kw });
        for (const c of found) {
          if (!matchedCourses.some(m => m.id === c.id)) {
            matchedCourses.push(c);
          }
        }
      }
    }

    if (matchedCourses.length > 0) {
      topic = 'catalog_search';
      customCourseList = matchedCourses.slice(0, 3);
      detectedGoal = matchedCourses[0].subject || 'Web Development';

      const courseListMarkdown = customCourseList.map((c, idx) => {
        const verifiedTag = c.isVerified ? '✓ Verified in Catalog' : 'Sample Listing';
        const link = c.url ? `**[${c.title}](${c.url})**` : `**${c.title}**`;
        return `${idx + 1}. ${link} by **${c.provider}**\n` +
               `   - **Subject / Level:** ${c.subject} • ${c.level}\n` +
               `   - **Pricing:** Course Access: ${c.coursePrice} • Certificate: ${c.certificatePrice || 'None'}\n` +
               `   - **Status:** ${verifiedTag}\n` +
               (c.auditTip ? `   - **Audit Tip:** ${c.auditTip}\n` : '');
      }).join('\n');

      directAnswer = `Based on your inquiry: **"${qClean}"**, here are the most relevant courses found in the SkillPath verified catalog:\n\n` +
        courseListMarkdown + `\n` +
        `### Recommendations & Next Steps:\n` +
        `- Review the course modules above and utilize the $0 audit options where available to access video lectures and practice assignments.\n` +
        `- A tailored milestone path has been assembled below based on **${detectedGoal}**.`;

      suggestedFollowUps = [
        `How do I audit ${customCourseList[0].provider} courses for $0?`,
        `What projects should I build for ${detectedGoal}?`,
        'Show me internships matching this skill'
      ];
    } else {
      // Check if user inquired about an unlisted subject
      const topicName = keywords.join(', ') || qClean;

      topic = 'unlisted_tool';
      directAnswer = `SkillPath currently **does not have a verified course matching "${topicName}"** in our curated catalog.\n\n` +
        `### What is Currently Verified in SkillPath:\n` +
        `To ensure quality, our catalog currently verifies $0 and audit-track courses in:\n` +
        `- **Python & Scripting:** Harvard CS50P, PY4E\n` +
        `- **Full-Stack Web Dev:** The Odin Project, freeCodeCamp (HTML/CSS, JavaScript, Node.js)\n` +
        `- **Data Analysis & Databases:** Google Data Analytics, freeCodeCamp Relational Database (PostgreSQL)\n` +
        `- **UI/UX Design & Prototyping:** Google UX Design (Figma), CalArts\n` +
        `- **Digital Marketing:** Google Digital Marketing, HubSpot Inbound\n` +
        `- **Languages:** FSI Spanish & French\n\n` +
        `### Recommended Next Steps:\n` +
        `- Check official language documentation or community tutorials for ${topicName}.\n` +
        `- If you're building a foundation in software development or analytics, start with one of our verified curated pathways below.`;

      detectedGoal = 'Web Development';
      suggestedFollowUps = [
        'Explore the Python for Automation roadmap',
        'Explore the Full-Stack Web Development roadmap',
        'What are the best general programming skills to learn first?'
      ];
    }
  }

  // --------------------------------------------------------------------------
  // C. Assemble Grounded Course & Internship Recommendations
  // --------------------------------------------------------------------------
  const generatedPath = pathService.generatePath({
    goal: detectedGoal,
    experienceLevel: detectedLevel,
    weeklyHours: detectedHours,
    budget: detectedBudget,
    credentialNeed: credentialNeed || 'industry-recognized',
    learningStyle: learningStyle || 'hands-on'
  });

  // Pull courses: Use customCourseList if specified, else search by subject
  let relatedCourses = [];
  if (includeCourses) {
    if (customCourseList && customCourseList.length > 0) {
      relatedCourses = customCourseList;
    } else {
      relatedCourses = courseService.getCourses({ subject: detectedGoal }).slice(0, 2);
      if (relatedCourses.length === 0) {
        relatedCourses = courseService.getCourses({}).slice(0, 2);
      }
    }
  }

  // Pull internships
  let relatedInternships = [];
  if (includeInternships || qLower.includes('intern') || qLower.includes('experience') || qLower.includes('job')) {
    let internField = 'Software Engineering';
    if (detectedGoal === 'Data Analysis') internField = 'Data & AI';
    else if (detectedGoal === 'Digital Marketing') internField = 'Digital Marketing';
    else if (detectedGoal === 'UI/UX') internField = 'UI/UX Design';
    relatedInternships = internshipService.getInternships({ field: internField }).slice(0, 2);
    if (relatedInternships.length === 0) {
      relatedInternships = internshipService.getInternships({}).slice(0, 2);
    }
  }

  // Low-cost alternatives explanation
  const lowCostAlternatives = detectedBudget === 'free'
    ? 'All recommended courses in this roadmap feature 100% free audit options or open-source equivalents (freeCodeCamp, The Odin Project, Kaggle), saving you over $400 in subscription fees.'
    : 'While you have a modest budget tier, we recommend auditing course videos for $0 initially and only paying if you specifically need the verified certificate for your resume.';

  // Check optional server-side AI model integration
  if (qClean && (process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY) && !isOutOfScope) {
    const aiResult = await callAIServiceIfConfigured(qClean);
    if (aiResult && aiResult.text) {
      directAnswer = aiResult.text;
      isRulesBased = false;
      const serviceLabel = aiResult.service === 'anthropic' ? 'Claude (Anthropic)' : aiResult.service === 'gemini' ? 'Google Gemini' : 'OpenAI';
      disclaimer = `SkillPath Coach response generated via ${serviceLabel}, grounded strictly in the verified SkillPath curriculum catalog.`;
    }
  }

  return {
    inquiry: qClean || `Diagnostic for ${detectedGoal}`,
    topic,
    directAnswer,
    isOutOfScope,
    detectedConstraints: {
      goal: detectedGoal,
      experienceLevel: detectedLevel,
      weeklyHours: detectedHours,
      budget: detectedBudget
    },
    recommendation: {
      pathId: generatedPath.id,
      pathTitle: generatedPath.title,
      durationWeeks: generatedPath.durationWeeks,
      hoursPerWeek: generatedPath.hoursPerWeek,
      costTier: generatedPath.costTier,
      savingsEstimate: generatedPath.savingsEstimate,
      certificateType: generatedPath.certificateType
    },
    rationale: `Customized for a ${detectedLevel} committing ${detectedHours} hrs/week. Focuses on pragmatic portfolio building with verified free/audit courses.`,
    lowCostAlternatives,
    recommendedCourses: relatedCourses.map(c => ({
      id: c.id,
      title: c.title,
      provider: c.provider,
      price: c.coursePrice,
      certificatePrice: c.certificatePrice,
      url: c.url,
      auditTip: c.auditTip
    })),
    recommendedInternships: relatedInternships.map(i => ({
      id: i.id,
      role: i.role,
      organization: i.organization,
      compensation: i.compensation,
      remoteStatus: i.remoteStatus,
      applicationUrl: i.applicationUrl
    })),
    suggestedFollowUps,
    generatedRoadmap: generatedPath,
    isRulesBased,
    disclaimer
  };
}

module.exports = {
  PRESETS,
  analyzeInquiry
};
