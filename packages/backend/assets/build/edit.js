var e=globalThis,t=e.ShadowRoot&&(e.ShadyCSS===void 0||e.ShadyCSS.nativeShadow)&&`adoptedStyleSheets`in Document.prototype&&`replace`in CSSStyleSheet.prototype,n=Symbol(),r=new WeakMap,i=class{constructor(e,t,r){if(this._$cssResult$=!0,r!==n)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,n=this.t;if(t&&e===void 0){let t=n!==void 0&&n.length===1;t&&(e=r.get(n)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),t&&r.set(n,e))}return e}toString(){return this.cssText}},a=e=>new i(typeof e==`string`?e:e+``,void 0,n),o=(e,...t)=>new i(e.length===1?e[0]:t.reduce((t,n,r)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if(typeof e==`number`)return e;throw Error(`Value passed to 'css' function must be a 'css' function result: `+e+`. Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.`)})(n)+e[r+1],e[0]),e,n),s=(n,r)=>{if(t)n.adoptedStyleSheets=r.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let t of r){let r=document.createElement(`style`),i=e.litNonce;i!==void 0&&r.setAttribute(`nonce`,i),r.textContent=t.cssText,n.appendChild(r)}},c=t?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t=``;for(let n of e.cssRules)t+=n.cssText;return a(t)})(e):e,{is:l,defineProperty:u,getOwnPropertyDescriptor:d,getOwnPropertyNames:ee,getOwnPropertySymbols:te,getPrototypeOf:ne}=Object,f=globalThis,re=f.trustedTypes,ie=re?re.emptyScript:``,ae=f.reactiveElementPolyfillSupport,p=(e,t)=>e,m={toAttribute(e,t){switch(t){case Boolean:e=e?ie:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,t){let n=e;switch(t){case Boolean:n=e!==null;break;case Number:n=e===null?null:Number(e);break;case Object:case Array:try{n=JSON.parse(e)}catch{n=null}}return n}},h=(e,t)=>!l(e,t),g={attribute:!0,type:String,converter:m,reflect:!1,useDefault:!1,hasChanged:h};Symbol.metadata??=Symbol(`metadata`),f.litPropertyMetadata??=new WeakMap;var _=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=g){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let n=Symbol(),r=this.getPropertyDescriptor(e,n,t);r!==void 0&&u(this.prototype,e,r)}}static getPropertyDescriptor(e,t,n){let{get:r,set:i}=d(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:r,set(t){let a=r?.call(this);i?.call(this,t),this.requestUpdate(e,a,n)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??g}static _$Ei(){if(this.hasOwnProperty(p(`elementProperties`)))return;let e=ne(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(p(`finalized`)))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(p(`properties`))){let e=this.properties,t=[...ee(e),...te(e)];for(let n of t)this.createProperty(n,e[n])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[e,n]of t)this.elementProperties.set(e,n)}this._$Eh=new Map;for(let[e,t]of this.elementProperties){let n=this._$Eu(e,t);n!==void 0&&this._$Eh.set(n,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let n=new Set(e.flat(1/0).reverse());for(let e of n)t.unshift(c(e))}else e!==void 0&&t.push(c(e));return t}static _$Eu(e,t){let n=t.attribute;return!1===n?void 0:typeof n==`string`?n:typeof e==`string`?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let n of t.keys())this.hasOwnProperty(n)&&(e.set(n,this[n]),delete this[n]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return s(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,n){this._$AK(e,n)}_$ET(e,t){let n=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,n);if(r!==void 0&&!0===n.reflect){let i=(n.converter?.toAttribute===void 0?m:n.converter).toAttribute(t,n.type);this._$Em=e,i==null?this.removeAttribute(r):this.setAttribute(r,i),this._$Em=null}}_$AK(e,t){let n=this.constructor,r=n._$Eh.get(e);if(r!==void 0&&this._$Em!==r){let e=n.getPropertyOptions(r),i=typeof e.converter==`function`?{fromAttribute:e.converter}:e.converter?.fromAttribute===void 0?m:e.converter;this._$Em=r;let a=i.fromAttribute(t,e.type);this[r]=a??this._$Ej?.get(r)??a,this._$Em=null}}requestUpdate(e,t,n,r=!1,i){if(e!==void 0){let a=this.constructor;if(!1===r&&(i=this[e]),n??=a.getPropertyOptions(e),!((n.hasChanged??h)(i,t)||n.useDefault&&n.reflect&&i===this._$Ej?.get(e)&&!this.hasAttribute(a._$Eu(e,n))))return;this.C(e,t,n)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:n,reflect:r,wrapped:i},a){n&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,a??t??this[e]),!0!==i||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||n||(t=void 0),this._$AL.set(e,t)),!0===r&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}let e=this.constructor.elementProperties;if(e.size>0)for(let[t,n]of e){let{wrapped:e}=n,r=this[t];!0!==e||this._$AL.has(t)||r===void 0||this.C(t,void 0,n,r)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};_.elementStyles=[],_.shadowRootOptions={mode:`open`},_[p(`elementProperties`)]=new Map,_[p(`finalized`)]=new Map,ae?.({ReactiveElement:_}),(f.reactiveElementVersions??=[]).push(`2.1.2`);var v=globalThis,y=e=>e,b=v.trustedTypes,oe=b?b.createPolicy(`lit-html`,{createHTML:e=>e}):void 0,x=`$lit$`,S=`lit$${Math.random().toFixed(9).slice(2)}$`,C=`?`+S,se=`<${C}>`,w=document,T=()=>w.createComment(``),E=e=>e===null||typeof e!=`object`&&typeof e!=`function`,D=Array.isArray,ce=e=>D(e)||typeof e?.[Symbol.iterator]==`function`,O=`[ 	
\f\r]`,k=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,A=/-->/g,j=/>/g,M=RegExp(`>|${O}(?:([^\\s"'>=/]+)(${O}*=${O}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,`g`),N=/'/g,P=/"/g,le=/^(?:script|style|textarea|title)$/i,ue=e=>(t,...n)=>({_$litType$:e,strings:t,values:n}),F=ue(1),I=ue(2),L=Symbol.for(`lit-noChange`),R=Symbol.for(`lit-nothing`),z=new WeakMap,B=w.createTreeWalker(w,129);function V(e,t){if(!D(e)||!e.hasOwnProperty(`raw`))throw Error(`invalid template strings array`);return oe===void 0?t:oe.createHTML(t)}var de=(e,t)=>{let n=e.length-1,r=[],i,a=t===2?`<svg>`:t===3?`<math>`:``,o=k;for(let t=0;t<n;t++){let n=e[t],s,c,l=-1,u=0;for(;u<n.length&&(o.lastIndex=u,c=o.exec(n),c!==null);)u=o.lastIndex,o===k?c[1]===`!--`?o=A:c[1]===void 0?c[2]===void 0?c[3]!==void 0&&(o=M):(le.test(c[2])&&(i=RegExp(`</`+c[2],`g`)),o=M):o=j:o===M?c[0]===`>`?(o=i??k,l=-1):c[1]===void 0?l=-2:(l=o.lastIndex-c[2].length,s=c[1],o=c[3]===void 0?M:c[3]===`"`?P:N):o===P||o===N?o=M:o===A||o===j?o=k:(o=M,i=void 0);let d=o===M&&e[t+1].startsWith(`/>`)?` `:``;a+=o===k?n+se:l>=0?(r.push(s),n.slice(0,l)+x+n.slice(l)+S+d):n+S+(l===-2?t:d)}return[V(e,a+(e[n]||`<?>`)+(t===2?`</svg>`:t===3?`</math>`:``)),r]},H=class e{constructor({strings:t,_$litType$:n},r){let i;this.parts=[];let a=0,o=0,s=t.length-1,c=this.parts,[l,u]=de(t,n);if(this.el=e.createElement(l,r),B.currentNode=this.el.content,n===2||n===3){let e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;(i=B.nextNode())!==null&&c.length<s;){if(i.nodeType===1){if(i.hasAttributes())for(let e of i.getAttributeNames())if(e.endsWith(x)){let t=u[o++],n=i.getAttribute(e).split(S),r=/([.?@])?(.*)/.exec(t);c.push({type:1,index:a,name:r[2],strings:n,ctor:r[1]===`.`?pe:r[1]===`?`?me:r[1]===`@`?he:G}),i.removeAttribute(e)}else e.startsWith(S)&&(c.push({type:6,index:a}),i.removeAttribute(e));if(le.test(i.tagName)){let e=i.textContent.split(S),t=e.length-1;if(t>0){i.textContent=b?b.emptyScript:``;for(let n=0;n<t;n++)i.append(e[n],T()),B.nextNode(),c.push({type:2,index:++a});i.append(e[t],T())}}}else if(i.nodeType===8){if(i.data===C)c.push({type:2,index:a});else{let e=-1;for(;(e=i.data.indexOf(S,e+1))!==-1;)c.push({type:7,index:a}),e+=S.length-1}}a++}}static createElement(e,t){let n=w.createElement(`template`);return n.innerHTML=e,n}};function U(e,t,n=e,r){if(t===L)return t;let i=r===void 0?n._$Cl:n._$Co?.[r],a=E(t)?void 0:t._$litDirective$;return i?.constructor!==a&&(i?._$AO?.(!1),a===void 0?i=void 0:(i=new a(e),i._$AT(e,n,r)),r===void 0?n._$Cl=i:(n._$Co??=[])[r]=i),i!==void 0&&(t=U(e,i._$AS(e,t.values),i,r)),t}var fe=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:n}=this._$AD,r=(e?.creationScope??w).importNode(t,!0);B.currentNode=r;let i=B.nextNode(),a=0,o=0,s=n[0];for(;s!==void 0;){if(a===s.index){let t;s.type===2?t=new W(i,i.nextSibling,this,e):s.type===1?t=new s.ctor(i,s.name,s.strings,this,e):s.type===6&&(t=new ge(i,this,e)),this._$AV.push(t),s=n[++o]}a!==s?.index&&(i=B.nextNode(),a++)}return B.currentNode=w,r}p(e){let t=0;for(let n of this._$AV)n!==void 0&&(n.strings===void 0?n._$AI(e[t]):(n._$AI(e,n,t),t+=n.strings.length-2)),t++}},W=class e{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,n,r){this.type=2,this._$AH=R,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=n,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=U(this,e,t),E(e)?e===R||e==null||e===``?(this._$AH!==R&&this._$AR(),this._$AH=R):e!==this._$AH&&e!==L&&this._(e):e._$litType$===void 0?e.nodeType===void 0?ce(e)?this.k(e):this._(e):this.T(e):this.$(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==R&&E(this._$AH)?this._$AA.nextSibling.data=e:this.T(w.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:n}=e,r=typeof n==`number`?this._$AC(e):(n.el===void 0&&(n.el=H.createElement(V(n.h,n.h[0]),this.options)),n);if(this._$AH?._$AD===r)this._$AH.p(t);else{let e=new fe(r,this),n=e.u(this.options);e.p(t),this.T(n),this._$AH=e}}_$AC(e){let t=z.get(e.strings);return t===void 0&&z.set(e.strings,t=new H(e)),t}k(t){D(this._$AH)||(this._$AH=[],this._$AR());let n=this._$AH,r,i=0;for(let a of t)i===n.length?n.push(r=new e(this.O(T()),this.O(T()),this,this.options)):r=n[i],r._$AI(a),i++;i<n.length&&(this._$AR(r&&r._$AB.nextSibling,i),n.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let t=y(e).nextSibling;y(e).remove(),e=t}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},G=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,n,r,i){this.type=1,this._$AH=R,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=i,n.length>2||n[0]!==``||n[1]!==``?(this._$AH=Array(n.length-1).fill(new String),this.strings=n):this._$AH=R}_$AI(e,t=this,n,r){let i=this.strings,a=!1;if(i===void 0)e=U(this,e,t,0),a=!E(e)||e!==this._$AH&&e!==L,a&&(this._$AH=e);else{let r=e,o,s;for(e=i[0],o=0;o<i.length-1;o++)s=U(this,r[n+o],t,o),s===L&&(s=this._$AH[o]),a||=!E(s)||s!==this._$AH[o],s===R?e=R:e!==R&&(e+=(s??``)+i[o+1]),this._$AH[o]=s}a&&!r&&this.j(e)}j(e){e===R?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??``)}},pe=class extends G{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===R?void 0:e}},me=class extends G{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==R)}},he=class extends G{constructor(e,t,n,r,i){super(e,t,n,r,i),this.type=5}_$AI(e,t=this){if((e=U(this,e,t,0)??R)===L)return;let n=this._$AH,r=e===R&&n!==R||e.capture!==n.capture||e.once!==n.once||e.passive!==n.passive,i=e!==R&&(n===R||r);r&&this.element.removeEventListener(this.name,this,n),i&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH==`function`?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},ge=class{constructor(e,t,n){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=n}get _$AU(){return this._$AM._$AU}_$AI(e){U(this,e)}},_e=v.litHtmlPolyfillSupport;_e?.(H,W),(v.litHtmlVersions??=[]).push(`3.3.3`);var ve=(e,t,n)=>{let r=n?.renderBefore??t,i=r._$litPart$;if(i===void 0){let e=n?.renderBefore??null;r._$litPart$=i=new W(t.insertBefore(T(),e),e,void 0,n??{})}return i._$AI(e),i},K=globalThis,q=class extends _{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=ve(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return L}};q._$litElement$=!0,q.finalized=!0,K.litElementHydrateSupport?.({LitElement:q});var ye=K.litElementPolyfillSupport;ye?.({LitElement:q}),(K.litElementVersions??=[]).push(`4.2.2`);var be=(function(){let e=typeof document<`u`&&document.createElement(`link`).relList;return e&&e.supports&&e.supports(`modulepreload`)?`modulepreload`:`preload`})(),xe=function(e){return`/`+e},Se={},Ce=function(e){return e.pathname.endsWith(`.css`)},we=function(e,t,n){if(t in e)return e[t];let r=n();if(!r){e[t]=void 0;return}let i=r.then(()=>{e[t]=void 0},n=>{throw e[t]=void 0,n});return e[t]=i,i},Te=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e,i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}function s(e){return import.meta.resolve?new URL(import.meta.resolve(e)):new URL(e,import.meta.url)}r=o(t.map(t=>{t=xe(t,n);let r=s(t),i=Ce(r);return we(Se,r.href,()=>{if(e===void 0){e={all:new Set,styles:new Set};let t=document.getElementsByTagName(`link`);for(let n=t.length-1;n>=0;n--){let r=t[n];e.all.add(r.href),r.rel===`stylesheet`&&e.styles.add(r.href)}}if((i?e.styles:e.all).has(r.href))return;let t=document.createElement(`link`);if(t.rel=i?`stylesheet`:be,i||(t.as=`script`),t.crossOrigin=``,t.href=r.href,a&&t.setAttribute(`nonce`,a),document.head.appendChild(t),i)return new Promise((e,n)=>{t.addEventListener(`load`,e),t.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${r}`)))})})}).filter(e=>e!==void 0))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},J=[`headline`,`text`],Ee=1e3;function De(e){if(e.dataset.fbValue===void 0)return null;try{return JSON.parse(e.dataset.fbValue)}catch{return null}}function Oe(e,t){return JSON.stringify(Y(e))===JSON.stringify(Y(t))}function Y(e){return Array.isArray(e)?e.map(Y):e&&typeof e==`object`?Object.fromEntries(Object.keys(e).sort().map(t=>[t,Y(e[t])])):e??null}function ke(e){let t=e.dataset.fbType===`headline`,n=e.innerText.replace(/ /g,` `).replace(/\n+$/,``);return t&&(n=n.replace(/\s*\n\s*/g,` `)),n===``?null:n}var Ae=class{constructor(e){this.bar=e,this.saved=new WeakMap,this.timers=new Map,this.queues=new WeakMap,this.editors=new WeakMap,this.loading=null,this.pointer=null,this.onFocus=e=>this.focus(e),this.onBlur=e=>this.blur(e),this.onInput=e=>this.input(e),this.onKey=e=>this.key(e),this.onClick=e=>this.click(e),this.onPointer=e=>{this.pointer={left:e.clientX,top:e.clientY,at:Date.now()}},this.onLeave=e=>this.leave(e)}start(){for(let e of document.querySelectorAll(`[data-fb-field]`))J.includes(e.dataset.fbType)&&(e.contentEditable=`plaintext-only`);document.addEventListener(`focusin`,this.onFocus,!0),document.addEventListener(`focusout`,this.onBlur,!0),document.addEventListener(`input`,this.onInput,!0),document.addEventListener(`keydown`,this.onKey,!0),document.addEventListener(`click`,this.onClick,!0),document.addEventListener(`pointerdown`,this.onPointer,!0),addEventListener(`beforeunload`,this.onLeave)}stop(){document.removeEventListener(`focusin`,this.onFocus,!0),document.removeEventListener(`focusout`,this.onBlur,!0),document.removeEventListener(`input`,this.onInput,!0),document.removeEventListener(`keydown`,this.onKey,!0),document.removeEventListener(`click`,this.onClick,!0),document.removeEventListener(`pointerdown`,this.onPointer,!0),removeEventListener(`beforeunload`,this.onLeave)}field(e){return e instanceof Element?e.closest(`[data-fb-field]`):null}savedValue(e){return this.saved.has(e)?this.saved.get(e):De(e)}focus(e){let t=this.field(e.target);t?.dataset.fbType===`richtext`&&!this.editors.has(t)&&this.richText(t)}blur(e){let t=this.field(e.target);t&&J.includes(t.dataset.fbType)&&this.flush(t)}input(e){let t=this.field(e.target);t&&J.includes(t.dataset.fbType)&&this.later(t,()=>ke(t))}key(e){let t=this.field(e.target);if(!t)return;let n=t.dataset.fbType;if(J.includes(n))e.key===`Escape`?(e.preventDefault(),this.cancel(t),t.innerText=this.savedValue(t)??``,t.blur()):e.key===`Enter`&&n===`headline`&&(e.preventDefault(),t.blur());else if(n===`link`&&(e.key===`Enter`||e.key===` `))e.preventDefault(),this.editLink(t);else if(n===`richtext`&&e.key===`F10`&&e.altKey)e.preventDefault(),this.bar.focusToolbar();else if(n===`richtext`&&e.key===`Escape`){let n=this.editors.get(t);n&&(e.preventDefault(),this.cancel(t),n.commands.setContent(this.savedValue(t)??{type:`doc`,content:[]},{emitUpdate:!1}),n.commands.blur(),t.blur())}}click(e){let t=this.field(e.target),n=e.target instanceof Element?e.target.closest(`a`):null;n&&(t||n.querySelector(`[data-fb-field]`))&&e.preventDefault(),t?.dataset.fbType===`link`&&(e.preventDefault(),this.editLink(t))}leave(e){let t=this.timers.size>0;this.flushAll(),(t||this.bar.saving>0)&&e.preventDefault()}flushAll(){let e=[...this.timers.keys()].map(e=>this.flush(e));return Promise.all(e)}later(e,t){clearTimeout(this.timers.get(e)?.timer),this.timers.set(e,{read:t,timer:setTimeout(()=>this.flush(e),Ee)})}flush(e){let t=this.timers.get(e);return t?(clearTimeout(t.timer),this.timers.delete(e),this.save(e,t.read())):Promise.resolve(!0)}cancel(e){clearTimeout(this.timers.get(e)?.timer),this.timers.delete(e)}save(e,t){let n=(this.queues.get(e)??Promise.resolve()).then(()=>this.send(e,t));return this.queues.set(e,n.catch(()=>{})),n}async send(e,t){let n=this.savedValue(e);if(Oe(n,t))return!0;let r=this.bar.config.page,i=e.closest(`[data-fb-block]`)?.dataset.fbBlock??null,a=await this.bar.run(`page.update-field`,{id:r.id,language:this.bar.config.language,path:e.dataset.fbField,block:i,value:t,previous:n});if(!a.ok)return!1;let o=a.data;return this.saved.set(e,o.value),o.value===null?delete e.dataset.fbValue:e.dataset.fbValue=JSON.stringify(o.value),e.dataset.fbType===`link`&&(e.innerHTML=o.html),this.bar.changed(o.entry),!0}editLink(e){let t=this.savedValue(e)??{};this.bar.openLink({withText:!0,text:t.text??``,href:t.target??t.url??``,newWindow:t.newWindow===!0,apply:({text:t,href:n,newWindow:r})=>{let i=n.startsWith(`page:`)?{target:n}:{url:n};t&&(i.text=t),r&&(i.newWindow=!0),this.save(e,i)},remove:()=>this.save(e,null),done:()=>e.focus()})}async richText(e){this.loading??=Te(()=>import(`./chunks/edit-richtext-CdZAclu1.js`),[]);let{createEditor:t,valueOf:n}=await this.loading;if(this.editors.has(e))return;let r=this.pointer&&Date.now()-this.pointer.at<2e3?this.pointer:null,i=t(e,this.savedValue(e),{update:()=>this.later(e,()=>n(i)),selection:()=>this.bar.showToolbar(i),blur:t=>{t.relatedTarget!==this.bar&&(this.flush(e),this.bar.hideToolbar(i))}});this.editors.set(e,i);let a=r?i.view.posAtCoords(r):null;e.blur(),i.commands.focus(a?a.pos:`end`,{scrollIntoView:!1})}},X=`fb-edit-bar-collapsed`,je=`fb-theme`,Me=`fb-edit-undo:`,Ne=`[data-fb-field], [data-fb-block], fb-area[data-fb-area]`,Pe={pencil:I`<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>`,external:I`<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>`,collapse:I`<path d="m6 9 6 6 6-6"/>`,lock:I`<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>`,undo:I`<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>`,bold:I`<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7z"/><path d="M7 12h7a3.5 3.5 0 0 1 0 7H7z"/>`,italic:I`<path d="M19 4h-9"/><path d="M14 20H5"/><path d="M15 4 9 20"/>`,heading:I`<path d="M6 4v16"/><path d="M18 4v16"/><path d="M6 12h12"/>`,list:I`<path d="M9 6h11"/><path d="M9 12h11"/><path d="M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>`,ordered:I`<path d="M10 6h10"/><path d="M10 12h10"/><path d="M10 18h10"/><path d="M4 4h1v4"/><path d="M4 14h2l-2 4h2"/>`,quote:I`<path d="M5 11h4v6H5zM5 11a5 5 0 0 1 4-5"/><path d="M14 11h4v6h-4zM14 11a5 5 0 0 1 4-5"/>`,link:I`<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>`,close:I`<path d="M6 6l12 12"/><path d="M18 6 6 18"/>`,places:I`<rect x="3" y="4" width="18" height="6" rx="1.5" stroke-dasharray="3 2"/><rect x="3" y="14" width="18" height="6" rx="1.5" stroke-dasharray="3 2"/>`};function Z(e){return F`<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${Pe[e]}</svg>`}function Fe(e){try{return localStorage.getItem(e)}catch{return null}}function Ie(e,t){try{t===null?localStorage.removeItem(e):localStorage.setItem(e,t)}catch{}}function Le(e){return e.dataset.fbLabel??e.dataset.fbTitle??e.dataset.fbArea??``}function Re(e,t,n=[],r=[]){for(let i of e){let e=i.slugs?.[t]??Object.values(i.slugs??{})[0]??``,a=e?[...n,e]:n,o=i.titles?.[t]??Object.values(i.titles??{})[0]??i.id;r.push({id:i.id,title:o,path:`/`+a.join(`/`)}),Re(i.children??[],t,a,r)}return r}function Q(e){return/^([a-z][a-z0-9+.-]*:|\/|#|\?)/i.test(e)||ze(e)}function ze(e){return/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(e)}function Be(e){try{return JSON.parse(sessionStorage.getItem(e)??`[]`)}catch{return[]}}function $(e,t){try{t.length===0?sessionStorage.removeItem(e):sessionStorage.setItem(e,JSON.stringify(t))}catch{}}function Ve(e){return e.hasAttribute(`data-fb-field`)?`field`:e.hasAttribute(`data-fb-block`)?`block`:`area`}var He=class extends q{static properties={config:{attribute:!1},collapsed:{state:!0},busy:{state:!0},message:{state:!0},confirming:{state:!0},showAll:{state:!0},current:{state:!0},undo:{state:!0},link:{state:!0},toolbar:{state:!0}};static styles=o`
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
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: center;
            gap: var(--fb-space-2);
            inline-size: max-content;
            max-inline-size: calc(100vw - 2 * var(--fb-space-4));
            padding: var(--fb-space-2);
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

        .brand {
            display: flex;
            align-items: center;
            padding-inline: var(--fb-space-2);
            font-weight: var(--fb-weight-bold);
            font-size: var(--fb-text-md);
        }

        .brand img { block-size: var(--fb-size-icon); inline-size: auto; }

        .divider {
            align-self: stretch;
            inline-size: var(--fb-size-border);
            background: var(--fb-border);
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

        .badge {
            display: inline-flex;
            align-items: center;
            gap: var(--fb-space-1);
            padding: var(--fb-space-1) var(--fb-space-2);
            border-radius: var(--fb-radius-full);
            font-size: var(--fb-text-xs);
            font-weight: var(--fb-weight-semibold);
        }

        .badge::before {
            content: "";
            inline-size: var(--fb-size-dot);
            block-size: var(--fb-size-dot);
            border-radius: var(--fb-radius-full);
            background: currentcolor;
        }

        .badge[data-status="published"] { background: var(--fb-success-bg); color: var(--fb-success-text); }
        .badge[data-status="draft"], .badge[data-status="changed"] { background: var(--fb-warning-bg); color: var(--fb-warning-text); }
        .badge.locked { background: var(--fb-danger-bg); color: var(--fb-danger-text); }
        .badge.locked::before { display: none; }

        .note { padding-inline: var(--fb-space-2); color: var(--fb-text-muted); }

        .message {
            flex-basis: 100%;
            padding: var(--fb-space-1) var(--fb-space-2);
            text-align: center;
            color: var(--fb-text-muted);
        }

        .message:empty { display: none; }
        .message[data-tone="danger"] { color: var(--fb-danger-text); }

        .outline {
            position: absolute;
            border: var(--fb-size-focus) solid var(--fb-accent);
            border-radius: var(--fb-radius-sm);
        }

        .outline[data-kind="block"], .outline[data-kind="area"] { border-style: dashed; }
        .outline[data-kind="area"] { background: var(--fb-accent-soft); opacity: 0.8; }

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

        .message button { display: inline-flex; margin-inline-start: var(--fb-space-2); }

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

        @media (prefers-reduced-motion: reduce) {
            * { transition: none !important; }
        }
    `;constructor(){super(),this.config=null,this.collapsed=Fe(X)===`1`,this.busy=!1,this.message=null,this.confirming=!1,this.showAll=!1,this.current=null,this.undo=[],this.link=null,this.toolbar=null,this.saving=0,this.pages=null,this.editing=null,this.frame=0,this.redraw=()=>{this.frame===0&&(this.current||this.showAll||this.toolbar)&&(this.frame=requestAnimationFrame(()=>{this.frame=0,this.requestUpdate()}))},this.onPoint=e=>this.point(e.target),this.onLeave=e=>{e.relatedTarget||(this.current=null)},this.onFocus=e=>this.point(e.target)}createRenderRoot(){let e=super.createRenderRoot(),t=new CSSStyleSheet;return t.replaceSync(this.config?.tokens??``),e.adoptedStyleSheets=[t,...e.adoptedStyleSheets],e}connectedCallback(){super.connectedCallback();let e=Fe(je);(e===`light`||e===`dark`)&&(this.dataset.theme=e),this.marking&&(this.undo=Be(this.undoKey),this.editing=new Ae(this),this.editing.start(),document.addEventListener(`pointerover`,this.onPoint,!0),document.addEventListener(`pointerout`,this.onLeave,!0),document.addEventListener(`focusin`,this.onFocus,!0),addEventListener(`scroll`,this.redraw,{passive:!0,capture:!0}),addEventListener(`resize`,this.redraw,{passive:!0}))}disconnectedCallback(){super.disconnectedCallback(),this.editing?.stop(),document.removeEventListener(`pointerover`,this.onPoint,!0),document.removeEventListener(`pointerout`,this.onLeave,!0),document.removeEventListener(`focusin`,this.onFocus,!0),removeEventListener(`scroll`,this.redraw,{capture:!0}),removeEventListener(`resize`,this.redraw)}get marking(){return!!(this.config?.editing&&this.config?.marking)}get undoKey(){return Me+(this.config?.page?.id??``)}get labels(){return this.config?.labels??{}}render(){return this.config?F`${this.outlines()}${this.toolbarView()}${this.collapsed?this.round():this.bar()}${this.linkDialog()}`:R}round(){return F`<button type="button" class="round" aria-label=${this.labels.expand} title=${this.labels.expand}
            aria-expanded="false" @click=${()=>this.collapse(!1)}>${Z(`pencil`)}</button>`}bar(){let{editing:e,page:t}=this.config,n=this.labels;return F`<div class="bar" role="region" aria-label=${n.bar}>
            ${this.brand()}
            <span class="divider"></span>
            <button type="button" role="switch" aria-checked=${e?`true`:`false`} ?disabled=${this.busy}
                @click=${()=>this.toggle(!e)}>
                <span class="switch-track" aria-hidden="true"></span>${n.edit}
            </button>
            ${e?this.pageControls(t):R}
            ${t?F`<a href=${t.backend}>${Z(`external`)}${n.backend}</a>`:R}
            <button type="button" aria-label=${n.collapse} title=${n.collapse} aria-expanded="true"
                @click=${()=>this.collapse(!0)}>${Z(`collapse`)}</button>
            <p class="message" role="status" data-tone=${this.message?.tone??`info`}>${this.message?.text??``}${this.message?.reload?F`<button type="button" @click=${()=>location.reload()}>${n.reload}</button>`:R}</p>
        </div>`}brand(){let{brand:e}=this.config,t=this.isDark()?e.logoDark??e.logo:e.logo;return F`<span class="brand">${t?F`<img src=${t} alt=${e.name}>`:e.name}</span>`}pageControls(e){let t=this.labels;return e?this.confirming?F`<span class="note">${t.discardConfirm}</span>
                <button type="button" class="danger solid" ?disabled=${this.busy} @click=${()=>this.discard()}>${t.discardYes}</button>
                <button type="button" @click=${()=>{this.confirming=!1}}>${t.cancel}</button>`:F`
            <span class="badge" data-status=${e.status}><span class="visually-hidden">${t.status}: </span>${t[e.status]??e.status}</span>
            ${e.locked?F`<span class="badge locked">${Z(`lock`)}${t.locked}</span>`:R}
            ${this.config.marking?R:F`<span class="note">${t.readOnly}</span>`}
            ${this.config.marking?F`<button type="button" aria-pressed=${this.showAll?`true`:`false`}
                @click=${()=>{this.showAll=!this.showAll}}>${Z(`places`)}${t.showAll}</button>`:R}
            ${this.undo.length>0?F`<button type="button" ?disabled=${this.busy}
                @click=${()=>this.undoLast()}>${Z(`undo`)}${t.undo}</button>`:R}
            ${e.canPublish?F`<button type="button" class="primary" ?disabled=${this.busy}
                title=${e.offlineParents.length?t.offlineParents.replace(`{pages}`,e.offlineParents.join(`, `)):R}
                @click=${()=>this.publish()}>${t.publish}</button>`:R}
            ${e.canDiscard?F`<button type="button" class="danger" ?disabled=${this.busy}
                @click=${()=>{this.confirming=!0}}>${t.discard}</button>`:R}`:F`<span class="note">${t.readOnly}</span>`}outlines(){return this.marking?(this.showAll?[...document.querySelectorAll(Ne)]:this.current?[this.current]:[]).map(e=>{let t=e.getBoundingClientRect();return t.width===0&&t.height===0?R:F`<div class="outline ${t.top<24?`below`:``}" data-kind=${Ve(e)}
                style="inset-block-start: ${t.top}px; inset-inline-start: ${t.left}px; inline-size: ${t.width}px; block-size: ${t.height}px">
                <span class="label">${Le(e)}</span>
            </div>`}):R}point(e){let t=e instanceof Element?e.closest(Ne):null;t!==this.current&&(this.current=t)}isDark(){return this.dataset.theme?this.dataset.theme===`dark`:matchMedia(`(prefers-color-scheme: dark)`).matches}collapse(e){this.collapsed=e,Ie(X,e?`1`:null),this.updateComplete.then(()=>this.renderRoot.querySelector(e?`.round`:`[role="switch"]`)?.focus())}async toggle(e){this.busy=!0;let t=await this.send(this.config.toggle,new URLSearchParams({on:e?`1`:`0`}));t?.ok?this.go(e):this.fail(t)}go(e){let t=this.config.page,n=t?e?t.draftUrl:t.visitorUrl??t.backend:null;n&&new URL(n,location.href).pathname!==location.pathname?location.assign(n):location.reload()}async publish(){let e=this.config.page;this.busy=!0,await this.editing?.flushAll();let t=await this.action(`page.publish`,{ids:e.publish});this.busy=!1,t?.ok?(this.forget(),this.config={...this.config,page:{...e,status:`published`,published:!0,canPublish:!1,canDiscard:!1,offlineParents:[],visitorUrl:e.draftUrl}},this.message={tone:`info`,text:this.labels.publishDone}):this.fail(t)}async discard(){let e=this.config.page;this.busy=!0;let t=await this.action(`page.discard`,{id:e.id});t?.ok?(this.forget(),e.published?location.reload():location.assign(this.config.pages)):(this.busy=!1,this.confirming=!1,this.fail(t))}async run(e,t){this.saving++,this.message={tone:`info`,text:this.labels.saving};let n=await this.action(e,t),r=n?await n.json().catch(()=>null):null;if(this.saving--,n?.ok)return this.saving===0&&(this.message={tone:`info`,text:this.labels.saved}),{ok:!0,data:r?.data};let i=r?.errors?.[0]?.message??r?.detail??this.labels.failed;return this.message={tone:`danger`,text:i,reload:n?.status===409},{ok:!1,status:n?.status??0}}changed(e){let t=this.config.page;e&&(this.undo=[...this.undo,e],$(this.undoKey,this.undo)),this.config={...this.config,page:{...t,status:t.published?`changed`:`draft`,canPublish:t.mayPublish,canDiscard:t.mayDiscard}}}async undoLast(){this.busy=!0,await this.editing?.flushAll();let e=this.undo.at(-1),t=await this.action(`action.undo`,{id:e});t?.ok?($(this.undoKey,this.undo.slice(0,-1)),location.reload()):this.fail(t)}forget(){this.undo=[],$(this.undoKey,[])}showToolbar(e){(e.view.hasFocus()||this.link)&&(this.toolbar=e,this.requestUpdate())}hideToolbar(e){this.toolbar===e&&!this.link&&(this.toolbar=null)}focusToolbar(){this.renderRoot.querySelector(`.toolbar button`)?.focus()}toolbarView(){let e=this.toolbar;if(!e||e.isDestroyed)return R;let t=this.labels,n=e.view.coordsAtPos(e.state.selection.from),r=n.top<64,i=r?n.bottom:n.top,a=Math.max(8,Math.min(n.left,innerWidth-320)),o=t=>t(e.chain().focus()).run(),s=[[`bold`,`bold`,t.bold,()=>o(e=>e.toggleBold())],[`italic`,`italic`,t.italic,()=>o(e=>e.toggleItalic())],[`heading`,[`heading`,{level:2}],t.subheading,()=>o(e=>e.toggleHeading({level:2}))],[`list`,`bulletList`,t.bulletList,()=>o(e=>e.toggleBulletList())],[`ordered`,`orderedList`,t.orderedList,()=>o(e=>e.toggleOrderedList())],[`quote`,`blockquote`,t.quote,()=>o(e=>e.toggleBlockquote())],[`link`,`link`,t.link,()=>this.richLink(e)]];return F`<div class="toolbar ${r?`below`:``}" role="toolbar" aria-label=${t.formatting}
            style="inset-block-start: ${i}px; inset-inline-start: ${a}px"
            @keydown=${t=>this.toolbarKey(t,e)}
            @focusout=${t=>this.toolbarLeft(t,e)}>
            ${s.map(([t,n,r,i])=>F`<button type="button" aria-label=${r} title=${r} aria-pressed=${(Array.isArray(n)?e.isActive(...n):e.isActive(n))?`true`:`false`}
                    @mousedown=${e=>e.preventDefault()} @click=${i}>${Z(t)}</button>`)}
        </div>`}toolbarKey(e,t){let n=[...this.renderRoot.querySelectorAll(`.toolbar button`)],r=n.indexOf(this.renderRoot.activeElement);e.key===`Escape`?(e.preventDefault(),t.commands.focus()):(e.key===`ArrowRight`||e.key===`ArrowLeft`)&&(e.preventDefault(),n[(r+(e.key===`ArrowRight`?1:-1)+n.length)%n.length]?.focus())}toolbarLeft(e,t){let n=e.relatedTarget;!this.link&&!(n instanceof Node&&(this.renderRoot.contains(n)||t.view.dom.contains(n)))&&(this.toolbar=null)}richLink(e){let t=e.getAttributes(`link`),n=e.isActive(`link`);this.openLink({withText:!1,href:t.href??``,newWindow:t.target===`_blank`,existing:n,apply:({href:t,newWindow:r,label:i})=>{let a={href:t,target:r?`_blank`:null},o=e.chain().focus();e.state.selection.empty&&!n?o.insertContent({type:`text`,text:i,marks:[{type:`link`,attrs:a}]}):o.extendMarkRange(`link`).setLink(a),o.run()},remove:()=>e.chain().focus().extendMarkRange(`link`).unsetLink().run(),done:()=>e.commands.focus()})}openLink(e){let t=e.href.startsWith(`page:`)?{id:e.href.slice(5),title:``,path:``}:null;this.link={existing:e.href!==``,...e,query:t?``:e.href,page:t},this.loadPages(),this.updateComplete.then(()=>{this.renderRoot.querySelector(`dialog`)?.showModal(),this.renderRoot.querySelector(`dialog input`)?.focus()})}async loadPages(){if(!this.pages){try{let e=await fetch(this.config.queries+`page.tree`,{headers:{Accept:`application/json`},credentials:`same-origin`}),t=e.ok?await e.json():null;this.pages=Re(t?.data??[],this.config.language)}catch{this.pages=[]}this.requestUpdate()}}linkDialog(){let e=this.link;if(!e)return R;let t=this.labels,n=e.page?this.pages?.find(t=>t.id===e.page.id)??e.page:null,r=e.query.trim(),i=!n&&r!==``&&!Q(r),a=r.toLowerCase(),o=i&&this.pages?this.pages.filter(e=>e.title.toLowerCase().includes(a)||e.path.includes(a)).slice(0,8):[],s=n!==null||r!==``&&Q(r),c=e=>{this.link={...this.link,...e}};return F`<dialog aria-labelledby="fb-link-title" @cancel=${e=>{e.preventDefault(),this.closeLink()}}>
            <form @submit=${e=>{e.preventDefault(),this.applyLink(n,r)}}>
                <h2 id="fb-link-title">${t.link}</h2>
                ${e.withText?F`<label>${t.linkText}
                    <input type="text" .value=${e.text??``} @input=${e=>c({text:e.target.value})}></label>`:R}
                ${n?F`<div><span class="hint">${t.linkTarget}</span><div class="chosen">
                        <span>${t.linkPage}: ${n.title||n.id} <small>${n.path}</small></span>
                        <button type="button" aria-label=${t.removeLink} title=${t.removeLink}
                            @click=${()=>c({page:null,query:``})}>${Z(`close`)}</button></div></div>`:F`<label>${t.linkTarget}
                        <input type="text" .value=${e.query} autocomplete="off" aria-describedby="fb-link-hint"
                            @input=${e=>c({query:e.target.value})}></label>
                        <p class="hint" id="fb-link-hint">${t.linkHint}</p>`}
                ${i?F`<ul class="results" aria-label=${t.linkPage}>
                    ${this.pages&&o.length===0?F`<li class="hint">${t.noPages}</li>`:R}
                    ${o.map(e=>F`<li><button type="button" @click=${()=>c({page:e,query:``})}>
                        <span>${e.title}</span><small>${e.path}</small></button></li>`)}
                </ul>`:R}
                <label class="check"><input type="checkbox" .checked=${e.newWindow}
                    @change=${e=>c({newWindow:e.target.checked})}>${t.newWindow}</label>
                <div class="actions">
                    ${e.existing?F`<button type="button" class="danger" @click=${()=>this.closeLink(e.remove)}>${t.removeLink}</button>`:R}
                    <button type="button" @click=${()=>this.closeLink()}>${t.cancel}</button>
                    <button type="submit" class="primary" ?disabled=${!s}>${t.apply}</button>
                </div>
            </form>
        </dialog>`}applyLink(e,t){let n=this.link,r=e?`page:`+e.id:ze(t)?`https://`+t:t;(e||Q(t))&&this.closeLink(()=>n.apply({text:(n.text??``).trim(),href:r,newWindow:n.newWindow,label:e?.title||t}))}closeLink(e=null){let t=this.link;this.renderRoot.querySelector(`dialog`)?.close(),this.link=null,e?.(),t?.done?.()}action(e,t){return this.send(this.config.actions+e,JSON.stringify(t),`application/json`)}async send(e,t,n=null){let r={Accept:`application/json`,"X-CSRF-Token":this.config.csrf??``};n&&(r[`Content-Type`]=n);try{return await fetch(e,{method:`POST`,headers:r,body:t,credentials:`same-origin`})}catch{return null}}async fail(e){this.busy=!1;let t=e?await e.json().catch(()=>null):null;this.message={tone:`danger`,text:t?.detail??this.labels.failed}}};customElements.define(`fb-edit-bar`,He);var Ue=document.getElementById(`fb-edit-config`);if(Ue){let e=document.createElement(`fb-edit-bar`);e.config=JSON.parse(Ue.textContent??`{}`),document.body.append(e)}