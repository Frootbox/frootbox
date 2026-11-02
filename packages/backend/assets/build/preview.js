import{a as e,i as t,n,r}from"./chunks/edit-place-CBMoMEet.js";var i=document.getElementById(`fb-preview-config`),a=`frootbox-comment-name`,o=`
    :host {
        all: initial !important;
        position: fixed !important;
        inset: 0 !important;
        z-index: var(--fb-layer-edit) !important;
        display: block !important;
        pointer-events: none !important;
    }

    * { box-sizing: border-box; }

    .note, .panel, .pin, .hint { pointer-events: auto; }

    .note {
        position: fixed;
        inset-block-end: var(--fb-space-4);
        inset-inline-start: 50%;
        translate: -50% 0;
        display: flex;
        flex-wrap: wrap;
        gap: var(--fb-space-1) var(--fb-space-3);
        align-items: center;
        max-inline-size: calc(100vw - 2 * var(--fb-space-4));
        padding: var(--fb-space-2) var(--fb-space-2) var(--fb-space-2) var(--fb-space-4);
        border: var(--fb-size-border) solid var(--fb-border);
        border-radius: var(--fb-radius-lg);
        background: var(--fb-surface);
        color: var(--fb-text);
        box-shadow: var(--fb-shadow-lg);
    }

    .note, .panel, .pin, .hint {
        font-family: var(--fb-font-family);
        font-size: var(--fb-text-sm);
        line-height: var(--fb-leading-normal);
    }

    strong { font-weight: var(--fb-weight-semibold); }

    .muted { color: var(--fb-text-muted); }

    .actions { display: flex; flex-wrap: wrap; gap: var(--fb-space-2); }

    a, button {
        display: inline-flex;
        gap: var(--fb-space-1);
        align-items: center;
        justify-content: center;
        min-block-size: var(--fb-size-control-sm);
        padding-inline: var(--fb-space-3);
        border: 0;
        border-radius: var(--fb-radius-md);
        background: var(--fb-surface-2);
        color: var(--fb-text);
        font: inherit;
        font-weight: var(--fb-weight-medium);
        text-decoration: none;
        cursor: pointer;
    }

    a:hover, button:hover { background: var(--fb-accent-soft); color: var(--fb-accent-text); }

    button.primary { background: var(--fb-accent); color: var(--fb-on-accent); }

    button.primary:hover { background: var(--fb-accent-hover); color: var(--fb-on-accent); }

    button[aria-pressed="true"] { background: var(--fb-accent-soft); color: var(--fb-accent-text); }

    button:disabled { cursor: progress; opacity: 0.6; }

    a:focus-visible, button:focus-visible, textarea:focus-visible, input:focus-visible {
        outline: var(--fb-size-focus) solid var(--fb-focus);
        outline-offset: var(--fb-size-focus-offset);
    }

    .count {
        min-inline-size: var(--fb-size-icon-sm);
        padding-inline: var(--fb-space-1);
        border-radius: var(--fb-radius-full);
        background: var(--fb-accent);
        color: var(--fb-on-accent);
        font-size: var(--fb-text-xs);
        text-align: center;
    }

    .hint {
        position: fixed;
        inset-block-start: var(--fb-space-4);
        inset-inline-start: var(--fb-space-4);
        display: flex;
        flex-wrap: wrap;
        gap: var(--fb-space-2) var(--fb-space-3);
        align-items: center;
        max-inline-size: min(var(--fb-size-form), calc(100vw - 2 * var(--fb-space-4)));
        padding: var(--fb-space-2) var(--fb-space-2) var(--fb-space-2) var(--fb-space-4);
        border-radius: var(--fb-radius-lg);
        background: var(--fb-inverse-bg);
        color: var(--fb-inverse-text);
        box-shadow: var(--fb-shadow-lg);
    }

    .outline {
        position: fixed;
        border: var(--fb-size-focus) solid var(--fb-accent);
        border-radius: var(--fb-radius-sm);
        background: var(--fb-accent-soft);
        opacity: 0.5;
        pointer-events: none;
    }

    .outline span {
        position: absolute;
        inset-block-end: 100%;
        inset-inline-start: calc(-1 * var(--fb-size-focus));
        padding: 0 var(--fb-space-1);
        border-radius: var(--fb-radius-sm);
        background: var(--fb-accent);
        color: var(--fb-on-accent);
        font-family: var(--fb-font-family);
        font-size: var(--fb-text-xs);
        white-space: nowrap;
    }

    .pin {
        position: fixed;
        min-inline-size: var(--fb-size-icon);
        min-block-size: var(--fb-size-icon);
        padding: 0 var(--fb-space-1);
        border: var(--fb-size-border) solid var(--fb-on-accent);
        border-radius: var(--fb-radius-full);
        border-end-start-radius: 0;
        background: var(--fb-accent);
        color: var(--fb-on-accent);
        font-size: var(--fb-text-xs);
        box-shadow: var(--fb-shadow-sm);
    }

    .pin.done { background: var(--fb-surface-2); color: var(--fb-text-muted); }

    .pin.draft { pointer-events: none; display: grid; place-items: center; border-color: var(--fb-accent); background: var(--fb-surface); color: var(--fb-accent); }

    .panel {
        position: fixed;
        inset-block: var(--fb-space-4) calc(var(--fb-size-control) + 3 * var(--fb-space-4));
        inset-inline-end: var(--fb-space-4);
        display: flex;
        flex-direction: column;
        inline-size: min(var(--fb-size-narrow), calc(100vw - 2 * var(--fb-space-4)));
        border: var(--fb-size-border) solid var(--fb-border);
        border-radius: var(--fb-radius-lg);
        background: var(--fb-surface);
        color: var(--fb-text);
        box-shadow: var(--fb-shadow-lg);
    }

    .panel header {
        display: flex;
        gap: var(--fb-space-2);
        align-items: center;
        justify-content: space-between;
        padding: var(--fb-space-2) var(--fb-space-2) var(--fb-space-2) var(--fb-space-4);
        border-block-end: var(--fb-size-border) solid var(--fb-border);
    }

    h2, h3 { margin: 0; font-size: var(--fb-text-md); font-weight: var(--fb-weight-semibold); }

    h3 { font-size: var(--fb-text-sm); }

    .body { flex: 1; overflow: auto; padding: var(--fb-space-4); }

    .body > * + * { margin-block-start: var(--fb-space-4); }

    p { margin: 0; }

    form { display: grid; gap: var(--fb-space-2); }

    label { display: grid; gap: var(--fb-space-1); font-weight: var(--fb-weight-medium); }

    textarea, input {
        inline-size: 100%;
        min-block-size: var(--fb-size-control-sm);
        padding: var(--fb-space-2);
        border: var(--fb-size-border) solid var(--fb-border-strong);
        border-radius: var(--fb-radius-md);
        background: var(--fb-input-bg);
        color: var(--fb-text);
        font: inherit;
    }

    textarea { min-block-size: calc(3 * var(--fb-size-control-sm)); resize: vertical; }

    blockquote {
        margin: 0;
        padding-inline-start: var(--fb-space-2);
        border-inline-start: var(--fb-size-indicator) solid var(--fb-border-strong);
        color: var(--fb-text-muted);
    }

    .thread {
        display: grid;
        gap: var(--fb-space-2);
        padding: var(--fb-space-3);
        border: var(--fb-size-border) solid var(--fb-border);
        border-radius: var(--fb-radius-md);
    }

    .thread:target, .thread.current { border-color: var(--fb-accent); }

    .meta { display: flex; flex-wrap: wrap; gap: var(--fb-space-1) var(--fb-space-2); align-items: center; }

    .badge {
        padding: 0 var(--fb-space-2);
        border-radius: var(--fb-radius-full);
        background: var(--fb-info-bg);
        color: var(--fb-info-text);
        font-size: var(--fb-text-xs);
        font-weight: var(--fb-weight-medium);
    }

    .badge.done { background: var(--fb-success-bg); color: var(--fb-success-text); }

    .message p { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }

    .reply { padding-inline-start: var(--fb-space-3); border-inline-start: var(--fb-size-border) solid var(--fb-border); }

    .error { margin: 0; color: var(--fb-danger-text); }

    @media print { :host { display: none !important; } }
`;function s(e,t={},...n){let r=document.createElement(e);for(let[e,n]of Object.entries(t))e.startsWith(`on`)?r.addEventListener(e.slice(2),n):!0===n?r.setAttribute(e,``):!1!==n&&n!=null&&r.setAttribute(e,String(n));return r.append(...n.flat().filter(e=>e!=null&&!1!==e)),r}var c=class extends HTMLElement{threads=[];picking=!1;connectedCallback(){if(this.shadowRoot)return;this.settings=this.config??{},this.labels=this.settings.labels??{},this.root=this.attachShadow({mode:`open`});let e=document.createElement(`style`);e.textContent=`${this.settings.tokens??``}${o}`,this.layer=s(`div`),this.root.append(e,this.layer,this.note()),this.onPick=this.pick.bind(this),this.onHover=this.hover.bind(this),this.onKey=this.key.bind(this),this.onMove=()=>this.placePins(),window.addEventListener(`scroll`,this.onMove,{passive:!0}),window.addEventListener(`resize`,this.onMove),this.ready=this.settings.comments?this.load():Promise.resolve()}t(e,t={}){return Object.entries(t).reduce((e,[t,n])=>e.replace(`{${t}}`,n),this.labels[e]??e)}note(){let e=s(`div`,{class:`note`,role:`region`,"aria-label":this.t(`region`)},s(`strong`,{},this.t(`title`))),t=new Date(this.settings.expiresAt??``);if(!Number.isNaN(t.getTime())&&this.labels.until){let n=new Intl.DateTimeFormat(document.documentElement.lang||void 0,{dateStyle:`medium`,timeStyle:`short`}).format(t);e.append(s(`span`,{class:`muted`},this.t(`until`,{date:n})))}return this.settings.comments&&(this.commentButton=s(`button`,{type:`button`,"aria-pressed":`false`,onclick:()=>this.picking?this.stopPicking():this.startPicking()},this.t(`comment`)),this.listButton=s(`button`,{type:`button`,"aria-expanded":`false`,onclick:async()=>{this.panel?.dataset.view===`list`?this.closePanel():(await this.ready,this.showList())}},this.t(`comments`)),e.append(this.commentButton,this.listButton)),e.append(s(`a`,{href:this.settings.end??`?fb-preview=0`},this.t(`end`))),e}startPicking(){this.closePanel(),this.picking=!0,this.commentButton.setAttribute(`aria-pressed`,`true`),this.hint=s(`div`,{class:`hint`,role:`status`},s(`span`,{},this.t(`pickHint`)),s(`button`,{type:`button`,onclick:()=>this.compose({blockId:null,field:null,site:!1,landmark:null,label:null,excerpt:null,element:null,pointX:null,pointY:null})},this.t(`wholePage`)),s(`button`,{type:`button`,onclick:()=>this.stopPicking()},this.t(`cancel`))),this.root.append(this.hint),document.addEventListener(`click`,this.onPick,!0),document.addEventListener(`mouseover`,this.onHover,!0),document.addEventListener(`keydown`,this.onKey,!0)}stopPicking(){this.picking=!1,this.commentButton?.setAttribute(`aria-pressed`,`false`),this.hint?.remove(),this.outline?.remove(),this.outline=null,document.removeEventListener(`click`,this.onPick,!0),document.removeEventListener(`mouseover`,this.onHover,!0),document.removeEventListener(`keydown`,this.onKey,!0)}hover(t){if(!r(t.target))return;let n=e(t.target,{labels:this.labels});if(this.outline?.remove(),this.outline=null,!n.element)return;let i=n.element.getBoundingClientRect();this.outline=s(`div`,{class:`outline`},n.label?s(`span`,{},n.label):null),Object.assign(this.outline.style,{top:`${i.top}px`,left:`${i.left}px`,width:`${i.width}px`,height:`${i.height}px`}),this.layer.append(this.outline)}pick(t){r(t.target)&&(t.preventDefault(),t.stopPropagation(),this.compose(e(t.target,{event:t,labels:this.labels})))}key(e){e.key===`Escape`&&(e.preventDefault(),this.stopPicking())}openPanel(e,t,...n){this.panel?.remove(),this.panel=s(`section`,{class:`panel`,"aria-label":t,"data-view":e,onkeydown:e=>e.key===`Escape`&&this.closePanel()},s(`header`,{},s(`h2`,{},t),s(`button`,{type:`button`,onclick:()=>this.closePanel()},this.t(`close`))),s(`div`,{class:`body`},...n)),this.root.append(this.panel),this.listButton?.setAttribute(`aria-expanded`,String(e===`list`)),e!==`compose`&&this.draft&&(this.draft=null,this.placePins())}closePanel(){this.panel?.remove(),this.panel=null,this.listButton?.setAttribute(`aria-expanded`,`false`),this.draft&&(this.draft=null,this.placePins())}compose(e){this.stopPicking();let t=this.storedName(),n=s(`p`,{class:`error`,role:`alert`,hidden:!0}),r=s(`form`,{onsubmit:t=>this.send(t,e,n)},s(`p`,{class:`muted`},e.label?this.t(`about`,{place:e.label}):this.t(`aboutPage`)),e.excerpt?s(`blockquote`,{},e.excerpt.length>120?`${e.excerpt.slice(0,120)} …`:e.excerpt):null,s(`label`,{},this.t(`yourComment`),s(`textarea`,{name:`body`,required:!0,maxlength:2e3})),t?null:s(`label`,{},this.t(`yourName`),s(`input`,{name:`authorName`,required:!0,maxlength:80,autocomplete:`name`})),n,s(`div`,{class:`actions`},s(`button`,{type:`submit`,class:`primary`},this.t(`send`)),s(`button`,{type:`button`,onclick:()=>this.closePanel()},this.t(`cancel`))));this.openPanel(`compose`,this.t(`newComment`),r),this.draft=e.element?e:null,this.placePins(),r.querySelector(`textarea`).focus()}async send(e,t,n){e.preventDefault();let r=e.currentTarget,i=new FormData(r),a=String(i.get(`authorName`)??this.storedName()??``).trim();await this.submit(r,n,async()=>{let e=this.settings.design?t.design??`page`:null;await this.call(`action`,`comment.create`,{pageId:e?null:this.settings.pageId,design:e,body:String(i.get(`body`)??``),authorName:a,blockId:t.blockId,field:t.field,site:t.site,landmark:t.landmark??null,pointX:t.pointX??null,pointY:t.pointY??null,language:this.settings.language,path:e?location.pathname+location.search:location.pathname,excerpt:t.excerpt,viewport:window.innerWidth}),this.storeName(a),await this.load(),this.showList(this.threads[0]?.id)})}async reply(e,t,n){e.preventDefault();let r=e.currentTarget,i=String(new FormData(r).get(`body`)??``),a=String(new FormData(r).get(`authorName`)??this.storedName()??``).trim();await this.submit(r,n,async()=>{await this.call(`action`,`comment.reply`,{commentId:t.id,body:i,authorName:a}),this.storeName(a),await this.load(),this.showList(t.id)})}async submit(e,t,n){let r=[...e.querySelectorAll(`button`)];r.forEach(e=>e.disabled=!0),t.hidden=!0;try{await n()}catch(e){t.textContent=e.message,t.hidden=!1}finally{r.forEach(e=>e.disabled=!1)}}showList(e=null){let t=this.threads.filter(e=>this.isHere(e)),n=this.threads.filter(e=>!this.isHere(e)),r=this.threads.length===0?[s(`p`,{class:`muted`},this.t(`noComments`))]:[t.length?s(`h3`,{},this.t(`onThisPage`)):null,...t.map(t=>this.thread(t,e)),n.length?s(`h3`,{},this.t(`onOtherPages`)):null,...n.map(t=>this.thread(t,e))];this.openPanel(`list`,this.t(`comments`),...r),this.panel.querySelector(`.current`)?.scrollIntoView({block:`nearest`})}thread(e,t){let r=e.status===`done`,i=this.isHere(e)?n(e):null,a=this.isHere(e)?i?s(`button`,{type:`button`,onclick:()=>i.scrollIntoView({behavior:`smooth`,block:`center`})},this.t(`showPlace`)):null:s(`a`,{href:e.path??`/`},e.pageTitle??(e.design?this.t(`designElements`):this.t(`page`))),o=s(`p`,{class:`error`,role:`alert`,hidden:!0}),c=this.storedName();return s(`article`,{class:`thread${e.id===t?` current`:``}`,"data-thread":e.id},s(`div`,{class:`meta`},s(`span`,{class:`badge${r?` done`:``}`},r?this.t(`doneThread`):this.t(`openThread`)),s(`span`,{class:`muted`},e.excerpt?`„${e.excerpt.slice(0,60)}“`:this.t(`aboutPage`)),a),this.message(e.comment),...e.replies.map(e=>s(`div`,{class:`reply`},this.message(e))),s(`form`,{onsubmit:t=>this.reply(t,e,o)},s(`label`,{},this.t(`reply`),s(`textarea`,{name:`body`,required:!0,maxlength:2e3})),c?null:s(`label`,{},this.t(`yourName`),s(`input`,{name:`authorName`,required:!0,maxlength:80,autocomplete:`name`})),o,s(`div`,{class:`actions`},s(`button`,{type:`submit`},this.t(`sendReply`)))))}message(e){let t=e.createdAt?new Intl.DateTimeFormat(document.documentElement.lang||void 0,{dateStyle:`short`,timeStyle:`short`}).format(new Date(e.createdAt)):``;return s(`div`,{class:`message`},s(`div`,{class:`meta`},s(`strong`,{},e.authorName),s(`span`,{class:`muted`},t)),s(`p`,{},e.body))}placePins(){this.pins?.forEach(e=>e.remove()),this.pins=[];let e=this.threads.filter(e=>this.isHere(e));for(let[t,r]of e.entries()){let i=e.length-t,a=n(r);if(!a)continue;let o=s(`button`,{type:`button`,class:`pin${r.status===`done`?` done`:``}`,"aria-label":this.t(`commentPin`,{number:i,text:r.comment.body.slice(0,60)}),onclick:()=>this.showList(r.id)},String(i));this.pinTo(o,r,a)}this.draft?.element.isConnected&&this.pinTo(s(`span`,{class:`pin draft`,"aria-hidden":`true`},`+`),this.draft,this.draft.element)}pinTo(e,n,r){let{x:i,y:a,rect:o,point:s}=t(n,r);if(o.bottom<0||o.top>window.innerHeight||o.width===0&&o.height===0)return;this.layer.append(e),this.pins.push(e);let c=this.dir===`rtl`?document.documentElement.clientWidth-i:i,[l,u]=s?[a-e.offsetHeight,c]:[a-e.offsetHeight/2,c-e.offsetWidth/2];Object.assign(e.style,{insetBlockStart:`${Math.max(0,l)}px`,insetInlineStart:`${Math.max(0,u)}px`})}isHere(e){return this.settings.design?!!e.design:!e.design&&e.pageId===this.settings.pageId}async load(){try{this.threads=await this.call(`query`,`comment.list`,{})}catch{this.threads=[]}let e=this.threads.filter(e=>e.status===`open`).length;this.listButton?.replaceChildren(this.t(`comments`),...e?[s(`span`,{class:`count`,"aria-label":this.t(`openCount`,{count:e})},String(e))]:[]),this.placePins()}async call(e,t,n){let r=e===`action`,i=new URLSearchParams(Object.entries(n).filter(([,e])=>e!=null)),a=await fetch(r?`${this.settings.actions}${t}`:`${this.settings.queries}${t}${i.size?`?${i}`:``}`,{method:r?`POST`:`GET`,credentials:`same-origin`,headers:{Accept:`application/json`,"X-Frootbox-Preview":`1`,...r?{"Content-Type":`application/json`}:{}},body:r?JSON.stringify(Object.fromEntries(Object.entries(n).filter(([,e])=>e!==null&&e!==``))):void 0}),o=await a.json().catch(()=>null);if(!a.ok){let e={"/body":this.t(`yourComment`),"/authorName":this.t(`yourName`)},t=(Array.isArray(o?.errors)?o.errors:[]).map(({pointer:t,message:n})=>e[t]?`${e[t]}: ${n}`:n);throw Error(t.length?t.join(` `):o?.detail??this.t(`commentFailed`))}return o?.data}storedName(){try{return localStorage.getItem(a)}catch{return null}}storeName(e){try{e&&localStorage.setItem(a,e)}catch{}}};if(i){customElements.define(`fb-preview-note`,c);let e=document.createElement(`fb-preview-note`);e.config=JSON.parse(i.textContent??`{}`),e.lang=e.config.ui?.language??``,e.dir=e.config.ui?.direction??`ltr`,document.body.append(e)}