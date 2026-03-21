import { LitElement, html, css } from 'lit';

export class BmHeader extends LitElement {
    static styles = css`
    header {
        background: #1a1a1a;
        color: white;
        padding: 1rem 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .logo { font-weight: bold; font-size: 1.5rem; color: #4CAF50; }
`;

    render() {
        return html`
    <header>
        <div class="logo">BitMarket</div>
        <div>Mi Cuenta</div>
    </header>
    `;
    }
}
customElements.define('bm-header', BmHeader);