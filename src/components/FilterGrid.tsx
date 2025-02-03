import React from 'react';
import { Filter } from '../types';

interface Props {
  filters: Filter[];
  onFilterSelect: (filter: Filter) => void;
  selectedFilter: Filter | null;
}

const FilterGrid: React.FC<Props> = ({ filters, onFilterSelect, selectedFilter }) => {
  return (
    <div className="mt-16 mb-24">
      <div className="flex items-center justify-between px-4 mb-4">
        <h2 className="text-lg font-semibold">Select Style</h2>
        <button className="text-sm text-purple-500">See All</button>
      </div>
      
      <div className="flex gap-3 overflow-x-auto px-4 pb-4 snap-x snap-mandatory hide-scrollbar">
        {filters.map((filter) => (
          <div
            key={filter.id}
            className={`flex-shrink-0 w-24 snap-start ${
              selectedFilter?.id === filter.id ? 'ring-2 ring-purple-500' : ''
            }`}
            onClick={() => onFilterSelect(filter)}
          >
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-2">
              <img
                src={filter.image}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilterGrid;