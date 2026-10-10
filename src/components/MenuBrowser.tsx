import React, { useState, useMemo } from 'react';
import { MenuItem, MealCategory } from '../types';
import { Search, SlidersHorizontal, Clock, Plus, AlertCircle, Ban, Check } from 'lucide-react';

interface MenuBrowserProps {
  items: MenuItem[];
  selectedCanteenId: string;
  onChangeCanteen: (canteenId: string) => void;
  onSelectItemForCustomization: (item: MenuItem) => void;
}

export const MenuBrowser: React.FC<MenuBrowserProps> = ({
  items,
  selectedCanteenId,
  onChangeCanteen,
  onSelectItemForCustomization,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'recommended' | 'price_asc' | 'price_desc' | 'prep_time'>('recommended');
  const [availableOnly, setAvailableOnly] = useState<boolean>(false);

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'All Items' },
    { id: 'breakfast', label: 'Breakfast' },
    { id: 'lunch', label: 'Lunch' },
    { id: 'snacks', label: 'Snacks' },
    { id: 'meals', label: 'Meals' },
    { id: 'beverages', label: 'Beverages' },
  ];

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (item.canteenId !== selectedCanteenId) return false;
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (availableOnly && (!item.isAvailable || item.stockQuantity <= 0)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        if (!matchName && !matchDesc) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.basePrice - b.basePrice;
      if (sortBy === 'price_desc') return b.basePrice - a.basePrice;
      if (sortBy === 'prep_time') return a.prepTimeMinutes - b.prepTimeMinutes;
      return 0; // recommended order
    });
  }, [items, selectedCanteenId, selectedCategory, searchQuery, sortBy, availableOnly]);

  return (
    <div className="space-y-6">
      {/* Canteen Selector Segmented Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">
            Campus Dining Menu
          </h2>
          <p className="text-xs text-stone-500">
            Real-time kitchen inventory with item-specific preparation customizations
          </p>
        </div>

        {/* Canteen Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl border border-stone-200 self-start sm:self-auto">
          <button
            onClick={() => onChangeCanteen('canteen_a')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              selectedCanteenId === 'canteen_a'
                ? 'bg-white text-emerald-950 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Canteen A: Harvest Grill
          </button>
          <button
            onClick={() => onChangeCanteen('canteen_b')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              selectedCanteenId === 'canteen_b'
                ? 'bg-white text-emerald-950 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Canteen B: Banyan Court
          </button>
        </div>
      </div>

      {/* Controls Strip: Search, Categories, Sort */}
      <div className="space-y-3">
        {/* Search & Sort Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search dishes, drinks, ingredients (e.g. Masala Dosa, Cold Brew, Biryani)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-medium text-stone-700 focus:outline-none focus:border-emerald-700"
            >
              <option value="recommended">Sort: Popular & Recommended</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="prep_time">Fastest Prep Time</option>
            </select>

            <button
              onClick={() => setAvailableOnly(!availableOnly)}
              className={`px-3 py-2 text-xs font-medium rounded-xl border flex items-center gap-1.5 transition-colors ${
                availableOnly
                  ? 'bg-emerald-50 border-emerald-600 text-emerald-900 font-semibold'
                  : 'bg-white border-stone-300 text-stone-600 hover:bg-stone-50'
              }`}
            >
              <span>In Stock Only</span>
            </button>
          </div>
        </div>

        {/* Category Pills Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      {filteredItems.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-stone-200">
          <div className="w-12 h-12 mx-auto rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-800">No Food Items Match Your Filters</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
            Try adjusting your search terms or category selection to see other campus offerings.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const isSoldOut = !item.isAvailable || item.stockQuantity <= 0;
            const isLowStock = !isSoldOut && item.stockQuantity <= item.lowStockThreshold;

            return (
              <div
                key={item.id}
                className={`group bg-white rounded-xl border transition-all duration-200 flex flex-col justify-between overflow-hidden ${
                  isSoldOut
                    ? 'border-stone-200 opacity-75'
                    : 'border-stone-200 hover:border-emerald-500 hover:shadow-md'
                }`}
              >
                <div>
                  {/* Image Container with Fallback */}
                  <div className="relative h-44 w-full bg-stone-100 overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />

                    {/* Category Label */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-900/80 text-white backdrop-blur-xs">
                        {item.category}
                      </span>
                    </div>

                    {/* Stock Status Badge */}
                    <div className="absolute top-2.5 right-2.5">
                      {isSoldOut ? (
                        <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-xs">
                          Sold Out
                        </span>
                      ) : isLowStock ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500 text-amber-950 text-[10px] font-bold uppercase tracking-wider shadow-xs">
                          Low Stock ({item.stockQuantity} left)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-white/90 text-stone-700 text-[10px] font-semibold tabular-nums backdrop-blur-xs shadow-xs">
                          {item.stockQuantity} in stock
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-base text-stone-900 leading-snug group-hover:text-emerald-900 transition-colors">
                        {item.name}
                      </h3>
                      <span className="font-mono font-bold text-base text-stone-900 shrink-0 tabular-nums">
                        ₹{item.basePrice}
                      </span>
                    </div>

                    <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-stone-500 pt-1">
                      <span className="flex items-center gap-1 font-medium text-stone-700">
                        <Clock className="w-3.5 h-3.5 text-emerald-700" /> ~{item.prepTimeMinutes}m prep
                      </span>
                      {item.customizationGroups.length > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-emerald-800 font-semibold">
                            {item.customizationGroups.length} Customization Options
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 pt-0">
                  <button
                    disabled={isSoldOut}
                    onClick={() => onSelectItemForCustomization(item)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      isSoldOut
                        ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                        : 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs'
                    }`}
                  >
                    {isSoldOut ? (
                      <>
                        <Ban className="w-3.5 h-3.5" />
                        <span>Unavailable Today</span>
                      </>
                    ) : item.customizationGroups.length > 0 ? (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Customize & Add</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add to Cart · ₹{item.basePrice}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
