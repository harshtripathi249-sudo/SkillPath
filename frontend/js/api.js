/**
 * SkillPath Frontend API Client
 * Connects frontend views to backend REST endpoints with validation & error handling
 */

// Reads the base URL set in config.js - empty string keeps same-origin '/api' for local dev.
const API_BASE = `${window.SKILLPATH_API_BASE_URL || ''}/api`;

const api = {
  /**
   * Check API health
   */
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (!res.ok) throw new Error(`Health check failed with status: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[API Client] Backend unreachable, fallback enabled:', err.message);
      return { status: 'offline', error: err.message };
    }
  },

  /**
   * Fetch courses with optional filters
   * @param {Object} filters { search, subject, level, price, certificateStatus, featured }
   */
  async getCourses(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== 'all' && val !== '') {
        params.append(key, val);
      }
    });

    const url = `${API_BASE}/courses?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to load courses (${res.status})`);
    }
    const json = await res.json();
    return json.data || [];
  },

  /**
   * Fetch course statistics
   */
  async getStats() {
    const res = await fetch(`${API_BASE}/courses/stats`);
    if (!res.ok) {
      throw new Error(`Failed to load course statistics (${res.status})`);
    }
    const json = await res.json();
    return json.data || {};
  },

  /**
   * Fetch all curated learning paths
   */
  async getPaths() {
    const res = await fetch(`${API_BASE}/paths`);
    if (!res.ok) {
      throw new Error(`Failed to load learning paths (${res.status})`);
    }
    const json = await res.json();
    return json.data || [];
  },

  /**
   * Fetch single learning path by ID or slug
   */
  async getPathById(idOrSlug) {
    const res = await fetch(`${API_BASE}/paths/${encodeURIComponent(idOrSlug)}`);
    if (!res.ok) {
      throw new Error(`Learning path not found (${res.status})`);
    }
    const json = await res.json();
    return json.data;
  },

  /**
   * Generate customized roadmap based on user questionnaire constraints
   */
  async generatePath(constraints) {
    const res = await fetch(`${API_BASE}/paths/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(constraints)
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.message || `Failed to generate path (${res.status})`);
    }

    const json = await res.json();
    return json.data;
  },

  /**
   * Update task checkbox status in a milestone
   */
  async updateTask(pathId, stageNum, taskId, completed) {
    const url = `${API_BASE}/paths/${encodeURIComponent(pathId)}/stages/${stageNum}/tasks/${encodeURIComponent(taskId)}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed })
    });

    if (!res.ok) {
      throw new Error(`Failed to update task status (${res.status})`);
    }

    const json = await res.json();
    return json.data;
  },

  /**
   * Mark module stage as validated
   */
  async validateModule(pathId, stageNum) {
    const url = `${API_BASE}/paths/${encodeURIComponent(pathId)}/stages/${stageNum}/validate`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!res.ok) {
      throw new Error(`Failed to validate module (${res.status})`);
    }

    const json = await res.json();
    return json.data;
  },

  /**
   * Fetch internships and apprenticeships
   */
  async getInternships(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== 'all' && val !== '') {
        params.append(key, val);
      }
    });

    const res = await fetch(`${API_BASE}/internships?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to load internships (${res.status})`);
    }
    const json = await res.json();
    return json.data || [];
  },

  /**
   * Fetch internship statistics
   */
  async getInternshipStats() {
    const res = await fetch(`${API_BASE}/internships/stats`);
    if (!res.ok) {
      throw new Error(`Failed to load internship statistics (${res.status})`);
    }
    const json = await res.json();
    return json.data || {};
  },

  /**
   * Fetch coach presets
   */
  async getCoachPresets() {
    const res = await fetch(`${API_BASE}/coach/presets`);
    if (!res.ok) {
      throw new Error(`Failed to load coach presets (${res.status})`);
    }
    const json = await res.json();
    return json.data || [];
  },

  /**
   * Ask the interactive learning coach
   */
  async askCoach(payload) {
    const res = await fetch(`${API_BASE}/coach/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Coach inquiry failed (${res.status})`);
    }
    const json = await res.json();
    return json.data;
  }
};

window.skillpathApi = api;
