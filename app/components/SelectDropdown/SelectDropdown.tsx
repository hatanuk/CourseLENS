'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import styles from './SelectDropdown.module.css';

export interface SelectDropdownItem {
  id: string;
  label: string;
}

interface SelectDropdownProps {
  items: SelectDropdownItem[];
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onSelectAll?: () => void;
  onClear?: () => void;
  placeholder: string;
  multiSelect?: boolean;
  selectedLabel?: (count: number) => string;
  selectAllLabel?: string;
  clearLabel?: string;
  maxHeight?: number;
  disabled?: boolean;
}

export default function SelectDropdown({
  items,
  selectedIds,
  onSelect,
  onSelectAll,
  onClear,
  placeholder,
  multiSelect = false,
  selectedLabel,
  selectAllLabel = 'Select all',
  clearLabel = 'Clear',
  maxHeight = 240,
  disabled = false,
}: SelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleItemClick = (id: string) => {
    onSelect(id);
    if (!multiSelect) setOpen(false);
  };

  const triggerLabel =
    selectedIds.size === 0
      ? placeholder
      : multiSelect
        ? (selectedLabel ? selectedLabel(selectedIds.size) : `${selectedIds.size} selected`)
        : items.find((i) => i.id === [...selectedIds][0])?.label ?? placeholder;

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-expanded={open}
        disabled={disabled}
      >
        <span>{triggerLabel}</span>
        <ChevronDown size={18} className={open ? styles.chevronOpen : ''} />
      </button>
      {open && (
        <div className={styles.panel} style={{ maxHeight }}>
          {((multiSelect && onSelectAll && onClear) || (!multiSelect && onClear && selectedIds.size > 0)) && (
            <div className={styles.actions}>
              {multiSelect && onSelectAll && (
                <button type="button" className={styles.actionBtn} onClick={onSelectAll}>
                  {selectAllLabel}
                </button>
              )}
              {onClear && (
                <button type="button" className={styles.actionBtn} onClick={onClear}>
                  {clearLabel}
                </button>
              )}
            </div>
          )}
          <ul className={styles.list}>
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`${styles.item} ${selectedIds.has(item.id) ? styles.itemSelected : ''}`}
                  onClick={() => handleItemClick(item.id)}
                >
                  {multiSelect ? (
                    <span className={styles.checkSlot}>
                      {selectedIds.has(item.id) && <Check size={16} />}
                    </span>
                  ) : null}
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
