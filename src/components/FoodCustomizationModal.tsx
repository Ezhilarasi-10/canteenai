import React, { useState, useEffect } from 'react';
import { MenuItem, SelectedCustomization } from '../types';
import { X, Clock, Plus, Minus, Check, AlertCircle } from 'lucide-react';

interface FoodCustomizationModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (
    item: MenuItem,
    quantity: number,
    selectedCustomizations: SelectedCustomization[]
  ) => void;
}

export const FoodCustomizationModal: React.FC<FoodCustomizationModalProps> = ({
  item,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedMap, setSelectedMap] = useState<{ [groupId: string]: string[] }>({});
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize defaults whenever modal opens for an item
  useEffect(() => {
    if (!item) return;
    setQuantity(1);
    setValidationError(null);

    const initialSelections: { [groupId: string]: string[] } = {};
    item.customizationGroups.forEach((group) => {
      const defaultOpt = group.options.find((o) => o.isDefault && o.isAvailable);
      if (defaultOpt) {
        initialSelections[group.id] = [defaultOpt.id];
      } else if (group.isRequired && group.options.length > 0) {
        const firstAvailable = group.options.find((o) => o.isAvailable);
        if (firstAvailable) {
          initialSelections[group.id] = [firstAvailable.id];
        }
      } else {
        initialSelections[group.id] = [];
      }
    });

    setSelectedMap(initialSelections);
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  // Toggle single or multi-select option
  const handleOptionToggle = (groupId: string, optionId: string, maxSelections: number) => {
    setValidationError(null);
    setSelectedMap((prev) => {
      const current = prev[groupId] || [];
      if (maxSelections === 1) {
        // Single select (radio button behavior)
        return { ...prev, [groupId]: [optionId] };
      } else {
        // Multi select (checkbox behavior)
        if (current.includes(optionId)) {
          return { ...prev, [groupId]: current.filter((id) => id !== optionId) };
        } else {
          if (current.length >= maxSelections) {
            setValidationError(`Maximum ${maxSelections} choices allowed for this group.`);
            return prev;
          }
          return { ...prev, [groupId]: [...current, optionId] };
        }
      }
    });
  };

  // Calculate live price delta and unit price
  let additionalCost = 0;
  const currentSelections: SelectedCustomization[] = [];

  item.customizationGroups.forEach((group) => {
    const selectedOptionIds = selectedMap[group.id] || [];
    selectedOptionIds.forEach((optId) => {
      const option = group.options.find((o) => o.id === optId);
      if (option) {
        additionalCost += option.priceDelta;
        currentSelections.push({
          groupId: group.id,
          groupTitle: group.title,
          optionId: option.id,
          optionName: option.name,
          priceDelta: option.priceDelta,
        });
      }
    });
  });

  const unitPrice = item.basePrice + additionalCost;
  const calculatedTotal = unitPrice * quantity;

  // Submit & validate required selections
  const handleConfirm = () => {
    // Check mandatory groups
    for (const group of item.customizationGroups) {
      const chosen = selectedMap[group.id] || [];
      if (group.isRequired && chosen.length < group.minSelections) {
        setValidationError(`Please make a selection for "${group.title}".`);
        return;
      }
    }

    onAddToCart(item, quantity, currentSelections);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        {/* Modal Header with Image Banner */}
        <div className="relative h-44 sm:h-52 w-full bg-stone-100 shrink-0 overflow-hidden">
          <img
            src={item.imageUrl}
            alt={item.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-stone-900/60 text-white hover:bg-stone-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
              {item.category} · {item.canteenId === 'canteen_a' ? 'Harvest Campus Grill' : 'Banyan Court'}
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold leading-tight drop-shadow-sm">
              {item.name}
            </h2>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          <p className="text-sm text-stone-600 leading-relaxed">
            {item.description}
          </p>

          <div className="flex items-center gap-4 text-xs text-stone-500 pb-2 border-b border-stone-100">
            <span className="flex items-center gap-1 font-medium text-stone-700">
              <Clock className="w-4 h-4 text-emerald-700" /> ~{item.prepTimeMinutes}m prep time
            </span>
            <span>·</span>
            <span className="font-mono tabular-nums text-stone-700 font-semibold">
              Stock: {item.stockQuantity} remaining
            </span>
            {item.stockQuantity <= item.lowStockThreshold && (
              <span className="text-amber-700 font-semibold">(Low Stock)</span>
            )}
          </div>

          {/* Validation Alert */}
          {validationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Individual Customization Groups */}
          {item.customizationGroups.length > 0 ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Customization Options
                </h4>
                <span className="text-xs text-stone-400">Owner-Configured Engine</span>
              </div>

              {item.customizationGroups.map((group) => {
                const currentSelectedIds = selectedMap[group.id] || [];

                return (
                  <div key={group.id} className="bg-stone-50 p-4 rounded-xl border border-stone-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-sm font-bold text-stone-800">
                          {group.title}
                        </h5>
                        {group.description && (
                          <p className="text-xs text-stone-500">{group.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        {group.isRequired ? (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                            Required
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-stone-500">
                            Optional (Max {group.maxSelections})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Group Options */}
                    <div className="space-y-2 pt-1">
                      {group.options.map((opt) => {
                        const isSelected = currentSelectedIds.includes(opt.id);

                        return (
                          <button
                            key={opt.id}
                            type="button"
                            disabled={!opt.isAvailable}
                            onClick={() => handleOptionToggle(group.id, opt.id, group.maxSelections)}
                            className={`w-full text-left p-3 rounded-lg border text-xs font-medium flex items-center justify-between transition-all ${
                              isSelected
                                ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-semibold'
                                : opt.isAvailable
                                ? 'bg-white border-stone-200 text-stone-700 hover:border-stone-300'
                                : 'bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed opacity-60'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                                  group.maxSelections === 1 ? 'rounded-full' : 'rounded'
                                } ${
                                  isSelected
                                    ? 'bg-emerald-700 border-emerald-700 text-white'
                                    : 'border-stone-300 bg-white'
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <span>{opt.name}</span>
                            </div>
                            <span className="font-mono tabular-nums text-stone-600">
                              {opt.priceDelta > 0 ? `+₹${opt.priceDelta}` : 'Free'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-100 text-xs text-stone-500 text-center">
              This delicious item is prepared to Chef's signature recipe with no custom variants required.
            </div>
          )}
        </div>

        {/* Modal Footer with Quantity and Total Price CTA */}
        <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Quantity Selector */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-xs font-semibold text-stone-700">Quantity</span>
            <div className="flex items-center border border-stone-300 bg-white rounded-lg overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-2 text-stone-600 hover:bg-stone-100 active:bg-stone-200 transition-colors"
                disabled={quantity <= 1}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="px-3 py-1 font-mono font-bold text-sm text-stone-800 tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(item.stockQuantity, q + 1))}
                className="p-2 text-stone-600 hover:bg-stone-100 active:bg-stone-200 transition-colors"
                disabled={quantity >= item.stockQuantity}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Add to Cart Button with validated live total */}
          <button
            onClick={handleConfirm}
            disabled={item.stockQuantity <= 0}
            className="w-full sm:w-auto px-6 py-3 bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Add to Cart</span>
            <span className="bg-emerald-700/80 px-2 py-0.5 rounded text-emerald-100 font-mono tabular-nums">
              ₹{calculatedTotal}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
