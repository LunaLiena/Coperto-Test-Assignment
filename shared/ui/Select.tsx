'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
  forwardRef,
  type KeyboardEvent,
  type MutableRefObject,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Нативный <select> не позволяет ни стилизовать, ни анимировать сам
 * выпадающий список — это рисует ОС/браузер, а не страница. Поэтому здесь
 * полноценный кастомный listbox: кнопка-триггер + панель на Framer Motion,
 * с клавиатурной навигацией и ARIA (role="listbox"/"option",
 * aria-expanded, aria-selected) — тот же уровень доступности, что даёт
 * нативный select, но с контролем над видом.
 *
 * API соответствует Controller из react-hook-form (value/onChange как
 * значение, а не событие) — так и подключается в StopReasonPanel.
 */

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string | undefined;
  hideLabel?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    { label, options, value, onChange, onBlur, error, hideLabel = false, disabled = false, id, className = '' },
    forwardedRef,
  ) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const labelId = `${selectId}-label`;
    const listboxId = `${selectId}-listbox`;
    const errorId = `${selectId}-error`;

    const [open, setOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const selectedOption = options.find((option) => option.value === value);

    // Клик вне компонента закрывает панель. Клики по самим опциям остаются
    // "внутри" containerRef, поэтому выбор мышью не обрывается раньше времени.
    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setOpen(false);
        }
      }
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // При открытии подсветка встаёт на текущее значение, а не остаётся от
    // прошлого открытия.
    useEffect(() => {
      if (open) {
        const idx = options.findIndex((option) => option.value === value);
        setHighlightedIndex(idx >= 0 ? idx : 0);
      }
    }, [open, options, value]);

    useEffect(() => {
      if (!open) return;
      const activeItem = listRef.current?.children[highlightedIndex] as HTMLElement | undefined;
      activeItem?.scrollIntoView({ block: 'nearest' });
    }, [open, highlightedIndex]);

    function moveHighlight(direction: 1 | -1) {
      setHighlightedIndex((current) => {
        let next = current;
        for (let step = 0; step < options.length; step += 1) {
          next = (next + direction + options.length) % options.length;
          if (!options[next]?.disabled) break;
        }
        return next;
      });
    }

    function commitHighlighted() {
      const option = options[highlightedIndex];
      if (option && !option.disabled) {
        onChange(option.value);
      }
      setOpen(false);
      buttonRef.current?.focus();
    }

    function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          open ? moveHighlight(1) : setOpen(true);
          break;
        case 'ArrowUp':
          event.preventDefault();
          open ? moveHighlight(-1) : setOpen(true);
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          open ? commitHighlighted() : setOpen(true);
          break;
        case 'Escape':
          if (open) {
            event.preventDefault();
            setOpen(false);
          }
          break;
        case 'Home':
          if (open) {
            event.preventDefault();
            const idx = options.findIndex((option) => !option.disabled);
            if (idx >= 0) setHighlightedIndex(idx);
          }
          break;
        case 'End':
          if (open) {
            event.preventDefault();
            for (let i = options.length - 1; i >= 0; i -= 1) {
              if (!options[i]?.disabled) {
                setHighlightedIndex(i);
                break;
              }
            }
          }
          break;
        default:
          break;
      }
    }

    return (
      <div className="flex flex-col gap-1.5" ref={containerRef}>
        <label id={labelId} className={hideLabel ? 'sr-only' : 'text-sm font-medium text-ink'}>
          {label}
        </label>

        <div className="relative">
          <button
            type="button"
            ref={(el) => {
              buttonRef.current = el;
              if (typeof forwardedRef === 'function') forwardedRef(el);
              else if (forwardedRef) {
                (forwardedRef as MutableRefObject<HTMLButtonElement | null>).current = el;
              }
            }}
            id={selectId}
            disabled={disabled}
            // aria-haspopup="listbox"
            // aria-expanded={open}
            // aria-controls={listboxId}
            // aria-labelledby={labelId}
            // aria-invalid={Boolean(error)}
            // aria-describedby={error ? errorId : undefined}
            onClick={() => setOpen((prev) => !prev)}
            onKeyDown={handleKeyDown}
            onBlur={onBlur}
            className={`flex w-full items-center justify-between gap-2 rounded-md border bg-white px-3 py-2 text-left text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50 ${
              error ? 'border-accent' : 'border-line'
            } ${className}`}
          >
            <span className={selectedOption ? '' : 'text-muted'}>
              {selectedOption?.label ?? 'Выберите значение'}
            </span>
            <motion.svg
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.15 }}
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              className="shrink-0 text-muted"
            >
              <path
                d="M4 6l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.svg>
          </button>

          <AnimatePresence>
            {open && (
              <motion.ul
                ref={listRef}
                role="listbox"
                id={listboxId}
                aria-labelledby={labelId}
                tabIndex={-1}
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.14, ease: 'easeOut' }}
                className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-line bg-white p-1 shadow-panel"
              >
                {options.map((option, index) => {
                  const isSelected = option.value === value;
                  const isHighlighted = index === highlightedIndex;
                  return (
                    <motion.li
                      key={option.value}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={option.disabled}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.1, delay: index * 0.015 }}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      onClick={() => {
                        if (option.disabled) return;
                        onChange(option.value);
                        setOpen(false);
                        buttonRef.current?.focus();
                      }}
                      className={`flex items-center rounded-sm px-2.5 py-1.5 text-sm transition-colors ${
                        option.disabled
                          ? 'cursor-not-allowed text-muted/60'
                          : `cursor-pointer ${isHighlighted ? 'bg-accent-soft text-accent-hover' : 'text-ink hover:bg-canvas'}`
                      } ${isSelected && !isHighlighted ? 'font-medium' : ''}`}
                    >
                      {option.label}
                    </motion.li>
                  );
                })}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        {error && (
          <p id={errorId} className="text-xs text-accent">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';
