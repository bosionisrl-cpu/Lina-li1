import { PresetTemplate } from './types';

export const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: 'product-grid',
    title: 'E-Commerce Product Card Grid',
    language: 'html',
    description: 'A basic, unstyled product list. Upgrade to get responsive flex/grid spacing, hover zoom visuals, glassmorphic labels, and buy-touch click feedback.',
    code: `<div class="product-section">
  <h2 className="title">Our Top Decor Picks</h2>
  <div class="products">
    <div class="card">
      <img src="https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80" />
      <h3>Minimalist Oak Lamp</h3>
      <p>Soft ambient tabletop glow.</p>
      <div class="price">$129.00</div>
      <button class="buy-btn">Buy Now</button>
    </div>
    <div class="card">
      <img src="https://images.unsplash.com/photo-1603006905393-0d5651bfef25?w=600&auto=format&fit=crop&q=80" />
      <h3>Sandalwood Organics Soy Candle</h3>
      <p>Smoked white timber and sandalwood bark.</p>
      <div class="price">$24.00</div>
      <button class="buy-btn">Buy Now</button>
    </div>
    <div class="card">
      <img src="https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=600&auto=format&fit=crop&q=80" />
      <h3>Ergonomic Tension Core Mesh Chair</h3>
      <p>Adaptive lumbar mesh design.</p>
      <div class="price">$349.00</div>
      <button class="buy-btn">Buy Now</button>
    </div>
  </div>
</div>`
  },
  {
    id: 'hero-banner',
    title: 'Hygge Storefront Hero Block',
    language: 'html',
    description: 'A standard static hero promotional header. Upgrade to optimize visual depth, text overlay readability masks, soft gradient backgrounds, and premium buttons.',
    code: `<header class="hero">
  <div class="overlay">
    <span class="badge">SPRING 2026</span>
    <h1>Warm Simplicity in Living</h1>
    <p>Discover design essentials curated to balance raw wood grain textures and daily mindfulness.</p>
    <div class="cta-actions">
      <a href="#explore">Shop Collection</a>
      <a href="#about" class="secondary">Our Philosophy</a>
    </div>
  </div>
</header>`
  },
  {
    id: 'cart-list',
    title: 'Interactive Shopping Bag Checklist',
    language: 'html',
    description: 'An old-fashioned shopping cart layout. Upgrade to replace it with a clean, low-clutter design with modern numbers, thumbnail frames, and visual subtotal sums.',
    code: `<div class="shopping-bag">
  <h2>Your Order Bag (3 Items)</h2>
  <table border="1" style="width:100%; text-align:left; border-collapse:collapse;">
    <tr>
      <th>Product Item</th>
      <th>Qty</th>
      <th>Price</th>
      <th>Action</th>
    </tr>
    <tr>
      <td>Nordic Desk Lamp</td>
      <td>1</td>
      <td>$129.00</td>
      <td>Remove</td>
    </tr>
    <tr>
      <td>Aromatic Soy Candle</td>
      <td>2</td>
      <td>$48.00</td>
      <td>Remove</td>
    </tr>
  </table>
  <div class="summary">
    <span>Subtotal: $177.00</span>
    <button>Checkout Order</button>
  </div>
</div>`
  },
  {
    id: 'testimonials',
    title: 'Customer Review Testimonials Grid',
    language: 'html',
    description: 'A basic stack of customer quotes. Upgrade to design a elegant bento grid showing glowing ratings, customer avatar overlays, and subtle ambient shadows.',
    code: `<div class="customer-reviews">
  <h3>What Our Design Community Says</h3>
  <div class="review-row">
    <div class="review">
      <p>"The oak quality of the lamp matches my minimal workspace perfectly. Soft glow makes desk work so cozy."</p>
      <strong>— Marcus R., Architect</strong>
    </div>
    <div class="review">
      <p>"Incredible soy aroma! Sandalwood is organic and burns incredibly cleanly for more than 50 hours."</p>
      <strong>— Clara S., Decor Blogger</strong>
    </div>
  </div>
</div>`
  }
];
