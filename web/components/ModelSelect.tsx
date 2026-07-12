"use client";

import { useEffect, useMemo, useState } from "react";
import { BASE_MODELS, normalizeModelName } from "@/lib/models";

const CUSTOM_VALUE = "__custom__";

export function ModelSelect({
  value,
  onChange,
  id,
  compact = false,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  compact?: boolean;
}) {
  const [models, setModels] = useState(BASE_MODELS);
  const normalizedValue = normalizeModelName(value);
  const selectedKnown = models.some((model) => model.toLowerCase() === normalizedValue.toLowerCase());
  const [custom, setCustom] = useState(selectedKnown ? "" : normalizedValue);

  useEffect(() => {
    let alive = true;
    fetch("/api/models")
      .then((r) => r.json())
      .then((data) => {
        if (!alive || !Array.isArray(data.models)) return;
        setModels(data.models);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const selectValue = selectedKnown ? normalizedValue : CUSTOM_VALUE;
  const options = useMemo(() => models.filter(Boolean), [models]);

  return (
    <div className="flex flex-col gap-2">
      <select
        id={id}
        value={selectValue}
        onChange={(event) => {
          const next = event.target.value;
          if (next === CUSTOM_VALUE) {
            const fallback = custom || "";
            setCustom(fallback);
            onChange(fallback);
          } else {
            setCustom("");
            onChange(next);
          }
        }}
        className={`lit w-full rounded-(--radius-control) bg-ink/70 px-3 text-sm outline-none ${
          compact ? "py-2" : "py-3"
        }`}
      >
        {options.map((model) => (
          <option key={model} value={model}>
            {model}
          </option>
        ))}
        <option value={CUSTOM_VALUE}>Other model...</option>
      </select>

      {selectValue === CUSTOM_VALUE ? (
        <input
          value={custom}
          onChange={(event) => {
            const next = event.target.value.slice(0, 120);
            setCustom(next);
            onChange(next);
          }}
          placeholder="Type the model name"
          className="lit w-full rounded-(--radius-control) bg-ink/70 px-3 py-3 text-sm outline-none placeholder:text-smoke"
        />
      ) : null}
    </div>
  );
}
