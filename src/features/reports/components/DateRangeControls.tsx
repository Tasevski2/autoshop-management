import { useTranslation } from "react-i18next";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DatePreset } from "../types";
import { daysBetween, formatDate } from "../utils";

interface Props {
  dateFrom: string;
  dateTo: string;
  activePreset: DatePreset | null;
  onPresetChange: (preset: DatePreset) => void;
  onCustomRange: (from: string, to: string) => void;
}

const presets: DatePreset[] = [
  "today",
  "thisWeek",
  "thisMonth",
  "thisYear",
  "allTime",
];

export default function DateRangeControls({
  dateFrom,
  dateTo,
  activePreset,
  onPresetChange,
  onCustomRange,
}: Props) {
  const { t } = useTranslation();

  const days = daysBetween(dateFrom, dateTo);

  const presetLabels: Record<DatePreset, string> = {
    today: t("reports.dateRange.today"),
    thisWeek: t("reports.dateRange.thisWeek"),
    thisMonth: t("reports.dateRange.thisMonth"),
    thisYear: t("reports.dateRange.thisYear"),
    allTime: t("reports.dateRange.allTime"),
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* Presets */}
        <div className="flex flex-wrap gap-1">
          {presets.map((p) => (
            <Button
              key={p}
              variant={activePreset === p ? "default" : "outline"}
              size="sm"
              onClick={() => onPresetChange(p)}
            >
              {presetLabels[p]}
            </Button>
          ))}
        </div>

        {/* Custom range */}
        <div className="flex items-center gap-1.5 sm:ml-auto">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => onCustomRange(e.target.value, dateTo)}
            className="w-36 h-8 text-sm"
          />
          <span className="text-muted-foreground text-sm">–</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => onCustomRange(dateFrom, e.target.value)}
            className="w-36 h-8 text-sm"
          />
        </div>
      </div>

      {/* Period label */}
      <p className="text-sm text-muted-foreground">
        {formatDate(dateFrom)} — {formatDate(dateTo)} ({days}{" "}
        {t("reports.dateRange.days")})
      </p>
    </div>
  );
}
