import { LitElement, html, css } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { animate, AnimateController, fadeInSlow, fadeOut } from '@lit-labs/motion';
import { API_URL } from '../../config.js';

// --- Helpers de animación (En lugar de support.js) ---
const springy = [
  0, 0.0701, 0.2329, 0.4308, 0.6245, 0.7906, 0.9184, 1.0065, 1.059, 1.0833,
  1.0872, 1.0783, 1.0628, 1.0453, 1.0288, 1.015, 1.0048, 0.9979, 0.994, 0.9925,
  0.9925, 0.9935, 0.9949, 0.9964, 0.9978, 0.999, 0.9998,
];

const onFrames = (animate) => {
  const { animatingProperties: props, frames } = animate;
  if (frames === undefined || props === undefined) return frames;
  return [
    frames[0],
    ...springy.map((v) => {
      const frame = {};
      const x = props.left ? `translateX(${props.left * (1 - v)}px)` : '';
      const y = props.top ? `translateY(${props.top * (1 - v)}px)` : '';
      const sx = props.width ? `scaleX(${props.width + (1 - props.width) * v})` : '';
      const sy = props.height ? `scaleY(${props.height + (1 - props.height) * v})` : '';
      frame.transform = `${x} ${y} ${sx} ${sy}`;
      return frame;
    }),
    frames[1],
  ];
};

export class BmDestacados extends LitElement {
    static properties = {
        productos: { type: Array },
        detail: { state: true },
        loading: { type: Boolean }
    };

    static styles = css`
        :host {
            display: flex;
            justify-content: center;
            --card-color: #2a2a2a;
            --card-text-color: #f2f2f2;
            --detail-color: #1e1e1e;
            --detail-text-color: #f2f2f2;
            --accent-color: #4CAF50;
            --border-radius: 12px;
            width: 100%;
        }

        * { box-sizing: border-box; user-select: none; }
        .fit { position: absolute; inset: 0; }
        
        .container {
            width: 100%;
            max-width: 1200px;
            position: relative;
            min-height: 500px; /* Espacio para que floten las cards */
        }

        .cards {
            list-style: none; padding: 0; margin: 0;
            display: flex; flex-wrap: wrap; justify-content: center; gap: 15px;
        }

        li {
            position: relative;
            display: flex; flex-direction: column;
            width: 250px;
            cursor: pointer;
            padding: 16px;
            border-radius: var(--border-radius);
            background: var(--card-color);
            color: var(--card-text-color);
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            border: 1px solid #444;
        }

        @media (max-width: 600px) {
            li {
                width: 100%; /* Una card por fila en móvil */
                max-width: 320px;
            }
        }

        .card-background { border-radius: var(--border-radius); }

        .card-image-container {
            height: 150px;
            display: flex; align-items: center; justify-content: center;
            margin-bottom: 15px;
        }
        
        .card-image {
            max-width: 100%; max-height: 100%;
            border-radius: 8px;
            object-fit: contain;
        }

        .card-header-title { font-weight: 800; font-size: 1.1rem; margin-bottom: 5px; }
        .card-price { color: var(--accent-color); font-weight: bold; font-size: 1.2rem; }

        /* VISTA DE DETALLE (HERO) */
        .detail {
            display: flex; 
            flex-direction: column;
            color: var(--detail-text-color);
            padding: 20px;
            border-radius: var(--border-radius);
            background: var(--detail-color);
            border: 1px solid var(--accent-color);
            box-shadow: 0 10px 30px rgba(0,0,0,0.7);
            z-index: 10;
            overflow-y: auto; /* Por si el texto es largo en móvil */
        }

        .detail-header {
            display: flex; 
            flex-direction: row; /* Desktop */
            align-items: center; 
            gap: 20px;
            border-bottom: 1px solid #444; 
            padding-bottom: 20px;
        }

        @media (max-width: 600px) {
            .detail-header {
                flex-direction: column; /* Apilado en móvil */
                text-align: center;
            }
            .detail-header-image {
                width: 120px;
                height: 120px;
            }
            .detail-header-title {
                font-size: 1.4rem;
            }
        }

        .detail-header-image { width: 150px; height: 150px; object-fit: contain; border-radius: 8px; }
        .detail-header-title { font-size: 1.8rem; font-weight: 800; margin-bottom: 10px; }
        
        .detail-content { padding-top: 20px; font-size: 1.1em; line-height: 1.6; color: #ccc; }
        
        .btn-close {
            margin-top: 20px; padding: 12px 24px;
            background: var(--accent-color); color: white;
            border: none; border-radius: 6px; cursor: pointer;
            font-weight: bold; width: 100%; /* Más fácil de clickear en móvil */
        }

        @media (min-width: 601px) {
            .btn-close { width: auto; }
        }
    `;

