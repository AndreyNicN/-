import React, { useState } from 'react';
import { StarIcon } from './Icons';

interface StarRatingProps {
  onRate: (rating: number) => void;
  disabled?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({ onRate, disabled = false }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleRate = (rating: number) => {
    if (!disabled) {
      onRate(rating);
    }
  };

  return (
    <div className={`flex items-center gap-1 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => handleRate(star)}
          onMouseEnter={() => !disabled && setHoverRating(star)}
          onMouseLeave={() => !disabled && setHoverRating(0)}
          disabled={disabled}
          className="p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-accent-orange"
          aria-label={`Rate ${star} star`}
        >
          <StarIcon
            className={`w-7 h-7 transition-colors ${
              hoverRating >= star
                ? 'text-accent-orange fill-accent-orange'
                : 'text-gray-500'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

export default StarRating;
