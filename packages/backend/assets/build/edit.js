import{a as e,i as t,n,o as r,r as i}from"./chunks/edit-place-Xsl8f87D.js";var a=globalThis,o=a.ShadowRoot&&(a.ShadyCSS===void 0||a.ShadyCSS.nativeShadow)&&`adoptedStyleSheets`in Document.prototype&&`replace`in CSSStyleSheet.prototype,s=Symbol(),c=new WeakMap,l=class{constructor(e,t,n){if(this._$cssResult$=!0,n!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(o&&e===void 0){let n=t!==void 0&&t.length===1;n&&(e=c.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),n&&c.set(t,e))}return e}toString(){return this.cssText}},u=e=>new l(typeof e==`string`?e:e+``,void 0,s),d=(e,...t)=>new l(e.length===1?e[0]:t.reduce((t,n,r)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if(typeof e==`number`)return e;throw Error(`Value passed to 'css' function must be a 'css' function result: `+e+`. Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.`)})(n)+e[r+1],e[0]),e,s),f=(e,t)=>{if(o)e.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let n of t){let t=document.createElement(`style`),r=a.litNonce;r!==void 0&&t.setAttribute(`nonce`,r),t.textContent=n.cssText,e.appendChild(t)}},p=o?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t=``;for(let n of e.cssRules)t+=n.cssText;return u(t)})(e):e,{is:ee,defineProperty:m,getOwnPropertyDescriptor:te,getOwnPropertyNames:ne,getOwnPropertySymbols:re,getPrototypeOf:ie}=Object,h=globalThis,ae=h.trustedTypes,oe=ae?ae.emptyScript:``,se=h.reactiveElementPolyfillSupport,g=(e,t)=>e,_={toAttribute(e,t){switch(t){case Boolean:e=e?oe:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,t){let n=e;switch(t){case Boolean:n=e!==null;break;case Number:n=e===null?null:Number(e);break;case Object:case Array:try{n=JSON.parse(e)}catch{n=null}}return n}},ce=(e,t)=>!ee(e,t),le={attribute:!0,type:String,converter:_,reflect:!1,useDefault:!1,hasChanged:ce};Symbol.metadata??=Symbol(`metadata`),h.litPropertyMetadata??=new WeakMap;var v=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=le){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let n=Symbol(),r=this.getPropertyDescriptor(e,n,t);r!==void 0&&m(this.prototype,e,r)}}static getPropertyDescriptor(e,t,n){let{get:r,set:i}=te(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:r,set(t){let a=r?.call(this);i?.call(this,t),this.requestUpdate(e,a,n)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??le}static _$Ei(){if(this.hasOwnProperty(g(`elementProperties`)))return;let e=ie(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(g(`finalized`)))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(g(`properties`))){let e=this.properties,t=[...ne(e),...re(e)];for(let n of t)this.createProperty(n,e[n])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[e,n]of t)this.elementProperties.set(e,n)}this._$Eh=new Map;for(let[e,t]of this.elementProperties){let n=this._$Eu(e,t);n!==void 0&&this._$Eh.set(n,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let n=new Set(e.flat(1/0).reverse());for(let e of n)t.unshift(p(e))}else e!==void 0&&t.push(p(e));return t}static _$Eu(e,t){let n=t.attribute;return!1===n?void 0:typeof n==`string`?n:typeof e==`string`?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let n of t.keys())this.hasOwnProperty(n)&&(e.set(n,this[n]),delete this[n]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return f(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,n){this._$AK(e,n)}_$ET(e,t){let n=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,n);if(r!==void 0&&!0===n.reflect){let i=(n.converter?.toAttribute===void 0?_:n.converter).toAttribute(t,n.type);this._$Em=e,i==null?this.removeAttribute(r):this.setAttribute(r,i),this._$Em=null}}_$AK(e,t){let n=this.constructor,r=n._$Eh.get(e);if(r!==void 0&&this._$Em!==r){let e=n.getPropertyOptions(r),i=typeof e.converter==`function`?{fromAttribute:e.converter}:e.converter?.fromAttribute===void 0?_:e.converter;this._$Em=r;let a=i.fromAttribute(t,e.type);this[r]=a??this._$Ej?.get(r)??a,this._$Em=null}}requestUpdate(e,t,n,r=!1,i){if(e!==void 0){let a=this.constructor;if(!1===r&&(i=this[e]),n??=a.getPropertyOptions(e),!((n.hasChanged??ce)(i,t)||n.useDefault&&n.reflect&&i===this._$Ej?.get(e)&&!this.hasAttribute(a._$Eu(e,n))))return;this.C(e,t,n)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:n,reflect:r,wrapped:i},a){n&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,a??t??this[e]),!0!==i||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||n||(t=void 0),this._$AL.set(e,t)),!0===r&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}let e=this.constructor.elementProperties;if(e.size>0)for(let[t,n]of e){let{wrapped:e}=n,r=this[t];!0!==e||this._$AL.has(t)||r===void 0||this.C(t,void 0,n,r)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};v.elementStyles=[],v.shadowRootOptions={mode:`open`},v[g(`elementProperties`)]=new Map,v[g(`finalized`)]=new Map,se?.({ReactiveElement:v}),(h.reactiveElementVersions??=[]).push(`2.1.2`);var y=globalThis,ue=e=>e,b=y.trustedTypes,de=b?b.createPolicy(`lit-html`,{createHTML:e=>e}):void 0,fe=`$lit$`,x=`lit$${Math.random().toFixed(9).slice(2)}$`,pe=`?`+x,me=`<${pe}>`,S=document,C=()=>S.createComment(``),w=e=>e===null||typeof e!=`object`&&typeof e!=`function`,he=Array.isArray,ge=e=>he(e)||typeof e?.[Symbol.iterator]==`function`,_e=`[ 	
\f\r]`,T=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,ve=/-->/g,ye=/>/g,E=RegExp(`>|${_e}(?:([^\\s"'>=/]+)(${_e}*=${_e}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,`g`),be=/'/g,xe=/"/g,Se=/^(?:script|style|textarea|title)$/i,Ce=e=>(t,...n)=>({_$litType$:e,strings:t,values:n}),D=Ce(1),O=Ce(2),k=Symbol.for(`lit-noChange`),A=Symbol.for(`lit-nothing`),we=new WeakMap,j=S.createTreeWalker(S,129);function Te(e,t){if(!he(e)||!e.hasOwnProperty(`raw`))throw Error(`invalid template strings array`);return de===void 0?t:de.createHTML(t)}var Ee=(e,t)=>{let n=e.length-1,r=[],i,a=t===2?`<svg>`:t===3?`<math>`:``,o=T;for(let t=0;t<n;t++){let n=e[t],s,c,l=-1,u=0;for(;u<n.length&&(o.lastIndex=u,c=o.exec(n),c!==null);)u=o.lastIndex,o===T?c[1]===`!--`?o=ve:c[1]===void 0?c[2]===void 0?c[3]!==void 0&&(o=E):(Se.test(c[2])&&(i=RegExp(`</`+c[2],`g`)),o=E):o=ye:o===E?c[0]===`>`?(o=i??T,l=-1):c[1]===void 0?l=-2:(l=o.lastIndex-c[2].length,s=c[1],o=c[3]===void 0?E:c[3]===`"`?xe:be):o===xe||o===be?o=E:o===ve||o===ye?o=T:(o=E,i=void 0);let d=o===E&&e[t+1].startsWith(`/>`)?` `:``;a+=o===T?n+me:l>=0?(r.push(s),n.slice(0,l)+fe+n.slice(l)+x+d):n+x+(l===-2?t:d)}return[Te(e,a+(e[n]||`<?>`)+(t===2?`</svg>`:t===3?`</math>`:``)),r]},M=class e{constructor({strings:t,_$litType$:n},r){let i;this.parts=[];let a=0,o=0,s=t.length-1,c=this.parts,[l,u]=Ee(t,n);if(this.el=e.createElement(l,r),j.currentNode=this.el.content,n===2||n===3){let e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;(i=j.nextNode())!==null&&c.length<s;){if(i.nodeType===1){if(i.hasAttributes())for(let e of i.getAttributeNames())if(e.endsWith(fe)){let t=u[o++],n=i.getAttribute(e).split(x),r=/([.?@])?(.*)/.exec(t);c.push({type:1,index:a,name:r[2],strings:n,ctor:r[1]===`.`?Oe:r[1]===`?`?ke:r[1]===`@`?Ae:F}),i.removeAttribute(e)}else e.startsWith(x)&&(c.push({type:6,index:a}),i.removeAttribute(e));if(Se.test(i.tagName)){let e=i.textContent.split(x),t=e.length-1;if(t>0){i.textContent=b?b.emptyScript:``;for(let n=0;n<t;n++)i.append(e[n],C()),j.nextNode(),c.push({type:2,index:++a});i.append(e[t],C())}}}else if(i.nodeType===8){if(i.data===pe)c.push({type:2,index:a});else{let e=-1;for(;(e=i.data.indexOf(x,e+1))!==-1;)c.push({type:7,index:a}),e+=x.length-1}}a++}}static createElement(e,t){let n=S.createElement(`template`);return n.innerHTML=e,n}};function N(e,t,n=e,r){if(t===k)return t;let i=r===void 0?n._$Cl:n._$Co?.[r],a=w(t)?void 0:t._$litDirective$;return i?.constructor!==a&&(i?._$AO?.(!1),a===void 0?i=void 0:(i=new a(e),i._$AT(e,n,r)),r===void 0?n._$Cl=i:(n._$Co??=[])[r]=i),i!==void 0&&(t=N(e,i._$AS(e,t.values),i,r)),t}var De=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:n}=this._$AD,r=(e?.creationScope??S).importNode(t,!0);j.currentNode=r;let i=j.nextNode(),a=0,o=0,s=n[0];for(;s!==void 0;){if(a===s.index){let t;s.type===2?t=new P(i,i.nextSibling,this,e):s.type===1?t=new s.ctor(i,s.name,s.strings,this,e):s.type===6&&(t=new je(i,this,e)),this._$AV.push(t),s=n[++o]}a!==s?.index&&(i=j.nextNode(),a++)}return j.currentNode=S,r}p(e){let t=0;for(let n of this._$AV)n!==void 0&&(n.strings===void 0?n._$AI(e[t]):(n._$AI(e,n,t),t+=n.strings.length-2)),t++}},P=class e{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,n,r){this.type=2,this._$AH=A,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=n,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=N(this,e,t),w(e)?e===A||e==null||e===``?(this._$AH!==A&&this._$AR(),this._$AH=A):e!==this._$AH&&e!==k&&this._(e):e._$litType$===void 0?e.nodeType===void 0?ge(e)?this.k(e):this._(e):this.T(e):this.$(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==A&&w(this._$AH)?this._$AA.nextSibling.data=e:this.T(S.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:n}=e,r=typeof n==`number`?this._$AC(e):(n.el===void 0&&(n.el=M.createElement(Te(n.h,n.h[0]),this.options)),n);if(this._$AH?._$AD===r)this._$AH.p(t);else{let e=new De(r,this),n=e.u(this.options);e.p(t),this.T(n),this._$AH=e}}_$AC(e){let t=we.get(e.strings);return t===void 0&&we.set(e.strings,t=new M(e)),t}k(t){he(this._$AH)||(this._$AH=[],this._$AR());let n=this._$AH,r,i=0;for(let a of t)i===n.length?n.push(r=new e(this.O(C()),this.O(C()),this,this.options)):r=n[i],r._$AI(a),i++;i<n.length&&(this._$AR(r&&r._$AB.nextSibling,i),n.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let t=ue(e).nextSibling;ue(e).remove(),e=t}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},F=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,n,r,i){this.type=1,this._$AH=A,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=i,n.length>2||n[0]!==``||n[1]!==``?(this._$AH=Array(n.length-1).fill(new String),this.strings=n):this._$AH=A}_$AI(e,t=this,n,r){let i=this.strings,a=!1;if(i===void 0)e=N(this,e,t,0),a=!w(e)||e!==this._$AH&&e!==k,a&&(this._$AH=e);else{let r=e,o,s;for(e=i[0],o=0;o<i.length-1;o++)s=N(this,r[n+o],t,o),s===k&&(s=this._$AH[o]),a||=!w(s)||s!==this._$AH[o],s===A?e=A:e!==A&&(e+=(s??``)+i[o+1]),this._$AH[o]=s}a&&!r&&this.j(e)}j(e){e===A?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??``)}},Oe=class extends F{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===A?void 0:e}},ke=class extends F{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==A)}},Ae=class extends F{constructor(e,t,n,r,i){super(e,t,n,r,i),this.type=5}_$AI(e,t=this){if((e=N(this,e,t,0)??A)===k)return;let n=this._$AH,r=e===A&&n!==A||e.capture!==n.capture||e.once!==n.once||e.passive!==n.passive,i=e!==A&&(n===A||r);r&&this.element.removeEventListener(this.name,this,n),i&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH==`function`?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},je=class{constructor(e,t,n){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=n}get _$AU(){return this._$AM._$AU}_$AI(e){N(this,e)}},Me=y.litHtmlPolyfillSupport;Me?.(M,P),(y.litHtmlVersions??=[]).push(`3.3.3`);var Ne=(e,t,n)=>{let r=n?.renderBefore??t,i=r._$litPart$;if(i===void 0){let e=n?.renderBefore??null;r._$litPart$=i=new P(t.insertBefore(C(),e),e,void 0,n??{})}return i._$AI(e),i},I=globalThis,L=class extends v{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=Ne(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return k}};L._$litElement$=!0,L.finalized=!0,I.litElementHydrateSupport?.({LitElement:L});var Pe=I.litElementPolyfillSupport;Pe?.({LitElement:L}),(I.litElementVersions??=[]).push(`4.2.2`);var Fe=120,Ie={search:`Search`,placeholder:`Search pages, media, users …`,close:`Close`,searching:`Searching …`,none:`Nothing found for “{q}”.`,found:`{count} hits`,failed:`The search did not answer. Try again.`,all:`Show all hits`,hint:`↑ ↓ to choose, ↵ to open, Esc to close`},Le=()=>/mac|iphone|ipad/i.test(navigator.userAgentData?.platform??navigator.platform??``),Re=class e extends L{static properties={src:{},shortcut:{type:Boolean},labels:{type:Object},static:{type:Boolean,reflect:!0},query:{},groups:{type:Object},state:{state:!0},active:{state:!0}};static styles=d`
        :host { display: contents; }

        dialog {
            width: min(var(--fb-size-dialog), calc(100% - var(--fb-space-8)));
            max-height: min(calc(var(--fb-size-dialog) * 1.1), calc(100% - var(--fb-space-16)));
            margin: var(--fb-space-16) auto auto;
            padding: 0;
            overflow: hidden;
            border: var(--fb-size-border) solid var(--fb-border);
            border-radius: var(--fb-radius-lg);
            background: var(--fb-surface);
            color: var(--fb-text);
            font-family: var(--fb-font-family);
            font-size: var(--fb-text-base);
            line-height: var(--fb-leading-normal);
            box-shadow: var(--fb-shadow-lg);
        }

        dialog[open] { display: flex; flex-direction: column; }

        dialog::backdrop { background: var(--fb-backdrop); }

        :host([static]) { display: block; }

        :host([static]) dialog { position: static; width: 100%; max-width: var(--fb-size-dialog); margin: 0; box-shadow: none; }

        form {
            display: flex;
            gap: var(--fb-space-3);
            align-items: center;
            padding: var(--fb-space-3) var(--fb-space-4);
            border-bottom: var(--fb-size-border) solid var(--fb-border);
        }

        svg { flex: none; inline-size: var(--fb-size-icon); block-size: var(--fb-size-icon); color: var(--fb-text-muted); }

        input {
            flex: 1;
            min-width: 0;
            min-height: var(--fb-size-control);
            border: 0;
            background: transparent;
            color: inherit;
            font: inherit;
            font-size: var(--fb-text-lg);
        }

        input:focus { outline: none; }

        input::-webkit-search-cancel-button { display: none; }

        .close {
            min-height: var(--fb-size-control-sm);
            padding: 0 var(--fb-space-3);
            border: var(--fb-size-border) solid var(--fb-border);
            border-radius: var(--fb-radius-sm);
            background: var(--fb-surface);
            color: var(--fb-text-muted);
            font: inherit;
            font-size: var(--fb-text-sm);
            cursor: pointer;
        }

        .close:hover { background: var(--fb-surface-2); color: var(--fb-text); }

        .close:focus-visible, a:focus-visible { outline: var(--fb-size-focus) solid var(--fb-focus); outline-offset: var(--fb-size-focus-offset); }

        .results { flex: 1 1 auto; min-height: 0; padding: var(--fb-space-2); overflow-y: auto; }

        .results:empty { display: none; }

        .group {
            margin: 0;
            padding: var(--fb-space-3) var(--fb-space-3) var(--fb-space-1);
            color: var(--fb-text-muted);
            font-size: var(--fb-text-xs);
            font-weight: var(--fb-weight-semibold);
            letter-spacing: var(--fb-tracking-caps);
            text-transform: uppercase;
        }

        .option {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 0 var(--fb-space-3);
            align-items: baseline;
            min-height: var(--fb-size-control);
            padding: var(--fb-space-2) var(--fb-space-3);
            border-radius: var(--fb-radius-md);
            color: var(--fb-text);
            text-decoration: none;
        }

        .option:hover { background: var(--fb-surface-2); }

        .option[aria-selected="true"] { background: var(--fb-accent-soft); color: var(--fb-accent-text); }

        .title { font-weight: var(--fb-weight-medium); overflow-wrap: anywhere; }

        .meta { color: var(--fb-text-muted); font-size: var(--fb-text-xs); }

        .excerpt {
            grid-column: 1 / -1;
            overflow: hidden;
            color: var(--fb-text-muted);
            font-size: var(--fb-text-sm);
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .footer {
            display: flex;
            flex-wrap: wrap;
            gap: var(--fb-space-2) var(--fb-space-4);
            align-items: center;
            justify-content: space-between;
            padding: var(--fb-space-3) var(--fb-space-4);
            border-top: var(--fb-size-border) solid var(--fb-border);
            color: var(--fb-text-muted);
            font-size: var(--fb-text-sm);
        }

        .footer a { color: var(--fb-accent-text); }

        .status:empty { display: none; }
    `;constructor(){super(),this.src=``,this.shortcut=!1,this.static=!1,this.labels={},this.query=``,this.groups=[],this.state=`idle`,this.active=-1,this.timer=0,this.request=null,this.onKey=this.onKey.bind(this)}connectedCallback(){super.connectedCallback(),this.static&&(this.state=`done`,this.active=0),this.shortcut&&document.addEventListener(`keydown`,this.onKey);for(let t of this.querySelectorAll(`[data-fb-keys]`))t.textContent=e.keys()}disconnectedCallback(){document.removeEventListener(`keydown`,this.onKey),super.disconnectedCallback()}get text(){return{...Ie,...this.labels}}static keys(){return Le()?`⌘ K`:`Ctrl K`}open(){let e=this.renderRoot.querySelector(`dialog`);e&&!e.open&&(e.showModal(),this.renderRoot.querySelector(`input`).select())}close(){this.renderRoot.querySelector(`dialog`)?.close()}onKey(e){e.key.toLowerCase()===`k`&&(e.metaKey||e.ctrlKey)&&!e.altKey&&!e.shiftKey&&(e.preventDefault(),this.open())}onTrigger(e){e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||(e.preventDefault(),this.open())}onInput(e){this.query=e.target.value,clearTimeout(this.timer),this.query.trim()===``?(this.request?.abort(),this.groups=[],this.state=`idle`,this.active=-1):(this.state=`searching`,this.timer=setTimeout(()=>this.find(this.query),Fe))}async find(e){this.request?.abort(),this.request=new AbortController;let t=new URL(this.src,location.href);t.searchParams.set(`q`,e);try{let n=await fetch(t,{headers:{Accept:`application/json`},credentials:`same-origin`,signal:this.request.signal});if(!n.ok)throw Error(String(n.status));let r=await n.json();if(e!==this.query)return;this.groups=Array.isArray(r?.data)?r.data:[],this.state=`done`,this.active=this.items().length>0?0:-1}catch(e){e.name!==`AbortError`&&(this.groups=[],this.state=`failed`,this.active=-1)}}items(){return this.groups.flatMap(e=>e.items??[])}onFieldKey(e){let t=this.items().length;(e.key===`ArrowDown`||e.key===`ArrowUp`)&&t>0&&(e.preventDefault(),this.active=e.key===`ArrowDown`?(this.active+1)%t:(this.active-1+t)%t,this.updateComplete.then(()=>this.renderRoot.querySelector(`[aria-selected="true"]`)?.scrollIntoView({block:`nearest`})))}onDialogKey(e){e.key===`Escape`&&!this.static&&(e.preventDefault(),e.stopPropagation(),this.close())}onSubmit(e){let t=this.items()[this.active];t&&this.state===`done`&&(e.preventDefault(),location.assign(t.url))}status(){let e=this.text,t=this.items().length;return{idle:``,searching:e.searching,failed:e.failed,done:t===0?e.none.replace(`{q}`,this.query.trim()):e.found.replace(`{count}`,String(t))}[this.state]}render(){let e=this.text,t=this.items(),n=-1;return D`
            <slot @click=${this.onTrigger}></slot>
            <dialog ?open=${this.static} aria-label=${e.search} @keydown=${this.onDialogKey} @close=${()=>this.dispatchEvent(new Event(`fb-search-close`))}>
                <form method="get" action=${this.src} role="search" @submit=${this.onSubmit}>
                    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.4-4.4"/></svg>
                    <input type="search" name="q" autocomplete="off" spellcheck="false" maxlength="200"
                        role="combobox" aria-autocomplete="list" aria-controls="results" aria-expanded=${t.length>0?`true`:`false`}
                        aria-activedescendant=${this.active>=0?`option-${this.active}`:A}
                        aria-label=${e.search} placeholder=${e.placeholder} .value=${this.query}
                        @input=${this.onInput} @keydown=${this.onFieldKey}>
                    <button class="close" type="button" @click=${this.close}>${e.close}</button>
                </form>
                <div class="results" id="results" role="listbox" aria-label=${e.search}>${this.groups.map((e,t)=>D`<div role="group" aria-labelledby="group-${t}">
                    <p class="group" id="group-${t}" role="presentation">${e.title}</p>
                    ${(e.items??[]).map(e=>{n+=1;let t=n;return D`<a class="option" id="option-${t}" role="option" href=${e.url} tabindex="-1"
                            aria-selected=${t===this.active?`true`:`false`} @mousemove=${()=>{this.active=t}}>
                            <span class="title">${e.title}</span>${e.meta?D`<span class="meta">${e.meta}</span>`:A}
                            ${e.excerpt?D`<span class="excerpt">${e.excerpt}</span>`:A}
                        </a>`})}
                </div>`)}</div>
                <div class="footer">
                    <span class="status" role="status">${this.status()}</span>
                    ${this.state===`done`&&t.length>0?D`<a href=${`${this.src}?q=${encodeURIComponent(this.query.trim())}`}>${e.all}</a>`:D`<span>${e.hint}</span>`}
                </div>
            </dialog>
        `}};customElements.define(`fb-search`,Re);var ze={help:`Help`,close:`Close`,open:`Open in the help`,loading:`Loading …`,failed:`The help could not be loaded. Try again.`,english:`This page is only available in English so far.`},Be=d`
    .prose { display: flex; flex-direction: column; gap: var(--fb-space-3); line-height: var(--fb-leading-normal); }
    .prose > * { margin: 0; }
    .prose h2 { margin-block-start: var(--fb-space-4); font-size: var(--fb-text-lg); font-weight: var(--fb-weight-bold); line-height: var(--fb-leading-snug); }
    .prose h3, .prose h4, .prose h5, .prose h6 { margin-block-start: var(--fb-space-2); font-size: var(--fb-text-md); font-weight: var(--fb-weight-semibold); }
    .prose ul, .prose ol { display: flex; flex-direction: column; gap: var(--fb-space-1); padding-inline-start: var(--fb-space-6); }
    .prose a { color: var(--fb-accent-text); }
    .prose code { padding: 0 var(--fb-space-1); border-radius: var(--fb-radius-sm); background: var(--fb-surface-2); font-family: var(--fb-font-mono); font-size: var(--fb-text-sm); }
    .prose pre { padding: var(--fb-space-3); overflow-x: auto; border-radius: var(--fb-radius-md); background: var(--fb-surface-2); }
    .prose pre code { padding: 0; background: none; }
    .prose blockquote { padding: var(--fb-space-3) var(--fb-space-4); border-inline-start: var(--fb-size-indicator) solid var(--fb-accent); border-radius: var(--fb-radius-sm); background: var(--fb-accent-soft); }
    .prose blockquote > * { margin: 0; }
    .prose img { max-inline-size: 100%; height: auto; border: var(--fb-size-border) solid var(--fb-border); border-radius: var(--fb-radius-md); }
`,Ve=class extends L{static properties={src:{},base:{},labels:{type:Object},page:{state:!0},state:{state:!0}};static styles=[Be,d`
        :host { display: contents; }

        dialog {
            position: fixed;
            inset: 0 0 0 auto;
            width: min(calc(var(--fb-size-dialog) * 0.8), 100%);
            max-width: 100%;
            height: 100%;
            max-height: 100%;
            margin: 0;
            padding: 0;
            border: 0;
            border-inline-start: var(--fb-size-border) solid var(--fb-border);
            background: var(--fb-surface);
            color: var(--fb-text);
            font-family: var(--fb-font-family);
            font-size: var(--fb-text-base);
            box-shadow: var(--fb-shadow-lg);
        }

        :host(:dir(rtl)) dialog { inset: 0 auto 0 0; }

        dialog[open] { display: flex; flex-direction: column; }

        dialog::backdrop { background: var(--fb-backdrop); }

        header {
            display: flex;
            gap: var(--fb-space-3);
            align-items: center;
            justify-content: space-between;
            padding: var(--fb-space-3) var(--fb-space-4) var(--fb-space-3) var(--fb-space-6);
            border-bottom: var(--fb-size-border) solid var(--fb-border);
        }

        h2 { margin: 0; font-size: var(--fb-text-xl); font-weight: var(--fb-weight-bold); line-height: var(--fb-leading-snug); }

        .body { flex: 1; min-height: 0; padding: var(--fb-space-6); overflow-y: auto; }

        .note, .status { margin: 0 0 var(--fb-space-4); color: var(--fb-text-muted); font-size: var(--fb-text-sm); }

        footer { padding: var(--fb-space-3) var(--fb-space-6); border-top: var(--fb-size-border) solid var(--fb-border); font-size: var(--fb-text-sm); }

        footer a { color: var(--fb-accent-text); }

        .close {
            min-height: var(--fb-size-control-sm);
            padding: 0 var(--fb-space-3);
            border: var(--fb-size-border) solid var(--fb-border);
            border-radius: var(--fb-radius-sm);
            background: var(--fb-surface);
            color: var(--fb-text-muted);
            font: inherit;
            font-size: var(--fb-text-sm);
            cursor: pointer;
        }

        .close:hover { background: var(--fb-surface-2); color: var(--fb-text); }

        .close:focus-visible, a:focus-visible { outline: var(--fb-size-focus) solid var(--fb-focus); outline-offset: var(--fb-size-focus-offset); }
    `];constructor(){super(),this.src=``,this.base=``,this.labels={},this.page=null,this.state=`idle`}get text(){return{...ze,...this.labels}}async open(e=this.src){let t=this.renderRoot.querySelector(`dialog`);t.open||t.showModal(),this.state=`loading`;try{let t=await fetch(e,{headers:{Accept:`application/json`},credentials:`same-origin`});if(!t.ok)throw Error(String(t.status));this.page=(await t.json()).data,this.state=`done`,await this.updateComplete,this.renderRoot.querySelector(`.body`).scrollTop=0,this.renderRoot.querySelector(`h2`)?.focus()}catch{this.page=null,this.state=`failed`}}close(){this.renderRoot.querySelector(`dialog`)?.close()}onTrigger(e){e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||(e.preventDefault(),this.open())}onBodyClick(e){let t=e.composedPath().find(e=>e instanceof HTMLAnchorElement);if(!t||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;let n=t.getAttribute(`href`)??``;if(n.startsWith(`#`)){e.preventDefault(),this.renderRoot.getElementById(decodeURIComponent(n.slice(1)))?.scrollIntoView({block:`start`});return}let r=new URL(t.href,location.href);this.base&&r.origin===location.origin&&r.pathname.startsWith(this.base)&&(e.preventDefault(),this.open(r.pathname).then(()=>r.hash&&this.renderRoot.getElementById(decodeURIComponent(r.hash.slice(1)))?.scrollIntoView({block:`start`})))}updated(){let e=this.renderRoot.querySelector(`.prose`);e&&this.page&&e.dataset.url!==this.page.url&&(e.innerHTML=this.page.html,e.dataset.url=this.page.url)}onKey(e){e.key===`Escape`&&(e.preventDefault(),e.stopPropagation(),this.close())}render(){let e=this.text,t=this.page;return D`
            <slot @click=${this.onTrigger}></slot>
            <dialog aria-labelledby="title" @keydown=${this.onKey}>
                <header>
                    <h2 id="title" tabindex="-1">${t?.title??e.help}</h2>
                    <button class="close" type="button" @click=${this.close}>${e.close}</button>
                </header>
                <div class="body" @click=${this.onBodyClick}>
                    ${this.state===`loading`?D`<p class="status" role="status">${e.loading}</p>`:A}
                    ${this.state===`failed`?D`<p class="status" role="alert">${e.failed}</p>`:A}
                    ${t&&t.translated===!1?D`<p class="note">${e.english}</p>`:A}
                    ${t&&this.state===`done`?D`<div class="prose"></div>`:A}
                </div>
                ${t?D`<footer><a href=${t.url}>${e.open}</a></footer>`:A}
            </dialog>
        `}};customElements.define(`fb-help`,Ve);var He={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},Ue=e=>(...t)=>({_$litDirective$:e,values:t}),We=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,n){this._$Ct=e,this._$AM=t,this._$Ci=n}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}},Ge=class extends We{constructor(e){if(super(e),this.it=A,e.type!==He.CHILD)throw Error(this.constructor.directiveName+`() can only be used in child bindings`)}render(e){if(e===A||e==null)return this._t=void 0,this.it=e;if(e===k)return e;if(typeof e!=`string`)throw Error(this.constructor.directiveName+`() called with a non-string value`);if(e===this.it)return this._t;this.it=e;let t=[e];return t.raw=t,this._t={_$litType$:this.constructor.resultType,strings:t,values:[]}}};Ge.directiveName=`unsafeHTML`,Ge.resultType=1;var Ke=class extends Ge{};Ke.directiveName=`unsafeSVG`,Ke.resultType=2;var qe=Ue(Ke),Je=e=>e.dir===`rtl`,Ye=(e,t)=>Math.max(0,Je(e)?t.left:e.clientWidth-t.right),Xe=(e,t)=>Je(e)?e.clientWidth-t:t,Ze=`[data-fb-block]`,Qe=`[data-fb-field], [data-fb-block], fb-area[data-fb-area]`,$e=/^\d+$/;function R(e){return e.parentElement?.closest(Ze)??null}function et(e){let t=e.split(`/`);return t.flatMap((e,n)=>n>0&&$e.test(e)?[t.slice(0,n+1).join(`/`)]:[])}function tt(e){let t=e[0];for(;t&&!e.every(e=>t.contains(e));)t=t.parentElement;return t}function nt(e,t){let n=new Set(e),r=t=>[...t.querySelectorAll(Qe)].some(t=>!n.has(t)&&!e.some(e=>e.contains(t))),i=tt(e);if(!i||i===t||r(i))return null;for(;i.parentElement&&i.parentElement!==t&&i.parentElement!==document.body&&!r(i.parentElement);)i=i.parentElement;for(;i.children.length===1&&e.every(e=>i.children[0].contains(e));)i=i.children[0];return i}function rt(){let e=new Map;for(let t of document.querySelectorAll(`[data-fb-field]:not([data-fb-site]):not([data-fb-object])`)){let n=R(t);for(let r of et(t.dataset.fbField)){let i=`${n?.dataset.fbBlock??``} ${r}`,a=e.get(i)??{owner:n,path:r,fields:[]};a.fields.push(t),e.set(i,a)}}for(let{owner:t,path:n,fields:r}of e.values()){let e=nt(r,t);e&&!e.hasAttribute(`data-fb-entry`)&&(e.dataset.fbEntry=n)}}function it(e){let t=e instanceof Element?e.closest(`[data-fb-entry]`):null;if(!t)return null;let n=R(t),r=t.dataset.fbEntry,i=r.slice(0,r.lastIndexOf(`/`)),a=Number(r.slice(r.lastIndexOf(`/`)+1)),o=[...(n??document).querySelectorAll(`[data-fb-entry]`)].filter(e=>R(e)===n&&e.dataset.fbEntry.startsWith(i+`/`)&&$e.test(e.dataset.fbEntry.slice(i.length+1))).sort((e,t)=>Number(e.dataset.fbEntry.slice(i.length+1))-Number(t.dataset.fbEntry.slice(i.length+1)));return{element:t,owner:n,path:r,list:i,index:a,count:o.length,siblings:o}}function at(e){let t=e.siblings.map(e=>e.getBoundingClientRect().top);return t.some((e,n)=>n>0&&Math.abs(e-t[n-1])<4)}function ot(e){return[...e.element.querySelectorAll(`[data-fb-field]`),...e.element.matches(`[data-fb-field]`)?[e.element]:[]].filter(t=>R(t)===e.owner&&t.dataset.fbField.startsWith(e.path+`/`)).sort((e,t)=>e===t?0:e.compareDocumentPosition(t)&Node.DOCUMENT_POSITION_FOLLOWING?-1:1)}var st=new Set([`page.update-field`,`page.add-list-entry`,`page.move-list-entry`,`page.remove-list-entry`,`ai.field-write`]);function ct(e,t){let n=t?document.querySelector(`${Ze}[data-fb-block="${CSS.escape(t)}"]`):null,r=null;try{r=JSON.parse(n?.dataset.fbEntries??`null`)}catch{return e}if(!r||typeof e!=`string`)return e;let i=e.split(`/`);return i.map((e,t)=>{if(t%2==0||!$e.test(e))return e;let n=r[i.slice(0,t).join(`/`)]?.[Number(e)];return typeof n==`string`?n:e}).join(`/`)}function lt(e,t){return st.has(e)&&t&&typeof t.path==`string`?{...t,path:ct(t.path,t.block)}:t}var ut={info:O`<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>`,search:O`<path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/>`,pencil:O`<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>`,external:O`<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>`,collapse:O`<path d="m6 9 6 6 6-6"/>`,expand:O`<path d="m9 18 6-6-6-6"/>`,user:O`<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`,signOut:O`<path d="m16 17 5-5-5-5"/><path d="M21 12H9"/><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>`,lock:O`<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>`,history:O`<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>`,undo:O`<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"/>`,bold:O`<path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8"/>`,italic:O`<line x1="19" x2="10" y1="4" y2="4"/><line x1="14" x2="5" y1="20" y2="20"/><line x1="15" x2="9" y1="4" y2="20"/>`,heading:O`<path d="M6 12h12"/><path d="M6 20V4"/><path d="M18 20V4"/>`,outline:O`<path d="M8 5h13"/><path d="M13 12h8"/><path d="M13 19h8"/><path d="M3 10a2 2 0 0 0 2 2h3"/><path d="M3 5v12a2 2 0 0 0 2 2h3"/>`,list:O`<path d="M3 5h.01"/><path d="M3 12h.01"/><path d="M3 19h.01"/><path d="M8 5h13"/><path d="M8 12h13"/><path d="M8 19h13"/>`,ordered:O`<path d="M11 5h10"/><path d="M11 12h10"/><path d="M11 19h10"/><path d="M4 4h1v5"/><path d="M4 9h2"/><path d="M6.5 20H3.4c0-1 2.6-1.925 2.6-3.5a1.5 1.5 0 0 0-2.6-1.02"/>`,quote:O`<path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/><path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/>`,direction:O`<path d="M10 3v11"/><path d="M10 9H7a1 1 0 0 1 0-6h8"/><path d="M14 3v11"/><path d="m18 14 4 4H2"/><path d="m22 18-4 4"/>`,link:O`<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>`,close:O`<path d="M18 6 6 18"/><path d="m6 6 12 12"/>`,left:O`<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>`,right:O`<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>`,up:O`<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>`,down:O`<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>`,parent:O`<path d="M20 20v-7a4 4 0 0 0-4-4H4"/><path d="M9 14 4 9l5-5"/>`,copy:O`<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>`,trash:O`<path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>`,eraser:O`<path d="M21 21H8a2 2 0 0 1-1.42-.587l-3.994-3.999a2 2 0 0 1 0-2.828l10-10a2 2 0 0 1 2.829 0l5.999 6a2 2 0 0 1 0 2.828L12.834 21"/><path d="m5.082 11.09 8.828 8.828"/>`,focus:O`<circle cx="12" cy="12" r="3"/><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>`,alt:O`<path d="M12 20h-1a2 2 0 0 1-2-2 2 2 0 0 1-2 2H6"/><path d="M13 8h7a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-7"/><path d="M5 16H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h1"/><path d="M6 4h1a2 2 0 0 1 2 2 2 2 0 0 1 2-2h1"/><path d="M9 6v12"/>`,settings:O`<path d="M10 5H3"/><path d="M12 19H3"/><path d="M14 3v4"/><path d="M16 17v4"/><path d="M21 12h-9"/><path d="M21 19h-5"/><path d="M21 5h-7"/><path d="M8 10v4"/><path d="M8 12H3"/>`,plus:O`<path d="M5 12h14"/><path d="M12 5v14"/>`,insertAbove:O`<path d="M5 3h14"/><path d="m18 13-6-6-6 6"/><path d="M12 7v14"/>`,image:O`<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>`,video:O`<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>`,file:O`<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>`,symbol:O`<path d="M8.3 10a.7.7 0 0 1-.626-1.079L11.4 3a.7.7 0 0 1 1.198-.043L16.3 8.9a.7.7 0 0 1-.572 1.1Z"/><rect x="3" y="14" width="7" height="7" rx="1"/><circle cx="17.5" cy="17.5" r="3.5"/>`,palette:O`<path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>`,restore:O`<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>`,warning:O`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>`,comment:O`<path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"/>`,check:O`<path d="M20 6 9 17l-5-5"/>`,more:O`<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>`,text:O`<path d="M21 5H3"/><path d="M15 12H3"/><path d="M17 19H3"/>`,header:O`<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/>`,teaser:O`<rect width="18" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/>`,callout:O`<path d="M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/><path d="M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14"/><path d="M8 6v8"/>`,form:O`<path d="M12 20h-1a2 2 0 0 1-2-2 2 2 0 0 1-2 2H6"/><path d="M13 8h7a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-7"/><path d="M5 16H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h1"/><path d="M6 4h1a2 2 0 0 1 2 2 2 2 0 0 1 2-2h1"/><path d="M9 6v12"/>`,columns:O`<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 3v18"/>`,block:O`<rect width="18" height="18" x="3" y="3" rx="2"/>`,table:O`<path d="M12 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/>`,headerRow:O`<rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M3 10h18"/><path d="M5 7h14" stroke-width="3"/><path d="M10 10v10"/>`,headerColumn:O`<rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M10 4v16"/><path d="M6.5 6v12" stroke-width="3"/><path d="M10 12h11"/>`,places:O`<rect x="3" y="4" width="18" height="6" rx="1.5" stroke-dasharray="3 2"/><rect x="3" y="14" width="18" height="6" rx="1.5" stroke-dasharray="3 2"/>`};function z(e){return D`<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ut[e]}</svg>`}var dt=`fb-edit-restore:`,B=`[data-fb-block]`,ft=[`headline`,`text`,`link`,`image`,`video`,`icon`,`file`],pt=8,mt=20,ht=`#site`,gt=`#all`,_t={header:`header`,heading:`heading`,text:`text`,media:`image`,teaser:`teaser`,callout:`callout`,list:`list`,form:`form`,structure:`columns`};function vt(e,t){return e?new URL(e,location.href).pathname.endsWith(`.svg`)?D`<span class="preview"><svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMin slice" aria-hidden="true" focusable="false"><use href="${e}#preview"></use></svg></span>`:D`<span class="preview"><img src=${e} alt="" loading="lazy" decoding="async"></span>`:D`<span class="preview none">${z(_t[t]??`block`)}</span>`}function V(e){return e.parentElement?.closest(B)??null}function yt(e,t){return[...(e??document).querySelectorAll(`${B}[data-fb-area="${CSS.escape(t)}"]`)].filter(t=>V(t)===e)}function bt(e,t){for(let n of Object.values(e?.areas??{}))for(let e of Array.isArray(n)?n:[]){if(e?.id===t)return e;let n=bt(e,t);if(n)return n}return null}function xt(e){try{let t=sessionStorage.getItem(e);return sessionStorage.removeItem(e),t?JSON.parse(t):null}catch{return null}}function St(e,t){try{sessionStorage.setItem(e,JSON.stringify(t))}catch{}}function Ct(e,t,n,r){for(let n of t){let t=e?.[n.name];if((n.type===`headline`||n.type===`text`)&&typeof t==`string`&&t.trim()!==``)return t}return r.entry.replace(`{number}`,String(n))}var wt=d`
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
        translate: 0 -100%;
    }

    .block-tools.inside { translate: none; }

    /* Inside the corner of the entry, so it does not cover the buttons of the block. */
    .entry-tools { margin-inline-end: var(--fb-space-1); translate: 0 var(--fb-space-1); }

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

        .grouped .picker-groups .lead + li:not(.lead) {
            margin-block-start: 0;
            padding-block-start: 0;
            border-block-start: 0;
            margin-inline-start: var(--fb-space-1);
            padding-inline-start: var(--fb-space-1);
            border-inline-start: var(--fb-size-border) solid var(--fb-border);
        }
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

    /* A line between "For this website" and "Show all" and the groups (decision 0202). */
    .picker-groups .lead + li:not(.lead) {
        margin-block-start: var(--fb-space-1);
        padding-block-start: var(--fb-space-1);
        border-block-start: var(--fb-size-border) solid var(--fb-border);
    }

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

    .panel .icon-choice svg {
        flex: none;
        inline-size: var(--fb-space-6);
        block-size: var(--fb-space-6);
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

    /* The history of a block (decision 0174). */
    .panel .history { display: grid; gap: var(--fb-space-4); margin: 0; padding: 0; list-style: none; }
    .panel .history li { display: grid; gap: var(--fb-space-2); }
    .panel .history p { margin: 0; }
    .panel .history-title { font-weight: var(--fb-weight-semibold); }
    .panel .history-badge { color: var(--fb-text-muted); font-size: var(--fb-text-xs); font-weight: var(--fb-weight-regular); }
    .panel .change { display: grid; gap: var(--fb-space-1); }
    .panel .change :is(.old, .new) {
        padding-inline-start: var(--fb-space-2);
        border-inline-start: calc(var(--fb-size-border) * 2) solid currentcolor;
        white-space: pre-line;
        overflow-wrap: anywhere;
    }
    .panel .change .old { color: var(--fb-danger-text); text-decoration: line-through; }
    .panel .change .new { color: var(--fb-success-text); }
    .panel .history-link { justify-self: start; border-color: var(--fb-border); }
`,Tt=class{constructor(e){this.bar=e,this.block=null,this.entry=null,this.confirming=!1,this.picker=null,this.panel=null,this.blocks=null,this.layouts=null,this.busy=!1,this.onKey=e=>this.key(e),this.onClick=e=>this.click(e)}get labels(){return this.bar.labels}get restoreKey(){return dt+(this.bar.config.page?.id??``)}start(){for(let e of document.querySelectorAll(`${B}, fb-area[data-fb-area]`))e.tabIndex<0&&(e.tabIndex=0);rt(),this.holdEmptyLists(),document.addEventListener(`keydown`,this.onKey,!0),document.addEventListener(`click`,this.onClick,!0),this.restore()}holdEmptyLists(){for(let e of document.querySelectorAll(`${B}[data-fb-empty-lists]`)){let t={};try{t=JSON.parse(e.dataset.fbEmptyLists??`{}`)}catch{continue}for(let[n,r]of Object.entries(t)){if(e.querySelector(`:scope > fb-list[data-fb-list="${CSS.escape(n)}"]`))continue;let t=document.createElement(`fb-list`);t.dataset.fbList=n,t.dataset.fbLabel=r,t.dataset.fbHint=this.labels.emptyList.replace(`{list}`,r),t.dataset.fbEmpty=``,t.tabIndex=0,t.setAttribute(`role`,`button`),t.setAttribute(`aria-label`,t.dataset.fbHint),e.append(t)}}}addFirstEntry(e){let t=e.closest(B);return this.change(`page.add-list-entry`,{block:t?.dataset.fbBlock,path:e.dataset.fbList},()=>t?.dataset.fbBlock??null,!1,`${e.dataset.fbList}/0/`)}stop(){document.removeEventListener(`keydown`,this.onKey,!0),document.removeEventListener(`click`,this.onClick,!0)}restore(){let e=xt(this.restoreKey),t=e?.block?document.querySelector(`${B}[data-fb-block="${CSS.escape(e.block)}"]`):null,n=e?.field?.endsWith(`/`)?`^=`:`=`,r=(e?.field?[...(t??document).querySelectorAll(`[data-fb-field${n}"${CSS.escape(e.field)}"]:not([data-fb-site]):not([data-fb-object])`)].find(e=>R(e)===t):null)??t;if(!r)return;let i=r.getBoundingClientRect();(i.bottom<0||i.top>innerHeight)&&r.scrollIntoView({block:`center`}),r.focus({preventScroll:!0}),this.select(r),e.panel&&!r.hasAttribute(`data-fb-missing`)&&this.openPanel(r)}select(e){if(!(e instanceof Element)||e===this.bar||this.picker)return;let t=e.closest(B),n=it(e),r=n&&n.owner===t?n:null;t!==this.block&&(this.block=t,this.confirming=!1,this.bar.requestUpdate()),r?.element!==this.entry?.element&&(this.entry=r,this.bar.requestUpdate(),r&&this.describe().then(()=>this.bar.requestUpdate()))}key(e){let t=e.target instanceof Element?e.target:null;if(!t||t===this.bar)return;if(e.key===`F10`&&e.altKey&&!t.closest(`[data-fb-type="richtext"], [data-fb-type="table"]`)){let n=t.closest(`[data-fb-field]`);n&&this.bar.hasFieldTools(n)?(e.preventDefault(),this.bar.focusFieldTools(n)):this.reachTools(t)&&e.preventDefault();return}if(t.matches(`fb-list[data-fb-list]`)&&(e.key===`Enter`||e.key===` `)){e.preventDefault(),this.addFirstEntry(t);return}let n=t.matches(`fb-area[data-fb-area]`)?t:null;n&&(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),this.openPicker(this.targetIn(n)))}reachTools(e){let t=e.closest(B),n=it(e);return n&&n.owner===t?(this.select(e),this.entryReturn=e,this.focusTools(`.entry-tools`),!0):t?(this.select(t),this.focusTools(),!0):!1}click(e){let t=e.target instanceof Element?e.target.closest(`fb-list[data-fb-list]`):null;if(t){e.preventDefault(),this.addFirstEntry(t);return}let n=e.target instanceof Element?e.target.closest(`fb-area[data-fb-area]`):null;n&&(e.preventDefault(),this.openPicker(this.targetIn(n)))}targetIn(e){let t=V(e);return{parent:t?.dataset.fbBlock??null,parentName:t?.dataset.fbName??null,area:e.dataset.fbArea,after:null}}targetAbove(e){return{...this.targetBelow(e),after:null}}targetBelow(e){let t=V(e);return{parent:t?.dataset.fbBlock??null,parentName:t?.dataset.fbName??null,area:e.dataset.fbArea,after:e.dataset.fbBlock}}focusTools(e=`.block-tools`){this.bar.updateComplete.then(()=>this.bar.renderRoot.querySelector(`${e} button:not([disabled])`)?.focus())}tools(){let e=this.block;if(!e?.isConnected||this.panel?.id===e.dataset.fbBlock&&this.panel.busy)return A;let t=e.getBoundingClientRect();if(t.bottom<0||t.top>innerHeight||t.width===0)return A;let n=this.labels,r=t.top<48,i=r?Math.max(t.top,0):t.top,a=Ye(this.bar,t),o=V(e),s=yt(o,e.dataset.fbArea),c=s.indexOf(e),l=e.dataset.fbTitle??``,u=e.hasAttribute(`data-fb-missing`),d=(e,t,n,r=!1,i=``)=>D`<button type="button" class=${i}
            aria-label=${t} title=${t} ?disabled=${r||this.busy} @click=${n}>${z(e)}</button>`,f=this.confirming?D`<span class="note">${n.removeConfirm.replace(`{block}`,l)}</span>
                <button type="button" class="danger solid" ?disabled=${this.busy} @click=${()=>this.remove(e)}>${n.removeYes}</button>
                <button type="button" @click=${()=>this.confirm(!1)}>${n.cancel}</button>`:e.hasAttribute(`data-fb-fixed`)?D`${d(`settings`,n.blockSettings,()=>this.openPanel(e))}`:D`
                ${o?d(`parent`,n.parentBlock,()=>this.selectParent(o)):A}
                ${d(`up`,n.moveUp,()=>this.move(e,s,c-1),c<=0)}
                ${d(`down`,n.moveDown,()=>this.move(e,s,c+1),c>=s.length-1)}
                ${u?A:d(`copy`,n.copyBlock,()=>this.copy(e))}
                ${u?A:d(`settings`,n.blockSettings,()=>this.openPanel(e))}
                ${this.bar.config.history?d(`history`,n.blockHistory,()=>this.openHistory(e)):A}
                ${c===0?d(`insertAbove`,n.insertAbove,()=>this.openPicker(this.targetAbove(e))):A}
                ${d(`plus`,n.insertBelow,()=>this.openPicker(this.targetBelow(e)))}
                ${d(`trash`,n.removeBlock,()=>this.confirm(!0),!1,`danger`)}`;return D`<div class="block-tools ${r?`inside`:``}" role="toolbar"
            aria-label=${n.blockTools.replace(`{block}`,l)}
            style="inset-block-start: ${i}px; inset-inline-end: ${a}px"
            @keydown=${t=>this.toolsKey(t,e)}>${f}</div>`}listOf(e){let t=(e.owner?this.blocks?.find(t=>t.name===e.owner.dataset.fbName):this.layouts?.find(e=>e.name===this.bar.config.page?.layout))?.fields??[],n=null;for(let r of e.list.split(`/`))/^\d+$/.test(r)||(n=t.find(e=>e.name===r)??null,t=n?.fields??[]);return n}entryTools(){let e=this.entry;if(!e?.element.isConnected||this.picker||this.panel?.busy)return A;let t=e.element.getBoundingClientRect();if(t.bottom<0||t.top>innerHeight||t.width===0)return A;let n=this.labels,r=this.listOf(e),i=r?.label||n.entry.replace(`{number}`,``).trim(),a=String(e.index+1),o=r?.max!=null&&e.count>=r.max,s=(r?.min??0)>=e.count,c=at(e),l=(e,t,n,r=!1,i=``,a=``)=>D`<button type="button" class=${a}
            aria-label=${t} title=${r&&i?i:t} ?disabled=${r||this.busy} @click=${n}>${z(e)}</button>`;return D`<div class="block-tools entry-tools" role="toolbar"
            aria-label=${n.entryTools.replace(`{number}`,a).replace(`{list}`,i)}
            style="inset-block-start: ${Math.max(t.top,0)}px; inset-inline-end: ${Ye(this.bar,t)}px"
            @keydown=${e=>this.entryToolsKey(e)}>
            ${l(c?`left`:`up`,n.moveEarlier,()=>this.moveEntry(e,e.index-1),e.index===0)}
            ${l(c?`right`:`down`,n.moveLater,()=>this.moveEntry(e,e.index+1),e.index>=e.count-1)}
            ${l(`plus`,n.insertEntry,()=>this.addEntry(e),o,n.entriesMax.replace(`{count}`,String(r?.max)))}
            ${l(`trash`,n.removeEntry,()=>this.removeEntry(e),s,n.entriesMin.replace(`{count}`,String(r?.min)),`danger`)}
        </div>`}entryToolsKey(e){let t=[...this.bar.renderRoot.querySelectorAll(`.entry-tools button:not([disabled])`)],n=t.indexOf(this.bar.renderRoot.activeElement);e.key===`Escape`?(e.preventDefault(),(this.entryReturn?.isConnected?this.entryReturn:this.entry?ot(this.entry)[0]:null)?.focus()):e.key===`F10`&&e.altKey?(e.preventDefault(),this.focusTools()):(e.key===`ArrowRight`||e.key===`ArrowLeft`)&&(e.preventDefault(),t[(n+(e.key===`ArrowRight`?1:-1)+t.length)%t.length]?.focus())}fieldAt(e,t,n=null){let r=ot(e),i=this.listOf(e),a=i?r.find(t=>!i.fields.find(n=>t.dataset.fbField===`${e.path}/${n.name}`)?.optional):null,o=n??a??r[0];return o?`${e.list}/${t}/${o.dataset.fbField.slice(e.path.length+1)}`:null}entryInput(e){return e.owner?{block:e.owner.dataset.fbBlock}:{}}focusedField(e){let t=document.activeElement?.closest?.(`[data-fb-field]`);return t&&e.element.contains(t)?t:null}moveEntry(e,t){let n=this.fieldAt(e,t,this.focusedField(e));return this.change(`page.move-list-entry`,{...this.entryInput(e),path:e.path,to:t},()=>e.owner?.dataset.fbBlock??null,!1,n)}addEntry(e){let t=this.fieldAt(e,e.index+1);return this.change(`page.add-list-entry`,{...this.entryInput(e),path:e.list,index:e.index+1},()=>e.owner?.dataset.fbBlock??null,!1,t)}removeEntry(e){let t=e.index<e.count-1?e.index:e.index-1,n=t>=0?this.fieldAt(e,t):null;return this.change(`page.remove-list-entry`,{...this.entryInput(e),path:e.path},()=>e.owner?.dataset.fbBlock??null,!1,n)}confirm(e){this.confirming=e,this.bar.requestUpdate(),this.focusTools()}toolsKey(e,t){let n=[...this.bar.renderRoot.querySelectorAll(`.block-tools button:not([disabled])`)],r=n.indexOf(this.bar.renderRoot.activeElement);e.key===`Escape`?(e.preventDefault(),this.confirming=!1,this.bar.requestUpdate(),t.focus()):(e.key===`ArrowRight`||e.key===`ArrowLeft`)&&(e.preventDefault(),n[(r+(e.key===`ArrowRight`?1:-1)+n.length)%n.length]?.focus())}selectParent(e){e.focus({preventScroll:!0}),this.select(e),this.focusTools()}async move(e,t,n){let r=V(e),i=t.filter(t=>t!==e),a=n>0?i[n-1].dataset.fbBlock:null;await this.change(`page.move-block`,{block:e.dataset.fbBlock,parent:r?.dataset.fbBlock??null,area:e.dataset.fbArea,after:a},()=>e.dataset.fbBlock)}async copy(e){await this.change(`page.copy-block`,{block:e.dataset.fbBlock},e=>e.block)}async remove(e){let t=V(e),n=yt(t,e.dataset.fbArea),r=n.indexOf(e),i=n[r+1]??n[r-1]??t;await this.change(`page.remove-block`,{block:e.dataset.fbBlock},()=>i?.dataset.fbBlock??null)}async change(e,t,n,r=!1,i=null){this.busy=!0,this.bar.requestUpdate(),await this.bar.editing?.flushAll();let a=await this.bar.run(e,{id:this.bar.config.page.id,language:this.bar.config.language,...t});return a.ok?(this.bar.changed(a.data?.entry??null),St(this.restoreKey,{block:n(a.data??{}),panel:r,field:i}),await this.bar.refresh(),!0):(this.busy=!1,this.confirming=!1,this.panel&&={...this.panel,busy:!1},this.bar.requestUpdate(),!1)}async query(e,t=null){let n=t?`?`+new URLSearchParams(t):``;try{let t=await fetch(this.bar.config.queries+e+n,{headers:{Accept:`application/json`},credentials:`same-origin`});return t.ok?(await t.json()).data:null}catch{return null}}async describe(){if(!this.blocks){let[e,t,n]=await Promise.all([this.query(`block.list`),this.query(`layout.list`),this.query(`block.groups`)]);this.blocks=e??[],this.layouts=t??[],this.groups=n??[]}}async pageData(){let e=await this.query(`page.show`,{id:this.bar.config.page.id});return e?.draft??e?.published??null}async openPicker(e){this.picker={...e,query:``,loading:!0,info:null},this.bar.requestUpdate(),await this.bar.updateComplete,this.bar.renderRoot.querySelector(`dialog.picker`)?.showModal();let[,t]=await Promise.all([this.describe(),e.parentName?null:this.pageData()]);if(!this.picker)return;let n=(e.parentName?this.blocks.find(t=>t.name===e.parentName):this.layouts.find(e=>e.name===t?.layout))?.areas?.find(t=>t.name===e.area)??null,r=yt(e.parent?document.querySelector(`${B}[data-fb-block="${CSS.escape(e.parent)}"]`):null,e.area).length,i=this.blocks.filter(e=>e.offered!==!1&&(n?.allow?n.allow.includes(e.name):!e.widget)),a=i.length>pt?this.groupsOf(i):[];this.picker={...this.picker,loading:!1,info:n,full:n?.max!=null&&r>=n.max,choices:i,groups:a,group:a.find(e=>e.name===ht||!e.lead)?.name??null},this.bar.requestUpdate(),await this.bar.updateComplete,this.bar.renderRoot.querySelector(`dialog.picker :is(input, .picker-cards button)`)?.focus()}closePicker(){let e=this.picker;this.bar.renderRoot.querySelector(`dialog.picker`)?.close(),this.picker=null,this.bar.requestUpdate();let t=e?.after??e?.parent;(t?document.querySelector(`${B}[data-fb-block="${CSS.escape(t)}"]`):null)?.focus({preventScroll:!0})}groupsOf(e){let t=this.labels,n=new Set((this.groups??[]).map(e=>e.name)),r=(this.groups??[]).map(n=>({name:n.name,title:t.groups?.[n.name]??n.title,blocks:e.filter(e=>e.group===n.name)}));r.push({name:``,title:t.otherGroup,blocks:e.filter(e=>!n.has(e.group))});let i=r.filter(e=>e.blocks.length>0);if(i.length<2)return[];let a=e.filter(e=>e.tailored),o=i.flatMap(e=>e.blocks);return[...a.length>0&&a.length<e.length?[{name:ht,title:t.siteGroup,blocks:o.filter(e=>e.tailored),lead:!0}]:[],{name:gt,title:t.allGroup,blocks:o,lead:!0},...i]}pickGroup(e){this.picker={...this.picker,group:e,query:``},this.bar.requestUpdate()}pickerDialog(){let e=this.picker;if(!e)return A;let t=this.labels,n=e.query.trim().toLowerCase(),r=e.groups??[],i=e=>r.find(t=>!t.lead&&t.blocks.includes(e))?.title??``,a=e=>[e.title,e.description,...e.keywords??[],i(e)].some(e=>e.toLowerCase().includes(n)),o=e.choices??[];n===``?r.length>0&&(o=r.find(t=>t.name===e.group)?.blocks??[]):o=o.filter(a);let s=e.info?.label||e.area,c=n===``?r.find(t=>t.name===e.group):null,l;return l=e.loading?D`<p class="hint">${t.loading}</p>`:e.full?D`<p class="hint">${t.areaFull.replace(`{area}`,s)}</p>`:(e.choices??[]).length===0?D`<p class="hint">${t.noBlocks}</p>`:D`
                ${e.choices.length>6?D`<label>${t.search}
                    <input type="text" .value=${e.query} autocomplete="off"
                        @input=${e=>{this.picker={...this.picker,query:e.target.value},this.bar.requestUpdate()}}></label>`:A}
                <div class="picker-body">
                    ${r.length>0?D`<ul class="picker-groups" aria-label=${t.blockGroups}>
                        ${r.map(e=>D`<li class=${e.lead?`lead`:A}><button type="button" aria-pressed=${String(e===c)} @click=${()=>this.pickGroup(e.name)}>
                            <span>${e.title}</span><span class="count">${e.blocks.length}</span></button></li>`)}
                    </ul>`:A}
                    <ul class="picker-cards" aria-label=${c?.title??t.addBlock}>
                        ${o.map(e=>D`<li><button type="button" ?disabled=${this.busy} @click=${()=>this.add(e)}>
                            ${vt(e.preview,e.group)}
                            <span>${e.title}</span>${e.description?D`<small>${e.description}</small>`:A}</button></li>`)}
                        ${o.length===0?D`<li class="hint">${t.noBlocks}</li>`:A}
                    </ul>
                </div>`,D`<dialog class="picker ${(e.groups??[]).length>0?`grouped`:``}" aria-labelledby="fb-picker-title" @cancel=${e=>{e.preventDefault(),this.closePicker()}}>
            <form @submit=${e=>e.preventDefault()}>
                <h2 id="fb-picker-title">${t.addBlock}</h2>
                ${s?D`<p class="hint">${t.intoArea.replace(`{area}`,s)}</p>`:A}
                ${l}
                <div class="actions"><button type="button" @click=${()=>this.closePicker()}>${t.cancel}</button></div>
            </form>
        </dialog>`}async add(e){let t=this.picker;await this.change(`page.add-block`,{name:e.name,parent:t.parent,area:t.area,after:t.after},e=>e.block)}async openPanel(e){let t=e.dataset.fbBlock;this.bar.design?.hide(),this.bar.pagePanel?.hide(),this.bar.comments?.hide(),this.bar.outline?.hide(),this.panel={id:t,title:e.dataset.fbTitle??``,loading:!0,busy:!1},this.bar.requestUpdate();let[,n]=await Promise.all([this.describe(),this.pageData()]),r=bt(n?.translations?.[this.bar.config.language]?.content??null,t),i=this.blocks.find(t=>t.name===(r?.block??e.dataset.fbName))??null;this.panel?.id===t&&(this.panel={...this.panel,loading:!1,data:r,summary:i},this.bar.requestUpdate(),await this.bar.updateComplete,this.bar.renderRoot.querySelector(`.panel h2`)?.focus())}async openHistory(e){let t=e.dataset.fbBlock;this.bar.design?.hide(),this.bar.pagePanel?.hide(),this.bar.comments?.hide(),this.bar.outline?.hide(),this.panel={id:t,title:e.dataset.fbTitle??``,mode:`history`,loading:!0,busy:!1},this.bar.requestUpdate();let n=await this.query(`page.history`,{id:this.bar.config.page?.id??``,block:t,language:this.bar.config.language,limit:String(mt)});this.panel?.id===t&&this.panel.mode===`history`&&(this.panel={...this.panel,loading:!1,entries:n?.entries??null,more:!!n?.next},this.bar.requestUpdate(),await this.bar.updateComplete,this.bar.renderRoot.querySelector(`.panel h2`)?.focus())}historyView(e){let t=this.labels;if(e.loading)return D`<p class="hint">${t.loading}</p>`;if(!e.entries)return D`<p class="hint">${t.historyFailed}</p>`;let n=this.bar.config.history.names,r=new Intl.DateTimeFormat(this.bar.config.ui?.language||void 0,{dateStyle:`medium`,timeStyle:`short`}),i=this.bar.config.history.screen+`?block=`+encodeURIComponent(e.id);return D`${e.entries.length===0?D`<p class="hint">${t.noHistory}</p>`:D`<ol class="history">${e.entries.map(e=>D`<li>
                <p class="history-title">${n.actions[e.action]??e.action}${e.undone?D` <span class="history-badge">${t.undone}</span>`:A}</p>
                <p class="hint">${r.format(new Date(e.createdAt))} · ${e.actorType===`system`?t.system:e.actorName??t.unknown} · ${n.channels[e.channel]??e.channel}${e.device?` · ${e.device}`:``}</p>
                ${e.changes.filter(e=>e.block!==null||e.path!==``).map(e=>this.changeView(e,n))}
            </li>`)}</ol>`}${e.more?D`<p class="hint">${t.moreHistory}</p>`:A}
            <a class="history-link" href=${i}>${t.wholeHistory}</a>`}changeView(e,t){let n=this.labels,r=[e.block===this.panel?.id?null:e.blockTitle,e.field].filter(Boolean);e.block!==null&&e.path===``&&r.push(e.old===null?n.historyAdded:e.new===null?n.historyRemoved:n.historyChanged);let i=t.states[e.state];return D`<div class="change">
            ${r.length||i?D`<p class="hint">${[...r,i].filter(Boolean).join(` · `)}</p>`:A}
            ${e.oldText?D`<p class="old"><span class="visually-hidden">${n.before} </span>${e.oldText}</p>`:A}
            ${e.newText?D`<p class="new"><span class="visually-hidden">${n.after} </span>${e.newText}</p>`:A}
        </div>`}closePanel(){let e=this.panel?.id;this.panel=null,this.bar.requestUpdate(),(e?document.querySelector(`${B}[data-fb-block="${CSS.escape(e)}"]`):null)?.focus({preventScroll:!0})}panelView(){let e=this.panel;if(!e)return A;let t=this.labels,n;return n=e.mode===`history`?this.historyView(e):e.loading?D`<p class="hint">${t.loading}</p>`:!e.data||!e.summary?D`<p class="hint">${t.blockGone}</p>`:this.settings(e.data,e.summary),D`<section class="panel" role="region" aria-labelledby="fb-panel-title"
            @keydown=${e=>{e.key===`Escape`&&(e.preventDefault(),this.closePanel())}}>
            <header>
                <h2 id="fb-panel-title" tabindex="-1">${(e.mode===`history`?t.historyOf:t.settingsOf).replace(`{block}`,e.title)}</h2>
                <button type="button" aria-label=${t.close} title=${t.close} @click=${()=>this.closePanel()}>${z(`close`)}</button>
            </header>
            <form @submit=${e=>e.preventDefault()}>
                <fieldset ?disabled=${e.busy}>${n}</fieldset>
            </form>
        </section>`}settings(e,t){let n=this.labels,r=e.variant??`Default`,i=t.variants.find(e=>e.name===r)??t.variants[0],a=i?.options??[],o=t.fields.filter(e=>ft.includes(e.type)),s=t.fields.filter(e=>e.type===`list`),c=t.variants.some(e=>e.preview);return t.variants.length<=1&&a.length===0&&o.length===0&&s.length===0?D`<p class="hint">${n.noSettings}</p>`:D`
            ${t.variants.length>1?D`<fieldset>
                <legend>${n.variant}</legend>
                ${t.variants.map(n=>D`<label class="choice">
                    <input type="radio" name="variant" .value=${n.name} .checked=${n.name===i?.name}
                        @change=${()=>this.setVariant(e,t,n)}>
                    ${c?vt(n.preview,t.group):A}
                    <span>${n.title}${n.description?D`<small>${n.description}</small>`:A}</span>
                </label>`)}
            </fieldset>`:A}
            ${a.length>0?D`<fieldset>
                <legend>${n.options}</legend>
                ${a.map(t=>this.optionInput(e,t))}
            </fieldset>`:A}
            ${o.length>0?D`<fieldset>
                <legend>${n.content}</legend>
                ${o.map(t=>this.fieldInput(e,t,t.name,e.fields?.[t.name]??null))}
            </fieldset>`:A}
            ${s.map(t=>this.listView(e,t))}`}optionInput(e,t){let n=e.options?.[t.name]??t.default,r=n=>this.setOption(e,t.name,n),i=t.description?D`<small class="hint">${t.description}</small>`:A,a=this.labels;switch(t.type){case`boolean`:return D`<label class="check"><input type="checkbox" .checked=${n===!0}
                    @change=${e=>r(e.target.checked)}>${t.label}</label>`;case`choice`:return D`<label>${t.label}
                    <select @change=${e=>r(e.target.value)}>
                        ${t.default===``?D`<option value="" ?selected=${n===``}>${a.noChoice}</option>`:A}
                        ${t.choices.map(e=>D`<option .value=${String(e.value)} ?selected=${String(e.value)===String(n)}>${e.label}</option>`)}
                    </select>${i}</label>`;case`number`:return D`<label>${t.label}
                    <input type="number" .value=${String(n??``)} min=${t.min??A} max=${t.max??A}
                        @change=${e=>r(e.target.value===``?t.default:Number(e.target.value))}>${i}</label>`;default:return D`<label>${t.label}
                    <input type="text" .value=${String(n??``)}
                        @change=${e=>r(e.target.value)}>${i}</label>`}}fieldInput(e,t,n,r){if(t.type===`link`){let i=r?r.text||r.target||r.url:this.labels.noLink;return D`<div><span class="hint">${t.label}</span>
                <button type="button" class="link-field" @click=${()=>this.editLink(e,n,r)}>
                    <span>${i}</span>${z(`link`)}</button></div>`}if(t.type===`image`)return D`<div><span class="hint">${t.label}</span>
                <button type="button" class="link-field" @click=${()=>this.editImage(e,n,r,`image`,t.caption===!0)}>
                    <span>${r?.media?this.labels.imageChosen:this.labels.noImage}</span>${z(`image`)}</button></div>`;if(t.type===`video`)return D`<div><span class="hint">${t.label}</span>
                <button type="button" class="link-field" @click=${()=>this.editImage(e,n,r,`video`)}>
                    <span>${r?.media?this.labels.videoChosen:this.labels.noVideo}</span>${z(`video`)}</button></div>`;if(t.type===`file`)return D`<div><span class="hint">${t.label}</span>
                <button type="button" class="link-field" @click=${()=>this.editImage(e,n,r,`file`)}>
                    <span>${r?.media?r.text||this.labels.documentChosen:this.labels.noDocument}</span>${z(`file`)}</button></div>`;if(t.type===`icon`){let i=this.bar.icons.describe(r);return D`<div><span class="hint">${t.label}</span>
                <button type="button" class="link-field icon-choice" @click=${()=>this.editIcon(e,n,r)}>
                    <span>${r?i?.label??r:this.labels.noIcon}</span>${i?qe(i.svg):z(`symbol`)}</button></div>`}let i=t=>{let i=t.target.value.trim()===``?null:t.target.value;this.setField(e,n,r,i)};return D`<label>${t.label}
            ${t.type===`text`?D`<textarea rows="3" .value=${r??``} placeholder=${t.placeholder||A} @change=${i}></textarea>`:D`<input type="text" .value=${r??``} placeholder=${t.placeholder||A} @change=${i}
                    @keydown=${e=>{e.key===`Enter`&&(e.preventDefault(),e.target.blur())}}>`}
        </label>`}listView(e,t){let n=this.labels,r=Array.isArray(e.fields?.[t.name])?e.fields[t.name]:[],i=t.fields.filter(e=>ft.includes(e.type)),a=this.panel.open??[],o=r.length-1,s=e=>{this.panel={...this.panel,open:a.includes(e)?a.filter(t=>t!==e):[...a,e]},this.bar.requestUpdate()};return D`<fieldset>
            <legend>${t.label}</legend>
            <ol class="entries">
                ${r.map((r,c)=>{let l=Ct(r,t.fields,c+1,n),u=`${t.name}/${c}`,d=a.includes(u);return D`<li>
                        <div class="entry-head">
                            ${i.length>0?D`<button type="button" class="entry-toggle" aria-expanded=${d?`true`:`false`}
                                    @click=${()=>s(u)}>${z(d?`collapse`:`expand`)}<span>${l}</span></button>`:D`<span class="entry-toggle">${l}</span>`}
                            <button type="button" aria-label="${n.moveUp}: ${l}" title=${n.moveUp} ?disabled=${c===0}
                                @click=${()=>this.listChange(`page.move-list-entry`,e,{path:u,to:c-1})}>${z(`up`)}</button>
                            <button type="button" aria-label="${n.moveDown}: ${l}" title=${n.moveDown} ?disabled=${c===o}
                                @click=${()=>this.listChange(`page.move-list-entry`,e,{path:u,to:c+1})}>${z(`down`)}</button>
                            <button type="button" class="danger" aria-label="${n.removeEntry}: ${l}" title=${n.removeEntry}
                                @click=${()=>this.listChange(`page.remove-list-entry`,e,{path:u})}>${z(`trash`)}</button>
                        </div>
                        ${d?D`<div class="entry-fields">
                            ${i.map(t=>this.fieldInput(e,t,`${u}/${t.name}`,r?.[t.name]??null))}
                        </div>`:A}
                    </li>`})}
            </ol>
            <button type="button" class="add" @click=${()=>this.listChange(`page.add-list-entry`,e,{path:t.name})}>${z(`plus`)}${n.addEntry}</button>
        </fieldset>`}panelChange(e,t){return this.panel={...this.panel,busy:!0},this.bar.requestUpdate(),this.change(e,t,()=>this.panel.id,!0)}setVariant(e,t,n){let r=n.options.map(e=>e.name),i=Object.fromEntries(Object.entries(e.options??{}).filter(([e])=>r.includes(e)));return this.panelChange(`page.update-block`,{block:e.id,variant:n.name,options:i})}setOption(e,t,n){return this.panelChange(`page.update-block`,{block:e.id,options:{...e.options??{},[t]:n}})}setField(e,t,n,r){return(n??null)===(r??null)?null:this.panelChange(`page.update-field`,{block:e.id,path:t,value:r,previous:n})}listChange(e,t,n){return this.panelChange(e,{block:t.id,...n})}editImage(e,t,n,r=`image`,i=!1){let a=this.bar.renderRoot.activeElement;this.bar.media.open({kind:r,value:n,caption:i,apply:r=>this.panelChange(`page.update-field`,{block:e.id,path:t,value:r,previous:n}),remove:()=>this.panelChange(`page.update-field`,{block:e.id,path:t,value:null,previous:n}),done:()=>a?.focus()})}editIcon(e,t,n){let r=this.bar.renderRoot.activeElement;this.bar.icons.open({value:n,apply:r=>this.panelChange(`page.update-field`,{block:e.id,path:t,value:r,previous:n}),remove:()=>this.panelChange(`page.update-field`,{block:e.id,path:t,value:null,previous:n}),done:()=>r?.focus()})}editLink(e,t,n){let r=this.bar.renderRoot.activeElement;this.bar.openLink({withText:!0,text:n?.text??``,href:n?.target??n?.url??``,newWindow:n?.newWindow===!0,apply:({text:r,href:i,newWindow:a})=>{let o=i.startsWith(`page:`)?{target:i}:{url:i};r&&(o.text=r),a&&(o.newWindow=!0),this.panelChange(`page.update-field`,{block:e.id,path:t,value:o,previous:n})},remove:()=>this.panelChange(`page.update-field`,{block:e.id,path:t,value:null,previous:n}),done:()=>r?.focus()})}},Et=class{constructor(e){this.bar=e,this.threads=[],this.state=null,this.picking=!1,this.onPick=e=>this.pick(e),this.onKey=e=>{e.key===`Escape`&&(e.preventDefault(),e.stopPropagation(),this.stopPicking())}}get labels(){return this.bar.labels}get config(){return this.bar.config?.comments??null}get pageId(){return this.bar.config?.page?.id??null}get designPage(){return!!this.bar.config?.designPage}get available(){return!!(this.config&&(this.pageId||this.designPage))}get open(){return this.threads.filter(e=>e.status===`open`).length}async load(){if(!this.available)return;let e=this.designPage?`design=true`:`pageId=${encodeURIComponent(this.pageId)}`;try{let t=await fetch(`${this.bar.config.queries}comment.list?${e}`,{headers:{Accept:`application/json`},credentials:`same-origin`});this.threads=t.ok?(await t.json()).data??[]:[]}catch{this.threads=[]}this.bar.requestUpdate()}async show(e=null){this.bar.design?.hide(),this.bar.pagePanel?.hide(),this.bar.outline?.hide(),this.bar.arranging?.panel&&this.bar.arranging.closePanel(),this.state={current:e,composing:null,confirming:null,error:null,busy:!1},this.bar.requestUpdate(),await this.bar.updateComplete,this.bar.renderRoot.querySelector(`#fb-comments-title`)?.focus(),this.bar.renderRoot.querySelector(`[data-thread="${e}"]`)?.scrollIntoView({block:`nearest`})}hide(){this.state=null,this.stopPicking(),this.bar.requestUpdate()}async close(){this.hide(),await this.bar.updateComplete,this.bar.renderRoot.querySelector(`[data-fb-comments]`)?.focus()}update(e){this.state={...this.state,...e},this.bar.requestUpdate()}startPicking(){this.picking=!0,this.bar.requestUpdate(),document.addEventListener(`click`,this.onPick,!0),document.addEventListener(`keydown`,this.onKey,!0)}stopPicking(){this.picking&&(this.picking=!1,document.removeEventListener(`click`,this.onPick,!0),document.removeEventListener(`keydown`,this.onKey,!0),this.bar.requestUpdate())}pick(e){if(!i(e.target))return;e.preventDefault(),e.stopPropagation(),this.stopPicking();let t=r(e.target,{event:e,labels:this.labels});this.update({composing:t,error:null}),this.bar.updateComplete.then(()=>this.bar.renderRoot.querySelector(`.panel.comments textarea`)?.focus())}async run(e,t,n=null){this.update({busy:!0,error:null});let r=await this.bar.action(e,t);if(!r?.ok){let e=r?await r.json().catch(()=>null):null,t=Array.isArray(e?.errors)?e.errors.map(e=>e.message):[];return this.update({busy:!1,error:t.length>0?t.join(` `):e?.detail??this.labels.commentFailed}),!1}return await this.load(),this.update({busy:!1,...n??{}}),!0}async create(e,t){e.preventDefault();let n=new FormData(e.currentTarget).get(`body`),r=this.designPage?t?.design??`page`:null;await this.run(`comment.create`,{pageId:r?null:this.pageId,design:r,body:n,blockId:t?.blockId??null,field:t?.field??null,site:t?.site??!1,landmark:t?.landmark??null,pointX:t?.pointX??null,pointY:t?.pointY??null,language:this.bar.config.language,path:r?location.pathname+location.search:location.pathname,excerpt:t?.excerpt??null,viewport:window.innerWidth},{composing:null})&&this.update({current:this.threads[0]?.id??null})}async reply(e,t){e.preventDefault();let n=e.currentTarget;await this.run(`comment.reply`,{commentId:t.id,body:new FormData(n).get(`body`)},{current:t.id})&&n.reset()}reveal(e){let t=n(e);t&&(t.scrollIntoView({block:`center`,behavior:matchMedia(`(prefers-reduced-motion: reduce)`).matches?`auto`:`smooth`}),this.update({current:e.id}))}button(){if(!this.available)return A;let e=this.labels,t=this.open,n=t?`${e.comments}, ${e.openCount.replace(`{count}`,t)}`:e.comments;return D`<button type="button" data-fb-comments aria-label=${n} title=${n} aria-expanded=${this.state?`true`:`false`}
            @click=${()=>this.state?this.close():this.show()}>${z(`comment`)}${t?D`<span class="comment-count" aria-hidden="true">${t}</span>`:A}</button>`}pins(){let e=this.state?.composing;if(!this.config||this.threads.length===0&&!e?.element)return A;let t=this.labels,r=this.threads.map((e,r)=>{let i=n(e),a=i?this.pinStyle(e,i):null;if(!a)return A;let o=this.threads.length-r;return D`<button type="button" class="comment-pin ${e.status===`done`?`done`:``} ${this.state?.current===e.id?`current`:``}"
                style=${a}
                aria-label=${t.commentPin.replace(`{number}`,o).replace(`{text}`,e.comment.body.slice(0,60))}
                @click=${()=>this.show(e.id)}>${o}</button>`}),i=e?.element?.isConnected?this.pinStyle(e,e.element):null;return i?[...r,D`<span class="comment-pin draft" aria-hidden="true" style=${i}>+</span>`]:r}pinStyle(e,n){let{x:r,y:i,rect:a,point:o}=t(e,n);if(a.bottom<0||a.top>innerHeight||a.width===0&&a.height===0)return null;let s=Xe(this.bar,r),[c,l]=o?[`${i}px - var(--fb-size-icon)`,`${s}px`]:[`${i}px - var(--fb-size-icon) / 2`,`${s}px - var(--fb-size-icon) / 2`];return`inset-block-start: max(0px, calc(${c})); inset-inline-start: max(0px, calc(${l}))`}pickHint(){if(!this.picking)return A;let e=this.labels;return D`<div class="comment-hint" role="status">
            <span>${e.pickHint}</span>
            <button type="button" @click=${()=>{this.stopPicking(),this.update({composing:{blockId:null,field:null,site:!1,landmark:null,label:null,excerpt:null,element:null,pointX:null,pointY:null}})}}>${e.wholePage}</button>
            <button type="button" @click=${()=>this.stopPicking()}>${e.cancel}</button>
        </div>`}view(){let e=this.state;if(!e)return A;let t=this.labels;return D`<section class="panel comments" role="region" aria-labelledby="fb-comments-title"
            @keydown=${e=>{e.key===`Escape`&&!this.picking&&(e.preventDefault(),this.close())}}>
            <header>
                <h2 id="fb-comments-title" tabindex="-1">${t.comments}</h2>
                <button type="button" aria-label=${t.close} title=${t.close} @click=${()=>this.close()}>${z(`close`)}</button>
            </header>
            <div class="comments-body">
                ${e.error?D`<p class="comment-error" role="alert">${e.error}</p>`:A}
                ${e.composing?this.composer(e.composing):D`<button type="button" class="primary" ?disabled=${this.picking}
                    @click=${()=>this.startPicking()}>${z(`plus`)}${t.comment}</button>`}
                ${this.threads.length===0?D`<p class="hint">${t.noComments}</p>`:this.threads.map(e=>this.thread(e))}
            </div>
        </section>`}composer(e){let t=this.labels,n=this.state.busy;return D`<form class="comment-form" @submit=${t=>this.create(t,e)}>
            <p class="hint">${e.label?t.about.replace(`{place}`,e.label):t.aboutPage}</p>
            ${e.excerpt?D`<blockquote>${e.excerpt.length>120?`${e.excerpt.slice(0,120)} …`:e.excerpt}</blockquote>`:A}
            <label>${t.yourComment}<textarea name="body" required maxlength="2000"></textarea></label>
            <div class="comment-actions">
                <button type="submit" class="primary" ?disabled=${n}>${t.send}</button>
                <button type="button" ?disabled=${n} @click=${()=>this.update({composing:null})}>${t.cancel}</button>
            </div>
        </form>`}thread(t){let r=this.labels,i=t.status===`done`,a=n(t),o=this.state.busy,s=this.state.confirming===t.id;return D`<article class="comment-thread ${this.state.current===t.id?`current`:``}" data-thread=${t.id}>
            <div class="comment-meta">
                <span class="comment-badge ${i?`done`:``}">${i?r.doneThread:r.openThread}</span>
                <span class="hint">${e(t,r)??r.aboutPage}</span>
                ${a?D`<button type="button" class="small" @click=${()=>this.reveal(t)}>${r.showPlace}</button>`:A}
            </div>
            ${this.message(t.comment)}
            ${t.replies.map(e=>D`<div class="comment-reply">${this.message(e)}</div>`)}
            ${i&&t.resolvedBy?D`<p class="hint">${r.doneBy.replace(`{name}`,t.resolvedBy)}</p>`:A}
            <form class="comment-form" @submit=${e=>this.reply(e,t)}>
                <label>${r.reply}<textarea name="body" required maxlength="2000"></textarea></label>
                <div class="comment-actions">
                    <button type="submit" ?disabled=${o}>${r.sendReply}</button>
                    ${this.config.resolve?D`<button type="button" ?disabled=${o}
                        @click=${()=>this.run(i?`comment.reopen`:`comment.resolve`,{id:t.id},{current:t.id})}>${i?r.reopen:r.resolve}</button>`:A}
                    ${this.config.delete&&!s?D`<button type="button" class="danger" ?disabled=${o}
                        @click=${()=>this.update({confirming:t.id})}>${r.deleteThread}</button>`:A}
                </div>
                ${s?D`<div class="comment-actions" role="group" aria-label=${r.deleteThread}>
                    <span class="hint">${r.deleteThreadConfirm}</span>
                    <button type="button" class="danger" ?disabled=${o} @click=${()=>this.run(`comment.delete`,{id:t.id},{confirming:null})}>${r.deleteThread}</button>
                    <button type="button" ?disabled=${o} @click=${()=>this.update({confirming:null})}>${r.cancel}</button>
                </div>`:A}
            </form>
        </article>`}message(e){let t=e.createdAt?new Intl.DateTimeFormat(document.documentElement.lang||void 0,{dateStyle:`short`,timeStyle:`short`}).format(new Date(e.createdAt)):``;return D`<div class="comment-message">
            <div class="comment-meta"><strong>${e.authorName}</strong>${e.guest?D`<span class="comment-badge guest">${this.labels.guest}</span>`:A}<span class="hint">${t}</span></div>
            <p>${e.body}</p>
        </div>`}},Dt=d`
    .panel.comments .comments-body {
        display: grid;
        align-content: start;
        gap: var(--fb-space-4);
        padding: var(--fb-space-5);
        overflow-y: auto;
    }

    .panel.comments .comments-body > .primary { justify-self: start; }

    .panel .comment-form { display: grid; gap: var(--fb-space-2); padding: 0; overflow: visible; }

    .panel .comment-actions { display: flex; flex-wrap: wrap; gap: var(--fb-space-2); align-items: center; }

    .panel blockquote {
        margin: 0;
        padding-inline-start: var(--fb-space-2);
        border-inline-start: var(--fb-size-indicator) solid var(--fb-border-strong);
        color: var(--fb-text-muted);
    }

    .comment-thread {
        display: grid;
        gap: var(--fb-space-2);
        padding: var(--fb-space-3);
        border: var(--fb-size-border) solid var(--fb-border);
        border-radius: var(--fb-radius-md);
    }

    .comment-thread.current { border-color: var(--fb-accent); }

    .comment-meta { display: flex; flex-wrap: wrap; gap: var(--fb-space-1) var(--fb-space-2); align-items: center; }

    .comment-message p { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }

    .comment-reply { padding-inline-start: var(--fb-space-3); border-inline-start: var(--fb-size-border) solid var(--fb-border); }

    .comment-badge {
        padding: 0 var(--fb-space-2);
        border-radius: var(--fb-radius-full);
        background: var(--fb-info-bg);
        color: var(--fb-info-text);
        font-size: var(--fb-text-xs);
        font-weight: var(--fb-weight-medium);
    }

    .comment-badge.done { background: var(--fb-success-bg); color: var(--fb-success-text); }

    .comment-badge.guest { background: var(--fb-surface-2); color: var(--fb-text-muted); }

    .comment-error { margin: 0; color: var(--fb-danger-text); }

    /* The number of open comments on the button of the editor bar. */
    .comment-count {
        min-inline-size: var(--fb-size-icon-sm);
        padding-inline: var(--fb-space-1);
        border-radius: var(--fb-radius-full);
        background: var(--fb-accent);
        color: var(--fb-on-accent);
        font-size: var(--fb-text-xs);
        line-height: var(--fb-size-icon-sm);
        text-align: center;
    }

    .comment-pin {
        position: absolute;
        min-inline-size: var(--fb-size-icon);
        min-block-size: var(--fb-size-icon);
        padding: 0 var(--fb-space-1);
        pointer-events: auto;
        border: var(--fb-size-border) solid var(--fb-on-accent);
        border-radius: var(--fb-radius-full);
        border-end-start-radius: 0;
        background: var(--fb-accent);
        color: var(--fb-on-accent);
        font-size: var(--fb-text-xs);
        box-shadow: var(--fb-shadow-sm);
    }

    .comment-pin.done { background: var(--fb-surface-2); color: var(--fb-text-muted); }

    .comment-pin.current { outline: var(--fb-size-focus) solid var(--fb-focus); }

    .comment-pin.draft { display: grid; place-items: center; pointer-events: none; border-color: var(--fb-accent); background: var(--fb-surface); color: var(--fb-accent); }

    .comment-hint {
        position: absolute;
        inset-block-start: var(--fb-space-4);
        inset-inline-start: var(--fb-space-4);
        display: flex;
        flex-wrap: wrap;
        gap: var(--fb-space-2) var(--fb-space-3);
        align-items: center;
        max-inline-size: min(var(--fb-size-form), calc(100vw - 2 * var(--fb-space-4)));
        padding: var(--fb-space-2) var(--fb-space-2) var(--fb-space-2) var(--fb-space-4);
        pointer-events: auto;
        border-radius: var(--fb-radius-lg);
        background: var(--fb-inverse-bg);
        color: var(--fb-inverse-text);
        box-shadow: var(--fb-shadow-lg);
    }
`,Ot=400,kt=4.5,At=[[`color`,`designColors`],[`font`,`designFonts`],[`length`,`designSizes`],[`choice`,`designMore`]];function H(e){let t=String(e).trim().toLowerCase();return/^#[0-9a-f]{3}$/.test(t)?[1,2,3].map(e=>parseInt(t[e]+t[e],16)):/^#[0-9a-f]{6}$/.test(t)?[1,3,5].map(e=>parseInt(t.slice(e,e+2),16)):null}function jt([e,t,n]){let[r,i,a]=[e,t,n].map(e=>{let t=e/255;return t<=.04045?t/12.92:((t+.055)/1.055)**2.4});return .2126*r+.7152*i+.0722*a}function Mt(e,t){let n=H(e),r=H(t);if(!n||!r)return null;let[i,a]=[jt(n),jt(r)].sort((e,t)=>t-e);return Math.round((i+.05)/(a+.05)*100)/100}var Nt=class{constructor(e){this.bar=e,this.state=null,this.pending={},this.timer=null,this.saving=Promise.resolve()}get labels(){return this.bar.labels}get open(){return this.state!==null}async show(){this.bar.arranging?.closePanel?.(),this.bar.comments?.hide(),this.bar.outline?.hide(),this.bar.pagePanel?.hide(),this.state={loading:!0,design:null,busy:!1,confirming:!1},this.bar.requestUpdate();let e=null;try{let t=await fetch(this.bar.config.queries+`design.show`,{headers:{Accept:`application/json`},credentials:`same-origin`});e=t.ok?await t.json():null}catch{e=null}this.state&&(this.update({loading:!1,design:e?.data??null}),await this.bar.updateComplete,this.bar.renderRoot.querySelector(`#fb-design-title`)?.focus())}async close(){this.hide(),await this.bar.updateComplete,this.bar.renderRoot.querySelector(`[data-fb-more]`)?.focus()}hide(){this.state&&(this.flush(),this.state=null,this.bar.requestUpdate())}update(e){this.state={...this.state,...e},this.bar.requestUpdate()}token(e){return this.state?.design?.tokens.find(t=>t.name===e)??null}cssOf(e,t){return e.options.find(e=>e.value===t)?.css??t}change(e,t){let n=t??e.default;document.documentElement.style.setProperty(`--${e.name}`,this.cssOf(e,n)),this.replace(e.name,{value:n,css:this.cssOf(e,n)}),this.pending={...this.pending,[e.name]:t},clearTimeout(this.timer),this.timer=setTimeout(()=>this.flush(),Ot)}replace(e,t){let n=this.state.design;this.update({design:{...n,draft:!0,tokens:n.tokens.map(n=>n.name===e?{...n,...t}:n)}})}async flush(){clearTimeout(this.timer);let e=this.pending;this.pending={},Object.keys(e).length>0&&(this.saving=this.saving.then(()=>this.save(e),()=>this.save(e))),await this.saving}async save(e){let t=await this.bar.run(`design.update`,{tokens:e});t.ok&&this.state&&Object.keys(this.pending).length===0&&this.apply(t.data)}apply(e){for(let t of e.tokens)document.documentElement.style.setProperty(`--${t.name}`,t.css);this.update({design:e,busy:!1,confirming:!1})}async publish(){await this.flush(),this.update({busy:!0});let e=await this.bar.run(`design.publish`,{});e.ok?(this.apply(e.data),this.bar.message={tone:`success`,text:this.labels.designIsPublished}):this.update({busy:!1})}async discard(){clearTimeout(this.timer),this.pending={},this.update({busy:!0}),await this.saving;let e=await this.bar.run(`design.discard`,{});e.ok?(this.apply(e.data),this.bar.message={tone:`info`,text:this.labels.designIsDiscarded}):this.update({busy:!1,confirming:!1})}view(){let e=this.state;if(!e)return A;let t=this.labels,n=e.design,r;return r=e.loading?D`<p class="hint">${t.loading}</p>`:n?n.tokens.length===0?D`<p class="hint">${t.designNone}</p>`:D`${At.map(([e,r])=>this.group(n.tokens.filter(t=>t.type===e),t[r]))}`:D`<p class="hint">${t.failed}</p>`,D`<section class="panel design" role="region" aria-labelledby="fb-design-title"
            @keydown=${e=>{e.key===`Escape`&&(e.preventDefault(),this.close())}}>
            <header>
                <h2 id="fb-design-title" tabindex="-1">${t.designTitle}</h2>
                <button type="button" aria-label=${t.close} title=${t.close} @click=${()=>this.close()}>${z(`close`)}</button>
            </header>
            <form @submit=${e=>e.preventDefault()}>
                ${n?D`<p class="hint" role="status">${n.draft?t.designDraft:t.designLive}</p>`:A}
                <fieldset ?disabled=${e.busy}>${r}</fieldset>
            </form>
            ${n?this.footer(n):A}
        </section>`}footer(e){let t=this.labels;return this.state.confirming?D`<footer>
                <p class="hint">${t.designDiscardConfirm}</p>
                <div class="actions">
                    <button type="button" @click=${()=>this.update({confirming:!1})}>${t.cancel}</button>
                    <button type="button" class="danger solid" ?disabled=${this.state.busy} @click=${()=>this.discard()}>${t.discardYes}</button>
                </div>
            </footer>`:D`<footer class="actions">
            ${e.draft&&this.bar.config.design.discard?D`<button type="button" class="danger" ?disabled=${this.state.busy}
                @click=${()=>this.update({confirming:!0})}>${t.designDiscard}</button>`:A}
            ${this.bar.config.design.publish?D`<button type="button" class="primary" ?disabled=${this.state.busy||!e.draft}
                @click=${()=>this.publish()}>${t.designPublish}</button>`:A}
        </footer>`}group(e,t){return e.length===0?A:D`<fieldset><legend>${t}</legend>${e.map(e=>this.field(e))}</fieldset>`}field(e){let t=`fb-design-${e.name}`,n=e.value===e.default?A:D`<button type="button" class="reset" aria-label=${this.labels.designResetOf.replace(`{token}`,e.label)} title=${this.labels.designReset}
                @click=${()=>this.change(e,null)}>${z(`restore`)}</button>`;switch(e.type){case`color`:return D`<div class="token">
                    <label for=${t}>${e.label}</label>
                    <div class="row">
                        <input type="color" id=${t} .value=${H(e.value)?e.value:`#000000`} @input=${t=>this.change(e,t.target.value)}>
                        <input type="text" class="hex" .value=${e.value} maxlength="7" spellcheck="false" aria-label=${this.labels.designHex.replace(`{token}`,e.label)}
                            @change=${t=>this.typed(e,t.target)}>
                        ${n}
                    </div>
                    ${this.contrastHint(e)}
                </div>`;case`font`:return D`<div class="token">
                    <label for=${t}>${e.label}</label>
                    <div class="row">
                        <select id=${t} style="font-family: ${e.css}" @change=${t=>this.change(e,t.target.value)}>
                            ${e.options.map(t=>D`<option value=${t.value} ?selected=${t.value===e.value} style="font-family: ${t.css}">${this.labels.fontNames?.[t.value]??t.label}</option>`)}
                        </select>
                        ${n}
                    </div>
                </div>`;case`length`:{let r=parseFloat(e.value);return D`<div class="token">
                    <label for=${t}>${e.label}</label>
                    <div class="row">
                        <input type="range" id=${t} min=${e.min??0} max=${e.max??Math.max(100,r*2)} step=${e.step??1} .value=${String(r)}
                            aria-valuetext=${`${r} ${e.unit}`} @input=${t=>this.change(e,`${t.target.value}${e.unit}`)}>
                        <output for=${t}>${r} ${e.unit}</output>
                        ${n}
                    </div>
                </div>`}default:return D`<fieldset class="token">
                    <legend>${e.label}</legend>
                    ${e.options.map(n=>D`<label class="choice"><input type="radio" name=${t} value=${n.value} .checked=${n.value===e.value}
                        @change=${()=>this.change(e,n.value)}><span>${n.label}</span></label>`)}
                    ${n}
                </fieldset>`}}typed(e,t){let n=t.value.trim();n=n.startsWith(`#`)?n:`#${n}`,H(n)?this.change(e,n.toLowerCase()):t.value=e.value}contrastHint(e){let t=e.contrast?.token;if(!t)return A;let n=this.token(t),r=n?n.css:getComputedStyle(document.documentElement).getPropertyValue(`--${t}`),i=Mt(e.css,r);return i===null||i>=kt?A:D`<p class="warning">${z(`warning`)}<span>${this.labels.designContrast.replace(`{ratio}`,i.toLocaleString(this.bar.config.language)).replace(`{other}`,n?.label??t)}</span></p>`}},Pt=d`
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
`,Ft=new Map;function U(e,t){Ft.set(e,[...Ft.get(e)??[],t])}function It(e,t){return(Ft.get(e.dataset.fbType)??[]).flatMap(n=>n(e,t)??[])}function Lt(e){let t=e.closest(`a[href]`)??e.querySelector(`a[href]`);return t?new URL(t.getAttribute(`href`),location.href):null}function Rt(e,t=!1){e&&(t||e.origin!==location.origin?window.open(e.href,`_blank`,`noopener`):location.assign(e.href))}function W(e){return e.hasAttribute(`data-fb-optional`)&&e.dataset.fbValue!==void 0}U(`link`,(e,t)=>{let n=t.labels,r=Lt(e);return[{icon:`pencil`,label:n.editLink,run:()=>t.editing?.editLink(e)},{icon:`external`,label:n.openLink,title:n.openLinkHint,run:()=>Rt(r),disabled:!r},...W(e)?[{icon:`trash`,label:n.removeLink,run:()=>t.editing?.save(e,null),tone:`danger`}]:[]]}),U(`image`,(e,t)=>{let n=t.labels,r=e.dataset.fbValue!==void 0,i=e.querySelector(`img`)?.getAttribute(`src`)?.split(`?`)[0].endsWith(`.svg`)??!1;return[{icon:`image`,label:r?n.imageChosen:n.chooseImage,run:()=>t.editing?.editImage(e)},...r?[{icon:`alt`,label:n.altHere,run:()=>t.editing?.editImage(e,`alt`)}]:[],...r&&!i&&t.config.mayUpdateMedia?[{icon:`focus`,label:n.setFocusPoint,run:()=>t.editing?.editImage(e,`focus`)}]:[],...W(e)?[{icon:`trash`,label:n.removeImage,run:()=>t.editing?.save(e,null),tone:`danger`}]:[]]});for(let e of[`headline`,`text`,`richtext`])U(e,(e,t)=>W(e)?[{icon:`eraser`,label:t.labels.clearField,run:()=>t.editing?.clear(e),tone:`danger`}]:[]);U(`video`,(e,t)=>{let n=t.labels;return[{icon:`video`,label:e.dataset.fbValue===void 0?n.chooseVideo:n.videoChosen,run:()=>t.editing?.editImage(e)},...W(e)?[{icon:`trash`,label:n.removeVideo,run:()=>t.editing?.save(e,null),tone:`danger`}]:[]]}),U(`file`,(e,t)=>{let n=t.labels;return[{icon:`file`,label:e.dataset.fbValue===void 0?n.chooseDocument:n.documentChosen,run:()=>t.editing?.editImage(e)},...W(e)?[{icon:`trash`,label:n.removeDocument,run:()=>t.editing?.save(e,null),tone:`danger`}]:[]]}),U(`icon`,(e,t)=>{let n=t.labels;return[{icon:`symbol`,label:n.chooseIcon,run:()=>t.editing?.editIcon(e)},...W(e)?[{icon:`trash`,label:n.removeIcon,run:()=>t.editing?.save(e,null),tone:`danger`}]:[]]});var zt=`fb-unsaved:`,Bt=class{constructor(e){this.key=e?`${zt}${e}`:null}all(){if(!this.key)return{};let e={};try{e=JSON.parse(localStorage.getItem(this.key)??`{}`)??{}}catch{return{}}let t=Date.now()-6048e5,n=Object.fromEntries(Object.entries(e).filter(([,e])=>e&&typeof e.at==`number`&&e.at>=t));return Object.keys(n).length!==Object.keys(e).length&&this.write(n),n}keep(e,t,n){let r=this.all();r[e]={value:t??null,previous:r[e]?.previous??n??null,at:Date.now()},this.write(r)}saved(e,t,n){let r=this.all();r[e]&&n(r[e].value,t)&&(delete r[e],this.write(r))}forget(e){let t=this.all();t[e]&&(delete t[e],this.write(t))}write(e){if(this.key)try{Object.keys(e).length===0?localStorage.removeItem(this.key):localStorage.setItem(this.key,JSON.stringify(e))}catch{}}},Vt=(function(){let e=typeof document<`u`&&document.createElement(`link`).relList;return e&&e.supports&&e.supports(`modulepreload`)?`modulepreload`:`preload`})(),Ht=function(e){return`/`+e},Ut={},Wt=function(e){return e.pathname.endsWith(`.css`)},Gt=function(e,t,n){if(t in e)return e[t];let r=n();if(!r){e[t]=void 0;return}let i=r.then(()=>{e[t]=void 0},n=>{throw e[t]=void 0,n});return e[t]=i,i},Kt=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e,i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}function s(e){return import.meta.resolve?new URL(import.meta.resolve(e)):new URL(e,import.meta.url)}r=o(t.map(t=>{t=Ht(t,n);let r=s(t),i=Wt(r);return Gt(Ut,r.href,()=>{if(e===void 0){e={all:new Set,styles:new Set};let t=document.getElementsByTagName(`link`);for(let n=t.length-1;n>=0;n--){let r=t[n];e.all.add(r.href),r.rel===`stylesheet`&&e.styles.add(r.href)}}if((i?e.styles:e.all).has(r.href))return;let t=document.createElement(`link`);if(t.rel=i?`stylesheet`:Vt,i||(t.as=`script`),t.crossOrigin=``,t.href=r.href,a&&t.setAttribute(`nonce`,a),document.head.appendChild(t),i)return new Promise((e,n)=>{t.addEventListener(`load`,e),t.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${r}`)))})})}).filter(e=>e!==void 0))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},G=[`headline`,`text`],qt=1e3;function Jt(e){if(e.dataset.fbValue===void 0)return null;try{return JSON.parse(e.dataset.fbValue)}catch{return null}}function K(e,t){return JSON.stringify(q(e))===JSON.stringify(q(t))}function q(e){return Array.isArray(e)?e.map(q):e&&typeof e==`object`?Object.fromEntries(Object.keys(e).sort().map(t=>[t,q(e[t])])):e??null}function Yt(e){let t=e.dataset.fbType===`headline`,n=e.innerText.replace(/ /g,` `).replace(/\n+$/,``);return t&&(n=n.replace(/\s*\n\s*/g,` `)),n===``?null:n}var Xt=class{constructor(e){this.bar=e,this.saved=new WeakMap,this.timers=new Map,this.queues=new WeakMap,this.editors=new WeakMap,this.contents=new WeakMap,this.loading=null,this.pointer=null,this.unsaved=new Bt(e.config.user??null),this.onFocus=e=>this.focus(e),this.onBlur=e=>this.blur(e),this.onInput=e=>this.input(e),this.onKey=e=>this.key(e),this.onClick=e=>this.click(e),this.onPointer=e=>{this.pointer={left:e.clientX,top:e.clientY,at:Date.now()}},this.onLeave=e=>this.leave(e)}start(){for(let e of document.querySelectorAll(`[data-fb-field]`))G.includes(e.dataset.fbType)&&(e.contentEditable=`plaintext-only`);document.addEventListener(`focusin`,this.onFocus,!0),document.addEventListener(`focusout`,this.onBlur,!0),document.addEventListener(`input`,this.onInput,!0),document.addEventListener(`keydown`,this.onKey,!0),document.addEventListener(`click`,this.onClick,!0),document.addEventListener(`pointerdown`,this.onPointer,!0),addEventListener(`beforeunload`,this.onLeave),this.offer()}stop(){document.removeEventListener(`focusin`,this.onFocus,!0),document.removeEventListener(`focusout`,this.onBlur,!0),document.removeEventListener(`input`,this.onInput,!0),document.removeEventListener(`keydown`,this.onKey,!0),document.removeEventListener(`click`,this.onClick,!0),document.removeEventListener(`pointerdown`,this.onPointer,!0),removeEventListener(`beforeunload`,this.onLeave)}field(e){return e instanceof Element?e.closest(`[data-fb-field]`):null}twins(e){let t=e.dataset.fbSite!==void 0,n=e.dataset.fbObject,r=e.closest(`[data-fb-block]`),i=[...document.querySelectorAll(`[data-fb-field="${CSS.escape(e.dataset.fbField)}"]`)].filter(e=>n===void 0?e.dataset.fbObject===void 0&&e.dataset.fbSite!==void 0===t&&(t||e.closest(`[data-fb-block]`)===r):e.dataset.fbObject===n);return i.includes(e)?i:[e,...i]}fieldKey(e){let t=e.dataset.fbObject,n=e.dataset.fbSite!==void 0;return[t?`object:${t}`:n?`site`:`page:${this.bar.config.page?.id??``}`,t?e.dataset.fbLanguage??this.bar.config.language:this.bar.config.language,t||n?``:e.closest(`[data-fb-block]`)?.dataset.fbBlock??``,e.dataset.fbField].join(`|`)}offer(){let e=this.unsaved.all(),t=new Map;for(let n of document.querySelectorAll(`[data-fb-field]`)){let r=this.fieldKey(n),i=e[r];if(!i||n.dataset.fbPart!==void 0||t.has(r))continue;let a=Jt(n);K(a,i.value)?this.unsaved.forget(r):t.set(r,{key:r,element:n,value:i.value,changed:!K(a,i.previous)})}t.size>0&&this.bar.offerUnsaved([...t.values()])}restore(e){return this.save(e.element,e.value,!0)}forgetUnsaved(e){for(let t of e)this.unsaved.forget(t.key)}savedValue(e){return this.saved.has(e)?this.saved.get(e):Jt(e)}focus(e){let t=this.field(e.target);[`richtext`,`table`].includes(t?.dataset.fbType)&&!this.editors.has(t)&&this.richText(t)}blur(e){let t=this.field(e.target);t&&G.includes(t.dataset.fbType)&&this.flush(t)}input(e){let t=this.field(e.target);t&&G.includes(t.dataset.fbType)&&(Yt(t)===null&&t.childNodes.length>0&&t.replaceChildren(),this.later(t,()=>Yt(t)))}key(e){let t=this.field(e.target);if(!t)return;let n=t.dataset.fbType;if(G.includes(n))e.key===`Escape`?(e.preventDefault(),this.cancel(t),t.innerText=this.savedValue(t)??``,t.blur()):e.key===`Enter`&&n===`headline`&&(e.preventDefault(),t.blur());else if(n===`link`&&(e.key===`Enter`||e.key===` `))e.preventDefault(),this.editLink(t);else if([`image`,`video`,`file`].includes(n)&&(e.key===`Enter`||e.key===` `))e.preventDefault(),this.editImage(t);else if(n===`icon`&&(e.key===`Enter`||e.key===` `))e.preventDefault(),this.editIcon(t);else if([`richtext`,`table`].includes(n)&&e.key===`F10`&&e.altKey)e.preventDefault(),this.bar.focusToolbar();else if([`richtext`,`table`].includes(n)&&e.key===`Escape`){let n=this.editors.get(t);n&&(e.preventDefault(),this.cancel(t),n.commands.setContent(this.contents.get(t)(this.savedValue(t)),{emitUpdate:!1}),n.commands.blur(),t.blur())}}click(e){let t=this.field(e.target),n=e.target instanceof Element?e.target.closest(`a`):null;n&&(t||n.querySelector(`[data-fb-field]`))&&e.preventDefault(),t?.dataset.fbType===`link`&&(e.ctrlKey||e.metaKey)?(e.preventDefault(),Rt(Lt(t),!0)):t?.dataset.fbType===`link`?(e.preventDefault(),this.editLink(t)):[`image`,`video`,`file`].includes(t?.dataset.fbType)?(e.preventDefault(),this.editImage(t)):t?.dataset.fbType===`icon`&&(e.preventDefault(),this.editIcon(t))}leave(e){let t=this.timers.size>0;this.flushAll(),(t||this.bar.saving>0)&&e.preventDefault()}flushAll(){let e=[...this.timers.keys()].map(e=>this.flush(e));return Promise.all(e)}later(e,t){clearTimeout(this.timers.get(e)?.timer),this.timers.set(e,{read:t,timer:setTimeout(()=>this.flush(e),qt)}),this.unsaved.keep(this.fieldKey(e),t(),this.savedValue(e))}flush(e){let t=this.timers.get(e);return t?(clearTimeout(t.timer),this.timers.delete(e),this.save(e,t.read())):Promise.resolve(!0)}cancel(e){clearTimeout(this.timers.get(e)?.timer),this.timers.delete(e),this.unsaved.forget(this.fieldKey(e))}save(e,t,n=!1){this.unsaved.keep(this.fieldKey(e),t,this.savedValue(e));let r=(this.queues.get(e)??Promise.resolve()).then(()=>this.send(e,t,n));return this.queues.set(e,r.catch(()=>{})),r}async send(e,t,n=!1){let r=this.savedValue(e),i=this.fieldKey(e);if(K(r,t))return this.unsaved.saved(i,t,K),!0;let a=e.dataset.fbSite!==void 0,o=e.dataset.fbObject??null,s=o?await this.bar.run(`object.update-field`,{target:o,language:e.dataset.fbLanguage??this.bar.config.language,name:e.dataset.fbField,value:t,previous:r}):a?await this.bar.run(`site.update-field`,{language:this.bar.config.language,path:e.dataset.fbField,value:t,previous:r}):await this.bar.run(`page.update-field`,{id:this.bar.config.page.id,language:this.bar.config.language,path:e.dataset.fbField,block:e.closest(`[data-fb-block]`)?.dataset.fbBlock??null,value:t,previous:r});if(!s.ok)return this.bar.keptUnsaved(),!1;let c=s.data;this.unsaved.saved(i,t,K);for(let t of this.twins(e))this.saved.set(t,c.value),c.value===null?delete t.dataset.fbValue:t.dataset.fbValue=JSON.stringify(c.value),t.dataset.fbPart===void 0?[`link`,`image`,`video`,`icon`,`file`].includes(t.dataset.fbType)?t.innerHTML=c.html:n&&this.show(t,c):t.innerHTML=c.parts?.[t.dataset.fbPart]??``;return this.bar.changed(c.entry,a,o),c.value!==null&&this.bar.solved(e),!0}clear(e){return this.save(e,null,!0)}show(e,t){let n=this.editors.get(e);G.includes(e.dataset.fbType)?e.innerText=t.value??``:n?n.commands.setContent(this.contents.get(e)(t.value),{emitUpdate:!1}):e.innerHTML=t.html}editLink(e){let t=this.savedValue(e)??{};this.bar.openLink({withText:!0,text:t.text??``,href:t.target??t.url??``,newWindow:t.newWindow===!0,apply:({text:t,href:n,newWindow:r})=>{let i=n.startsWith(`page:`)?{target:n}:{url:n};t&&(i.text=t),r&&(i.newWindow=!0),this.save(e,i)},remove:()=>this.save(e,null),done:()=>e.focus(),openUrl:Lt(e)})}editImage(e,t=null){this.bar.media.open({kind:[`video`,`file`].includes(e.dataset.fbType)?e.dataset.fbType:`image`,value:this.savedValue(e),caption:(e.dataset.fbParts??``).split(` `).includes(`caption`),focus:t??e.dataset.fbPart??null,apply:t=>this.save(e,t),remove:()=>this.save(e,null),done:()=>e.focus()})}editIcon(e){this.bar.icons.open({value:this.savedValue(e),apply:t=>this.save(e,t),remove:()=>this.save(e,null),done:()=>e.focus()})}async richText(e){let{createEditor:t,valueOf:n,contentOf:r}=await(e.dataset.fbType===`table`?this.tableLoading??=Kt(()=>import(`./chunks/edit-table-C1M8jtKJ.js`),[]):this.loading??=Kt(()=>import(`./chunks/edit-richtext-D_wrPmJw.js`),[]));if(this.editors.has(e))return;let i=this.pointer&&Date.now()-this.pointer.at<2e3?this.pointer:null,a=t(e,this.savedValue(e),{update:()=>this.later(e,()=>n(a)),selection:()=>this.bar.showToolbar(a),blur:t=>{t.relatedTarget!==this.bar&&(this.flush(e),this.bar.hideToolbar(a))}});this.editors.set(e,a),this.contents.set(e,r);let o=i?a.view.posAtCoords(i):null;e.blur(),a.commands.focus(o?o.pos:`end`,{scrollIntoView:!1})}},Zt=[`image/jpeg`,`image/png`,`image/webp`,`image/gif`,`image/svg+xml`,`.svg`],Qt=[`video/mp4`,`video/webm`],$t=[`.pdf`,`.docx`,`.xlsx`,`.pptx`,`.odt`,`.ods`,`.odp`,`.txt`,`.csv`,`.zip`],en=2097152,tn=3;async function nn(e,t,{headers:n={},partBytes:r=en,progress:i=()=>{},failed:a=`The server cannot be reached.`}={}){let o=Math.max(4096,Number(r)||en),s=0,c=null,l=0;for(;;){let r=new FormData;r.append(`file`,t.slice(s,s+o),t.name),r.append(`name`,t.name),r.append(`total`,String(t.size)),r.append(`offset`,String(s)),c&&r.append(`upload`,c);let u=null,d=null;try{u=await fetch(e,{method:`POST`,headers:{Accept:`application/json`,...n},credentials:`same-origin`,body:r}),d=await u.json().catch(()=>null)}catch{u=null}if(u?.status===409&&u.headers.has(`Upload-Offset`)&&l<tn)s=Number(u.headers.get(`Upload-Offset`)),l++;else if(!u&&l<tn)l++;else{if(!u?.ok)return{ok:!1,data:null,problem:{detail:d?.detail??a,errors:d?.errors??[],status:u?.status??0}};if(l=0,c=d.data.upload,s=d.data.complete===!1?d.data.received:t.size,i(Math.min(s,t.size),t.size),d.data.complete!==!1)return{ok:!0,data:d.data,problem:null}}}}var rn=120,an=300,on=[`image/svg+xml`,`.svg`],sn=class{constructor(e){this.bar=e,this.state=null,this.seen=new Map,this.asked=new Set}get labels(){return this.bar.labels}open({value:e,apply:t,remove:n,done:r}){this.state={value:e,chosen:e??null,query:``,set:``,apply:t,remove:n,done:r,items:[],total:0,page:1,sets:[],loading:!0,uploading:null,problems:[]},this.load(1),this.bar.requestUpdate(),this.bar.updateComplete.then(()=>this.bar.renderRoot.querySelector(`dialog.icons`)?.showModal())}async fetch(e){try{let t=await fetch(this.bar.config.queries+`icon.list?`+new URLSearchParams(e),{headers:{Accept:`application/json`},credentials:`same-origin`}),n=t.ok?await t.json():null;return(n?.data?.items??[]).forEach(e=>this.seen.set(e.name,e)),n?.data??null}catch{return null}}async load(e){let t=this.state,n={page:String(e),perPage:String(rn)};t.query.trim()!==``&&(n.search=t.query.trim()),t.set!==``&&(n.set=t.set),this.update({loading:!0});let r=await this.fetch(n),i=e===1&&this.state?.items.length===0;this.state!==null&&this.state.query===t.query&&this.state.set===t.set&&(this.update({loading:!1,page:e,total:r?.total??0,sets:r?.sets??this.state.sets,items:e===1?r?.items??[]:[...this.state.items,...r?.items??[]],problems:r?[]:[this.labels.failed]}),i&&this.bar.updateComplete.then(()=>{(this.bar.renderRoot.querySelector(`dialog.icons .icon-grid [aria-pressed="true"]`)??this.bar.renderRoot.querySelector(`dialog.icons input[type="search"]`))?.focus()}))}describe(e){return!e||this.seen.has(e)?e?this.seen.get(e):null:(this.asked.has(e)||(this.asked.add(e),this.fetch({name:e,perPage:`1`}).then(()=>this.bar.requestUpdate())),null)}search(e){this.update({query:e}),clearTimeout(this.timer),this.timer=setTimeout(()=>this.load(1),an)}choose(e){this.update({set:e,items:[],total:0}),this.load(1)}update(e){this.state={...this.state,...e},this.bar.requestUpdate()}pickFile(){let e=document.createElement(`input`);e.type=`file`,e.accept=on.join(`,`),e.addEventListener(`change`,()=>e.files?.[0]&&this.upload(e.files[0])),e.click()}async upload(e){let t=this.labels,n=e=>t.uploading.replace(`{done}`,`1`).replace(`{total}`,`1`).replace(`{percent}`,String(e));this.update({uploading:n(0),problems:[]});let r=await nn(this.bar.config.uploads,e,{headers:{"X-CSRF-Token":this.bar.config.csrf??``},partBytes:this.bar.config.uploadPart,failed:t.failed,progress:(e,t)=>this.state&&this.update({uploading:n(Math.round(e/Math.max(1,t)*100))})});if(!this.state)return;if(!r.ok){this.update({uploading:null,problems:[`${e.name}: ${r.problem.errors?.[0]?.message??r.problem.detail}`]});return}let i=await this.bar.run(`media.create`,{upload:r.data.upload});this.state&&(!i.ok||i.data.type!==`image/svg+xml`?this.update({uploading:null,problems:[`${e.name}: ${i.ok?t.notAnSvg:this.bar.message?.text??t.failed}`]}):(this.update({uploading:null,query:``,set:`media`,items:[],chosen:`media:`+i.data.id}),await this.load(1)))}apply(){let e=this.state;e?.chosen&&this.close(e.chosen===e.value?null:()=>e.apply(e.chosen))}close(e=null){let t=this.state;clearTimeout(this.timer),this.bar.renderRoot.querySelector(`dialog.icons`)?.close(),this.state=null,this.bar.requestUpdate(),e?.(),t?.done?.()}dialog(){let e=this.state;if(!e)return A;let t=this.labels,n=this.bar.config.mayUpload,r=e.sets.filter(t=>t.count>0||t.name===`media`&&n||t.name===e.set),i=e.sets.reduce((e,t)=>e+t.count,0),a=e.items.length<e.total,o;if(e.items.length===0){let n=e.set===`media`?t.noOwnIcons:i===0?t.noIcons:t.noIconFound;o=D`<p class="hint">${e.loading?t.loading:n}</p>`}else o=D`<ul class="icon-grid" aria-label=${t.icons}>
                ${e.items.map(t=>D`<li><button type="button" aria-pressed=${String(t.name===e.chosen)}
                    @click=${()=>this.update({chosen:t.name})} @dblclick=${()=>{this.update({chosen:t.name}),this.apply()}}>
                    ${qe(t.svg)}<span>${t.label}</span></button></li>`)}
            </ul>
            ${a?D`<button type="button" class="more" ?disabled=${e.loading} @click=${()=>this.load(e.page+1)}>${t.loadMore}</button>`:A}`;return D`<dialog class="icons" aria-labelledby="fb-icons-title" @cancel=${e=>{e.preventDefault(),this.close()}}>
            <form @submit=${e=>{e.preventDefault(),this.apply()}}>
                <h2 id="fb-icons-title">${t.chooseIcon}</h2>
                <div class="media-tools">
                    ${r.length>1?D`<label>${t.iconSet}
                        <select @change=${e=>this.choose(e.target.value)}>
                            <option value="" ?selected=${e.set===``}>${t.allIconSets}</option>
                            ${r.map(t=>D`<option .value=${t.name} ?selected=${t.name===e.set}>${t.label} (${t.count})</option>`)}
                        </select></label>`:A}
                    <label>${t.search}
                        <input type="search" .value=${e.query} autocomplete="off" @input=${e=>this.search(e.target.value)}></label>
                    ${n?D`<button type="button" ?disabled=${e.uploading!==null} @click=${()=>this.pickFile()}>${t.uploadSvg}</button>`:A}
                </div>
                <p class="hint" role="status">${e.uploading??``}</p>
                ${e.problems.length>0?D`<ul class="problems" role="alert">${e.problems.map(e=>D`<li>${e}</li>`)}</ul>`:A}
                ${o}
                <div class="actions">
                    ${e.value?D`<button type="button" class="danger" @click=${()=>this.close(e.remove)}>${t.removeIcon}</button>`:A}
                    <button type="button" @click=${()=>this.close()}>${t.cancel}</button>
                    <button type="submit" class="primary" ?disabled=${!e.chosen}>${t.apply}</button>
                </div>
            </form>
        </dialog>`}},cn=d`
    dialog.icons { inline-size: min(100% - var(--fb-space-8), var(--fb-size-content)); }

    .icon-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(calc(var(--fb-space-16) * 1.5), 1fr));
        gap: var(--fb-space-2);
        max-block-size: calc(var(--fb-space-16) * 5);
        margin: 0;
        padding: var(--fb-space-1);
        overflow-y: auto;
        list-style: none;
    }

    .icon-grid button {
        display: grid;
        justify-items: center;
        gap: var(--fb-space-1);
        inline-size: 100%;
        padding: var(--fb-space-2) var(--fb-space-1);
        border-color: transparent;
        font-weight: var(--fb-weight-regular);
    }

    .icon-grid svg {
        inline-size: var(--fb-space-8);
        block-size: var(--fb-space-8);
        color: var(--fb-text);
    }

    .icon-grid span {
        max-inline-size: 100%;
        overflow: hidden;
        font-size: var(--fb-text-xs);
        color: var(--fb-text-muted);
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .icon-grid button[aria-pressed="true"] {
        border-color: var(--fb-accent);
        background: var(--fb-accent-soft);
        box-shadow: inset 0 0 0 var(--fb-size-focus) var(--fb-accent);
    }

    dialog.icons .more { justify-self: start; }
`,ln=`important`,un=` !`+ln,dn=Ue(class extends We{constructor(e){if(super(e),e.type!==He.ATTRIBUTE||e.name!==`style`||e.strings?.length>2)throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.")}render(e){return Object.keys(e).reduce((t,n)=>{let r=e[n];return r==null?t:t+`${n=n.includes(`-`)?n:n.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g,`-$&`).toLowerCase()}:${r};`},``)}update(e,[t]){let{style:n}=e.element;if(this.ft===void 0)return this.ft=new Set(Object.keys(t)),this.render(t);for(let e of this.ft)t[e]??(this.ft.delete(e),e.includes(`-`)?n.removeProperty(e):n[e]=null);for(let e in t){let r=t[e];if(r!=null){this.ft.add(e);let t=typeof r==`string`&&r.endsWith(un);e.includes(`-`)||t?n.setProperty(e,t?r.slice(0,-11):r,t?ln:``):n[e]=r}}return k}}),fn=.05,pn=class extends L{static properties={x:{type:Number},y:{type:Number},label:{},position:{},disabled:{type:Boolean,reflect:!0}};constructor(){super(),this.x=.5,this.y=.5,this.label=`Focus point`,this.position=`{x} % from the left, {y} % from the top`,this.disabled=!1,this.marker=null,this.onClick=this.onClick.bind(this),this.onKeyDown=this.onKeyDown.bind(this)}createRenderRoot(){return this}connectedCallback(){super.connectedCallback(),this.marker||(this.marker=document.createElement(`button`),this.marker.type=`button`,this.marker.className=`fb-focus__marker`,this.append(this.marker)),this.addEventListener(`click`,this.onClick),this.marker.addEventListener(`keydown`,this.onKeyDown)}disconnectedCallback(){this.removeEventListener(`click`,this.onClick),this.marker?.removeEventListener(`keydown`,this.onKeyDown),super.disconnectedCallback()}updated(){let e=Math.round(this.x*100),t=Math.round(this.y*100);this.marker.style.left=`${e}%`,this.marker.style.top=`${t}%`,this.marker.disabled=this.disabled,this.marker.setAttribute(`aria-label`,`${this.label}: ${this.position.replace(`{x}`,String(e)).replace(`{y}`,String(t))}`);for(let[e,t]of[[`focusX`,this.x],[`focusY`,this.y]]){let n=this.querySelector(`input[name="${e}"]`),r=String(Math.round(t*1e3)/1e3);n&&n.value!==r&&(n.value=r,this.rendered&&n.dispatchEvent(new Event(`input`,{bubbles:!0})))}this.rendered=!0}move(e,t){this.x=Math.min(1,Math.max(0,e)),this.y=Math.min(1,Math.max(0,t)),this.dispatchEvent(new CustomEvent(`fb-focus-change`,{detail:{x:this.x,y:this.y},bubbles:!0}))}onClick(e){let t=this.querySelector(`img`);if(this.disabled||!t||e.target===this.marker)return;let n=t.getBoundingClientRect();n.width!==0&&n.height!==0&&(this.move((e.clientX-n.left)/n.width,(e.clientY-n.top)/n.height),this.marker.focus())}onKeyDown(e){let t={ArrowLeft:[-.05,0],ArrowRight:[fn,0],ArrowUp:[0,-.05],ArrowDown:[0,fn]}[e.key];!this.disabled&&t&&(e.preventDefault(),this.move(this.x+t[0],this.y+t[1]))}};customElements.define(`fb-focus`,pn);var mn=24,hn=300,gn=class{constructor(e){this.bar=e,this.state=null,this.timer=null,this.opened=0}get labels(){return this.bar.labels}open({kind:e=`image`,value:t,caption:n=!1,focus:r=null,apply:i,remove:a,done:o}){this.opened++,this.state={kind:e,tab:`media`,value:t,apply:i,remove:a,done:o,chosen:t?.media??null,poster:t?.poster??null,seen:{},alt:t?.alt??``,text:t?.text??``,withCaption:e===`image`&&n,caption:t?.caption??``,copyright:t?.copyright??``,ai:null,point:null,refresh:!1,query:``,items:[],total:0,page:0,loading:!0,uploading:null,question:null,replaced:!1,applying:!1,problems:[],notices:[]},this.load(1);let s=[t?.media,t?.poster].filter(Boolean).map(e=>this.show(e)),c=this.opened;this.bar.requestUpdate(),this.bar.updateComplete.then(async()=>{if(this.bar.renderRoot.querySelector(`dialog.media`)?.showModal(),r===`focus`&&this.state?.chosen&&(await Promise.all(s),await this.bar.updateComplete),this.opened!==c)return;let e=!r||!this.state?.chosen?null:r===`focus`?`dialog.media .fb-focus__marker`:`dialog.media [name="${r}"]`;((e&&this.bar.renderRoot.querySelector(e))??this.bar.renderRoot.querySelector(`dialog.media input[type="search"]`))?.focus()})}async show(e){let t=this.opened,n=null;try{let t=await fetch(this.bar.config.queries+`media.show?`+new URLSearchParams({id:e}),{headers:{Accept:`application/json`},credentials:`same-origin`});n=t.ok?await t.json():null}catch{n=null}n?.data&&this.state&&this.opened===t&&this.update({seen:{...this.state.seen,[e]:n.data}})}item(e,t=this.state){return e?t.items.find(t=>t.id===e)??t.seen[e]??null:null}update(e){this.state={...this.state,...e},this.bar.requestUpdate()}listKind(e=this.state){return e.kind===`file`?`document`:e.kind===`video`&&e.tab===`media`?`video`:`image`}picked(e=this.state){return e.tab===`poster`?e.poster:e.chosen}pick(e){let t=this.state.items.find(t=>t.id===e),n=t?{...this.state.seen,[e]:t}:this.state.seen;this.update(this.state.tab===`poster`?{poster:e,seen:n}:{chosen:e,seen:n,ai:null,point:null})}tab(e){this.state.tab!==e&&(this.update({tab:e,items:[],total:0,problems:[],notices:[]}),this.load(1))}async load(e){let t=this.state,n=new URLSearchParams({page:String(e),perPage:String(mn),kind:this.listKind(t)});t.query.trim()!==``&&n.set(`search`,t.query.trim()),this.update({loading:!0});let r=null;try{let e=await fetch(this.bar.config.queries+`media.list?`+n,{headers:{Accept:`application/json`},credentials:`same-origin`});r=e.ok?await e.json():null}catch{r=null}if(this.state!==null&&this.state.query===t.query&&this.state.tab===t.tab){let t=r?.data?.items??[];this.update({loading:!1,page:e,total:r?.data?.total??0,items:e===1?t:[...this.state.items,...t],problems:r?[]:[this.labels.failed]})}}search(e){this.update({query:e}),clearTimeout(this.timer),this.timer=setTimeout(()=>this.load(1),hn)}async upload(e){let t=[],n=[],r=this.state.tab===`media`?this.state.value?.media??null:null;for(let[i,a]of e.entries()){let o=t=>this.labels.uploading.replace(`{done}`,String(i+1)).replace(`{total}`,String(e.length)).replace(`{percent}`,String(t));this.update({uploading:o(0)});let s=await nn(this.bar.config.uploads,a,{headers:{"X-CSRF-Token":this.bar.config.csrf??``},partBytes:this.bar.config.uploadPart,failed:this.labels.failed,progress:(e,t)=>this.state&&this.update({uploading:o(Math.round(e/Math.max(1,t)*100))})});if(!s.ok){t.push(`${a.name}: ${s.problem.errors?.[0]?.message??s.problem.detail}`);continue}let c=e.length===1&&r&&this.bar.config.mayReplace?await this.elsewhere(r):0;if(c>0&&this.state){this.update({uploading:null,problems:t,notices:n,question:{upload:s.data.upload,name:a.name,media:r,places:c+1}});return}await this.create(s.data.upload,a.name,t,n)}this.state&&this.update({uploading:null,problems:t,notices:n})}async elsewhere(e){let t=null;try{let n=await fetch(this.bar.config.queries+`media.usages?`+new URLSearchParams({id:e}),{headers:{Accept:`application/json`},credentials:`same-origin`});t=n.ok?await n.json():null}catch{t=null}let n=this.bar.config.page?.id??null,r=this.bar.config.language;return(t?.data??[]).filter(e=>e.type!==`page`||e.id!==n||e.language!==r).length}async create(e,t,n,r){let i=await this.bar.run(`media.create`,{upload:e});if(i.ok&&this.state){let e=this.state.items.filter(e=>e.id!==i.data.id);this.update({items:[i.data,...e],total:this.state.total+ +!i.data.existing}),this.pick(i.data.id),i.data.existing&&r.push(this.labels.alreadyInLibrary.replace(`{name}`,i.data.fileName))}else i.ok||n.push(`${t}: ${this.bar.message?.text??this.labels.failed}`)}async answer(e){let t=this.state?.question;if(!t)return;let n=[],r=[];if(this.update({question:null,uploading:this.labels.uploading.replace(`{done}`,`1`).replace(`{total}`,`1`)}),!e)await this.create(t.upload,t.name,n,r);else{let e=await this.bar.run(`media.replace`,{id:t.media,upload:t.upload});if(e.ok&&this.state){let t=this.state.items.filter(t=>t.id!==e.data.id);this.update({items:[e.data,...t],replaced:!0}),this.pick(e.data.id),r.push(e.data.draft?this.labels.replacedInDraft:this.labels.replacedEverywhere)}else e.ok||n.push(`${t.name}: ${this.bar.message?.text??this.labels.failed}`)}this.state&&this.update({uploading:null,problems:n,notices:r})}choose(){let e=document.createElement(`input`);e.type=`file`,e.multiple=!0,e.accept=({video:Qt,document:$t}[this.listKind()]??Zt).join(`,`),e.addEventListener(`change`,()=>this.upload([...e.files??[]])),e.click()}async apply(){let e=this.state;if(!e?.chosen||e.applying)return;let t=this.opened,n={media:e.chosen},r=t=>this.item(t,e);if(this.bar.mediaChosen(r(e.chosen)),e.kind===`video`)e.poster&&(n.poster=e.poster,this.bar.mediaChosen(r(e.poster)));else if(e.kind===`file`)e.text.trim()!==``&&(n.text=e.text.trim());else{e.alt.trim()!==``&&(n.alt=e.alt.trim()),e.withCaption&&e.caption.trim()!==``&&(n.caption=e.caption.trim());let i=e.copyright.trim(),a=r(e.chosen);if(i!==``&&i!==(a?.copyright??``)&&(this.toMedium(a)&&await this.saveCopyright(a,i)||(n.copyright=i)),e.ai!==null&&a&&e.ai!==(a.ai??`none`)&&this.bar.config.mayUpdateMedia&&await this.saveMedium(a,{ai:e.ai}),e.point&&this.focusable(a)&&!_n(e.point,a.focus)&&await this.saveMedium(a,{focusX:J(e.point.x),focusY:J(e.point.y)})&&this.state&&this.update({refresh:!0}),!this.state||this.opened!==t)return}this.close(()=>e.apply(n))}focusable(e){return!!(e&&e.kind===`image`&&e.type!==`image/svg+xml`&&e.focus&&this.bar.config.mayUpdateMedia)}toMedium(e){return!!(e&&this.bar.config.mayUpdateMedia&&(e.copyright??``)===``)}async saveCopyright(e,t){return this.saveMedium(e,{copyright:t})}async saveMedium(e,t){this.update({applying:!0});let n=await this.bar.run(`media.update`,{id:e.id,...t});return this.state&&this.update({applying:!1}),n.ok?(this.bar.mediaChosen(n.data),!0):!1}close(e=null){let t=this.state;clearTimeout(this.timer),this.bar.renderRoot.querySelector(`dialog.media`)?.close(),this.state=null,this.bar.requestUpdate();let n=e?.();t?.done?.(),(t?.replaced||t?.refresh)&&Promise.resolve(n).finally(()=>this.bar.refresh())}preview(e){return e?D`<figure class="media-chosen">${e.kind===`document`?D`<span class="file-tile" aria-hidden="true">${z(`file`)}<b>${e.format}</b></span>`:e.kind===`video`?D`<video src=${e.preview} preload="metadata" muted playsinline aria-hidden="true"></video>`:D`<img src=${e.preview} alt="" width=${e.width} height=${e.height} decoding="async">`}<figcaption>${e.fileName}</figcaption></figure>`:A}place(e){let t=this.labels,n=this.picked(e),r=this.item(n,e);if(!n)return D`<p class="hint">${{video:t.pickVideoFirst,document:t.pickDocumentFirst}[this.listKind(e)]??t.pickImageFirst}</p>`;if(e.kind===`video`)return D`${this.preview(r)}
                ${e.tab===`poster`?D`<p class="hint">${t.posterHint}</p>
                        <div class="actions start"><button type="button" @click=${()=>this.update({poster:null})}>${t.noPoster}</button></div>`:D`<p class="hint">${t.videoHint}</p>`}`;if(e.kind===`file`)return D`${this.preview(r)}
                <label>${t.linkTextHere}
                    <input type="text" name="text" .value=${e.text} maxlength="200" placeholder=${r?.texts?.[this.bar.config.language]?.title??``} aria-describedby="fb-media-text-hint"
                        @input=${e=>this.update({text:e.target.value})}></label>
                <p class="hint" id="fb-media-text-hint">${t.linkTextHereHint}</p>`;let i=r?.copyright??``,a=i===``?this.toMedium(r)?t.copyrightToMedium:t.copyrightOnlyHere:t.copyrightHereHint,o=e.point??r?.focus;return D`${this.focusable(r)?D`<figure class="media-chosen">
                    <fb-focus class="fb-focus" .x=${o.x} .y=${o.y} label=${t.focusPoint} position=${t.focusPosition}
                        style=${dn({"--ratio":`${r.width} / ${r.height}`})}
                        @fb-focus-change=${e=>this.update({point:{x:e.detail.x,y:e.detail.y}})}>
                        <img src=${r.preview} alt="" width=${r.width} height=${r.height} decoding="async">
                    </fb-focus>
                    <figcaption>${r.fileName}</figcaption></figure>
                    <p class="hint">${t.focusPointHint}</p>`:this.preview(r)}
            <label>${t.altHere}
                <input type="text" name="alt" .value=${e.alt} maxlength="500" placeholder=${r?.texts?.[this.bar.config.language]?.alt??``} aria-describedby="fb-media-alt-hint"
                    @input=${e=>this.update({alt:e.target.value})}></label>
            <p class="hint" id="fb-media-alt-hint">${t.altHereHint}</p>
            ${e.withCaption?D`<label>${t.captionHere}
                <input type="text" name="caption" .value=${e.caption} maxlength="300"
                    @input=${e=>this.update({caption:e.target.value})}></label>`:A}
            <label>${t.copyrightHere}
                <input type="text" name="copyright" .value=${e.copyright} maxlength="300" placeholder=${i===``?t.copyrightExample:i} aria-describedby="fb-media-copyright-hint"
                    @input=${e=>this.update({copyright:e.target.value})}></label>
            <p class="hint" id="fb-media-copyright-hint">${a}</p>
            <label>${t.ai}
                <select name="ai" .value=${e.ai??r?.ai??`none`} ?disabled=${!this.bar.config.mayUpdateMedia} aria-describedby="fb-media-ai-hint"
                    @change=${e=>this.update({ai:e.target.value})}>
                    ${[`none`,`generated`,`edited`].map(n=>D`<option value=${n} ?selected=${(e.ai??r?.ai??`none`)===n}>${t[{none:`aiNone`,generated:`aiGenerated`,edited:`aiEdited`}[n]]}</option>`)}
                </select></label>
            <p class="hint" id="fb-media-ai-hint">${t.aiHint}</p>`}dialog(){let e=this.state;if(!e)return A;let t=this.labels,n=e.items.length<e.total,r=e.kind===`video`,i=e.kind===`file`,a=this.picked(e),o;if(e.items.length===0){let n={video:t.noVideos,document:t.noDocuments}[this.listKind(e)]??t.noMedia;o=D`<p class="hint">${e.loading?t.loading:e.query.trim()===``?n:t.noMediaFound}</p>`}else o=D`<ul class="media-grid" aria-label=${t.mediaLibrary}>
                ${e.items.map(e=>D`<li><button type="button" aria-pressed=${String(e.id===a)}
                    @click=${()=>this.pick(e.id)} @dblclick=${()=>{this.pick(e.id),this.apply()}}>
                    ${e.kind===`document`?D`<span class="file-tile" aria-hidden="true">${z(`file`)}<b>${e.format}</b></span>`:e.kind===`video`?D`<video src=${e.preview} preload="metadata" muted playsinline aria-hidden="true"></video>`:D`<img src=${e.preview} alt="" width=${e.width} height=${e.height} loading="lazy" decoding="async">`}
                    <span>${e.fileName}</span></button></li>`)}
            </ul>
            ${n?D`<button type="button" ?disabled=${e.loading} @click=${()=>this.load(e.page+1)}>${t.loadMore}</button>`:A}`;let s=r?D`<div class="media-tabs" role="group" aria-label=${t.chooseVideo}>
                ${[[`media`,t.videoTab],[`poster`,t.posterTab]].map(([t,n])=>D`<button type="button" aria-pressed=${String(e.tab===t)} @click=${()=>this.tab(t)}>${n}</button>`)}
            </div>`:A;return D`<dialog class="media" aria-labelledby="fb-media-title" @cancel=${e=>{e.preventDefault(),this.close()}}>
            <form @submit=${e=>{e.preventDefault(),this.apply()}}>
                <h2 id="fb-media-title">${r?t.chooseVideo:i?t.chooseDocument:t.chooseImage}</h2>
                ${s}
                <div class="media-columns">
                    <section class="media-library" aria-labelledby="fb-media-library">
                        <h3 id="fb-media-library">${t.mediaLibrary}</h3>
                        <div class="media-tools">
                            <label>${t.search}
                                <input type="search" .value=${e.query} autocomplete="off" @input=${e=>this.search(e.target.value)}></label>
                            ${this.bar.config.mayUpload?D`<button type="button" ?disabled=${e.uploading!==null||e.question!==null} @click=${()=>this.choose()}>${t.upload}</button>`:A}
                        </div>
                        <p class="hint" role="status">${e.uploading??``}</p>
                        ${e.question?D`<div class="question" role="group" aria-labelledby="fb-media-question">
                            <p id="fb-media-question">${t.replaceWhere.replace(`{name}`,e.question.name)}</p>
                            <div class="actions">
                                <button type="button" @click=${()=>this.answer(!1)}>${t.replaceHere}</button>
                                <button type="button" class="primary" @click=${()=>this.answer(!0)}>${t.replaceEverywhere.replace(`{count}`,String(e.question.places))}</button>
                            </div>
                        </div>`:A}
                        ${e.problems.length>0?D`<ul class="problems" role="alert">${e.problems.map(e=>D`<li>${e}</li>`)}</ul>`:A}
                        ${e.notices.length>0?D`<ul class="notices" role="status">${e.notices.map(e=>D`<li>${e}</li>`)}</ul>`:A}
                        ${o}
                    </section>
                    <section class="media-place" aria-labelledby="fb-media-place">
                        <h3 id="fb-media-place">${t.atThisPlace}</h3>
                        ${this.place(e)}
                    </section>
                </div>
                <div class="actions">
                    ${e.value?D`<button type="button" class="danger" @click=${()=>this.close(e.remove)}>${r?t.removeVideo:i?t.removeDocument:t.removeImage}</button>`:A}
                    <button type="button" @click=${()=>this.close()}>${t.cancel}</button>
                    <button type="submit" class="primary" ?disabled=${!e.chosen||e.question!==null||e.applying}>${t.apply}</button>
                </div>
            </form>
        </dialog>`}};function J(e){return Math.round(Math.min(1,Math.max(0,e))*1e3)/1e3}function _n(e,t){return!!t&&J(e.x)===J(t.x)&&J(e.y)===J(t.y)}var vn=d`
    dialog.media { inline-size: min(100% - var(--fb-space-8), var(--fb-size-content)); }

    /* Choosing and setting apart (decision 0203): side by side, stacked once narrow. */
    .media-columns { display: flex; flex-wrap: wrap; gap: var(--fb-space-4); align-items: start; }

    .media-library { display: grid; flex: 999 1 0; gap: var(--fb-space-3); min-inline-size: 55%; }

    .media-place {
        display: grid;
        flex: 1 1 calc(var(--fb-size-narrow) - var(--fb-space-16));
        gap: var(--fb-space-3);
        padding: var(--fb-space-4);
        border-radius: var(--fb-radius-md);
        background: var(--fb-surface-2);
    }

    .media-columns h3 { margin: 0; font-size: var(--fb-text-md); font-weight: var(--fb-weight-bold); }

    .media-chosen { display: grid; gap: var(--fb-space-1); margin: 0; }

    .media-chosen :is(img, video, .file-tile) {
        inline-size: 100%;
        block-size: auto;
        max-block-size: calc(var(--fb-space-16) * 3);
        object-fit: contain;
        border-radius: var(--fb-radius-sm);
        background: var(--fb-surface);
    }

    /* The focus point on the chosen image (decision 0346): the box is the image itself. */
    .media-chosen .fb-focus {
        position: relative;
        display: block;
        inline-size: min(100%, calc(var(--fb-space-16) * 3 * var(--ratio, 1)));
        justify-self: center;
        cursor: crosshair;
    }

    /* Sized by its ratio before it loads, so the point sits right at once. */
    .media-chosen .fb-focus img {
        display: block;
        inline-size: 100%;
        block-size: auto;
        max-block-size: none;
        aspect-ratio: var(--ratio, auto);
        object-fit: fill;
    }

    .fb-focus__marker {
        position: absolute;
        inline-size: var(--fb-size-control-sm);
        block-size: var(--fb-size-control-sm);
        padding: 0;
        border: calc(var(--fb-size-focus) * 1.5) solid var(--fb-inverse-text);
        border-radius: var(--fb-radius-full);
        background: transparent;
        box-shadow: 0 0 0 var(--fb-size-focus) var(--fb-inverse-bg), inset 0 0 0 var(--fb-size-focus) var(--fb-inverse-bg);
        cursor: grab;
        translate: -50% -50%;
    }

    .fb-focus__marker:focus-visible {
        outline: var(--fb-size-focus) solid var(--fb-focus);
        outline-offset: var(--fb-size-focus-offset);
    }

    .media-chosen figcaption {
        overflow: hidden;
        font-size: var(--fb-text-xs);
        color: var(--fb-text-muted);
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .media-place input { background: var(--fb-surface); }

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

    .media-tabs { display: flex; gap: var(--fb-space-2); }

    .media-tabs button[aria-pressed="true"] {
        border-color: var(--fb-accent);
        background: var(--fb-accent-soft);
        color: var(--fb-accent-text);
    }

    .actions.start { justify-content: flex-start; }

    .media-grid :is(img, video) {
        inline-size: 100%;
        block-size: auto;
        aspect-ratio: 1;
        object-fit: cover;
        border-radius: var(--fb-radius-sm);
        background: var(--fb-surface-2);
    }

    .file-tile {
        display: grid;
        place-content: center;
        justify-items: center;
        gap: var(--fb-space-1);
        aspect-ratio: 1;
        border-radius: var(--fb-radius-sm);
        background: var(--fb-surface-2);
        color: var(--fb-text-muted);
    }

    .file-tile svg { inline-size: var(--fb-space-8); block-size: var(--fb-space-8); }

    .file-tile b { font-size: var(--fb-text-xs); font-weight: var(--fb-weight-semibold); }

    .media-grid > li > button > span:last-child {
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
`,Y=`h1, h2, h3, h4, h5, h6`,yn=class{constructor(e){this.bar=e,this.state=null}get labels(){return this.bar.labels}async show(){this.bar.design?.hide(),this.bar.pagePanel?.hide(),this.bar.comments?.hide(),this.bar.arranging?.panel&&this.bar.arranging.closePanel(),this.state={loading:!0,headings:[],error:!1},this.bar.requestUpdate(),await this.bar.updateComplete,this.bar.renderRoot.querySelector(`#fb-outline-title`)?.focus(),await this.load()}async load(){let e=this.bar.config?.page;if(!e)return;let t=new URLSearchParams({id:e.id,language:this.bar.config.language});try{let e=await fetch(`${this.bar.config.queries}page.outline?${t}`,{headers:{Accept:`application/json`},credentials:`same-origin`}),n=e.ok?(await e.json()).data??[]:null;this.state=this.state&&{loading:!1,headings:n??[],error:n===null}}catch{this.state=this.state&&{loading:!1,headings:[],error:!0}}this.bar.requestUpdate()}hide(){this.state=null,this.bar.requestUpdate()}async close(){this.hide(),await this.bar.updateComplete,this.bar.renderRoot.querySelector(`[data-fb-more]`)?.focus()}elementOf(e){let t=[...document.querySelectorAll(Y)],n=t=>t.textContent.replace(/\s+/g,` `).trim()===e.text;if(e.field){let t=[...(e.blockId?document.querySelector(`[data-fb-block="${CSS.escape(e.blockId)}"]`):document)?.querySelectorAll(`[data-fb-field="${CSS.escape(e.field)}"]`)??[]].filter(t=>e.blockId||!t.parentElement?.closest(`[data-fb-block]`));for(let e of t){if(e.matches(Y))return e;let t=[...e.querySelectorAll(Y)].find(n);if(t)return t}}return t.find(t=>t.localName===`h${e.level}`&&n(t))??null}jump(e){let t=this.elementOf(e);t&&(t.scrollIntoView({block:`center`,behavior:matchMedia(`(prefers-reduced-motion: reduce)`).matches?`auto`:`smooth`}),t.closest(`[data-fb-field][tabindex]`)?.focus({preventScroll:!0}))}notes(e){let t=this.labels,n={adjusted:t.outlineAdjusted,fixed:t.outlineFixed,skips:t.outlineSkips,secondMain:t.outlineSecondMain,added:t.outlineAdded};return(e.notes??[]).map(e=>n[e]).filter(Boolean)}view(){let e=this.state;if(!e)return A;let t=this.labels,n=e.headings.some(e=>(e.notes??[]).includes(`added`));return D`<section class="panel outline-panel" role="region" aria-labelledby="fb-outline-title"
            @keydown=${e=>{e.key===`Escape`&&(e.preventDefault(),this.close())}}>
            <header>
                <h2 id="fb-outline-title" tabindex="-1">${t.outline}</h2>
                <button type="button" aria-label=${t.close} title=${t.close} @click=${()=>this.close()}>${z(`close`)}</button>
            </header>
            <div class="outline-body" aria-busy=${e.loading?`true`:`false`}>
                <p class="hint">${t.outlineHint}</p>
                ${e.error?D`<p class="outline-error" role="alert">${t.outlineFailed}</p>`:A}
                ${n?D`<p class="outline-note" role="status">${t.outlineAdded}</p>`:A}
                ${e.loading?D`<p class="hint">${t.loading}</p>`:A}
                ${!e.loading&&!e.error&&e.headings.length===0?D`<p class="hint">${t.outlineEmpty}</p>`:A}
                ${e.headings.length>0?D`<ol class="outline-list">
                    ${e.headings.map(e=>{let n=this.notes(e).filter(e=>e!==t.outlineAdded);return D`<li style="--depth: ${e.level-1}">
                            <button type="button" class=${n.length>0?`noted`:``} @click=${()=>this.jump(e)}>
                                <span class="outline-level" aria-label=${t.outlineLevel.replace(`{level}`,e.level)}>H${e.level}</span>
                                <span class="outline-text">${e.text}</span>
                            </button>
                            ${n.map(e=>D`<p class="hint">${e}</p>`)}
                        </li>`})}
                </ol>`:A}
            </div>
        </section>`}badges(){return[...document.querySelectorAll(Y)].filter(e=>!e.classList.contains(`fb-visually-hidden`)).map(e=>{let t=e.getBoundingClientRect();return t.width===0||t.height===0?A:D`<span class="level-badge" aria-hidden="true"
                style="inset-block-start: ${t.top}px; inset-inline-end: ${Ye(this.bar,t)}px">H${e.localName.slice(1)}</span>`})}},bn=d`
    .panel.outline-panel .outline-body {
        display: grid;
        align-content: start;
        gap: var(--fb-space-3);
        padding: var(--fb-space-5);
        overflow-y: auto;
    }

    .outline-list { display: grid; gap: var(--fb-space-1); margin: 0; padding: 0; list-style: none; }

    .outline-list li { padding-inline-start: calc(var(--depth) * var(--fb-space-4)); }

    .outline-list button {
        display: flex;
        gap: var(--fb-space-2);
        align-items: baseline;
        inline-size: 100%;
        min-block-size: var(--fb-size-control-sm);
        padding: var(--fb-space-1) var(--fb-space-2);
        border: 0;
        border-radius: var(--fb-radius-sm);
        background: none;
        color: inherit;
        font: inherit;
        text-align: start;
        cursor: pointer;
    }

    .outline-list button:hover { background: var(--fb-surface-2); }

    .outline-list button:focus-visible { outline: var(--fb-size-focus) solid var(--fb-focus); outline-offset: calc(-1 * var(--fb-size-focus)); }

    .outline-list .hint { padding-inline-start: calc(var(--fb-space-2) + var(--fb-space-8)); }

    .outline-level {
        flex: none;
        min-inline-size: var(--fb-space-8);
        color: var(--fb-text-muted);
        font-size: var(--fb-text-xs);
        font-weight: var(--fb-weight-semibold);
        font-variant-numeric: tabular-nums;
    }

    .outline-list button.noted .outline-level { color: var(--fb-warning-text); }

    .outline-text { overflow-wrap: anywhere; }

    .outline-note, .outline-error {
        margin: 0;
        padding: var(--fb-space-2) var(--fb-space-3);
        border-radius: var(--fb-radius-md);
        background: var(--fb-warning-bg);
        color: var(--fb-warning-text);
    }

    .outline-error { background: var(--fb-danger-bg); color: var(--fb-danger-text); }

    .level-badge {
        position: absolute;
        padding: var(--fb-space-0) var(--fb-space-1);
        border-radius: 0;
        border-end-start-radius: var(--fb-radius-sm);
        background: var(--fb-text);
        color: var(--fb-surface);
        font-size: var(--fb-text-2xs);
        font-weight: var(--fb-weight-semibold);
        pointer-events: none;
    }
`,xn=`#fb-page`,Sn=[`title`,`slug`,`seoTitle`,`description`];function X(e){return e?.draft??e?.published??null}var Cn=class{constructor(e){this.bar=e,this.state=null}get labels(){return this.bar.labels}get settings(){return this.bar.config.page?.settings??null}get language(){return this.bar.config.language}get available(){return!!(this.bar.config.editing&&this.settings)}async show(e={},t=`title`){this.bar.arranging?.closePanel?.(),this.bar.design?.hide(),this.bar.comments?.hide(),this.bar.outline?.hide(),this.state={loading:!0,details:null,values:null,errors:e,busy:!1},this.bar.requestUpdate();let n=null;try{let e=await fetch(`${this.bar.config.queries}page.show?id=${encodeURIComponent(this.bar.config.page.id)}`,{headers:{Accept:`application/json`},credentials:`same-origin`});n=e.ok?await e.json():null}catch{n=null}if(!this.state)return;let r=n?.data??null,i=X(r)?.translations?.[this.language]??null;this.update({loading:!1,details:r,values:i?Object.fromEntries(Sn.map(e=>[e,i[e]??``])):null}),await this.bar.updateComplete;let a=Object.keys(this.state?.errors??{})[0];(a?this.bar.renderRoot.querySelector(`#fb-page-${a}`):this.bar.renderRoot.querySelector(`#fb-page-${t}`))?.focus()}async close(){this.hide(),await this.bar.updateComplete;let e=this.bar.renderRoot.querySelector(`[data-fb-page]`);(e?.getClientRects().length?e:this.bar.renderRoot.querySelector(`[data-fb-more]`))?.focus()}hide(){this.state&&(this.state=null,this.bar.requestUpdate())}update(e){this.state={...this.state,...e},this.bar.requestUpdate()}async save(e){this.update({busy:!0,errors:{}}),this.bar.saving++,this.bar.message={tone:`info`,text:this.labels.saving};let t=await this.bar.action(`page.update`,{id:this.bar.config.page.id,...e}),n=t?await t.json().catch(()=>null):null;if(this.bar.saving--,t?.ok)return this.bar.message={tone:`info`,text:this.labels.saved},this.bar.saved(),n?.data??null;let r={},i=[];for(let e of Array.isArray(n?.errors)?n.errors:[]){let t=String(e.pointer??``).match(/^\/translations\/[^/]+\/([a-zA-Z]+)$/);t&&Sn.includes(t[1])?r[t[1]]??=e.message:i.push(e.message)}let a=i[0]??n?.detail??this.labels.failed;if(this.bar.message={tone:`danger`,text:a,reload:t?.status===409},this.state){this.update({busy:!1,errors:r}),await this.bar.updateComplete;let e=Object.keys(r)[0];this.bar.renderRoot.querySelector(e?`#fb-page-${e}`:`#fb-page-title`)?.focus()}return null}async saveGeneral(){let e=this.state.values,t=X(this.state.details)?.translations?.[this.language]??{},n=Object.fromEntries(Sn.filter(e=>!(e===`slug`&&this.settings.start)).filter(n=>(e[n]??``)!==(t[n]??``)).map(t=>[t,e[t]]));if(Object.keys(n).length===0){this.bar.message={tone:`info`,text:this.labels.saved},this.bar.saved();return}let r=await this.save({translations:{[this.language]:n}});if(!r)return;let i=X(r)?.translations?.[this.language]?.slug??``,a=this.settings.languages.find(e=>e.code===this.language)?.base;`slug`in n&&i!==(t.slug??``)&&a?location.assign(a+i+xn):await this.reopen()}async reopen(e=`title`){await(await this.bar.refresh())?.pagePanel?.show({},e)}async addVersion(e){let t=X(this.state.details),n=t?.translations?.[this.settings.default]?.title??t?.translations?.[this.language]?.title??``,r=await this.save({translations:{[e.code]:{title:n}}});if(!r)return;let i=X(r)?.translations?.[e.code]?.slug??``;e.base?location.assign((this.settings.start?e.base:e.base+i)+xn):await this.reopen()}async saveVisibility(e,t){await this.save({[e]:t})&&await this.reopen(e)}button(){if(!this.available)return A;let e=this.labels;return D`<button type="button" data-fb-page aria-expanded=${this.state?`true`:`false`} title=${e.pageTitle}
            @click=${()=>this.state?this.close():this.show()}>${z(`file`)}<span class="button-text">${e.page}</span></button>`}view(){let e=this.state;if(!e)return A;let t=this.labels,n;return n=e.loading?D`<p class="hint">${t.loading}</p>`:e.details?D`${this.general()}${this.languages()}${this.visibility()}
                <a class="all" href=${this.bar.config.page.backend}>${z(`external`)}${t.pageAllSettings}</a>`:D`<p class="hint">${t.failed}</p>`,D`<section class="panel page-panel" role="region" aria-labelledby="fb-page-title-heading"
            @keydown=${e=>{e.key===`Escape`&&(e.preventDefault(),this.close())}}>
            <header>
                <h2 id="fb-page-title-heading" tabindex="-1">${t.pageTitle}</h2>
                <button type="button" aria-label=${t.close} title=${t.close} @click=${()=>this.close()}>${z(`close`)}</button>
            </header>
            <div class="page-body">${n}</div>
        </section>`}field(e,t,{hint:n=null,prefix:r=null,multiline:i=!1,placeholder:a=``,maxlength:o=null,lang:s=null,dir:c=null}={}){let l=this.state,u=`fb-page-${e}`,d=l.errors[e]??null,f=[n?`${u}-hint`:null,d?`${u}-error`:null].filter(Boolean).join(` `)||A,p=t=>this.update({values:{...l.values,[e]:t.target.value}}),ee=!this.settings.editable||l.busy,m=i?D`<textarea id=${u} rows="3" .value=${l.values[e]??``} ?disabled=${ee} maxlength=${o??A}
                lang=${s??A} dir=${c??A} aria-invalid=${d?`true`:A} aria-describedby=${f} @input=${p}></textarea>`:D`<input type="text" id=${u} .value=${l.values[e]??``} ?disabled=${ee} maxlength=${o??A}
                placeholder=${a||A} lang=${s??A} dir=${c??A}
                aria-invalid=${d?`true`:A} aria-describedby=${f} @input=${p}>`;return D`<div class="page-field">
            <label for=${u}>${t}</label>
            ${r?D`<div class="prefixed"><span class="prefix" dir="ltr">${r}</span>${m}</div>`:m}
            ${d?D`<p class="error" id=${`${u}-error`}>${z(`warning`)}<span>${d}</span></p>`:A}
            ${n?D`<p class="hint" id=${`${u}-hint`}>${n}</p>`:A}
        </div>`}general(){let e=this.labels,t=this.settings,n=t.languages.find(e=>e.code===this.language);if(!this.state.values)return A;let r=n?.code??null,i=n?.direction??null,a=this.state.values.title??``,o=t.start?t.site:t.site?`${a} – ${t.site}`:a;return D`<form @submit=${e=>{e.preventDefault(),this.saveGeneral()}} novalidate>
            <fieldset>
                <legend>${e.pageGeneral}</legend>
                ${t.editable?A:D`<p class="hint">${e.pageReadOnly}</p>`}
                ${this.field(`title`,e.pageName,{lang:r,dir:i})}
                ${t.start?D`<div class="page-field"><span class="label">${e.pageAddress}</span>
                        <p class="prefix static" dir="ltr">${n?.prefix??``}</p><p class="hint">${e.pageStartAddress}</p></div>`:this.field(`slug`,e.pageAddress,{hint:e.pageAddressHint,prefix:n?.prefix,dir:`ltr`})}
                ${this.field(`seoTitle`,e.pageSeoTitle,{hint:e.pageSeoTitleHint,placeholder:o,maxlength:120,lang:r,dir:i})}
                ${this.field(`description`,e.pageDescription,{hint:e.pageDescriptionHint,multiline:!0,maxlength:300,lang:r,dir:i})}
            </fieldset>
            ${t.editable?D`<div class="page-actions">
                <button type="submit" class="primary" ?disabled=${this.state.busy}>${e.pageSave}</button>
                <p class="hint">${e.pageDraftNote}</p>
            </div>`:A}
        </form>`}languages(){let e=this.labels,t=this.settings;return t.languages.length<2?A:D`<section class="page-section" aria-labelledby="fb-page-languages">
            <h3 id="fb-page-languages">${e.pageLanguages}</h3>
            <ul class="page-languages">${t.languages.map(n=>{let r=A,i=e.pageAvailable;return n.code===this.language?i=e.pageThisLanguage:n.exists&&n.url?r=D`<a href=${n.url+xn}>${e.pageOpenVersion.replace(`{language}`,n.title)}</a>`:n.exists||(i=e.pageNoVersion,r=t.editable?D`<button type="button" ?disabled=${this.state.busy}
                    @click=${()=>this.addVersion(n)}>${z(`plus`)}${e.pageAddVersion.replace(`{language}`,n.title)}</button>`:A),D`<li data-language=${n.code}>
                <span class="language" lang=${n.code}>${n.title}</span>
                <span class="hint">${i}</span>
                ${r}
            </li>`})}</ul>
        </section>`}visibility(){let e=this.labels,t=this.settings,n=X(this.state.details),r=[[`none`,e.pageInclude],[`page`,e.pageLeaveOut],[`branch`,e.pageLeaveOutBranch]],i=(i,a,o,s)=>{let c=`fb-page-${i}`;return D`<div class="page-field">
                <label for=${c}>${a}</label>
                <select id=${c} ?disabled=${!t.editable||this.state.busy} aria-describedby=${`${c}-hint`}
                    @change=${e=>this.saveVisibility(i,e.target.value)}>
                    ${r.map(([e,t])=>D`<option value=${e} ?selected=${(n?.[i]??`none`)===e}>${t}</option>`)}
                </select>
                <p class="hint" id=${`${c}-hint`}>${o?e.pageInherited.replace(`{page}`,o):s}</p>
            </div>`};return D`<section class="page-section" aria-labelledby="fb-page-visibility">
            <h3 id="fb-page-visibility">${e.pageVisibility}</h3>
            ${i(`excludeFromSearchEngines`,e.pageSearchEngines,t.inherited.searchEngines,e.pageSearchEnginesHint)}
            ${i(`excludeFromSiteSearch`,e.pageSiteSearch,t.inherited.siteSearch,e.pageSiteSearchHint)}
        </section>`}},wn=d`
    .panel .page-body {
        display: grid;
        align-content: start;
        gap: var(--fb-space-6);
        padding: var(--fb-space-5);
        overflow-y: auto;
    }

    .panel .page-body form { padding: 0; overflow: visible; }

    .panel .page-field { display: grid; gap: var(--fb-space-1); }

    .panel .page-field > .label { font-weight: var(--fb-weight-semibold); }

    .panel .page-field .hint { line-height: var(--fb-leading-snug); }

    .panel .prefixed {
        display: flex;
        align-items: stretch;
        min-inline-size: 0;
        border: var(--fb-size-border) solid var(--fb-border-strong);
        border-radius: var(--fb-radius-md);
        background: var(--fb-surface);
    }

    .panel .prefixed:focus-within {
        outline: var(--fb-size-focus) solid var(--fb-focus);
        outline-offset: var(--fb-size-focus-offset);
    }

    .panel .prefixed input { flex: 1; min-inline-size: 0; padding-inline-start: var(--fb-space-0); border: 0; }

    .panel .prefixed input:focus-visible { outline: none; }

    .panel .prefix {
        display: flex;
        align-items: center;
        max-inline-size: 60%;
        padding-inline-start: var(--fb-space-3);
        overflow: hidden;
        color: var(--fb-text-muted);
        font-size: var(--fb-text-sm);
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .panel .prefix.static { max-inline-size: none; margin: 0; padding: 0; }

    .panel [aria-invalid="true"], .panel .prefixed:has([aria-invalid="true"]) { border-color: var(--fb-danger); }

    .panel .page-field .error {
        display: flex;
        gap: var(--fb-space-2);
        margin: 0;
        color: var(--fb-danger-text);
        font-size: var(--fb-text-sm);
        line-height: var(--fb-leading-snug);
    }

    .panel .page-field .error svg { flex: none; margin-block-start: var(--fb-space-0); }

    .panel .page-actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--fb-space-3); }

    .panel .page-actions .hint { flex: 1; min-inline-size: calc(var(--fb-space-16) * 2); }

    .panel .page-section { display: grid; gap: var(--fb-space-3); }

    .panel .page-languages { display: grid; gap: var(--fb-space-3); margin: 0; padding: 0; list-style: none; }

    .panel .page-languages li { display: flex; flex-wrap: wrap; align-items: center; gap: var(--fb-space-1) var(--fb-space-3); }

    .panel .page-languages .language { font-weight: var(--fb-weight-semibold); }

    .panel .page-languages :is(a, button) { flex-basis: 100%; justify-content: flex-start; }

    .panel .page-languages button { justify-self: start; flex-basis: auto; border-color: var(--fb-border); }

    .panel .page-body a { color: var(--fb-accent-text); }

    .panel .page-body .all { display: inline-flex; align-items: center; gap: var(--fb-space-2); justify-self: start; }
`,Tn=`[data-fb-block]`;function En(e){return e.parentElement?.closest(Tn)??null}function Dn(e){return e.split(`/`).filter(e=>e!==``).map(e=>e.replaceAll(`~1`,`/`).replaceAll(`~0`,`~`))}function On(e,t,n){let r=`[data-fb-field="${CSS.escape(t)}"]`;return[...(e??document).querySelectorAll(r)].find(t=>!t.hasAttribute(`data-fb-object`)&&t.hasAttribute(`data-fb-site`)===n&&(n||En(t)===e))??null}function kn(e){let t=Dn(e),n=null;for(;t[0]===`areas`&&t.length>=3;){let[,e,r]=t;if(n=[...document.querySelectorAll(`${Tn}[data-fb-area="${CSS.escape(e)}"]`)].filter(e=>En(e)===n)[Number(r)]??null,!n)return{element:null,block:null,path:t.join(`/`)};t=t.slice(3)}if(t[0]!==`fields`||t.length<2)return{element:n,block:n,path:``};let r=t.slice(1).join(`/`);return{element:On(n,r,!1),block:n,path:r}}function An(e,t,n){return e.map(({pointer:e=``,message:r=``})=>{let i=e.match(/^\/ids\/(\d+)\/translations\/([^/]+)\/content(\/.*)?$/);if(i&&t&&t.publish[Number(i[1])]===t.id&&i[2]===n)return{...kn(i[3]??``),message:r};let a=e.match(/^\/ids\/(\d+)\/translations\/([^/]+)\/(title|slug|seoTitle|description)$/);if(a&&t&&t.publish[Number(a[1])]===t.id&&a[2]===n)return{element:null,block:null,path:``,panel:a[3],message:r};let o=e.match(/^\/languages\/([^/]+)\/(.+)$/);if(o&&o[1]===n){let e=Dn(o[2]).join(`/`);return{element:On(null,e,!0),block:null,path:e,message:r}}return{element:null,block:null,path:``,message:r}})}var Z=`fb-edit-config`,jn=null;document.addEventListener(`pointermove`,e=>{jn={x:e.clientX,y:e.clientY}},{capture:!0,passive:!0});function Mn(e,t){return t!==null&&e.clientX===t.x&&e.clientY===t.y}function Nn(e,t=null){let n=document.createElement(`fb-editor-bar`);return n.config=e,n.held=t,n.lang=e.ui?.language??``,n.dir=e.ui?.direction??`ltr`,document.body.append(n),n}function Pn(e){return e instanceof HTMLScriptElement&&[``,`module`,`text/javascript`,`application/javascript`].includes((e.getAttribute(`type`)??``).toLowerCase())}function Fn(e){let t=document.createElement(`script`);for(let{name:n,value:r}of e.attributes)t.setAttribute(n,r);return t.textContent=e.textContent,t}function In(e){let t=new Set([...document.head.querySelectorAll(`link[href]`)].map(e=>e.href)),n=new Set([...document.querySelectorAll(`script[src]`)].map(e=>e.src)),r=new Set([...document.head.querySelectorAll(`style`)].map(e=>e.textContent));for(let i of e.head.children)i instanceof HTMLLinkElement&&i.getAttribute(`href`)&&!t.has(new URL(i.getAttribute(`href`),location.href).href)?document.head.append(document.importNode(i,!0)):i instanceof HTMLScriptElement&&i.getAttribute(`src`)&&!n.has(new URL(i.getAttribute(`src`),location.href).href)?document.head.append(Fn(i)):i instanceof HTMLStyleElement&&!r.has(i.textContent)&&document.head.append(document.importNode(i,!0));let i=document.getElementById(Z),a=e.getElementById(Z);i&&a&&(i.textContent=a.textContent),document.title=e.title}function Ln(e){let t=new Set([...document.querySelectorAll(`script[src]`)].map(e=>e.src));for(let e of[...document.body.childNodes])Pn(e)||e.remove();let n=[...document.body.children].find(Pn)??null;for(let r of[...e.body.childNodes])if(Pn(r)){let e=r.getAttribute(`src`);e&&!t.has(new URL(e,location.href).href)&&document.body.append(Fn(r))}else document.body.insertBefore(document.importNode(r,!0),n);for(let{name:t}of[...document.body.attributes])e.body.hasAttribute(t)||document.body.removeAttribute(t);for(let{name:t,value:n}of e.body.attributes)document.body.setAttribute(t,n)}async function Rn(e){let t=null;try{let e=await fetch(location.href,{credentials:`same-origin`,cache:`no-store`,headers:{Accept:`text/html`}});e.ok&&!e.redirected&&(t=new DOMParser().parseFromString(await e.text(),`text/html`))}catch{t=null}let n=t?.getElementById(Z);if(!t||!n){location.reload();return}let r=scrollX,i=scrollY;In(t),e.remove(),Ln(t),scrollTo(r,i);let a=Nn(JSON.parse(n.textContent??`{}`),jn);return document.dispatchEvent(new CustomEvent(`frootbox:refresh`)),a}var zn=class{constructor(e){this.bar=e,this.state=null}get labels(){return this.bar.labels}get config(){return this.bar.config.preview}show(e=null){let t=this.config.durations.find(e=>e.selected)??this.config.durations[0];this.state={note:``,expiresAt:t?.value??null,busy:!1,error:null,link:null,copied:!1,done:e},this.bar.requestUpdate(),this.bar.updateComplete.then(()=>{this.bar.renderRoot.querySelector(`dialog.share`)?.showModal(),this.bar.renderRoot.querySelector(`dialog.share input`)?.focus()})}update(e){this.state={...this.state,...e},this.bar.requestUpdate()}async create(){if(this.state.busy)return;this.update({busy:!0,error:null});let e=this.state.note.trim(),t=await this.bar.action(`preview.create`,{note:e===``?null:e,expiresAt:this.state.expiresAt,pageId:this.bar.config.page?.id??null}),n=t?await t.json().catch(()=>null):null;if(!t?.ok){this.update({busy:!1,error:n?.errors?.[0]?.message??n?.detail??this.labels.failed});return}let r=n?.data??{},i=r.url??(r.path?new URL(r.path,window.location.origin).href:null);this.update({busy:!1,link:i}),await this.bar.updateComplete,this.bar.renderRoot.querySelector(`dialog.share [data-fb-copy-link]`)?.focus()}async copy(){try{await navigator.clipboard.writeText(this.state.link),this.update({copied:!0})}catch{let e=this.bar.renderRoot.querySelector(`dialog.share output input`);e?.focus(),e?.select()}}close(){let e=this.state?.done;this.bar.renderRoot.querySelector(`dialog.share`)?.close(),this.state=null,this.bar.requestUpdate(),e?.()}dialog(){let e=this.state;if(!e)return A;let t=this.labels;return D`<dialog class="share" aria-labelledby="fb-share-title" @cancel=${e=>{e.preventDefault(),this.close()}}>
            ${e.link?this.result(e):D`<form @submit=${e=>{e.preventDefault(),this.create()}}>
                <h2 id="fb-share-title">${t.shareTitle}</h2>
                ${e.error?D`<p class="error" role="alert">${e.error}</p>`:A}
                <label>${t.shareNote}
                    <input type="text" maxlength="200" .value=${e.note} placeholder=${t.shareNotePlaceholder} aria-describedby="fb-share-note-hint"
                        @input=${e=>this.update({note:e.target.value})}></label>
                <p class="hint" id="fb-share-note-hint">${t.shareNoteHint}</p>
                <label>${t.shareDays}
                    <select @change=${e=>this.update({expiresAt:e.target.value})}>
                        ${this.config.durations.map(t=>D`<option value=${t.value} ?selected=${t.value===e.expiresAt}>${t.label}</option>`)}
                    </select></label>
                <p class="hint">${t.shareHint}</p>
                <div class="actions">
                    <button type="button" @click=${()=>this.close()}>${t.cancel}</button>
                    <button type="submit" class="primary" ?disabled=${e.busy} aria-busy=${e.busy?`true`:`false`}>${t.shareCreate}</button>
                </div>
            </form>`}
        </dialog>`}result(e){let t=this.labels;return D`<div class="share-result">
            <h2 id="fb-share-title">${t.shareReady}</h2>
            <output><input type="text" readonly .value=${e.link} aria-label=${t.shareLink} @focus=${e=>e.target.select()}></output>
            <p class="hint" role="status">${e.copied?t.shareCopied:``}</p>
            <div class="actions">
                ${this.config.manage?D`<a class="open" href=${this.config.manage}>${t.shareManage}</a>`:A}
                <button type="button" @click=${()=>this.close()}>${t.shareDone}</button>
                <button type="button" class="primary" data-fb-copy-link @click=${()=>this.copy()}>${z(`copy`)}${t.shareCopy}</button>
            </div>
        </div>`}},Bn=d`
    dialog.share select {
        min-block-size: var(--fb-size-control);
        padding-inline: var(--fb-space-3);
        border: var(--fb-size-border) solid var(--fb-border-strong);
        border-radius: var(--fb-radius-md);
        background: var(--fb-surface);
        color: inherit;
        font: inherit;
        font-weight: var(--fb-weight-regular);
    }

    dialog.share select:focus-visible {
        outline: var(--fb-size-focus) solid var(--fb-focus);
        outline-offset: var(--fb-size-focus-offset);
    }

    .share-result { display: grid; gap: var(--fb-space-3); }

    .share-result output { display: grid; }

    .share-result output input {
        min-block-size: var(--fb-size-control);
        padding-inline: var(--fb-space-3);
        border: var(--fb-size-border) solid var(--fb-border-strong);
        border-radius: var(--fb-radius-md);
        background: var(--fb-surface-2);
        color: inherit;
        font: inherit;
        font-family: var(--fb-font-mono);
        font-size: var(--fb-text-sm);
    }

    .share-result .open {
        align-self: center;
        color: var(--fb-accent-text);
    }

    dialog.share .error { margin: 0; color: var(--fb-danger-text); }
`,Vn=`fb-editor-bar-collapsed`,Hn=`fb-theme`,Un=`fb-edit-undo:`;function Wn(e){let t=e.state.doc.firstChild,n=[];t?.forEach(e=>n.push(e));let r=e=>e?.type.name===`tableHeader`,i=n.length>0&&n[0].childCount>0&&Array.from({length:n[0].childCount},(e,t)=>n[0].child(t)).every(r),a=n.slice(+!!i);return{row:i,column:a.length>0&&a.every(e=>r(e.firstChild))}}function Gn(e){let{$from:t}=e.state.selection;for(let e=t.depth;e>0;e--)if(t.node(e).attrs.dir)return!0;return!1}var Kn=`[data-fb-field], [data-fb-block], fb-area[data-fb-area], fb-list[data-fb-list]`;function qn(e){try{return localStorage.getItem(e)}catch{return null}}function Jn(e,t){try{t===null?localStorage.removeItem(e):localStorage.setItem(e,t)}catch{}}function Q(e){return e.dataset.fbLabel??e.dataset.fbTitle??e.dataset.fbArea??``}function Yn(e,t,n=[],r=[]){for(let i of e){let e=i.slugs?.[t]??Object.values(i.slugs??{})[0]??``,a=e?[...n,e]:n,o=i.titles?.[t]??Object.values(i.titles??{})[0]??i.id;r.push({id:i.id,title:o,path:`/`+a.join(`/`)}),Yn(i.children??[],t,a,r)}return r}function Xn(e){return/^([a-z][a-z0-9+.-]*:|\/|#|\?)/i.test(e)||Qn(e)}function Zn(e){try{return new URL(Qn(e)&&!/^[a-z][a-z0-9+.-]*:/i.test(e)?`https://${e}`:e,location.href)}catch{return null}}function Qn(e){return/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(e)}function $n(e){try{return JSON.parse(sessionStorage.getItem(e)??`[]`)}catch{return[]}}function er(e,t){try{t.length===0?sessionStorage.removeItem(e):sessionStorage.setItem(e,JSON.stringify(t))}catch{}}function tr(e){return e.hasAttribute(`data-fb-field`)?`field`:e.hasAttribute(`data-fb-block`)?`block`:e.hasAttribute(`data-fb-entry`)?`entry`:`area`}function $(e){return getComputedStyle(e).direction===`rtl`?`rtl`:`ltr`}var nr={block:28,inline:240};function rr(e,t,n){let r=n?t.right-e.right:e.left-t.left;return Math.abs(e.top-t.top)<nr.block&&r<nr.inline}var ir=class extends L{static fieldTools(e,t){U(e,t)}static properties={config:{attribute:!1},collapsed:{state:!0},busy:{state:!0},message:{state:!0},confirming:{state:!0},confirmingPublish:{state:!0},showAll:{state:!0},current:{state:!0},undo:{state:!0},link:{state:!0},toolbar:{state:!0},menu:{state:!0},flash:{state:!0},details:{state:!0},problems:{state:!0},unsaved:{state:!0}};static styles=[d`
        :host {
            all: initial !important;
            display: block !important;
            position: fixed !important;
            inset: 0 !important;
            z-index: var(--fb-layer-edit) !important;
            pointer-events: none !important;
            font-family: var(--fb-font-family) !important;
            font-size: var(--fb-text-sm) !important;
            line-height: var(--fb-leading-tight) !important;
            color: var(--fb-text) !important;
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
        .details .choices { display: flex; flex-wrap: wrap; gap: var(--fb-space-2); }

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

        /* The corner under the tab is square, so frame and tab meet as one (decision 0204). */
        .outline:not([data-kind="entry"]) { border-start-start-radius: 0; }
        .outline.below:not([data-kind="entry"]) { border-start-start-radius: var(--fb-radius-sm); border-end-start-radius: 0; }
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

        .menu [role="group"], .menu form { display: grid; gap: var(--fb-space-0); margin: 0; }

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

        .menu .narrow-only { display: none; }

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

        .toolbar select {
            min-block-size: var(--fb-size-control-sm);
            padding-inline: var(--fb-space-2);
            border: var(--fb-size-border) solid var(--fb-border);
            border-radius: var(--fb-radius-sm);
            background: var(--fb-surface);
            color: inherit;
            font: inherit;
            font-size: var(--fb-text-sm);
        }

        .toolbar select:focus-visible {
            outline: var(--fb-size-focus) solid var(--fb-focus);
            outline-offset: var(--fb-size-focus-offset);
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

        dialog input:not([type]), dialog input[type="text"], dialog select {
            min-block-size: var(--fb-size-control);
            padding-inline: var(--fb-space-3);
            border: var(--fb-size-border) solid var(--fb-border-strong);
            border-radius: var(--fb-radius-md);
            background: var(--fb-surface);
            color: inherit;
            font: inherit;
            font-weight: var(--fb-weight-regular);
        }

        dialog :is(input, select):focus-visible {
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
            .bar > [data-fb-page] { display: none; }
            .menu .narrow-only { display: flex; }
            .bar > button, .bar > fb-search > button, .bar > fb-help > button { padding-inline: var(--fb-space-2); }
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
    `,wt,vn,cn,Pt,Bn,Dt,bn,wn];constructor(){super(),this.config=null,this.collapsed=qn(Vn)===`1`,this.busy=!1,this.message=null,this.confirming=!1,this.confirmingPublish=!1,this.showAll=!1,this.current=null,this.undo=[],this.link=null,this.toolbar=null,this.menu=!1,this.flash=!1,this.flashTimer=0,this.details=!1,this.problems=[],this.problemsText=``,this.unsaved=[],this.onOutside=e=>{let t=e.composedPath();this.menu&&!t.includes(this.renderRoot.querySelector(`.more`))&&(this.menu=!1),this.details&&!t.includes(this.renderRoot.querySelector(`.state-wrap`))&&(this.details=!1)},this.saving=0,this.pages=null,this.editing=null,this.arranging=null,this.media=new gn(this),this.icons=new sn(this),this.design=new Nt(this),this.share=new zn(this),this.comments=new Et(this),this.outline=new yn(this),this.pagePanel=new Cn(this),this.frame=0,this.redraw=()=>{this.frame===0&&(this.current||this.showAll||this.toolbar||this.arranging?.block||this.problems.length>0||this.comments.threads.length>0)&&(this.frame=requestAnimationFrame(()=>{this.frame=0,this.requestUpdate()}))},this.onPoint=e=>{Mn(e,this.held??null)||(this.held=null,this.point(e.target))},this.onLeave=e=>{e.relatedTarget||(this.current=null)},this.onFocus=e=>this.point(e.target)}createRenderRoot(){let e=super.createRenderRoot(),t=new CSSStyleSheet;return t.replaceSync(this.config?.tokens??``),e.adoptedStyleSheets=[t,...e.adoptedStyleSheets],e}connectedCallback(){super.connectedCallback(),this.raise(),document.addEventListener(`pointerdown`,this.onOutside,!0);let e=qn(Hn);(e===`light`||e===`dark`)&&(this.dataset.theme=e),this.marking?(this.undo=$n(this.undoKey),this.editing=new Xt(this),this.editing.start(),this.arranging=new Tt(this),this.arranging.start(),document.addEventListener(`pointerover`,this.onPoint,!0),document.addEventListener(`pointerout`,this.onLeave,!0),document.addEventListener(`focusin`,this.onFocus,!0),addEventListener(`scroll`,this.redraw,{passive:!0,capture:!0}),addEventListener(`resize`,this.redraw,{passive:!0})):this.config?.editing&&this.config?.comments&&(addEventListener(`scroll`,this.redraw,{passive:!0,capture:!0}),addEventListener(`resize`,this.redraw,{passive:!0})),this.config?.editing&&this.comments.load(),location.hash===`#fb-design`&&this.config?.design&&this.config.editing&&(history.replaceState(null,``,location.pathname+location.search),this.updateComplete.then(()=>this.design.show())),location.hash===`#fb-page`&&this.pagePanel.available&&(history.replaceState(null,``,location.pathname+location.search),this.updateComplete.then(()=>this.pagePanel.show()))}raise(){typeof this.showPopover==`function`&&(this.popover=`manual`,this.matches(`:popover-open`)||this.showPopover())}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener(`pointerdown`,this.onOutside,!0),this.editing?.stop(),this.arranging?.stop(),this.comments.stopPicking(),document.removeEventListener(`pointerover`,this.onPoint,!0),document.removeEventListener(`pointerout`,this.onLeave,!0),document.removeEventListener(`focusin`,this.onFocus,!0),removeEventListener(`scroll`,this.redraw,{capture:!0}),removeEventListener(`resize`,this.redraw)}updated(){let e=this.renderRoot.querySelector(`.bar, .round`),t=e?`${Math.ceil(e.getBoundingClientRect().height)}px`:`0px`;this.style.getPropertyValue(`--bar-block-size`)!==t&&(this.style.setProperty(`--bar-block-size`,t),this.makeRoom(e?`${t} + 2rem`:null))}makeRoom(e){if(this.room&&=(this.room.element.style.paddingBlockEnd=this.room.inline,null),!e)return;let t=[...document.body.children].reverse().find(e=>e!==this&&![`SCRIPT`,`STYLE`,`LINK`,`TEMPLATE`,`DIALOG`].includes(e.tagName)&&!e.tagName.startsWith(`FB-`)&&![`none`,`contents`].includes(getComputedStyle(e).display)&&![`absolute`,`fixed`].includes(getComputedStyle(e).position))??document.body,n=getComputedStyle(t).paddingBlockEnd;this.room={element:t,inline:t.style.paddingBlockEnd},t.style.paddingBlockEnd=`calc(${n} + ${e})`}get marking(){return!!(this.config?.editing&&this.config?.marking)}get undoKey(){return Un+(this.config?.page?.id??``)}get labels(){return this.config?.labels??{}}render(){if(!this.config)return A;let e=this.arranging;return D`${this.outlines()}${this.config.editing?this.comments.pins():A}${this.comments.pickHint()}${e?.tools()??A}${e?.entryTools()??A}${this.toolbarView()}${e?.panelView()??A}${this.design.view()}${this.pagePanel.view()}${this.comments.view()}${this.outline.view()}${this.collapsed?this.round():this.bar()}${e?.pickerDialog()??A}${this.linkDialog()}${this.media.dialog()}${this.icons.dialog()}${this.share.dialog()}`}round(){return D`<button type="button" class="round" aria-label=${this.labels.expand} title=${this.labels.expand}
            aria-expanded="false" @click=${()=>this.collapse(!1)}>${z(`pencil`)}</button>`}bar(){let{editing:e,page:t}=this.config,n=this.labels;return D`<div class="bar" role="region" aria-label=${n.bar}>
            <button type="button" role="switch" aria-checked=${e?`true`:`false`} ?disabled=${this.busy} title=${n.edit}
                @click=${()=>this.toggle(!e)}>
                <span class="switch-track" aria-hidden="true"></span><span class="button-text">${n.edit}</span>
            </button>
            ${e?this.pageControls(t):A}
            ${e&&!this.confirming&&!this.confirmingPublish?this.pagePanel.button():A}
            ${e?this.comments.button():A}
            ${this.search()}
            ${this.help()}
            ${this.more()}
            <button type="button" aria-label=${n.collapse} title=${n.collapse} aria-expanded="true"
                @click=${()=>this.collapse(!0)}>${z(`collapse`)}</button>
            ${this.stateView()}
            <p class="visually-hidden" role="status">${this.message?.text??``}</p>
        </div>`}get state(){let e=this.config.editing?this.config.page:null;return this.message?.tone===`danger`||this.problems.length>0||this.unsaved.length>0?`error`:e?this.drafts(e).status:null}stateView(){let e=this.state;if(e===null)return A;let t=this.labels,n={published:`success`,changed:`warning`,draft:`warning`,error:`danger`},r=this.config.editing&&this.config.page?.locked,i=t[e]??e,a=t=>t===`error`?z(`warning`):t===e&&this.flash&&this.saving===0?z(`check`):D`<span class="state-dot ${t===`draft`?`ring`:``} ${t===e&&this.saving>0?`pulse`:``}"></span>`;return D`<div class="state-wrap" @keydown=${e=>this.detailsKey(e)}>
            <button type="button" class="state" data-state=${e} data-tone=${n[e]}
                title=${e===`error`?t.showError:t.explainStatus}
                aria-expanded=${this.details?`true`:`false`} aria-controls="fb-state-details"
                @click=${()=>{this.details=!this.details}}>
                <span class="visually-hidden">${t.status}: ${i}${r?`, ${t.locked}`:``}</span>
                ${r?z(`lock`):A}
                <span class="state-labels" aria-hidden="true">${Object.keys(n).map(n=>D`<span class=${n===e?`current`:``}><span class="state-mark">${a(n)}</span><span class="state-text">${t[n]??n}</span></span>`)}</span>
            </button>
            ${this.details?D`<div class="details" id="fb-state-details" data-tone=${n[e]}>${this.explanation(e,r)}</div>`:A}
        </div>`}explanation(e,t){let n=this.labels;if(e===`error`&&this.unsaved.length>0&&this.message?.tone!==`danger`)return this.unsavedView();if(e===`error`&&this.problems.length>0)return this.problemsView();if(e===`error`)return D`<p>${this.message.text}</p>
                ${this.message.reload?D`<button type="button" @click=${()=>location.reload()}>${n.reload}</button>`:A}`;let r=e===`published`?A:D`<p>${this.saving>0?n.saving:n.allSaved}</p>`;return D`<p>${n[`explain${e[0].toUpperCase()}${e.slice(1)}`]}</p>
            ${r}
            ${t?D`<p>${n.locked}.</p>`:A}
            ${this.config.protection?D`<p>${n.protectedSite}</p>`:A}`}problemsView(){let e=this.labels,t=this.problems.length,n=this.problems.filter(e=>e.element?.isConnected),r=this.problems.filter(e=>!e.element?.isConnected),i=this.problems.filter(e=>e.panel),a=e=>[e.block?.dataset.fbTitle,e.path].filter(Boolean).join(` · `);return D`<p>${this.problemsText}</p>
            <p>${t===1?e.oneProblem:e.problems.replace(`{count}`,t)}</p>
            ${r.length>0?D`<ul>${r.map(e=>D`<li>${a(e)?`${a(e)}: `:``}${e.message}</li>`)}</ul>`:A}
            ${n.length>0?D`<button type="button" data-fb-first-problem @click=${()=>this.showProblem(n[0].element)}>${e.firstProblem}</button>`:A}
            ${i.length>0&&this.pagePanel.available?D`<button type="button" data-fb-page-problem @click=${()=>this.showPageProblems(i)}>${e.pageShowProblem}</button>`:A}`}showPageProblems(e){this.details=!1,this.pagePanel.show(Object.fromEntries(e.map(e=>[e.panel,e.message])))}unsavedView(){let e=this.labels,t=this.unsaved.length,n=e=>[e.element.closest(`[data-fb-block]`)?.dataset.fbTitle,e.element.dataset.fbLabel].filter(Boolean).join(` · `)||e.element.dataset.fbField;return D`<p>${t===1?e.oneUnsaved:e.unsaved.replace(`{count}`,t)}</p>
            <ul>${this.unsaved.map(t=>D`<li>${n(t)}${t.changed?` (${e.unsavedChanged})`:``}</li>`)}</ul>
            <div class="choices">
                <button type="button" data-fb-restore @click=${()=>this.restoreUnsaved()}>${e.restoreUnsaved}</button>
                <button type="button" data-fb-forget @click=${()=>this.forgetUnsaved()}>${e.forgetUnsaved}</button>
            </div>`}offerUnsaved(e){this.unsaved=e,this.details=!0}async restoreUnsaved(){let e=this.unsaved;this.unsaved=[],this.details=!1;for(let t of e)await this.editing.restore(t)}forgetUnsaved(){this.editing.forgetUnsaved(this.unsaved),this.unsaved=[],this.details=!1}keptUnsaved(){this.message?.tone===`danger`&&this.editing?.unsaved.key&&(this.message={...this.message,text:`${this.message.text} ${this.labels.keptUnsaved}`})}showProblem(e){this.details=!1,e.scrollIntoView({block:`center`,behavior:matchMedia(`(prefers-reduced-motion: reduce)`).matches?`auto`:`smooth`}),e.focus({preventScroll:!0})}solved(e){this.problems.some(t=>t.element===e)&&(this.problems=this.problems.filter(t=>t.element!==e),this.problems.length===0&&(this.details=!1))}detailsKey(e){e.key===`Escape`&&this.details&&(e.preventDefault(),e.stopPropagation(),this.details=!1,this.renderRoot.querySelector(`.state`)?.focus())}saved(){clearTimeout(this.flashTimer),this.flash=!0,this.flashTimer=setTimeout(()=>{this.flash=!1},2e3)}drafts(e){let t=this.siteDraft,n=this.mediaDrafts.length>0,r=n&&this.config.media.publish,i=this.objectDrafts.some(e=>e.publish);return{status:e.status===`published`&&(t||r||i)?`changed`:e.status,canPublish:e.canPublish||t&&this.config.site.publish||r||i,canDiscard:e.canDiscard||t&&this.config.site.discard||n&&this.config.media.discard||this.objectDrafts.some(e=>e.discard)}}help(){let e=this.config.help;return e?D`<fb-help src=${e.src} base=${e.base} .labels=${e.labels}>
            <button type="button" aria-label=${e.labels.help} title=${e.labels.help}>${z(`info`)}</button>
        </fb-help>`:A}search(){let e=this.config.search;return e?D`<fb-search src=${e.src} shortcut .labels=${e.labels}>
            <button type="button" aria-label=${e.labels.search} title=${`${e.labels.search} (${Re.keys()})`}
                aria-keyshortcuts="Control+K Meta+K">${z(`search`)}</button>
        </fb-search>`:A}more(){let{editing:e,page:t}=this.config,n=this.labels,r=e&&t&&!this.confirming&&this.drafts(t).canDiscard,i=[this.marking?D`<button type="button" role="menuitemcheckbox" aria-checked=${this.showAll?`true`:`false`}
                @click=${()=>this.choose(()=>{this.showAll=!this.showAll})}>${z(`places`)}${n.showAll}</button>`:A,e&&t?D`<button type="button" role="menuitem"
                @click=${()=>this.choose(()=>this.outline.show())}>${z(`outline`)}${n.outline}</button>`:A,this.pagePanel.available?D`<button type="button" role="menuitem" class="narrow-only"
                @click=${()=>this.choose(()=>this.pagePanel.show())}>${z(`file`)}${n.pageTitle}</button>`:A,t?D`<a role="menuitem" href=${t.backend}>${z(`external`)}${n.backend}</a>`:A,r?D`<button type="button" role="menuitem" class="danger" ?disabled=${this.busy}
                @click=${()=>this.choose(()=>this.confirm())}>${z(`trash`)}${n.discard}</button>`:A].filter(e=>e!==A),a=[this.config.design&&e?D`<button type="button" role="menuitem"
                @click=${()=>this.choose(()=>this.design.show())}>${z(`palette`)}${n.design}</button>`:A,this.config.preview?D`<button type="button" role="menuitem"
                @click=${()=>this.choose(()=>this.share.show(()=>this.renderRoot.querySelector(`[data-fb-more]`)?.focus()))}>${z(`link`)}${n.share}</button>`:A,this.config.access?D`<a role="menuitem" href=${this.config.access}>${z(`lock`)}${n.access}</a>`:A].filter(e=>e!==A),o=[this.config.account?D`<a role="menuitem" href=${this.config.account}>${z(`user`)}${n.account}</a>`:A,this.config.logout?D`<form method="post" action=${this.config.logout}><input type="hidden" name="_csrf" .value=${this.config.csrf??``}>
                <button type="submit" role="menuitem">${z(`signOut`)}${n.signOut}</button></form>`:A].filter(e=>e!==A);if(i.length===0&&a.length===0&&o.length===0)return A;let s=(e,t,n)=>n.length===0?A:D`<div role="group" aria-labelledby=${e}>
            <div class="menu-heading" id=${e} role="presentation">${t}</div>${n}</div>`;return D`<div class="more" @focusout=${e=>this.leaveMenu(e)} @mousedown=${e=>e.preventDefault()}>
            <button type="button" data-fb-more aria-haspopup="menu" aria-expanded=${this.menu?`true`:`false`} aria-controls="fb-more-menu"
                aria-label=${n.more} title=${n.more} @click=${()=>this.menu?this.closeMenu():this.openMenu(!0)}
                @keydown=${e=>this.moreKey(e)}>${z(`more`)}</button>
            ${this.menu?D`<div class="menu" id="fb-more-menu" role="menu" aria-label=${n.more} @keydown=${e=>this.menuKey(e)}>
                ${s(`fb-more-page`,n.thisPage,i)}${s(`fb-more-site`,n.website,a)}${s(`fb-more-you`,n.you,o)}
            </div>`:A}
        </div>`}get menuItems(){return[...this.renderRoot.querySelectorAll(`.menu [role^="menuitem"]`)].filter(e=>e.getClientRects().length>0)}async openMenu(e,t=!1){if(this.menu=e,e){await this.updateComplete;let e=this.menuItems;(t?e.at(-1):e[0])?.focus()}}async closeMenu(){this.menu=!1,await this.updateComplete,this.renderRoot.querySelector(`[data-fb-more]`)?.focus()}choose(e){this.menu=!1,e()}moreKey(e){(e.key===`ArrowUp`||e.key===`ArrowDown`)&&(e.preventDefault(),this.openMenu(!0,e.key===`ArrowUp`))}menuKey(e){let t=this.menuItems,n=t.indexOf(this.renderRoot.activeElement),r={ArrowDown:(n+1)%t.length,ArrowUp:(n-1+t.length)%t.length,Home:0,End:t.length-1}[e.key];r===void 0?e.key===`Escape`?(e.preventDefault(),e.stopPropagation(),this.closeMenu()):e.key===`Tab`&&(this.menu=!1):(e.preventDefault(),t[r]?.focus())}leaveMenu(e){this.menu&&!e.currentTarget.contains(e.relatedTarget)&&(this.menu=!1)}async confirm(){this.confirming=!0,await this.updateComplete,this.renderRoot.querySelector(`[data-fb-cancel]`)?.focus()}async cancelConfirm(){this.confirming=!1,await this.updateComplete,this.renderRoot.querySelector(`[data-fb-more]`)?.focus()}pageControls(e){let t=this.labels;if(!e)return D`<span class="note">${this.config.designPage?t.designPage:t.readOnly}</span>`;if(this.confirmingPublish)return D`<span class="note">${t.mediaElsewhere.replace(`{images}`,this.imageNames(this.mediaDrafts.filter(e=>e.elsewhere>0)))}</span>
                <button type="button" class="primary" ?disabled=${this.busy} @click=${()=>this.publish(!0)}>${t.publish}</button>
                <button type="button" data-fb-cancel @click=${()=>this.cancelPublish()}>${t.cancel}</button>`;if(this.confirming)return D`<span class="note">${t.discardConfirm}</span>
                <button type="button" class="danger solid" ?disabled=${this.busy} @click=${()=>this.discard()}>${t.discardYes}</button>
                <button type="button" data-fb-cancel @click=${()=>this.cancelConfirm()}>${t.cancel}</button>`;let{canPublish:n}=this.drafts(e),r=e.mayPublish||this.config.site?.publish||this.config.media?.publish,i=this.undo.length>0;return D`
            ${this.config.marking?A:D`<span class="note">${t.readOnly}</span>`}
            ${this.config.marking?D`<button type="button" ?disabled=${this.busy} aria-disabled=${i?`false`:`true`}
                title=${i?t.undo:t.nothingToUndo}
                @click=${()=>{i&&this.undoLast()}}>${z(`undo`)}<span class="button-text">${t.undo}</span></button>`:A}
            ${r?D`<button type="button" class="primary" ?disabled=${this.busy} aria-disabled=${n?`false`:`true`}
                title=${n?e.canPublish&&e.offlineParents.length?t.offlineParents.replace(`{pages}`,e.offlineParents.join(`, `)):A:t.allPublished}
                @click=${()=>{n&&this.publish()}}>${t.publish}</button>`:A}`}outlines(){if(!this.marking)return A;let e=this.arranging?.block,t=this.arranging?.entry?.element,n=this.showAll?[...document.querySelectorAll(`${Kn}, [data-fb-entry]`)]:[...new Set([e,t,this.current].filter(e=>e?.isConnected))],r=new Set(this.problems.map(e=>e.element)),i=n.filter(e=>!r.has(e)),a=i.filter(e=>tr(e)!==`field`&&tr(e)!==`entry`).map(e=>({element:e,rect:e.getBoundingClientRect()}));return D`${this.showAll?this.outline.badges():A}${this.problemOutlines()}${i.map(e=>{let t=e.getBoundingClientRect();if(t.width===0&&t.height===0)return A;let n=tr(e);return D`<div class="outline ${t.top<24||n===`field`&&a.some(n=>n.element!==e&&n.element.contains(e)&&rr(t,n.rect,$(e)===`rtl`))?`below`:``}" data-kind=${n}
                dir=${$(e)} style="top: ${t.top}px; left: ${t.left}px; width: ${t.width}px; height: ${t.height}px">
                ${this.fieldTab(e,Q(e))}
            </div>`})}`}problemOutlines(){return this.problems.filter(e=>e.element?.isConnected).map(({element:e,message:t})=>{let n=e.getBoundingClientRect();return n.width===0&&n.height===0?A:D`<div class="outline ${n.top<24?`below`:``}" data-kind="problem"
                dir=${$(e)} style="top: ${n.top}px; left: ${n.left}px; width: ${n.width}px; height: ${n.height}px">
                ${this.fieldTab(e,e===this.current?`${Q(e)}: ${t}`:Q(e))}
            </div>`})}fieldTab(e,t){let n=e===this.current&&e.hasAttribute(`data-fb-field`)&&this.editing?It(e,this):[];return n.length===0?D`<span class="label">${t}</span>`:D`<div class="label tools" role="toolbar" aria-label=${this.labels.fieldTools.replace(`{field}`,Q(e))}
            @keydown=${t=>this.fieldToolsKey(t,e)}>
            <span>${t}</span>
            ${n.map(e=>D`<button type="button" class=${e.tone??``} aria-label=${e.label} title=${e.title??e.label}
                ?disabled=${e.disabled||this.busy} @click=${()=>e.run()}>${z(e.icon)}</button>`)}
        </div>`}hasFieldTools(e){return It(e,this).length>0}focusFieldTools(e){this.current=e,this.requestUpdate(),this.updateComplete.then(()=>this.renderRoot.querySelector(`.label.tools button:not([disabled])`)?.focus())}fieldToolsKey(e,t){let n=[...this.renderRoot.querySelectorAll(`.label.tools button:not([disabled])`)],r=n.indexOf(this.renderRoot.activeElement);e.key===`Escape`?(e.preventDefault(),t.focus()):e.key===`F10`&&e.altKey?(e.preventDefault(),this.arranging?.reachTools(t)):(e.key===`ArrowRight`||e.key===`ArrowLeft`)&&(e.preventDefault(),n[(r+(e.key===`ArrowRight`?1:-1)+n.length)%n.length]?.focus())}point(e){if(e===this)return;this.arranging?.select(e);let t=e instanceof Element?e.closest(Kn):null;t!==this.current&&(this.current=t)}collapse(e){this.collapsed=e,Jn(Vn,e?`1`:null),this.updateComplete.then(()=>this.renderRoot.querySelector(e?`.round`:`[role="switch"]`)?.focus())}async toggle(e){this.busy=!0;let t=await this.send(this.config.toggle,new URLSearchParams({on:e?`1`:`0`}));t?.ok?this.go(e):this.fail(t)}go(e){let t=this.config.page,n=t?e?t.draftUrl:t.visitorUrl??t.backend:null;n&&new URL(n,location.href).pathname!==location.pathname?location.assign(n):location.reload()}get siteDraft(){return!!this.config?.site?.draft}get objectDrafts(){return(this.config?.objects??[]).filter(e=>e.draft)}get mediaDrafts(){return this.config?.media?.drafts??[]}mediaChosen(e){e?.draft&&this.config.media&&!this.mediaDrafts.some(t=>t.id===e.id)&&(this.config={...this.config,media:{...this.config.media,drafts:[...this.mediaDrafts,{id:e.id,name:e.fileName,elsewhere:0}]}})}imageNames(e){return e.map(e=>`„${e.name}“`).join(`, `)}async cancelPublish(){this.confirmingPublish=!1,await this.updateComplete,this.renderRoot.querySelector(`button.primary`)?.focus()}async publish(e=!1){let t=this.config.page,n=this.config.media,r=n?.publish&&this.mediaDrafts.length>0;if(!e&&r&&this.mediaDrafts.some(e=>e.elsewhere>0)){this.confirmingPublish=!0,await this.updateComplete,this.renderRoot.querySelector(`[data-fb-cancel]`)?.focus();return}this.confirmingPublish=!1,this.busy=!0,this.problems=[],await this.editing?.flushAll();let i=t.canPublish;if(t.canPublish){let e=await this.action(`page.publish`,{ids:t.publish});if(!e?.ok){this.busy=!1,this.fail(e,!0);return}this.config={...this.config,page:{...t,status:`published`,published:!0,canPublish:!1,canDiscard:!1,offlineParents:[],visitorUrl:t.draftUrl}}}if(this.siteDraft&&this.config.site.publish){let e=await this.action(`site.publish`,{});if(!e?.ok){this.busy=!1,this.fail(e,!0);return}this.config={...this.config,site:{...this.config.site,draft:!1}}}if(r){let e=await this.action(`media.publish`,{ids:this.mediaDrafts.map(e=>e.id)});if(!e?.ok){this.busy=!1,this.fail(e,!0);return}this.config={...this.config,media:{...n,drafts:[]}}}let a=new Map;for(let e of this.objectDrafts.filter(e=>e.publish))a.set(e.type,[...a.get(e.type)??[],e]);for(let[e,t]of a){let n=await this.action(`${e}.publish`,{ids:t.map(e=>e.id)});if(!n?.ok){this.busy=!1,this.fail(n,!0);return}this.objectsSettled(t)}this.busy=!1,this.forget(),this.message=this.mediaDrafts.length>0?{tone:`info`,text:this.labels.mediaStayOpen.replace(`{images}`,this.imageNames(this.mediaDrafts))}:this.objectDrafts.length>0?{tone:`info`,text:this.labels.objectsStayOpen.replace(`{objects}`,this.imageNames(this.objectDrafts))}:{tone:`info`,text:i?this.labels.publishDone:this.labels.changesPublished}}async discard(){let e=this.config.page;this.busy=!0;let t=[...e.canDiscard?[[`page.discard`,{id:e.id}]]:[],...this.siteDraft&&this.config.site.discard?[[`site.discard`,{}]]:[],...this.config.media?.discard?this.mediaDrafts.map(e=>[`media.discard`,{id:e.id}]):[],...this.objectDrafts.filter(e=>e.discard).map(e=>[`${e.type}.discard`,{id:e.id}])];for(let[e,n]of t){let t=await this.action(e,n);if(!t?.ok){this.busy=!1,this.confirming=!1,this.fail(t);return}}this.forget(),e.published&&e.visitorUrl&&new URL(e.visitorUrl,location.href).pathname!==location.pathname?location.assign(e.visitorUrl):e.published||!e.canDiscard?await this.refresh():location.assign(this.config.pages)}async run(e,t){this.state===`error`&&(this.details=!1),this.saving++,this.message={tone:`info`,text:this.labels.saving};let n=await this.action(e,t),r=n?await n.json().catch(()=>null):null;if(this.saving--,n?.ok)return this.saving===0&&(this.message={tone:`info`,text:this.labels.saved},this.saved()),{ok:!0,data:r?.data};let i=r?.errors?.[0]?.message??r?.detail??this.labels.failed;return this.message={tone:`danger`,text:i,reload:n?.status===409},{ok:!1,status:n?.status??0}}objectsSettled(e){let t=new Set(e.map(e=>e.target));this.config={...this.config,objects:(this.config.objects??[]).map(e=>t.has(e.target)?{...e,draft:!1}:e)}}changed(e,t=!1,n=null){let r=this.config.page;e&&(this.undo=[...this.undo,e],er(this.undoKey,this.undo)),this.config=n?{...this.config,objects:(this.config.objects??[]).map(e=>e.target===n?{...e,draft:!0}:e)}:t?{...this.config,site:{...this.config.site,draft:!0}}:{...this.config,page:{...r,status:r.published?`changed`:`draft`,canPublish:r.mayPublish,canDiscard:r.mayDiscard}}}async undoLast(){this.busy=!0,await this.editing?.flushAll();let e=this.undo.at(-1),t=await this.action(`action.undo`,{id:e});t?.ok?(er(this.undoKey,this.undo.slice(0,-1)),await this.refresh()):this.fail(t)}refresh(){return Rn(this)}forget(){this.undo=[],er(this.undoKey,[])}showToolbar(e){(e.view.hasFocus()||this.link)&&(this.toolbar=e,this.requestUpdate())}hideToolbar(e){this.toolbar===e&&!this.link&&(this.toolbar=null)}focusToolbar(){this.renderRoot.querySelector(`.toolbar :is(button, select)`)?.focus()}toolbarView(){let e=this.toolbar;if(!e||e.isDestroyed)return A;let t=this.labels,n=e.view.coordsAtPos(e.state.selection.from),r=n.top<64,i=r?n.bottom:n.top,a=Math.max(8,Math.min(Xe(this,n.left),this.clientWidth-320)),o=t=>t(e.chain().focus()).run(),s=t=>!!(e.schema.nodes[t]??e.schema.marks[t]),c=s(`table`)?Wn(e):null,l=[[`bold`,`bold`,t.bold,()=>o(e=>e.toggleBold())],[`italic`,`italic`,t.italic,()=>o(e=>e.toggleItalic())],[`list`,`bulletList`,t.bulletList,()=>o(e=>e.toggleBulletList())],[`ordered`,`orderedList`,t.orderedList,()=>o(e=>e.toggleOrderedList())],[`quote`,`blockquote`,t.quote,()=>o(e=>e.toggleBlockquote())],[`link`,`link`,t.link,()=>this.richLink(e)],...e.commands.toggleBlockDirection?[[`direction`,()=>Gn(e),t.otherDirection,()=>o(e=>e.toggleBlockDirection())]]:[],...c?[[`headerRow`,()=>c.row,t.headerRow,()=>o(e=>e.toggleHeaderRow())],[`headerColumn`,()=>c.column,t.headerColumn,()=>o(e=>e.toggleHeaderColumn())]]:[]].filter(([,e])=>typeof e!=`string`||s(e));return D`<div class="toolbar ${r?`below`:``}" role="toolbar" aria-label=${t.formatting}
            style="inset-block-start: ${i}px; inset-inline-start: ${a}px"
            @keydown=${t=>this.toolbarKey(t,e)}
            @focusout=${t=>this.toolbarLeft(t,e)}>
            ${this.headingSelect(e,o)}
            ${this.tableSelect(e,o)}
            ${l.map(([t,n,r,i])=>D`<button type="button" aria-label=${r} title=${r} aria-pressed=${(typeof n==`function`?n():Array.isArray(n)?e.isActive(...n):e.isActive(n))?`true`:`false`}
                    @mousedown=${e=>e.preventDefault()} @click=${i}>${z(t)}</button>`)}
        </div>`}headingSelect(e,t){let n=e.extensionManager.extensions.find(e=>e.name===`heading`)?.options.levels??[];if(n.length===0)return A;let r=this.labels,i={1:r.heading,2:r.subheading,3:r.smallHeading},a=n.find(t=>e.isActive(`heading`,{level:t}))??0;return D`<select aria-label=${r.textStyle} title=${r.textStyleHint} @change=${e=>{let n=Number(e.target.value);t(e=>n===0?e.setParagraph():e.setHeading({level:n}))}}>
            <option value="0" ?selected=${a===0}>${r.normalText}</option>
            ${n.map(e=>D`<option value=${e} ?selected=${a===e}>${i[e]}</option>`)}
        </select>`}tableSelect(e,t){if(!e.schema.nodes.table)return A;let n=this.labels,r=[[`addRowBefore`,n.rowAbove],[`addRowAfter`,n.rowBelow],[`addColumnBefore`,n.columnBefore],[`addColumnAfter`,n.columnAfter],[`deleteRow`,n.deleteRow],[`deleteColumn`,n.deleteColumn]],i=e.can();return D`<select aria-label=${n.rowsAndColumns} title=${n.rowsAndColumns} @change=${e=>{let n=e.target.value;e.target.value=``,n&&t(e=>e[n]())}}>
            <option value="" selected>${n.rowsAndColumns}</option>
            ${r.map(([e,t])=>D`<option value=${e} ?disabled=${!i[e]()}>${t}</option>`)}
        </select>`}toolbarKey(e,t){let n=[...this.renderRoot.querySelectorAll(`.toolbar :is(button, select)`)],r=n.indexOf(this.renderRoot.activeElement);e.key===`Escape`?(e.preventDefault(),t.commands.focus()):(e.key===`ArrowRight`||e.key===`ArrowLeft`)&&(e.preventDefault(),n[(r+(e.key===`ArrowRight`?1:-1)+n.length)%n.length]?.focus())}toolbarLeft(e,t){let n=e.relatedTarget;!this.link&&!(n instanceof Node&&(this.renderRoot.contains(n)||t.view.dom.contains(n)))&&(this.toolbar=null)}richLink(e){let t=e.getAttributes(`link`),n=e.isActive(`link`);this.openLink({withText:!1,href:t.href??``,newWindow:t.target===`_blank`,existing:n,apply:({href:t,newWindow:r,label:i})=>{let a={href:t,target:r?`_blank`:null},o=e.chain().focus();e.state.selection.empty&&!n?o.insertContent({type:`text`,text:i,marks:[{type:`link`,attrs:a}]}):o.extendMarkRange(`link`).setLink(a),o.run()},remove:()=>e.chain().focus().extendMarkRange(`link`).unsetLink().run(),done:()=>e.commands.focus()})}openLink(e){let t=e.href.startsWith(`page:`)?{id:e.href.slice(5),title:``,path:``}:null;this.link={existing:e.href!==``,...e,query:t?``:e.href,page:t},this.loadPages(),this.updateComplete.then(()=>{this.renderRoot.querySelector(`dialog.link`)?.showModal(),this.renderRoot.querySelector(`dialog.link input`)?.focus()})}async loadPages(){if(!this.pages){try{let e=await fetch(this.config.queries+`page.tree`,{headers:{Accept:`application/json`},credentials:`same-origin`}),t=e.ok?await e.json():null;this.pages=Yn(t?.data??[],this.config.language)}catch{this.pages=[]}this.requestUpdate()}}linkDialog(){let e=this.link;if(!e)return A;let t=this.labels,n=e.page?this.pages?.find(t=>t.id===e.page.id)??e.page:null,r=e.query.trim(),i=!n&&r!==``&&!Xn(r),a=r.toLowerCase(),o=i&&this.pages?this.pages.filter(e=>e.title.toLowerCase().includes(a)||e.path.includes(a)).slice(0,8):[],s=n!==null||r!==``&&Xn(r),c=n?e.openUrl&&e.href===`page:${n.id}`?e.openUrl:null:s?Zn(r):null,l=e=>{this.link={...this.link,...e}};return D`<dialog class="link" aria-labelledby="fb-link-title" @cancel=${e=>{e.preventDefault(),this.closeLink()}}>
            <form @submit=${e=>{e.preventDefault(),this.applyLink(n,r)}}>
                <h2 id="fb-link-title">${t.link}</h2>
                ${e.withText?D`<label>${t.linkText}
                    <input type="text" .value=${e.text??``} @input=${e=>l({text:e.target.value})}></label>`:A}
                ${n?D`<div><span class="hint">${t.linkTarget}</span><div class="chosen">
                        <span>${t.linkPage}: ${n.title||n.id} <small>${n.path}</small></span>
                        <button type="button" aria-label=${t.removeLink} title=${t.removeLink}
                            @click=${()=>l({page:null,query:``})}>${z(`close`)}</button></div></div>`:D`<label>${t.linkTarget}
                        <input type="text" .value=${e.query} autocomplete="off" aria-describedby="fb-link-hint"
                            @input=${e=>l({query:e.target.value})}></label>
                        <p class="hint" id="fb-link-hint">${t.linkHint}</p>`}
                ${i?D`<ul class="results" aria-label=${t.linkPage}>
                    ${this.pages&&o.length===0?D`<li class="hint">${t.noPages}</li>`:A}
                    ${o.map(e=>D`<li><button type="button" @click=${()=>l({page:e,query:``})}>
                        <span>${e.title}</span><small>${e.path}</small></button></li>`)}
                </ul>`:A}
                <label class="check"><input type="checkbox" .checked=${e.newWindow}
                    @change=${e=>l({newWindow:e.target.checked})}>${t.newWindow}</label>
                <div class="actions">
                    ${c?D`<button type="button" class="open" @click=${()=>Rt(c,!0)}>${z(`external`)}${t.openLink}</button>`:A}
                    ${e.existing?D`<button type="button" class="danger" @click=${()=>this.closeLink(e.remove)}>${t.removeLink}</button>`:A}
                    <button type="button" @click=${()=>this.closeLink()}>${t.cancel}</button>
                    <button type="submit" class="primary" ?disabled=${!s}>${t.apply}</button>
                </div>
            </form>
        </dialog>`}applyLink(e,t){let n=this.link,r=e?`page:`+e.id:Qn(t)?`https://`+t:t;(e||Xn(t))&&this.closeLink(()=>n.apply({text:(n.text??``).trim(),href:r,newWindow:n.newWindow,label:e?.title||t}))}closeLink(e=null){let t=this.link;this.renderRoot.querySelector(`dialog.link`)?.close(),this.link=null,e?.(),t?.done?.()}action(e,t){return this.send(this.config.actions+e,JSON.stringify(lt(e,t)),`application/json`)}async send(e,t,n=null){let r={Accept:`application/json`,"X-CSRF-Token":this.config.csrf??``};n&&(r[`Content-Type`]=n);try{return await fetch(e,{method:`POST`,headers:r,body:t,credentials:`same-origin`})}catch{return null}}async fail(e,t=!1){this.busy=!1;let n=e?await e.json().catch(()=>null):null,r=n?.detail??this.labels.failed,i=Array.isArray(n?.errors)?n.errors:[];t&&i.length>0?(this.problemsText=r,this.problems=An(i,this.config.page,this.config.language),this.message={tone:`info`,text:`${r} ${i.length===1?this.labels.oneProblem:this.labels.problems.replace(`{count}`,i.length)}`},this.details=!0):this.message={tone:`danger`,text:r}}};customElements.define(`fb-editor-bar`,ir);var ar=document.getElementById(`fb-edit-config`);ar&&Nn(JSON.parse(ar.textContent??`{}`));