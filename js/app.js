const qs=(s,p=document)=>p.querySelector(s), qsa=(s,p=document)=>[...p.querySelectorAll(s)];
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const toastEl=qs('#demoToast');
const toast=()=>bootstrap.Toast.getOrCreateInstance(toastEl,{delay:2200});
function showToast(msg){qs('#toastBody').textContent=msg;toast().show()}

function updateSessionCount(){
  const count=qs('.sessions-label .count');
  if(count) count.textContent=qsa('.session-list .session-item').length;
}

function setPage(name,activeSession=null){
  qsa('.page').forEach(p=>p.classList.remove('active'));
  const page=qs(`#page-${name}`)||qs('#page-home');
  page.classList.add('active');

  qsa('.session-item').forEach(x=>x.classList.remove('active'));
  if(activeSession) activeSession.classList.add('active');

  qsa('.nav-sub,.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.page===name));
  if(name==='analysis') startAnalysisSequence();
  if(name==='techHelp' || name==='assistantIntro') startSessionTyping(page);
  if(name==='usage') requestAnimationFrame(animateUsageCharts);
}

function makeSessionActions(item){
  if(item.querySelector('.session-actions')) return;
  const actions=document.createElement('span');
  actions.className='session-actions';
  actions.innerHTML=`<span class="session-action pin-session" role="button" tabindex="0" title="Pin session"><i data-lucide="pin"></i></span><span class="session-action delete-session" role="button" tabindex="0" title="Delete session"><i data-lucide="trash-2"></i></span>`;
  item.appendChild(actions);
}
function enhanceSessions(){qsa('.session-item').forEach(makeSessionActions);updateSessionCount()}

function createNewSession(){
  const list=qs('.session-list');
  const item=document.createElement('button');
  item.className='session-item';
  item.dataset.page='newsession';
  item.dataset.sessionId=`new-${Date.now()}`;
  item.innerHTML=`<span class="dot green"></span><span class="session-copy"><b>New Session</b><small>just now</small></span>`;
  list.prepend(item);
  makeSessionActions(item);
  updateSessionCount();
  resetNewSessionPage();
  setPage('newsession',item);
}

function resetNewSessionPage(){
  const chat=qs('#newSessionChat');
  chat.innerHTML='<div class="new-session-empty" id="newSessionEmpty">Send a message to start the conversation.</div>';
  const input=qs('#newSessionInput');
  if(input) input.value='';
  const send=qs('#newSessionSend');
  if(send) send.disabled=true;
}

function handleSessionPin(item,trigger){
  const pinned=item.classList.toggle('pinned');
  item.dataset.pinned=pinned?'true':'false';
  trigger.classList.toggle('active',pinned);
  trigger.title=pinned?'Unpin session':'Pin session';
  if(pinned) qs('.session-list').prepend(item);
  showToast(pinned?'Session 已釘選':'Session 已取消釘選');
}

function handleSessionDelete(item){
  const wasActive=item.classList.contains('active');
  item.remove();
  updateSessionCount();
  if(wasActive) setPage('home');
  showToast('Session 已刪除');
}

document.addEventListener('click',e=>{
  const pin=e.target.closest('.pin-session');
  if(pin){e.preventDefault();e.stopPropagation();handleSessionPin(pin.closest('.session-item'),pin);return}
  const del=e.target.closest('.delete-session');
  if(del){e.preventDefault();e.stopPropagation();handleSessionDelete(del.closest('.session-item'));return}
  const session=e.target.closest('.session-item');
  if(session){setPage(session.dataset.page,session);return}
  const pageLink=e.target.closest('[data-page]');
  if(pageLink){setPage(pageLink.dataset.page);return}
});

document.addEventListener('keydown',e=>{
  if((e.key==='Enter'||e.key===' ')&&e.target.matches('.session-action')){e.preventDefault();e.target.click()}
  if((e.key==='Enter'||e.key===' ')&&e.target.matches('.clickable-tool')){e.preventDefault();e.target.click()}
});


// Left sidebar: expanded by default, collapsible from the brand header.
const appShell=qs('#app');
qs('#sidebarCollapseBtn')?.addEventListener('click',()=>appShell?.classList.add('sidebar-collapsed'));
qs('#sidebarExpandBtn')?.addEventListener('click',()=>appShell?.classList.remove('sidebar-collapsed'));

// Right workspace panel: expanded by default on chat/session pages.
function bindRightPanelToggles(){
  qsa('.chat-layout').forEach(layout=>{
    const toggle=layout.querySelector('.canvas-tabs button:first-child');
    if(!toggle || toggle.dataset.collapseBound==='true') return;
    toggle.dataset.collapseBound='true';
    toggle.setAttribute('aria-label','Collapse right panel');
    toggle.addEventListener('click',e=>{
      e.preventDefault();
      const collapsed=layout.classList.toggle('right-collapsed');
      toggle.setAttribute('aria-label',collapsed?'Expand right panel':'Collapse right panel');
      toggle.title=collapsed?'Expand panel':'Collapse panel';
    });
  });
}
bindRightPanelToggles();

// Drag the divider to resize the right workspace panel on every session/chat page.
function bindCanvasResizeHandles(){
  qsa('.chat-layout').forEach(layout=>{
    const handle=layout.querySelector('.canvas-resize-handle');
    const pane=layout.querySelector('.canvas-pane');
    if(!handle||!pane||handle.dataset.resizeBound==='true') return;
    handle.dataset.resizeBound='true';

    const setWidth=clientX=>{
      if(layout.classList.contains('right-collapsed')) return;
      const rect=layout.getBoundingClientRect();
      const minCanvas=Math.min(320,rect.width*.42);
      const minChat=Math.min(420,rect.width*.55);
      const canvasWidth=Math.max(minCanvas,Math.min(rect.right-clientX,rect.width-minChat));
      layout.style.setProperty('--canvas-width',`${canvasWidth}px`);
      handle.setAttribute('aria-valuenow',String(Math.round(canvasWidth)));
    };

    handle.addEventListener('pointerdown',e=>{
      if(e.button!==0) return;
      e.preventDefault();
      handle.setPointerCapture(e.pointerId);
      handle.classList.add('is-dragging');
      document.body.classList.add('is-resizing-canvas');
      setWidth(e.clientX);
    });
    handle.addEventListener('pointermove',e=>{
      if(!handle.hasPointerCapture(e.pointerId)) return;
      setWidth(e.clientX);
    });
    const finish=e=>{
      if(handle.hasPointerCapture(e.pointerId)) handle.releasePointerCapture(e.pointerId);
      handle.classList.remove('is-dragging');
      document.body.classList.remove('is-resizing-canvas');
    };
    handle.addEventListener('pointerup',finish);
    handle.addEventListener('pointercancel',finish);
    handle.addEventListener('keydown',e=>{
      if(!['ArrowLeft','ArrowRight'].includes(e.key)) return;
      e.preventDefault();
      const current=pane.getBoundingClientRect().width||0;
      const next=current+(e.key==='ArrowLeft'?20:-20);
      const rect=layout.getBoundingClientRect();
      setWidth(rect.right-next);
    });
  });
}
bindCanvasResizeHandles();

// Open a real Save As picker when the browser supports it; otherwise use a normal download.
const downloadAnalysisReport=qs('#downloadAnalysisReport');
function fallbackReportDownload(){
  const link=document.createElement('a');
  link.href='資料分析結果示例.html';
  link.download='資料分析結果示例.html';
  document.body.appendChild(link);
  link.click();
  link.remove();
}
downloadAnalysisReport?.addEventListener('click',async()=>{
  if(!('showSaveFilePicker' in window)){
    fallbackReportDownload();
    return;
  }
  try{
    const fileHandle=await window.showSaveFilePicker({
      id:'analysis-report-html',
      suggestedName:'資料分析結果示例.html',
      types:[{
        description:'HTML 文件',
        accept:{'text/html':['.html']}
      }]
    });
    const response=await fetch('資料分析結果示例.html');
    if(!response.ok) throw new Error(`Unable to load report: ${response.status}`);
    const writable=await fileHandle.createWritable();
    await writable.write(await response.blob());
    await writable.close();
    showToast('資料分析結果示例.html 已儲存');
  }catch(error){
    if(error?.name==='AbortError') return;
    fallbackReportDownload();
  }
});

qs('#newChatBtn')?.addEventListener('click',()=>setPage('home'));
qs('#brandHomeBtn')?.addEventListener('click',()=>setPage('home'));
qs('#homeNewSessionBtn')?.addEventListener('click',createNewSession);
qs('#configToggle')?.addEventListener('click',()=>qs('#configMenu').classList.toggle('d-none'));

function switchAnalysisSide(view){
  qsa('#analysisSideTabs [data-side-view]').forEach(b=>b.classList.toggle('active',b.dataset.sideView===view));
  qsa('.analysis-side-pane .side-view').forEach(v=>v.classList.remove('active'));
  qs(`#side-${view}`)?.classList.add('active');
}
qsa('#analysisSideTabs [data-side-view]').forEach(btn=>btn.addEventListener('click',()=>switchAnalysisSide(btn.dataset.sideView)));
qs('#skillToolChip')?.addEventListener('click',()=>switchAnalysisSide('tool'));
qs('#canvasToolChip')?.addEventListener('click',()=>switchAnalysisSide('canvas'));

async function typeText(el,text,delay=20){
  if(!el) return;
  el.textContent='';
  el.classList.add('is-typing');
  for(const ch of Array.from(text)){
    el.textContent+=ch;
    await wait(delay);
  }
  el.classList.remove('is-typing');
}

// Reuse the same AI typing feel on every static session response.
// Rich answers keep their headings, lists, tables and code blocks while text is revealed.
const sessionTypingState=new WeakSet();
async function typeRichContent(el,delay=2){
  if(!el || sessionTypingState.has(el)) return;
  sessionTypingState.add(el);

  const source=el.cloneNode(true);
  el.innerHTML='';
  el.classList.add('is-typing');

  async function reveal(sourceNode,targetParent){
    if(sourceNode.nodeType===Node.TEXT_NODE){
      const target=document.createTextNode('');
      targetParent.appendChild(target);
      const text=sourceNode.textContent||'';
      for(const ch of Array.from(text)){
        target.textContent+=ch;
        if(!/\s/.test(ch)) await wait(delay);
      }
      return;
    }
    if(sourceNode.nodeType!==Node.ELEMENT_NODE) return;
    const target=sourceNode.cloneNode(false);
    targetParent.appendChild(target);
    for(const child of [...sourceNode.childNodes]) await reveal(child,target);
  }

  for(const child of [...source.childNodes]) await reveal(child,el);
  el.classList.remove('is-typing');
}

function startSessionTyping(page){
  const answer=page?.querySelector('.assistant-card.rich-answer');
  if(!answer || sessionTypingState.has(answer)) return;
  setTimeout(()=>typeRichContent(answer,2),180);
}

let analysisState='idle';
async function startAnalysisSequence(){
  if(analysisState!=='idle') return;
  analysisState='running';
  const intro=qs('#aiIntro');
  const canvasChip=qs('#canvasToolChip');
  const generating=qs('#generating');
  const canvasThinking=qs('#canvasThinking');
  const dashboard=qs('#dashboard');
  const canvasActions=qs('#canvasActions');
  const summary=qs('#analysisSummary');
  const summaryTyped=qs('#summaryTyped');

  await typeText(intro,intro?.dataset.typewriter||'',18);
  await wait(260);
  canvasChip?.classList.remove('d-none');
  generating?.classList.remove('d-none');
  if(canvasThinking) canvasThinking.classList.remove('d-none');
  dashboard?.classList.add('d-none');

  await wait(1300);
  canvasThinking?.classList.add('d-none');
  dashboard?.classList.remove('d-none');
  qs('#streamingLabel').textContent='Completed';
  qs('#streamingLabel')?.classList.add('d-none');
  canvasActions?.classList.remove('d-none');
  qs('#canvasToolStatus').textContent='Completed →';
  qs('#canvasToolStatus').className='text-success';
  generating?.classList.add('d-none');
  summary?.classList.remove('d-none');
  await typeText(summaryTyped,summaryTyped?.dataset.typewriter||'',12);
  analysisState='done';
}

function appendTypedReply(chat,userText,replyText){
  const empty=chat.querySelector('.new-session-empty');
  empty?.remove();
  const user=document.createElement('div');
  user.className='user-bubble followup-bubble';
  user.textContent=userText;
  chat.appendChild(user);
  const reply=document.createElement('div');
  reply.className='assistant-card followup-reply';
  chat.appendChild(reply);
  chat.scrollTo({top:chat.scrollHeight,behavior:'smooth'});
  setTimeout(async()=>{
    await typeText(reply,replyText,18);
    chat.scrollTo({top:chat.scrollHeight,behavior:'smooth'});
  },350);
}

const aInput=qs('#analysisInput'),aSend=qs('#analysisSend');
aInput?.addEventListener('input',()=>aSend.disabled=!aInput.value.trim());
aSend?.addEventListener('click',()=>{
  const value=aInput.value.trim();
  if(!value)return;
  appendTypedReply(qs('#analysisChat'),value,'收到，我會以目前的分析結果為基礎繼續處理，並保留現有的 KPI、圖表與資料表內容。');
  aInput.value='';aSend.disabled=true;
});
aInput?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!aSend.disabled)aSend.click()});

