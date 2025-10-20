import React, { useMemo } from 'react';
import { Rating, ModelType } from '../types';
import { useI18n } from '../i18n/I18nContext';

interface RatingsLeaderboardProps {
  ratings: Rating[];
  modelOptions: { value: ModelType; label: string }[];
}

// Constants for weighted rating calculation
const PRIOR_COUNT = 5; // Number of fictitious ratings to add
const PRIOR_VALUE = 3; // The value of each fictitious rating (e.g., 3 stars)

const RatingsLeaderboard: React.FC<RatingsLeaderboardProps> = ({ ratings, modelOptions }) => {
  const { t } = useI18n();

  const leaderboardData = useMemo(() => {
    if (ratings.length === 0) {
      return [];
    }
    // FIX: Explicitly type the initial value of the reduce accumulator. This allows TypeScript to correctly
    // infer the shape of `ratingsByModel`, resolving errors where properties were being accessed on an 'unknown' type.
    const ratingsByModel = ratings.reduce((acc, rating) => {
      const model = rating.model;
      if (!acc[model]) {
        acc[model] = { total: 0, count: 0 };
      }
      acc[model].total += rating.rating;
      acc[model].count += 1;
      return acc;
    }, {} as Record<ModelType, { total: number; count: number }>);

    return Object.entries(ratingsByModel)
      .map(([model, data]) => {
        const modelInfo = modelOptions.find(opt => opt.value === model);
        const average = data.total / data.count;
        const weightedAverage = (data.total + (PRIOR_VALUE * PRIOR_COUNT)) / (data.count + PRIOR_COUNT);
        
        return {
          model: model as ModelType,
          label: modelInfo?.label || model,
          average,
          weightedAverage,
          count: data.count,
        };
      })
      .sort((a, b) => b.weightedAverage - a.weightedAverage);
  }, [ratings, modelOptions]);

  return (
    <div className="bg-surface p-6 rounded-xl border border-surface-light shadow-lg">
      <h2 className="text-2xl font-bold mb-4">{t('chart.title')}</h2>
      {leaderboardData.length === 0 ? (
        <p className="text-text-secondary">{t('chart.no_data')}</p>
      ) : (
        <div className="space-y-4">
          {leaderboardData.map(({ label, average, count }) => (
            <div key={label}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold">{label} ({count} {t(count === 1 ? 'rating.singular' : 'rating.plural')})</span>
                <span className="text-primary font-bold">{average.toFixed(2)} ★</span>
              </div>
              <div className="w-full bg-surface-light rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-primary to-accent-orange h-4 rounded-full"
                  style={{ width: `${(average / 5) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RatingsLeaderboard;