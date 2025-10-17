export const STORAGE_KEYS = {
  enterToSend: 'vse-enter-to-send',
  theme: 'vse-theme',
  agentkitWorkflow: 'user_agentkit_workflow_id',
  agentkitOpenaiKey: 'user_openai_api_key',
  agentkitChatkitBase: 'user_chatkit_api_base'
};

export const DEFAULTS = {
  theme: 'dark',
  chatkitBase: 'https://api.openai.com/v1/agentkit'
};

export const VIEW_TITLES = {
  chat: {
    title: 'Chat',
    subtitle: 'Spravujte konverzace a sledujte odpovědi v reálném čase.'
  },
  agentkit: {
    title: 'Agentkit',
    subtitle: 'Propojte Agentkit workflow a chatujte s vlastním agentem.'
  },
  projects: {
    title: 'Projekty',
    subtitle: 'Organizujte si jednotlivé moduly a připravte se na další nástroje.'
  },
  help: {
    title: 'Nápověda',
    subtitle: 'Zjistěte, jak fungují jednotlivé části platformy.'
  },
  profile: {
    title: 'Profil',
    subtitle: 'Spravujte své osobní údaje a zabezpečení účtu.'
  },
  admin: {
    title: 'Administrace',
    subtitle: 'Dozorujte uživatelské účty a obnovujte přístupy.'
  }
};

const storedTheme = localStorage.getItem(STORAGE_KEYS.theme) || DEFAULTS.theme;
const storedEnterToSend = localStorage.getItem(STORAGE_KEYS.enterToSend) === 'true';
const storedWorkflow = (localStorage.getItem(STORAGE_KEYS.agentkitWorkflow) || '').trim();
const storedApiKey = (localStorage.getItem(STORAGE_KEYS.agentkitOpenaiKey) || '').trim();
const storedApiBase = (localStorage.getItem(STORAGE_KEYS.agentkitChatkitBase) || '').trim();

export const state = {
  user: null,
  view: 'chat',
  theme: storedTheme,
  enterToSend: storedEnterToSend,
  isLoading: false,
  threads: [],
  filteredThreads: [],
  activeThreadId: null,
  threadFilter: 'all',
  threadSearch: '',
  isThreadSidebarHidden: false,
  messages: [],
  threadStream: null,
  messageStream: null,
  projects: [],
  help: null,
  adminUsers: [],
  chatApiConnectors: [],
  agentkit: {
    workflowId: storedWorkflow,
    openaiApiKey: storedApiKey,
    chatkitApiBase: storedApiBase,
    isMounted: false,
    isInitializing: false,
    instance: null,
    unmount: null,
    scriptPromise: null
  }
};