const nInput=qs('#newSessionInput'),nSend=qs('#newSessionSend');
nInput?.addEventListener('input',()=>nSend.disabled=!nInput.value.trim());
nSend?.addEventListener('click',()=>{
  const value=nInput.value.trim();
  if(!value)return;
  appendTypedReply(qs('#newSessionChat'),value,'收到！這是一個 Demo Session。你可以繼續輸入需求，我會用逐字輸出的方式模擬 Agent 回覆。');
  nInput.value='';nSend.disabled=true;
});
nInput?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!nSend.disabled)nSend.click()});


// All preset Session pages use the same composer behavior as the analysis session:
// empty = disabled, typed content = enabled, click/Enter sends and appends a typed AI reply.
function bindPresetSessionComposers(){
  qsa('.demo-chat-page').forEach(page=>{
    const input=page.querySelector('.chat-input-wrap input');
    const send=page.querySelector('.chat-input-wrap .send-circle');
    const chat=page.querySelector('.demo-conversation-scroll');
    if(!input||!send||!chat||input.dataset.composerBound==='true') return;
    input.dataset.composerBound='true';
    const sync=()=>send.disabled=!input.value.trim();
    input.addEventListener('input',sync);
    send.addEventListener('click',()=>{
      const value=input.value.trim();
      if(!value) return;
      appendTypedReply(chat,value,'收到，我會根據目前這個 Session 的對話內容繼續協助你處理，並用逐字輸出的方式模擬 AI 回覆。');
      input.value='';
      sync();
    });
    input.addEventListener('keydown',e=>{
      if(e.key==='Enter'&&!e.shiftKey&&!send.disabled){e.preventDefault();send.click()}
    });
    sync();
  });
}
bindPresetSessionComposers();

