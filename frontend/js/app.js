/**
 * SkillPath Main Application Controller
 * Handles Light/Dark theme, auto-scrolling hero course showcase, internships,
 * interactive learning coach, questionnaire wizard, roadmap timeline, and sandbox.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Default diagnostic questionnaire answers - also used to reset state.questionnaire
  // back to a clean slate on sign-out, so the next account doesn't inherit answers.
  const DEFAULT_QUESTIONNAIRE = {
    goal: 'Data Analysis',
    experienceLevel: 'beginner',
    weeklyHours: '8-10',
    budget: 'budget',
    credentialNeed: 'industry-recognized',
    learningStyle: 'hands-on'
  };

  // Application State
  const state = {
    theme: 'light',
    currentView: 'explore',
    courses: [],
    paths: [],
    internships: [],
    currentPath: null,
    // True while state.currentPath is the shared guest/showcase sample path
    // rather than a real personalized path generated/saved by a signed-in user.
    currentPathIsDemo: true,
    streakCount: null,
    courseStats: {},
    activeSubjectFilter: 'all',
    searchQuery: '',
    selectedLevel: 'all',
    selectedPrice: 'all',
    selectedCert: 'all',
    isBudgetMode: true,

    // Hero Showcase State
    showcaseIndex: 0,
    showcaseInterval: null,
    isShowcasePaused: false,
    showcaseCourses: [],

    // Learning Paths Slider State
    carouselInterval: null,
    isCarouselPaused: false,

    // Internships Filter State
    internshipFilters: {
      remote: 'all',
      field: 'all',
      pay: 'all',
      search: ''
    },

    // Diagnostic Questionnaire State
    questionnaire: { ...DEFAULT_QUESTIONNAIRE }
  };

  // DOM Elements
  const views = {
    explore: document.getElementById('view-explore'),
    questionnaire: document.getElementById('view-questionnaire'),
    mypath: document.getElementById('view-mypath'),
    practice: document.getElementById('view-practice'),
    catalog: document.getElementById('view-catalog')
  };

  const navItems = document.querySelectorAll('.nav-item');
  const toast = document.getElementById('app-toast');
  const toastMessage = document.getElementById('toast-message');
  const toastClose = document.getElementById('toast-close');

  // Initialize Application
  initApp();

  async function initApp() {
    setupTheme();
    setupNavigation();
    setupTicker();
    setupQuestionnaire();
    setupPracticeSandbox();
    setupLearningCoach();
    setupInternshipFilters();
    setupCatalogSearchAndFilters();
    setupAuthModal();
    setupProfileModal();

    // Load initial data from backend API
    await loadInitialData();

    // Setup showcase & carousel after data is ready
    setupHeroShowcase();
    setupPathsCarousel();

    // Reflect Firebase auth state (if configured) in the header, and restore any
    // saved personalized path/streak for the signed-in user.
    initAuthObserver();
  }

  /* ==========================================================================
     Theme Controller (Light & Dark Mode)
     ========================================================================== */
  function setupTheme() {
    const themeBtn = document.getElementById('theme-toggle-btn');
    const themeIcon = document.getElementById('theme-toggle-icon');

    // Detect saved theme or system preference
    const savedTheme = localStorage.getItem('skillpath_theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

    applyTheme(initialTheme);

    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
        applyTheme(nextTheme);
        localStorage.setItem('skillpath_theme', nextTheme);
      });
    }

    function applyTheme(theme) {
      state.theme = theme;
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        if (themeIcon) themeIcon.textContent = 'light_mode';
        if (themeBtn) themeBtn.title = 'Switch to Light mode';
      } else {
        document.documentElement.classList.remove('dark');
        if (themeIcon) themeIcon.textContent = 'dark_mode';
        if (themeBtn) themeBtn.title = 'Switch to Dark mode';
      }
    }
  }

  /* ==========================================================================
     Data Loading & State Initialization
     ========================================================================== */
  async function loadInitialData() {
    try {
      showGlobalLoading(true);
      const [paths, courses, stats, internships, coachPresets] = await Promise.all([
        window.skillpathApi.getPaths(),
        window.skillpathApi.getCourses(),
        window.skillpathApi.getStats(),
        window.skillpathApi.getInternships(),
        window.skillpathApi.getCoachPresets()
      ]);

      state.paths = paths;
      state.courses = courses;
      state.courseStats = stats;
      state.internships = internships;
      state.currentPath = paths[0] ? sanitizePathForPreview(paths[0]) : null;
      state.currentPathIsDemo = true;

      // Select 7 prominent international programs for the top hero showcase
      const featuredIds = [
        'py-cs50p',
        'da-google',
        'web-odin-foundations',
        'ux-google-design',
        'da-fcc-sql',
        'dm-hubspot-inbound',
        'lang-spanish-fsi'
      ];
      state.showcaseCourses = featuredIds
        .map(id => courses.find(c => c.id === id))
        .filter(Boolean);

      // Render views
      initHeroShowcaseSlides(state.showcaseCourses);
      renderPathsCarousel(state.paths);
      renderFeaturedFreeCourses(state.courses);
      renderInternships(state.internships);
      renderCatalog(state.courses);
      renderCoachPresets(coachPresets);

      if (state.currentPath) {
        renderPersonalizedPath(state.currentPath);
      }
    } catch (err) {
      console.error('[SkillPath] Error loading initial data:', err);
      showToast(`Notice: Loaded with offline sample data. (${err.message})`, 5000);
    } finally {
      showGlobalLoading(false);
    }
  }

  function showGlobalLoading(isLoading) {
    const loader = document.getElementById('global-loader');
    if (loader) {
      loader.style.display = isLoading ? 'flex' : 'none';
    }
  }

  /* ==========================================================================
     Navigation & View Switching
     ========================================================================== */
  function setupNavigation() {
    navItems.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = btn.dataset.view;
        switchView(targetView);
      });
    });

    // Delegated click for in-app links (data-view-target)
    document.addEventListener('click', (e) => {
      const targetBtn = e.target.closest('[data-view-target]');
      if (targetBtn) {
        e.preventDefault();
        const targetView = targetBtn.dataset.viewTarget;
        const targetPathId = targetBtn.dataset.pathId;
        if (targetPathId) {
          const found = state.paths.find(p => p.id === targetPathId || p.slug === targetPathId);
          if (found) {
            // This is a curated/example path being previewed from the catalog,
            // not the signed-in user's own saved progress - show it as a clean,
            // not-started template so nobody sees fake completed milestones or
            // pre-checked tasks that aren't really theirs.
            state.currentPath = sanitizePathForPreview(found);
            state.currentPathIsDemo = true;
            hideMyPathEmptyState();
            renderPersonalizedPath(state.currentPath);
          }
        }
        switchView(targetView);
      }
    });

    if (toastClose) {
      toastClose.addEventListener('click', hideToast);
    }
  }

  function switchView(viewName) {
    if (!views[viewName]) return;

    Object.keys(views).forEach(name => {
      if (views[name]) {
        views[name].style.display = name === viewName ? 'block' : 'none';
      }
    });

    navItems.forEach(item => {
      if (item.dataset.view === viewName) {
        item.classList.add('active');
        item.setAttribute('aria-current', 'page');
      } else {
        item.classList.remove('active');
        item.removeAttribute('aria-current');
      }
    });

    state.currentView = viewName;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ==========================================================================
     PHASE 2: PROMINENT FEATURED COURSE SHOWCASE
     Inspired by layout reference: Wide hero banner, left meta & CTA, right 16:9 art
     ========================================================================== */
  function setupHeroShowcase() {
    const container = document.getElementById('hero-showcase-container');
    const prevBtn = document.getElementById('showcase-prev');
    const nextBtn = document.getElementById('showcase-next');
    const pauseBtn = document.getElementById('showcase-pause');
    const pauseIcon = document.getElementById('showcase-pause-icon');

    if (!container || state.showcaseCourses.length === 0) return;

    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      state.isShowcasePaused = true;
      if (pauseIcon) pauseIcon.textContent = 'play_arrow';
    } else {
      startShowcaseAutoScroll();
    }

    // Pause on hover
    container.addEventListener('mouseenter', pauseShowcase);
    container.addEventListener('mouseleave', () => {
      if (!pauseBtn || pauseBtn.dataset.manualPaused !== 'true') {
        resumeShowcase();
      }
    });

    // Pause on keyboard focus
    container.addEventListener('focusin', pauseShowcase);
    container.addEventListener('focusout', () => {
      if (!pauseBtn || pauseBtn.dataset.manualPaused !== 'true') {
        resumeShowcase();
      }
    });

    // Pause when document tab is hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        pauseShowcase();
      } else if (!pauseBtn || pauseBtn.dataset.manualPaused !== 'true') {
        resumeShowcase();
      }
    });

    // Navigation buttons
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        showcasePrev();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        showcaseNext();
      });
    }

    // Play/Pause manual toggle
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        if (state.isShowcasePaused) {
          pauseBtn.dataset.manualPaused = 'false';
          resumeShowcase();
          if (pauseIcon) pauseIcon.textContent = 'pause';
          pauseBtn.setAttribute('aria-label', 'Pause auto-scroll');
        } else {
          pauseBtn.dataset.manualPaused = 'true';
          pauseShowcase();
          if (pauseIcon) pauseIcon.textContent = 'play_arrow';
          pauseBtn.setAttribute('aria-label', 'Resume auto-scroll');
        }
      });
    }

    // Keyboard arrow navigation
    container.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') {
        showcaseNext();
      } else if (e.key === 'ArrowLeft') {
        showcasePrev();
      }
    });
  }

  function startShowcaseAutoScroll() {
    if (state.showcaseInterval) clearInterval(state.showcaseInterval);
    state.showcaseInterval = setInterval(() => {
      if (state.isShowcasePaused) return;
      showcaseNext();
    }, 5000);
  }

  function pauseShowcase() {
    state.isShowcasePaused = true;
  }

  function resumeShowcase() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
      state.isShowcasePaused = false;
    }
  }

  function showcaseNext() {
    if (state.showcaseCourses.length === 0) return;
    const nextIdx = (state.showcaseIndex + 1) % state.showcaseCourses.length;
    setActiveShowcaseSlide(nextIdx);
  }

  function showcasePrev() {
    if (state.showcaseCourses.length === 0) return;
    const prevIdx = (state.showcaseIndex - 1 + state.showcaseCourses.length) % state.showcaseCourses.length;
    setActiveShowcaseSlide(prevIdx);
  }

  function initHeroShowcaseSlides(courses) {
    const container = document.getElementById('hero-showcase-container');
    const counterEl = document.getElementById('showcase-counter');
    if (!container || !Array.isArray(courses) || courses.length === 0) return;

    if (counterEl) {
      counterEl.textContent = `1 / ${courses.length}`;
    }

    container.innerHTML = `
      <div class="relative w-full h-full min-h-[520px] md:min-h-[430px]" id="hero-slides-track">
        ${courses.map((course, i) => {
          let relatedPathId = 'path-data-analytics';
          if (course.subject.includes('Python')) relatedPathId = 'path-python-automation';
          else if (course.subject.includes('Web')) relatedPathId = 'path-web-dev';
          else if (course.subject.includes('UI/UX')) relatedPathId = 'path-ui-ux';
          else if (course.subject.includes('Marketing')) relatedPathId = 'path-digital-marketing';
          else if (course.subject.includes('Spanish')) relatedPathId = 'path-conversational-spanish';

          return `
            <div class="hero-showcase-slide ${i === 0 ? 'active' : ''}" data-slide-index="${i}">
              <!-- Left Side: Title, Details, Action CTAs, Dots -->
              <div class="flex flex-col justify-between gap-3 h-full">
                <div>
                  <div class="flex flex-wrap items-center gap-2 mb-2">
                    <span class="badge badge-primary">
                      <span class="material-symbols-outlined text-[12px]">stars</span>
                      Featured Program
                    </span>
                    <span class="badge badge-secondary">
                      <span class="material-symbols-outlined text-[12px]">savings</span>
                      Tuition: ${escapeHtml(course.coursePrice)}
                    </span>
                    <span class="badge badge-verified">
                      <span class="material-symbols-outlined text-[12px]">verified</span>
                      Verified Mar 2025
                    </span>
                  </div>

                  <h3 class="display-lg text-on-surface font-extrabold text-[22px] sm:text-[26px] hero-slide-title line-clamp-2 mb-1">
                    ${escapeHtml(course.title)}
                  </h3>

                  <p class="label-md font-bold text-primary mb-2">
                    ${escapeHtml(course.provider)} • ${escapeHtml(course.subject)}
                  </p>

                  <div class="flex flex-wrap items-center gap-1.5 text-[12px] mb-2.5">
                    <span class="badge badge-neutral">${escapeHtml(course.level)}</span>
                    <span class="badge badge-neutral"><span class="material-symbols-outlined text-[12px]">schedule</span> ${escapeHtml(course.duration)}</span>
                    <span class="badge badge-neutral"><span class="material-symbols-outlined text-[12px]">translate</span> ${escapeHtml(course.language || 'English')}</span>
                  </div>

                  <p class="body-md text-on-surface-variant hero-slide-desc line-clamp-3 mb-2.5">
                    ${escapeHtml(course.description)}
                  </p>

                  <!-- Pricing & Certificate Disambiguation Banner -->
                  <div class="p-2.5 rounded-xl bg-surface-container-low mb-2.5 flex flex-col gap-1 text-[12px]">
                    <div class="flex items-center justify-between">
                      <span class="text-on-surface-variant font-medium">Course Access:</span>
                      <strong class="text-secondary font-bold">${escapeHtml(course.coursePrice)}</strong>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-on-surface-variant font-medium">Certificate Status:</span>
                      <span class="text-on-surface font-semibold text-right">${escapeHtml(course.certificatePrice || 'None')}</span>
                    </div>
                  </div>
                </div>

                <!-- CTAs & Pagination Dots -->
                <div class="flex flex-col gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div class="flex flex-wrap items-center gap-2">
                    <a href="${escapeHtml(course.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm flex-1 sm:flex-initial">
                      <span>View Course</span>
                      <span class="material-symbols-outlined text-[15px]">open_in_new</span>
                    </a>

                    <button class="btn btn-secondary btn-sm flex-1 sm:flex-initial" data-view-target="mypath" data-path-id="${relatedPathId}">
                      <span>Start Learning Path</span>
                      <span class="material-symbols-outlined text-[15px]">alt_route</span>
                    </button>

                    ${course.auditTip ? `
                      <button class="btn btn-secondary btn-sm" onclick="window.toggleAuditTip('showcase-${course.id}')" title="Audit Tip">
                        <span class="material-symbols-outlined text-[16px]">lightbulb</span>
                        <span class="hidden sm:inline">Audit $0 Tip</span>
                      </button>
                    ` : ''}
                  </div>

                  ${course.auditTip ? `
                    <div id="tip-showcase-${course.id}" class="hidden p-2.5 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed text-[11px] leading-relaxed">
                      <strong>Audit Pro-Tip:</strong> ${escapeHtml(course.auditTip)}
                    </div>
                  ` : ''}

                  <!-- Persistent Pagination Dots Indicator -->
                  <div class="flex items-center gap-1.5 pt-0.5 showcase-dots-row" role="tablist" aria-label="Showcase slides">
                    ${courses.map((_, dotIdx) => `
                      <button class="showcase-dot ${dotIdx === i ? 'active' : ''}" 
                              onclick="window.jumpToShowcase(${dotIdx})" 
                              aria-label="Go to slide ${dotIdx + 1}" 
                              aria-selected="${dotIdx === i ? 'true' : 'false'}" 
                              role="tab" data-dot-index="${dotIdx}"></button>
                    `).join('')}
                  </div>
                </div>
              </div>

              <!-- Right Side: 16:9 High-Res Artwork -->
              <div class="hero-course-image-container relative flex items-center justify-center">
                <img src="${escapeHtml(course.image)}" 
                     alt="${escapeHtml(course.title)} Course Artwork" 
                     class="hero-course-image"
                     loading="${i === 0 ? 'eager' : 'lazy'}"
                     onerror="this.onerror=null; this.src='/assets/courses/course_web.jpg';"/>
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
                <div class="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-[12px] font-semibold">
                  <span class="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md flex items-center gap-1">
                    <span class="material-symbols-outlined text-[14px]">school</span>
                    ${escapeHtml(course.provider)}
                  </span>
                  <span class="bg-secondary/90 px-2 py-0.5 rounded text-[11px] font-bold">100% Free Audit</span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function setActiveShowcaseSlide(nextIndex) {
    if (state.showcaseCourses.length === 0) return;
    const slides = document.querySelectorAll('.hero-showcase-slide');
    const dots = document.querySelectorAll('.showcase-dot');
    const counterEl = document.getElementById('showcase-counter');

    if (!slides || slides.length === 0) return;

    const currentIndex = state.showcaseIndex;
    if (currentIndex === nextIndex) return;

    // Transition slides
    slides.forEach((slide, idx) => {
      if (idx === nextIndex) {
        slide.classList.remove('slide-exit-left');
        slide.classList.add('active');
      } else if (idx === currentIndex) {
        slide.classList.remove('active');
        slide.classList.add('slide-exit-left');
      } else {
        slide.classList.remove('active', 'slide-exit-left');
      }
    });

    // Update dots
    dots.forEach(dot => {
      const dotIdx = parseInt(dot.dataset.dotIndex, 10);
      if (dotIdx === nextIndex) {
        dot.classList.add('active');
        dot.setAttribute('aria-selected', 'true');
      } else {
        dot.classList.remove('active');
        dot.setAttribute('aria-selected', 'false');
      }
    });

    state.showcaseIndex = nextIndex;

    if (counterEl) {
      counterEl.textContent = `${nextIndex + 1} / ${state.showcaseCourses.length}`;
    }
  }

  window.jumpToShowcase = function(index) {
    setActiveShowcaseSlide(index);
  };

  /* ==========================================================================
     PHASE 3: INTERNSHIPS & APPRENTICESHIPS SECTION
     ========================================================================== */
  function setupInternshipFilters() {
    const filterBtns = document.querySelectorAll('.internship-filter-btn');
    const fieldSelect = document.getElementById('intern-field-filter');
    const paySelect = document.getElementById('intern-pay-filter');

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => {
          b.classList.remove('active', 'bg-primary', 'text-on-primary');
          b.classList.add('bg-surface-container-high', 'text-on-surface-variant');
        });
        btn.classList.add('active', 'bg-primary', 'text-on-primary');
        btn.classList.remove('bg-surface-container-high', 'text-on-surface-variant');

        state.internshipFilters.remote = btn.dataset.remote || 'all';
        applyInternshipFilters();
      });
    });

    if (fieldSelect) {
      fieldSelect.addEventListener('change', (e) => {
        state.internshipFilters.field = e.target.value;
        applyInternshipFilters();
      });
    }

    if (paySelect) {
      paySelect.addEventListener('change', (e) => {
        state.internshipFilters.pay = e.target.value;
        applyInternshipFilters();
      });
    }
  }

  async function applyInternshipFilters() {
    try {
      const items = await window.skillpathApi.getInternships({
        remoteStatus: state.internshipFilters.remote,
        field: state.internshipFilters.field,
        compensation: state.internshipFilters.pay
      });
      renderInternships(items);
    } catch (err) {
      console.error('Failed to filter internships:', err);
    }
  }

  function renderInternships(items) {
    const grid = document.getElementById('internships-grid');
    if (!grid) return;

    if (items.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full state-box">
          <span class="material-symbols-outlined text-[36px] text-outline">work_off</span>
          <h4 class="headline-sm">No internship programs found</h4>
          <p class="body-sm text-on-surface-variant">Try selecting "All Modes" or "All Fields" above.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = items.map(item => `
      <div class="card flex flex-col justify-between hover:shadow-md transition-shadow">
        <div>
          <div class="flex items-center justify-between gap-2 mb-2">
            <span class="badge ${item.isPaid ? 'badge-secondary' : 'badge-neutral'}">
              <span class="material-symbols-outlined text-[13px]">${item.isPaid ? 'payments' : 'volunteer_activism'}</span>
              ${escapeHtml(item.compensation)}
            </span>
            ${item.isVerified 
              ? `<span class="badge badge-verified" title="Verified source: ${escapeHtml(item.source)}">
                   <span class="material-symbols-outlined text-[12px]">verified</span> Verified Source
                 </span>`
              : `<span class="badge badge-sample" title="Sample Listing">
                   <span class="material-symbols-outlined text-[12px]">warning</span> Sample Listing
                 </span>`
            }
          </div>

          <h3 class="headline-sm text-on-surface font-bold mb-1">${escapeHtml(item.role)}</h3>
          <p class="label-md font-bold text-primary mb-2">${escapeHtml(item.organization)}</p>

          <div class="flex flex-wrap items-center gap-1.5 text-[12px] mb-3">
            <span class="badge badge-neutral"><span class="material-symbols-outlined text-[12px]">place</span> ${escapeHtml(item.location)}</span>
            <span class="badge badge-neutral"><span class="material-symbols-outlined text-[12px]">timelapse</span> ${escapeHtml(item.duration)}</span>
            <span class="badge badge-neutral">${escapeHtml(item.field)}</span>
          </div>

          <p class="body-sm text-on-surface-variant mb-3 line-clamp-3">${escapeHtml(item.description)}</p>

          <div class="p-2.5 rounded-lg bg-surface-container-low mb-3 text-[11px] text-on-surface-variant flex flex-col gap-1">
            <div><strong>Deadline:</strong> ${escapeHtml(item.deadline)}</div>
            <div><strong>Eligibility:</strong> ${escapeHtml(item.requirements)}</div>
            <div class="pt-1 border-t border-slate-200 dark:border-slate-800"><strong>Source:</strong> ${escapeHtml(item.source)}</div>
          </div>
        </div>

        <div class="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <a href="${escapeHtml(item.applicationUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm flex-1">
            <span>Official Application</span>
            <span class="material-symbols-outlined text-[14px]">open_in_new</span>
          </a>
        </div>
      </div>
    `).join('');
  }

  /* ==========================================================================
     AUTHENTICATION (Firebase Auth + Firestore per-user data)
     ========================================================================== */
  let authMode = 'signin'; // 'signin' | 'signup'
  let isAuthSubmitting = false;

  function setupAuthModal() {
    const modal = document.getElementById('auth-modal');
    const closeBtn = document.getElementById('auth-modal-close');
    const signInBtn = document.getElementById('header-signin-btn');
    const form = document.getElementById('auth-form');
    const submitBtn = document.getElementById('auth-submit-btn');
    const submitText = document.getElementById('auth-submit-text');
    const googleBtn = document.getElementById('auth-google-btn');
    const toggleBtn = document.getElementById('auth-toggle-mode-btn');
    const togglePrompt = document.getElementById('auth-toggle-prompt');
    const titleEl = document.getElementById('auth-modal-title');
    const nameField = document.getElementById('auth-name-field');
    const nameInput = document.getElementById('auth-name-input');
    const emailInput = document.getElementById('auth-email-input');
    const passwordInput = document.getElementById('auth-password-input');
    const errorBox = document.getElementById('auth-error');

    const hideError = () => {
      if (!errorBox) return;
      errorBox.textContent = '';
      errorBox.classList.add('hidden');
    };

    const showError = (message) => {
      if (!errorBox) return;
      errorBox.textContent = message;
      errorBox.classList.remove('hidden');
    };

    const openModal = () => {
      hideError();
      if (modal) modal.classList.add('open');
    };

    const closeModal = () => {
      if (modal) modal.classList.remove('open');
    };

    const setMode = (mode) => {
      authMode = mode;
      const isSignUp = mode === 'signup';
      hideError();
      if (titleEl) titleEl.textContent = isSignUp ? 'Create Your Account' : 'Sign In';
      if (submitText) submitText.textContent = isSignUp ? 'Sign Up' : 'Sign In';
      if (nameField) nameField.classList.toggle('hidden', !isSignUp);
      if (togglePrompt) togglePrompt.textContent = isSignUp ? 'Already have an account?' : "Don't have an account?";
      if (toggleBtn) toggleBtn.textContent = isSignUp ? 'Sign In' : 'Sign Up';
    };

    if (signInBtn) signInBtn.addEventListener('click', () => { setMode('signin'); openModal(); });
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (toggleBtn) toggleBtn.addEventListener('click', () => setMode(authMode === 'signup' ? 'signin' : 'signup'));

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (isAuthSubmitting) return;

        const email = (emailInput?.value || '').trim();
        const password = passwordInput?.value || '';
        const name = (nameInput?.value || '').trim();

        if (!email || !password) {
          showError('Please enter both an email and a password.');
          return;
        }

        try {
          isAuthSubmitting = true;
          if (submitBtn) submitBtn.disabled = true;
          hideError();

          if (authMode === 'signup') {
            await window.skillpathAuth.signUp(email, password, name);
            showToast('Account created! Welcome to SkillPath.');
          } else {
            await window.skillpathAuth.signIn(email, password);
            showToast('Signed in.');
          }
          closeModal();
          form.reset();
        } catch (err) {
          showError(err.message || 'Something went wrong. Please try again.');
        } finally {
          isAuthSubmitting = false;
          if (submitBtn) submitBtn.disabled = false;
        }
      });
    }

    if (googleBtn) {
      googleBtn.addEventListener('click', async () => {
        try {
          hideError();
          await window.skillpathAuth.signInWithGoogle();
          showToast('Signed in with Google.');
          closeModal();
        } catch (err) {
          showError(err.message || 'Google sign-in failed.');
        }
      });
    }
  }

  /** Derives 1-2 uppercase initials from a display name or email, for the avatar fallback. */
  function getInitials(nameOrEmail) {
    const trimmed = (nameOrEmail || '').trim();
    if (!trimmed) return '?';
    if (trimmed.includes('@')) return trimmed[0].toUpperCase();
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  /**
   * Shows a real photo (e.g. Google account photo) when available, falling
   * back to an initials avatar for email/password accounts, missing photos,
   * or if the photo URL fails to load.
   */
  function applyAvatar(imgEl, initialsEl, user) {
    if (!imgEl || !initialsEl) return;
    const label = user?.displayName || user?.email || '';
    initialsEl.textContent = getInitials(label);

    if (user?.photoURL) {
      imgEl.onerror = () => {
        imgEl.classList.add('hidden');
        initialsEl.classList.remove('hidden');
      };
      imgEl.src = user.photoURL;
      imgEl.alt = label ? `${label}'s avatar` : 'Account avatar';
      imgEl.classList.remove('hidden');
      initialsEl.classList.add('hidden');
    } else {
      imgEl.classList.add('hidden');
      initialsEl.classList.remove('hidden');
    }
  }

  /** Clears any signed-in user's avatar back to a neutral placeholder state. */
  function resetAvatar(imgEl, initialsEl) {
    if (imgEl) {
      imgEl.classList.add('hidden');
      imgEl.removeAttribute('src');
      imgEl.onerror = null;
    }
    if (initialsEl) {
      initialsEl.classList.add('hidden');
      initialsEl.textContent = '?';
    }
  }

  /**
   * Profile modal: shows the signed-in user's real avatar/name/email, lets
   * them edit their display name, shows their genuine streak/checkpoint
   * stats, and provides sign-out. Hidden entirely for guests (the button
   * that opens it only exists inside the signed-in header block).
   */
  function setupProfileModal() {
    const modal = document.getElementById('profile-modal');
    const closeBtn = document.getElementById('profile-modal-close');
    const openTriggerBtn = document.getElementById('header-profile-btn');
    const signOutBtn = document.getElementById('profile-signout-btn');
    const form = document.getElementById('profile-form');
    const nameInput = document.getElementById('profile-name-input');
    const emailEl = document.getElementById('profile-modal-email');
    const titleEl = document.getElementById('profile-modal-title');
    const errorBox = document.getElementById('profile-error');
    const successBox = document.getElementById('profile-success');
    const tasksEl = document.getElementById('profile-tasks-value');
    const streakEl = document.getElementById('profile-streak-value');

    const hideMessages = () => {
      if (errorBox) errorBox.classList.add('hidden');
      if (successBox) successBox.classList.add('hidden');
    };
    const showError = (message) => {
      if (!errorBox) return;
      errorBox.textContent = message;
      errorBox.classList.remove('hidden');
    };
    const showSuccess = (message) => {
      if (!successBox) return;
      successBox.textContent = message;
      successBox.classList.remove('hidden');
    };

    const openModal = () => {
      hideMessages();
      const user = window.skillpathAuth && window.skillpathAuth.getCurrentUser();
      if (!user) return;

      if (emailEl) emailEl.textContent = user.email || '';
      if (titleEl) titleEl.textContent = user.displayName || 'Account';
      if (nameInput) nameInput.value = user.displayName || '';
      applyAvatar(
        document.getElementById('profile-modal-avatar-img'),
        document.getElementById('profile-modal-avatar-initials'),
        user
      );

      const stats = computePathProgress(state.currentPathIsDemo ? null : state.currentPath);
      if (tasksEl) tasksEl.textContent = `${stats.completedTasks} of ${stats.totalTasks}`;
      if (streakEl) streakEl.textContent = typeof state.streakCount === 'number' ? String(state.streakCount) : '0';

      if (modal) modal.classList.add('open');
    };

    const closeModal = () => {
      if (modal) modal.classList.remove('open');
    };

    if (openTriggerBtn) openTriggerBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (modal) {
      modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
      modal.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideMessages();
        const user = window.skillpathAuth && window.skillpathAuth.getCurrentUser();
        if (!user) return;

        const newName = (nameInput?.value || '').trim();
        try {
          await window.skillpathAuth.updateDisplayName(newName);
          if (window.skillpathUserData) {
            await window.skillpathUserData.saveUserProfile(user.uid, { displayName: newName });
          }
          if (titleEl) titleEl.textContent = newName || 'Account';
          const headerProfileBtn = document.getElementById('header-profile-btn');
          if (headerProfileBtn) headerProfileBtn.title = newName || user.email || 'Account';
          applyAvatar(
            document.getElementById('header-avatar-img'),
            document.getElementById('header-avatar-initials'),
            { ...user, displayName: newName }
          );
          showSuccess('Saved.');
        } catch (err) {
          showError(err.message || 'Could not save changes.');
        }
      });
    }

    if (signOutBtn) {
      signOutBtn.addEventListener('click', async () => {
        try {
          await window.skillpathAuth.signOut();
          closeModal();
          showToast('Signed out.');
        } catch (err) {
          showError(err.message || 'Error signing out.');
        }
      });
    }
  }

  /**
   * Subscribes to Firebase auth state. Toggles the header between the guest
   * "Sign In" button and the signed-in avatar/streak block, restores any
   * previously saved personalized path (or shows a genuine empty state for a
   * brand-new account), records today's streak activity, and fully resets
   * back to guest defaults on sign-out so no account's UI/state leaks into
   * the next session.
   */
  function initAuthObserver() {
    if (!window.skillpathAuth) return;

    window.skillpathAuth.onAuthChange(async (user) => {
      const signInBtn = document.getElementById('header-signin-btn');
      const userBlock = document.getElementById('header-user-block');
      const streakBadge = document.getElementById('header-streak-badge');
      const streakCountEl = document.getElementById('header-streak-count');
      const profileBtn = document.getElementById('header-profile-btn');
      const headerAvatarImg = document.getElementById('header-avatar-img');
      const headerAvatarInitials = document.getElementById('header-avatar-initials');

      if (!user) {
        // Signed out (or app just loaded with nobody signed in): clear any
        // previous account's UI/state before showing the guest experience.
        if (signInBtn) signInBtn.classList.remove('hidden');
        if (userBlock) userBlock.classList.remove('is-visible');
        if (streakBadge) streakBadge.classList.remove('is-visible');
        resetAvatar(headerAvatarImg, headerAvatarInitials);

        state.streakCount = null;
        state.questionnaire = { ...DEFAULT_QUESTIONNAIRE };
        state.currentPath = state.paths[0] ? sanitizePathForPreview(state.paths[0]) : null;
        state.currentPathIsDemo = true;
        hideMyPathEmptyState();
        if (state.currentPath) renderPersonalizedPath(state.currentPath);
        return;
      }

      if (signInBtn) signInBtn.classList.add('hidden');
      if (userBlock) userBlock.classList.add('is-visible');
      if (profileBtn) profileBtn.title = user.displayName || user.email || 'Account';
      applyAvatar(headerAvatarImg, headerAvatarInitials, user);

      if (!window.skillpathUserData) return;

      try {
        // Creates a genuinely fresh doc (zero streak, no saved path) ONLY if
        // this uid has never signed in before - never overwrites an existing
        // user's real progress on sign-in or page refresh.
        const profile = await window.skillpathUserData.ensureUserProfile(user.uid, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        });

        state.questionnaire = profile?.questionnaire
          ? { ...DEFAULT_QUESTIONNAIRE, ...profile.questionnaire }
          : { ...DEFAULT_QUESTIONNAIRE };

        if (profile?.currentPath) {
          state.currentPath = profile.currentPath;
          state.currentPathIsDemo = false;
          hideMyPathEmptyState();
          renderPersonalizedPath(profile.currentPath);
        } else {
          // Brand-new account, or an existing account that hasn't generated a
          // path yet - show a genuine empty state, never the shared demo path.
          state.currentPath = null;
          state.currentPathIsDemo = false;
          showMyPathEmptyState();
        }

        const streak = await window.skillpathUserData.recordDailyActivity(user.uid);
        state.streakCount = streak ? streak.count : 0;
        if (streakBadge && streakCountEl) {
          streakCountEl.textContent = String(state.streakCount);
          streakBadge.classList.add('is-visible');
        }
        if (state.currentPath) renderPathProgressBento(state.currentPath, state.streakCount);
      } catch (err) {
        console.warn('[SkillPath Auth] Failed to load user data:', err.message);
      }
    });
  }

  /* ==========================================================================
     PHASE 4: INTERACTIVE LEARNING COACH
     ========================================================================== */
  let isCoachSubmitting = false;

  function setupLearningCoach() {
    const triggerBtn = document.getElementById('coach-trigger-btn');
    const headerBtn = document.getElementById('header-coach-btn');
    const modal = document.getElementById('coach-modal');
    const closeBtn = document.getElementById('coach-modal-close');
    const form = document.getElementById('coach-chat-form');
    const submitBtn = document.getElementById('coach-submit-btn');
    const inputEl = document.getElementById('coach-user-input');
    const messagesContainer = document.getElementById('coach-messages-container');

    const openModal = () => {
      if (modal) modal.classList.add('open');
      if (inputEl) {
        setTimeout(() => inputEl.focus(), 150);
      }
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    };

    const closeModal = () => {
      if (modal) modal.classList.remove('open');
    };

    if (triggerBtn) triggerBtn.addEventListener('click', openModal);
    if (headerBtn) headerBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    // Close on clicking backdrop
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }

    // Handle user submission
    const handleInquiry = () => {
      if (isCoachSubmitting) return;
      const query = inputEl ? inputEl.value.trim() : '';
      if (!query) {
        if (inputEl) inputEl.focus();
        return;
      }
      submitCoachQuery(query);
    };

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleInquiry();
      });
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleInquiry();
      });
    }

    if (inputEl) {
      // Auto-resize textarea as user types
      inputEl.addEventListener('input', () => {
        inputEl.style.height = 'auto';
        inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
      });

      // Enter to send, Shift+Enter for newline
      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          if (e.shiftKey) {
            // Allow default multiline behavior
            return;
          }
          e.preventDefault();
          handleInquiry();
        }
      });
    }
  }

  function renderCoachPresets(presets) {
    const container = document.getElementById('coach-presets-container');
    if (!container || !Array.isArray(presets)) return;

    container.innerHTML = presets.map(p => `
      <button type="button" class="btn btn-secondary btn-sm text-[11px] text-left py-1 px-2.5 rounded-lg hover:border-primary/40" 
              onclick="window.selectCoachPreset('${escapeHtml(p.query)}')">
        <span>${escapeHtml(p.label)}</span>
      </button>
    `).join('');
  }

  window.selectCoachPreset = function(query) {
    submitCoachQuery(query);
  };

  window.retryCoachQuery = function(query) {
    submitCoachQuery(query);
  };

  function formatCoachText(rawText) {
    if (!rawText) return '';
    let html = escapeHtml(rawText);
    // Bold: **text**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic: *text*
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Inline code: `text`
    html = html.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-surface-container-highest font-mono text-[11px] text-primary">$1</code>');
    // Double newlines to paragraph breaks
    html = html.replace(/\n\n/g, '</p><p class="mt-2 leading-relaxed">');
    // Single newlines to line breaks
    html = html.replace(/\n/g, '<br/>');
    return `<p class="leading-relaxed">${html}</p>`;
  }

  async function submitCoachQuery(query) {
    if (isCoachSubmitting) return;

    const trimmedQuery = (query || '').trim();
    if (!trimmedQuery) return;

    const historyList = document.getElementById('coach-history-list');
    const loadingIndicator = document.getElementById('coach-loading-indicator');
    const scrollContainer = document.getElementById('coach-messages-container');
    const submitBtn = document.getElementById('coach-submit-btn');
    const submitText = document.getElementById('coach-submit-text');
    const submitIcon = document.getElementById('coach-submit-icon');
    const inputEl = document.getElementById('coach-user-input');

    if (!historyList) return;

    isCoachSubmitting = true;

    // Clear input field and reset height
    if (inputEl) {
      inputEl.value = '';
      inputEl.style.height = 'auto';
    }

    // Disable submit button and show loading state
    if (submitBtn) submitBtn.disabled = true;
    if (submitText) submitText.textContent = 'Thinking...';
    if (submitIcon) submitIcon.textContent = 'hourglass_top';

    // 1. Append User Message Bubble
    const userMsgEl = document.createElement('div');
    userMsgEl.className = 'coach-msg coach-msg-user';
    userMsgEl.innerHTML = `
      <div class="coach-msg-avatar">
        <span class="material-symbols-outlined text-[17px]">person</span>
      </div>
      <div class="coach-msg-content">
        <p class="body-sm font-medium leading-relaxed">${escapeHtml(trimmedQuery)}</p>
      </div>
    `;
    historyList.appendChild(userMsgEl);

    // 2. Show Dynamic Loading Indicator (tailored to inquiry topic)
    const loadingText = document.getElementById('coach-loading-text');
    if (loadingText) {
      const qLower = trimmedQuery.toLowerCase();
      if (qLower.includes('figma')) {
        loadingText.textContent = 'Finding relevant Figma courses in catalog...';
      } else if (qLower.includes('python')) {
        loadingText.textContent = 'Finding Python courses & code sandboxes...';
      } else if (qLower.includes('tableau')) {
        loadingText.textContent = 'Finding Tableau & data visualization resources...';
      } else if (qLower.includes('sql') || qLower.includes('postgresql')) {
        loadingText.textContent = 'Finding SQL & relational database courses...';
      } else if (qLower.includes('intern') || qLower.includes('gsoc') || qLower.includes('outreachy')) {
        loadingText.textContent = 'Searching verified internship & mentorship programs...';
      } else if (qLower.includes('cost') || qLower.includes('audit') || qLower.includes('free') || qLower.includes('price')) {
        loadingText.textContent = 'Checking course pricing & free audit policies...';
      } else {
        loadingText.textContent = 'Searching catalog & preparing your answer...';
      }
    }
    if (loadingIndicator) {
      loadingIndicator.classList.remove('hidden');
    }

    // Scroll to bottom
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }

    try {
      const result = await window.skillpathApi.askCoach({ query: trimmedQuery });

      if (!result) {
        throw new Error('Received an empty response from the coach service.');
      }

      // If roadmap was generated, register it in state.paths so "View Roadmap" works
      if (result.generatedRoadmap) {
        const existingIdx = state.paths.findIndex(p => p.id === result.generatedRoadmap.id);
        if (existingIdx >= 0) {
          state.paths[existingIdx] = result.generatedRoadmap;
        } else {
          state.paths.push(result.generatedRoadmap);
        }
      }

      // Hide loading indicator
      if (loadingIndicator) loadingIndicator.classList.add('hidden');

      // 3. Render Bot Response Bubble
      const botMsgEl = document.createElement('div');
      botMsgEl.className = 'coach-msg coach-msg-bot';
      botMsgEl.innerHTML = `
        <div class="coach-msg-avatar">
          <span class="material-symbols-outlined text-[18px]">smart_toy</span>
        </div>
        <div class="coach-msg-content flex-1">
          <!-- Header Bar with Badge -->
          <div class="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
            <div class="flex items-center gap-1.5">
              <span class="font-bold text-[13px] text-on-surface">SkillPath Coach</span>
              <span class="badge badge-primary text-[10px] py-0.5 px-1.5 font-bold">Rules-Based Guide</span>
            </div>
            ${result.detectedConstraints && result.detectedConstraints.goal ? `
              <span class="badge badge-secondary text-[10px] py-0.5 px-1.5 font-bold">Domain: ${escapeHtml(result.detectedConstraints.goal)}</span>
            ` : ''}
          </div>

          <!-- Direct Answer Text -->
          <div class="body-sm text-on-surface leading-relaxed mb-3">
            ${formatCoachText(result.directAnswer || result.rationale || 'Here is your personalized diagnosis and roadmap.')}
          </div>

          <!-- Low-Cost / Free Strategy Tip -->
          ${result.lowCostAlternatives ? `
            <div class="p-2.5 rounded-lg bg-surface-container-lowest text-[12px] text-on-surface border border-slate-200 dark:border-slate-800 mb-3">
              <div class="flex items-center gap-1 text-secondary font-bold mb-0.5">
                <span class="material-symbols-outlined text-[14px]">savings</span>
                <span>Cost-Saving Strategy:</span>
              </div>
              <p class="text-on-surface-variant leading-normal">${escapeHtml(result.lowCostAlternatives)}</p>
            </div>
          ` : ''}

          <!-- Actionable Recommended Curriculum Card -->
          ${result.recommendation && result.recommendation.pathId ? `
            <div class="p-3 rounded-xl bg-primary text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 shadow-sm">
              <div>
                <div class="label-xs uppercase tracking-wider text-emerald-300 font-bold">Recommended Curriculum</div>
                <div class="label-md font-bold text-white">${escapeHtml(result.recommendation.pathTitle)}</div>
                <div class="text-[11px] text-white/80">${result.recommendation.durationWeeks || 8} weeks • ${result.recommendation.hoursPerWeek || 8} hrs/wk • ${escapeHtml(result.recommendation.costTier || '$0')}</div>
              </div>
              <button class="btn btn-secondary btn-sm bg-white text-primary font-bold hover:bg-slate-100 shrink-0 self-start sm:self-auto"
                      onclick="window.loadCoachRoadmap('${result.recommendation.pathId}')">
                <span>View Roadmap</span>
                <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          ` : ''}

          <!-- Recommended Courses (if any) -->
          ${result.recommendedCourses && result.recommendedCourses.length > 0 ? `
            <div class="mb-3">
              <span class="label-xs text-on-surface-variant font-bold uppercase tracking-wider block mb-1">Verified Course Options:</span>
              <div class="flex flex-col gap-1.5">
                ${result.recommendedCourses.map(c => `
                  <div class="p-2 rounded-lg bg-surface-container-lowest flex items-center justify-between gap-2 text-[12px] border border-slate-200 dark:border-slate-800">
                    <div class="min-w-0 flex-1">
                      <div class="font-bold text-on-surface truncate">${escapeHtml(c.title)}</div>
                      <div class="text-on-surface-variant text-[11px]">${escapeHtml(c.provider)} • <span class="text-secondary font-semibold">${escapeHtml(c.price)}</span></div>
                    </div>
                    <a href="${escapeHtml(c.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm py-1 px-2.5 text-[11px] shrink-0" title="Visit Provider">
                      <span>Visit</span>
                      <span class="material-symbols-outlined text-[12px]">open_in_new</span>
                    </a>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Recommended Internships (if any) -->
          ${result.recommendedInternships && result.recommendedInternships.length > 0 ? `
            <div class="mb-3">
              <span class="label-xs text-on-surface-variant font-bold uppercase tracking-wider block mb-1">Related Early-Career Programs:</span>
              <div class="flex flex-col gap-1.5">
                ${result.recommendedInternships.map(i => `
                  <div class="p-2 rounded-lg bg-surface-container-lowest flex items-center justify-between gap-2 text-[12px] border border-slate-200 dark:border-slate-800">
                    <div class="min-w-0 flex-1">
                      <div class="font-bold text-on-surface truncate">${escapeHtml(i.role)}</div>
                      <div class="text-on-surface-variant text-[11px]">${escapeHtml(i.organization)} • <span class="text-secondary font-semibold">${escapeHtml(i.compensation)}</span> • ${escapeHtml(i.remoteStatus)}</div>
                    </div>
                    <a href="${escapeHtml(i.applicationUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm py-1 px-2.5 text-[11px] shrink-0" title="Apply Online">
                      <span>Apply</span>
                      <span class="material-symbols-outlined text-[12px]">open_in_new</span>
                    </a>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Suggested Follow-Up Prompts -->
          ${result.suggestedFollowUps && result.suggestedFollowUps.length > 0 ? `
            <div class="pt-2 border-t border-slate-200 dark:border-slate-800">
              <span class="label-xs text-on-surface-variant font-bold uppercase tracking-wider block mb-1">Suggested Follow-Ups:</span>
              <div class="flex flex-wrap gap-1.5">
                ${result.suggestedFollowUps.map(s => `
                  <button type="button" class="btn btn-secondary btn-sm text-[11px] py-1 px-2 text-left"
                          onclick="window.selectCoachPreset('${escapeHtml(s)}')">
                    <span>${escapeHtml(s)}</span>
                  </button>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Disclaimer Note -->
          <p class="text-[10px] text-on-surface-variant opacity-75 pt-2 border-t border-slate-200 dark:border-slate-800 mt-2">
            ${escapeHtml(result.disclaimer || 'SkillPath Coach is a rules-based diagnostic guide. It is not human career counseling and does not guarantee job placement.')}
          </p>
        </div>
      `;
      historyList.appendChild(botMsgEl);

    } catch (err) {
      console.error('[Coach Error]', err);
      if (loadingIndicator) loadingIndicator.classList.add('hidden');

      // Preserve user query on error so they don't have to retype
      if (inputEl) inputEl.value = trimmedQuery;

      const errorMsgEl = document.createElement('div');
      errorMsgEl.className = 'coach-msg coach-msg-bot';
      errorMsgEl.innerHTML = `
        <div class="coach-msg-avatar bg-red-600">
          <span class="material-symbols-outlined text-[18px]">error</span>
        </div>
        <div class="coach-msg-content flex-1 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200">
          <div class="font-bold text-[12px] mb-1">Unable to complete inquiry</div>
          <p class="text-[12px] leading-relaxed mb-2">${escapeHtml(err.message || 'The server encountered an error processing your inquiry.')}</p>
          <button type="button" class="btn btn-secondary btn-sm text-[11px] py-1 px-2.5 bg-white dark:bg-slate-900"
                  onclick="window.retryCoachQuery('${escapeHtml(trimmedQuery)}')">
            <span class="material-symbols-outlined text-[12px]">refresh</span>
            <span>Retry Question</span>
          </button>
        </div>
      `;
      historyList.appendChild(errorMsgEl);
    } finally {
      isCoachSubmitting = false;
      if (submitBtn) submitBtn.disabled = false;
      if (submitText) submitText.textContent = 'Ask';
      if (submitIcon) submitIcon.textContent = 'send';
      if (inputEl) inputEl.focus();

      // Ensure new message is scrolled into view smoothly
      if (scrollContainer) {
        setTimeout(() => {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }, 60);
      }
    }
  }

  window.loadCoachRoadmap = function(pathId) {
    const modal = document.getElementById('coach-modal');
    if (modal) modal.classList.remove('open');

    const found = state.paths.find(p => p.id === pathId || p.slug === pathId);
    if (found) {
      state.currentPath = found;
      renderPersonalizedPath(found);
    }
    switchView('mypath');
    showToast('Loaded recommended roadmap into My Path!', 3000);
  };

  /* ==========================================================================
     PHASE 5: DISTINCT ROADMAP GENERATION & TIMELINE
     ========================================================================== */
  function renderPersonalizedPath(pathItem) {
    if (!pathItem) return;

    const titleEl = document.getElementById('path-title');
    const weeksEl = document.getElementById('path-weeks');
    const hoursEl = document.getElementById('path-hours');
    const savingsEl = document.getElementById('path-savings');
    const timelineEl = document.getElementById('path-milestones-timeline');
    const rationaleBox = document.getElementById('path-rationale-box');
    const budgetToggle = document.getElementById('budget-toggle');
    const toggleKnob = document.getElementById('toggle-knob');
    const savingsNotice = document.getElementById('savings-banner-text');

    if (titleEl) titleEl.textContent = pathItem.title;
    if (weeksEl) weeksEl.innerHTML = `<span class="material-symbols-outlined text-[13px]">calendar_today</span> ${pathItem.durationWeeks} Weeks`;
    if (hoursEl) hoursEl.innerHTML = `<span class="material-symbols-outlined text-[13px]">schedule</span> ${pathItem.hoursPerWeek} hrs/week`;
    if (savingsEl) savingsEl.innerHTML = `<span class="material-symbols-outlined text-[13px]">savings</span> ${pathItem.savingsEstimate}`;

    if (rationaleBox) {
      rationaleBox.innerHTML = `
        <strong>Curriculum Rationale:</strong> ${escapeHtml(pathItem.pathRationale || `Sequenced for a ${pathItem.learnerLevel || 'beginner'} learner at ${pathItem.hoursPerWeek || 8} hrs/week.`)}
      `;
    }

    // Budget toggle state
    if (budgetToggle && toggleKnob) {
      budgetToggle.onclick = () => {
        state.isBudgetMode = !state.isBudgetMode;
        if (state.isBudgetMode) {
          budgetToggle.classList.remove('bg-surface-dim');
          budgetToggle.classList.add('bg-secondary');
          toggleKnob.classList.remove('translate-x-0');
          toggleKnob.classList.add('translate-x-5');
          if (savingsNotice) savingsNotice.innerHTML = `Saved <strong>$411</strong> using audited tracks & open-source sandboxes`;
        } else {
          budgetToggle.classList.remove('bg-secondary');
          budgetToggle.classList.add('bg-surface-dim');
          toggleKnob.classList.remove('translate-x-5');
          toggleKnob.classList.add('translate-x-0');
          if (savingsNotice) savingsNotice.innerHTML = `Retail Mode: Includes paid certificates ($39–$49/mo) and proctored exam fees`;
        }
      };
    }

    // Render Timeline Milestones with Stage Rationales and Alternatives
    if (timelineEl && Array.isArray(pathItem.milestones)) {
      timelineEl.innerHTML = pathItem.milestones.map((m, index) => {
        const isCompleted = m.status === 'completed';
        const isInProgress = m.status === 'in-progress';
        const isLocked = m.status === 'locked';

        return `
          <div class="relative flex gap-3.5" id="milestone-stage-${m.stage}">
            <!-- Node Spine -->
            <div class="flex flex-col items-center">
              <div class="w-7 h-7 rounded-full flex items-center justify-center shadow-sm z-10 
                ${isCompleted ? 'bg-secondary-fixed text-on-secondary-fixed' : ''}
                ${isInProgress ? 'bg-primary text-on-primary ring-4 ring-primary/20' : ''}
                ${isLocked ? 'bg-surface-container-high text-on-surface-variant' : ''}">
                <span class="material-symbols-outlined text-[16px] font-bold">
                  ${isCompleted ? 'check' : isInProgress ? 'play_arrow' : 'lock'}
                </span>
              </div>
              ${index < pathItem.milestones.length - 1 ? `
                <div class="w-0.5 flex-1 my-1 rounded-full ${isCompleted ? 'bg-secondary-fixed-dim' : 'bg-surface-container-high'}"></div>
              ` : ''}
            </div>

            <!-- Content Card -->
            <div class="flex-1 card mb-3 relative overflow-hidden ${isInProgress ? 'card-elevated border-l-4 border-l-primary' : ''}">
              <div class="flex items-center justify-between gap-2 mb-1">
                <span class="label-sm uppercase tracking-wider font-bold 
                  ${isCompleted ? 'text-secondary' : isInProgress ? 'text-primary' : 'text-on-surface-variant'}">
                  Milestone ${m.stage} • ${escapeHtml(m.status.toUpperCase())}
                </span>
                ${m.score ? `<span class="badge badge-secondary"><span class="material-symbols-outlined text-[12px]">verified</span> ${escapeHtml(m.score)}</span>` : ''}
                ${m.dueLabel ? `<span class="badge badge-primary">${escapeHtml(m.dueLabel)}</span>` : ''}
              </div>

              <h3 class="headline-sm text-on-surface font-semibold mb-1">${escapeHtml(m.title)}</h3>
              <p class="body-sm text-on-surface-variant mb-2">${escapeHtml(m.description)}</p>

              <!-- Step Rationale & Learning Style Tip -->
              <div class="p-2.5 rounded-lg bg-surface-container-low mb-3 flex flex-col gap-1 text-[11px] leading-relaxed">
                <div><strong>Step Rationale:</strong> ${escapeHtml(m.stageRationale || 'Sequenced to establish core competency before advancing.')}</div>
                ${m.learningStyleTip ? `<div class="text-primary font-medium">💡 ${escapeHtml(m.learningStyleTip)}</div>` : ''}
              </div>

              <!-- Resource Box -->
              <div class="p-2.5 rounded-lg bg-surface-container-low mb-3 flex flex-col gap-1.5 text-[12px]">
                <div class="flex items-center justify-between">
                  <span class="text-on-surface-variant">Recommended:</span>
                  <a href="${escapeHtml(m.primaryResource?.url || '#')}" target="_blank" rel="noopener noreferrer" class="font-bold text-primary hover:underline flex items-center gap-0.5">
                    ${escapeHtml(m.primaryResource?.title || 'Resource')}
                    <span class="material-symbols-outlined text-[12px]">open_in_new</span>
                  </a>
                </div>
                ${m.freeAlternative ? `
                  <div class="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200 dark:border-slate-800">
                    <span class="text-secondary font-medium">Free Alternative:</span>
                    <a href="${escapeHtml(m.freeAlternative.url)}" target="_blank" rel="noopener noreferrer" class="text-on-surface hover:underline">
                      ${escapeHtml(m.freeAlternative.title)}
                    </a>
                  </div>
                ` : ''}
              </div>

              <!-- Interactive Tasks Checklist -->
              ${Array.isArray(m.tasks) && m.tasks.length > 0 ? `
                <div class="flex flex-col gap-1.5 mb-3">
                  <span class="label-sm text-on-surface-variant uppercase font-bold">Key Checkpoints</span>
                  ${m.tasks.map(t => `
                    <label class="flex items-center gap-2 text-[13px] cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1 rounded">
                      <input type="checkbox" ${t.completed ? 'checked' : ''} 
                        onchange="window.toggleTask('${pathItem.id}', ${m.stage}, '${t.id}', this.checked)"
                        class="w-4 h-4 rounded text-primary focus:ring-primary">
                      <span class="${t.completed ? 'line-through text-on-surface-variant' : 'text-on-surface'}">${escapeHtml(t.title)}</span>
                    </label>
                  `).join('')}
                </div>
              ` : ''}

              <!-- Action Bar -->
              <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <span class="body-sm text-on-surface-variant flex items-center gap-1">
                  <span class="material-symbols-outlined text-[14px]">timer</span>
                  ${m.durationHours} hrs total
                </span>
                <button class="btn btn-primary btn-sm" data-view-target="practice" data-path-id="${pathItem.id}">
                  <span>${isInProgress ? 'Practice Arena' : 'Explore Arena'}</span>
                  <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    renderPathProgressBento(pathItem, state.streakCount);
  }

  /**
   * Deep-clones a curated/example path and resets its milestones/tasks to a
   * clean "not started" state. The seed catalog's example paths carry
   * pre-baked "completed" milestones and checked tasks purely for showcase
   * purposes - nobody's actual progress. Cloning (rather than mutating the
   * shared state.paths entry directly) also prevents permanently corrupting
   * the shared catalog data for every other guest/user in this session.
   */
  function sanitizePathForPreview(pathItem) {
    if (!pathItem) return pathItem;
    const clone = JSON.parse(JSON.stringify(pathItem));
    if (Array.isArray(clone.milestones)) {
      clone.milestones.forEach((m, idx) => {
        m.status = idx === 0 ? 'in-progress' : 'locked';
        delete m.score;
        delete m.progressPercent;
        delete m.dueLabel;
        delete m.solved;
        if (Array.isArray(m.tasks)) {
          m.tasks = m.tasks.map(t => ({ ...t, completed: false }));
        }
      });
    }
    return clone;
  }

  /**
   * Computes genuine progress stats from a path's own milestone/task data -
   * never a fabricated number. A milestone counts as done when every one of
   * its tasks is checked (or, for milestones with no checklist, when its
   * status is already 'completed', e.g. an explicit experience-level skip).
   */
  function computePathProgress(pathItem) {
    const milestones = Array.isArray(pathItem?.milestones) ? pathItem.milestones : [];
    let completedTasks = 0, totalTasks = 0, completedHours = 0, totalHours = 0;
    let currentStage = milestones.length, nextGoalTitle = null, foundActive = false;

    milestones.forEach(m => {
      const hours = Number(m.durationHours) || 0;
      totalHours += hours;

      const tasks = Array.isArray(m.tasks) ? m.tasks : [];
      totalTasks += tasks.length;
      const doneCount = tasks.filter(t => t.completed).length;
      completedTasks += doneCount;

      const milestoneDone = tasks.length > 0 ? doneCount === tasks.length : m.status === 'completed';
      if (milestoneDone) {
        completedHours += hours;
      } else if (!foundActive) {
        currentStage = m.stage;
        nextGoalTitle = m.title;
        foundActive = true;
      }
    });

    const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    return {
      completedTasks,
      totalTasks,
      percent,
      completedHours,
      totalHours,
      currentStage,
      totalStages: milestones.length,
      nextGoalTitle: nextGoalTitle || (milestones.length ? 'All milestones complete!' : '-')
    };
  }

  /** Renders the "Active Path / Overall Journey / Streak / Checkpoints" bento from real data. */
  function renderPathProgressBento(pathItem, streakCount) {
    const stageLabel = document.getElementById('path-stage-label');
    const ring = document.getElementById('path-progress-ring');
    const percentLabel = document.getElementById('path-progress-percent');
    const hoursLabel = document.getElementById('path-hours-progress');
    const nextGoalLabel = document.getElementById('path-next-goal');
    const streakLabel = document.getElementById('path-streak-days');
    const tasksLabel = document.getElementById('path-tasks-completed');

    const stats = computePathProgress(pathItem);
    const RING_CIRCUMFERENCE = 125.66;

    if (stageLabel) {
      stageLabel.textContent = stats.totalStages
        ? `Stage ${Math.min(stats.currentStage, stats.totalStages)} of ${stats.totalStages}`
        : '—';
    }
    if (ring) {
      ring.setAttribute('stroke-dashoffset', String(RING_CIRCUMFERENCE * (1 - stats.percent / 100)));
    }
    if (percentLabel) percentLabel.textContent = `${stats.percent}%`;
    if (hoursLabel) hoursLabel.textContent = `${stats.completedHours} hrs of ${stats.totalHours} hrs`;
    if (nextGoalLabel) nextGoalLabel.textContent = `Next Goal: ${escapeHtml(stats.nextGoalTitle)}`;
    if (tasksLabel) tasksLabel.textContent = `${stats.completedTasks} of ${stats.totalTasks}`;
    if (streakLabel) {
      streakLabel.textContent = typeof streakCount === 'number'
        ? `${streakCount} Day${streakCount === 1 ? '' : 's'}`
        : 'Sign in to track';
    }
  }

  /** Shows the "no path yet" empty state instead of any stale/demo path content. */
  function showMyPathEmptyState() {
    const emptyState = document.getElementById('mypath-empty-state');
    const contentWrapper = document.getElementById('mypath-content-wrapper');
    if (emptyState) emptyState.classList.remove('hidden');
    if (contentWrapper) contentWrapper.classList.add('hidden');
  }

  /** Hides the empty state and shows the real path content again. */
  function hideMyPathEmptyState() {
    const emptyState = document.getElementById('mypath-empty-state');
    const contentWrapper = document.getElementById('mypath-content-wrapper');
    if (emptyState) emptyState.classList.add('hidden');
    if (contentWrapper) contentWrapper.classList.remove('hidden');
  }

  // Global helper for toggling checklist tasks
  window.toggleTask = async function(pathId, stageNum, taskId, isChecked) {
    try {
      const currentUser = window.skillpathAuth && window.skillpathAuth.getCurrentUser();
      const isOwnSavedPath = !!currentUser && !state.currentPathIsDemo &&
        state.currentPath && state.currentPath.id === pathId;

      // Reflect the change locally first so the progress bento is accurate
      // immediately, regardless of which backend persists it.
      const milestone = state.currentPath?.milestones?.find(m => m.stage === Number(stageNum));
      const task = milestone?.tasks?.find(t => t.id === taskId);
      if (task) task.completed = isChecked;

      if (isOwnSavedPath && window.skillpathUserData) {
        // Signed-in user's own generated path: persist to their Firestore
        // document only - never the shared backend/demo state.
        await window.skillpathUserData.saveUserProfile(currentUser.uid, { currentPath: state.currentPath });
      } else {
        // Guest exploring the shared showcase/demo path.
        await window.skillpathApi.updateTask(pathId, stageNum, taskId, isChecked);
      }

      if (state.currentPath) renderPathProgressBento(state.currentPath, state.streakCount);
      showToast('Progress updated successfully!', 2000);
    } catch (err) {
      console.error('Error updating task:', err);
      showToast(`Failed to update task: ${err.message}`, 3000);
    }
  };

  /* ==========================================================================
     Curated Learning Paths - Grid & Responsive Slider Implementation
     ========================================================================== */
  let pathsCarouselState = {
    mode: 'grid', // 'grid' | 'carousel'
    currentPage: 0,
    totalPages: 2
  };

  function setupPathsCarousel() {
    const track = document.getElementById('paths-carousel-track');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    const gridBtn = document.getElementById('paths-view-grid-btn');
    const carouselBtn = document.getElementById('paths-view-carousel-btn');
    const pageIndicator = document.getElementById('paths-page-indicator');

    if (!track) return;

    function getItemsPerPage() {
      const width = window.innerWidth;
      if (width > 900) return 3;
      if (width > 600) return 2;
      return 1;
    }

    function updatePageIndicator() {
      if (!pageIndicator || pathsCarouselState.mode !== 'carousel') return;
      const totalItems = state.paths ? state.paths.length : 6;
      const itemsPerPage = getItemsPerPage();
      pathsCarouselState.totalPages = Math.ceil(totalItems / itemsPerPage);

      const scrollLeft = track.scrollLeft;
      const maxScroll = track.scrollWidth - track.clientWidth;
      let page = Math.round((scrollLeft / (maxScroll || 1)) * (pathsCarouselState.totalPages - 1)) + 1;
      if (page < 1) page = 1;
      if (page > pathsCarouselState.totalPages) page = pathsCarouselState.totalPages;
      pathsCarouselState.currentPage = page - 1;

      pageIndicator.textContent = `${page} / ${pathsCarouselState.totalPages}`;
    }

    function setViewMode(mode) {
      pathsCarouselState.mode = mode;
      if (mode === 'grid') {
        track.className = 'paths-grid-layout';
        if (gridBtn) {
          gridBtn.className = 'px-2.5 py-1 rounded-md label-xs font-bold flex items-center gap-1 transition-all bg-primary text-on-primary shadow-sm';
          gridBtn.setAttribute('aria-pressed', 'true');
        }
        if (carouselBtn) {
          carouselBtn.className = 'px-2.5 py-1 rounded-md label-xs font-bold flex items-center gap-1 transition-all text-on-surface-variant hover:text-on-surface';
          carouselBtn.setAttribute('aria-pressed', 'false');
        }
        if (pageIndicator) pageIndicator.classList.add('hidden');
      } else {
        track.className = 'paths-carousel-layout';
        if (carouselBtn) {
          carouselBtn.className = 'px-2.5 py-1 rounded-md label-xs font-bold flex items-center gap-1 transition-all bg-primary text-on-primary shadow-sm';
          carouselBtn.setAttribute('aria-pressed', 'true');
        }
        if (gridBtn) {
          gridBtn.className = 'px-2.5 py-1 rounded-md label-xs font-bold flex items-center gap-1 transition-all text-on-surface-variant hover:text-on-surface';
          gridBtn.setAttribute('aria-pressed', 'false');
        }
        if (pageIndicator) {
          pageIndicator.classList.remove('hidden');
          updatePageIndicator();
        }
      }
    }

    if (gridBtn) {
      gridBtn.addEventListener('click', () => setViewMode('grid'));
    }

    if (carouselBtn) {
      carouselBtn.addEventListener('click', () => setViewMode('carousel'));
    }

    function scrollByOffset(direction) {
      if (pathsCarouselState.mode !== 'carousel') {
        // If user clicks arrow while in grid mode, switch to carousel to animate
        setViewMode('carousel');
      }

      const card = track.querySelector('.path-card');
      const cardWidth = card ? card.getBoundingClientRect().width : 300;
      const gap = 20; // 1.25rem gap
      const step = (cardWidth + gap) * getItemsPerPage();

      track.scrollBy({
        left: direction * step,
        behavior: 'smooth'
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => scrollByOffset(-1));
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => scrollByOffset(1));
    }

    track.addEventListener('scroll', () => {
      if (pathsCarouselState.mode === 'carousel') {
        requestAnimationFrame(updatePageIndicator);
      }
    }, { passive: true });

    window.addEventListener('resize', () => {
      if (pathsCarouselState.mode === 'carousel') {
        updatePageIndicator();
      }
    }, { passive: true });
  }

  function renderPathsCarousel(paths) {
    const track = document.getElementById('paths-carousel-track');
    if (!track) return;

    track.innerHTML = paths.map(p => {
      // Normalize certificate badge and icon to prevent line breaks & fragments
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

      return `
        <div class="path-card" tabindex="0" role="group" aria-label="Learning path: ${escapeHtml(p.title)}" id="path-card-${p.id}">
          <!-- Top: Consistent Badge & Rating Row -->
          <div class="path-card-header">
            <span class="badge ${badgeClass}" title="${escapeHtml(p.certificateType)}">
              <span class="material-symbols-outlined text-[13px]">${badgeIcon}</span>
              <span class="path-badge-text">${escapeHtml(shortCert)}</span>
            </span>
            <span class="badge badge-tertiary path-rating-badge" title="Learner Rating: ${p.rating || '4.9'} / 5.0">
              <span class="material-symbols-outlined text-[12px] text-amber-500">star</span>
              <span>${p.rating || '4.9'}</span>
            </span>
          </div>

          <!-- Middle: Title, Description, and Metadata -->
          <div class="path-card-body">
            <h3 class="path-card-title" title="${escapeHtml(p.title)}">
              ${escapeHtml(p.title)}
            </h3>
            <p class="path-card-desc" title="${escapeHtml(p.headline)}">
              ${escapeHtml(p.headline)}
            </p>

            <!-- Aligned Level, Duration, and Weekly-Time Badges -->
            <div class="path-card-meta">
              <span class="badge badge-neutral" title="Proficiency Level">
                <span class="material-symbols-outlined text-[12px]">bar_chart</span>
                <span>${escapeHtml(p.level)}</span>
              </span>
              <span class="badge badge-neutral" title="Estimated Duration">
                <span class="material-symbols-outlined text-[12px]">calendar_today</span>
                <span>${p.durationWeeks} wks</span>
              </span>
              <span class="badge badge-neutral" title="Weekly Time Commitment">
                <span class="material-symbols-outlined text-[12px]">schedule</span>
                <span>${p.hoursPerWeek} hrs/wk</span>
              </span>
            </div>
          </div>

          <!-- Bottom: Cost Tier & Consistently Positioned Explore Button -->
          <div class="path-card-footer">
            <div class="path-card-cost">
              <span class="path-cost-label">Tuition Tier</span>
              <span class="path-cost-value">
                <span class="material-symbols-outlined text-[14px]">payments</span>
                ${escapeHtml(p.costTier)}
              </span>
            </div>
            <button class="btn btn-primary btn-sm path-explore-btn" data-view-target="mypath" data-path-id="${p.id}" aria-label="Explore ${escapeHtml(p.title)} learning roadmap">
              <span>Explore Path</span>
              <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  /* ==========================================================================
     Featured Free Courses Section
     ========================================================================== */
  function renderFeaturedFreeCourses(courses) {
    const container = document.getElementById('featured-free-courses-grid');
    if (!container) return;

    const freeCourses = courses.filter(c => c.isCourseFree || c.coursePrice.toLowerCase().includes('free')).slice(0, 6);

    container.innerHTML = freeCourses.map(c => `
      <div class="card flex flex-col justify-between" id="course-card-${c.id}">
        <div>
          <div class="flex items-center justify-between gap-2 mb-2">
            <span class="badge badge-secondary">
              <span class="material-symbols-outlined text-[13px]">savings</span>
              Course: ${escapeHtml(c.coursePrice)}
            </span>
            ${c.isVerified 
              ? `<span class="badge badge-verified" title="Verified source: ${escapeHtml(c.source)}">
                   <span class="material-symbols-outlined text-[12px]">check_circle</span> Verified
                 </span>`
              : `<span class="badge badge-sample" title="Unverified sample listing">
                   <span class="material-symbols-outlined text-[12px]">info</span> Sample
                 </span>`
            }
          </div>

          <h4 class="headline-sm text-on-surface font-bold mb-1">${escapeHtml(c.title)}</h4>
          <p class="label-sm text-primary font-semibold mb-2">${escapeHtml(c.provider)} • ${escapeHtml(c.subject)}</p>
          <p class="body-sm text-on-surface-variant mb-3">${escapeHtml(c.description)}</p>

          <div class="p-2.5 rounded-lg bg-surface-container-low mb-3 flex flex-col gap-1 text-[12px]">
            <div class="flex items-center justify-between">
              <span class="text-on-surface-variant font-medium">Course Tuition:</span>
              <strong class="text-secondary font-bold">${escapeHtml(c.coursePrice)}</strong>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-on-surface-variant font-medium">Certificate:</span>
              <span class="text-on-surface font-semibold text-right">${escapeHtml(c.certificatePrice || 'None')}</span>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div class="flex items-center gap-2">
            <a href="${escapeHtml(c.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm flex-1">
              <span>View Course</span>
              <span class="material-symbols-outlined text-[14px]">open_in_new</span>
            </a>
            ${c.auditTip ? `
              <button class="btn btn-secondary btn-sm" title="How to audit for $0" onclick="window.toggleAuditTip('${c.id}')">
                <span class="material-symbols-outlined text-[15px]">lightbulb</span>
                <span>Audit Tip</span>
              </button>
            ` : ''}
          </div>

          ${c.auditTip ? `
            <div id="tip-${c.id}" class="hidden p-2.5 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed text-[11px] leading-relaxed">
              <strong>Audit Pro-Tip:</strong> ${escapeHtml(c.auditTip)}
            </div>
          ` : ''}
        </div>
      </div>
    `).join('');
  }

  // Global helper for audit tips
  window.toggleAuditTip = function(courseId) {
    const tipEl = document.getElementById(`tip-${courseId}`);
    if (tipEl) {
      tipEl.classList.toggle('hidden');
    }
  };

  /* ==========================================================================
     Live Learner Ticker
     ========================================================================== */
  function setupTicker() {
    const tickerText = document.getElementById('learner-ticker');
    if (!tickerText) return;

    const milestones = [
      "<span class='font-bold text-primary'>Marcus K.</span> just unlocked Google Data Analytics Capstone!",
      "<span class='font-bold text-secondary'>Sarah L.</span> passed AWS Certified Cloud Practitioner test!",
      "<span class='font-bold text-primary'>Elena T.</span> finished Phase 1: Python CLI Portfolio!",
      "<span class='font-bold text-tertiary'>David R.</span> verified Meta Frontend Sandbox project!",
      "<span class='font-bold text-secondary'>Carlos M.</span> completed 30 FSI Conversational Spanish audio drills!",
      "<span class='font-bold text-primary'>Amina B.</span> was accepted into Outreachy Open Source internship!"
    ];

    let index = 0;
    setInterval(() => {
      tickerText.style.opacity = '0';
      setTimeout(() => {
        index = (index + 1) % milestones.length;
        tickerText.innerHTML = milestones[index];
        tickerText.style.opacity = '1';
      }, 300);
    }, 4200);
  }

  /* ==========================================================================
     Diagnostic Questionnaire
     ========================================================================== */
  function setupQuestionnaire() {
    const generateBtn = document.getElementById('btn-generate-roadmap');
    const backBtn = document.getElementById('btn-questionnaire-back');

    if (backBtn) {
      backBtn.addEventListener('click', () => switchView('explore'));
    }

    setupRadioSelection('goal-options', 'goal');
    setupRadioSelection('experience-options', 'experienceLevel');
    setupRadioSelection('hours-options', 'weeklyHours');
    setupRadioSelection('budget-options', 'budget');
    setupRadioSelection('credential-options', 'credentialNeed');
    setupRadioSelection('style-options', 'learningStyle');

    if (generateBtn) {
      generateBtn.addEventListener('click', async () => {
        try {
          generateBtn.disabled = true;
          generateBtn.innerHTML = '<span class="spinner" style="width:18px;height:18px;border-width:2px;"></span><span>Generating Distinct Path...</span>';

          const generated = await window.skillpathApi.generatePath(state.questionnaire);
          state.currentPath = generated;
          state.currentPathIsDemo = false;
          hideMyPathEmptyState();
          renderPersonalizedPath(generated);

          const currentUser = window.skillpathAuth && window.skillpathAuth.getCurrentUser();
          if (currentUser && window.skillpathUserData) {
            window.skillpathUserData
              .savePersonalizedPath(currentUser.uid, generated, state.questionnaire)
              .catch(err => console.warn('[SkillPath] Failed to save personalized path:', err.message));
          }

          showToast('Distinct learning path generated tailored to your constraints!', 3500);
          switchView('mypath');
        } catch (err) {
          console.error('Failed to generate roadmap:', err);
          showToast(`Error: ${err.message}`, 4000);
        } finally {
          generateBtn.disabled = false;
          generateBtn.innerHTML = '<span>Generate My Roadmap</span><span class="material-symbols-outlined text-[18px]">arrow_forward</span>';
        }
      });
    }
  }

  function setupRadioSelection(containerId, stateKey) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.addEventListener('click', (e) => {
      const option = e.target.closest('[data-value]');
      if (!option) return;

      container.querySelectorAll('[data-value]').forEach(el => {
        el.classList.remove('selected');
        const icon = el.querySelector('.option-check-icon');
        if (icon) icon.textContent = 'radio_button_unchecked';
      });

      option.classList.add('selected');
      const icon = option.querySelector('.option-check-icon');
      if (icon) icon.textContent = 'check';

      state.questionnaire[stateKey] = option.dataset.value;
    });
  }

  /* ==========================================================================
     Practice Sandbox & Validation
     ========================================================================== */
  function setupPracticeSandbox() {
    const launchBtn = document.getElementById('launch-sandbox-btn');
    const runQueryBtn = document.getElementById('run-query-btn');
    const resetQueryBtn = document.getElementById('reset-query-btn');
    const queryInput = document.getElementById('sandbox-query-input');
    const terminalOutput = document.getElementById('terminal-output');
    const validateBtn = document.getElementById('validate-module-btn');
    const validateText = document.getElementById('validate-btn-text');

    if (launchBtn) {
      launchBtn.addEventListener('click', () => {
        launchBtn.innerHTML = '<span class="material-symbols-outlined text-[20px] animate-spin">refresh</span><span>Spinning Up Session...</span>';
        setTimeout(() => {
          launchBtn.innerHTML = '<span class="material-symbols-outlined text-[20px]">check</span><span>Sandbox Terminal Ready</span>';
          if (terminalOutput) {
            terminalOutput.innerHTML = `PostgreSQL 16.2 (Ubuntu) running in isolated sandbox container.\nType or select a query below and click 'Run Query'.\n\nDatabase: skillpath_production\nTables: customers (500 rows), orders (2,450 rows), order_items (6,120 rows)\n`;
          }
          setTimeout(() => {
            launchBtn.innerHTML = '<span class="material-symbols-outlined text-[20px]">terminal</span><span>Launch Interactive Sandbox</span>';
          }, 2500);
        }, 1000);
      });
    }

    if (runQueryBtn && queryInput && terminalOutput) {
      runQueryBtn.addEventListener('click', () => {
        const query = queryInput.value.trim();
        if (!query) return;

        terminalOutput.innerHTML += `\n> ${escapeHtml(query)}\n[Executing...]`;
        setTimeout(() => {
          let result = '';
          if (query.toUpperCase().includes('JOIN')) {
            result = ` customer_id | customer_name   | total_orders | total_spend \n-------------+-----------------+--------------+-------------\n 101         | Elena Vance     | 8            | $1,420.50   \n 104         | Marcus Sterling | 12           | $3,890.00   \n 109         | Priya Sharma    | 5            | $890.25     \n\n(3 rows returned in 12ms)`;
          } else if (query.toUpperCase().includes('SELECT')) {
            result = ` order_id | customer_id | status    | amount   | created_at \n----------+-------------+-----------+----------+---------------------\n 8021     | 104         | DELIVERED | $240.00  | 2025-03-12 14:22:01 \n 8022     | 101         | PENDING   | $89.50   | 2025-03-12 15:04:18 \n\n(2 rows returned in 8ms)`;
          } else {
            result = `Query executed successfully. 1 row affected (14ms).`;
          }
          terminalOutput.innerHTML += `\n${result}\n`;
          terminalOutput.scrollTop = terminalOutput.scrollHeight;
        }, 400);
      });
    }

    if (resetQueryBtn && queryInput) {
      resetQueryBtn.addEventListener('click', () => {
        queryInput.value = 'SELECT customer_id, count(order_id) as total_orders FROM orders GROUP BY customer_id HAVING count(order_id) > 5;';
      });
    }

    if (validateBtn) {
      validateBtn.addEventListener('click', async () => {
        try {
          validateBtn.disabled = true;
          const pathId = state.currentPath ? state.currentPath.id : 'path-data-analytics';
          const stageNum = 2;
          await window.skillpathApi.validateModule(pathId, stageNum);

          validateBtn.classList.remove('btn-secondary');
          validateBtn.classList.add('btn-success');
          if (validateText) validateText.textContent = 'Module Completed & Validated';
          showToast('Module Validated! Progress updated across your learning path.', 4000);
        } catch (err) {
          console.error('Validation error:', err);
          showToast(`Module validation noted: ${err.message}`, 3000);
        } finally {
          validateBtn.disabled = false;
        }
      });
    }
  }

  /* ==========================================================================
     Catalog Search & Filters
     ========================================================================== */
  function setupCatalogSearchAndFilters() {
    const searchInput = document.getElementById('catalog-search-input');
    const heroSearchInput = document.getElementById('hero-search-input');
    const levelSelect = document.getElementById('filter-level');
    const priceSelect = document.getElementById('filter-price');
    const certSelect = document.getElementById('filter-cert');
    const subjectChips = document.querySelectorAll('.filter-chip');

    subjectChips.forEach(chip => {
      chip.addEventListener('click', () => {
        subjectChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.activeSubjectFilter = chip.dataset.subject || 'all';
        applyCatalogFilters();
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', debounce((e) => {
        state.searchQuery = e.target.value;
        applyCatalogFilters();
      }, 300));
    }

    if (heroSearchInput) {
      heroSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          state.searchQuery = heroSearchInput.value;
          if (searchInput) searchInput.value = heroSearchInput.value;
          switchView('catalog');
          applyCatalogFilters();
        }
      });
    }

    if (levelSelect) {
      levelSelect.addEventListener('change', (e) => {
        state.selectedLevel = e.target.value;
        applyCatalogFilters();
      });
    }

    if (priceSelect) {
      priceSelect.addEventListener('change', (e) => {
        state.selectedPrice = e.target.value;
        applyCatalogFilters();
      });
    }

    if (certSelect) {
      certSelect.addEventListener('change', (e) => {
        state.selectedCert = e.target.value;
        applyCatalogFilters();
      });
    }
  }

  async function applyCatalogFilters() {
    try {
      const filtered = await window.skillpathApi.getCourses({
        search: state.searchQuery,
        subject: state.activeSubjectFilter,
        level: state.selectedLevel,
        price: state.selectedPrice,
        certificateStatus: state.selectedCert
      });
      renderCatalog(filtered);
    } catch (err) {
      console.error('Filter error:', err);
    }
  }

  function renderCatalog(courses) {
    const grid = document.getElementById('catalog-courses-grid');
    const countEl = document.getElementById('catalog-results-count');
    if (!grid) return;

    if (countEl) {
      countEl.textContent = `${courses.length} course${courses.length === 1 ? '' : 's'} available`;
    }

    if (courses.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full state-box">
          <span class="material-symbols-outlined text-[36px] text-outline">search_off</span>
          <h4 class="headline-sm">No courses match your filters</h4>
          <p class="body-sm text-on-surface-variant">Try widening your search term or clearing one of the filters.</p>
          <button class="btn btn-secondary btn-sm" onclick="window.clearAllFilters()">Clear All Filters</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = courses.map(c => `
      <div class="card flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between gap-2 mb-2">
            <span class="badge ${c.isCourseFree ? 'badge-secondary' : 'badge-primary'}">
              <span class="material-symbols-outlined text-[12px]">${c.isCourseFree ? 'savings' : 'payment'}</span>
              ${escapeHtml(c.coursePrice)}
            </span>
            ${c.isVerified 
              ? `<span class="badge badge-verified" title="Verified source: ${escapeHtml(c.source)}">
                   <span class="material-symbols-outlined text-[12px]">verified</span> Verified Mar 2025
                 </span>`
              : `<span class="badge badge-sample" title="Sample Listing">
                   <span class="material-symbols-outlined text-[12px]">warning</span> Sample Listing
                 </span>`
            }
          </div>

          <h4 class="headline-sm text-on-surface font-bold mb-1">${escapeHtml(c.title)}</h4>
          <p class="label-sm text-primary font-semibold mb-2">${escapeHtml(c.provider)} • ${escapeHtml(c.subject)}</p>
          <p class="body-sm text-on-surface-variant mb-3">${escapeHtml(c.description)}</p>

          <div class="p-2.5 rounded-lg bg-surface-container-low mb-3 flex flex-col gap-1 text-[12px]">
            <div class="flex items-center justify-between">
              <span class="text-on-surface-variant font-medium">Course Access:</span>
              <strong class="${c.isCourseFree ? 'text-secondary' : 'text-primary'}">${escapeHtml(c.coursePrice)}</strong>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-on-surface-variant font-medium">Certificate:</span>
              <span class="font-medium">${escapeHtml(c.certificatePrice || 'None')}</span>
            </div>
            <div class="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800 text-[11px] text-on-surface-variant">
              <span>Source:</span>
              <span>${escapeHtml(c.source || 'Curated Catalog')}</span>
            </div>
          </div>
        </div>

        <div class="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <a href="${escapeHtml(c.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm flex-1">
            <span>View Course</span>
            <span class="material-symbols-outlined text-[14px]">open_in_new</span>
          </a>
          ${c.auditTip ? `
            <button class="btn btn-secondary btn-sm" title="Audit Tip" onclick="window.toggleAuditTip('${c.id}')">
              <span class="material-symbols-outlined text-[15px]">lightbulb</span>
            </button>
          ` : ''}
        </div>
      </div>
    `).join('');
  }

  window.clearAllFilters = function() {
    state.searchQuery = '';
    state.activeSubjectFilter = 'all';
    state.selectedLevel = 'all';
    state.selectedPrice = 'all';
    state.selectedCert = 'all';

    const searchInput = document.getElementById('catalog-search-input');
    if (searchInput) searchInput.value = '';

    document.querySelectorAll('.filter-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.subject === 'all');
    });

    applyCatalogFilters();
  };

  /* ==========================================================================
     Utilities & Toast Notifications
     ========================================================================== */
  function showToast(message, duration = 3000) {
    if (!toast || !toastMessage) return;
    toastMessage.textContent = message;
    toast.classList.remove('hidden');

    setTimeout(() => {
      hideToast();
    }, duration);
  }

  function hideToast() {
    if (toast) toast.classList.add('hidden');
  }

  function debounce(func, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
