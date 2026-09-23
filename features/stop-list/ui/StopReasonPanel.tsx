'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Button } from '@/shared/ui/Button';
import { Select } from '@/shared/ui/Select';
import { STOP_REASONS, STOP_REASON_LABELS, type MenuItem, type StopItemPayload } from '@/types/menu';
import { formValuesToPayload, stopItemFormSchema, type StopItemFormValues } from '../model/schema';
import { datetimeLocalValueToIso, isoToDatetimeLocalValue, roundUpToStep, toDatetimeLocalValue } from '../model/datetime';

interface StopReasonPanelProps {
  item: MenuItem;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: StopItemPayload) => void;
}

const REASON_OPTIONS = [
  { value: '', label: 'Выберите причину', disabled: true },
  ...STOP_REASONS.map((reason) => ({ value: reason, label: STOP_REASON_LABELS[reason] })),
];

function buildDefaultValues(item: MenuItem): StopItemFormValues {
  if (item.status.kind === 'stopped') {
    return {
      reason: item.status.reason,
      untilMode: item.status.until === null ? 'shift' : 'custom',
      untilValue: item.status.until ? isoToDatetimeLocalValue(item.status.until) : null,
    };
  }
  return { reason: '', untilMode: 'shift', untilValue: null };
}

export function StopReasonPanel({ item, isSubmitting, onClose, onSubmit }: StopReasonPanelProps) {
  const isEditMode = item.status.kind === 'stopped';
  const panelRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLButtonElement | null>(null);

  const now = useMemo(() => new Date(), []);
  const minDatetime = useMemo(() => toDatetimeLocalValue(new Date(now.getTime() + 60_000)), [now]);
  const maxDatetime = useMemo(
    () => toDatetimeLocalValue(new Date(now.getTime() + 24 * 60 * 60_000)),
    [now],
  );
  const defaultCustomValue = useMemo(() => toDatetimeLocalValue(roundUpToStep(now)), [now]);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<StopItemFormValues>({
    resolver: zodResolver(stopItemFormSchema),
    defaultValues: buildDefaultValues(item),
    mode: 'onBlur',
  });

  const untilMode = watch('untilMode');
  const untilValue = watch('untilValue');

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  // Радио "Указать время" сразу подставляет реальное значение в поле формы —
  // иначе на экране был бы показан дефолт, а по факту в форме лежал бы null
  // (пользователь мог бы отправить "до конца смены", хотя видел конкретное время).
  useEffect(() => {
    if (untilMode === 'custom' && !untilValue) {
      setValue('untilValue', defaultCustomValue, { shouldValidate: false });
    }
    if (untilMode === 'shift') {
      setValue('untilValue', null, { shouldValidate: false });
    }
  }, [untilMode, untilValue, defaultCustomValue, setValue]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const submit = handleSubmit((values) => {
    const payload = formValuesToPayload(values);
    onSubmit({
      reason: payload.reason as StopItemPayload['reason'],
      until: payload.until ? datetimeLocalValueToIso(payload.until) : null,
    });
  });

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-ink/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stop-panel-title"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col gap-5 bg-white p-6 shadow-panel"
      >
        <div>
          <h2 id="stop-panel-title" className="text-lg font-semibold text-ink">
            {isEditMode ? 'Изменить стоп-лист' : 'Поставить в стоп-лист'}
          </h2>
          <p className="mt-0.5 text-sm text-muted">{item.title}</p>
        </div>

        <form onSubmit={submit} className="flex flex-1 flex-col gap-5" noValidate>
          <Controller
            control={control}
            name="reason"
            render={({ field }) => (
              <Select
                ref={(el) => {
                  field.ref(el);
                  firstFieldRef.current = el;
                }}
                label="Причина стопа"
                options={REASON_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.reason?.message}
              />
            )}
          />

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-ink">Срок стопа</legend>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="radio" value="shift" {...register('untilMode')} className="accent-accent" />
              До конца смены
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="radio" value="custom" {...register('untilMode')} className="accent-accent" />
              Указать время
            </label>

            {untilMode === 'custom' && (
              <Controller
                control={control}
                name="untilValue"
                render={({ field }) => (
                  <input
                    type="datetime-local"
                    step={900}
                    min={minDatetime}
                    max={maxDatetime}
                    value={field.value ?? defaultCustomValue}
                    onChange={(e) => field.onChange(e.target.value)}
                    onBlur={field.onBlur}
                    aria-invalid={Boolean(errors.untilValue)}
                    aria-describedby={errors.untilValue ? 'until-value-error' : undefined}
                    className={`mt-1 rounded-md border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 ${
                      errors.untilValue ? 'border-accent' : 'border-line'
                    }`}
                  />
                )}
              />
            )}
            {errors.untilValue && (
              <p id="until-value-error" className="text-xs text-accent">
                {errors.untilValue.message}
              </p>
            )}
          </fieldset>

          <div className="mt-auto flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Отмена
            </Button>
            <Button type="submit" isLoading={isSubmitting} loadingText="Сохраняем…">
              {isEditMode ? 'Сохранить' : 'В стоп-лист'}
            </Button>
          </div>
        </form>
      </motion.div>
    </>
  );
}