function renderDashboard(){
  const svg=qs('#lineChart'); const vals=[165,178,195,212,206,228,248,277,284,266,239,244,258,271,290]; const max=300,min=150;
  let pts=vals.map((v,i)=>`${22+i*(456/(vals.length-1))},${190-(v-min)/(max-min)*150}`).join(' ');
  svg.innerHTML=`<defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6d77ff" stop-opacity=".22"/><stop offset="1" stop-color="#6d77ff" stop-opacity="0"/></linearGradient></defs><g stroke="#edf0f4" stroke-width="1">${[40,75,110,145,180].map(y=>`<line x1="20" y1="${y}" x2="480" y2="${y}"/>`).join('')}</g><polygon points="22,190 ${pts} 478,190" fill="url(#fill)"/><polyline points="${pts}" fill="none" stroke="#6371ff" stroke-width="3"/>`;
  const cats=[['服飾',72],['電子產品',84],['家居',58],['運動',44],['其他',25]];qs('#barChart').innerHTML=cats.map(([n,h])=>`<div class="bar" style="height:${h}%"><span>${n}</span></div>`).join('');
  const rows=[['藍色 T恤 M尺寸','1,247','$156,875','+23%'],['無線耳機 Pro','892','$135,000','+18%'],['黑色牛仔褲 32吋','756','$98,280','+12%'],['瑜伽墊 6mm','634','$50,720','+35%'],['LED台燈','621','$61,050','+8%'],['登山鞋 Size 10','589','$82,460','+41%'],['棉質枕頭 2入','542','$32,520','-5%'],['智能手錶','498','$99,600','+52%'],['防曬乳 SPF50','467','$23,350','+28%'],['運動背包','445','$31,150','+11%']];
  qs('#salesRows').innerHTML=rows.map((r,i)=>`<tr><td>${i+1}</td>${r.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('');
}

qs('#addJobBtn')?.addEventListener('click',()=>{qs('#cronForm').classList.remove('d-none');qs('#cronForm').scrollIntoView({behavior:'smooth'})});
qs('#cancelJob')?.addEventListener('click',()=>qs('#cronForm').classList.add('d-none'));
qsa('#scheduleType button').forEach(b=>b.addEventListener('click',()=>{qsa('#scheduleType button').forEach(x=>x.classList.remove('active'));b.classList.add('active')}));
qs('#deliverChannel')?.addEventListener('change',e=>qs('#channelSelectWrap').classList.toggle('d-none',!e.target.checked));
qs('#createJob')?.addEventListener('click',()=>{const name=qs('#jobName').value.trim()||'Untitled Job';const ch=qs('#deliverChannel').checked?qs('#deliverChannelSelect').value:null;const row=document.createElement('div');row.className='job-row';row.innerHTML=`<span class="dot green"></span><div class="job-info"><strong>${escapeHtml(name)} <small>Recurring · every 1d</small></strong><span>${ch?`Daily analysis · Deliver to ${ch}`:'Scheduled agent task'}</span></div><div class="job-actions"><label class="switch"><input type="checkbox" checked><span></span></label><small>Next: 17:00</small><i data-lucide="play"></i><i data-lucide="list"></i><i data-lucide="chevron-right"></i></div>`;qs('#jobList').prepend(row);qs('#cronForm').classList.add('d-none');showToast(`排程「${name}」已建立${ch?`，結果將推播至 ${ch}`:''}`)});

qsa('[data-expand]').forEach(el=>el.addEventListener('click',e=>{if(e.target.closest('.switch')||e.target.closest('.delete-channel'))return;qs(`#${el.dataset.expand}Detail`).classList.toggle('d-none')}));
qsa('.add-channel').forEach(el=>el.addEventListener('click',()=>{const detail=qs(`#${el.dataset.channel}Detail`);detail.classList.remove('d-none');detail.scrollIntoView({behavior:'smooth',block:'center'})}));
qsa('.toggle-secret').forEach(el=>el.addEventListener('click',()=>{const input=qs('#'+el.dataset.target);input.type=input.type==='password'?'text':'password';el.setAttribute('data-lucide', input.type==='password'?'eye-off':'eye'); window.renderLucideIcons?.()}));
qs('#copyWebhook')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(qs('#webhookText').textContent);showToast('Webhook URL 已複製')}catch{showToast('Demo：Webhook URL 已複製')}});
// Channel enable/disable state with connecting animation
['line','telegram','slack','discord'].forEach(key=>{
  const toggle=qs(`#${key}Toggle`), state=qs(`#${key}State`);
  if(!toggle||!state)return;
  let timer=null;
  toggle.addEventListener('change',()=>{
    if(timer){clearTimeout(timer);timer=null;}
    if(toggle.checked){
      state.style.color='#e7a400';
      state.innerHTML='<span class="channel-spinner"></span> Connecting...';
      timer=setTimeout(()=>{
        if(!toggle.checked)return;
        state.textContent='Connected';
        state.style.color='#10a85e';
        timer=null;
      },1100);
    }else{
      state.textContent='Disabled';
      state.style.color='';
    }
  });
});

