import React from "react";
import "./ProductCard.css";

// Star icon for rating
function StarIcon({ half = false }) {
  if (half) {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="halfGrad">
            <stop offset="50%" stopColor="#E8A400" />
            <stop offset="50%" stopColor="#D4D4D4" />
          </linearGradient>
        </defs>
        <path
          d="M9 1.5L11.09 6.26L16.18 6.77L12.55 10.14L13.64 15.18L9 12.45L4.36 15.18L5.45 10.14L1.82 6.77L6.91 6.26L9 1.5Z"
          fill="url(#halfGrad)"
        />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9 1.5L11.09 6.26L16.18 6.77L12.55 10.14L13.64 15.18L9 12.45L4.36 15.18L5.45 10.14L1.82 6.77L6.91 6.26L9 1.5Z"
        fill="#E8A400"
      />
    </svg>
  );
}

// Star Seller badge icon (purple)
function StarSellerBadge() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="9" cy="9" r="9" fill="#595959" />
      <path
        d="M9 4L10.18 7.27L13.66 7.27L10.94 9.27L11.96 12.54L9 10.74L6.04 12.54L7.06 9.27L4.34 7.27L7.82 7.27L9 4Z"
        fill="white"
      />
    </svg>
  );
}

// Etsy's Pick badge
function EtsysPickBadge() {
  return (
    <div className="pc-etsy-pick-badge">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M7 1L8.545 4.91L12.728 4.91L9.546 7.27L10.727 11.18L7 8.91L3.273 11.18L4.454 7.27L1.272 4.91L5.455 4.91L7 1Z"
          fill="white"
        />
      </svg>
      <span>Etsy's Pick</span>
    </div>
  );
}

export default function ProductCard({
  image = "https://images.unsplash.com/photo-1513506003901-1e6a35f3d1c5?w=750",
  price = "$94.00",
  taxNote = "Local taxes included (where applicable)",
  title = "Table lamp TORO x AMBER, retro minimal 3D printed...",
  seller = "3DecoStudio",
  starCount = 4.5,
  reviewCount = 257,
  onAddToCart = () => {},
  onViewOptions = () => {},
}) {
  const fullStars = Math.floor(starCount);
  const hasHalf = starCount % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <div className="pc-card">
      {/* Product image */}
      <div className="pc-image-wrap">
        <img src={image} alt={title} className="pc-image" />
        <EtsysPickBadge />
        {/* Image dots indicator */}
        <div className="pc-dots">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className={`pc-dot${i === 0 ? " pc-dot--active" : ""}`} />
          ))}
        </div>
      </div>

      {/* Product info */}
      <div className="pc-info">
        {/* Price */}
        <div className="pc-price-row">
          <span className="pc-price">{price}</span>
        </div>
        <p className="pc-tax-note">{taxNote}</p>

        {/* Title */}
        <h1 className="pc-title">{title}</h1>

        {/* Seller */}
        <div className="pc-seller-row">
          <span className="pc-seller">Designed by {seller}</span>
          <StarSellerBadge />
        </div>

        {/* Star rating */}
        <div className="pc-rating-row">
          <div className="pc-stars">
            {Array.from({ length: fullStars }).map((_, i) => (
              <StarIcon key={`full-${i}`} />
            ))}
            {hasHalf && <StarIcon half />}
            {Array.from({ length: emptyStars }).map((_, i) => (
              <svg key={`empty-${i}`} width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M9 1.5L11.09 6.26L16.18 6.77L12.55 10.14L13.64 15.18L9 12.45L4.36 15.18L5.45 10.14L1.82 6.77L6.91 6.26L9 1.5Z"
                  fill="#D4D4D4"
                />
              </svg>
            ))}
          </div>
          <a href="#reviews" className="pc-review-count">
            {reviewCount.toLocaleString()} reviews
          </a>
        </div>

        {/* CTA Buttons */}
        <div className="pc-actions">
          <button className="pc-btn pc-btn--primary" onClick={onAddToCart}>
            Add to cart
          </button>
          <button className="pc-btn pc-btn--secondary" onClick={onViewOptions}>
            View item options
          </button>
        </div>
      </div>
    </div>
  );
}
