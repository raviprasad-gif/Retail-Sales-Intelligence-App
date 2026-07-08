/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Filter, ChevronDown, ChevronRight, Check, X, RefreshCw } from "lucide-react";

interface SidebarFiltersProps {
  availableWeeks: string[];
  availableRegions: string[];
  availableStores: string[];
  availableCities: string[];
  availableStoreFormats: string[];
  availableCategories: string[];

  selectedWeeks: string[];
  selectedRegions: string[];
  selectedStores: string[];
  selectedCities: string[];
  selectedStoreFormats: string[];
  selectedCategories: string[];

  onFilterChange: (dimension: string, selectedValues: string[]) => void;
  onResetFilters: () => void;
  isOpen: boolean;
  onToggleCollapse: () => void;
}

export const SidebarFilters: React.FC<SidebarFiltersProps> = ({
  availableWeeks,
  availableRegions,
  availableStores,
  availableCities,
  availableStoreFormats,
  availableCategories,

  selectedWeeks,
  selectedRegions,
  selectedStores,
  selectedCities,
  selectedStoreFormats,
  selectedCategories,

  onFilterChange,
  onResetFilters,
  isOpen,
  onToggleCollapse
}) => {
  // Individual section collapses
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    weeks: false,
    regions: false,
    stores: false,
    cities: true, // collapse less common ones by default
    formats: false,
    categories: false
  });

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const renderFilterSection = (
    id: string,
    title: string,
    available: string[],
    selected: string[]
  ) => {
    const isCollapsed = collapsedSections[id];

    return (
      <div className="border-b border-[#E5E7EB] dark:border-[#2D2D2D] py-3.5">
        <button
          onClick={() => toggleSection(id)}
          className="flex items-center justify-between w-full text-left font-bold text-xs tracking-wider uppercase text-[#1F2937] dark:text-[#A0AEC0] hover:text-[#1F4E79] dark:hover:text-[#FFFFFF] transition-colors"
        >
          <span className="truncate">
            {title} <span className="text-[10px] text-[#6B7280] dark:text-[#A0AEC0] font-medium">({selected.length}/{available.length})</span>
          </span>
          {isCollapsed ? <ChevronRight className="w-4 h-4 text-[#6B7280]" /> : <ChevronDown className="w-4 h-4 text-[#1F4E79] dark:text-[#FFFFFF]" />}
        </button>

        {!isCollapsed && (
          <div className="mt-3.5 flex flex-col gap-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
            <div className="flex gap-2.5 mb-1.5 text-[11px] font-semibold">
              <button
                onClick={() => onFilterChange(id, available)}
                className="text-[#1976D2] hover:text-[#1F4E79] dark:text-[#A0AEC0] dark:hover:text-[#FFFFFF] transition-colors"
              >
                Select All
              </button>
              <span className="text-[#E5E7EB] dark:text-[#2D2D2D]">|</span>
              <button
                onClick={() => onFilterChange(id, [])}
                className="text-[#6B7280] hover:text-[#1F2937] dark:text-[#A0AEC0] dark:hover:text-[#FFFFFF] transition-colors"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-1.5">
              {available.map(val => {
                const isChecked = selected.includes(val);
                return (
                  <label
                    key={val}
                    className="flex items-center gap-2.5 text-xs text-[#1F2937] dark:text-[#A0AEC0] cursor-pointer hover:text-[#1F4E79] dark:hover:text-[#FFFFFF] py-0.5 select-none transition-colors"
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={isChecked}
                      onChange={() => {
                        if (isChecked) {
                          onFilterChange(id, selected.filter(v => v !== val));
                        } else {
                          onFilterChange(id, [...selected, val]);
                        }
                      }}
                    />
                    <div
                      className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-all ${
                        isChecked
                          ? "bg-[#1F4E79] border-[#1F4E79] text-white"
                          : "border-[#6B7280]/40 dark:border-[#2D2D2D] hover:border-[#1F4E79] dark:hover:border-[#A0AEC0]"
                      }`}
                    >
                      {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <span className="truncate font-medium">{val}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggleCollapse}
        className="fixed bottom-6 left-6 lg:bottom-auto lg:right-auto lg:top-20 lg:left-6 z-40 p-3 bg-[#1F4E79] text-white rounded-full shadow-lg hover:bg-[#3949AB] hover:scale-105 transition-all flex items-center gap-2 font-semibold text-xs px-4 border border-[#1976D2]"
      >
        <Filter className="w-4 h-4" />
        <span>Slicers Panel</span>
      </button>
    );
  }

  return (
    <aside className="w-full lg:w-72 bg-white dark:bg-[#1E1E1E] border-r border-[#E5E7EB] dark:border-[#2D2D2D] shrink-0 h-auto lg:h-[calc(100vh-4rem)] lg:sticky lg:top-16 overflow-y-auto p-5 flex flex-col justify-between shadow-[2px_0_8px_rgba(0,0,0,0.01)] z-30">
      <div>
        <div className="flex items-center justify-between mb-2 pb-3 border-b border-[#E5E7EB] dark:border-[#2D2D2D]">
          <div className="flex items-center gap-2">
            <Filter className="w-4.5 h-4.5 text-[#1F4E79] dark:text-[#A0AEC0]" />
            <h3 className="font-bold text-sm tracking-tight text-[#1F2937] dark:text-[#FFFFFF]">
              Report Slicers
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onResetFilters}
              title="Reset All Slicers"
              className="p-1.5 text-[#6B7280] hover:text-[#1F4E79] hover:bg-[#F5F7FA] dark:hover:bg-[#2D2D2D] rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onToggleCollapse}
              className="p-1 text-[#6B7280] hover:text-[#1F4E79] dark:hover:text-[#FFFFFF] cursor-pointer"
              title="Collapse Panel"
            >
              <ChevronRight className="w-5 h-5 hidden lg:block" />
              <X className="w-5 h-5 lg:hidden" />
            </button>
          </div>
        </div>

        <div className="space-y-1">
          {renderFilterSection("weeks", "Fiscal Week", availableWeeks, selectedWeeks)}
          {renderFilterSection("regions", "Geographic Region", availableRegions, selectedRegions)}
          {renderFilterSection("stores", "Store Outlets", availableStores, selectedStores)}
          {renderFilterSection("cities", "Cities", availableCities, selectedCities)}
          {renderFilterSection("storeFormats", "Store Format", availableStoreFormats, selectedStoreFormats)}
          {renderFilterSection("categories", "Product Categories", availableCategories, selectedCategories)}
        </div>
      </div>

      <div className="pt-4 mt-4 border-t border-[#E5E7EB] dark:border-[#2D2D2D]">
        <button
          onClick={onResetFilters}
          className="w-full py-2.5 bg-[#F5F7FA] hover:bg-[#E5E7EB] dark:bg-[#2D2D2D] dark:hover:bg-[#2D2D2D]/80 text-[#1F4E79] dark:text-[#A0AEC0] hover:text-[#3949AB] dark:hover:text-[#FFFFFF] font-bold text-xs rounded-lg border border-[#E5E7EB] dark:border-[#2D2D2D] transition-all cursor-pointer"
        >
          Reset All Slicers
        </button>
      </div>
    </aside>
  );
};