// Channel deletion confirmation
qsa('.delete-channel').forEach(btn=>btn.addEventListener('click',e=>{
  e.stopPropagation();
  const name=btn.dataset.channel||'channel';
  if(!window.confirm(`Delete channel "${name}"?`)) return;
  const card=btn.closest('.channel-card');
  if(card){
    card.style.transition='opacity .18s ease, transform .18s ease';
    card.style.opacity='0';
    card.style.transform='translateY(-4px)';
    setTimeout(()=>card.remove(),190);
  }
  showToast(`${name} channel deleted`);
}));

qsa('.test-connection').forEach(btn=>btn.addEventListener('click',()=>{const old=btn.innerHTML;btn.disabled=true;btn.innerHTML='<span class="spinner-border spinner-border-sm"></span> Testing...';setTimeout(()=>{btn.disabled=false;btn.innerHTML=old;showToast(`${btn.dataset.channel} connection successful`)},850)}));
qsa('.save-channel').forEach(btn=>btn.addEventListener('click',()=>{const c=btn.dataset.channel.toLowerCase();const t=qs(`#${c}Toggle`);if(t&&!t.checked){t.checked=true;t.dispatchEvent(new Event('change'));}showToast(`${btn.dataset.channel} channel saved`)}));
['line','telegram','slack','discord'].forEach(c=>qs(`#${c}Toggle`)?.addEventListener('change',e=>{const state=qs(`#${c}State`);state.textContent=e.target.checked?'Enabled':'Disabled';state.style.color=e.target.checked?'#10a85e':'#9ca7b6'}));

