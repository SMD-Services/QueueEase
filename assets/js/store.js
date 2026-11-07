/**
 * QueueEase - Mock Data Layer & Reactive Multi-Tab Store
 * assets/js/store.js
 * 
 * Supports Citizen, Staff, Display, and Admin portals.
 * Uses localStorage persistence and window storage events for real-time synchronization.
 */

const STORAGE_KEYS = {
  SERVICES: 'queueease_services_v2',
  COUNTERS: 'queueease_counters_v2',
  STAFF: 'queueease_staff_v2',
  TOKENS: 'queueease_tokens_v2',
  SETTINGS: 'queueease_settings_v2',
  ACTIVE_TOKEN_ID: 'queueease_active_citizen_token_v2'
};

/* --------------------------------------------------------------------------
   Seed Data Definitions
   -------------------------------------------------------------------------- */
const SEED_SERVICES = [
  {
    id: 'srv-1',
    code: 'A',
    name: 'Certificate Application',
    category: 'Civil Registry',
    description: 'Birth certificates, marriage records, residency attestations, and citizenship certificates.',
    avgWaitMins: 15,
    counterRange: 'Counters 1 to 4',
    icon: 'badge',
    status: 'open',
    tags: ['Est. 15-20 mins', 'Counters 1 to 4', 'Original ID Required']
  },
  {
    id: 'srv-2',
    code: 'B',
    name: 'Document Verification',
    category: 'Documentation',
    description: 'Apostille certification, academic notary verification, and government identity document audits.',
    avgWaitMins: 10,
    counterRange: 'Counter 6',
    icon: 'verified_user',
    status: 'open',
    tags: ['Est. 10 mins', 'Instant Seal', 'Counter 6']
  },
  {
    id: 'srv-3',
    code: 'C',
    name: 'Public Enquiry',
    category: 'General Public',
    description: 'General administrative inquiries, zoning consultations, municipal council questions.',
    avgWaitMins: 18,
    counterRange: 'Counter 5',
    icon: 'help_outline',
    status: 'open',
    tags: ['Est. 5-8 mins', 'Multi-lingual Staff', 'Walk-in Friendly']
  },
  {
    id: 'srv-4',
    code: 'D',
    name: 'Social Welfare & Other Services',
    category: 'Welfare & Grants',
    description: 'Property tax clearances, utility subsidies, municipal waste permits, and civil notices.',
    avgWaitMins: 8,
    counterRange: 'Counters 7 & 8',
    icon: 'account_balance',
    status: 'open',
    tags: ['Est. 20 mins', 'Payments & Grants', 'Counters 7 & 8']
  }
];

const SEED_STAFF = [
  { id: 'stf-1', name: 'Mark Jenkins', role: 'Senior Registrar', counterId: 'cnt-2', avatar: 'MJ', active: true },
  { id: 'stf-2', name: 'J. Miller', role: 'Civic Official', counterId: 'cnt-1', avatar: 'JM', active: true },
  { id: 'stf-3', name: 'David Chen', role: 'Notary Specialist', counterId: 'cnt-3', avatar: 'DC', active: true },
  { id: 'stf-4', name: 'Carlos Rodriguez', role: 'Biometrics Officer', counterId: 'cnt-4', avatar: 'CR', active: true },
  { id: 'stf-5', name: 'Elena Vance', role: 'Enquiry Counselor', counterId: 'cnt-5', avatar: 'EV', active: true }
];

