var e=globalThis,t=e.ShadowRoot&&(e.ShadyCSS===void 0||e.ShadyCSS.nativeShadow)&&`adoptedStyleSheets`in Document.prototype&&`replace`in CSSStyleSheet.prototype,n=Symbol(),r=new WeakMap,i=class{constructor(e,t,r){if(this._$cssResult$=!0,r!==n)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,n=this.t;if(t&&e===void 0){let t=n!==void 0&&n.length===1;t&&(e=r.get(n)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),t&&r.set(n,e))}return e}toString(){return this.cssText}},a=e=>new i(typeof e==`string`?e:e+``,void 0,n),o=(e,...t)=>new i(e.length===1?e[0]:t.reduce((t,n,r)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if(typeof e==`number`)return e;throw Error(`Value passed to 'css' function must be a 'css' function result: `+e+`. Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.`)})(n)+e[r+1],e[0]),e,n),s=(n,r)=>{if(t)n.adoptedStyleSheets=r.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let t of r){let r=document.createElement(`style`),i=e.litNonce;i!==void 0&&r.setAttribute(`nonce`,i),r.textContent=t.cssText,n.appendChild(r)}},c=t?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t=``;for(let n of e.cssRules)t+=n.cssText;return a(t)})(e):e,{is:l,defineProperty:u,getOwnPropertyDescriptor:d,getOwnPropertyNames:ee,getOwnPropertySymbols:te,getPrototypeOf:ne}=Object,f=globalThis,re=f.trustedTypes,ie=re?re.emptyScript:``,ae=f.reactiveElementPolyfillSupport,p=(e,t)=>e,m={toAttribute(e,t){switch(t){case Boolean:e=e?ie:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,t){let n=e;switch(t){case Boolean:n=e!==null;break;case Number:n=e===null?null:Number(e);break;case Object:case Array:try{n=JSON.parse(e)}catch{n=null}}return n}},oe=(e,t)=>!l(e,t),se={attribute:!0,type:String,converter:m,reflect:!1,useDefault:!1,hasChanged:oe};Symbol.metadata??=Symbol(`metadata`),f.litPropertyMetadata??=new WeakMap;var h=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=se){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let n=Symbol(),r=this.getPropertyDescriptor(e,n,t);r!==void 0&&u(this.prototype,e,r)}}static getPropertyDescriptor(e,t,n){let{get:r,set:i}=d(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:r,set(t){let a=r?.call(this);i?.call(this,t),this.requestUpdate(e,a,n)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??se}static _$Ei(){if(this.hasOwnProperty(p(`elementProperties`)))return;let e=ne(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(p(`finalized`)))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(p(`properties`))){let e=this.properties,t=[...ee(e),...te(e)];for(let n of t)this.createProperty(n,e[n])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[e,n]of t)this.elementProperties.set(e,n)}this._$Eh=new Map;for(let[e,t]of this.elementProperties){let n=this._$Eu(e,t);n!==void 0&&this._$Eh.set(n,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let n=new Set(e.flat(1/0).reverse());for(let e of n)t.unshift(c(e))}else e!==void 0&&t.push(c(e));return t}static _$Eu(e,t){let n=t.attribute;return!1===n?void 0:typeof n==`string`?n:typeof e==`string`?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let n of t.keys())this.hasOwnProperty(n)&&(e.set(n,this[n]),delete this[n]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return s(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,n){this._$AK(e,n)}_$ET(e,t){let n=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,n);if(r!==void 0&&!0===n.reflect){let i=(n.converter?.toAttribute===void 0?m:n.converter).toAttribute(t,n.type);this._$Em=e,i==null?this.removeAttribute(r):this.setAttribute(r,i),this._$Em=null}}_$AK(e,t){let n=this.constructor,r=n._$Eh.get(e);if(r!==void 0&&this._$Em!==r){let e=n.getPropertyOptions(r),i=typeof e.converter==`function`?{fromAttribute:e.converter}:e.converter?.fromAttribute===void 0?m:e.converter;this._$Em=r;let a=i.fromAttribute(t,e.type);this[r]=a??this._$Ej?.get(r)??a,this._$Em=null}}requestUpdate(e,t,n,r=!1,i){if(e!==void 0){let a=this.constructor;if(!1===r&&(i=this[e]),n??=a.getPropertyOptions(e),!((n.hasChanged??oe)(i,t)||n.useDefault&&n.reflect&&i===this._$Ej?.get(e)&&!this.hasAttribute(a._$Eu(e,n))))return;this.C(e,t,n)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:n,reflect:r,wrapped:i},a){n&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,a??t??this[e]),!0!==i||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||n||(t=void 0),this._$AL.set(e,t)),!0===r&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}let e=this.constructor.elementProperties;if(e.size>0)for(let[t,n]of e){let{wrapped:e}=n,r=this[t];!0!==e||this._$AL.has(t)||r===void 0||this.C(t,void 0,n,r)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};h.elementStyles=[],h.shadowRootOptions={mode:`open`},h[p(`elementProperties`)]=new Map,h[p(`finalized`)]=new Map,ae?.({ReactiveElement:h}),(f.reactiveElementVersions??=[]).push(`2.1.2`);var g=globalThis,ce=e=>e,_=g.trustedTypes,le=_?_.createPolicy(`lit-html`,{createHTML:e=>e}):void 0,ue=`$lit$`,v=`lit$${Math.random().toFixed(9).slice(2)}$`,de=`?`+v,fe=`<${de}>`,y=document,b=()=>y.createComment(``),x=e=>e===null||typeof e!=`object`&&typeof e!=`function`,S=Array.isArray,pe=e=>S(e)||typeof e?.[Symbol.iterator]==`function`,C=`[ 	
\f\r]`,w=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,me=/-->/g,he=/>/g,T=RegExp(`>|${C}(?:([^\\s"'>=/]+)(${C}*=${C}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,`g`),ge=/'/g,_e=/"/g,ve=/^(?:script|style|textarea|title)$/i,ye=e=>(t,...n)=>({_$litType$:e,strings:t,values:n}),E=ye(1),D=ye(2),O=Symbol.for(`lit-noChange`),k=Symbol.for(`lit-nothing`),be=new WeakMap,A=y.createTreeWalker(y,129);function xe(e,t){if(!S(e)||!e.hasOwnProperty(`raw`))throw Error(`invalid template strings array`);return le===void 0?t:le.createHTML(t)}var Se=(e,t)=>{let n=e.length-1,r=[],i,a=t===2?`<svg>`:t===3?`<math>`:``,o=w;for(let t=0;t<n;t++){let n=e[t],s,c,l=-1,u=0;for(;u<n.length&&(o.lastIndex=u,c=o.exec(n),c!==null);)u=o.lastIndex,o===w?c[1]===`!--`?o=me:c[1]===void 0?c[2]===void 0?c[3]!==void 0&&(o=T):(ve.test(c[2])&&(i=RegExp(`</`+c[2],`g`)),o=T):o=he:o===T?c[0]===`>`?(o=i??w,l=-1):c[1]===void 0?l=-2:(l=o.lastIndex-c[2].length,s=c[1],o=c[3]===void 0?T:c[3]===`"`?_e:ge):o===_e||o===ge?o=T:o===me||o===he?o=w:(o=T,i=void 0);let d=o===T&&e[t+1].startsWith(`/>`)?` `:``;a+=o===w?n+fe:l>=0?(r.push(s),n.slice(0,l)+ue+n.slice(l)+v+d):n+v+(l===-2?t:d)}return[xe(e,a+(e[n]||`<?>`)+(t===2?`</svg>`:t===3?`</math>`:``)),r]},j=class e{constructor({strings:t,_$litType$:n},r){let i;this.parts=[];let a=0,o=0,s=t.length-1,c=this.parts,[l,u]=Se(t,n);if(this.el=e.createElement(l,r),A.currentNode=this.el.content,n===2||n===3){let e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;(i=A.nextNode())!==null&&c.length<s;){if(i.nodeType===1){if(i.hasAttributes())for(let e of i.getAttributeNames())if(e.endsWith(ue)){let t=u[o++],n=i.getAttribute(e).split(v),r=/([.?@])?(.*)/.exec(t);c.push({type:1,index:a,name:r[2],strings:n,ctor:r[1]===`.`?we:r[1]===`?`?Te:r[1]===`@`?Ee:P}),i.removeAttribute(e)}else e.startsWith(v)&&(c.push({type:6,index:a}),i.removeAttribute(e));if(ve.test(i.tagName)){let e=i.textContent.split(v),t=e.length-1;if(t>0){i.textContent=_?_.emptyScript:``;for(let n=0;n<t;n++)i.append(e[n],b()),A.nextNode(),c.push({type:2,index:++a});i.append(e[t],b())}}}else if(i.nodeType===8){if(i.data===de)c.push({type:2,index:a});else{let e=-1;for(;(e=i.data.indexOf(v,e+1))!==-1;)c.push({type:7,index:a}),e+=v.length-1}}a++}}static createElement(e,t){let n=y.createElement(`template`);return n.innerHTML=e,n}};function M(e,t,n=e,r){if(t===O)return t;let i=r===void 0?n._$Cl:n._$Co?.[r],a=x(t)?void 0:t._$litDirective$;return i?.constructor!==a&&(i?._$AO?.(!1),a===void 0?i=void 0:(i=new a(e),i._$AT(e,n,r)),r===void 0?n._$Cl=i:(n._$Co??=[])[r]=i),i!==void 0&&(t=M(e,i._$AS(e,t.values),i,r)),t}var Ce=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:n}=this._$AD,r=(e?.creationScope??y).importNode(t,!0);A.currentNode=r;let i=A.nextNode(),a=0,o=0,s=n[0];for(;s!==void 0;){if(a===s.index){let t;s.type===2?t=new N(i,i.nextSibling,this,e):s.type===1?t=new s.ctor(i,s.name,s.strings,this,e):s.type===6&&(t=new De(i,this,e)),this._$AV.push(t),s=n[++o]}a!==s?.index&&(i=A.nextNode(),a++)}return A.currentNode=y,r}p(e){let t=0;for(let n of this._$AV)n!==void 0&&(n.strings===void 0?n._$AI(e[t]):(n._$AI(e,n,t),t+=n.strings.length-2)),t++}},N=class e{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,n,r){this.type=2,this._$AH=k,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=n,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=M(this,e,t),x(e)?e===k||e==null||e===``?(this._$AH!==k&&this._$AR(),this._$AH=k):e!==this._$AH&&e!==O&&this._(e):e._$litType$===void 0?e.nodeType===void 0?pe(e)?this.k(e):this._(e):this.T(e):this.$(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==k&&x(this._$AH)?this._$AA.nextSibling.data=e:this.T(y.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:n}=e,r=typeof n==`number`?this._$AC(e):(n.el===void 0&&(n.el=j.createElement(xe(n.h,n.h[0]),this.options)),n);if(this._$AH?._$AD===r)this._$AH.p(t);else{let e=new Ce(r,this),n=e.u(this.options);e.p(t),this.T(n),this._$AH=e}}_$AC(e){let t=be.get(e.strings);return t===void 0&&be.set(e.strings,t=new j(e)),t}k(t){S(this._$AH)||(this._$AH=[],this._$AR());let n=this._$AH,r,i=0;for(let a of t)i===n.length?n.push(r=new e(this.O(b()),this.O(b()),this,this.options)):r=n[i],r._$AI(a),i++;i<n.length&&(this._$AR(r&&r._$AB.nextSibling,i),n.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let t=ce(e).nextSibling;ce(e).remove(),e=t}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},P=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,n,r,i){this.type=1,this._$AH=k,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=i,n.length>2||n[0]!==``||n[1]!==``?(this._$AH=Array(n.length-1).fill(new String),this.strings=n):this._$AH=k}_$AI(e,t=this,n,r){let i=this.strings,a=!1;if(i===void 0)e=M(this,e,t,0),a=!x(e)||e!==this._$AH&&e!==O,a&&(this._$AH=e);else{let r=e,o,s;for(e=i[0],o=0;o<i.length-1;o++)s=M(this,r[n+o],t,o),s===O&&(s=this._$AH[o]),a||=!x(s)||s!==this._$AH[o],s===k?e=k:e!==k&&(e+=(s??``)+i[o+1]),this._$AH[o]=s}a&&!r&&this.j(e)}j(e){e===k?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??``)}},we=class extends P{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===k?void 0:e}},Te=class extends P{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==k)}},Ee=class extends P{constructor(e,t,n,r,i){super(e,t,n,r,i),this.type=5}_$AI(e,t=this){if((e=M(this,e,t,0)??k)===O)return;let n=this._$AH,r=e===k&&n!==k||e.capture!==n.capture||e.once!==n.once||e.passive!==n.passive,i=e!==k&&(n===k||r);r&&this.element.removeEventListener(this.name,this,n),i&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH==`function`?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},De=class{constructor(e,t,n){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=n}get _$AU(){return this._$AM._$AU}_$AI(e){M(this,e)}},Oe=g.litHtmlPolyfillSupport;Oe?.(j,N),(g.litHtmlVersions??=[]).push(`3.3.3`);var ke=(e,t,n)=>{let r=n?.renderBefore??t,i=r._$litPart$;if(i===void 0){let e=n?.renderBefore??null;r._$litPart$=i=new N(t.insertBefore(b(),e),e,void 0,n??{})}return i._$AI(e),i},F=globalThis,I=class extends h{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=ke(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return O}};I._$litElement$=!0,I.finalized=!0,F.litElementHydrateSupport?.({LitElement:I});var Ae=F.litElementPolyfillSupport;Ae?.({LitElement:I}),(F.litElementVersions??=[]).push(`4.2.2`);var je=`[data-fb-block]`,Me=`[data-fb-field], [data-fb-block], fb-area[data-fb-area]`,Ne=/^\d+$/;function L(e){return e.parentElement?.closest(je)??null}function Pe(e){let t=e.split(`/`);return t.flatMap((e,n)=>n>0&&Ne.test(e)?[t.slice(0,n+1).join(`/`)]:[])}function Fe(e){let t=e[0];for(;t&&!e.every(e=>t.contains(e));)t=t.parentElement;return t}function Ie(e,t){let n=new Set(e),r=t=>[...t.querySelectorAll(Me)].some(t=>!n.has(t)&&!e.some(e=>e.contains(t))),i=Fe(e);if(!i||i===t||r(i))return null;for(;i.parentElement&&i.parentElement!==t&&i.parentElement!==document.body&&!r(i.parentElement);)i=i.parentElement;for(;i.children.length===1&&e.every(e=>i.children[0].contains(e));)i=i.children[0];return i}function Le(){let e=new Map;for(let t of document.querySelectorAll(`[data-fb-field]:not([data-fb-site])`)){let n=L(t);for(let r of Pe(t.dataset.fbField)){let i=`${n?.dataset.fbBlock??``} ${r}`,a=e.get(i)??{owner:n,path:r,fields:[]};a.fields.push(t),e.set(i,a)}}for(let{owner:t,path:n,fields:r}of e.values()){let e=Ie(r,t);e&&!e.hasAttribute(`data-fb-entry`)&&(e.dataset.fbEntry=n)}}function Re(e){let t=e instanceof Element?e.closest(`[data-fb-entry]`):null;if(!t)return null;let n=L(t),r=t.dataset.fbEntry,i=r.slice(0,r.lastIndexOf(`/`)),a=Number(r.slice(r.lastIndexOf(`/`)+1)),o=[...(n??document).querySelectorAll(`[data-fb-entry]`)].filter(e=>L(e)===n&&e.dataset.fbEntry.startsWith(i+`/`)&&Ne.test(e.dataset.fbEntry.slice(i.length+1))).sort((e,t)=>Number(e.dataset.fbEntry.slice(i.length+1))-Number(t.dataset.fbEntry.slice(i.length+1)));return{element:t,owner:n,path:r,list:i,index:a,count:o.length,siblings:o}}function ze(e){let t=e.siblings.map(e=>e.getBoundingClientRect().top);return t.some((e,n)=>n>0&&Math.abs(e-t[n-1])<4)}function Be(e){return[...e.element.querySelectorAll(`[data-fb-field]`),...e.element.matches(`[data-fb-field]`)?[e.element]:[]].filter(t=>L(t)===e.owner&&t.dataset.fbField.startsWith(e.path+`/`)).sort((e,t)=>e===t?0:e.compareDocumentPosition(t)&Node.DOCUMENT_POSITION_FOLLOWING?-1:1)}var Ve={pencil:D`<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>`,external:D`<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>`,collapse:D`<path d="m6 9 6 6 6-6"/>`,expand:D`<path d="m9 6 6 6-6 6"/>`,lock:D`<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>`,undo:D`<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>`,bold:D`<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7z"/><path d="M7 12h7a3.5 3.5 0 0 1 0 7H7z"/>`,italic:D`<path d="M19 4h-9"/><path d="M14 20H5"/><path d="M15 4 9 20"/>`,heading:D`<path d="M6 4v16"/><path d="M18 4v16"/><path d="M6 12h12"/>`,list:D`<path d="M9 6h11"/><path d="M9 12h11"/><path d="M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>`,ordered:D`<path d="M10 6h10"/><path d="M10 12h10"/><path d="M10 18h10"/><path d="M4 4h1v4"/><path d="M4 14h2l-2 4h2"/>`,quote:D`<path d="M5 11h4v6H5zM5 11a5 5 0 0 1 4-5"/><path d="M14 11h4v6h-4zM14 11a5 5 0 0 1 4-5"/>`,link:D`<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>`,close:D`<path d="M6 6l12 12"/><path d="M18 6 6 18"/>`,left:D`<path d="M19 12H5"/><path d="m11 6-6 6 6 6"/>`,right:D`<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>`,up:D`<path d="M12 19V5"/><path d="m6 11 6-6 6 6"/>`,down:D`<path d="M12 5v14"/><path d="m6 13 6 6 6-6"/>`,parent:D`<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 5 5v6"/>`,copy:D`<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>`,trash:D`<path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/><path d="M9 7V4h6v3"/>`,settings:D`<path d="M4 7h10"/><path d="M18 7h2"/><path d="M4 17h4"/><path d="M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>`,plus:D`<path d="M12 5v14"/><path d="M5 12h14"/>`,image:D`<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>`,palette:D`<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.9 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="14.5" cy="7" r="1"/>`,restore:D`<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>`,warning:D`<path d="M10.3 4.2 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z"/><path d="M12 9.5v4"/><path d="M12 17v.5"/>`,check:D`<path d="M20 6 9 17l-5-5"/>`,more:D`<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>`,text:D`<path d="M4 6h16"/><path d="M4 10h16"/><path d="M4 14h16"/><path d="M4 18h10"/>`,header:D`<rect x="3" y="4" width="18" height="8" rx="1.5"/><path d="M3 16h18"/><path d="M3 20h12"/>`,teaser:D`<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h10"/><path d="M7 13h6"/><path d="M7 16h4"/>`,callout:D`<path d="M4 10v4h3l7 4V6l-7 4z"/><path d="M18 9a4 4 0 0 1 0 6"/>`,form:D`<rect x="3" y="5" width="18" height="5" rx="1"/><rect x="3" y="14" width="11" height="5" rx="1"/>`,columns:D`<rect x="3" y="4" width="7" height="16" rx="1.5"/><rect x="14" y="4" width="7" height="16" rx="1.5"/>`,block:D`<rect x="4" y="4" width="16" height="16" rx="2"/>`,places:D`<rect x="3" y="4" width="18" height="6" rx="1.5" stroke-dasharray="3 2"/><rect x="3" y="14" width="18" height="6" rx="1.5" stroke-dasharray="3 2"/>`};function R(e){return E`<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${Ve[e]}</svg>`}var He=`fb-edit-restore:`,z=`[data-fb-block]`,Ue=[`headline`,`text`,`link`,`image`],We=8,Ge={header:`header`,heading:`heading`,text:`text`,media:`image`,teaser:`teaser`,callout:`callout`,list:`list`,form:`form`,structure:`columns`};function B(e,t){return e?new URL(e,location.href).pathname.endsWith(`.svg`)?E`<span class="preview"><svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMin slice" aria-hidden="true" focusable="false"><use href="${e}#preview"></use></svg></span>`:E`<span class="preview"><img src=${e} alt="" loading="lazy" decoding="async"></span>`:E`<span class="preview none">${R(Ge[t]??`block`)}</span>`}function V(e){return e.parentElement?.closest(z)??null}function H(e,t){return[...(e??document).querySelectorAll(`${z}[data-fb-area="${CSS.escape(t)}"]`)].filter(t=>V(t)===e)}function Ke(e,t){for(let n of Object.values(e?.areas??{}))for(let e of Array.isArray(n)?n:[]){if(e?.id===t)return e;let n=Ke(e,t);if(n)return n}return null}function qe(e){try{let t=sessionStorage.getItem(e);return sessionStorage.removeItem(e),t?JSON.parse(t):null}catch{return null}}function Je(e,t){try{sessionStorage.setItem(e,JSON.stringify(t))}catch{}}function Ye(e,t,n,r){for(let n of t){let t=e?.[n.name];if((n.type===`headline`||n.type===`text`)&&typeof t==`string`&&t.trim()!==``)return t}return r.entry.replace(`{number}`,String(n))}var Xe=o`
    .block-tools {
        position: absolute;
        display: flex;
        align-items: center;
        gap: var(--fb-space-0);
        padding: var(--fb-space-0);
        pointer-events: auto;
        background: var(--fb-surface);
        border: var(--fb-size-border) solid var(--fb-border);
        border-radius: var(--fb-radius-md);
        box-shadow: var(--fb-shadow-sm);
        translate: -100% -100%;
    }

    .block-tools.inside { translate: -100% 0; }

    /* Inside the corner of the entry, so it does not cover the buttons of the block. */
    .entry-tools { translate: calc(-100% - var(--fb-space-1)) var(--fb-space-1); }

    .block-tools button {
        justify-content: center;
        min-inline-size: var(--fb-size-control-sm);
        padding-inline: var(--fb-space-1);
    }

    .block-tools button[disabled] { cursor: default; opacity: 0.4; }
    .block-tools .note { white-space: nowrap; }

    dialog.picker { inline-size: min(100% - var(--fb-space-8), var(--fb-size-form)); }
    dialog.picker.grouped { inline-size: min(100% - var(--fb-space-8), var(--fb-size-content)); }

    .picker-body {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: var(--fb-space-4);
        align-items: start;
    }

    /* Same height for every group, so the dialog does not jump. */
    .grouped .picker-body {
        grid-template-columns: auto minmax(0, 1fr);
        block-size: min(60vh, calc(var(--fb-space-16) * 8));
    }

    .grouped .picker-body > ul { max-block-size: 100%; }

    @media (max-width: 40rem) {
        .grouped .picker-body { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto minmax(0, 1fr); }
        .grouped .picker-groups { display: flex; overflow-x: auto; }
        .grouped .picker-groups button { white-space: nowrap; }
    }

    .picker-groups, .picker-cards {
        margin: 0;
        padding: var(--fb-space-1);
        overflow-y: auto;
        list-style: none;
        max-block-size: min(60vh, calc(var(--fb-space-16) * 8));
    }

    .picker-groups { display: grid; align-content: start; gap: var(--fb-space-0); }

    .picker-groups button {
        justify-content: space-between;
        gap: var(--fb-space-4);
        inline-size: 100%;
        border-color: transparent;
        font-weight: var(--fb-weight-regular);
        text-align: start;
    }

    .picker-groups button[aria-pressed="true"] {
        background: var(--fb-accent-soft);
        color: var(--fb-accent-text);
        font-weight: var(--fb-weight-semibold);
    }

    .picker-groups .count { color: var(--fb-text-muted); font-size: var(--fb-text-xs); }

    .picker-cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(calc(var(--fb-space-16) * 3), 1fr));
        gap: var(--fb-space-3);
        align-content: start;
    }

    .picker-cards button {
        display: grid;
        align-content: start;
        gap: var(--fb-space-1);
        inline-size: 100%;
        block-size: 100%;
        padding: var(--fb-space-2);
        border-color: var(--fb-border);
        text-align: start;
    }

    .picker-cards small {
        color: var(--fb-text-muted);
        font-weight: var(--fb-weight-regular);
        line-height: var(--fb-leading-snug);
    }

    /* 16:10, cut at the bottom; it shows the website's own colours, so it gets a frame. */
    .preview {
        display: grid;
        place-items: center;
        overflow: hidden;
        aspect-ratio: 16 / 10;
        margin-block-end: var(--fb-space-1);
        border: var(--fb-size-border) solid var(--fb-border);
        border-radius: var(--fb-radius-sm);
        background: var(--fb-surface-2);
        color: var(--fb-text-muted);
    }

    .preview svg:not(.icon), .preview img {
        inline-size: 100%;
        block-size: 100%;
        object-fit: cover;
        object-position: top;
    }

    .preview.none .icon { inline-size: var(--fb-space-8); block-size: var(--fb-space-8); }

    .panel label.choice .preview { inline-size: calc(var(--fb-space-16) * 1.5); margin: 0; }

    .panel {
        position: absolute;
        inset-block-start: var(--fb-space-4);
        inset-block-end: calc(var(--bar-block-size, 0px) + 2 * var(--fb-space-4));
        inset-inline-end: var(--fb-space-4);
        display: flex;
        flex-direction: column;
        inline-size: min(calc(100vw - 2 * var(--fb-space-4)), var(--fb-size-narrow));
        pointer-events: auto;
        background: var(--fb-surface);
        border: var(--fb-size-border) solid var(--fb-border);
        border-radius: var(--fb-radius-lg);
        box-shadow: var(--fb-shadow-lg);
    }

    .panel header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--fb-space-2);
        padding: var(--fb-space-3) var(--fb-space-3) var(--fb-space-3) var(--fb-space-5);
        border-block-end: var(--fb-size-border) solid var(--fb-border);
    }

    .panel h2 {
        margin: 0;
        font-size: var(--fb-text-lg);
        font-weight: var(--fb-weight-bold);
    }

    .panel h2:focus { outline: none; }

    .panel form {
        display: grid;
        align-content: start;
        gap: var(--fb-space-5);
        padding: var(--fb-space-5);
        overflow-y: auto;
    }

    .panel fieldset {
        display: grid;
        gap: var(--fb-space-3);
        min-inline-size: 0;
        margin: 0;
        padding: 0;
        border: 0;
    }

    .panel legend, .panel h3 {
        margin: 0 0 var(--fb-space-2);
        padding: 0;
        color: var(--fb-text-muted);
        font-size: var(--fb-text-xs);
        font-weight: var(--fb-weight-semibold);
        letter-spacing: var(--fb-tracking-caps);
        text-transform: uppercase;
    }

    .panel label { display: grid; gap: var(--fb-space-1); font-weight: var(--fb-weight-semibold); }
    .panel label.check, .panel label.choice { display: flex; align-items: flex-start; gap: var(--fb-space-2); }
    .panel label.choice span { display: grid; gap: var(--fb-space-0); }
    .panel label.choice small { color: var(--fb-text-muted); font-weight: var(--fb-weight-regular); }

    .panel input[type="text"], .panel input[type="number"], .panel select, .panel textarea {
        min-block-size: var(--fb-size-control);
        padding: var(--fb-space-2) var(--fb-space-3);
        border: var(--fb-size-border) solid var(--fb-border-strong);
        border-radius: var(--fb-radius-md);
        background: var(--fb-surface);
        color: inherit;
        font: inherit;
        font-weight: var(--fb-weight-regular);
    }

    .panel textarea { resize: vertical; line-height: var(--fb-leading-normal); }

    .panel input[type="checkbox"], .panel input[type="radio"] {
        inline-size: var(--fb-size-check);
        block-size: var(--fb-size-check);
        margin: 0;
        accent-color: var(--fb-accent);
    }

    .panel :is(input, select, textarea):focus-visible {
        outline: var(--fb-size-focus) solid var(--fb-focus);
        outline-offset: var(--fb-size-focus-offset);
    }

    .panel .link-field {
        justify-content: space-between;
        min-block-size: var(--fb-size-control);
        border-color: var(--fb-border-strong);
        font-weight: var(--fb-weight-regular);
    }

    .entries {
        display: grid;
        gap: var(--fb-space-2);
        margin: 0;
        padding: 0;
        list-style: none;
    }

    .entries > li {
        border: var(--fb-size-border) solid var(--fb-border);
        border-radius: var(--fb-radius-md);
    }

    .entries .entry-head {
        display: flex;
        align-items: center;
        gap: var(--fb-space-0);
        padding: var(--fb-space-1);
    }

    .entries .entry-toggle {
        display: flex;
        flex: 1;
        align-items: center;
        gap: var(--fb-space-2);
        min-inline-size: 0;
        padding-inline: var(--fb-space-2);
        font-weight: var(--fb-weight-regular);
        text-align: start;
    }

    .entries .entry-toggle span, span.entry-toggle {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .entries .entry-fields { display: grid; gap: var(--fb-space-3); padding: var(--fb-space-2) var(--fb-space-3) var(--fb-space-3); }
    .entries .entry-head button:not(.entry-toggle) { min-inline-size: var(--fb-size-control-sm); justify-content: center; padding-inline: var(--fb-space-1); }
    .entries .entry-head button[disabled] { cursor: default; opacity: 0.4; }
    .panel .add { justify-self: start; border-color: var(--fb-border); }
`,Ze=class{constructor(e){this.bar=e,this.block=null,this.entry=null,this.confirming=!1,this.picker=null,this.panel=null,this.blocks=null,this.layouts=null,this.busy=!1,this.onKey=e=>this.key(e),this.onClick=e=>this.click(e)}get labels(){return this.bar.labels}get restoreKey(){return He+(this.bar.config.page?.id??``)}start(){for(let e of document.querySelectorAll(`${z}, fb-area[data-fb-area]`))e.tabIndex<0&&(e.tabIndex=0);Le(),document.addEventListener(`keydown`,this.onKey,!0),document.addEventListener(`click`,this.onClick,!0),this.restore()}stop(){document.removeEventListener(`keydown`,this.onKey,!0),document.removeEventListener(`click`,this.onClick,!0)}restore(){let e=qe(this.restoreKey),t=e?.block?document.querySelector(`${z}[data-fb-block="${CSS.escape(e.block)}"]`):null,n=(e?.field?[...(t??document).querySelectorAll(`[data-fb-field="${CSS.escape(e.field)}"]:not([data-fb-site])`)].find(e=>L(e)===t):null)??t;if(!n)return;let r=n.getBoundingClientRect();(r.bottom<0||r.top>innerHeight)&&n.scrollIntoView({block:`center`}),n.focus({preventScroll:!0}),this.select(n),e.panel&&this.openPanel(n)}select(e){if(!(e instanceof Element)||e===this.bar||this.picker)return;let t=e.closest(z),n=Re(e),r=n&&n.owner===t?n:null;t!==this.block&&(this.block=t,this.confirming=!1,this.bar.requestUpdate()),r?.element!==this.entry?.element&&(this.entry=r,this.bar.requestUpdate(),r&&this.describe().then(()=>this.bar.requestUpdate()))}key(e){let t=e.target instanceof Element?e.target:null;if(!t||t===this.bar)return;if(e.key===`F10`&&e.altKey&&!t.closest(`[data-fb-type="richtext"]`)){let n=t.closest(`[data-fb-field]`);n&&this.bar.hasFieldTools(n)?(e.preventDefault(),this.bar.focusFieldTools(n)):this.reachTools(t)&&e.preventDefault();return}let n=t.matches(`fb-area[data-fb-area]`)?t:null;n&&(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),this.openPicker(this.targetIn(n)))}reachTools(e){let t=e.closest(z),n=Re(e);return n&&n.owner===t?(this.select(e),this.entryReturn=e,this.focusTools(`.entry-tools`),!0):t?(this.select(t),this.focusTools(),!0):!1}click(e){let t=e.target instanceof Element?e.target.closest(`fb-area[data-fb-area]`):null;t&&(e.preventDefault(),this.openPicker(this.targetIn(t)))}targetIn(e){let t=V(e);return{parent:t?.dataset.fbBlock??null,parentName:t?.dataset.fbName??null,area:e.dataset.fbArea,after:null}}targetBelow(e){let t=V(e);return{parent:t?.dataset.fbBlock??null,parentName:t?.dataset.fbName??null,area:e.dataset.fbArea,after:e.dataset.fbBlock}}focusTools(e=`.block-tools`){this.bar.updateComplete.then(()=>this.bar.renderRoot.querySelector(`${e} button:not([disabled])`)?.focus())}tools(){let e=this.block;if(!e?.isConnected||this.panel?.id===e.dataset.fbBlock&&this.panel.busy)return k;let t=e.getBoundingClientRect();if(t.bottom<0||t.top>innerHeight||t.width===0)return k;let n=this.labels,r=t.top<48,i=r?Math.max(t.top,0):t.top,a=Math.min(t.right,innerWidth),o=V(e),s=H(o,e.dataset.fbArea),c=s.indexOf(e),l=e.dataset.fbTitle??``,u=(e,t,n,r=!1,i=``)=>E`<button type="button" class=${i}
            aria-label=${t} title=${t} ?disabled=${r||this.busy} @click=${n}>${R(e)}</button>`,d=this.confirming?E`<span class="note">${n.removeConfirm.replace(`{block}`,l)}</span>
                <button type="button" class="danger solid" ?disabled=${this.busy} @click=${()=>this.remove(e)}>${n.removeYes}</button>
                <button type="button" @click=${()=>this.confirm(!1)}>${n.cancel}</button>`:E`
                ${o?u(`parent`,n.parentBlock,()=>this.selectParent(o)):k}
                ${u(`up`,n.moveUp,()=>this.move(e,s,c-1),c<=0)}
                ${u(`down`,n.moveDown,()=>this.move(e,s,c+1),c>=s.length-1)}
                ${u(`copy`,n.copyBlock,()=>this.copy(e))}
                ${u(`settings`,n.blockSettings,()=>this.openPanel(e))}
                ${u(`plus`,n.insertBelow,()=>this.openPicker(this.targetBelow(e)))}
                ${u(`trash`,n.removeBlock,()=>this.confirm(!0),!1,`danger`)}`;return E`<div class="block-tools ${r?`inside`:``}" role="toolbar"
            aria-label=${n.blockTools.replace(`{block}`,l)}
            style="inset-block-start: ${i}px; inset-inline-start: ${a}px"
            @keydown=${t=>this.toolsKey(t,e)}>${d}</div>`}listOf(e){let t=(e.owner?this.blocks?.find(t=>t.name===e.owner.dataset.fbName):this.layouts?.find(e=>e.name===this.bar.config.page?.layout))?.fields??[],n=null;for(let r of e.list.split(`/`))/^\d+$/.test(r)||(n=t.find(e=>e.name===r)??null,t=n?.fields??[]);return n}entryTools(){let e=this.entry;if(!e?.element.isConnected||this.picker||this.panel?.busy)return k;let t=e.element.getBoundingClientRect();if(t.bottom<0||t.top>innerHeight||t.width===0)return k;let n=this.labels,r=this.listOf(e),i=r?.label||n.entry.replace(`{number}`,``).trim(),a=String(e.index+1),o=r?.max!=null&&e.count>=r.max,s=(r?.min??0)>=e.count,c=ze(e),l=(e,t,n,r=!1,i=``,a=``)=>E`<button type="button" class=${a}
            aria-label=${t} title=${r&&i?i:t} ?disabled=${r||this.busy} @click=${n}>${R(e)}</button>`;return E`<div class="block-tools entry-tools" role="toolbar"
            aria-label=${n.entryTools.replace(`{number}`,a).replace(`{list}`,i)}
            style="inset-block-start: ${Math.max(t.top,0)}px; inset-inline-start: ${Math.min(t.right,innerWidth)}px"
            @keydown=${e=>this.entryToolsKey(e)}>
            ${l(c?`left`:`up`,n.moveEarlier,()=>this.moveEntry(e,e.index-1),e.index===0)}
            ${l(c?`right`:`down`,n.moveLater,()=>this.moveEntry(e,e.index+1),e.index>=e.count-1)}
            ${l(`plus`,n.insertEntry,()=>this.addEntry(e),o,n.entriesMax.replace(`{count}`,String(r?.max)))}
            ${l(`trash`,n.removeEntry,()=>this.removeEntry(e),s,n.entriesMin.replace(`{count}`,String(r?.min)),`danger`)}
        </div>`}entryToolsKey(e){let t=[...this.bar.renderRoot.querySelectorAll(`.entry-tools button:not([disabled])`)],n=t.indexOf(this.bar.renderRoot.activeElement);e.key===`Escape`?(e.preventDefault(),(this.entryReturn?.isConnected?this.entryReturn:this.entry?Be(this.entry)[0]:null)?.focus()):e.key===`F10`&&e.altKey?(e.preventDefault(),this.focusTools()):(e.key===`ArrowRight`||e.key===`ArrowLeft`)&&(e.preventDefault(),t[(n+(e.key===`ArrowRight`?1:-1)+t.length)%t.length]?.focus())}fieldAt(e,t,n=null){let r=Be(e),i=this.listOf(e),a=i?r.find(t=>!i.fields.find(n=>t.dataset.fbField===`${e.path}/${n.name}`)?.optional):null,o=n??a??r[0];return o?`${e.list}/${t}/${o.dataset.fbField.slice(e.path.length+1)}`:null}entryInput(e){return e.owner?{block:e.owner.dataset.fbBlock}:{}}focusedField(e){let t=document.activeElement?.closest?.(`[data-fb-field]`);return t&&e.element.contains(t)?t:null}moveEntry(e,t){let n=this.fieldAt(e,t,this.focusedField(e));return this.change(`page.move-list-entry`,{...this.entryInput(e),path:e.path,to:t},()=>e.owner?.dataset.fbBlock??null,!1,n)}addEntry(e){let t=this.fieldAt(e,e.index+1);return this.change(`page.add-list-entry`,{...this.entryInput(e),path:e.list,index:e.index+1},()=>e.owner?.dataset.fbBlock??null,!1,t)}removeEntry(e){let t=e.index<e.count-1?e.index:e.index-1,n=t>=0?this.fieldAt(e,t):null;return this.change(`page.remove-list-entry`,{...this.entryInput(e),path:e.path},()=>e.owner?.dataset.fbBlock??null,!1,n)}confirm(e){this.confirming=e,this.bar.requestUpdate(),this.focusTools()}toolsKey(e,t){let n=[...this.bar.renderRoot.querySelectorAll(`.block-tools button:not([disabled])`)],r=n.indexOf(this.bar.renderRoot.activeElement);e.key===`Escape`?(e.preventDefault(),this.confirming=!1,this.bar.requestUpdate(),t.focus()):(e.key===`ArrowRight`||e.key===`ArrowLeft`)&&(e.preventDefault(),n[(r+(e.key===`ArrowRight`?1:-1)+n.length)%n.length]?.focus())}selectParent(e){e.focus({preventScroll:!0}),this.select(e),this.focusTools()}async move(e,t,n){let r=V(e),i=t.filter(t=>t!==e),a=n>0?i[n-1].dataset.fbBlock:null;await this.change(`page.move-block`,{block:e.dataset.fbBlock,parent:r?.dataset.fbBlock??null,area:e.dataset.fbArea,after:a},()=>e.dataset.fbBlock)}async copy(e){await this.change(`page.copy-block`,{block:e.dataset.fbBlock},e=>e.block)}async remove(e){let t=V(e),n=H(t,e.dataset.fbArea),r=n.indexOf(e),i=n[r+1]??n[r-1]??t;await this.change(`page.remove-block`,{block:e.dataset.fbBlock},()=>i?.dataset.fbBlock??null)}async change(e,t,n,r=!1,i=null){this.busy=!0,this.bar.requestUpdate(),await this.bar.editing?.flushAll();let a=await this.bar.run(e,{id:this.bar.config.page.id,language:this.bar.config.language,...t});return a.ok?(this.bar.changed(a.data?.entry??null),Je(this.restoreKey,{block:n(a.data??{}),panel:r,field:i}),location.reload(),!0):(this.busy=!1,this.confirming=!1,this.panel&&={...this.panel,busy:!1},this.bar.requestUpdate(),!1)}async query(e,t=null){let n=t?`?`+new URLSearchParams(t):``;try{let t=await fetch(this.bar.config.queries+e+n,{headers:{Accept:`application/json`},credentials:`same-origin`});return t.ok?(await t.json()).data:null}catch{return null}}async describe(){if(!this.blocks){let[e,t,n]=await Promise.all([this.query(`block.list`),this.query(`layout.list`),this.query(`block.groups`)]);this.blocks=e??[],this.layouts=t??[],this.groups=n??[]}}async pageData(){let e=await this.query(`page.show`,{id:this.bar.config.page.id});return e?.draft??e?.published??null}async openPicker(e){this.picker={...e,query:``,loading:!0,info:null},this.bar.requestUpdate(),await this.bar.updateComplete,this.bar.renderRoot.querySelector(`dialog.picker`)?.showModal();let[,t]=await Promise.all([this.describe(),e.parentName?null:this.pageData()]);if(!this.picker)return;let n=(e.parentName?this.blocks.find(t=>t.name===e.parentName):this.layouts.find(e=>e.name===t?.layout))?.areas?.find(t=>t.name===e.area)??null,r=H(e.parent?document.querySelector(`${z}[data-fb-block="${CSS.escape(e.parent)}"]`):null,e.area).length,i=this.blocks.filter(e=>n?.allow?n.allow.includes(e.name):!e.widget),a=i.length>We?this.groupsOf(i):[];this.picker={...this.picker,loading:!1,info:n,full:n?.max!=null&&r>=n.max,choices:i,groups:a,group:a[0]?.name??null},this.bar.requestUpdate(),await this.bar.updateComplete,this.bar.renderRoot.querySelector(`dialog.picker :is(input, .picker-cards button)`)?.focus()}closePicker(){let e=this.picker;this.bar.renderRoot.querySelector(`dialog.picker`)?.close(),this.picker=null,this.bar.requestUpdate();let t=e?.after??e?.parent;(t?document.querySelector(`${z}[data-fb-block="${CSS.escape(t)}"]`):null)?.focus({preventScroll:!0})}groupsOf(e){let t=this.labels,n=new Set((this.groups??[]).map(e=>e.name)),r=(this.groups??[]).map(n=>({name:n.name,title:t.groups?.[n.name]??n.title,blocks:e.filter(e=>e.group===n.name)}));r.push({name:``,title:t.otherGroup,blocks:e.filter(e=>!n.has(e.group))});let i=r.filter(e=>e.blocks.length>0);return i.length>1?i:[]}pickGroup(e){this.picker={...this.picker,group:e,query:``},this.bar.requestUpdate()}pickerDialog(){let e=this.picker;if(!e)return k;let t=this.labels,n=e.query.trim().toLowerCase(),r=e.groups??[],i=e=>r.find(t=>t.blocks.includes(e))?.title??``,a=e=>[e.title,e.description,...e.keywords??[],i(e)].some(e=>e.toLowerCase().includes(n)),o=e.choices??[];n===``?r.length>0&&(o=r.find(t=>t.name===e.group)?.blocks??[]):o=o.filter(a);let s=e.info?.label||e.area,c=n===``?r.find(t=>t.name===e.group):null,l;return l=e.loading?E`<p class="hint">${t.loading}</p>`:e.full?E`<p class="hint">${t.areaFull.replace(`{area}`,s)}</p>`:(e.choices??[]).length===0?E`<p class="hint">${t.noBlocks}</p>`:E`
                ${e.choices.length>6?E`<label>${t.search}
                    <input type="text" .value=${e.query} autocomplete="off"
                        @input=${e=>{this.picker={...this.picker,query:e.target.value},this.bar.requestUpdate()}}></label>`:k}
                <div class="picker-body">
                    ${r.length>0?E`<ul class="picker-groups" aria-label=${t.blockGroups}>
                        ${r.map(e=>E`<li><button type="button" aria-pressed=${String(e===c)} @click=${()=>this.pickGroup(e.name)}>
                            <span>${e.title}</span><span class="count">${e.blocks.length}</span></button></li>`)}
                    </ul>`:k}
                    <ul class="picker-cards" aria-label=${c?.title??t.addBlock}>
                        ${o.map(e=>E`<li><button type="button" ?disabled=${this.busy} @click=${()=>this.add(e)}>
                            ${B(e.preview,e.group)}
                            <span>${e.title}</span>${e.description?E`<small>${e.description}</small>`:k}</button></li>`)}
                        ${o.length===0?E`<li class="hint">${t.noBlocks}</li>`:k}
                    </ul>
                </div>`,E`<dialog class="picker ${(e.groups??[]).length>0?`grouped`:``}" aria-labelledby="fb-picker-title" @cancel=${e=>{e.preventDefault(),this.closePicker()}}>
            <form @submit=${e=>e.preventDefault()}>
                <h2 id="fb-picker-title">${t.addBlock}</h2>
                ${s?E`<p class="hint">${t.intoArea.replace(`{area}`,s)}</p>`:k}
                ${l}
                <div class="actions"><button type="button" @click=${()=>this.closePicker()}>${t.cancel}</button></div>
            </form>
        </dialog>`}async add(e){let t=this.picker;await this.change(`page.add-block`,{name:e.name,parent:t.parent,area:t.area,after:t.after},e=>e.block)}async openPanel(e){let t=e.dataset.fbBlock;this.bar.design?.hide(),this.panel={id:t,title:e.dataset.fbTitle??``,loading:!0,busy:!1},this.bar.requestUpdate();let[,n]=await Promise.all([this.describe(),this.pageData()]),r=Ke(n?.translations?.[this.bar.config.language]?.content??null,t),i=this.blocks.find(t=>t.name===(r?.block??e.dataset.fbName))??null;this.panel?.id===t&&(this.panel={...this.panel,loading:!1,data:r,summary:i},this.bar.requestUpdate(),await this.bar.updateComplete,this.bar.renderRoot.querySelector(`.panel h2`)?.focus())}closePanel(){let e=this.panel?.id;this.panel=null,this.bar.requestUpdate(),(e?document.querySelector(`${z}[data-fb-block="${CSS.escape(e)}"]`):null)?.focus({preventScroll:!0})}panelView(){let e=this.panel;if(!e)return k;let t=this.labels,n;return n=e.loading?E`<p class="hint">${t.loading}</p>`:!e.data||!e.summary?E`<p class="hint">${t.blockGone}</p>`:this.settings(e.data,e.summary),E`<section class="panel" role="region" aria-labelledby="fb-panel-title"
            @keydown=${e=>{e.key===`Escape`&&(e.preventDefault(),this.closePanel())}}>
            <header>
                <h2 id="fb-panel-title" tabindex="-1">${t.settingsOf.replace(`{block}`,e.title)}</h2>
                <button type="button" aria-label=${t.close} title=${t.close} @click=${()=>this.closePanel()}>${R(`close`)}</button>
            </header>
            <form @submit=${e=>e.preventDefault()}>
                <fieldset ?disabled=${e.busy}>${n}</fieldset>
            </form>
        </section>`}settings(e,t){let n=this.labels,r=e.variant??`Default`,i=t.variants.find(e=>e.name===r)??t.variants[0],a=i?.options??[],o=t.fields.filter(e=>Ue.includes(e.type)),s=t.fields.filter(e=>e.type===`list`),c=t.variants.some(e=>e.preview);return t.variants.length<=1&&a.length===0&&o.length===0&&s.length===0?E`<p class="hint">${n.noSettings}</p>`:E`
            ${t.variants.length>1?E`<fieldset>
                <legend>${n.variant}</legend>
                ${t.variants.map(n=>E`<label class="choice">
                    <input type="radio" name="variant" .value=${n.name} .checked=${n.name===i?.name}
                        @change=${()=>this.setVariant(e,t,n)}>
                    ${c?B(n.preview,t.group):k}
                    <span>${n.title}${n.description?E`<small>${n.description}</small>`:k}</span>
                </label>`)}
            </fieldset>`:k}
            ${a.length>0?E`<fieldset>
                <legend>${n.options}</legend>
                ${a.map(t=>this.optionInput(e,t))}
            </fieldset>`:k}
            ${o.length>0?E`<fieldset>
                <legend>${n.content}</legend>
                ${o.map(t=>this.fieldInput(e,t,t.name,e.fields?.[t.name]??null))}
            </fieldset>`:k}
            ${s.map(t=>this.listView(e,t))}`}optionInput(e,t){let n=e.options?.[t.name]??t.default,r=n=>this.setOption(e,t.name,n),i=t.description?E`<small class="hint">${t.description}</small>`:k;switch(t.type){case`boolean`:return E`<label class="check"><input type="checkbox" .checked=${n===!0}
                    @change=${e=>r(e.target.checked)}>${t.label}</label>`;case`choice`:return E`<label>${t.label}
                    <select @change=${e=>r(e.target.value)}>
                        ${t.choices.map(e=>E`<option .value=${String(e.value)} ?selected=${String(e.value)===String(n)}>${e.label}</option>`)}
                    </select>${i}</label>`;case`number`:return E`<label>${t.label}
                    <input type="number" .value=${String(n??``)} min=${t.min??k} max=${t.max??k}
                        @change=${e=>r(e.target.value===``?t.default:Number(e.target.value))}>${i}</label>`;default:return E`<label>${t.label}
                    <input type="text" .value=${String(n??``)}
                        @change=${e=>r(e.target.value)}>${i}</label>`}}fieldInput(e,t,n,r){if(t.type===`link`){let i=r?r.text||r.target||r.url:this.labels.noLink;return E`<div><span class="hint">${t.label}</span>
                <button type="button" class="link-field" @click=${()=>this.editLink(e,n,r)}>
                    <span>${i}</span>${R(`link`)}</button></div>`}if(t.type===`image`)return E`<div><span class="hint">${t.label}</span>
                <button type="button" class="link-field" @click=${()=>this.editImage(e,n,r)}>
                    <span>${r?.media?this.labels.imageChosen:this.labels.noImage}</span>${R(`image`)}</button></div>`;let i=t=>{let i=t.target.value.trim()===``?null:t.target.value;this.setField(e,n,r,i)};return E`<label>${t.label}
            ${t.type===`text`?E`<textarea rows="3" .value=${r??``} placeholder=${t.placeholder||k} @change=${i}></textarea>`:E`<input type="text" .value=${r??``} placeholder=${t.placeholder||k} @change=${i}
                    @keydown=${e=>{e.key===`Enter`&&(e.preventDefault(),e.target.blur())}}>`}
        </label>`}listView(e,t){let n=this.labels,r=Array.isArray(e.fields?.[t.name])?e.fields[t.name]:[],i=t.fields.filter(e=>Ue.includes(e.type)),a=this.panel.open??[],o=r.length-1,s=e=>{this.panel={...this.panel,open:a.includes(e)?a.filter(t=>t!==e):[...a,e]},this.bar.requestUpdate()};return E`<fieldset>
            <legend>${t.label}</legend>
            <ol class="entries">
                ${r.map((r,c)=>{let l=Ye(r,t.fields,c+1,n),u=`${t.name}/${c}`,d=a.includes(u);return E`<li>
                        <div class="entry-head">
                            ${i.length>0?E`<button type="button" class="entry-toggle" aria-expanded=${d?`true`:`false`}
                                    @click=${()=>s(u)}>${R(d?`collapse`:`expand`)}<span>${l}</span></button>`:E`<span class="entry-toggle">${l}</span>`}
                            <button type="button" aria-label="${n.moveUp}: ${l}" title=${n.moveUp} ?disabled=${c===0}
                                @click=${()=>this.listChange(`page.move-list-entry`,e,{path:u,to:c-1})}>${R(`up`)}</button>
                            <button type="button" aria-label="${n.moveDown}: ${l}" title=${n.moveDown} ?disabled=${c===o}
                                @click=${()=>this.listChange(`page.move-list-entry`,e,{path:u,to:c+1})}>${R(`down`)}</button>
                            <button type="button" class="danger" aria-label="${n.removeEntry}: ${l}" title=${n.removeEntry}
                                @click=${()=>this.listChange(`page.remove-list-entry`,e,{path:u})}>${R(`trash`)}</button>
                        </div>
                        ${d?E`<div class="entry-fields">
                            ${i.map(t=>this.fieldInput(e,t,`${u}/${t.name}`,r?.[t.name]??null))}
                        </div>`:k}
                    </li>`})}
            </ol>
            <button type="button" class="add" @click=${()=>this.listChange(`page.add-list-entry`,e,{path:t.name})}>${R(`plus`)}${n.addEntry}</button>
        </fieldset>`}panelChange(e,t){return this.panel={...this.panel,busy:!0},this.bar.requestUpdate(),this.change(e,t,()=>this.panel.id,!0)}setVariant(e,t,n){let r=n.options.map(e=>e.name),i=Object.fromEntries(Object.entries(e.options??{}).filter(([e])=>r.includes(e)));return this.panelChange(`page.update-block`,{block:e.id,variant:n.name,options:i})}setOption(e,t,n){return this.panelChange(`page.update-block`,{block:e.id,options:{...e.options??{},[t]:n}})}setField(e,t,n,r){return(n??null)===(r??null)?null:this.panelChange(`page.update-field`,{block:e.id,path:t,value:r,previous:n})}listChange(e,t,n){return this.panelChange(e,{block:t.id,...n})}editImage(e,t,n){let r=this.bar.renderRoot.activeElement;this.bar.media.open({value:n,apply:r=>this.panelChange(`page.update-field`,{block:e.id,path:t,value:r,previous:n}),remove:()=>this.panelChange(`page.update-field`,{block:e.id,path:t,value:null,previous:n}),done:()=>r?.focus()})}editLink(e,t,n){let r=this.bar.renderRoot.activeElement;this.bar.openLink({withText:!0,text:n?.text??``,href:n?.target??n?.url??``,newWindow:n?.newWindow===!0,apply:({text:r,href:i,newWindow:a})=>{let o=i.startsWith(`page:`)?{target:i}:{url:i};r&&(o.text=r),a&&(o.newWindow=!0),this.panelChange(`page.update-field`,{block:e.id,path:t,value:o,previous:n})},remove:()=>this.panelChange(`page.update-field`,{block:e.id,path:t,value:null,previous:n}),done:()=>r?.focus()})}},Qe=400,$e=4.5,et=[[`color`,`designColors`],[`font`,`designFonts`],[`length`,`designSizes`],[`choice`,`designMore`]];function U(e){let t=String(e).trim().toLowerCase();return/^#[0-9a-f]{3}$/.test(t)?[1,2,3].map(e=>parseInt(t[e]+t[e],16)):/^#[0-9a-f]{6}$/.test(t)?[1,3,5].map(e=>parseInt(t.slice(e,e+2),16)):null}function tt([e,t,n]){let[r,i,a]=[e,t,n].map(e=>{let t=e/255;return t<=.04045?t/12.92:((t+.055)/1.055)**2.4});return .2126*r+.7152*i+.0722*a}function nt(e,t){let n=U(e),r=U(t);if(!n||!r)return null;let[i,a]=[tt(n),tt(r)].sort((e,t)=>t-e);return Math.round((i+.05)/(a+.05)*100)/100}var rt=class{constructor(e){this.bar=e,this.state=null,this.pending={},this.timer=null}get labels(){return this.bar.labels}get open(){return this.state!==null}async show(){this.bar.arranging?.closePanel?.(),this.state={loading:!0,design:null,busy:!1,confirming:!1},this.bar.requestUpdate();let e=null;try{let t=await fetch(this.bar.config.queries+`design.show`,{headers:{Accept:`application/json`},credentials:`same-origin`});e=t.ok?await t.json():null}catch{e=null}this.state&&(this.update({loading:!1,design:e?.data??null}),await this.bar.updateComplete,this.bar.renderRoot.querySelector(`#fb-design-title`)?.focus())}async close(){this.hide(),await this.bar.updateComplete,this.bar.renderRoot.querySelector(`[data-fb-more]`)?.focus()}hide(){this.state&&(this.flush(),this.state=null,this.bar.requestUpdate())}update(e){this.state={...this.state,...e},this.bar.requestUpdate()}token(e){return this.state?.design?.tokens.find(t=>t.name===e)??null}cssOf(e,t){return e.options.find(e=>e.value===t)?.css??t}change(e,t){let n=t??e.default;document.documentElement.style.setProperty(`--${e.name}`,this.cssOf(e,n)),this.replace(e.name,{value:n,css:this.cssOf(e,n)}),this.pending={...this.pending,[e.name]:t},clearTimeout(this.timer),this.timer=setTimeout(()=>this.flush(),Qe)}replace(e,t){let n=this.state.design;this.update({design:{...n,draft:!0,tokens:n.tokens.map(n=>n.name===e?{...n,...t}:n)}})}async flush(){clearTimeout(this.timer);let e=this.pending;if(this.pending={},Object.keys(e).length===0)return;let t=await this.bar.run(`design.update`,{tokens:e});t.ok&&this.state&&Object.keys(this.pending).length===0&&this.apply(t.data)}apply(e){for(let t of e.tokens)document.documentElement.style.setProperty(`--${t.name}`,t.css);this.update({design:e,busy:!1,confirming:!1})}async publish(){await this.flush(),this.update({busy:!0});let e=await this.bar.run(`design.publish`,{});e.ok?(this.apply(e.data),this.bar.message={tone:`success`,text:this.labels.designIsPublished}):this.update({busy:!1})}async discard(){clearTimeout(this.timer),this.pending={},this.update({busy:!0});let e=await this.bar.run(`design.discard`,{});e.ok?(this.apply(e.data),this.bar.message={tone:`info`,text:this.labels.designIsDiscarded}):this.update({busy:!1,confirming:!1})}view(){let e=this.state;if(!e)return k;let t=this.labels,n=e.design,r;return r=e.loading?E`<p class="hint">${t.loading}</p>`:n?n.tokens.length===0?E`<p class="hint">${t.designNone}</p>`:E`${et.map(([e,r])=>this.group(n.tokens.filter(t=>t.type===e),t[r]))}`:E`<p class="hint">${t.failed}</p>`,E`<section class="panel design" role="region" aria-labelledby="fb-design-title"
            @keydown=${e=>{e.key===`Escape`&&(e.preventDefault(),this.close())}}>
            <header>
                <h2 id="fb-design-title" tabindex="-1">${t.designTitle}</h2>
                <button type="button" aria-label=${t.close} title=${t.close} @click=${()=>this.close()}>${R(`close`)}</button>
            </header>
            <form @submit=${e=>e.preventDefault()}>
                ${n?E`<p class="hint" role="status">${n.draft?t.designDraft:t.designLive}</p>`:k}
                <fieldset ?disabled=${e.busy}>${r}</fieldset>
            </form>
            ${n?this.footer(n):k}
        </section>`}footer(e){let t=this.labels;return this.state.confirming?E`<footer>
                <p class="hint">${t.designDiscardConfirm}</p>
                <div class="actions">
                    <button type="button" @click=${()=>this.update({confirming:!1})}>${t.cancel}</button>
                    <button type="button" class="danger solid" ?disabled=${this.state.busy} @click=${()=>this.discard()}>${t.discardYes}</button>
                </div>
            </footer>`:E`<footer class="actions">
            ${e.draft&&this.bar.config.design.discard?E`<button type="button" class="danger" ?disabled=${this.state.busy}
                @click=${()=>this.update({confirming:!0})}>${t.designDiscard}</button>`:k}
            ${this.bar.config.design.publish?E`<button type="button" class="primary" ?disabled=${this.state.busy||!e.draft}
                @click=${()=>this.publish()}>${t.designPublish}</button>`:k}
        </footer>`}group(e,t){return e.length===0?k:E`<fieldset><legend>${t}</legend>${e.map(e=>this.field(e))}</fieldset>`}field(e){let t=`fb-design-${e.name}`,n=e.value===e.default?k:E`<button type="button" class="reset" aria-label=${this.labels.designResetOf.replace(`{token}`,e.label)} title=${this.labels.designReset}
                @click=${()=>this.change(e,null)}>${R(`restore`)}</button>`;switch(e.type){case`color`:return E`<div class="token">
                    <label for=${t}>${e.label}</label>
                    <div class="row">
                        <input type="color" id=${t} .value=${U(e.value)?e.value:`#000000`} @input=${t=>this.change(e,t.target.value)}>
                        <input type="text" class="hex" .value=${e.value} maxlength="7" spellcheck="false" aria-label=${this.labels.designHex.replace(`{token}`,e.label)}
                            @change=${t=>this.typed(e,t.target)}>
                        ${n}
                    </div>
                    ${this.contrastHint(e)}
                </div>`;case`font`:return E`<div class="token">
                    <label for=${t}>${e.label}</label>
                    <div class="row">
                        <select id=${t} style="font-family: ${e.css}" @change=${t=>this.change(e,t.target.value)}>
                            ${e.options.map(t=>E`<option value=${t.value} ?selected=${t.value===e.value} style="font-family: ${t.css}">${this.labels.fontNames?.[t.value]??t.label}</option>`)}
                        </select>
                        ${n}
                    </div>
                </div>`;case`length`:{let r=parseFloat(e.value);return E`<div class="token">
                    <label for=${t}>${e.label}</label>
                    <div class="row">
                        <input type="range" id=${t} min=${e.min??0} max=${e.max??Math.max(100,r*2)} step=${e.step??1} .value=${String(r)}
                            aria-valuetext=${`${r} ${e.unit}`} @input=${t=>this.change(e,`${t.target.value}${e.unit}`)}>
                        <output for=${t}>${r} ${e.unit}</output>
                        ${n}
                    </div>
                </div>`}default:return E`<fieldset class="token">
                    <legend>${e.label}</legend>
                    ${e.options.map(n=>E`<label class="choice"><input type="radio" name=${t} value=${n.value} .checked=${n.value===e.value}
                        @change=${()=>this.change(e,n.value)}><span>${n.label}</span></label>`)}
                    ${n}
                </fieldset>`}}typed(e,t){let n=t.value.trim();n=n.startsWith(`#`)?n:`#${n}`,U(n)?this.change(e,n.toLowerCase()):t.value=e.value}contrastHint(e){let t=e.contrast?.token;if(!t)return k;let n=this.token(t),r=n?n.css:getComputedStyle(document.documentElement).getPropertyValue(`--${t}`),i=nt(e.css,r);return i===null||i>=$e?k:E`<p class="warning">${R(`warning`)}<span>${this.labels.designContrast.replace(`{ratio}`,i.toLocaleString(this.bar.config.language)).replace(`{other}`,n?.label??t)}</span></p>`}},it=o`
    /* The list scrolls, the buttons below stay in view. */
    .panel.design form { flex: 1; min-block-size: 0; }

    .panel.design footer {
        display: grid;
        gap: var(--fb-space-3);
        padding: var(--fb-space-4) var(--fb-space-5);
        border-block-start: var(--fb-size-border) solid var(--fb-border);
    }

    .panel.design footer.actions { display: flex; }

    .panel .token { display: grid; gap: var(--fb-space-1); }

    .panel .token > label { font-weight: var(--fb-weight-semibold); }

    .panel .row { display: flex; align-items: center; gap: var(--fb-space-2); }

    .panel .row select { flex: 1; }

    .panel .row input[type="range"] { flex: 1; accent-color: var(--fb-accent); }

    .panel .row output { min-inline-size: calc(var(--fb-space-12) + var(--fb-space-2)); color: var(--fb-text-muted); font-variant-numeric: tabular-nums; }

    .panel input[type="color"] {
        inline-size: var(--fb-size-control);
        block-size: var(--fb-size-control);
        padding: var(--fb-space-0);
        border: var(--fb-size-border) solid var(--fb-border-strong);
        border-radius: var(--fb-radius-md);
        background: var(--fb-surface);
        cursor: pointer;
    }

    .panel input.hex {
        inline-size: calc(var(--fb-space-16) + var(--fb-space-8));
        min-block-size: var(--fb-size-control);
        padding-inline: var(--fb-space-2);
        border: var(--fb-size-border) solid var(--fb-border-strong);
        border-radius: var(--fb-radius-md);
        background: var(--fb-surface);
        color: inherit;
        font: inherit;
        font-family: var(--fb-font-mono);
    }

    .panel .reset { padding-inline: var(--fb-space-2); border-color: transparent; }

    .panel .warning {
        display: flex;
        gap: var(--fb-space-2);
        margin: 0;
        color: var(--fb-warning-text);
        font-size: var(--fb-text-sm);
        line-height: var(--fb-leading-snug);
    }

    .panel .warning svg { flex: none; margin-block-start: var(--fb-space-0); }
`,W=new Map;function G(e,t){W.set(e,[...W.get(e)??[],t])}function at(e,t){return(W.get(e.dataset.fbType)??[]).flatMap(n=>n(e,t)??[])}function K(e){let t=e.closest(`a[href]`)??e.querySelector(`a[href]`);return t?new URL(t.getAttribute(`href`),location.href):null}function q(e,t=!1){e&&(t||e.origin!==location.origin?window.open(e.href,`_blank`,`noopener`):location.assign(e.href))}function ot(e){return e.hasAttribute(`data-fb-optional`)&&e.dataset.fbValue!==void 0}G(`link`,(e,t)=>{let n=t.labels,r=K(e);return[{icon:`pencil`,label:n.editLink,run:()=>t.editing?.editLink(e)},{icon:`external`,label:n.openLink,title:n.openLinkHint,run:()=>q(r),disabled:!r},...ot(e)?[{icon:`trash`,label:n.removeLink,run:()=>t.editing?.save(e,null),tone:`danger`}]:[]]}),G(`image`,(e,t)=>{let n=t.labels;return[{icon:`image`,label:e.dataset.fbValue===void 0?n.chooseImage:n.imageChosen,run:()=>t.editing?.editImage(e)},...ot(e)?[{icon:`trash`,label:n.removeImage,run:()=>t.editing?.save(e,null),tone:`danger`}]:[]]});var st=(function(){let e=typeof document<`u`&&document.createElement(`link`).relList;return e&&e.supports&&e.supports(`modulepreload`)?`modulepreload`:`preload`})(),ct=function(e){return`/`+e},lt={},ut=function(e){return e.pathname.endsWith(`.css`)},dt=function(e,t,n){if(t in e)return e[t];let r=n();if(!r){e[t]=void 0;return}let i=r.then(()=>{e[t]=void 0},n=>{throw e[t]=void 0,n});return e[t]=i,i},ft=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e,i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}function s(e){return import.meta.resolve?new URL(import.meta.resolve(e)):new URL(e,import.meta.url)}r=o(t.map(t=>{t=ct(t,n);let r=s(t),i=ut(r);return dt(lt,r.href,()=>{if(e===void 0){e={all:new Set,styles:new Set};let t=document.getElementsByTagName(`link`);for(let n=t.length-1;n>=0;n--){let r=t[n];e.all.add(r.href),r.rel===`stylesheet`&&e.styles.add(r.href)}}if((i?e.styles:e.all).has(r.href))return;let t=document.createElement(`link`);if(t.rel=i?`stylesheet`:st,i||(t.as=`script`),t.crossOrigin=``,t.href=r.href,a&&t.setAttribute(`nonce`,a),document.head.appendChild(t),i)return new Promise((e,n)=>{t.addEventListener(`load`,e),t.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${r}`)))})})}).filter(e=>e!==void 0))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},J=[`headline`,`text`],pt=1e3;function mt(e){if(e.dataset.fbValue===void 0)return null;try{return JSON.parse(e.dataset.fbValue)}catch{return null}}function ht(e,t){return JSON.stringify(Y(e))===JSON.stringify(Y(t))}function Y(e){return Array.isArray(e)?e.map(Y):e&&typeof e==`object`?Object.fromEntries(Object.keys(e).sort().map(t=>[t,Y(e[t])])):e??null}function gt(e){let t=e.dataset.fbType===`headline`,n=e.innerText.replace(/ /g,` `).replace(/\n+$/,``);return t&&(n=n.replace(/\s*\n\s*/g,` `)),n===``?null:n}var _t=class{constructor(e){this.bar=e,this.saved=new WeakMap,this.timers=new Map,this.queues=new WeakMap,this.editors=new WeakMap,this.loading=null,this.pointer=null,this.onFocus=e=>this.focus(e),this.onBlur=e=>this.blur(e),this.onInput=e=>this.input(e),this.onKey=e=>this.key(e),this.onClick=e=>this.click(e),this.onPointer=e=>{this.pointer={left:e.clientX,top:e.clientY,at:Date.now()}},this.onLeave=e=>this.leave(e)}start(){for(let e of document.querySelectorAll(`[data-fb-field]`))J.includes(e.dataset.fbType)&&(e.contentEditable=`plaintext-only`);document.addEventListener(`focusin`,this.onFocus,!0),document.addEventListener(`focusout`,this.onBlur,!0),document.addEventListener(`input`,this.onInput,!0),document.addEventListener(`keydown`,this.onKey,!0),document.addEventListener(`click`,this.onClick,!0),document.addEventListener(`pointerdown`,this.onPointer,!0),addEventListener(`beforeunload`,this.onLeave)}stop(){document.removeEventListener(`focusin`,this.onFocus,!0),document.removeEventListener(`focusout`,this.onBlur,!0),document.removeEventListener(`input`,this.onInput,!0),document.removeEventListener(`keydown`,this.onKey,!0),document.removeEventListener(`click`,this.onClick,!0),document.removeEventListener(`pointerdown`,this.onPointer,!0),removeEventListener(`beforeunload`,this.onLeave)}field(e){return e instanceof Element?e.closest(`[data-fb-field]`):null}savedValue(e){return this.saved.has(e)?this.saved.get(e):mt(e)}focus(e){let t=this.field(e.target);t?.dataset.fbType===`richtext`&&!this.editors.has(t)&&this.richText(t)}blur(e){let t=this.field(e.target);t&&J.includes(t.dataset.fbType)&&this.flush(t)}input(e){let t=this.field(e.target);t&&J.includes(t.dataset.fbType)&&(gt(t)===null&&t.childNodes.length>0&&t.replaceChildren(),this.later(t,()=>gt(t)))}key(e){let t=this.field(e.target);if(!t)return;let n=t.dataset.fbType;if(J.includes(n))e.key===`Escape`?(e.preventDefault(),this.cancel(t),t.innerText=this.savedValue(t)??``,t.blur()):e.key===`Enter`&&n===`headline`&&(e.preventDefault(),t.blur());else if(n===`link`&&(e.key===`Enter`||e.key===` `))e.preventDefault(),this.editLink(t);else if(n===`image`&&(e.key===`Enter`||e.key===` `))e.preventDefault(),this.editImage(t);else if(n===`richtext`&&e.key===`F10`&&e.altKey)e.preventDefault(),this.bar.focusToolbar();else if(n===`richtext`&&e.key===`Escape`){let n=this.editors.get(t);n&&(e.preventDefault(),this.cancel(t),n.commands.setContent(this.savedValue(t)??{type:`doc`,content:[]},{emitUpdate:!1}),n.commands.blur(),t.blur())}}click(e){let t=this.field(e.target),n=e.target instanceof Element?e.target.closest(`a`):null;n&&(t||n.querySelector(`[data-fb-field]`))&&e.preventDefault(),t?.dataset.fbType===`link`&&(e.ctrlKey||e.metaKey)?(e.preventDefault(),q(K(t),!0)):t?.dataset.fbType===`link`?(e.preventDefault(),this.editLink(t)):t?.dataset.fbType===`image`&&(e.preventDefault(),this.editImage(t))}leave(e){let t=this.timers.size>0;this.flushAll(),(t||this.bar.saving>0)&&e.preventDefault()}flushAll(){let e=[...this.timers.keys()].map(e=>this.flush(e));return Promise.all(e)}later(e,t){clearTimeout(this.timers.get(e)?.timer),this.timers.set(e,{read:t,timer:setTimeout(()=>this.flush(e),pt)})}flush(e){let t=this.timers.get(e);return t?(clearTimeout(t.timer),this.timers.delete(e),this.save(e,t.read())):Promise.resolve(!0)}cancel(e){clearTimeout(this.timers.get(e)?.timer),this.timers.delete(e)}save(e,t){let n=(this.queues.get(e)??Promise.resolve()).then(()=>this.send(e,t));return this.queues.set(e,n.catch(()=>{})),n}async send(e,t){let n=this.savedValue(e);if(ht(n,t))return!0;let r=e.dataset.fbSite!==void 0,i=r?await this.bar.run(`site.update-field`,{language:this.bar.config.language,path:e.dataset.fbField,value:t,previous:n}):await this.bar.run(`page.update-field`,{id:this.bar.config.page.id,language:this.bar.config.language,path:e.dataset.fbField,block:e.closest(`[data-fb-block]`)?.dataset.fbBlock??null,value:t,previous:n});if(!i.ok)return!1;let a=i.data;return this.saved.set(e,a.value),a.value===null?delete e.dataset.fbValue:e.dataset.fbValue=JSON.stringify(a.value),(e.dataset.fbType===`link`||e.dataset.fbType===`image`)&&(e.innerHTML=a.html),this.bar.changed(a.entry,r),a.value!==null&&this.bar.solved(e),!0}editLink(e){let t=this.savedValue(e)??{};this.bar.openLink({withText:!0,text:t.text??``,href:t.target??t.url??``,newWindow:t.newWindow===!0,apply:({text:t,href:n,newWindow:r})=>{let i=n.startsWith(`page:`)?{target:n}:{url:n};t&&(i.text=t),r&&(i.newWindow=!0),this.save(e,i)},remove:()=>this.save(e,null),done:()=>e.focus(),openUrl:K(e)})}editImage(e){this.bar.media.open({value:this.savedValue(e),apply:t=>this.save(e,t),remove:()=>this.save(e,null),done:()=>e.focus()})}async richText(e){this.loading??=ft(()=>import(`./chunks/edit-richtext-CdZAclu1.js`),[]);let{createEditor:t,valueOf:n}=await this.loading;if(this.editors.has(e))return;let r=this.pointer&&Date.now()-this.pointer.at<2e3?this.pointer:null,i=t(e,this.savedValue(e),{update:()=>this.later(e,()=>n(i)),selection:()=>this.bar.showToolbar(i),blur:t=>{t.relatedTarget!==this.bar&&(this.flush(e),this.bar.hideToolbar(i))}});this.editors.set(e,i);let a=r?i.view.posAtCoords(r):null;e.blur(),i.commands.focus(a?a.pos:`end`,{scrollIntoView:!1})}},vt=`image/jpeg,image/png,image/webp,image/gif`,yt=24,bt=300,xt=class{constructor(e){this.bar=e,this.state=null,this.timer=null}get labels(){return this.bar.labels}open({value:e,apply:t,remove:n,done:r}){this.state={value:e,apply:t,remove:n,done:r,chosen:e?.media??null,alt:e?.alt??``,query:``,items:[],total:0,page:0,loading:!0,uploading:null,question:null,replaced:!1,problems:[],notices:[]},this.load(1),this.bar.requestUpdate(),this.bar.updateComplete.then(()=>{this.bar.renderRoot.querySelector(`dialog.media`)?.showModal(),this.bar.renderRoot.querySelector(`dialog.media input[type="search"]`)?.focus()})}update(e){this.state={...this.state,...e},this.bar.requestUpdate()}async load(e){let t=this.state,n=new URLSearchParams({page:String(e),perPage:String(yt)});t.query.trim()!==``&&n.set(`search`,t.query.trim()),this.update({loading:!0});let r=null;try{let e=await fetch(this.bar.config.queries+`media.list?`+n,{headers:{Accept:`application/json`},credentials:`same-origin`});r=e.ok?await e.json():null}catch{r=null}if(this.state!==null&&this.state.query===t.query){let t=r?.data?.items??[];this.update({loading:!1,page:e,total:r?.data?.total??0,items:e===1?t:[...this.state.items,...t],problems:r?[]:[this.labels.failed]})}}search(e){this.update({query:e}),clearTimeout(this.timer),this.timer=setTimeout(()=>this.load(1),bt)}async upload(e){let t=[],n=[],r=this.state.value?.media??null;for(let[i,a]of e.entries()){this.update({uploading:this.labels.uploading.replace(`{done}`,String(i+1)).replace(`{total}`,String(e.length))});let o=new FormData;o.append(`file`,a,a.name);let s=await this.bar.send(this.bar.config.uploads,o),c=s?await s.json().catch(()=>null):null;if(!s?.ok){t.push(`${a.name}: ${c?.errors?.[0]?.message??c?.detail??this.labels.failed}`);continue}let l=e.length===1&&r&&this.bar.config.mayReplace?await this.elsewhere(r):0;if(l>0&&this.state){this.update({uploading:null,problems:t,notices:n,question:{upload:c.data.upload,name:a.name,media:r,places:l+1}});return}await this.create(c.data.upload,a.name,t,n)}this.state&&this.update({uploading:null,problems:t,notices:n})}async elsewhere(e){let t=null;try{let n=await fetch(this.bar.config.queries+`media.usages?`+new URLSearchParams({id:e}),{headers:{Accept:`application/json`},credentials:`same-origin`});t=n.ok?await n.json():null}catch{t=null}let n=this.bar.config.page?.id??null,r=this.bar.config.language;return(t?.data??[]).filter(e=>e.type!==`page`||e.id!==n||e.language!==r).length}async create(e,t,n,r){let i=await this.bar.run(`media.create`,{upload:e});if(i.ok&&this.state){let e=this.state.items.filter(e=>e.id!==i.data.id);this.update({items:[i.data,...e],total:this.state.total+ +!i.data.existing,chosen:i.data.id}),i.data.existing&&r.push(this.labels.alreadyInLibrary.replace(`{name}`,i.data.fileName))}else i.ok||n.push(`${t}: ${this.bar.message?.text??this.labels.failed}`)}async answer(e){let t=this.state?.question;if(!t)return;let n=[],r=[];if(this.update({question:null,uploading:this.labels.uploading.replace(`{done}`,`1`).replace(`{total}`,`1`)}),!e)await this.create(t.upload,t.name,n,r);else{let e=await this.bar.run(`media.replace`,{id:t.media,upload:t.upload});if(e.ok&&this.state){let t=this.state.items.filter(t=>t.id!==e.data.id);this.update({items:[e.data,...t],chosen:e.data.id,replaced:!0}),r.push(e.data.draft?this.labels.replacedInDraft:this.labels.replacedEverywhere)}else e.ok||n.push(`${t.name}: ${this.bar.message?.text??this.labels.failed}`)}this.state&&this.update({uploading:null,problems:n,notices:r})}choose(){let e=document.createElement(`input`);e.type=`file`,e.multiple=!0,e.accept=vt,e.addEventListener(`change`,()=>this.upload([...e.files??[]])),e.click()}apply(){let e=this.state;if(!e?.chosen)return;let t={media:e.chosen};e.alt.trim()!==``&&(t.alt=e.alt.trim()),this.close(()=>e.apply(t))}close(e=null){let t=this.state;clearTimeout(this.timer),this.bar.renderRoot.querySelector(`dialog.media`)?.close(),this.state=null,this.bar.requestUpdate();let n=e?.();t?.done?.(),t?.replaced&&Promise.resolve(n).finally(()=>location.reload())}dialog(){let e=this.state;if(!e)return k;let t=this.labels,n=e.items.length<e.total,r;return r=e.items.length===0?E`<p class="hint">${e.loading?t.loading:e.query.trim()===``?t.noMedia:t.noMediaFound}</p>`:E`<ul class="media-grid" aria-label=${t.mediaLibrary}>
                ${e.items.map(t=>E`<li><button type="button" aria-pressed=${String(t.id===e.chosen)}
                    @click=${()=>this.update({chosen:t.id})} @dblclick=${()=>{this.update({chosen:t.id}),this.apply()}}>
                    <img src=${t.preview} alt="" width=${t.width} height=${t.height} loading="lazy" decoding="async">
                    <span>${t.fileName}</span></button></li>`)}
            </ul>
            ${n?E`<button type="button" ?disabled=${e.loading} @click=${()=>this.load(e.page+1)}>${t.loadMore}</button>`:k}`,E`<dialog class="media" aria-labelledby="fb-media-title" @cancel=${e=>{e.preventDefault(),this.close()}}>
            <form @submit=${e=>{e.preventDefault(),this.apply()}}>
                <h2 id="fb-media-title">${t.chooseImage}</h2>
                <div class="media-tools">
                    <label>${t.search}
                        <input type="search" .value=${e.query} autocomplete="off" @input=${e=>this.search(e.target.value)}></label>
                    ${this.bar.config.mayUpload?E`<button type="button" ?disabled=${e.uploading!==null||e.question!==null} @click=${()=>this.choose()}>${t.upload}</button>`:k}
                </div>
                <p class="hint" role="status">${e.uploading??``}</p>
                ${e.question?E`<div class="question" role="group" aria-labelledby="fb-media-question">
                    <p id="fb-media-question">${t.replaceWhere.replace(`{name}`,e.question.name)}</p>
                    <div class="actions">
                        <button type="button" @click=${()=>this.answer(!1)}>${t.replaceHere}</button>
                        <button type="button" class="primary" @click=${()=>this.answer(!0)}>${t.replaceEverywhere.replace(`{count}`,String(e.question.places))}</button>
                    </div>
                </div>`:k}
                ${e.problems.length>0?E`<ul class="problems" role="alert">${e.problems.map(e=>E`<li>${e}</li>`)}</ul>`:k}
                ${e.notices.length>0?E`<ul class="notices" role="status">${e.notices.map(e=>E`<li>${e}</li>`)}</ul>`:k}
                ${r}
                <label>${t.altHere}
                    <input type="text" .value=${e.alt} maxlength="500" aria-describedby="fb-media-alt-hint"
                        @input=${e=>this.update({alt:e.target.value})}></label>
                <p class="hint" id="fb-media-alt-hint">${t.altHereHint}</p>
                <div class="actions">
                    ${e.value?E`<button type="button" class="danger" @click=${()=>this.close(e.remove)}>${t.removeImage}</button>`:k}
                    <button type="button" @click=${()=>this.close()}>${t.cancel}</button>
                    <button type="submit" class="primary" ?disabled=${!e.chosen||e.question!==null}>${t.apply}</button>
                </div>
            </form>
        </dialog>`}},St=o`
    dialog.media { inline-size: min(100% - var(--fb-space-8), var(--fb-size-content)); }

    dialog input[type="search"] {
        min-block-size: var(--fb-size-control);
        padding-inline: var(--fb-space-3);
        border: var(--fb-size-border) solid var(--fb-border-strong);
        border-radius: var(--fb-radius-md);
        background: var(--fb-surface);
        color: inherit;
        font: inherit;
        font-weight: var(--fb-weight-regular);
    }

    .media-tools { display: flex; flex-wrap: wrap; gap: var(--fb-space-3); align-items: end; }

    .media-tools label { flex: 1 1 calc(var(--fb-space-16) * 3); }

    .media-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(calc(var(--fb-space-16) * 2), 1fr));
        gap: var(--fb-space-3);
        max-block-size: calc(var(--fb-space-16) * 6);
        margin: 0;
        padding: var(--fb-space-1);
        overflow-y: auto;
        list-style: none;
    }

    .media-grid button {
        display: grid;
        gap: var(--fb-space-1);
        inline-size: 100%;
        padding: var(--fb-space-1);
        border-color: transparent;
        font-weight: var(--fb-weight-regular);
        text-align: start;
    }

    .media-grid img {
        inline-size: 100%;
        block-size: auto;
        aspect-ratio: 1;
        object-fit: cover;
        border-radius: var(--fb-radius-sm);
        background: var(--fb-surface-2);
    }

    .media-grid span {
        overflow: hidden;
        font-size: var(--fb-text-xs);
        color: var(--fb-text-muted);
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .media-grid button[aria-pressed="true"] {
        border-color: var(--fb-accent);
        background: var(--fb-accent-soft);
        box-shadow: inset 0 0 0 var(--fb-size-focus) var(--fb-accent);
    }

    .problems { margin: 0; padding-inline-start: var(--fb-space-4); color: var(--fb-danger-text); }

    .notices { margin: 0; padding-inline-start: var(--fb-space-4); color: var(--fb-text-muted); }

    .question {
        display: grid;
        gap: var(--fb-space-3);
        padding: var(--fb-space-3);
        border: var(--fb-size-border) solid var(--fb-border);
        border-radius: var(--fb-radius-md);
        background: var(--fb-surface-2);
    }

    .question p { margin: 0; }
`,Ct=`[data-fb-block]`;function wt(e){return e.parentElement?.closest(Ct)??null}function Tt(e){return e.split(`/`).filter(e=>e!==``).map(e=>e.replaceAll(`~1`,`/`).replaceAll(`~0`,`~`))}function Et(e,t,n){let r=`[data-fb-field="${CSS.escape(t)}"]`;return[...(e??document).querySelectorAll(r)].find(t=>t.hasAttribute(`data-fb-site`)===n&&(n||wt(t)===e))??null}function Dt(e){let t=Tt(e),n=null;for(;t[0]===`areas`&&t.length>=3;){let[,e,r]=t;if(n=[...document.querySelectorAll(`${Ct}[data-fb-area="${CSS.escape(e)}"]`)].filter(e=>wt(e)===n)[Number(r)]??null,!n)return{element:null,block:null,path:t.join(`/`)};t=t.slice(3)}if(t[0]!==`fields`||t.length<2)return{element:n,block:n,path:``};let r=t.slice(1).join(`/`);return{element:Et(n,r,!1),block:n,path:r}}function Ot(e,t,n){return e.map(({pointer:e=``,message:r=``})=>{let i=e.match(/^\/ids\/(\d+)\/translations\/([^/]+)\/content(\/.*)?$/);if(i&&t&&t.publish[Number(i[1])]===t.id&&i[2]===n)return{...Dt(i[3]??``),message:r};let a=e.match(/^\/languages\/([^/]+)\/(.+)$/);if(a&&a[1]===n){let e=Tt(a[2]).join(`/`);return{element:Et(null,e,!0),block:null,path:e,message:r}}return{element:null,block:null,path:``,message:r}})}var kt=`fb-editor-bar-collapsed`,At=`fb-theme`,jt=`fb-edit-undo:`,Mt=`[data-fb-field], [data-fb-block], fb-area[data-fb-area]`;function Nt(e){try{return localStorage.getItem(e)}catch{return null}}function Pt(e,t){try{t===null?localStorage.removeItem(e):localStorage.setItem(e,t)}catch{}}function X(e){return e.dataset.fbLabel??e.dataset.fbTitle??e.dataset.fbArea??``}function Ft(e,t,n=[],r=[]){for(let i of e){let e=i.slugs?.[t]??Object.values(i.slugs??{})[0]??``,a=e?[...n,e]:n,o=i.titles?.[t]??Object.values(i.titles??{})[0]??i.id;r.push({id:i.id,title:o,path:`/`+a.join(`/`)}),Ft(i.children??[],t,a,r)}return r}function Z(e){return/^([a-z][a-z0-9+.-]*:|\/|#|\?)/i.test(e)||Q(e)}function It(e){try{return new URL(Q(e)&&!/^[a-z][a-z0-9+.-]*:/i.test(e)?`https://${e}`:e,location.href)}catch{return null}}function Q(e){return/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(e)}function Lt(e){try{return JSON.parse(sessionStorage.getItem(e)??`[]`)}catch{return[]}}function $(e,t){try{t.length===0?sessionStorage.removeItem(e):sessionStorage.setItem(e,JSON.stringify(t))}catch{}}function Rt(e){return e.hasAttribute(`data-fb-field`)?`field`:e.hasAttribute(`data-fb-block`)?`block`:e.hasAttribute(`data-fb-entry`)?`entry`:`area`}var zt=class extends I{static fieldTools(e,t){G(e,t)}static properties={config:{attribute:!1},collapsed:{state:!0},busy:{state:!0},message:{state:!0},confirming:{state:!0},showAll:{state:!0},current:{state:!0},undo:{state:!0},link:{state:!0},toolbar:{state:!0},menu:{state:!0},flash:{state:!0},details:{state:!0},problems:{state:!0}};static styles=[o`
        :host {
            all: initial;
            position: fixed;
            inset: 0;
            z-index: var(--fb-layer-edit);
            pointer-events: none;
            font-family: var(--fb-font-family);
            font-size: var(--fb-text-sm);
            line-height: var(--fb-leading-tight);
            color: var(--fb-text);
        }

        *, *::before, *::after { box-sizing: border-box; }

        .bar, .round {
            position: absolute;
            inset-block-end: var(--fb-space-4);
            inset-inline-start: 50%;
            translate: -50% 0;
            pointer-events: auto;
            background: var(--fb-surface);
            border: var(--fb-size-border) solid var(--fb-border);
            box-shadow: var(--fb-shadow-lg);
        }

        .bar {
            --pad: var(--fb-space-2);
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: center;
            gap: var(--fb-space-2);
            inline-size: max-content;
            max-inline-size: calc(100vw - 2 * var(--fb-space-4));
            padding: var(--pad);
            border-radius: var(--fb-radius-lg);
        }

        .round {
            display: grid;
            place-items: center;
            inline-size: var(--fb-size-control);
            block-size: var(--fb-size-control);
            padding: 0;
            border-radius: var(--fb-radius-full);
            color: var(--fb-accent-text);
            cursor: pointer;
        }

        button, a {
            display: inline-flex;
            align-items: center;
            gap: var(--fb-space-2);
            min-block-size: var(--fb-size-control-sm);
            padding-inline: var(--fb-space-3);
            border: var(--fb-size-border) solid transparent;
            border-radius: var(--fb-radius-md);
            background: transparent;
            color: inherit;
            font: inherit;
            font-weight: var(--fb-weight-semibold);
            text-decoration: none;
            cursor: pointer;
            transition: background-color var(--fb-motion-fast);
        }

        button:hover, a:hover { background: var(--fb-surface-2); }

        button:focus-visible, a:focus-visible, .round:focus-visible {
            outline: var(--fb-size-focus) solid var(--fb-focus);
            outline-offset: var(--fb-size-focus-offset);
        }

        button[disabled] { cursor: progress; opacity: 0.6; }

        .primary { background: var(--fb-accent); color: var(--fb-on-accent); }
        .primary:hover { background: var(--fb-accent-hover); }

        .danger { color: var(--fb-danger-text); }
        .danger:hover { background: var(--fb-danger-bg); }
        .danger.solid { background: var(--fb-danger); color: var(--fb-on-danger); }

        [aria-pressed="true"] { background: var(--fb-accent-soft); color: var(--fb-accent-text); }

        .icon {
            inline-size: var(--fb-size-icon-sm);
            block-size: var(--fb-size-icon-sm);
            flex: none;
        }

        .switch-track {
            position: relative;
            inline-size: calc(2 * var(--fb-size-check));
            block-size: var(--fb-size-check);
            border-radius: var(--fb-radius-full);
            background: var(--fb-border-strong);
            transition: background-color var(--fb-motion-fast);
        }

        .switch-track::after {
            content: "";
            position: absolute;
            inset-block-start: var(--fb-space-0);
            inset-inline-start: var(--fb-space-0);
            inline-size: calc(var(--fb-size-check) - 2 * var(--fb-space-0));
            block-size: calc(var(--fb-size-check) - 2 * var(--fb-space-0));
            border-radius: var(--fb-radius-full);
            background: var(--fb-surface);
            transition: translate var(--fb-motion-fast);
        }

        [role="switch"][aria-checked="true"] .switch-track { background: var(--fb-accent); }
        [role="switch"][aria-checked="true"] .switch-track::after { translate: var(--fb-size-check) 0; }

        .note { padding-inline: var(--fb-space-2); color: var(--fb-text-muted); }

        /*
         * The status docks at the end of the bar (decision 0140). All its
         * texts lie on top of each other in one grid cell and only the
         * current one is visible, so its width is that of the longest text
         * in every language and the bar never jumps.
         */
        .state-wrap {
            position: relative;
            display: flex;
            align-self: stretch;
            margin-block: calc(-1 * var(--pad));
            margin-inline-end: calc(-1 * var(--pad));
        }

        .state {
            display: flex;
            align-items: center;
            gap: var(--fb-space-2);
            padding-inline: var(--fb-space-4);
            border: 0;
            border-inline-start: var(--fb-size-border) solid var(--fb-border);
            border-radius: 0;
            border-start-end-radius: var(--fb-radius-lg);
            border-end-end-radius: var(--fb-radius-lg);
            font-weight: var(--fb-weight-semibold);
            cursor: default;
            transition: background-color var(--fb-motion-fast), color var(--fb-motion-fast);
        }

        button.state { cursor: pointer; }

        .state[data-tone="success"] { background: var(--fb-success-bg); color: var(--fb-success-text); }
        .state[data-tone="warning"] { background: var(--fb-warning-bg); color: var(--fb-warning-text); }
        .state[data-tone="danger"], .state[data-tone="danger"]:hover { background: var(--fb-danger-bg); color: var(--fb-danger-text); }

        .state-labels { display: grid; }

        .state-labels > span {
            grid-area: 1 / 1;
            display: flex;
            align-items: center;
            gap: var(--fb-space-2);
            white-space: nowrap;
            visibility: hidden;
        }

        .state-labels > .current { visibility: visible; }

        /* Dot, check and warning take the same room, so the check does not widen the bar. */
        .state-mark {
            display: grid;
            place-items: center;
            inline-size: var(--fb-size-icon-sm);
            block-size: var(--fb-size-icon-sm);
            flex: none;
        }

        .state-dot {
            inline-size: var(--fb-size-dot);
            block-size: var(--fb-size-dot);
            flex: none;
            border-radius: var(--fb-radius-full);
            background: currentcolor;
        }

        .state-dot.ring { background: transparent; box-shadow: inset 0 0 0 var(--fb-size-focus) currentcolor; }

        /* Saving is no state of its own, the mark pulses (decision 0141). */
        .state-dot.pulse { animation: fb-pulse calc(5 * var(--fb-motion-normal)) ease-in-out infinite; }

        @keyframes fb-pulse {
            50% { opacity: 0.25; }
        }

        .details {
            position: absolute;
            inset-block-end: calc(100% + var(--fb-space-2));
            inset-inline-end: 0;
            display: grid;
            gap: var(--fb-space-2);
            inline-size: max-content;
            max-inline-size: min(calc(100vw - 2 * var(--fb-space-4)), var(--fb-size-narrow));
            padding: var(--fb-space-3);
            background: var(--fb-surface);
            border: var(--fb-size-border) solid var(--fb-border);
            border-radius: var(--fb-radius-lg);
            box-shadow: var(--fb-shadow-lg);
            color: var(--fb-text);
            font-weight: var(--fb-weight-regular);
        }

        .details[data-tone="danger"] { color: var(--fb-danger-text); }
        .details p, .details ul { margin: 0; }
        .details ul { padding-inline-start: var(--fb-space-4); }
        .details button { justify-self: start; color: var(--fb-text); }

        [aria-disabled="true"] { cursor: default; opacity: 0.5; }
        [aria-disabled="true"]:hover { background: transparent; }
        .primary[aria-disabled="true"], .primary[aria-disabled="true"]:hover { background: var(--fb-surface-2); color: var(--fb-text-muted); opacity: 1; }

        .outline {
            position: absolute;
            border: var(--fb-size-focus) solid var(--fb-accent);
            border-radius: var(--fb-radius-sm);
        }

        .outline[data-kind="block"], .outline[data-kind="area"], .outline[data-kind="entry"] { border-style: dashed; }
        .outline[data-kind="entry"] .label { display: none; }
        .outline[data-kind="area"] { background: var(--fb-accent-soft); opacity: 0.8; }
        .outline[data-kind="problem"] { border-color: var(--fb-danger); }
        .outline[data-kind="problem"] .label { background: var(--fb-danger); color: var(--fb-on-danger); }

        .label {
            position: absolute;
            inset-block-end: 100%;
            inset-inline-start: calc(-1 * var(--fb-size-focus));
            padding: var(--fb-space-0) var(--fb-space-2);
            border-radius: var(--fb-radius-sm) var(--fb-radius-sm) 0 0;
            background: var(--fb-accent);
            color: var(--fb-on-accent);
            font-size: var(--fb-text-2xs);
            font-weight: var(--fb-weight-semibold);
            white-space: nowrap;
        }

        /* The tab of the field under the pointer or with the focus carries its buttons (decision 0150). */
        .label.tools {
            display: flex;
            align-items: center;
            padding: 0;
            pointer-events: auto;
        }

        .label.tools > span { padding-inline: var(--fb-space-2); }

        .label.tools button {
            display: grid;
            place-items: center;
            min-inline-size: var(--fb-space-6);
            min-block-size: var(--fb-space-6);
            padding: 0;
            border: 0;
            border-inline-start: var(--fb-size-border) solid var(--fb-accent-hover);
            border-radius: 0;
            background: transparent;
            color: inherit;
            cursor: pointer;
        }

        .label.tools button:last-child { border-start-end-radius: var(--fb-radius-sm); }
        .label.tools button:hover { background: var(--fb-accent-hover); }
        .label.tools button:focus-visible { outline-offset: calc(-1 * var(--fb-size-focus)); outline-color: var(--fb-on-accent); }
        .label.tools button[disabled] { cursor: default; opacity: 0.5; }
        .label.tools .icon { inline-size: var(--fb-size-icon-sm); block-size: var(--fb-size-icon-sm); }
        .outline.below .label.tools button:last-child { border-start-end-radius: 0; border-end-end-radius: var(--fb-radius-sm); }

        .outline.below .label {
            inset-block: 100% auto;
            border-radius: 0 0 var(--fb-radius-sm) var(--fb-radius-sm);
        }

        .visually-hidden {
            position: absolute;
            inline-size: 1px;
            block-size: 1px;
            overflow: hidden;
            clip-path: inset(50%);
            white-space: nowrap;
        }


        .more { position: relative; display: flex; }

        .more > button { padding-inline: var(--fb-space-2); }

        .menu {
            position: absolute;
            inset-block-end: calc(100% + 2 * var(--fb-space-2));
            inset-inline-end: calc(-1 * var(--fb-space-2));
            display: grid;
            gap: var(--fb-space-0);
            min-inline-size: calc(var(--fb-size-narrow) / 2);
            padding: var(--fb-space-1);
            background: var(--fb-surface);
            border: var(--fb-size-border) solid var(--fb-border);
            border-radius: var(--fb-radius-lg);
            box-shadow: var(--fb-shadow-lg);
        }

        .menu [role="group"] { display: grid; gap: var(--fb-space-0); }

        .menu [role="group"] + [role="group"] {
            margin-block-start: var(--fb-space-1);
            padding-block-start: var(--fb-space-1);
            border-block-start: var(--fb-size-border) solid var(--fb-border);
        }

        .menu-heading {
            padding: var(--fb-space-1) var(--fb-space-3);
            color: var(--fb-text-muted);
            font-size: var(--fb-text-xs);
            font-weight: var(--fb-weight-semibold);
        }

        .menu [role^="menuitem"] {
            justify-content: flex-start;
            inline-size: 100%;
            font-weight: var(--fb-weight-regular);
            white-space: nowrap;
        }

        .menu [role="menuitemcheckbox"][aria-checked="true"] { background: var(--fb-accent-soft); color: var(--fb-accent-text); }

        .toolbar {
            position: absolute;
            display: flex;
            gap: var(--fb-space-1);
            padding: var(--fb-space-1);
            pointer-events: auto;
            background: var(--fb-surface);
            border: var(--fb-size-border) solid var(--fb-border);
            border-radius: var(--fb-radius-md);
            box-shadow: var(--fb-shadow-sm);
            translate: 0 calc(-100% - var(--fb-space-2));
        }

        .toolbar.below { translate: 0 var(--fb-space-2); }

        .toolbar button {
            justify-content: center;
            min-inline-size: var(--fb-size-control-sm);
            padding-inline: var(--fb-space-1);
        }

        dialog {
            pointer-events: auto;
            inline-size: min(calc(100vw - 2 * var(--fb-space-4)), var(--fb-size-dialog));
            padding: var(--fb-space-5);
            border: var(--fb-size-border) solid var(--fb-border);
            border-radius: var(--fb-radius-lg);
            background: var(--fb-surface);
            color: var(--fb-text);
            box-shadow: var(--fb-shadow-lg);
            font: inherit;
        }

        dialog::backdrop { background: var(--fb-backdrop); }

        dialog form { display: grid; gap: var(--fb-space-3); }

        dialog h2 {
            margin: 0;
            font-size: var(--fb-text-lg);
            font-weight: var(--fb-weight-bold);
        }

        dialog label { display: grid; gap: var(--fb-space-1); font-weight: var(--fb-weight-semibold); }

        dialog input:not([type]), dialog input[type="text"] {
            min-block-size: var(--fb-size-control);
            padding-inline: var(--fb-space-3);
            border: var(--fb-size-border) solid var(--fb-border-strong);
            border-radius: var(--fb-radius-md);
            background: var(--fb-surface);
            color: inherit;
            font: inherit;
            font-weight: var(--fb-weight-regular);
        }

        dialog input:focus-visible {
            outline: var(--fb-size-focus) solid var(--fb-focus);
            outline-offset: var(--fb-size-focus-offset);
        }

        dialog .check { display: flex; align-items: center; gap: var(--fb-space-2); font-weight: var(--fb-weight-regular); }

        .hint { margin: 0; color: var(--fb-text-muted); font-size: var(--fb-text-xs); }

        .results {
            display: grid;
            gap: var(--fb-space-0);
            max-block-size: calc(6 * var(--fb-size-control));
            margin: 0;
            padding: 0;
            overflow-y: auto;
            list-style: none;
        }

        .results button {
            inline-size: 100%;
            justify-content: space-between;
            font-weight: var(--fb-weight-regular);
            text-align: start;
        }

        .results small, .chosen small { color: var(--fb-text-muted); }

        .chosen {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--fb-space-2);
            min-block-size: var(--fb-size-control);
            padding-inline: var(--fb-space-3);
            border-radius: var(--fb-radius-md);
            background: var(--fb-accent-soft);
        }

        .actions { display: flex; flex-wrap: wrap; gap: var(--fb-space-2); justify-content: flex-end; }
        .actions .open { margin-inline-end: auto; }

        /*
         * On a phone the bar stays one line: the status is a dot like in
         * the sitemap, the switch and "Undo" are icons (their text stays
         * for screen readers and in the tooltip), and only "Publish" may
         * shorten its text if the screen is very narrow.
         */
        @media (max-width: 30rem) {
            .bar { --pad: var(--fb-space-1); flex-wrap: nowrap; gap: var(--fb-space-1); }
            .bar > * { flex-shrink: 0; }
            .bar > button { padding-inline: var(--fb-space-2); }
            .state { padding-inline: var(--fb-space-1); }

            .bar > .primary {
                display: block;
                flex-shrink: 1;
                min-inline-size: 0;
                overflow: hidden;
                line-height: var(--fb-size-control-sm);
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .state-text, .button-text {
                position: absolute;
                inline-size: 1px;
                block-size: 1px;
                overflow: hidden;
                clip-path: inset(50%);
                white-space: nowrap;
            }
        }

        @media (prefers-reduced-motion: reduce) {
            * { transition: none !important; animation: none !important; }
        }
    `,Xe,St,it];constructor(){super(),this.config=null,this.collapsed=Nt(kt)===`1`,this.busy=!1,this.message=null,this.confirming=!1,this.showAll=!1,this.current=null,this.undo=[],this.link=null,this.toolbar=null,this.menu=!1,this.flash=!1,this.flashTimer=0,this.details=!1,this.problems=[],this.problemsText=``,this.onOutside=e=>{let t=e.composedPath();this.menu&&!t.includes(this.renderRoot.querySelector(`.more`))&&(this.menu=!1),this.details&&!t.includes(this.renderRoot.querySelector(`.state-wrap`))&&(this.details=!1)},this.saving=0,this.pages=null,this.editing=null,this.arranging=null,this.media=new xt(this),this.design=new rt(this),this.frame=0,this.redraw=()=>{this.frame===0&&(this.current||this.showAll||this.toolbar||this.arranging?.block||this.problems.length>0)&&(this.frame=requestAnimationFrame(()=>{this.frame=0,this.requestUpdate()}))},this.onPoint=e=>this.point(e.target),this.onLeave=e=>{e.relatedTarget||(this.current=null)},this.onFocus=e=>this.point(e.target)}createRenderRoot(){let e=super.createRenderRoot(),t=new CSSStyleSheet;return t.replaceSync(this.config?.tokens??``),e.adoptedStyleSheets=[t,...e.adoptedStyleSheets],e}connectedCallback(){super.connectedCallback(),document.addEventListener(`pointerdown`,this.onOutside,!0);let e=Nt(At);(e===`light`||e===`dark`)&&(this.dataset.theme=e),this.marking&&(this.undo=Lt(this.undoKey),this.editing=new _t(this),this.editing.start(),this.arranging=new Ze(this),this.arranging.start(),document.addEventListener(`pointerover`,this.onPoint,!0),document.addEventListener(`pointerout`,this.onLeave,!0),document.addEventListener(`focusin`,this.onFocus,!0),addEventListener(`scroll`,this.redraw,{passive:!0,capture:!0}),addEventListener(`resize`,this.redraw,{passive:!0})),location.hash===`#fb-design`&&this.config?.design&&this.config.editing&&(history.replaceState(null,``,location.pathname+location.search),this.updateComplete.then(()=>this.design.show()))}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener(`pointerdown`,this.onOutside,!0),this.editing?.stop(),this.arranging?.stop(),document.removeEventListener(`pointerover`,this.onPoint,!0),document.removeEventListener(`pointerout`,this.onLeave,!0),document.removeEventListener(`focusin`,this.onFocus,!0),removeEventListener(`scroll`,this.redraw,{capture:!0}),removeEventListener(`resize`,this.redraw)}updated(){let e=this.renderRoot.querySelector(`.bar, .round`),t=e?`${Math.ceil(e.getBoundingClientRect().height)}px`:`0px`;this.style.getPropertyValue(`--bar-block-size`)!==t&&(this.style.setProperty(`--bar-block-size`,t),document.body.style.paddingBlockEnd=e?`calc(${t} + 2rem)`:``)}get marking(){return!!(this.config?.editing&&this.config?.marking)}get undoKey(){return jt+(this.config?.page?.id??``)}get labels(){return this.config?.labels??{}}render(){if(!this.config)return k;let e=this.arranging;return E`${this.outlines()}${e?.tools()??k}${e?.entryTools()??k}${this.toolbarView()}${e?.panelView()??k}${this.design.view()}${this.collapsed?this.round():this.bar()}${e?.pickerDialog()??k}${this.linkDialog()}${this.media.dialog()}`}round(){return E`<button type="button" class="round" aria-label=${this.labels.expand} title=${this.labels.expand}
            aria-expanded="false" @click=${()=>this.collapse(!1)}>${R(`pencil`)}</button>`}bar(){let{editing:e,page:t}=this.config,n=this.labels;return E`<div class="bar" role="region" aria-label=${n.bar}>
            <button type="button" role="switch" aria-checked=${e?`true`:`false`} ?disabled=${this.busy} title=${n.edit}
                @click=${()=>this.toggle(!e)}>
                <span class="switch-track" aria-hidden="true"></span><span class="button-text">${n.edit}</span>
            </button>
            ${e?this.pageControls(t):k}
            ${this.more()}
            <button type="button" aria-label=${n.collapse} title=${n.collapse} aria-expanded="true"
                @click=${()=>this.collapse(!0)}>${R(`collapse`)}</button>
            ${this.stateView()}
            <p class="visually-hidden" role="status">${this.message?.text??``}</p>
        </div>`}get state(){let e=this.config.editing?this.config.page:null;return this.message?.tone===`danger`||this.problems.length>0?`error`:e?this.drafts(e).status:null}stateView(){let e=this.state;if(e===null)return k;let t=this.labels,n={published:`success`,changed:`warning`,draft:`warning`,error:`danger`},r=this.config.editing&&this.config.page?.locked,i=t[e]??e,a=t=>t===`error`?R(`warning`):t===e&&this.flash&&this.saving===0?R(`check`):E`<span class="state-dot ${t===`draft`?`ring`:``} ${t===e&&this.saving>0?`pulse`:``}"></span>`;return E`<div class="state-wrap" @keydown=${e=>this.detailsKey(e)}>
            <button type="button" class="state" data-state=${e} data-tone=${n[e]}
                title=${e===`error`?t.showError:t.explainStatus}
                aria-expanded=${this.details?`true`:`false`} aria-controls="fb-state-details"
                @click=${()=>{this.details=!this.details}}>
                <span class="visually-hidden">${t.status}: ${i}${r?`, ${t.locked}`:``}</span>
                ${r?R(`lock`):k}
                <span class="state-labels" aria-hidden="true">${Object.keys(n).map(n=>E`<span class=${n===e?`current`:``}><span class="state-mark">${a(n)}</span><span class="state-text">${t[n]??n}</span></span>`)}</span>
            </button>
            ${this.details?E`<div class="details" id="fb-state-details" data-tone=${n[e]}>${this.explanation(e,r)}</div>`:k}
        </div>`}explanation(e,t){let n=this.labels;if(e===`error`&&this.problems.length>0)return this.problemsView();if(e===`error`)return E`<p>${this.message.text}</p>
                ${this.message.reload?E`<button type="button" @click=${()=>location.reload()}>${n.reload}</button>`:k}`;let r=e===`published`?k:E`<p>${this.saving>0?n.saving:n.allSaved}</p>`;return E`<p>${n[`explain${e[0].toUpperCase()}${e.slice(1)}`]}</p>
            ${r}
            ${t?E`<p>${n.locked}.</p>`:k}`}problemsView(){let e=this.labels,t=this.problems.length,n=this.problems.filter(e=>e.element?.isConnected),r=this.problems.filter(e=>!e.element?.isConnected),i=e=>[e.block?.dataset.fbTitle,e.path].filter(Boolean).join(` · `);return E`<p>${this.problemsText}</p>
            <p>${t===1?e.oneProblem:e.problems.replace(`{count}`,t)}</p>
            ${r.length>0?E`<ul>${r.map(e=>E`<li>${i(e)?`${i(e)}: `:``}${e.message}</li>`)}</ul>`:k}
            ${n.length>0?E`<button type="button" data-fb-first-problem @click=${()=>this.showProblem(n[0].element)}>${e.firstProblem}</button>`:k}`}showProblem(e){this.details=!1,e.scrollIntoView({block:`center`,behavior:matchMedia(`(prefers-reduced-motion: reduce)`).matches?`auto`:`smooth`}),e.focus({preventScroll:!0})}solved(e){this.problems.some(t=>t.element===e)&&(this.problems=this.problems.filter(t=>t.element!==e),this.problems.length===0&&(this.details=!1))}detailsKey(e){e.key===`Escape`&&this.details&&(e.preventDefault(),e.stopPropagation(),this.details=!1,this.renderRoot.querySelector(`.state`)?.focus())}saved(){clearTimeout(this.flashTimer),this.flash=!0,this.flashTimer=setTimeout(()=>{this.flash=!1},2e3)}drafts(e){let t=this.siteDraft;return{status:e.status===`published`&&t?`changed`:e.status,canPublish:e.canPublish||t&&this.config.site.publish,canDiscard:e.canDiscard||t&&this.config.site.discard}}more(){let{editing:e,page:t}=this.config,n=this.labels,r=e&&t&&!this.confirming&&this.drafts(t).canDiscard,i=[this.marking?E`<button type="button" role="menuitemcheckbox" aria-checked=${this.showAll?`true`:`false`}
                @click=${()=>this.choose(()=>{this.showAll=!this.showAll})}>${R(`places`)}${n.showAll}</button>`:k,t?E`<a role="menuitem" href=${t.backend}>${R(`external`)}${n.backend}</a>`:k,r?E`<button type="button" role="menuitem" class="danger" ?disabled=${this.busy}
                @click=${()=>this.choose(()=>this.confirm())}>${R(`trash`)}${n.discard}</button>`:k].filter(e=>e!==k),a=[this.config.design&&e?E`<button type="button" role="menuitem"
                @click=${()=>this.choose(()=>this.design.show())}>${R(`palette`)}${n.design}</button>`:k].filter(e=>e!==k);if(i.length===0&&a.length===0)return k;let o=(e,t,n)=>n.length===0?k:E`<div role="group" aria-labelledby=${e}>
            <div class="menu-heading" id=${e} role="presentation">${t}</div>${n}</div>`;return E`<div class="more" @focusout=${e=>this.leaveMenu(e)} @mousedown=${e=>e.preventDefault()}>
            <button type="button" data-fb-more aria-haspopup="menu" aria-expanded=${this.menu?`true`:`false`} aria-controls="fb-more-menu"
                aria-label=${n.more} title=${n.more} @click=${()=>this.menu?this.closeMenu():this.openMenu(!0)}
                @keydown=${e=>this.moreKey(e)}>${R(`more`)}</button>
            ${this.menu?E`<div class="menu" id="fb-more-menu" role="menu" aria-label=${n.more} @keydown=${e=>this.menuKey(e)}>
                ${o(`fb-more-page`,n.thisPage,i)}${o(`fb-more-site`,n.website,a)}
            </div>`:k}
        </div>`}get menuItems(){return[...this.renderRoot.querySelectorAll(`.menu [role^="menuitem"]`)]}async openMenu(e,t=!1){if(this.menu=e,e){await this.updateComplete;let e=this.menuItems;(t?e.at(-1):e[0])?.focus()}}async closeMenu(){this.menu=!1,await this.updateComplete,this.renderRoot.querySelector(`[data-fb-more]`)?.focus()}choose(e){this.menu=!1,e()}moreKey(e){(e.key===`ArrowUp`||e.key===`ArrowDown`)&&(e.preventDefault(),this.openMenu(!0,e.key===`ArrowUp`))}menuKey(e){let t=this.menuItems,n=t.indexOf(this.renderRoot.activeElement),r={ArrowDown:(n+1)%t.length,ArrowUp:(n-1+t.length)%t.length,Home:0,End:t.length-1}[e.key];r===void 0?e.key===`Escape`?(e.preventDefault(),e.stopPropagation(),this.closeMenu()):e.key===`Tab`&&(this.menu=!1):(e.preventDefault(),t[r]?.focus())}leaveMenu(e){this.menu&&!e.currentTarget.contains(e.relatedTarget)&&(this.menu=!1)}async confirm(){this.confirming=!0,await this.updateComplete,this.renderRoot.querySelector(`[data-fb-cancel]`)?.focus()}async cancelConfirm(){this.confirming=!1,await this.updateComplete,this.renderRoot.querySelector(`[data-fb-more]`)?.focus()}pageControls(e){let t=this.labels;if(!e)return E`<span class="note">${t.readOnly}</span>`;if(this.confirming)return E`<span class="note">${t.discardConfirm}</span>
                <button type="button" class="danger solid" ?disabled=${this.busy} @click=${()=>this.discard()}>${t.discardYes}</button>
                <button type="button" data-fb-cancel @click=${()=>this.cancelConfirm()}>${t.cancel}</button>`;let{canPublish:n}=this.drafts(e),r=e.mayPublish||this.config.site?.publish,i=this.undo.length>0;return E`
            ${this.config.marking?k:E`<span class="note">${t.readOnly}</span>`}
            ${this.config.marking?E`<button type="button" ?disabled=${this.busy} aria-disabled=${i?`false`:`true`}
                title=${i?t.undo:t.nothingToUndo}
                @click=${()=>{i&&this.undoLast()}}>${R(`undo`)}<span class="button-text">${t.undo}</span></button>`:k}
            ${r?E`<button type="button" class="primary" ?disabled=${this.busy} aria-disabled=${n?`false`:`true`}
                title=${n?e.canPublish&&e.offlineParents.length?t.offlineParents.replace(`{pages}`,e.offlineParents.join(`, `)):k:t.allPublished}
                @click=${()=>{n&&this.publish()}}>${t.publish}</button>`:k}`}outlines(){if(!this.marking)return k;let e=this.arranging?.block,t=this.arranging?.entry?.element,n=this.showAll?[...document.querySelectorAll(`${Mt}, [data-fb-entry]`)]:[...new Set([e,t,this.current].filter(e=>e?.isConnected))],r=new Set(this.problems.map(e=>e.element));return E`${this.problemOutlines()}${n.filter(e=>!r.has(e)).map(e=>{let t=e.getBoundingClientRect();return t.width===0&&t.height===0?k:E`<div class="outline ${t.top<24?`below`:``}" data-kind=${Rt(e)}
                style="inset-block-start: ${t.top}px; inset-inline-start: ${t.left}px; inline-size: ${t.width}px; block-size: ${t.height}px">
                ${this.fieldTab(e,X(e))}
            </div>`})}`}problemOutlines(){return this.problems.filter(e=>e.element?.isConnected).map(({element:e,message:t})=>{let n=e.getBoundingClientRect();return n.width===0&&n.height===0?k:E`<div class="outline ${n.top<24?`below`:``}" data-kind="problem"
                style="inset-block-start: ${n.top}px; inset-inline-start: ${n.left}px; inline-size: ${n.width}px; block-size: ${n.height}px">
                ${this.fieldTab(e,e===this.current?`${X(e)}: ${t}`:X(e))}
            </div>`})}fieldTab(e,t){let n=e===this.current&&e.hasAttribute(`data-fb-field`)&&this.editing?at(e,this):[];return n.length===0?E`<span class="label">${t}</span>`:E`<div class="label tools" role="toolbar" aria-label=${this.labels.fieldTools.replace(`{field}`,X(e))}
            @keydown=${t=>this.fieldToolsKey(t,e)}>
            <span>${t}</span>
            ${n.map(e=>E`<button type="button" class=${e.tone??``} aria-label=${e.label} title=${e.title??e.label}
                ?disabled=${e.disabled||this.busy} @click=${()=>e.run()}>${R(e.icon)}</button>`)}
        </div>`}hasFieldTools(e){return at(e,this).length>0}focusFieldTools(e){this.current=e,this.requestUpdate(),this.updateComplete.then(()=>this.renderRoot.querySelector(`.label.tools button:not([disabled])`)?.focus())}fieldToolsKey(e,t){let n=[...this.renderRoot.querySelectorAll(`.label.tools button:not([disabled])`)],r=n.indexOf(this.renderRoot.activeElement);e.key===`Escape`?(e.preventDefault(),t.focus()):e.key===`F10`&&e.altKey?(e.preventDefault(),this.arranging?.reachTools(t)):(e.key===`ArrowRight`||e.key===`ArrowLeft`)&&(e.preventDefault(),n[(r+(e.key===`ArrowRight`?1:-1)+n.length)%n.length]?.focus())}point(e){if(e===this)return;this.arranging?.select(e);let t=e instanceof Element?e.closest(Mt):null;t!==this.current&&(this.current=t)}collapse(e){this.collapsed=e,Pt(kt,e?`1`:null),this.updateComplete.then(()=>this.renderRoot.querySelector(e?`.round`:`[role="switch"]`)?.focus())}async toggle(e){this.busy=!0;let t=await this.send(this.config.toggle,new URLSearchParams({on:e?`1`:`0`}));t?.ok?this.go(e):this.fail(t)}go(e){let t=this.config.page,n=t?e?t.draftUrl:t.visitorUrl??t.backend:null;n&&new URL(n,location.href).pathname!==location.pathname?location.assign(n):location.reload()}get siteDraft(){return!!this.config?.site?.draft}async publish(){let e=this.config.page;if(this.busy=!0,this.problems=[],await this.editing?.flushAll(),e.canPublish){let t=await this.action(`page.publish`,{ids:e.publish});if(!t?.ok){this.busy=!1,this.fail(t,!0);return}this.config={...this.config,page:{...e,status:`published`,published:!0,canPublish:!1,canDiscard:!1,offlineParents:[],visitorUrl:e.draftUrl}}}if(this.siteDraft&&this.config.site.publish){let e=await this.action(`site.publish`,{});if(!e?.ok){this.busy=!1,this.fail(e,!0);return}this.config={...this.config,site:{...this.config.site,draft:!1}}}this.busy=!1,this.forget(),this.message={tone:`info`,text:this.labels.publishDone}}async discard(){let e=this.config.page;this.busy=!0;let t=[...e.canDiscard?[[`page.discard`,{id:e.id}]]:[],...this.siteDraft&&this.config.site.discard?[[`site.discard`,{}]]:[]];for(let[e,n]of t){let t=await this.action(e,n);if(!t?.ok){this.busy=!1,this.confirming=!1,this.fail(t);return}}this.forget(),e.published||!e.canDiscard?location.reload():location.assign(this.config.pages)}async run(e,t){this.state===`error`&&(this.details=!1),this.saving++,this.message={tone:`info`,text:this.labels.saving};let n=await this.action(e,t),r=n?await n.json().catch(()=>null):null;if(this.saving--,n?.ok)return this.saving===0&&(this.message={tone:`info`,text:this.labels.saved},this.saved()),{ok:!0,data:r?.data};let i=r?.errors?.[0]?.message??r?.detail??this.labels.failed;return this.message={tone:`danger`,text:i,reload:n?.status===409},{ok:!1,status:n?.status??0}}changed(e,t=!1){let n=this.config.page;e&&(this.undo=[...this.undo,e],$(this.undoKey,this.undo)),this.config=t?{...this.config,site:{...this.config.site,draft:!0}}:{...this.config,page:{...n,status:n.published?`changed`:`draft`,canPublish:n.mayPublish,canDiscard:n.mayDiscard}}}async undoLast(){this.busy=!0,await this.editing?.flushAll();let e=this.undo.at(-1),t=await this.action(`action.undo`,{id:e});t?.ok?($(this.undoKey,this.undo.slice(0,-1)),location.reload()):this.fail(t)}forget(){this.undo=[],$(this.undoKey,[])}showToolbar(e){(e.view.hasFocus()||this.link)&&(this.toolbar=e,this.requestUpdate())}hideToolbar(e){this.toolbar===e&&!this.link&&(this.toolbar=null)}focusToolbar(){this.renderRoot.querySelector(`.toolbar button`)?.focus()}toolbarView(){let e=this.toolbar;if(!e||e.isDestroyed)return k;let t=this.labels,n=e.view.coordsAtPos(e.state.selection.from),r=n.top<64,i=r?n.bottom:n.top,a=Math.max(8,Math.min(n.left,innerWidth-320)),o=t=>t(e.chain().focus()).run(),s=[[`bold`,`bold`,t.bold,()=>o(e=>e.toggleBold())],[`italic`,`italic`,t.italic,()=>o(e=>e.toggleItalic())],[`heading`,[`heading`,{level:2}],t.subheading,()=>o(e=>e.toggleHeading({level:2}))],[`list`,`bulletList`,t.bulletList,()=>o(e=>e.toggleBulletList())],[`ordered`,`orderedList`,t.orderedList,()=>o(e=>e.toggleOrderedList())],[`quote`,`blockquote`,t.quote,()=>o(e=>e.toggleBlockquote())],[`link`,`link`,t.link,()=>this.richLink(e)]];return E`<div class="toolbar ${r?`below`:``}" role="toolbar" aria-label=${t.formatting}
            style="inset-block-start: ${i}px; inset-inline-start: ${a}px"
            @keydown=${t=>this.toolbarKey(t,e)}
            @focusout=${t=>this.toolbarLeft(t,e)}>
            ${s.map(([t,n,r,i])=>E`<button type="button" aria-label=${r} title=${r} aria-pressed=${(Array.isArray(n)?e.isActive(...n):e.isActive(n))?`true`:`false`}
                    @mousedown=${e=>e.preventDefault()} @click=${i}>${R(t)}</button>`)}
        </div>`}toolbarKey(e,t){let n=[...this.renderRoot.querySelectorAll(`.toolbar button`)],r=n.indexOf(this.renderRoot.activeElement);e.key===`Escape`?(e.preventDefault(),t.commands.focus()):(e.key===`ArrowRight`||e.key===`ArrowLeft`)&&(e.preventDefault(),n[(r+(e.key===`ArrowRight`?1:-1)+n.length)%n.length]?.focus())}toolbarLeft(e,t){let n=e.relatedTarget;!this.link&&!(n instanceof Node&&(this.renderRoot.contains(n)||t.view.dom.contains(n)))&&(this.toolbar=null)}richLink(e){let t=e.getAttributes(`link`),n=e.isActive(`link`);this.openLink({withText:!1,href:t.href??``,newWindow:t.target===`_blank`,existing:n,apply:({href:t,newWindow:r,label:i})=>{let a={href:t,target:r?`_blank`:null},o=e.chain().focus();e.state.selection.empty&&!n?o.insertContent({type:`text`,text:i,marks:[{type:`link`,attrs:a}]}):o.extendMarkRange(`link`).setLink(a),o.run()},remove:()=>e.chain().focus().extendMarkRange(`link`).unsetLink().run(),done:()=>e.commands.focus()})}openLink(e){let t=e.href.startsWith(`page:`)?{id:e.href.slice(5),title:``,path:``}:null;this.link={existing:e.href!==``,...e,query:t?``:e.href,page:t},this.loadPages(),this.updateComplete.then(()=>{this.renderRoot.querySelector(`dialog.link`)?.showModal(),this.renderRoot.querySelector(`dialog.link input`)?.focus()})}async loadPages(){if(!this.pages){try{let e=await fetch(this.config.queries+`page.tree`,{headers:{Accept:`application/json`},credentials:`same-origin`}),t=e.ok?await e.json():null;this.pages=Ft(t?.data??[],this.config.language)}catch{this.pages=[]}this.requestUpdate()}}linkDialog(){let e=this.link;if(!e)return k;let t=this.labels,n=e.page?this.pages?.find(t=>t.id===e.page.id)??e.page:null,r=e.query.trim(),i=!n&&r!==``&&!Z(r),a=r.toLowerCase(),o=i&&this.pages?this.pages.filter(e=>e.title.toLowerCase().includes(a)||e.path.includes(a)).slice(0,8):[],s=n!==null||r!==``&&Z(r),c=n?e.openUrl&&e.href===`page:${n.id}`?e.openUrl:null:s?It(r):null,l=e=>{this.link={...this.link,...e}};return E`<dialog class="link" aria-labelledby="fb-link-title" @cancel=${e=>{e.preventDefault(),this.closeLink()}}>
            <form @submit=${e=>{e.preventDefault(),this.applyLink(n,r)}}>
                <h2 id="fb-link-title">${t.link}</h2>
                ${e.withText?E`<label>${t.linkText}
                    <input type="text" .value=${e.text??``} @input=${e=>l({text:e.target.value})}></label>`:k}
                ${n?E`<div><span class="hint">${t.linkTarget}</span><div class="chosen">
                        <span>${t.linkPage}: ${n.title||n.id} <small>${n.path}</small></span>
                        <button type="button" aria-label=${t.removeLink} title=${t.removeLink}
                            @click=${()=>l({page:null,query:``})}>${R(`close`)}</button></div></div>`:E`<label>${t.linkTarget}
                        <input type="text" .value=${e.query} autocomplete="off" aria-describedby="fb-link-hint"
                            @input=${e=>l({query:e.target.value})}></label>
                        <p class="hint" id="fb-link-hint">${t.linkHint}</p>`}
                ${i?E`<ul class="results" aria-label=${t.linkPage}>
                    ${this.pages&&o.length===0?E`<li class="hint">${t.noPages}</li>`:k}
                    ${o.map(e=>E`<li><button type="button" @click=${()=>l({page:e,query:``})}>
                        <span>${e.title}</span><small>${e.path}</small></button></li>`)}
                </ul>`:k}
                <label class="check"><input type="checkbox" .checked=${e.newWindow}
                    @change=${e=>l({newWindow:e.target.checked})}>${t.newWindow}</label>
                <div class="actions">
                    ${c?E`<button type="button" class="open" @click=${()=>q(c,!0)}>${R(`external`)}${t.openLink}</button>`:k}
                    ${e.existing?E`<button type="button" class="danger" @click=${()=>this.closeLink(e.remove)}>${t.removeLink}</button>`:k}
                    <button type="button" @click=${()=>this.closeLink()}>${t.cancel}</button>
                    <button type="submit" class="primary" ?disabled=${!s}>${t.apply}</button>
                </div>
            </form>
        </dialog>`}applyLink(e,t){let n=this.link,r=e?`page:`+e.id:Q(t)?`https://`+t:t;(e||Z(t))&&this.closeLink(()=>n.apply({text:(n.text??``).trim(),href:r,newWindow:n.newWindow,label:e?.title||t}))}closeLink(e=null){let t=this.link;this.renderRoot.querySelector(`dialog.link`)?.close(),this.link=null,e?.(),t?.done?.()}action(e,t){return this.send(this.config.actions+e,JSON.stringify(t),`application/json`)}async send(e,t,n=null){let r={Accept:`application/json`,"X-CSRF-Token":this.config.csrf??``};n&&(r[`Content-Type`]=n);try{return await fetch(e,{method:`POST`,headers:r,body:t,credentials:`same-origin`})}catch{return null}}async fail(e,t=!1){this.busy=!1;let n=e?await e.json().catch(()=>null):null,r=n?.detail??this.labels.failed,i=Array.isArray(n?.errors)?n.errors:[];t&&i.length>0?(this.problemsText=r,this.problems=Ot(i,this.config.page,this.config.language),this.message={tone:`info`,text:`${r} ${i.length===1?this.labels.oneProblem:this.labels.problems.replace(`{count}`,i.length)}`},this.details=!0):this.message={tone:`danger`,text:r}}};customElements.define(`fb-editor-bar`,zt);var Bt=document.getElementById(`fb-edit-config`);if(Bt){let e=document.createElement(`fb-editor-bar`);e.config=JSON.parse(Bt.textContent??`{}`),document.body.append(e)}