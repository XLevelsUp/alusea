"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronsUpDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type SearchOption = {
  value: string;
  label: string;
  // Extra text shown smaller beside the label and matched by the search, such as a state or an amount due.
  detail?: string;
};

type Props = {
  label: ReactNode;
  name: string;
  options: SearchOption[];
  // Controlled when value is given; otherwise the field keeps its own choice, starting from defaultValue.
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  // Shown on the closed field when nothing is chosen.
  placeholder?: string;
  // When set, the list starts with this entry, which clears the choice.
  emptyLabel?: string;
  required?: boolean;
  hint?: ReactNode;
  className?: string;
};

// Matches what was typed against the label and detail only, never the hidden id.
function matches(_value: string, search: string, keywords?: string[]): number {
  return (keywords ?? []).join(" ").toLowerCase().includes(search.trim().toLowerCase()) ? 1 : 0;
}

// A dropdown you can type into to narrow a long list; the chosen value is submitted with the form under `name`.
export function SearchSelectField({
  label,
  name,
  options,
  value,
  defaultValue = "",
  onChange,
  placeholder = "Select…",
  emptyLabel,
  required,
  hint,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const selected = options.find((option) => option.value === current);

  // A hidden field changed by script fires no event of its own, so one is sent for any form that reacts to changes.
  const hiddenRef = useRef<HTMLInputElement>(null);
  const announced = useRef(current);
  useEffect(() => {
    if (announced.current === current) return;
    announced.current = current;
    hiddenRef.current?.dispatchEvent(new Event("change", { bubbles: true }));
  }, [current]);

  function choose(next: string) {
    setInner(next);
    onChange?.(next);
    setOpen(false);
  }

  return (
    <Field className={className}>
      <FieldLabel htmlFor={name}>
        {label}
        {required && <span className="text-destructive">*</span>}
      </FieldLabel>
      <input ref={hiddenRef} type="hidden" name={name} value={current} />
      {/* Modal so the list still scrolls when the field sits inside a dialog. */}
      <Popover open={open} onOpenChange={setOpen} modal>
        <PopoverTrigger asChild>
          <Button
            id={name}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-describedby={hint ? `${name}-hint` : undefined}
            className="h-10 w-full justify-between gap-2 bg-muted px-3 text-sm font-normal normal-case tracking-normal"
          >
            <span className={cn("truncate", !selected && "text-muted-foreground")}>
              {selected ? selected.label : (emptyLabel ?? placeholder)}
            </span>
            <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-(--radix-popover-trigger-width) min-w-64 p-0">
          <Command filter={matches}>
            <CommandInput placeholder="Type to search…" />
            <CommandList>
              <CommandEmpty>Nothing matches.</CommandEmpty>
              <CommandGroup>
                {emptyLabel && (
                  <CommandItem value="" keywords={[emptyLabel]} data-checked={current === ""} onSelect={() => choose("")}>
                    <span className="text-muted-foreground">{emptyLabel}</span>
                  </CommandItem>
                )}
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    keywords={[option.label, option.detail ?? ""]}
                    data-checked={option.value === current}
                    onSelect={() => choose(option.value)}
                  >
                    <span className="truncate">{option.label}</span>
                    {option.detail && <span className="shrink-0 text-xs text-muted-foreground">{option.detail}</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {hint && <FieldDescription id={`${name}-hint`}>{hint}</FieldDescription>}
    </Field>
  );
}