const SEED_COUNTERS = [
  {
    id: 'cnt-1',
    number: '01',
    desk: 'Room 102',
    name: 'Counter 01',
    staffId: 'stf-2',
    staffName: 'Officer Miller',
    serviceIds: ['srv-1'],
    status: 'calling', // 'available', 'calling', 'serving', 'recess'
    currentTokenId: 'tok-a006',
    serviceType: 'National ID Issuance'
  },
  {
    id: 'cnt-2',
    number: '02',
    desk: 'Desk 104',
    name: 'Counter 02',
    staffId: 'stf-1',
    staffName: 'Officer Jenkins',
    serviceIds: ['srv-1'],
    status: 'serving',
    currentTokenId: 'tok-a008',
    serviceType: 'Birth Certificate App.'
  },
  {
    id: 'cnt-3',
    number: '03',
    desk: 'Express Notary Desk',
    name: 'Counter 03',
    staffId: 'stf-3',
    staffName: 'Officer Chen',
    serviceIds: ['srv-2'],
    status: 'serving',
    currentTokenId: 'tok-b014',
    serviceType: 'Legal Attestation'
  },
  {
    id: 'cnt-4',
    number: '04',
    desk: 'Biometrics Capture',
    name: 'Counter 04',
    staffId: 'stf-4',
    staffName: 'Officer Rodriguez',
    serviceIds: ['srv-1', 'srv-2'],
    status: 'available',
    currentTokenId: null,
    serviceType: 'Biometrics Wrap Up'
  },
  {
    id: 'cnt-5',
    number: '05',
    desk: 'Desk 106',
    name: 'Counter 05',
    staffId: 'stf-5',
    staffName: 'Officer Vance',
    serviceIds: ['srv-3'],
    status: 'serving',
    currentTokenId: 'tok-c002',
    serviceType: 'Apostille Verification'
  },
  {
    id: 'cnt-6',
    number: '06',
    desk: 'Relief Standby',
    name: 'Counter 06',
    staffId: null,
    staffName: 'Relief Standby',
    serviceIds: ['srv-2', 'srv-4'],
    status: 'recess',
    currentTokenId: null,
    serviceType: 'Paused (Resumes 11:00 AM)'
  }
];

const SEED_SETTINGS = {
  centerName: 'Civic Center West • Hall B',
  hubStatus: 'Optimal Flow',
  openTime: '08:00',
  closeTime: '17:30',
  audioChimeEnabled: true,
  smsDispatchEnabled: true
};

