"use client";

import { Field, SelectInput, TextInput } from "@/components/ui/field";
import {
  DASHBOARD_DATE_PRESETS,
  DASHBOARD_PRESET_LABELS,
  type DashboardDatePreset,
} from "@/types/dashboard";

interface DateRangeFilterProps {
  preset: DashboardDatePreset;
  dateFrom: string;
  dateTo: string;
  onPresetChange: (preset: DashboardDatePreset) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
}

export function DateRangeFilter({
  preset,
  dateFrom,
  dateTo,
  onPresetChange,
  onDateFromChange,
  onDateToChange,
}: DateRangeFilterProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <Field label="Date range" htmlFor="dashboard-preset">
        <SelectInput
          id="dashboard-preset"
          value={preset}
          onChange={(event) => onPresetChange(event.target.value as DashboardDatePreset)}
        >
          {DASHBOARD_DATE_PRESETS.map((item) => (
            <option key={item} value={item}>
              {DASHBOARD_PRESET_LABELS[item]}
            </option>
          ))}
        </SelectInput>
      </Field>
      {preset === "custom" ? (
        <>
          <Field label="From" htmlFor="dashboard-from" required>
            <TextInput
              id="dashboard-from"
              type="date"
              value={dateFrom}
              onChange={(event) => onDateFromChange(event.target.value)}
              required
            />
          </Field>
          <Field label="To" htmlFor="dashboard-to" required>
            <TextInput
              id="dashboard-to"
              type="date"
              value={dateTo}
              onChange={(event) => onDateToChange(event.target.value)}
              required
            />
          </Field>
        </>
      ) : null}
    </div>
  );
}
