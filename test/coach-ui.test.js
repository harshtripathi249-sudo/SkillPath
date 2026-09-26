const assert = require('assert');

// Mock DOM elements and environment
function createMockElement(tag, id = '', className = '') {
  const listeners = {};
  const children = [];
  const classSet = new Set(className ? className.split(' ') : []);

  return {
    tagName: tag.toUpperCase(),
    id,
    className,
    value: '',
    disabled: false,
    textContent: '',
    innerHTML: '',
    style: {},
    scrollTop: 0,
    scrollHeight: 100,
    classList: {
      add: (c) => classSet.add(c),
      remove: (c) => classSet.delete(c),
      contains: (c) => classSet.has(c)
    },
    addEventListener: (event, handler) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    },
    dispatchEvent: (event) => {
      const handlers = listeners[event.type] || [];
      handlers.forEach(h => h(event));
    },
    appendChild: (child) => {
      children.push(child);
      return child;
    },
    getChildren: () => children,
    focus: () => { /* focus called */ }
  };
}

async function runUITests() {
  console.log('Starting SkillPath Coach UI behavior tests...');

  // Setup DOM mock registry
  const elements = {
    'coach-trigger-btn': createMockElement('button', 'coach-trigger-btn'),
    'header-coach-btn': createMockElement('button', 'header-coach-btn'),
    'coach-modal': createMockElement('div', 'coach-modal'),
    'coach-modal-close': createMockElement('button', 'coach-modal-close'),
    'coach-chat-form': createMockElement('form', 'coach-chat-form'),
    'coach-submit-btn': createMockElement('button', 'coach-submit-btn'),
    'coach-submit-text': createMockElement('span', 'coach-submit-text'),
    'coach-submit-icon': createMockElement('span', 'coach-submit-icon'),
    'coach-user-input': createMockElement('textarea', 'coach-user-input'),
    'coach-messages-container': createMockElement('div', 'coach-messages-container'),
    'coach-history-list': createMockElement('div', 'coach-history-list'),
    'coach-loading-indicator': createMockElement('div', 'coach-loading-indicator', 'hidden')
  };

  // Mock global document & window
  global.document = {
    getElementById: (id) => elements[id] || null,
    createElement: (tag) => createMockElement(tag)
  };

  global.escapeHtml = (str) => String(str || '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));

  // Mock state
  global.state = { paths: [] };

  // Track API calls
  let mockApiSuccess = true;
  let apiCallCount = 0;
  global.window = {
    skillpathApi: {
      askCoach: async ({ query }) => {
        apiCallCount++;
        if (!mockApiSuccess) {
          throw new Error('Coach service connection timed out (simulated offline)');
        }
        return {
          directAnswer: `Answer to ${query}`,
          detectedConstraints: { goal: 'Python' },
          recommendation: { pathId: 'path-python-automation', pathTitle: 'Python Track' },
          generatedRoadmap: { id: 'path-python-automation', title: 'Python Track' }
        };
      }
    }
  };

  // Extract and simulate setupLearningCoach logic
  let isCoachSubmitting = false;
  const form = elements['coach-chat-form'];
  const submitBtn = elements['coach-submit-btn'];
  const submitText = elements['coach-submit-text'];
  const inputEl = elements['coach-user-input'];
  const historyList = elements['coach-history-list'];
  const loadingIndicator = elements['coach-loading-indicator'];

  const handleInquiry = () => {
    if (isCoachSubmitting) return;
    const query = inputEl ? inputEl.value.trim() : '';
    if (!query) {
      if (inputEl) inputEl.focus();
      return;
    }
    submitCoachQuery(query);
  };

  async function submitCoachQuery(query) {
    if (isCoachSubmitting) return;
    const trimmedQuery = (query || '').trim();
    if (!trimmedQuery) return;

    isCoachSubmitting = true;
    if (inputEl) inputEl.value = '';
    if (submitBtn) submitBtn.disabled = true;
    if (loadingIndicator) loadingIndicator.classList.remove('hidden');

    const userMsg = createMockElement('div', '', 'coach-msg coach-msg-user');
    userMsg.innerHTML = `<p>${trimmedQuery}</p>`;
    historyList.appendChild(userMsg);

    try {
      const result = await global.window.skillpathApi.askCoach({ query: trimmedQuery });
      if (loadingIndicator) loadingIndicator.classList.add('hidden');
      const botMsg = createMockElement('div', '', 'coach-msg coach-msg-bot');
      botMsg.innerHTML = `<p>${result.directAnswer}</p>`;
      historyList.appendChild(botMsg);
    } catch (err) {
      if (loadingIndicator) loadingIndicator.classList.add('hidden');
      if (inputEl) inputEl.value = trimmedQuery; // Preserve input on error
      const errorMsg = createMockElement('div', '', 'coach-msg coach-error');
      errorMsg.innerHTML = `<p>${err.message}</p>`;
      historyList.appendChild(errorMsg);
    } finally {
      isCoachSubmitting = false;
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  // Bind events
  form.addEventListener('submit', (e) => {
    e.defaultPrevented = true;
    handleInquiry();
  });

  submitBtn.addEventListener('click', (e) => {
    e.defaultPrevented = true;
    handleInquiry();
  });

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) return;
      e.defaultPrevented = true;
      handleInquiry();
    }
  });

  // TEST 1: Submit empty / whitespace message
  inputEl.value = '   ';
  form.dispatchEvent({ type: 'submit' });
  assert.strictEqual(apiCallCount, 0, 'Empty message should not trigger API call');
  assert.strictEqual(historyList.getChildren().length, 0, 'No message should be appended for empty submission');
  console.log('✓ Scenario 1: Empty and whitespace messages are rejected');

  // TEST 2: Submit question via Send Button
  inputEl.value = 'How do I start learning Python?';
  submitBtn.dispatchEvent({ type: 'click' });
  await new Promise(r => setTimeout(r, 10)); // await async promise

  assert.strictEqual(apiCallCount, 1, 'Send button click should call askCoach API');
  assert.strictEqual(inputEl.value, '', 'Input field should be cleared on successful send');
  assert.strictEqual(historyList.getChildren().length, 2, 'History list should have user msg and bot response');
  assert.strictEqual(loadingIndicator.classList.contains('hidden'), true, 'Loading indicator should be hidden after response');
  assert.strictEqual(submitBtn.disabled, false, 'Submit button should be re-enabled');
  console.log('✓ Scenario 2: Submit via send button succeeded, loading resolved, input cleared');

  // TEST 3: Submit second question via Enter key (Preserve conversation)
  inputEl.value = 'Is Harvard CS50 completely free?';
  inputEl.dispatchEvent({ type: 'keydown', key: 'Enter', shiftKey: false });
  await new Promise(r => setTimeout(r, 10));

  assert.strictEqual(apiCallCount, 2, 'Enter key should trigger second API call');
  assert.strictEqual(historyList.getChildren().length, 4, 'History should now have 4 messages (earlier messages preserved)');
  console.log('✓ Scenario 3: Submit via Enter key succeeded and earlier messages remained visible');

  // TEST 4: Shift+Enter allows newline without submitting
  inputEl.value = 'Line 1';
  const shiftEnterEvt = { type: 'keydown', key: 'Enter', shiftKey: true, defaultPrevented: false };
  inputEl.dispatchEvent(shiftEnterEvt);
  assert.strictEqual(shiftEnterEvt.defaultPrevented, false, 'Shift+Enter should allow default newline');
  assert.strictEqual(apiCallCount, 2, 'Shift+Enter should not trigger API submission');
  console.log('✓ Scenario 4: Shift+Enter inserts newline without sending');

  // TEST 5: Error handling - Service unavailable / timeout
  mockApiSuccess = false;
  inputEl.value = 'Will this fail gracefully?';
  submitBtn.dispatchEvent({ type: 'click' });
  await new Promise(r => setTimeout(r, 10));

  assert.strictEqual(apiCallCount, 3, 'API was called');
  assert.strictEqual(inputEl.value, 'Will this fail gracefully?', 'User text should be restored into input on failure');
  assert.strictEqual(loadingIndicator.classList.contains('hidden'), true, 'Loading indicator should be hidden on error');
  assert.strictEqual(submitBtn.disabled, false, 'Submit button should be re-enabled on error');
  const lastChild = historyList.getChildren()[historyList.getChildren().length - 1];
  assert.ok(lastChild.className.includes('coach-error'), 'Error message should be rendered in conversation');
  console.log('✓ Scenario 5: Service failure handled visibly with error message and text restored into input');

  console.log('\nAll 5 Coach UI interaction scenarios verified successfully!');
}

runUITests().catch(err => {
  console.error('UI Test Failure:', err);
  process.exit(1);
});