const SEED_TOKENS = [
  // 1-5: Completed
  { id: 'tok-a001', tokenNumber: 'A001', serviceId: 'srv-1', citizenName: 'Arthur Pendelton', phone: '(555) 011-2233', priority: 'regular', status: 'completed', counterId: 'cnt-1', createdAt: Date.now() - 90 * 60000, calledAt: Date.now() - 75 * 60000, completedAt: Date.now() - 65 * 60000 },
  { id: 'tok-a002', tokenNumber: 'A002', serviceId: 'srv-1', citizenName: 'Hannah Abbott', phone: '(555) 012-3344', priority: 'senior_disabled', status: 'completed', counterId: 'cnt-2', createdAt: Date.now() - 85 * 60000, calledAt: Date.now() - 70 * 60000, completedAt: Date.now() - 55 * 60000 },
  { id: 'tok-a003', tokenNumber: 'A003', serviceId: 'srv-1', citizenName: 'Gregory House', phone: '(555) 013-4455', priority: 'regular', status: 'completed', counterId: 'cnt-1', createdAt: Date.now() - 75 * 60000, calledAt: Date.now() - 60 * 60000, completedAt: Date.now() - 48 * 60000 },
  { id: 'tok-b011', tokenNumber: 'B011', serviceId: 'srv-2', citizenName: 'Lucas Grey', phone: '(555) 014-5566', priority: 'regular', status: 'completed', counterId: 'cnt-3', createdAt: Date.now() - 70 * 60000, calledAt: Date.now() - 50 * 60000, completedAt: Date.now() - 42 * 60000 },
  { id: 'tok-a004', tokenNumber: 'A004', serviceId: 'srv-1', citizenName: 'Clara Oswald', phone: '(555) 015-6677', priority: 'regular', status: 'completed', counterId: 'cnt-4', createdAt: Date.now() - 60 * 60000, calledAt: Date.now() - 40 * 60000, completedAt: Date.now() - 32 * 60000 },
  
  // 6: Recently completed at Counter 04
  { id: 'tok-a005', tokenNumber: 'A005', serviceId: 'srv-1', citizenName: 'Derrick Rose', phone: '(555) 016-7788', priority: 'regular', status: 'completed', counterId: 'cnt-4', createdAt: Date.now() - 45 * 60000, calledAt: Date.now() - 25 * 60000, completedAt: Date.now() - 5 * 60000 },

  // 7-10: Currently Calling / Serving
  { id: 'tok-a006', tokenNumber: 'A006', serviceId: 'srv-1', citizenName: 'Brianna Stewart', phone: '(555) 017-8899', priority: 'regular', status: 'calling', counterId: 'cnt-1', createdAt: Date.now() - 35 * 60000, calledAt: Date.now() - 3 * 60000, completedAt: null },
  { id: 'tok-b014', tokenNumber: 'B014', serviceId: 'srv-2', citizenName: 'Samuel Drake', phone: '(555) 018-9900', priority: 'regular', status: 'serving', counterId: 'cnt-3', createdAt: Date.now() - 30 * 60000, calledAt: Date.now() - 10 * 60000, completedAt: null },
  { id: 'tok-c002', tokenNumber: 'C002', serviceId: 'srv-3', citizenName: 'Monica Geller', phone: '(555) 019-1122', priority: 'regular', status: 'serving', counterId: 'cnt-5', createdAt: Date.now() - 28 * 60000, calledAt: Date.now() - 8 * 60000, completedAt: null },

  // 11: Active Citizen Persona from screenshots (Eleanor Vance - A008)
  { id: 'tok-a008', tokenNumber: 'A008', serviceId: 'srv-1', citizenName: 'Eleanor Vance', phone: '(555) 019-2834', priority: 'senior_disabled', status: 'serving', counterId: 'cnt-2', createdAt: Date.now() - 22 * 60000, calledAt: Date.now() - 4 * 60000, completedAt: null },

  // 12: Next in Line
  { id: 'tok-a007', tokenNumber: 'A007', serviceId: 'srv-1', citizenName: 'Thomas Anderson', phone: '(555) 020-3344', priority: 'regular', status: 'waiting', counterId: null, createdAt: Date.now() - 20 * 60000, calledAt: null, completedAt: null },

  // 13-18: Waiting queue
  { id: 'tok-a009', tokenNumber: 'A009', serviceId: 'srv-1', citizenName: 'Zoe Saldana', phone: '(555) 021-4455', priority: 'regular', status: 'waiting', counterId: null, createdAt: Date.now() - 18 * 60000, calledAt: null, completedAt: null },
  { id: 'tok-a010', tokenNumber: 'A010', serviceId: 'srv-1', citizenName: 'Philip Brooks', phone: '(555) 022-5566', priority: 'mobility', status: 'waiting', counterId: null, createdAt: Date.now() - 15 * 60000, calledAt: null, completedAt: null },
  { id: 'tok-b015', tokenNumber: 'B015', serviceId: 'srv-2', citizenName: 'Nora Valkyrie', phone: '(555) 023-6677', priority: 'regular', status: 'waiting', counterId: null, createdAt: Date.now() - 14 * 60000, calledAt: null, completedAt: null },
  { id: 'tok-b016', tokenNumber: 'B016', serviceId: 'srv-2', citizenName: 'Lie Ren', phone: '(555) 024-7788', priority: 'expectant', status: 'waiting', counterId: null, createdAt: Date.now() - 12 * 60000, calledAt: null, completedAt: null },
  { id: 'tok-c003', tokenNumber: 'C003', serviceId: 'srv-3', citizenName: 'Jaime Lannister', phone: '(555) 025-8899', priority: 'regular', status: 'waiting', counterId: null, createdAt: Date.now() - 10 * 60000, calledAt: null, completedAt: null },
  { id: 'tok-d001', tokenNumber: 'D001', serviceId: 'srv-4', citizenName: 'Arya Stark', phone: '(555) 026-9900', priority: 'regular', status: 'waiting', counterId: null, createdAt: Date.now() - 8 * 60000, calledAt: null, completedAt: null },

  // 19-20: Skipped / No-show
  { id: 'tok-a000-skip', tokenNumber: 'A000', serviceId: 'srv-1', citizenName: 'Kevin Malone', phone: '(555) 027-1122', priority: 'regular', status: 'skipped', counterId: 'cnt-1', createdAt: Date.now() - 50 * 60000, calledAt: Date.now() - 35 * 60000, completedAt: Date.now() - 30 * 60000 },
  { id: 'tok-c001-skip', tokenNumber: 'C001', serviceId: 'srv-3', citizenName: 'Dwight Schrute', phone: '(555) 028-2233', priority: 'regular', status: 'skipped', counterId: 'cnt-5', createdAt: Date.now() - 40 * 60000, calledAt: Date.now() - 25 * 60000, completedAt: Date.now() - 20 * 60000 }
];