function renderSkills(){
  const items=[
    ['guider','Interactive user guide and manual for the MyAgent service.',false],
    ['pptx','Presentation creation, editing, and analysis.',true],
    ['frontend-design','Create distinctive, production-grade frontend interfaces with high design quality.',false],
    ['scheduling','Schedule reminders, recurring tasks and periodic monitoring.',false],
    ['drawio','AI-powered Draw.io diagram creation with Design System.',true],
    ['skill-creator','Guide for creating effective skills and tool integrations.',true],
    ['doc-coauthoring','Guide users through a structured workflow for co-authoring documentation.',true],
    ['canvas','Render or edit rich visual content: charts, tables, dashboards and diagrams.',true],
    ['agent-creator','Create or update reusable sub-agent definitions.',true],
    ['memory','Two-tier memory system with persistent identity and searchable history.',true]
  ];
  qs('#skillsList').innerHTML=items.map(([n,d,on])=>`<div class="setting-row ${on?'':'skill-disabled'}"><span class="cube">⬡</span><div class="setting-copy"><strong>${n} <small>builtin</small></strong><p>${d}</p></div><label class="switch"><input type="checkbox" ${on?'checked':''}><span></span></label><i data-lucide="chevron-right" class="text-secondary"></i></div>`).join('');
  qsa('#skillsList .switch input').forEach(input=>input.addEventListener('change',()=>{
    input.closest('.setting-row')?.classList.toggle('skill-disabled',!input.checked);
  }));
}
function renderModels(){const models=[['Claude Haiku 4.5','claude-ocis/claude-haiku-4-5',true],['Claude Opus 4.6','claude-ocis/claude-opus-4-6',false],['Claude Sonnet 4.6','claude-ocis/claude-sonnet-4-6',false],['Claude Sonnet 4.6','claude-twai/claude-sonnet-4-6',false],['Echo (Test)','echo',false],['OpenAI: GPT-4o Audio','openrouter/openai/gpt-4o-audio-preview',false]];qs('#modelList').innerHTML=models.map(([n,id,active])=>`<div class="model-row ${active?'active':''}"><div class="model-icon">▥</div><div><strong>${n} <small>Platform</small></strong><span class="model-id">${id}</span></div><div class="model-actions"><i data-lucide="star" class="star ${active?'active':''}"></i><i data-lucide="trash-2"></i><i data-lucide="chevron-right"></i></div></div>`).join('');qsa('.model-row .star').forEach(star=>star.addEventListener('click',()=>{qsa('.model-row .star').forEach(s=>s.classList.remove('active'));qsa('.model-row').forEach(r=>r.classList.remove('active'));star.classList.add('active');star.closest('.model-row').classList.add('active');showToast('Default model 已更新')}))}
function escapeHtml(str){return str.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

// Guided tour for the primary product demo sessions and navigation areas.
const productTour=qs('#productTour');
const tourDialogLayer=qs('#tourDialogLayer');
const tourTooltip=qs('.tour-tooltip',productTour);
const tourMasks=qsa('.tour-mask',productTour);
const tourSteps=[
  {
    target:'.session-item[data-page="assistantIntro"]',
    title:'AI 助手能力介紹',
    description:'先看看 MyAgent 能協助哪些工作，以及可使用的核心工具。'
  },
  {
    target:'.session-item[data-page="analysis"]',
    title:'資料分析結果呈現方式',
    description:'查看 AI 如何將資料轉換成圖表與可下載的分析報告。'
  },
  {
    target:'#analysisSideTabs [data-side-view="canvas"]',
    title:'Canvas 分析報告',
    description:'點選 Canvas，在右側查看 KPI、趨勢圖、排名表格與完整分析結果。',
    waitForAnalysis:true
  },
  {
    target:'.nav-item[data-page="usage"]',
    title:'使用量',
    description:'查看 Sessions、Tokens 與工具使用量等統計資訊。'
  },
  {
    target:'.nav-sub[data-page="channels"]',
    title:'頻道',
    description:'連接 LINE、Telegram、Slack 或 Discord，讓 Agent 可以推播訊息。',
    openConfig:true
  },
  {
    target:'.nav-sub[data-page="cron"]',
    title:'排程',
    description:'建立定時任務，讓 Agent 依照指定時間自動執行工作。',
    openConfig:true
  },
  {
    target:'#costHistoryBtn',
    title:'費用紀錄',
    description:'查看目前餘額、使用成本與各個 Session 的費用明細。'
  }
];
let tourStepIndex=-1;
let activeTourTarget=null;

function setTourDialogMode(mode){
  const completed=mode==='complete';
  qs('#tourDialogEyebrow').textContent=completed?'TOUR COMPLETE':'PRODUCT TOUR';
  qs('#tourDialogTitle').textContent=completed?'導覽完成！':'歡迎體驗 AFS MyAgent';
  qs('#tourDialogDescription').textContent=completed?'你已經看過七個主要功能，現在可以繼續自由探索 MyAgent 的其他內容。':'透過七個重點，快速了解 MyAgent 的主要功能與操作方式。';
  qs('#tourSkipWelcome').classList.toggle('d-none',completed);
  qs('#tourStart').innerHTML=completed?'自由探索 <i data-lucide="sparkles"></i>':'開始導覽 <i data-lucide="arrow-right"></i>';
  qs('#tourStart').dataset.mode=completed?'finish':'start';
  window.renderLucideIcons?.();
}

function showTourDialog(mode='welcome'){
  endTourStep();
  setTourDialogMode(mode);
  tourDialogLayer.classList.add('is-active');
  tourDialogLayer.setAttribute('aria-hidden','false');
  requestAnimationFrame(()=>qs('#tourStart')?.focus());
}

function hideTourDialog(){
  tourDialogLayer.classList.remove('is-active');
  tourDialogLayer.setAttribute('aria-hidden','true');
}

function setMaskRect(mask,{left,top,width,height}){
  mask.style.left=`${Math.max(0,left)}px`;
  mask.style.top=`${Math.max(0,top)}px`;
  mask.style.width=`${Math.max(0,width)}px`;
  mask.style.height=`${Math.max(0,height)}px`;
}

function positionTourStep(){
  if(!activeTourTarget||!productTour.classList.contains('is-active')) return;
  const rect=activeTourTarget.getBoundingClientRect();
  const pad=7;
  const left=Math.max(0,rect.left-pad);
  const top=Math.max(0,rect.top-pad);
  const right=Math.min(window.innerWidth,rect.right+pad);
  const bottom=Math.min(window.innerHeight,rect.bottom+pad);
  setMaskRect(tourMasks[0],{left:0,top:0,width:window.innerWidth,height:top});
  setMaskRect(tourMasks[1],{left:0,top,width:left,height:bottom-top});
  setMaskRect(tourMasks[2],{left:right,top,width:window.innerWidth-right,height:bottom-top});
  setMaskRect(tourMasks[3],{left:0,top:bottom,width:window.innerWidth,height:window.innerHeight-bottom});

  const tooltipRect=tourTooltip.getBoundingClientRect();
  const gap=26;
  let tooltipLeft=right+gap;
  let tooltipTop=Math.max(16,Math.min(top-18,window.innerHeight-tooltipRect.height-16));
  let placement='right';
  if(tooltipLeft+tooltipRect.width+16>window.innerWidth){
    const leftPlacement=left-tooltipRect.width-gap;
    if(leftPlacement>=16){
      placement='left';
      tooltipLeft=leftPlacement;
    }else{
      placement='bottom';
      tooltipLeft=Math.max(16,Math.min(left,window.innerWidth-tooltipRect.width-16));
      tooltipTop=Math.min(window.innerHeight-tooltipRect.height-16,bottom+18);
    }
  }
  tourTooltip.dataset.placement=placement;
  tourTooltip.style.left=`${tooltipLeft}px`;
  tourTooltip.style.top=`${tooltipTop}px`;
}

function endTourStep(){
  activeTourTarget?.classList.remove('tour-target');
  qsa('.tour-layer-active').forEach(el=>el.classList.remove('tour-layer-active'));
  activeTourTarget=null;
  productTour?.classList.remove('is-active');
  productTour?.setAttribute('aria-hidden','true');
}

async function showTourStep(index){
  tourStepIndex=index;
  const step=tourSteps[index];
  if(step.waitForAnalysis){
    const timeoutAt=Date.now()+8000;
    while(analysisState==='running'&&Date.now()<timeoutAt) await wait(100);
  }
  if(step.openConfig) qs('#configMenu')?.classList.remove('d-none');
  activeTourTarget=qs(step.target);
  if(!activeTourTarget) return;
  appShell?.classList.remove('sidebar-collapsed');
  activeTourTarget.scrollIntoView({block:'center'});
  activeTourTarget.closest('.sidebar-footer')?.classList.add('tour-layer-active');
  activeTourTarget.classList.add('tour-target');
  qs('#tourStepLabel').textContent=`第 ${index+1}／${tourSteps.length} 步`;
  qs('#tourStepTitle').textContent=step.title;
  qs('#tourStepDescription').textContent=step.description;
  productTour.classList.add('is-active');
  productTour.setAttribute('aria-hidden','false');
  requestAnimationFrame(positionTourStep);
}

function finishTour(){
  endTourStep();
  showTourDialog('complete');
}

function skipTour(){
  endTourStep();
  hideTourDialog();
}

qs('#tourStart')?.addEventListener('click',()=>{
  if(qs('#tourStart').dataset.mode==='finish'){
    hideTourDialog();
    return;
  }
  hideTourDialog();
  showTourStep(0);
});
qs('#tourSkipWelcome')?.addEventListener('click',skipTour);
qs('#tourSkipStep')?.addEventListener('click',skipTour);
qs('#tourNextStep')?.addEventListener('click',()=>activeTourTarget?.click());
qs('#restartProductTour')?.addEventListener('click',e=>{
  e.stopPropagation();
  setPage('home');
  showTourDialog('welcome');
});
document.addEventListener('click',e=>{
  if(tourStepIndex<0||!activeTourTarget||!activeTourTarget.contains(e.target)) return;
  const completedStepIndex=tourStepIndex;
  endTourStep();
  if(completedStepIndex===tourSteps.length-1){
    setTimeout(finishTour,360);
  }else{
    setTimeout(()=>showTourStep(completedStepIndex+1),360);
  }
});
window.addEventListener('resize',positionTourStep);
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&(productTour?.classList.contains('is-active')||tourDialogLayer?.classList.contains('is-active'))) skipTour();
});