    constructor() {
        super();
        this.productos = [];
        this.loading = true;
    }

    controller = new AnimateController(this, {
        defaultOptions: { keyframeOptions: { duration: 750, fill: 'both' }, onFrames },
    });

    connectedCallback() {
        super.connectedCallback();
        this._fetchDestacados();
    }

    async _fetchDestacados() {
        try {
            const res = await fetch(`${API_URL}/productos/destacados`);
            this.productos = await res.json();
        } catch (error) {
            console.error("Error al cargar destacados:", error);
        } finally {
            this.loading = false;
        }
    }

    clickHandler(e, item) {
        if (this.controller.isAnimating) {
            this.controller.togglePlay();
        } else {
            this.detail = item; // Si item es null, se cierra el detalle
        }
    }

    render() {
        if (this.loading) return html`<p style="color: white; text-align: center;">Cargando periféricos top...</p>`;
        if (!this.productos || this.productos.length === 0) return html`<p style="color: #aaa; text-align: center;">No hay productos destacados por ahora.</p>`;

        return html`
        <div class="container">
            <ul class="cards ${this.detail ? 'fit' : ''}">
                ${repeat(
                    this.detail ? [] : this.productos,
                    (p) => p.id,
                    (p) => html`
                    <li @click=${(e) => this.clickHandler(e, p)}
                        ${animate({ out: fadeOut, id: `${p.id}:card`, inId: `${p.id}:detail` })}>
                        <div class="card-background fit" ${animate({ in: fadeInSlow, skipInitial: true })}></div>
                        
                        <div class="card-image-container" ${animate({ id: `${p.id}:image-container`, inId: `${p.id}:detail-image-container`, skipInitial: true })}>
                            <img src="${p.imagen_url || 'https://via.placeholder.com/150'}" class="card-image" alt="${p.nombre}">
                        </div>
                        
                        <div class="card-header hero-text">
                            <div ${animate({ id: `${p.id}:text-block`, inId: `${p.id}:detail-text-block`, skipInitial: true })}>
                                <div class="card-header-title">${p.nombre}</div>
                                <div class="card-price">$${parseFloat(p.precio).toFixed(2)}</div>
                            </div>
                        </div>
                    </li>`
                )}
            </ul>

            ${this.detail ? html`
                <div class="detail fit" ${animate({ id: `${this.detail.id}:detail`, inId: `${this.detail.id}:card` })}>
                    <div class="detail-header">
                        <div class="detail-image-wrapper" ${animate({ id: `${this.detail.id}:detail-image-container`, inId: `${this.detail.id}:image-container` })}>
                            <img src="${this.detail.imagen_url || 'https://via.placeholder.com/150'}" class="detail-header-image">
                        </div>
                        
                        <div class="detail-header-text hero-text" ${animate({ id: `${this.detail.id}:detail-text-block`, inId: `${this.detail.id}:text-block` })}>
                            <div class="detail-header-title">${this.detail.nombre}</div>
                            <div class="card-price" style="font-size: 1.5rem;">$${parseFloat(this.detail.precio).toFixed(2)}</div>
                        </div>
                    </div>
                    
                    <div class="detail-content" ${animate({ in: fadeInSlow })}>
                        ${this.detail.descripcion || 'Sin descripción disponible.'}
                    </div>

                    <button class="btn-close" @click=${(e) => this.clickHandler(e, null)}>
                        Volver a destacados
                    </button>
                </div>
            ` : ''}
        </div>`;
    }
}
customElements.define('bm-destacados', BmDestacados);