/* --------------------------------------------------------------------------
   Local Storage Helper
   -------------------------------------------------------------------------- */
function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.warn(`[Store] Failed to read ${key}:`, err);
    return fallback;
  }
}

function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('queueease_store_change', { detail: { key, value } }));
  } catch (err) {
    console.error(`[Store] Failed to write ${key}:`, err);
  }
}

/* --------------------------------------------------------------------------
   Store Initialization
   -------------------------------------------------------------------------- */
export function initStore() {
  if (!localStorage.getItem(STORAGE_KEYS.SERVICES)) {
    saveData(STORAGE_KEYS.SERVICES, SEED_SERVICES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.STAFF)) {
    saveData(STORAGE_KEYS.STAFF, SEED_STAFF);
  }
  if (!localStorage.getItem(STORAGE_KEYS.COUNTERS)) {
    saveData(STORAGE_KEYS.COUNTERS, SEED_COUNTERS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    saveData(STORAGE_KEYS.SETTINGS, SEED_SETTINGS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.TOKENS)) {
    saveData(STORAGE_KEYS.TOKENS, SEED_TOKENS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_TOKEN_ID)) {
    saveData(STORAGE_KEYS.ACTIVE_TOKEN_ID, 'tok-a008'); // Default active token for seamless citizen preview
  }
}

// Auto-run initialization
initStore();

/* --------------------------------------------------------------------------
   Exported API
   -------------------------------------------------------------------------- */
export const Store = {
  // Services
  getServices() {
    return loadData(STORAGE_KEYS.SERVICES, SEED_SERVICES);
  },
  getService(id) {
    return this.getServices().find(s => s.id === id);
  },

  // Counters
  getCounters() {
    return loadData(STORAGE_KEYS.COUNTERS, SEED_COUNTERS);
  },
  getCounter(counterId) {
    return this.getCounters().find(c => c.id === counterId);
  },
  setCounterStatus(counterId, status, currentTokenId = null) {
    const counters = this.getCounters().map(c => {
      if (c.id === counterId) {
        return { ...c, status, currentTokenId };
      }
      return c;
    });
    saveData(STORAGE_KEYS.COUNTERS, counters);
    return counters.find(c => c.id === counterId);
  },

  // Staff
  getStaff() {
    return loadData(STORAGE_KEYS.STAFF, SEED_STAFF);
  },
  getStaffMember(staffId) {
    return this.getStaff().find(s => s.id === staffId);
  },

  // Settings
  getSettings() {
    return loadData(STORAGE_KEYS.SETTINGS, SEED_SETTINGS);
  },
  saveSettings(settings) {
    saveData(STORAGE_KEYS.SETTINGS, settings);
  },

  // Tokens
  getAllTokens() {
    return loadData(STORAGE_KEYS.TOKENS, SEED_TOKENS);
  },
  getToken(id) {
    return this.getAllTokens().find(t => t.id === id || t.tokenNumber.toLowerCase() === (id || '').toLowerCase());
  },

  // Get active queue filtered optionally by service
  getQueue(serviceId = null) {
    const tokens = this.getAllTokens();
    return tokens.filter(t => {
      const matchService = serviceId ? t.serviceId === serviceId : true;
      return matchService && (t.status === 'waiting' || t.status === 'calling' || t.status === 'serving');
    });
  },

  // Create a new token
  createToken({ serviceId, citizenName, phone = '', priority = 'regular' }) {
    const services = this.getServices();
    const service = services.find(s => s.id === serviceId) || services[0];
    const tokens = this.getAllTokens();

    const serviceTokens = tokens.filter(t => t.serviceId === service.id);
    const count = serviceTokens.length + 1;
    const tokenNumber = `${service.code}${String(count).padStart(3, '0')}`;

    const newToken = {
      id: `tok-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tokenNumber,
      serviceId: service.id,
      citizenName: citizenName || 'Anonymous Citizen',
      phone: phone || '',
      priority: priority || 'regular',
      status: 'waiting',
      counterId: null,
      createdAt: Date.now(),
      calledAt: null,
      completedAt: null
    };

    tokens.push(newToken);
    saveData(STORAGE_KEYS.TOKENS, tokens);
    this.setActiveCitizenToken(newToken.id);
    return newToken;
  },

  // Save tokens directly
  saveTokens(tokens) {
    saveData(STORAGE_KEYS.TOKENS, tokens);
  },

  // Call next waiting token for a counter
  callNext(arg1, arg2) {
    let counterId = 'cnt-2';
    let serviceId = null;

    if (typeof arg1 === 'string') {
      if (arg1.startsWith('cnt-') || arg1.startsWith('cnt')) {
        counterId = arg1;
      } else if (arg1.startsWith('srv-') || arg1.startsWith('srv')) {
        serviceId = arg1;
      }
    }
    if (typeof arg2 === 'string') {
      if (arg2.startsWith('cnt-') || arg2.startsWith('cnt')) {
        counterId = arg2;
      } else if (arg2.startsWith('srv-') || arg2.startsWith('srv')) {
        serviceId = arg2;
      }
    }

    const counter = this.getCounter(counterId) || this.getCounters()[1] || this.getCounters()[0];
    const tokens = this.getAllTokens();

    const waitingList = tokens.filter(t => {
      if (t.status !== 'waiting') return false;
      if (serviceId) return t.serviceId === serviceId;
      if (counter && counter.serviceIds && counter.serviceIds.length) {
        return counter.serviceIds.includes(t.serviceId);
      }
      return true;
    });

    if (waitingList.length === 0) return null;

    // Priority sorting: senior_disabled, mobility, expectant first, then FIFO by createdAt
    waitingList.sort((a, b) => {
      const isPriorityA = ['senior_disabled', 'mobility', 'expectant'].includes(a.priority);
      const isPriorityB = ['senior_disabled', 'mobility', 'expectant'].includes(b.priority);
      if (isPriorityA && !isPriorityB) return -1;
      if (!isPriorityA && isPriorityB) return 1;
      return a.createdAt - b.createdAt;
    });

    const nextToken = waitingList[0];
    nextToken.status = 'calling';
    nextToken.counterId = counter.id;
    nextToken.calledAt = Date.now();

    saveData(STORAGE_KEYS.TOKENS, tokens);
    this.setCounterStatus(counter.id, 'calling', nextToken.id);

    // Also update active citizen pass if this token is active
    const activePass = this.getActiveCitizenToken();
    if (activePass && (activePass.id === nextToken.id || activePass.tokenNumber === nextToken.tokenNumber)) {
      this.setActiveCitizenToken(nextToken.id);
    }

    return nextToken;
  },

  // Call specific token directly by token ID or number
  callToken(tokenArg, counterId = 'cnt-2') {
    const tokens = this.getAllTokens();
    const token = tokens.find(t => 
      t.id === tokenArg || 
      t.tokenNumber.toLowerCase() === String(tokenArg).toLowerCase()
    );
    if (!token) return null;

    const counter = this.getCounter(counterId) || this.getCounters()[1] || this.getCounters()[0];
    token.status = 'calling';
    token.counterId = counter ? counter.id : counterId;
    token.calledAt = Date.now();

    saveData(STORAGE_KEYS.TOKENS, tokens);
    if (counter) {
      this.setCounterStatus(counter.id, 'calling', token.id);
    }

    const activePass = this.getActiveCitizenToken();
    if (activePass && (activePass.id === token.id || activePass.tokenNumber === token.tokenNumber)) {
      this.setActiveCitizenToken(token.id);
    }

    return token;
  },

  // Complete token handling at counter or by token ID
  completeToken(arg) {
    const tokens = this.getAllTokens();
    let token = null;

    if (typeof arg === 'string') {
      token = tokens.find(t => t.id === arg || t.tokenNumber.toLowerCase() === arg.toLowerCase());
    }

    if (!token && typeof arg === 'string') {
      const counter = this.getCounter(arg);
      if (counter && counter.currentTokenId) {
        token = tokens.find(t => t.id === counter.currentTokenId);
      }
    }

    if (!token) {
      token = tokens.find(t => t.status === 'serving' || t.status === 'calling');
    }

    if (token) {
      token.status = 'completed';
      token.completedAt = Date.now();
      if (token.counterId) {
        this.setCounterStatus(token.counterId, 'available', null);
      }
      saveData(STORAGE_KEYS.TOKENS, tokens);
    }

    return token;
  },

  // Skip / No-show token
  skipToken(arg, reason = 'No show after 3 calls') {
    const tokens = this.getAllTokens();
    let token = null;

    if (typeof arg === 'string') {
      token = tokens.find(t => t.id === arg || t.tokenNumber.toLowerCase() === arg.toLowerCase());
    }

    if (!token && typeof arg === 'string') {
      const counter = this.getCounter(arg);
      if (counter && counter.currentTokenId) {
        token = tokens.find(t => t.id === counter.currentTokenId);
      }
    }

    if (!token) {
      token = tokens.find(t => t.status === 'serving' || t.status === 'calling');
    }

    if (token) {
      token.status = 'skipped';
      token.completedAt = Date.now();
      token.skipReason = reason;
      if (token.counterId) {
        this.setCounterStatus(token.counterId, 'available', null);
      }
      saveData(STORAGE_KEYS.TOKENS, tokens);
    }

    return token;
  },

  // Transfer token to another service
  transferToken(tokenId, targetServiceId, targetCounter = null, notes = '') {
    const tokens = this.getAllTokens();
    const token = tokens.find(t => t.id === tokenId || t.tokenNumber.toLowerCase() === (tokenId || '').toLowerCase());
    if (!token) return null;

    token.serviceId = targetServiceId;
    token.status = 'waiting';
    token.counterId = targetCounter;
    token.calledAt = null;
    token.transferNotes = notes;

    saveData(STORAGE_KEYS.TOKENS, tokens);
    return token;
  },

  // Citizen active pass management
  getActiveCitizenToken() {
    const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_TOKEN_ID);
    if (!activeId) return null;
    return this.getToken(activeId);
  },
  setActiveCitizenToken(tokenId) {
    saveData(STORAGE_KEYS.ACTIVE_TOKEN_ID, tokenId);
  },
  clearActiveCitizenToken() {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_TOKEN_ID);
    window.dispatchEvent(new CustomEvent('queueease_store_change', { detail: { key: STORAGE_KEYS.ACTIVE_TOKEN_ID, value: null } }));
  },

  // Queue position calculation
  getQueuePosition(tokenId) {
    const token = this.getToken(tokenId);
    if (!token || token.status !== 'waiting') return { position: 0, waitMinutes: 0 };

    const waiting = this.getAllTokens().filter(t => 
      t.serviceId === token.serviceId && t.status === 'waiting'
    );

    // Sort to find exact index
    waiting.sort((a, b) => {
      const isPriorityA = ['senior_disabled', 'mobility', 'expectant'].includes(a.priority);
      const isPriorityB = ['senior_disabled', 'mobility', 'expectant'].includes(b.priority);
      if (isPriorityA && !isPriorityB) return -1;
      if (!isPriorityA && isPriorityB) return 1;
      return a.createdAt - b.createdAt;
    });

    const index = waiting.findIndex(t => t.id === token.id);
    const pos = index !== -1 ? index + 1 : 1;
    const service = this.getService(token.serviceId);
    const avg = service ? service.avgWaitMins : 12;

    return {
      position: pos,
      waitMinutes: pos * avg
    };
  },

  // Cross-tab and local subscription
  subscribe(callback) {
    const storageListener = (e) => {
      if (Object.values(STORAGE_KEYS).includes(e.key)) {
        callback(e);
      }
    };
    const localListener = (e) => {
      callback(e.detail);
    };

    window.addEventListener('storage', storageListener);
    window.addEventListener('queueease_store_change', localListener);

    return () => {
      window.removeEventListener('storage', storageListener);
      window.removeEventListener('queueease_store_change', localListener);
    };
  }
};