window.addEventListener('load',()=>{
  renderSkills();
  renderModels();
  renderDashboard();
  enhanceSessions();
  switchAnalysisSide('canvas');
  setTimeout(()=>{
    qs('#bootScreen').style.opacity='0';
    setTimeout(()=>qs('#bootScreen')?.remove(),420);
    qs('#app').classList.remove('opacity-0');
    setPage('home');
    setTimeout(()=>showTourDialog('welcome'),180);
  },1200);
});



// Usage charts: replay entry animation when opening Usage and show data tooltips on hover.
function animateUsageCharts(){
  const page=qs('#page-usage');
  if(!page) return;
  page.classList.remove('usage-chart-enter');
  void page.offsetWidth;
  page.classList.add('usage-chart-enter');
}

const usageTooltip=document.createElement('div');
usageTooltip.className='usage-tooltip';
usageTooltip.setAttribute('role','tooltip');
document.body.appendChild(usageTooltip);

function buildUsageTooltip(target){
  const title=target.dataset.tooltipTitle||'';
  const lines=(target.dataset.tooltipLines||'').split(';').filter(Boolean).map(line=>{
    const [label='',value='',tone='']=line.split('|');
    return `<div class="usage-tooltip-line ${tone}"><span class="label">${escapeHtml(label)}</span><span>${escapeHtml(value)}</span></div>`;
  }).join('');
  usageTooltip.innerHTML=`<div class="usage-tooltip-title">${escapeHtml(title)}</div>${lines}`;
}

