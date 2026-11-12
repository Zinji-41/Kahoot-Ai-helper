(() => {
  const visible = e => !!e && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden';
  const text = e => (e?.innerText || e?.getAttribute('aria-label') || '').trim();
  const usable = e => visible(e) && !e.disabled && !e.closest('[disabled], [aria-disabled="true"], [inert]');
  function ordered(nodes) {
    // A wrapper and its nested button represent one option, not two.
    return [...new Set(nodes)].filter(e => !nodes.some(other => other !== e && e.contains(other)))
      .sort((a,b) => { const x=a.getBoundingClientRect(),y=b.getBoundingClientRect(); return Math.abs(x.top-y.top)>15 ? x.top-y.top : x.left-y.left; });
  }
  function answerColor(e) {
    // Solo/practice layouts may have no answer attributes. Their answer tiles
    // still use Kahoot's saturated red, blue, yellow, and green backgrounds.
    const values=getComputedStyle(e).backgroundColor.match(/[\d.]+/g)?.map(Number);
    if(!values || values.length<3 || (values.length===4 && values[3]<0.8)) return false;
    const [r,g,b]=values;
    return (r>90 && r>g*1.65 && r>b*1.5) ||
      (b>75 && b>r*1.5 && b>g*1.2) ||
      (r>130 && g>95 && b<Math.min(r,g)*0.65) ||
      (g>70 && g>r*1.2 && g>b*1.2);
  }
  function choices() {
    const candidates=[...document.querySelectorAll('button, [role="button"], [tabindex="0"], [data-functional-selector], [data-testid], [class*="answer"], [class*="choice"]')].filter(usable);
    const explicit=ordered(candidates.filter(e => {
      const id=e.getAttribute('data-functional-selector') || e.getAttribute('data-testid') || '';
      return /^(?:(?:quiz|question|game)-)?(?:answer|choice)(?:-button)?[-_]\d+(?:[-_].*)?$/.test(id) || /^(?:answer|choice)-button$/.test(id);
    }));
    if(explicit.length>=2 && explicit.length<=6) return explicit;
    // Hit-test visible tiles as well: practice-mode tiles can be plain divs
    // with generated class names and no role, tabindex, or answer attributes.
    const sampled=new Set(candidates);
    if(document.elementsFromPoint) {
      for(let y=0.45;y<0.96;y+=0.08) for(let x=0.08;x<0.98;x+=0.1) {
        for(const e of document.elementsFromPoint(innerWidth*x,innerHeight*y)) sampled.add(e);
      }
    }
    const colored=ordered([...sampled].filter(e => {
      const rect=e.getBoundingClientRect();
      return usable(e) && rect.width>=100 && rect.height>=40 && rect.height<=innerHeight*0.4 &&
        rect.top>=innerHeight*0.4 && (text(e) || e.querySelector('svg,img')) && answerColor(e);
    }));
    // Require a compact, similarly sized set of answer tiles. Header controls
    // and ordinary navigation buttons cannot qualify just by being clickable.
    if(colored.length<2 || colored.length>6) return [];
    const rects=colored.map(e=>e.getBoundingClientRect());
    if(Math.max(...rects.map(r=>r.width))/Math.min(...rects.map(r=>r.width))>1.7 ||
       Math.max(...rects.map(r=>r.height))/Math.min(...rects.map(r=>r.height))>1.7) return [];
    // The tiles may sit in deeply nested independent wrappers. Match the grid,
    // rather than requiring a shared ancestor within an arbitrary depth.
    const aligned=rects.every((r,i)=>i===0 || rects.some((s,j)=>j!==i &&
      (Math.abs(r.top-s.top)<20 || Math.abs(r.left-s.left)<20)));
    const colors=new Set(colored.map(e=>getComputedStyle(e).backgroundColor));
    return aligned && colors.size>=2 ? colored : [];
  }
  function snapshot() {
    const media=[...document.querySelectorAll('img,video,canvas,svg,[style*="background-image"]')].some(e=>{
      const r=e.getBoundingClientRect();
      return visible(e) && r.width>180 && r.height>100 && r.top>70 && r.top<innerHeight*0.75;
    });
    return {text: (document.body.innerText || '').slice(0,6000), question: question(),hasMedia:media};
  }
  function question(knownButtons) {
    const explicit=text(document.querySelector('[data-functional-selector="question-title"], [data-functional-selector="question-text"], [data-functional-selector="question-title-text"]'));
    if(explicit) return explicit;
    const buttons=knownButtons || choices();
    if(buttons.length<2) return '';
    const top=buttons[0].getBoundingClientRect().top;
    // Practice mode can render the question in an unlabelled text block.
    const blocks=[...document.querySelectorAll('h1,h2,h3,p,div')].filter(e=>{
      if(e===panel || !visible(e) || e.childElementCount>0) return false;
      const t=text(e),r=e.getBoundingClientRect();
      return t.length>=12 && t.length<=800 && r.width>=200 && r.top>70 && r.bottom<=top && r.bottom>top-250;
    });
    blocks.sort((a,b)=>b.getBoundingClientRect().bottom-a.getBoundingClientRect().bottom);
    return text(blocks[0]);
  }
  function state() {
    const nodes = choices();
    const options = nodes.map((e,i) => ({index:i+1,text:text(e),selector:e.getAttribute('data-functional-selector')}));
    const q=question(nodes);
    return {nodes, options, question:q, signature:JSON.stringify([q,options])};
  }
  function clickTile(tile) {
    const r=tile.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
    // The colored background can be a sibling behind the actual event receiver.
    // Hit-test its centre instead of calling click() on that background div.
    const hit=document.elementFromPoint(x,y);
    if(!hit || !usable(hit)) throw new Error('Answer is covered or disabled.');
    const control=hit.closest('button,[role="button"]');
    const receiver=control && tile.contains(control)?control:hit;
    const event={bubbles:true,cancelable:true,composed:true,clientX:x,clientY:y,button:0};
    receiver.focus?.({preventScroll:true});
    if(typeof PointerEvent!=='undefined') receiver.dispatchEvent(new PointerEvent('pointerdown',{...event,pointerId:1,pointerType:'mouse',isPrimary:true,buttons:1}));
    receiver.dispatchEvent(new MouseEvent('mousedown',{...event,buttons:1}));
    if(typeof PointerEvent!=='undefined') receiver.dispatchEvent(new PointerEvent('pointerup',{...event,pointerId:1,pointerType:'mouse',isPrimary:true,buttons:0}));
    receiver.dispatchEvent(new MouseEvent('mouseup',{...event,buttons:0}));
    if(typeof receiver.click==='function') receiver.click();
    else receiver.dispatchEvent(new MouseEvent('click',event));
    return receiver;
  }
  function tileColor(tile) {
    const names={red:{name:'RED',shape:'▲',hex:'#d91435'},blue:{name:'BLUE',shape:'◆',hex:'#1262c4'},yellow:{name:'YELLOW',shape:'●',hex:'#b57e00'},green:{name:'GREEN',shape:'■',hex:'#217d0b'}};
    const nodes=[tile,...tile.querySelectorAll('*')];
    for(let p=tile.parentElement,n=0;p && n<3;n++,p=p.parentElement) nodes.push(p);
    for(const node of nodes) {
      const c=getComputedStyle(node).backgroundColor.match(/[\d.]+/g)?.map(Number);
      if(!c || c.length<3 || (c.length>3 && c[3]<0.8)) continue;
      const [r,g,b]=c,max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
      if(max<45 || d/max<0.45) continue;
      let hue=(max===r?(g-b)/d:max===g?(b-r)/d+2:(r-g)/d+4)*60;
      hue=(hue+360)%360;
      const key=hue<35 || hue>=330?'red':hue<75?'yellow':hue<170?'green':hue<=260?'blue':null;
      if(key) return names[key];
    }
    return null;
  }
  let busy=false, attempted='', epoch=0, previous='', enabled=false, started=0;
  const panel=document.createElement('div');
  panel.style.cssText='position:fixed;bottom:8px;left:8px;max-width:560px;white-space:pre-wrap;overflow-wrap:anywhere;padding:8px 12px;border-radius:8px;background:#201735;color:white;font:12px system-ui;z-index:2147483647;pointer-events:none;display:none';
  document.documentElement.append(panel);
  const banner=document.createElement('div');
  banner.setAttribute('role','status');
  banner.setAttribute('aria-live','polite');
  banner.style.cssText='position:fixed;top:10px;left:50%;transform:translateX(-50%);max-width:85vw;padding:14px 24px;border:3px solid white;border-radius:14px;box-shadow:0 4px 24px #0009;color:white;text-shadow:0 1px 3px #000;font:bold 30px system-ui;text-align:center;z-index:2147483647;pointer-events:none;display:none';
  document.documentElement.append(banner);
  function hint(color,label,manual) {
    banner.style.background=color?.hex || '#201735';
    banner.textContent=color?`${manual?'CLICK':'AI ANSWER:'} ${color.name} ${color.shape} — ${label}`:`${manual?'CLICK':'AI ANSWER:'} ${label}`;
    banner.style.display='block';
  }
  function status(s) { const value='AI Helper 0.2.7 · '+s;if(panel.textContent!==value) panel.textContent=value; }
  chrome.runtime.onMessage.addListener((m,s,reply) => {
    if(m.type==='snapshot') { const hidden=panel.style.display,oldBanner=banner.style.display;panel.style.display='none';banner.style.display='none'; const data=snapshot();panel.style.display=hidden;banner.style.display=oldBanner;reply(data); }
    if(m.type==='enabled') { enabled=m.enabled;epoch++;attempted='';banner.style.display='none';panel.style.display=enabled?'block':'none';status('Waiting for answer buttons');reply({ok:true}); }
  });
  async function tick() {
    if(!enabled && !busy) return;
    let s;
    try {s=state();}catch(e) {status('Detection error: '+e.message);return;}
    const valid=s.nodes.length>=2 && s.nodes.length<=6;
    if(enabled && !busy && !valid) status(`Waiting: detected ${s.nodes.length} answer tiles`);
    const sig=valid?s.signature:'';
    if(sig!==previous) {
      banner.style.display='none';
      if(busy) chrome.runtime.sendMessage({type:'cancel'}).catch(()=>{});
      epoch++;previous=sig;attempted='';
    }
    if(enabled && busy) {status(`Waiting for AI · ${((Date.now()-started)/1000).toFixed(1)}s`);return;}
    if(!enabled || !valid || attempted===sig) return;
    attempted=sig;busy=true;const current=epoch;
    started=Date.now();
    status('Reading question…');
    try {
      const r=await chrome.runtime.sendMessage({type:'solve',options:s.options,question:s.question});
      if(current!==epoch || !enabled || state().signature!==sig) return;
      if(!r.ok) throw new Error(r.error);
      if(!r.answer.can_answer) {status('Skipped: '+r.answer.reason);return;}
      const target=state().nodes[r.answer.index-1];
      if(!target || !target.isConnected || !visible(target) || target.disabled) return;
      const label=text(target) || `option ${r.answer.index}`;
      const color=tileColor(target);
      hint(color,label,false);
      let receiver;
      try {receiver=clickTile(target);}catch(e) {
        hint(color,label,true);
        status(`Click ${color?.name || label} manually · ${e.message}`);
        return;
      }
      const timing=r.timing?` (prep ${r.timing.prep}s, AI ${r.timing.ai}s)`:'';
      status(`Clicked ${label} · ${((Date.now()-started)/1000).toFixed(1)}s${timing}`);
      setTimeout(()=>{
        if(!enabled || epoch!==current) return;
        if(!target.isConnected || !usable(target) || receiver.getAttribute('aria-pressed')==='true' || receiver.getAttribute('aria-selected')==='true') {
          banner.style.display='none';
          status(`Selection registered: ${label}`);
        } else if(state().signature===sig) {
          hint(color,label,true);
          status(`CLICK ${color?.name || label} manually · no page change detected.${timing}`);
        }
      },600);
    } catch(e) { if(current===epoch) status(e.message); }
    finally { busy=false; }
  }
  // React inserts answer controls between polling ticks. Observe those changes
  // for prompt detection, retaining polling for style-only transitions.
  let queued=false;
  const observer=new MutationObserver(records=>{
    if(!enabled || queued || records.every(r=>r.target===panel || panel.contains(r.target) || r.target===banner || banner.contains(r.target))) return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;tick();});
  });
  observer.observe(document.body,{childList:true,subtree:true,characterData:true});
  setInterval(tick,100);
  chrome.runtime.sendMessage({type:'getEnabled'}).then(r=>{enabled=!!r.enabled;panel.style.display=enabled?'block':'none';}).catch(()=>{});
})();
