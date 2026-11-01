var e=document.getElementById(`fb-preview-config`),t=class extends HTMLElement{connectedCallback(){if(this.shadowRoot)return;let e=this.config??{},t=e.labels??{},n=this.attachShadow({mode:`open`}),r=document.createElement(`style`);r.textContent=`${e.tokens??``}
            :host {
                all: initial !important;
                position: fixed !important;
                inset-block-end: var(--fb-space-4) !important;
                inset-inline-start: 50% !important;
                z-index: var(--fb-layer-edit) !important;
                display: block !important;
                translate: -50% 0 !important;
                max-inline-size: calc(100vw - 2 * var(--fb-space-4)) !important;
            }

            .note {
                display: flex;
                flex-wrap: wrap;
                gap: var(--fb-space-1) var(--fb-space-3);
                align-items: center;
                padding: var(--fb-space-2) var(--fb-space-2) var(--fb-space-2) var(--fb-space-4);
                border: var(--fb-size-border) solid var(--fb-border);
                border-radius: var(--fb-radius-lg);
                background: var(--fb-surface);
                color: var(--fb-text);
                box-shadow: var(--fb-shadow-lg);
                font-family: var(--fb-font-family);
                font-size: var(--fb-text-sm);
                line-height: var(--fb-leading-normal);
            }

            strong { font-weight: var(--fb-weight-semibold); }

            span { color: var(--fb-text-muted); }

            a {
                display: inline-flex;
                align-items: center;
                min-block-size: var(--fb-size-control-sm);
                padding-inline: var(--fb-space-3);
                border-radius: var(--fb-radius-md);
                background: var(--fb-surface-2);
                color: var(--fb-text);
                font-weight: var(--fb-weight-medium);
                text-decoration: none;
            }

            a:hover { background: var(--fb-accent-soft); color: var(--fb-accent-text); }

            a:focus-visible {
                outline: var(--fb-size-focus) solid var(--fb-focus);
                outline-offset: var(--fb-size-focus-offset);
            }

            @media print { .note { display: none; } }`;let i=document.createElement(`div`);i.className=`note`,i.setAttribute(`role`,`region`),i.setAttribute(`aria-label`,t.region??`Preview`);let a=document.createElement(`strong`);a.textContent=t.title??``,i.append(a);let o=new Date(e.expiresAt??``);if(!Number.isNaN(o.getTime())&&t.until){let e=new Intl.DateTimeFormat(document.documentElement.lang||void 0,{dateStyle:`medium`,timeStyle:`short`}).format(o),n=document.createElement(`span`);n.textContent=t.until.replace(`{date}`,e),i.append(n)}let s=document.createElement(`a`);s.href=e.end??`?fb-preview=0`,s.textContent=t.end??``,i.append(s),n.append(r,i)}};if(e){customElements.define(`fb-preview-note`,t);let n=document.createElement(`fb-preview-note`);n.config=JSON.parse(e.textContent??`{}`),document.body.append(n)}