function positionUsageTooltip(e){
  const pad=12;
  const gap=14;
  const rect=usageTooltip.getBoundingClientRect();
  let left=e.clientX+gap;
  let top=e.clientY-rect.height/2;
  if(left+rect.width+pad>window.innerWidth) left=e.clientX-rect.width-gap;
  top=Math.max(pad,Math.min(top,window.innerHeight-rect.height-pad));
  usageTooltip.style.left=`${left}px`;
  usageTooltip.style.top=`${top}px`;
}

document.addEventListener('pointerover',e=>{
  const target=e.target.closest('.usage-hover-target');
  if(!target||!qs('#page-usage')?.classList.contains('active')) return;
  buildUsageTooltip(target);
  usageTooltip.classList.add('show');
  positionUsageTooltip(e);
});
document.addEventListener('pointermove',e=>{
  if(usageTooltip.classList.contains('show')) positionUsageTooltip(e);
});
document.addEventListener('pointerout',e=>{
  const target=e.target.closest('.usage-hover-target');
  if(!target) return;
  const next=e.relatedTarget;
  if(next&&target.contains(next)) return;
  usageTooltip.classList.remove('show');
});

// Usage range demo interaction
document.querySelectorAll('.usage-range button').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('.usage-range button').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
}));

// v9: Cron tabs + Triggered Sessions dropdown filters.
(function initCronTriggeredSessions(){
  const jobsPane=qs('#cronJobsPane');
  const triggeredPane=qs('#cronTriggeredPane');
  qsa('#cronTabs [data-cron-tab]').forEach(btn=>btn.addEventListener('click',()=>{
    qsa('#cronTabs [data-cron-tab]').forEach(b=>b.classList.toggle('active',b===btn));
    const triggered=btn.dataset.cronTab==='triggered';
    jobsPane?.classList.toggle('d-none',triggered);
    triggeredPane?.classList.toggle('d-none',!triggered);
    qsa('.cron-filter').forEach(f=>f.classList.remove('open'));
  }));

  function filterTriggeredRows(){
    const job=qs('.cron-filter[data-filter="job"] .cron-filter-label')?.textContent.trim()||'All Jobs';
    const status=qs('.cron-filter[data-filter="status"] .cron-filter-label')?.textContent.trim()||'All Status';
    let visible=0;
    qsa('.trigger-session-row').forEach(row=>{
      const show=(job==='All Jobs'||row.dataset.job===job)&&(status==='All Status'||row.dataset.status===status);
      row.classList.toggle('d-none',!show);
      if(show) visible++;
    });
    const total=qs('.trigger-summary strong'); if(total) total.textContent=String(visible);
    const passed=qs('.trigger-summary span'); if(passed) passed.innerHTML=`<i data-lucide="circle-check"></i> ${visible} passed`;
    const runs=qs('.trigger-day-head span'); if(runs) runs.textContent=`${visible} run${visible===1?'':'s'}`;
  }

  qsa('.cron-filter-btn').forEach(btn=>btn.addEventListener('click',e=>{
    e.stopPropagation();
    const filter=btn.closest('.cron-filter');
    qsa('.cron-filter').forEach(other=>{if(other!==filter) other.classList.remove('open')});
    filter?.classList.toggle('open');
  }));
  qsa('.cron-filter-menu button').forEach(item=>item.addEventListener('click',e=>{
    e.stopPropagation();
    const filter=item.closest('.cron-filter');
    const label=filter?.querySelector('.cron-filter-label');
    if(label) label.textContent=item.dataset.value||item.textContent.trim();
    filter?.querySelectorAll('.cron-filter-menu button').forEach(b=>{
      b.classList.toggle('selected',b===item);
      const old=b.querySelector('.lucide-check,[data-lucide="check"]');
      if(old) old.remove();
      if(b===item){const icon=document.createElement('i');icon.setAttribute('data-lucide','check');b.prepend(icon);window.renderLucideIcons?.()}
    });
    filter?.classList.remove('open');
    filterTriggeredRows();
  }));
  document.addEventListener('click',()=>qsa('.cron-filter').forEach(f=>f.classList.remove('open')));
  qsa('.trigger-range button').forEach(btn=>btn.addEventListener('click',()=>{
    qsa('.trigger-range button').forEach(b=>b.classList.toggle('active',b===btn));
  }));
})();


