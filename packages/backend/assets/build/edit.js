var e=globalThis,t=e.ShadowRoot&&(e.ShadyCSS===void 0||e.ShadyCSS.nativeShadow)&&`adoptedStyleSheets`in Document.prototype&&`replace`in CSSStyleSheet.prototype,n=Symbol(),r=new WeakMap,i=class{constructor(e,t,r){if(this._$cssResult$=!0,r!==n)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,n=this.t;if(t&&e===void 0){let t=n!==void 0&&n.length===1;t&&(e=r.get(n)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),t&&r.set(n,e))}return e}toString(){return this.cssText}},a=e=>new i(typeof e==`string`?e:e+``,void 0,n),o=(e,...t)=>new i(e.length===1?e[0]:t.reduce((t,n,r)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if(typeof e==`number`)return e;throw Error(`Value passed to 'css' function must be a 'css' function result: `+e+`. Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.`)})(n)+e[r+1],e[0]),e,n),s=(n,r)=>{if(t)n.adoptedStyleSheets=r.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let t of r){let r=document.createElement(`style`),i=e.litNonce;i!==void 0&&r.setAttribute(`nonce`,i),r.textContent=t.cssText,n.appendChild(r)}},c=t?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t=``;for(let n of e.cssRules)t+=n.cssText;return a(t)})(e):e,{is:l,defineProperty:u,getOwnPropertyDescriptor:d,getOwnPropertyNames:ee,getOwnPropertySymbols:te,getPrototypeOf:ne}=Object,f=globalThis,re=f.trustedTypes,ie=re?re.emptyScript:``,ae=f.reactiveElementPolyfillSupport,p=(e,t)=>e,m={toAttribute(e,t){switch(t){case Boolean:e=e?ie:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,t){let n=e;switch(t){case Boolean:n=e!==null;break;case Number:n=e===null?null:Number(e);break;case Object:case Array:try{n=JSON.parse(e)}catch{n=null}}return n}},oe=(e,t)=>!l(e,t),se={attribute:!0,type:String,converter:m,reflect:!1,useDefault:!1,hasChanged:oe};Symbol.metadata??=Symbol(`metadata`),f.litPropertyMetadata??=new WeakMap;var h=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=se){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let n=Symbol(),r=this.getPropertyDescriptor(e,n,t);r!==void 0&&u(this.prototype,e,r)}}static getPropertyDescriptor(e,t,n){let{get:r,set:i}=d(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:r,set(t){let a=r?.call(this);i?.call(this,t),this.requestUpdate(e,a,n)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??se}static _$Ei(){if(this.hasOwnProperty(p(`elementProperties`)))return;let e=ne(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(p(`finalized`)))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(p(`properties`))){let e=this.properties,t=[...ee(e),...te(e)];for(let n of t)this.createProperty(n,e[n])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[e,n]of t)this.elementProperties.set(e,n)}this._$Eh=new Map;for(let[e,t]of this.elementProperties){let n=this._$Eu(e,t);n!==void 0&&this._$Eh.set(n,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let n=new Set(e.flat(1/0).reverse());for(let e of n)t.unshift(c(e))}else e!==void 0&&t.push(c(e));return t}static _$Eu(e,t){let n=t.attribute;return!1===n?void 0:typeof n==`string`?n:typeof e==`string`?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let n of t.keys())this.hasOwnProperty(n)&&(e.set(n,this[n]),delete this[n]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return s(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,n){this._$AK(e,n)}_$ET(e,t){let n=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,n);if(r!==void 0&&!0===n.reflect){let i=(n.converter?.toAttribute===void 0?m:n.converter).toAttribute(t,n.type);this._$Em=e,i==null?this.removeAttribute(r):this.setAttribute(r,i),this._$Em=null}}_$AK(e,t){let n=this.constructor,r=n._$Eh.get(e);if(r!==void 0&&this._$Em!==r){let e=n.getPropertyOptions(r),i=typeof e.converter==`function`?{fromAttribute:e.converter}:e.converter?.fromAttribute===void 0?m:e.converter;this._$Em=r;let a=i.fromAttribute(t,e.type);this[r]=a??this._$Ej?.get(r)??a,this._$Em=null}}requestUpdate(e,t,n,r=!1,i){if(e!==void 0){let a=this.constructor;if(!1===r&&(i=this[e]),n??=a.getPropertyOptions(e),!((n.hasChanged??oe)(i,t)||n.useDefault&&n.reflect&&i===this._$Ej?.get(e)&&!this.hasAttribute(a._$Eu(e,n))))return;this.C(e,t,n)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:n,reflect:r,wrapped:i},a){n&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,a??t??this[e]),!0!==i||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||n||(t=void 0),this._$AL.set(e,t)),!0===r&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}let e=this.constructor.elementProperties;if(e.size>0)for(let[t,n]of e){let{wrapped:e}=n,r=this[t];!0!==e||this._$AL.has(t)||r===void 0||this.C(t,void 0,n,r)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};h.elementStyles=[],h.shadowRootOptions={mode:`open`},h[p(`elementProperties`)]=new Map,h[p(`finalized`)]=new Map,ae?.({ReactiveElement:h}),(f.reactiveElementVersions??=[]).push(`2.1.2`);var g=globalThis,ce=e=>e,_=g.trustedTypes,le=_?_.createPolicy(`lit-html`,{createHTML:e=>e}):void 0,ue=`$lit$`,v=`lit$${Math.random().toFixed(9).slice(2)}$`,y=`?`+v,de=`<${y}>`,b=document,x=()=>b.createComment(``),S=e=>e===null||typeof e!=`object`&&typeof e!=`function`,C=Array.isArray,fe=e=>C(e)||typeof e?.[Symbol.iterator]==`function`,w=`[ 	
\f\r]`,T=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,pe=/-->/g,E=/>/g,D=RegExp(`>|${w}(?:([^\\s"'>=/]+)(${w}*=${w}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,`g`),O=/'/g,k=/"/g,A=/^(?:script|style|textarea|title)$/i,j=e=>(t,...n)=>({_$litType$:e,strings:t,values:n}),M=j(1),N=j(2),P=Symbol.for(`lit-noChange`),F=Symbol.for(`lit-nothing`),me=new WeakMap,I=b.createTreeWalker(b,129);function he(e,t){if(!C(e)||!e.hasOwnProperty(`raw`))throw Error(`invalid template strings array`);return le===void 0?t:le.createHTML(t)}var ge=(e,t)=>{let n=e.length-1,r=[],i,a=t===2?`<svg>`:t===3?`<math>`:``,o=T;for(let t=0;t<n;t++){let n=e[t],s,c,l=-1,u=0;for(;u<n.length&&(o.lastIndex=u,c=o.exec(n),c!==null);)u=o.lastIndex,o===T?c[1]===`!--`?o=pe:c[1]===void 0?c[2]===void 0?c[3]!==void 0&&(o=D):(A.test(c[2])&&(i=RegExp(`</`+c[2],`g`)),o=D):o=E:o===D?c[0]===`>`?(o=i??T,l=-1):c[1]===void 0?l=-2:(l=o.lastIndex-c[2].length,s=c[1],o=c[3]===void 0?D:c[3]===`"`?k:O):o===k||o===O?o=D:o===pe||o===E?o=T:(o=D,i=void 0);let d=o===D&&e[t+1].startsWith(`/>`)?` `:``;a+=o===T?n+de:l>=0?(r.push(s),n.slice(0,l)+ue+n.slice(l)+v+d):n+v+(l===-2?t:d)}return[he(e,a+(e[n]||`<?>`)+(t===2?`</svg>`:t===3?`</math>`:``)),r]},L=class e{constructor({strings:t,_$litType$:n},r){let i;this.parts=[];let a=0,o=0,s=t.length-1,c=this.parts,[l,u]=ge(t,n);if(this.el=e.createElement(l,r),I.currentNode=this.el.content,n===2||n===3){let e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;(i=I.nextNode())!==null&&c.length<s;){if(i.nodeType===1){if(i.hasAttributes())for(let e of i.getAttributeNames())if(e.endsWith(ue)){let t=u[o++],n=i.getAttribute(e).split(v),r=/([.?@])?(.*)/.exec(t);c.push({type:1,index:a,name:r[2],strings:n,ctor:r[1]===`.`?ve:r[1]===`?`?ye:r[1]===`@`?be:B}),i.removeAttribute(e)}else e.startsWith(v)&&(c.push({type:6,index:a}),i.removeAttribute(e));if(A.test(i.tagName)){let e=i.textContent.split(v),t=e.length-1;if(t>0){i.textContent=_?_.emptyScript:``;for(let n=0;n<t;n++)i.append(e[n],x()),I.nextNode(),c.push({type:2,index:++a});i.append(e[t],x())}}}else if(i.nodeType===8){if(i.data===y)c.push({type:2,index:a});else{let e=-1;for(;(e=i.data.indexOf(v,e+1))!==-1;)c.push({type:7,index:a}),e+=v.length-1}}a++}}static createElement(e,t){let n=b.createElement(`template`);return n.innerHTML=e,n}};function R(e,t,n=e,r){if(t===P)return t;let i=r===void 0?n._$Cl:n._$Co?.[r],a=S(t)?void 0:t._$litDirective$;return i?.constructor!==a&&(i?._$AO?.(!1),a===void 0?i=void 0:(i=new a(e),i._$AT(e,n,r)),r===void 0?n._$Cl=i:(n._$Co??=[])[r]=i),i!==void 0&&(t=R(e,i._$AS(e,t.values),i,r)),t}var _e=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:n}=this._$AD,r=(e?.creationScope??b).importNode(t,!0);I.currentNode=r;let i=I.nextNode(),a=0,o=0,s=n[0];for(;s!==void 0;){if(a===s.index){let t;s.type===2?t=new z(i,i.nextSibling,this,e):s.type===1?t=new s.ctor(i,s.name,s.strings,this,e):s.type===6&&(t=new xe(i,this,e)),this._$AV.push(t),s=n[++o]}a!==s?.index&&(i=I.nextNode(),a++)}return I.currentNode=b,r}p(e){let t=0;for(let n of this._$AV)n!==void 0&&(n.strings===void 0?n._$AI(e[t]):(n._$AI(e,n,t),t+=n.strings.length-2)),t++}},z=class e{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,n,r){this.type=2,this._$AH=F,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=n,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=R(this,e,t),S(e)?e===F||e==null||e===``?(this._$AH!==F&&this._$AR(),this._$AH=F):e!==this._$AH&&e!==P&&this._(e):e._$litType$===void 0?e.nodeType===void 0?fe(e)?this.k(e):this._(e):this.T(e):this.$(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==F&&S(this._$AH)?this._$AA.nextSibling.data=e:this.T(b.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:n}=e,r=typeof n==`number`?this._$AC(e):(n.el===void 0&&(n.el=L.createElement(he(n.h,n.h[0]),this.options)),n);if(this._$AH?._$AD===r)this._$AH.p(t);else{let e=new _e(r,this),n=e.u(this.options);e.p(t),this.T(n),this._$AH=e}}_$AC(e){let t=me.get(e.strings);return t===void 0&&me.set(e.strings,t=new L(e)),t}k(t){C(this._$AH)||(this._$AH=[],this._$AR());let n=this._$AH,r,i=0;for(let a of t)i===n.length?n.push(r=new e(this.O(x()),this.O(x()),this,this.options)):r=n[i],r._$AI(a),i++;i<n.length&&(this._$AR(r&&r._$AB.nextSibling,i),n.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let t=ce(e).nextSibling;ce(e).remove(),e=t}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},B=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,n,r,i){this.type=1,this._$AH=F,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=i,n.length>2||n[0]!==``||n[1]!==``?(this._$AH=Array(n.length-1).fill(new String),this.strings=n):this._$AH=F}_$AI(e,t=this,n,r){let i=this.strings,a=!1;if(i===void 0)e=R(this,e,t,0),a=!S(e)||e!==this._$AH&&e!==P,a&&(this._$AH=e);else{let r=e,o,s;for(e=i[0],o=0;o<i.length-1;o++)s=R(this,r[n+o],t,o),s===P&&(s=this._$AH[o]),a||=!S(s)||s!==this._$AH[o],s===F?e=F:e!==F&&(e+=(s??``)+i[o+1]),this._$AH[o]=s}a&&!r&&this.j(e)}j(e){e===F?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??``)}},ve=class extends B{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===F?void 0:e}},ye=class extends B{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==F)}},be=class extends B{constructor(e,t,n,r,i){super(e,t,n,r,i),this.type=5}_$AI(e,t=this){if((e=R(this,e,t,0)??F)===P)return;let n=this._$AH,r=e===F&&n!==F||e.capture!==n.capture||e.once!==n.once||e.passive!==n.passive,i=e!==F&&(n===F||r);r&&this.element.removeEventListener(this.name,this,n),i&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH==`function`?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},xe=class{constructor(e,t,n){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=n}get _$AU(){return this._$AM._$AU}_$AI(e){R(this,e)}},Se=g.litHtmlPolyfillSupport;Se?.(L,z),(g.litHtmlVersions??=[]).push(`3.3.3`);var Ce=(e,t,n)=>{let r=n?.renderBefore??t,i=r._$litPart$;if(i===void 0){let e=n?.renderBefore??null;r._$litPart$=i=new z(t.insertBefore(x(),e),e,void 0,n??{})}return i._$AI(e),i},V=globalThis,H=class extends h{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=Ce(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return P}};H._$litElement$=!0,H.finalized=!0,V.litElementHydrateSupport?.({LitElement:H});var we=V.litElementPolyfillSupport;we?.({LitElement:H}),(V.litElementVersions??=[]).push(`4.2.2`);var Te={pencil:N`<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>`,external:N`<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>`,collapse:N`<path d="m6 9 6 6 6-6"/>`,expand:N`<path d="m9 6 6 6-6 6"/>`,lock:N`<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>`,undo:N`<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>`,bold:N`<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7z"/><path d="M7 12h7a3.5 3.5 0 0 1 0 7H7z"/>`,italic:N`<path d="M19 4h-9"/><path d="M14 20H5"/><path d="M15 4 9 20"/>`,heading:N`<path d="M6 4v16"/><path d="M18 4v16"/><path d="M6 12h12"/>`,list:N`<path d="M9 6h11"/><path d="M9 12h11"/><path d="M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>`,ordered:N`<path d="M10 6h10"/><path d="M10 12h10"/><path d="M10 18h10"/><path d="M4 4h1v4"/><path d="M4 14h2l-2 4h2"/>`,quote:N`<path d="M5 11h4v6H5zM5 11a5 5 0 0 1 4-5"/><path d="M14 11h4v6h-4zM14 11a5 5 0 0 1 4-5"/>`,link:N`<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>`,close:N`<path d="M6 6l12 12"/><path d="M18 6 6 18"/>`,up:N`<path d="M12 19V5"/><path d="m6 11 6-6 6 6"/>`,down:N`<path d="M12 5v14"/><path d="m6 13 6 6 6-6"/>`,parent:N`<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 5 5v6"/>`,copy:N`<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>`,trash:N`<path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/><path d="M9 7V4h6v3"/>`,settings:N`<path d="M4 7h10"/><path d="M18 7h2"/><path d="M4 17h4"/><path d="M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>`,plus:N`<path d="M12 5v14"/><path d="M5 12h14"/>`,image:N`<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>`,palette:N`<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.9 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="14.5" cy="7" r="1"/>`,restore:N`<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>`,warning:N`<path d="M10.3 4.2 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z"/><path d="M12 9.5v4"/><path d="M12 17v.5"/>`,places:N`<rect x="3" y="4" width="18" height="6" rx="1.5" stroke-dasharray="3 2"/><rect x="3" y="14" width="18" height="6" rx="1.5" stroke-dasharray="3 2"/>`};function U(e){return M`<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${Te[e]}</svg>`}var Ee=`fb-edit-restore:`,W=`[data-fb-block]`,G=[`headline`,`text`,`link`,`image`];function K(e){return e.parentElement?.closest(W)??null}function q(e,t){return[...(e??document).querySelectorAll(`${W}[data-fb-area="${CSS.escape(t)}"]`)].filter(t=>K(t)===e)}function De(e,t){for(let n of Object.values(e?.areas??{}))for(let e of Array.isArray(n)?n:[]){if(e?.id===t)return e;let n=De(e,t);if(n)return n}return null}function Oe(e){try{let t=sessionStorage.getItem(e);return sessionStorage.removeItem(e),t?JSON.parse(t):null}catch{return null}}function ke(e,t){try{sessionStorage.setItem(e,JSON.stringify(t))}catch{}}function Ae(e,t,n,r){for(let n of t){let t=e?.[n.name];if((n.type===`headline`||n.type===`text`)&&typeof t==`string`&&t.trim()!==``)return t}return r.entry.replace(`{number}`,String(n))}var je=o`
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

    .block-tools button {
        justify-content: center;
        min-inline-size: var(--fb-size-control-sm);
        padding-inline: var(--fb-space-1);
    }

    .block-tools button[disabled] { cursor: default; opacity: 0.4; }
    .block-tools .note { white-space: nowrap; }

    .picker-list {
        display: grid;
        gap: var(--fb-space-1);
        max-block-size: min(60vh, calc(8 * var(--fb-size-row)));
        margin: 0;
        padding: 0;
        overflow-y: auto;
        list-style: none;
    }

    .picker-list button {
        display: grid;
        gap: var(--fb-space-0);
        inline-size: 100%;
        padding-block: var(--fb-space-2);
        border-color: var(--fb-border);
        text-align: start;
    }

    .picker-list small {
        color: var(--fb-text-muted);
        font-weight: var(--fb-weight-regular);
        line-height: var(--fb-leading-snug);
    }

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
`,Me=class{constructor(e){this.bar=e,this.block=null,this.confirming=!1,this.picker=null,this.panel=null,this.blocks=null,this.layouts=null,this.busy=!1,this.onKey=e=>this.key(e),this.onClick=e=>this.click(e)}get labels(){return this.bar.labels}get restoreKey(){return Ee+(this.bar.config.page?.id??``)}start(){for(let e of document.querySelectorAll(`${W}, fb-area[data-fb-area]`))e.tabIndex<0&&(e.tabIndex=0);document.addEventListener(`keydown`,this.onKey,!0),document.addEventListener(`click`,this.onClick,!0),this.restore()}stop(){document.removeEventListener(`keydown`,this.onKey,!0),document.removeEventListener(`click`,this.onClick,!0)}restore(){let e=Oe(this.restoreKey),t=e?.block?document.querySelector(`${W}[data-fb-block="${CSS.escape(e.block)}"]`):null;if(!t)return;let n=t.getBoundingClientRect();(n.bottom<0||n.top>innerHeight)&&t.scrollIntoView({block:`center`}),t.focus({preventScroll:!0}),this.select(t),e.panel&&this.openPanel(t)}select(e){if(!(e instanceof Element)||e===this.bar||this.picker)return;let t=e.closest(W);t!==this.block&&(this.block=t,this.confirming=!1,this.bar.requestUpdate())}key(e){let t=e.target instanceof Element?e.target:null;if(!t||t===this.bar)return;if(e.key===`F10`&&e.altKey&&!t.closest(`[data-fb-type="richtext"]`)){let n=t.closest(W);n&&(e.preventDefault(),this.select(n),this.focusTools());return}let n=t.matches(`fb-area[data-fb-area]`)?t:null;n&&(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),this.openPicker(this.targetIn(n)))}click(e){let t=e.target instanceof Element?e.target.closest(`fb-area[data-fb-area]`):null;t&&(e.preventDefault(),this.openPicker(this.targetIn(t)))}targetIn(e){let t=K(e);return{parent:t?.dataset.fbBlock??null,parentName:t?.dataset.fbName??null,area:e.dataset.fbArea,after:null}}targetBelow(e){let t=K(e);return{parent:t?.dataset.fbBlock??null,parentName:t?.dataset.fbName??null,area:e.dataset.fbArea,after:e.dataset.fbBlock}}focusTools(){this.bar.updateComplete.then(()=>this.bar.renderRoot.querySelector(`.block-tools button:not([disabled])`)?.focus())}tools(){let e=this.block;if(!e?.isConnected||this.panel?.id===e.dataset.fbBlock&&this.panel.busy)return F;let t=e.getBoundingClientRect();if(t.bottom<0||t.top>innerHeight||t.width===0)return F;let n=this.labels,r=t.top<48,i=r?Math.max(t.top,0):t.top,a=Math.min(t.right,innerWidth),o=K(e),s=q(o,e.dataset.fbArea),c=s.indexOf(e),l=e.dataset.fbTitle??``,u=(e,t,n,r=!1,i=``)=>M`<button type="button" class=${i}
            aria-label=${t} title=${t} ?disabled=${r||this.busy} @click=${n}>${U(e)}</button>`,d=this.confirming?M`<span class="note">${n.removeConfirm.replace(`{block}`,l)}</span>
                <button type="button" class="danger solid" ?disabled=${this.busy} @click=${()=>this.remove(e)}>${n.removeYes}</button>
                <button type="button" @click=${()=>this.confirm(!1)}>${n.cancel}</button>`:M`
                ${o?u(`parent`,n.parentBlock,()=>this.selectParent(o)):F}
                ${u(`up`,n.moveUp,()=>this.move(e,s,c-1),c<=0)}
                ${u(`down`,n.moveDown,()=>this.move(e,s,c+1),c>=s.length-1)}
                ${u(`copy`,n.copyBlock,()=>this.copy(e))}
                ${u(`settings`,n.blockSettings,()=>this.openPanel(e))}
                ${u(`plus`,n.insertBelow,()=>this.openPicker(this.targetBelow(e)))}
                ${u(`trash`,n.removeBlock,()=>this.confirm(!0),!1,`danger`)}`;return M`<div class="block-tools ${r?`inside`:``}" role="toolbar"
            aria-label=${n.blockTools.replace(`{block}`,l)}
            style="inset-block-start: ${i}px; inset-inline-start: ${a}px"
            @keydown=${t=>this.toolsKey(t,e)}>${d}</div>`}confirm(e){this.confirming=e,this.bar.requestUpdate(),this.focusTools()}toolsKey(e,t){let n=[...this.bar.renderRoot.querySelectorAll(`.block-tools button:not([disabled])`)],r=n.indexOf(this.bar.renderRoot.activeElement);e.key===`Escape`?(e.preventDefault(),this.confirming=!1,this.bar.requestUpdate(),t.focus()):(e.key===`ArrowRight`||e.key===`ArrowLeft`)&&(e.preventDefault(),n[(r+(e.key===`ArrowRight`?1:-1)+n.length)%n.length]?.focus())}selectParent(e){e.focus({preventScroll:!0}),this.select(e),this.focusTools()}async move(e,t,n){let r=K(e),i=t.filter(t=>t!==e),a=n>0?i[n-1].dataset.fbBlock:null;await this.change(`page.move-block`,{block:e.dataset.fbBlock,parent:r?.dataset.fbBlock??null,area:e.dataset.fbArea,after:a},()=>e.dataset.fbBlock)}async copy(e){await this.change(`page.copy-block`,{block:e.dataset.fbBlock},e=>e.block)}async remove(e){let t=K(e),n=q(t,e.dataset.fbArea),r=n.indexOf(e),i=n[r+1]??n[r-1]??t;await this.change(`page.remove-block`,{block:e.dataset.fbBlock},()=>i?.dataset.fbBlock??null)}async change(e,t,n,r=!1){this.busy=!0,this.bar.requestUpdate(),await this.bar.editing?.flushAll();let i=await this.bar.run(e,{id:this.bar.config.page.id,language:this.bar.config.language,...t});return i.ok?(this.bar.changed(i.data?.entry??null),ke(this.restoreKey,{block:n(i.data??{}),panel:r}),location.reload(),!0):(this.busy=!1,this.confirming=!1,this.panel&&={...this.panel,busy:!1},this.bar.requestUpdate(),!1)}async query(e,t=null){let n=t?`?`+new URLSearchParams(t):``;try{let t=await fetch(this.bar.config.queries+e+n,{headers:{Accept:`application/json`},credentials:`same-origin`});return t.ok?(await t.json()).data:null}catch{return null}}async describe(){if(!this.blocks){let[e,t]=await Promise.all([this.query(`block.list`),this.query(`layout.list`)]);this.blocks=e??[],this.layouts=t??[]}}async pageData(){let e=await this.query(`page.show`,{id:this.bar.config.page.id});return e?.draft??e?.published??null}async openPicker(e){this.picker={...e,query:``,loading:!0,info:null},this.bar.requestUpdate(),await this.bar.updateComplete,this.bar.renderRoot.querySelector(`dialog.picker`)?.showModal();let[,t]=await Promise.all([this.describe(),e.parentName?null:this.pageData()]);if(!this.picker)return;let n=(e.parentName?this.blocks.find(t=>t.name===e.parentName):this.layouts.find(e=>e.name===t?.layout))?.areas?.find(t=>t.name===e.area)??null,r=q(e.parent?document.querySelector(`${W}[data-fb-block="${CSS.escape(e.parent)}"]`):null,e.area).length,i=this.blocks.filter(e=>n?.allow?n.allow.includes(e.name):!e.widget);this.picker={...this.picker,loading:!1,info:n,full:n?.max!=null&&r>=n.max,choices:i},this.bar.requestUpdate(),await this.bar.updateComplete,this.bar.renderRoot.querySelector(`dialog.picker :is(input, .picker-list button)`)?.focus()}closePicker(){let e=this.picker;this.bar.renderRoot.querySelector(`dialog.picker`)?.close(),this.picker=null,this.bar.requestUpdate();let t=e?.after??e?.parent;(t?document.querySelector(`${W}[data-fb-block="${CSS.escape(t)}"]`):null)?.focus({preventScroll:!0})}pickerDialog(){let e=this.picker;if(!e)return F;let t=this.labels,n=e.query.trim().toLowerCase(),r=(e.choices??[]).filter(e=>n===``||e.title.toLowerCase().includes(n)||e.description.toLowerCase().includes(n)),i=e.info?.label||e.area,a;return a=e.loading?M`<p class="hint">${t.loading}</p>`:e.full?M`<p class="hint">${t.areaFull.replace(`{area}`,i)}</p>`:(e.choices??[]).length===0?M`<p class="hint">${t.noBlocks}</p>`:M`
                ${e.choices.length>6?M`<label>${t.search}
                    <input type="text" .value=${e.query} autocomplete="off"
                        @input=${e=>{this.picker={...this.picker,query:e.target.value},this.bar.requestUpdate()}}></label>`:F}
                <ul class="picker-list">
                    ${r.map(e=>M`<li><button type="button" ?disabled=${this.busy} @click=${()=>this.add(e)}>
                        <span>${e.title}</span>${e.description?M`<small>${e.description}</small>`:F}</button></li>`)}
                    ${r.length===0?M`<li class="hint">${t.noBlocks}</li>`:F}
                </ul>`,M`<dialog class="picker" aria-labelledby="fb-picker-title" @cancel=${e=>{e.preventDefault(),this.closePicker()}}>
            <form @submit=${e=>e.preventDefault()}>
                <h2 id="fb-picker-title">${t.addBlock}</h2>
                ${i?M`<p class="hint">${t.intoArea.replace(`{area}`,i)}</p>`:F}
                ${a}
                <div class="actions"><button type="button" @click=${()=>this.closePicker()}>${t.cancel}</button></div>
            </form>
        </dialog>`}async add(e){let t=this.picker;await this.change(`page.add-block`,{name:e.name,parent:t.parent,area:t.area,after:t.after},e=>e.block)}async openPanel(e){let t=e.dataset.fbBlock;this.bar.design?.hide(),this.panel={id:t,title:e.dataset.fbTitle??``,loading:!0,busy:!1},this.bar.requestUpdate();let[,n]=await Promise.all([this.describe(),this.pageData()]),r=De(n?.translations?.[this.bar.config.language]?.content??null,t),i=this.blocks.find(t=>t.name===(r?.block??e.dataset.fbName))??null;this.panel?.id===t&&(this.panel={...this.panel,loading:!1,data:r,summary:i},this.bar.requestUpdate(),await this.bar.updateComplete,this.bar.renderRoot.querySelector(`.panel h2`)?.focus())}closePanel(){let e=this.panel?.id;this.panel=null,this.bar.requestUpdate(),(e?document.querySelector(`${W}[data-fb-block="${CSS.escape(e)}"]`):null)?.focus({preventScroll:!0})}panelView(){let e=this.panel;if(!e)return F;let t=this.labels,n;return n=e.loading?M`<p class="hint">${t.loading}</p>`:!e.data||!e.summary?M`<p class="hint">${t.blockGone}</p>`:this.settings(e.data,e.summary),M`<section class="panel" role="region" aria-labelledby="fb-panel-title"
            @keydown=${e=>{e.key===`Escape`&&(e.preventDefault(),this.closePanel())}}>
            <header>
                <h2 id="fb-panel-title" tabindex="-1">${t.settingsOf.replace(`{block}`,e.title)}</h2>
                <button type="button" aria-label=${t.close} title=${t.close} @click=${()=>this.closePanel()}>${U(`close`)}</button>
            </header>
            <form @submit=${e=>e.preventDefault()}>
                <fieldset ?disabled=${e.busy}>${n}</fieldset>
            </form>
        </section>`}settings(e,t){let n=this.labels,r=e.variant??`Default`,i=t.variants.find(e=>e.name===r)??t.variants[0],a=i?.options??[],o=t.fields.filter(e=>G.includes(e.type)),s=t.fields.filter(e=>e.type===`list`);return t.variants.length<=1&&a.length===0&&o.length===0&&s.length===0?M`<p class="hint">${n.noSettings}</p>`:M`
            ${t.variants.length>1?M`<fieldset>
                <legend>${n.variant}</legend>
                ${t.variants.map(n=>M`<label class="choice">
                    <input type="radio" name="variant" .value=${n.name} .checked=${n.name===i?.name}
                        @change=${()=>this.setVariant(e,t,n)}>
                    <span>${n.title}${n.description?M`<small>${n.description}</small>`:F}</span>
                </label>`)}
            </fieldset>`:F}
            ${a.length>0?M`<fieldset>
                <legend>${n.options}</legend>
                ${a.map(t=>this.optionInput(e,t))}
            </fieldset>`:F}
            ${o.length>0?M`<fieldset>
                <legend>${n.content}</legend>
                ${o.map(t=>this.fieldInput(e,t,t.name,e.fields?.[t.name]??null))}
            </fieldset>`:F}
            ${s.map(t=>this.listView(e,t))}`}optionInput(e,t){let n=e.options?.[t.name]??t.default,r=n=>this.setOption(e,t.name,n),i=t.description?M`<small class="hint">${t.description}</small>`:F;switch(t.type){case`boolean`:return M`<label class="check"><input type="checkbox" .checked=${n===!0}
                    @change=${e=>r(e.target.checked)}>${t.label}</label>`;case`choice`:return M`<label>${t.label}
                    <select @change=${e=>r(e.target.value)}>
                        ${t.choices.map(e=>M`<option .value=${String(e.value)} ?selected=${String(e.value)===String(n)}>${e.label}</option>`)}
                    </select>${i}</label>`;case`number`:return M`<label>${t.label}
                    <input type="number" .value=${String(n??``)} min=${t.min??F} max=${t.max??F}
                        @change=${e=>r(e.target.value===``?t.default:Number(e.target.value))}>${i}</label>`;default:return M`<label>${t.label}
                    <input type="text" .value=${String(n??``)}
                        @change=${e=>r(e.target.value)}>${i}</label>`}}fieldInput(e,t,n,r){if(t.type===`link`){let i=r?r.text||r.target||r.url:this.labels.noLink;return M`<div><span class="hint">${t.label}</span>
                <button type="button" class="link-field" @click=${()=>this.editLink(e,n,r)}>
                    <span>${i}</span>${U(`link`)}</button></div>`}if(t.type===`image`)return M`<div><span class="hint">${t.label}</span>
                <button type="button" class="link-field" @click=${()=>this.editImage(e,n,r)}>
                    <span>${r?.media?this.labels.imageChosen:this.labels.noImage}</span>${U(`image`)}</button></div>`;let i=t=>{let i=t.target.value.trim()===``?null:t.target.value;this.setField(e,n,r,i)};return M`<label>${t.label}
            ${t.type===`text`?M`<textarea rows="3" .value=${r??``} @change=${i}></textarea>`:M`<input type="text" .value=${r??``} @change=${i}
                    @keydown=${e=>{e.key===`Enter`&&(e.preventDefault(),e.target.blur())}}>`}
        </label>`}listView(e,t){let n=this.labels,r=Array.isArray(e.fields?.[t.name])?e.fields[t.name]:[],i=t.fields.filter(e=>G.includes(e.type)),a=this.panel.open??[],o=r.length-1,s=e=>{this.panel={...this.panel,open:a.includes(e)?a.filter(t=>t!==e):[...a,e]},this.bar.requestUpdate()};return M`<fieldset>
            <legend>${t.label}</legend>
            <ol class="entries">
                ${r.map((r,c)=>{let l=Ae(r,t.fields,c+1,n),u=`${t.name}/${c}`,d=a.includes(u);return M`<li>
                        <div class="entry-head">
                            ${i.length>0?M`<button type="button" class="entry-toggle" aria-expanded=${d?`true`:`false`}
                                    @click=${()=>s(u)}>${U(d?`collapse`:`expand`)}<span>${l}</span></button>`:M`<span class="entry-toggle">${l}</span>`}
                            <button type="button" aria-label="${n.moveUp}: ${l}" title=${n.moveUp} ?disabled=${c===0}
                                @click=${()=>this.listChange(`page.move-list-entry`,e,{path:u,to:c-1})}>${U(`up`)}</button>
                            <button type="button" aria-label="${n.moveDown}: ${l}" title=${n.moveDown} ?disabled=${c===o}
                                @click=${()=>this.listChange(`page.move-list-entry`,e,{path:u,to:c+1})}>${U(`down`)}</button>
                            <button type="button" class="danger" aria-label="${n.removeEntry}: ${l}" title=${n.removeEntry}
                                @click=${()=>this.listChange(`page.remove-list-entry`,e,{path:u})}>${U(`trash`)}</button>
                        </div>
                        ${d?M`<div class="entry-fields">
                            ${i.map(t=>this.fieldInput(e,t,`${u}/${t.name}`,r?.[t.name]??null))}
                        </div>`:F}
                    </li>`})}
            </ol>
            <button type="button" class="add" @click=${()=>this.listChange(`page.add-list-entry`,e,{path:t.name})}>${U(`plus`)}${n.addEntry}</button>
        </fieldset>`}panelChange(e,t){return this.panel={...this.panel,busy:!0},this.bar.requestUpdate(),this.change(e,t,()=>this.panel.id,!0)}setVariant(e,t,n){let r=n.options.map(e=>e.name),i=Object.fromEntries(Object.entries(e.options??{}).filter(([e])=>r.includes(e)));return this.panelChange(`page.update-block`,{block:e.id,variant:n.name,options:i})}setOption(e,t,n){return this.panelChange(`page.update-block`,{block:e.id,options:{...e.options??{},[t]:n}})}setField(e,t,n,r){return(n??null)===(r??null)?null:this.panelChange(`page.update-field`,{block:e.id,path:t,value:r,previous:n})}listChange(e,t,n){return this.panelChange(e,{block:t.id,...n})}editImage(e,t,n){let r=this.bar.renderRoot.activeElement;this.bar.media.open({value:n,apply:r=>this.panelChange(`page.update-field`,{block:e.id,path:t,value:r,previous:n}),remove:()=>this.panelChange(`page.update-field`,{block:e.id,path:t,value:null,previous:n}),done:()=>r?.focus()})}editLink(e,t,n){let r=this.bar.renderRoot.activeElement;this.bar.openLink({withText:!0,text:n?.text??``,href:n?.target??n?.url??``,newWindow:n?.newWindow===!0,apply:({text:r,href:i,newWindow:a})=>{let o=i.startsWith(`page:`)?{target:i}:{url:i};r&&(o.text=r),a&&(o.newWindow=!0),this.panelChange(`page.update-field`,{block:e.id,path:t,value:o,previous:n})},remove:()=>this.panelChange(`page.update-field`,{block:e.id,path:t,value:null,previous:n}),done:()=>r?.focus()})}},Ne=400,Pe=4.5,Fe=[[`color`,`designColors`],[`font`,`designFonts`],[`length`,`designSizes`],[`choice`,`designMore`]];function J(e){let t=String(e).trim().toLowerCase();return/^#[0-9a-f]{3}$/.test(t)?[1,2,3].map(e=>parseInt(t[e]+t[e],16)):/^#[0-9a-f]{6}$/.test(t)?[1,3,5].map(e=>parseInt(t.slice(e,e+2),16)):null}function Ie([e,t,n]){let[r,i,a]=[e,t,n].map(e=>{let t=e/255;return t<=.04045?t/12.92:((t+.055)/1.055)**2.4});return .2126*r+.7152*i+.0722*a}function Le(e,t){let n=J(e),r=J(t);if(!n||!r)return null;let[i,a]=[Ie(n),Ie(r)].sort((e,t)=>t-e);return Math.round((i+.05)/(a+.05)*100)/100}var Re=class{constructor(e){this.bar=e,this.state=null,this.pending={},this.timer=null}get labels(){return this.bar.labels}get open(){return this.state!==null}async show(){this.bar.arranging?.closePanel?.(),this.state={loading:!0,design:null,busy:!1,confirming:!1},this.bar.requestUpdate();let e=null;try{let t=await fetch(this.bar.config.queries+`design.show`,{headers:{Accept:`application/json`},credentials:`same-origin`});e=t.ok?await t.json():null}catch{e=null}this.state&&(this.update({loading:!1,design:e?.data??null}),await this.bar.updateComplete,this.bar.renderRoot.querySelector(`#fb-design-title`)?.focus())}async close(){this.hide(),await this.bar.updateComplete,this.bar.renderRoot.querySelector(`[data-fb-design]`)?.focus()}hide(){this.state&&(this.flush(),this.state=null,this.bar.requestUpdate())}update(e){this.state={...this.state,...e},this.bar.requestUpdate()}token(e){return this.state?.design?.tokens.find(t=>t.name===e)??null}cssOf(e,t){return e.options.find(e=>e.value===t)?.css??t}change(e,t){let n=t??e.default;document.documentElement.style.setProperty(`--${e.name}`,this.cssOf(e,n)),this.replace(e.name,{value:n,css:this.cssOf(e,n)}),this.pending={...this.pending,[e.name]:t},clearTimeout(this.timer),this.timer=setTimeout(()=>this.flush(),Ne)}replace(e,t){let n=this.state.design;this.update({design:{...n,draft:!0,tokens:n.tokens.map(n=>n.name===e?{...n,...t}:n)}})}async flush(){clearTimeout(this.timer);let e=this.pending;if(this.pending={},Object.keys(e).length===0)return;let t=await this.bar.run(`design.update`,{tokens:e});t.ok&&this.state&&Object.keys(this.pending).length===0&&this.apply(t.data)}apply(e){for(let t of e.tokens)document.documentElement.style.setProperty(`--${t.name}`,t.css);this.update({design:e,busy:!1,confirming:!1})}async publish(){await this.flush(),this.update({busy:!0});let e=await this.bar.run(`design.publish`,{});e.ok?(this.apply(e.data),this.bar.message={tone:`success`,text:this.labels.designIsPublished}):this.update({busy:!1})}async discard(){clearTimeout(this.timer),this.pending={},this.update({busy:!0});let e=await this.bar.run(`design.discard`,{});e.ok?(this.apply(e.data),this.bar.message={tone:`info`,text:this.labels.designIsDiscarded}):this.update({busy:!1,confirming:!1})}button(){return!this.bar.config.design||!this.bar.config.editing?F:M`<button type="button" data-fb-design aria-expanded=${this.open?`true`:`false`}
            @click=${()=>this.open?this.close():this.show()}>${U(`palette`)}${this.labels.design}</button>`}view(){let e=this.state;if(!e)return F;let t=this.labels,n=e.design,r;return r=e.loading?M`<p class="hint">${t.loading}</p>`:n?n.tokens.length===0?M`<p class="hint">${t.designNone}</p>`:M`${Fe.map(([e,r])=>this.group(n.tokens.filter(t=>t.type===e),t[r]))}`:M`<p class="hint">${t.failed}</p>`,M`<section class="panel design" role="region" aria-labelledby="fb-design-title"
            @keydown=${e=>{e.key===`Escape`&&(e.preventDefault(),this.close())}}>
            <header>
                <h2 id="fb-design-title" tabindex="-1">${t.designTitle}</h2>
                <button type="button" aria-label=${t.close} title=${t.close} @click=${()=>this.close()}>${U(`close`)}</button>
            </header>
            <form @submit=${e=>e.preventDefault()}>
                ${n?M`<p class="hint" role="status">${n.draft?t.designDraft:t.designLive}</p>`:F}
                <fieldset ?disabled=${e.busy}>${r}</fieldset>
            </form>
            ${n?this.footer(n):F}
        </section>`}footer(e){let t=this.labels;return this.state.confirming?M`<footer>
                <p class="hint">${t.designDiscardConfirm}</p>
                <div class="actions">
                    <button type="button" @click=${()=>this.update({confirming:!1})}>${t.cancel}</button>
                    <button type="button" class="danger solid" ?disabled=${this.state.busy} @click=${()=>this.discard()}>${t.discardYes}</button>
                </div>
            </footer>`:M`<footer class="actions">
            ${e.draft&&this.bar.config.design.discard?M`<button type="button" class="danger" ?disabled=${this.state.busy}
                @click=${()=>this.update({confirming:!0})}>${t.designDiscard}</button>`:F}
            ${this.bar.config.design.publish?M`<button type="button" class="primary" ?disabled=${this.state.busy||!e.draft}
                @click=${()=>this.publish()}>${t.designPublish}</button>`:F}
        </footer>`}group(e,t){return e.length===0?F:M`<fieldset><legend>${t}</legend>${e.map(e=>this.field(e))}</fieldset>`}field(e){let t=`fb-design-${e.name}`,n=e.value===e.default?F:M`<button type="button" class="reset" aria-label=${this.labels.designResetOf.replace(`{token}`,e.label)} title=${this.labels.designReset}
                @click=${()=>this.change(e,null)}>${U(`restore`)}</button>`;switch(e.type){case`color`:return M`<div class="token">
                    <label for=${t}>${e.label}</label>
                    <div class="row">
                        <input type="color" id=${t} .value=${J(e.value)?e.value:`#000000`} @input=${t=>this.change(e,t.target.value)}>
                        <input type="text" class="hex" .value=${e.value} maxlength="7" spellcheck="false" aria-label=${this.labels.designHex.replace(`{token}`,e.label)}
                            @change=${t=>this.typed(e,t.target)}>
                        ${n}
                    </div>
                    ${this.contrastHint(e)}
                </div>`;case`font`:return M`<div class="token">
                    <label for=${t}>${e.label}</label>
                    <div class="row">
                        <select id=${t} style="font-family: ${e.css}" @change=${t=>this.change(e,t.target.value)}>
                            ${e.options.map(t=>M`<option value=${t.value} ?selected=${t.value===e.value} style="font-family: ${t.css}">${this.labels.fontNames?.[t.value]??t.label}</option>`)}
                        </select>
                        ${n}
                    </div>
                </div>`;case`length`:{let r=parseFloat(e.value);return M`<div class="token">
                    <label for=${t}>${e.label}</label>
                    <div class="row">
                        <input type="range" id=${t} min=${e.min??0} max=${e.max??Math.max(100,r*2)} step=${e.step??1} .value=${String(r)}
                            aria-valuetext=${`${r} ${e.unit}`} @input=${t=>this.change(e,`${t.target.value}${e.unit}`)}>
                        <output for=${t}>${r} ${e.unit}</output>
                        ${n}
                    </div>
                </div>`}default:return M`<fieldset class="token">
                    <legend>${e.label}</legend>
                    ${e.options.map(n=>M`<label class="choice"><input type="radio" name=${t} value=${n.value} .checked=${n.value===e.value}
                        @change=${()=>this.change(e,n.value)}><span>${n.label}</span></label>`)}
                    ${n}
                </fieldset>`}}typed(e,t){let n=t.value.trim();n=n.startsWith(`#`)?n:`#${n}`,J(n)?this.change(e,n.toLowerCase()):t.value=e.value}contrastHint(e){let t=e.contrast?.token;if(!t)return F;let n=this.token(t),r=n?n.css:getComputedStyle(document.documentElement).getPropertyValue(`--${t}`),i=Le(e.css,r);return i===null||i>=Pe?F:M`<p class="warning">${U(`warning`)}<span>${this.labels.designContrast.replace(`{ratio}`,i.toLocaleString(this.bar.config.language)).replace(`{other}`,n?.label??t)}</span></p>`}},ze=o`
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
`,Be=(function(){let e=typeof document<`u`&&document.createElement(`link`).relList;return e&&e.supports&&e.supports(`modulepreload`)?`modulepreload`:`preload`})(),Ve=function(e){return`/`+e},He={},Ue=function(e){return e.pathname.endsWith(`.css`)},We=function(e,t,n){if(t in e)return e[t];let r=n();if(!r){e[t]=void 0;return}let i=r.then(()=>{e[t]=void 0},n=>{throw e[t]=void 0,n});return e[t]=i,i},Ge=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e,i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}function s(e){return import.meta.resolve?new URL(import.meta.resolve(e)):new URL(e,import.meta.url)}r=o(t.map(t=>{t=Ve(t,n);let r=s(t),i=Ue(r);return We(He,r.href,()=>{if(e===void 0){e={all:new Set,styles:new Set};let t=document.getElementsByTagName(`link`);for(let n=t.length-1;n>=0;n--){let r=t[n];e.all.add(r.href),r.rel===`stylesheet`&&e.styles.add(r.href)}}if((i?e.styles:e.all).has(r.href))return;let t=document.createElement(`link`);if(t.rel=i?`stylesheet`:Be,i||(t.as=`script`),t.crossOrigin=``,t.href=r.href,a&&t.setAttribute(`nonce`,a),document.head.appendChild(t),i)return new Promise((e,n)=>{t.addEventListener(`load`,e),t.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${r}`)))})})}).filter(e=>e!==void 0))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},Y=[`headline`,`text`],Ke=1e3;function qe(e){if(e.dataset.fbValue===void 0)return null;try{return JSON.parse(e.dataset.fbValue)}catch{return null}}function Je(e,t){return JSON.stringify(X(e))===JSON.stringify(X(t))}function X(e){return Array.isArray(e)?e.map(X):e&&typeof e==`object`?Object.fromEntries(Object.keys(e).sort().map(t=>[t,X(e[t])])):e??null}function Ye(e){let t=e.dataset.fbType===`headline`,n=e.innerText.replace(/ /g,` `).replace(/\n+$/,``);return t&&(n=n.replace(/\s*\n\s*/g,` `)),n===``?null:n}var Xe=class{constructor(e){this.bar=e,this.saved=new WeakMap,this.timers=new Map,this.queues=new WeakMap,this.editors=new WeakMap,this.loading=null,this.pointer=null,this.onFocus=e=>this.focus(e),this.onBlur=e=>this.blur(e),this.onInput=e=>this.input(e),this.onKey=e=>this.key(e),this.onClick=e=>this.click(e),this.onPointer=e=>{this.pointer={left:e.clientX,top:e.clientY,at:Date.now()}},this.onLeave=e=>this.leave(e)}start(){for(let e of document.querySelectorAll(`[data-fb-field]`))Y.includes(e.dataset.fbType)&&(e.contentEditable=`plaintext-only`);document.addEventListener(`focusin`,this.onFocus,!0),document.addEventListener(`focusout`,this.onBlur,!0),document.addEventListener(`input`,this.onInput,!0),document.addEventListener(`keydown`,this.onKey,!0),document.addEventListener(`click`,this.onClick,!0),document.addEventListener(`pointerdown`,this.onPointer,!0),addEventListener(`beforeunload`,this.onLeave)}stop(){document.removeEventListener(`focusin`,this.onFocus,!0),document.removeEventListener(`focusout`,this.onBlur,!0),document.removeEventListener(`input`,this.onInput,!0),document.removeEventListener(`keydown`,this.onKey,!0),document.removeEventListener(`click`,this.onClick,!0),document.removeEventListener(`pointerdown`,this.onPointer,!0),removeEventListener(`beforeunload`,this.onLeave)}field(e){return e instanceof Element?e.closest(`[data-fb-field]`):null}savedValue(e){return this.saved.has(e)?this.saved.get(e):qe(e)}focus(e){let t=this.field(e.target);t?.dataset.fbType===`richtext`&&!this.editors.has(t)&&this.richText(t)}blur(e){let t=this.field(e.target);t&&Y.includes(t.dataset.fbType)&&this.flush(t)}input(e){let t=this.field(e.target);t&&Y.includes(t.dataset.fbType)&&this.later(t,()=>Ye(t))}key(e){let t=this.field(e.target);if(!t)return;let n=t.dataset.fbType;if(Y.includes(n))e.key===`Escape`?(e.preventDefault(),this.cancel(t),t.innerText=this.savedValue(t)??``,t.blur()):e.key===`Enter`&&n===`headline`&&(e.preventDefault(),t.blur());else if(n===`link`&&(e.key===`Enter`||e.key===` `))e.preventDefault(),this.editLink(t);else if(n===`image`&&(e.key===`Enter`||e.key===` `))e.preventDefault(),this.editImage(t);else if(n===`richtext`&&e.key===`F10`&&e.altKey)e.preventDefault(),this.bar.focusToolbar();else if(n===`richtext`&&e.key===`Escape`){let n=this.editors.get(t);n&&(e.preventDefault(),this.cancel(t),n.commands.setContent(this.savedValue(t)??{type:`doc`,content:[]},{emitUpdate:!1}),n.commands.blur(),t.blur())}}click(e){let t=this.field(e.target),n=e.target instanceof Element?e.target.closest(`a`):null;n&&(t||n.querySelector(`[data-fb-field]`))&&e.preventDefault(),t?.dataset.fbType===`link`?(e.preventDefault(),this.editLink(t)):t?.dataset.fbType===`image`&&(e.preventDefault(),this.editImage(t))}leave(e){let t=this.timers.size>0;this.flushAll(),(t||this.bar.saving>0)&&e.preventDefault()}flushAll(){let e=[...this.timers.keys()].map(e=>this.flush(e));return Promise.all(e)}later(e,t){clearTimeout(this.timers.get(e)?.timer),this.timers.set(e,{read:t,timer:setTimeout(()=>this.flush(e),Ke)})}flush(e){let t=this.timers.get(e);return t?(clearTimeout(t.timer),this.timers.delete(e),this.save(e,t.read())):Promise.resolve(!0)}cancel(e){clearTimeout(this.timers.get(e)?.timer),this.timers.delete(e)}save(e,t){let n=(this.queues.get(e)??Promise.resolve()).then(()=>this.send(e,t));return this.queues.set(e,n.catch(()=>{})),n}async send(e,t){let n=this.savedValue(e);if(Je(n,t))return!0;let r=e.dataset.fbSite!==void 0,i=r?await this.bar.run(`site.update-field`,{language:this.bar.config.language,path:e.dataset.fbField,value:t,previous:n}):await this.bar.run(`page.update-field`,{id:this.bar.config.page.id,language:this.bar.config.language,path:e.dataset.fbField,block:e.closest(`[data-fb-block]`)?.dataset.fbBlock??null,value:t,previous:n});if(!i.ok)return!1;let a=i.data;return this.saved.set(e,a.value),a.value===null?delete e.dataset.fbValue:e.dataset.fbValue=JSON.stringify(a.value),(e.dataset.fbType===`link`||e.dataset.fbType===`image`)&&(e.innerHTML=a.html),this.bar.changed(a.entry,r),!0}editLink(e){let t=this.savedValue(e)??{};this.bar.openLink({withText:!0,text:t.text??``,href:t.target??t.url??``,newWindow:t.newWindow===!0,apply:({text:t,href:n,newWindow:r})=>{let i=n.startsWith(`page:`)?{target:n}:{url:n};t&&(i.text=t),r&&(i.newWindow=!0),this.save(e,i)},remove:()=>this.save(e,null),done:()=>e.focus()})}editImage(e){this.bar.media.open({value:this.savedValue(e),apply:t=>this.save(e,t),remove:()=>this.save(e,null),done:()=>e.focus()})}async richText(e){this.loading??=Ge(()=>import(`./chunks/edit-richtext-CdZAclu1.js`),[]);let{createEditor:t,valueOf:n}=await this.loading;if(this.editors.has(e))return;let r=this.pointer&&Date.now()-this.pointer.at<2e3?this.pointer:null,i=t(e,this.savedValue(e),{update:()=>this.later(e,()=>n(i)),selection:()=>this.bar.showToolbar(i),blur:t=>{t.relatedTarget!==this.bar&&(this.flush(e),this.bar.hideToolbar(i))}});this.editors.set(e,i);let a=r?i.view.posAtCoords(r):null;e.blur(),i.commands.focus(a?a.pos:`end`,{scrollIntoView:!1})}},Ze=`image/jpeg,image/png,image/webp,image/gif`,Qe=24,$e=300,et=class{constructor(e){this.bar=e,this.state=null,this.timer=null}get labels(){return this.bar.labels}open({value:e,apply:t,remove:n,done:r}){this.state={value:e,apply:t,remove:n,done:r,chosen:e?.media??null,alt:e?.alt??``,query:``,items:[],total:0,page:0,loading:!0,uploading:null,problems:[]},this.load(1),this.bar.requestUpdate(),this.bar.updateComplete.then(()=>{this.bar.renderRoot.querySelector(`dialog.media`)?.showModal(),this.bar.renderRoot.querySelector(`dialog.media input[type="search"]`)?.focus()})}update(e){this.state={...this.state,...e},this.bar.requestUpdate()}async load(e){let t=this.state,n=new URLSearchParams({page:String(e),perPage:String(Qe)});t.query.trim()!==``&&n.set(`search`,t.query.trim()),this.update({loading:!0});let r=null;try{let e=await fetch(this.bar.config.queries+`media.list?`+n,{headers:{Accept:`application/json`},credentials:`same-origin`});r=e.ok?await e.json():null}catch{r=null}if(this.state!==null&&this.state.query===t.query){let t=r?.data?.items??[];this.update({loading:!1,page:e,total:r?.data?.total??0,items:e===1?t:[...this.state.items,...t],problems:r?[]:[this.labels.failed]})}}search(e){this.update({query:e}),clearTimeout(this.timer),this.timer=setTimeout(()=>this.load(1),$e)}async upload(e){let t=[];for(let[n,r]of e.entries()){this.update({uploading:this.labels.uploading.replace(`{done}`,String(n+1)).replace(`{total}`,String(e.length))});let i=new FormData;i.append(`file`,r,r.name);let a=await this.bar.send(this.bar.config.uploads,i),o=a?await a.json().catch(()=>null):null;if(!a?.ok){t.push(`${r.name}: ${o?.errors?.[0]?.message??o?.detail??this.labels.failed}`);continue}let s=await this.bar.run(`media.create`,{upload:o.data.upload});s.ok&&this.state?this.update({items:[s.data,...this.state.items],total:this.state.total+1,chosen:s.data.id}):s.ok||t.push(`${r.name}: ${this.bar.message?.text??this.labels.failed}`)}this.state&&this.update({uploading:null,problems:t})}choose(){let e=document.createElement(`input`);e.type=`file`,e.multiple=!0,e.accept=Ze,e.addEventListener(`change`,()=>this.upload([...e.files??[]])),e.click()}apply(){let e=this.state;if(!e?.chosen)return;let t={media:e.chosen};e.alt.trim()!==``&&(t.alt=e.alt.trim()),this.close(()=>e.apply(t))}close(e=null){let t=this.state;clearTimeout(this.timer),this.bar.renderRoot.querySelector(`dialog.media`)?.close(),this.state=null,this.bar.requestUpdate(),e?.(),t?.done?.()}dialog(){let e=this.state;if(!e)return F;let t=this.labels,n=e.items.length<e.total,r;return r=e.items.length===0?M`<p class="hint">${e.loading?t.loading:e.query.trim()===``?t.noMedia:t.noMediaFound}</p>`:M`<ul class="media-grid" aria-label=${t.mediaLibrary}>
                ${e.items.map(t=>M`<li><button type="button" aria-pressed=${String(t.id===e.chosen)}
                    @click=${()=>this.update({chosen:t.id})} @dblclick=${()=>{this.update({chosen:t.id}),this.apply()}}>
                    <img src=${t.preview} alt="" width=${t.width} height=${t.height} loading="lazy" decoding="async">
                    <span>${t.fileName}</span></button></li>`)}
            </ul>
            ${n?M`<button type="button" ?disabled=${e.loading} @click=${()=>this.load(e.page+1)}>${t.loadMore}</button>`:F}`,M`<dialog class="media" aria-labelledby="fb-media-title" @cancel=${e=>{e.preventDefault(),this.close()}}>
            <form @submit=${e=>{e.preventDefault(),this.apply()}}>
                <h2 id="fb-media-title">${t.chooseImage}</h2>
                <div class="media-tools">
                    <label>${t.search}
                        <input type="search" .value=${e.query} autocomplete="off" @input=${e=>this.search(e.target.value)}></label>
                    ${this.bar.config.mayUpload?M`<button type="button" ?disabled=${e.uploading!==null} @click=${()=>this.choose()}>${t.upload}</button>`:F}
                </div>
                <p class="hint" role="status">${e.uploading??``}</p>
                ${e.problems.length>0?M`<ul class="problems" role="alert">${e.problems.map(e=>M`<li>${e}</li>`)}</ul>`:F}
                ${r}
                <label>${t.altHere}
                    <input type="text" .value=${e.alt} maxlength="500" aria-describedby="fb-media-alt-hint"
                        @input=${e=>this.update({alt:e.target.value})}></label>
                <p class="hint" id="fb-media-alt-hint">${t.altHereHint}</p>
                <div class="actions">
                    ${e.value?M`<button type="button" class="danger" @click=${()=>this.close(e.remove)}>${t.removeImage}</button>`:F}
                    <button type="button" @click=${()=>this.close()}>${t.cancel}</button>
                    <button type="submit" class="primary" ?disabled=${!e.chosen}>${t.apply}</button>
                </div>
            </form>
        </dialog>`}},tt=o`
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
`,nt=`fb-edit-bar-collapsed`,rt=`fb-theme`,it=`fb-edit-undo:`,Z=`[data-fb-field], [data-fb-block], fb-area[data-fb-area]`;function at(e){try{return localStorage.getItem(e)}catch{return null}}function ot(e,t){try{t===null?localStorage.removeItem(e):localStorage.setItem(e,t)}catch{}}function st(e){return e.dataset.fbLabel??e.dataset.fbTitle??e.dataset.fbArea??``}function ct(e,t,n=[],r=[]){for(let i of e){let e=i.slugs?.[t]??Object.values(i.slugs??{})[0]??``,a=e?[...n,e]:n,o=i.titles?.[t]??Object.values(i.titles??{})[0]??i.id;r.push({id:i.id,title:o,path:`/`+a.join(`/`)}),ct(i.children??[],t,a,r)}return r}function Q(e){return/^([a-z][a-z0-9+.-]*:|\/|#|\?)/i.test(e)||lt(e)}function lt(e){return/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(e)}function ut(e){try{return JSON.parse(sessionStorage.getItem(e)??`[]`)}catch{return[]}}function $(e,t){try{t.length===0?sessionStorage.removeItem(e):sessionStorage.setItem(e,JSON.stringify(t))}catch{}}function dt(e){return e.hasAttribute(`data-fb-field`)?`field`:e.hasAttribute(`data-fb-block`)?`block`:`area`}var ft=class extends H{static properties={config:{attribute:!1},collapsed:{state:!0},busy:{state:!0},message:{state:!0},confirming:{state:!0},showAll:{state:!0},current:{state:!0},undo:{state:!0},link:{state:!0},toolbar:{state:!0}};static styles=[o`
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
    `,je,tt,ze];constructor(){super(),this.config=null,this.collapsed=at(nt)===`1`,this.busy=!1,this.message=null,this.confirming=!1,this.showAll=!1,this.current=null,this.undo=[],this.link=null,this.toolbar=null,this.saving=0,this.pages=null,this.editing=null,this.arranging=null,this.media=new et(this),this.design=new Re(this),this.frame=0,this.redraw=()=>{this.frame===0&&(this.current||this.showAll||this.toolbar||this.arranging?.block)&&(this.frame=requestAnimationFrame(()=>{this.frame=0,this.requestUpdate()}))},this.onPoint=e=>this.point(e.target),this.onLeave=e=>{e.relatedTarget||(this.current=null)},this.onFocus=e=>this.point(e.target)}createRenderRoot(){let e=super.createRenderRoot(),t=new CSSStyleSheet;return t.replaceSync(this.config?.tokens??``),e.adoptedStyleSheets=[t,...e.adoptedStyleSheets],e}connectedCallback(){super.connectedCallback();let e=at(rt);(e===`light`||e===`dark`)&&(this.dataset.theme=e),this.marking&&(this.undo=ut(this.undoKey),this.editing=new Xe(this),this.editing.start(),this.arranging=new Me(this),this.arranging.start(),document.addEventListener(`pointerover`,this.onPoint,!0),document.addEventListener(`pointerout`,this.onLeave,!0),document.addEventListener(`focusin`,this.onFocus,!0),addEventListener(`scroll`,this.redraw,{passive:!0,capture:!0}),addEventListener(`resize`,this.redraw,{passive:!0})),location.hash===`#fb-design`&&this.config?.design&&this.config.editing&&(history.replaceState(null,``,location.pathname+location.search),this.updateComplete.then(()=>this.design.show()))}disconnectedCallback(){super.disconnectedCallback(),this.editing?.stop(),this.arranging?.stop(),document.removeEventListener(`pointerover`,this.onPoint,!0),document.removeEventListener(`pointerout`,this.onLeave,!0),document.removeEventListener(`focusin`,this.onFocus,!0),removeEventListener(`scroll`,this.redraw,{capture:!0}),removeEventListener(`resize`,this.redraw)}updated(){let e=this.renderRoot.querySelector(`.bar, .round`),t=e?`${Math.ceil(e.getBoundingClientRect().height)}px`:`0px`;this.style.getPropertyValue(`--bar-block-size`)!==t&&(this.style.setProperty(`--bar-block-size`,t),document.body.style.paddingBlockEnd=e?`calc(${t} + 2rem)`:``)}get marking(){return!!(this.config?.editing&&this.config?.marking)}get undoKey(){return it+(this.config?.page?.id??``)}get labels(){return this.config?.labels??{}}render(){if(!this.config)return F;let e=this.arranging;return M`${this.outlines()}${e?.tools()??F}${this.toolbarView()}${e?.panelView()??F}${this.design.view()}${this.collapsed?this.round():this.bar()}${e?.pickerDialog()??F}${this.linkDialog()}${this.media.dialog()}`}round(){return M`<button type="button" class="round" aria-label=${this.labels.expand} title=${this.labels.expand}
            aria-expanded="false" @click=${()=>this.collapse(!1)}>${U(`pencil`)}</button>`}bar(){let{editing:e,page:t}=this.config,n=this.labels;return M`<div class="bar" role="region" aria-label=${n.bar}>
            ${this.brand()}
            <span class="divider"></span>
            <button type="button" role="switch" aria-checked=${e?`true`:`false`} ?disabled=${this.busy}
                @click=${()=>this.toggle(!e)}>
                <span class="switch-track" aria-hidden="true"></span>${n.edit}
            </button>
            ${e?this.pageControls(t):F}
            ${this.design.button()}
            ${t?M`<a href=${t.backend}>${U(`external`)}${n.backend}</a>`:F}
            <button type="button" aria-label=${n.collapse} title=${n.collapse} aria-expanded="true"
                @click=${()=>this.collapse(!0)}>${U(`collapse`)}</button>
            <p class="message" role="status" data-tone=${this.message?.tone??`info`}>${this.message?.text??``}${this.message?.reload?M`<button type="button" @click=${()=>location.reload()}>${n.reload}</button>`:F}</p>
        </div>`}brand(){let{brand:e}=this.config,t=this.isDark()?e.logoDark??e.logo:e.logo;return M`<span class="brand">${t?M`<img src=${t} alt=${e.name}>`:e.name}</span>`}pageControls(e){let t=this.labels;if(!e)return M`<span class="note">${t.readOnly}</span>`;if(this.confirming)return M`<span class="note">${t.discardConfirm}</span>
                <button type="button" class="danger solid" ?disabled=${this.busy} @click=${()=>this.discard()}>${t.discardYes}</button>
                <button type="button" @click=${()=>{this.confirming=!1}}>${t.cancel}</button>`;let n=this.siteDraft,r=e.status===`published`&&n?`changed`:e.status,i=e.canPublish||n&&this.config.site.publish,a=e.canDiscard||n&&this.config.site.discard;return M`
            <span class="badge" data-status=${r}><span class="visually-hidden">${t.status}: </span>${t[r]??r}</span>
            ${e.locked?M`<span class="badge locked">${U(`lock`)}${t.locked}</span>`:F}
            ${this.config.marking?F:M`<span class="note">${t.readOnly}</span>`}
            ${this.config.marking?M`<button type="button" aria-pressed=${this.showAll?`true`:`false`}
                @click=${()=>{this.showAll=!this.showAll}}>${U(`places`)}${t.showAll}</button>`:F}
            ${this.undo.length>0?M`<button type="button" ?disabled=${this.busy}
                @click=${()=>this.undoLast()}>${U(`undo`)}${t.undo}</button>`:F}
            ${i?M`<button type="button" class="primary" ?disabled=${this.busy}
                title=${e.canPublish&&e.offlineParents.length?t.offlineParents.replace(`{pages}`,e.offlineParents.join(`, `)):F}
                @click=${()=>this.publish()}>${t.publish}</button>`:F}
            ${a?M`<button type="button" class="danger" ?disabled=${this.busy}
                @click=${()=>{this.confirming=!0}}>${t.discard}</button>`:F}`}outlines(){if(!this.marking)return F;let e=this.arranging?.block;return(this.showAll?[...document.querySelectorAll(Z)]:[...new Set([e,this.current].filter(e=>e?.isConnected))]).map(e=>{let t=e.getBoundingClientRect();return t.width===0&&t.height===0?F:M`<div class="outline ${t.top<24?`below`:``}" data-kind=${dt(e)}
                style="inset-block-start: ${t.top}px; inset-inline-start: ${t.left}px; inline-size: ${t.width}px; block-size: ${t.height}px">
                <span class="label">${st(e)}</span>
            </div>`})}point(e){this.arranging?.select(e);let t=e instanceof Element?e.closest(Z):null;t!==this.current&&(this.current=t)}isDark(){return this.dataset.theme?this.dataset.theme===`dark`:matchMedia(`(prefers-color-scheme: dark)`).matches}collapse(e){this.collapsed=e,ot(nt,e?`1`:null),this.updateComplete.then(()=>this.renderRoot.querySelector(e?`.round`:`[role="switch"]`)?.focus())}async toggle(e){this.busy=!0;let t=await this.send(this.config.toggle,new URLSearchParams({on:e?`1`:`0`}));t?.ok?this.go(e):this.fail(t)}go(e){let t=this.config.page,n=t?e?t.draftUrl:t.visitorUrl??t.backend:null;n&&new URL(n,location.href).pathname!==location.pathname?location.assign(n):location.reload()}get siteDraft(){return!!this.config?.site?.draft}async publish(){let e=this.config.page;if(this.busy=!0,await this.editing?.flushAll(),e.canPublish){let t=await this.action(`page.publish`,{ids:e.publish});if(!t?.ok){this.busy=!1,this.fail(t);return}this.config={...this.config,page:{...e,status:`published`,published:!0,canPublish:!1,canDiscard:!1,offlineParents:[],visitorUrl:e.draftUrl}}}if(this.siteDraft&&this.config.site.publish){let e=await this.action(`site.publish`,{});if(!e?.ok){this.busy=!1,this.fail(e);return}this.config={...this.config,site:{...this.config.site,draft:!1}}}this.busy=!1,this.forget(),this.message={tone:`info`,text:this.labels.publishDone}}async discard(){let e=this.config.page;this.busy=!0;let t=[...e.canDiscard?[[`page.discard`,{id:e.id}]]:[],...this.siteDraft&&this.config.site.discard?[[`site.discard`,{}]]:[]];for(let[e,n]of t){let t=await this.action(e,n);if(!t?.ok){this.busy=!1,this.confirming=!1,this.fail(t);return}}this.forget(),e.published||!e.canDiscard?location.reload():location.assign(this.config.pages)}async run(e,t){this.saving++,this.message={tone:`info`,text:this.labels.saving};let n=await this.action(e,t),r=n?await n.json().catch(()=>null):null;if(this.saving--,n?.ok)return this.saving===0&&(this.message={tone:`info`,text:this.labels.saved}),{ok:!0,data:r?.data};let i=r?.errors?.[0]?.message??r?.detail??this.labels.failed;return this.message={tone:`danger`,text:i,reload:n?.status===409},{ok:!1,status:n?.status??0}}changed(e,t=!1){let n=this.config.page;e&&(this.undo=[...this.undo,e],$(this.undoKey,this.undo)),this.config=t?{...this.config,site:{...this.config.site,draft:!0}}:{...this.config,page:{...n,status:n.published?`changed`:`draft`,canPublish:n.mayPublish,canDiscard:n.mayDiscard}}}async undoLast(){this.busy=!0,await this.editing?.flushAll();let e=this.undo.at(-1),t=await this.action(`action.undo`,{id:e});t?.ok?($(this.undoKey,this.undo.slice(0,-1)),location.reload()):this.fail(t)}forget(){this.undo=[],$(this.undoKey,[])}showToolbar(e){(e.view.hasFocus()||this.link)&&(this.toolbar=e,this.requestUpdate())}hideToolbar(e){this.toolbar===e&&!this.link&&(this.toolbar=null)}focusToolbar(){this.renderRoot.querySelector(`.toolbar button`)?.focus()}toolbarView(){let e=this.toolbar;if(!e||e.isDestroyed)return F;let t=this.labels,n=e.view.coordsAtPos(e.state.selection.from),r=n.top<64,i=r?n.bottom:n.top,a=Math.max(8,Math.min(n.left,innerWidth-320)),o=t=>t(e.chain().focus()).run(),s=[[`bold`,`bold`,t.bold,()=>o(e=>e.toggleBold())],[`italic`,`italic`,t.italic,()=>o(e=>e.toggleItalic())],[`heading`,[`heading`,{level:2}],t.subheading,()=>o(e=>e.toggleHeading({level:2}))],[`list`,`bulletList`,t.bulletList,()=>o(e=>e.toggleBulletList())],[`ordered`,`orderedList`,t.orderedList,()=>o(e=>e.toggleOrderedList())],[`quote`,`blockquote`,t.quote,()=>o(e=>e.toggleBlockquote())],[`link`,`link`,t.link,()=>this.richLink(e)]];return M`<div class="toolbar ${r?`below`:``}" role="toolbar" aria-label=${t.formatting}
            style="inset-block-start: ${i}px; inset-inline-start: ${a}px"
            @keydown=${t=>this.toolbarKey(t,e)}
            @focusout=${t=>this.toolbarLeft(t,e)}>
            ${s.map(([t,n,r,i])=>M`<button type="button" aria-label=${r} title=${r} aria-pressed=${(Array.isArray(n)?e.isActive(...n):e.isActive(n))?`true`:`false`}
                    @mousedown=${e=>e.preventDefault()} @click=${i}>${U(t)}</button>`)}
        </div>`}toolbarKey(e,t){let n=[...this.renderRoot.querySelectorAll(`.toolbar button`)],r=n.indexOf(this.renderRoot.activeElement);e.key===`Escape`?(e.preventDefault(),t.commands.focus()):(e.key===`ArrowRight`||e.key===`ArrowLeft`)&&(e.preventDefault(),n[(r+(e.key===`ArrowRight`?1:-1)+n.length)%n.length]?.focus())}toolbarLeft(e,t){let n=e.relatedTarget;!this.link&&!(n instanceof Node&&(this.renderRoot.contains(n)||t.view.dom.contains(n)))&&(this.toolbar=null)}richLink(e){let t=e.getAttributes(`link`),n=e.isActive(`link`);this.openLink({withText:!1,href:t.href??``,newWindow:t.target===`_blank`,existing:n,apply:({href:t,newWindow:r,label:i})=>{let a={href:t,target:r?`_blank`:null},o=e.chain().focus();e.state.selection.empty&&!n?o.insertContent({type:`text`,text:i,marks:[{type:`link`,attrs:a}]}):o.extendMarkRange(`link`).setLink(a),o.run()},remove:()=>e.chain().focus().extendMarkRange(`link`).unsetLink().run(),done:()=>e.commands.focus()})}openLink(e){let t=e.href.startsWith(`page:`)?{id:e.href.slice(5),title:``,path:``}:null;this.link={existing:e.href!==``,...e,query:t?``:e.href,page:t},this.loadPages(),this.updateComplete.then(()=>{this.renderRoot.querySelector(`dialog.link`)?.showModal(),this.renderRoot.querySelector(`dialog.link input`)?.focus()})}async loadPages(){if(!this.pages){try{let e=await fetch(this.config.queries+`page.tree`,{headers:{Accept:`application/json`},credentials:`same-origin`}),t=e.ok?await e.json():null;this.pages=ct(t?.data??[],this.config.language)}catch{this.pages=[]}this.requestUpdate()}}linkDialog(){let e=this.link;if(!e)return F;let t=this.labels,n=e.page?this.pages?.find(t=>t.id===e.page.id)??e.page:null,r=e.query.trim(),i=!n&&r!==``&&!Q(r),a=r.toLowerCase(),o=i&&this.pages?this.pages.filter(e=>e.title.toLowerCase().includes(a)||e.path.includes(a)).slice(0,8):[],s=n!==null||r!==``&&Q(r),c=e=>{this.link={...this.link,...e}};return M`<dialog class="link" aria-labelledby="fb-link-title" @cancel=${e=>{e.preventDefault(),this.closeLink()}}>
            <form @submit=${e=>{e.preventDefault(),this.applyLink(n,r)}}>
                <h2 id="fb-link-title">${t.link}</h2>
                ${e.withText?M`<label>${t.linkText}
                    <input type="text" .value=${e.text??``} @input=${e=>c({text:e.target.value})}></label>`:F}
                ${n?M`<div><span class="hint">${t.linkTarget}</span><div class="chosen">
                        <span>${t.linkPage}: ${n.title||n.id} <small>${n.path}</small></span>
                        <button type="button" aria-label=${t.removeLink} title=${t.removeLink}
                            @click=${()=>c({page:null,query:``})}>${U(`close`)}</button></div></div>`:M`<label>${t.linkTarget}
                        <input type="text" .value=${e.query} autocomplete="off" aria-describedby="fb-link-hint"
                            @input=${e=>c({query:e.target.value})}></label>
                        <p class="hint" id="fb-link-hint">${t.linkHint}</p>`}
                ${i?M`<ul class="results" aria-label=${t.linkPage}>
                    ${this.pages&&o.length===0?M`<li class="hint">${t.noPages}</li>`:F}
                    ${o.map(e=>M`<li><button type="button" @click=${()=>c({page:e,query:``})}>
                        <span>${e.title}</span><small>${e.path}</small></button></li>`)}
                </ul>`:F}
                <label class="check"><input type="checkbox" .checked=${e.newWindow}
                    @change=${e=>c({newWindow:e.target.checked})}>${t.newWindow}</label>
                <div class="actions">
                    ${e.existing?M`<button type="button" class="danger" @click=${()=>this.closeLink(e.remove)}>${t.removeLink}</button>`:F}
                    <button type="button" @click=${()=>this.closeLink()}>${t.cancel}</button>
                    <button type="submit" class="primary" ?disabled=${!s}>${t.apply}</button>
                </div>
            </form>
        </dialog>`}applyLink(e,t){let n=this.link,r=e?`page:`+e.id:lt(t)?`https://`+t:t;(e||Q(t))&&this.closeLink(()=>n.apply({text:(n.text??``).trim(),href:r,newWindow:n.newWindow,label:e?.title||t}))}closeLink(e=null){let t=this.link;this.renderRoot.querySelector(`dialog.link`)?.close(),this.link=null,e?.(),t?.done?.()}action(e,t){return this.send(this.config.actions+e,JSON.stringify(t),`application/json`)}async send(e,t,n=null){let r={Accept:`application/json`,"X-CSRF-Token":this.config.csrf??``};n&&(r[`Content-Type`]=n);try{return await fetch(e,{method:`POST`,headers:r,body:t,credentials:`same-origin`})}catch{return null}}async fail(e){this.busy=!1;let t=e?await e.json().catch(()=>null):null;this.message={tone:`danger`,text:t?.detail??this.labels.failed}}};customElements.define(`fb-edit-bar`,ft);var pt=document.getElementById(`fb-edit-config`);if(pt){let e=document.createElement(`fb-edit-bar`);e.config=JSON.parse(pt.textContent??`{}`),document.body.append(e)}