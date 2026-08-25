// MyAgent Demo i18n
// Centralized translations and language-switching helpers for lightweight UI localization.

// Demo UI language switch: translate navigation, page headers and common actions only.
// Standalone DOM helpers so i18n does not depend on app.js load order.
const i18nQsa=(s,p=document)=>[...p.querySelectorAll(s)];

const uiTranslations={
  en:{
    'New Chat':'New Chat','SESSIONS':'SESSIONS','Usage':'Usage','Config':'Config','Memory':'Memory','Skills':'Skills','Environment':'Environment','Channels':'Channels','Integrations':'Integrations','Cron':'Cron','Models':'Models',
    'Agent Assistant':'Agent Assistant','New Session':'New Session','Cron Jobs':'Cron Jobs','Cost History':'Cost History','Triggered Sessions':'Triggered Sessions','Jobs':'Jobs',
    'Explore Skills Hub':'Explore Skills Hub','Add Channel':'Add Channel','Add Job':'Add Job','Generate Key':'Generate Key','API Docs':'API Docs','Add Integration':'Add Integration'
  },
  'zh-TW':{
    'New Chat':'新對話','SESSIONS':'對話紀錄','Usage':'使用量','Config':'設定','Memory':'記憶','Skills':'技能','Environment':'環境變數','Channels':'頻道','Integrations':'整合','Cron':'排程','Models':'模型',
    'Agent Assistant':'AI 助理','New Session':'新對話','Cron Jobs':'排程作業','Cost History':'費用記錄','Triggered Sessions':'觸發的對話','Jobs':'作業',
    'Explore Skills Hub':'探索技能中心','Add Channel':'新增頻道','Add Job':'新增作業','Generate Key':'產生金鑰','API Docs':'API 文件','Add Integration':'新增整合'
  }
};

const pageTranslations={
  en:{
    'home.title':'Agent Assistant','home.desc':'Start a new session to begin with your AI agent.','home.newSession':'+ New Session','cron.title':'Cron Jobs','cron.add':'+ Add Job','cron.jobs':'Jobs','cron.triggered':'Triggered Sessions',
    'channels.title':'Channels','channels.desc':'Connect your agent to chat platforms. You can create multiple instances of each type.','channels.add':'+ Add Channel',
    'skills.title':'Skills','skills.explore':'▦ Explore Skills Hub',
    'models.title':'Models','models.desc':'Configure providers and models. Use model labels to assign models to sub-agents.',
    'memory.title':'Memory','environment.title':'Environment','integrations.title':'Integrations','integrations.tab':'Integrations','integrations.sessions':'Sessions','integrations.generate':'+ Generate Key','integrations.docs':'API Docs','integrations.add':'+ Add Integration',
    'usage.title':'Usage','usage.totalTokens':'TOTAL TOKENS','usage.tokenIO':'110 in / 11.3K out','usage.totalCost':'TOTAL COST','usage.request':'REQUESTS','usage.estimatedSpend':'Estimated spend','usage.sessions':'SESSIONS','usage.llmTurns':'14 LLM turns','usage.cacheTokens':'CACHE TOKENS','usage.cacheIO':'120.2K read / 50.9K write','cost.title':'Cost History','cost.balance':'Balance:','range.7d':'7 d','range.30d':'30 d','range.90d':'90 d','range.1y':'1 y','range.all':'All'
  },
  'zh-TW':{
    'home.title':'AI 助理','home.desc':'開始新對話來與您的 AI 代理協作。','home.newSession':'+ 新對話','cron.title':'排程作業','cron.add':'+ 新增作業','cron.jobs':'作業','cron.triggered':'觸發的對話',
    'channels.title':'頻道','channels.desc':'將您的代理連接至聊天平台。可建立多個同類型的實例。','channels.add':'+ 新增頻道',
    'skills.title':'技能','skills.explore':'▦ 探索技能中心',
    'models.title':'模型','models.desc':'設定提供者與模型。使用模型標籤將模型指定給子代理。',
    'memory.title':'記憶','environment.title':'環境變數','integrations.title':'整合','integrations.tab':'整合','integrations.sessions':'對話','integrations.generate':'+ 產生金鑰','integrations.docs':'API 文件','integrations.add':'+ 新增整合',
    'usage.title':'使用量','usage.totalTokens':'TOKEN 總計','usage.tokenIO':'1.5K in / 11.6K out','usage.totalCost':'總費用','usage.request':'請求次數','usage.estimatedSpend':'估算支出','usage.sessions':'對話','usage.sllmTurns':'15 模型輪次','usage.cacheTokens':'快取 TOKEN','usage.cacheIO':'120.2K read / 50.9K write','cost.title':'費用記錄','cost.balance':'餘額：','range.7d':'7 天','range.30d':'30 天','range.90d':'90 天','range.1y':'1 年','range.all':'全部'
  }
};

const uiI18nTargets=[
  '.new-chat-btn','.sessions-label > span:first-child','.sidebar .nav-item','.sidebar .nav-sub',
  '#page-home h1','#page-home #homeNewSessionBtn','#page-newsession .chat-topbar h2',
  '.cron-tabs button','.integration-tabs button'
];
function ownLabel(el){return Array.from(el.childNodes).filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.nodeValue).join(' ').replace(/\s+/g,' ').trim()}
function replaceOwnLabel(el,text){
  const nodes=Array.from(el.childNodes).filter(n=>n.nodeType===Node.TEXT_NODE);
  if(nodes.length){nodes[0].nodeValue=' '+text+' ';nodes.slice(1).forEach(n=>n.nodeValue='')}
  else el.append(document.createTextNode(' '+text));
}
function setUiLanguage(lang){
  const dict=uiTranslations[lang]||uiTranslations.en;

  uiI18nTargets.forEach(sel=>i18nQsa(sel).forEach(el=>{
    if(el.dataset.i18n) return;

    if(!el.dataset.i18nKey)
      el.dataset.i18nKey=ownLabel(el);

    const translated=dict[el.dataset.i18nKey];

    if(translated)
      replaceOwnLabel(el,translated);
  }));

  const pageDict=pageTranslations[lang]||pageTranslations.en;

  i18nQsa('[data-i18n]').forEach(el=>{
    const translated=pageDict[el.dataset.i18n];

    if(translated)
      replaceOwnLabel(el,translated);
  });

  document.documentElement.lang=
    lang==='zh-TW'?'zh-Hant':'en';

  try {
    localStorage.setItem('myagent-demo-lang', lang);
  } catch (e) {
    // file:// or privacy settings may block localStorage; language switching still works.
  }

  // 同步語言選單 active 狀態
  i18nQsa('[data-lang]').forEach(btn=>{
    const isActive=
      btn.dataset.lang===lang;

    btn.classList.toggle(
      'active',
      isActive
    );

    btn.querySelector('.lucide-check,[data-lucide="check"]')?.remove();

    if(isActive){
      const icon=
        document.createElement('i');

      icon.setAttribute('data-lucide','check');

      btn.appendChild(icon);
      window.renderLucideIcons?.();
    }
  });
}
function initUiLanguage(){
  let savedLang = null;
  try { savedLang = localStorage.getItem('myagent-demo-lang'); } catch (e) {}
  setUiLanguage(savedLang || 'zh-TW');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUiLanguage, { once: true });
} else {
  initUiLanguage();
}