// v10 sidebar footer popovers + cost history
qs('#costHistoryBtn')?.addEventListener('click',()=>{
  qsa('.footer-popover').forEach(x=>x.classList.remove('show'));
  qsa('.footer-popover-toggle').forEach(x=>x.classList.remove('active'));
  setPage('cost');
});
qsa('.footer-popover-toggle').forEach(btn=>btn.addEventListener('click',e=>{
  e.stopPropagation();
  const key=btn.dataset.footerMenu;
  const menu=qs(`[data-footer-popover="${key}"]`);
  const willOpen=!menu.classList.contains('show');
  qsa('.footer-popover').forEach(x=>x.classList.remove('show'));
  qsa('.footer-popover-toggle').forEach(x=>x.classList.remove('active'));
  if(willOpen){menu.classList.add('show');btn.classList.add('active')}
}));
qsa('.footer-popover button').forEach(btn=>btn.addEventListener('click',e=>{
  e.stopPropagation();
  const menu=btn.closest('.footer-popover');
  if(menu?.dataset.footerPopover==='language'){
    qsa('button',menu).forEach(b=>{b.classList.remove('active');b.querySelector('.lucide-check,[data-lucide="check"]')?.remove()});
    btn.classList.add('active');
    if(!btn.querySelector('.lucide-check,[data-lucide="check"]')) btn.insertAdjacentHTML('beforeend','<i data-lucide="check"></i>');
    setUiLanguage(btn.dataset.lang || 'en');
  }else{
    showToast(btn.textContent.trim());
  }
  menu?.classList.remove('show');
  qsa('.footer-popover-toggle').forEach(x=>x.classList.remove('active'));
}));
document.addEventListener('click',()=>{qsa('.footer-popover').forEach(x=>x.classList.remove('show'));qsa('.footer-popover-toggle').forEach(x=>x.classList.remove('active'))});
qsa('.cost-range button').forEach(btn=>btn.addEventListener('click',()=>{qsa('.cost-range button').forEach(b=>b.classList.remove('active'));btn.classList.add('active')}));

// Integrations demo interactions
qsa('.integration-tabs button').forEach(btn=>btn.addEventListener('click',()=>{qsa('.integration-tabs button').forEach(b=>b.classList.remove('active'));btn.classList.add('active');showToast(btn.textContent.trim()==='Sessions'?'Sessions 為 Demo 頁籤':'Integrations') }));
qs('#generateApiKey')?.addEventListener('click',()=>showToast('Demo：API Key 已產生'));
qs('#apiDocsBtn')?.addEventListener('click',()=>showToast('Demo：API Docs'));
qs('#addIntegrationBtn')?.addEventListener('click',()=>showToast('Demo：Add Integration'));

qsa('.footer-icon-btn.demo-disabled').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation()}));
