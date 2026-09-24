"use client";

import type { ComponentProps, ReactNode } from "react";
import { CancelButton } from "@/components/FormDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// Shared admin form building blocks on top of components/ui, so every form labels, hints and marks required fields the same way.

type FieldShellProps = {
  label: ReactNode;
  name: string;
  required?: boolean;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
};

function FieldShell({ label, name, required, hint, className, children }: FieldShellProps) {
  return (
    <Field className={className}>
      <FieldLabel htmlFor={name}>
        {label}
        {required && <span className="text-destructive">*</span>}
      </FieldLabel>
      {children}
      {hint && <FieldDescription id={`${name}-hint`}>{hint}</FieldDescription>}
    </Field>
  );
}

type TextFieldProps = Omit<ComponentProps<typeof Input>, "name" | "defaultValue"> & {
  label: ReactNode;
  name: string;
  hint?: ReactNode;
  defaultValue?: string | number | null;
};

export function TextField({ label, name, hint, required, defaultValue, className, ...props }: TextFieldProps) {
  return (
    <FieldShell label={label} name={name} required={required} hint={hint} className={className}>
      <Input
        id={name}
        name={name}
        required={required}
        defaultValue={props.value === undefined ? (defaultValue ?? "") : undefined}
        aria-describedby={hint ? `${name}-hint` : undefined}
        {...props}
      />
    </FieldShell>
  );
}

type TextareaFieldProps = Omit<ComponentProps<typeof Textarea>, "name" | "defaultValue"> & {
  label: ReactNode;
  name: string;
  hint?: ReactNode;
  defaultValue?: string | null;
};

export function TextareaField({ label, name, hint, required, defaultValue, className, ...props }: TextareaFieldProps) {
  return (
    <FieldShell label={label} name={name} required={required} hint={hint} className={className}>
      <Textarea
        id={name}
        name={name}
        required={required}
        defaultValue={defaultValue ?? ""}
        aria-describedby={hint ? `${name}-hint` : undefined}
        {...props}
      />
    </FieldShell>
  );
}

type SelectFieldProps = Omit<ComponentProps<typeof NativeSelect>, "name"> & {
  label: ReactNode;
  name: string;
  hint?: ReactNode;
};

export function SelectField({ label, name, hint, required, className, children, ...props }: SelectFieldProps) {
  return (
    <FieldShell label={label} name={name} required={required} hint={hint} className={className}>
      <NativeSelect id={name} name={name} required={required} aria-describedby={hint ? `${name}-hint` : undefined} {...props}>
        {children}
      </NativeSelect>
    </FieldShell>
  );
}

// A titled group of fields, separated from what comes before it by a rule.
export function FormSection({ title, className, children }: { title: ReactNode; className?: string; children: ReactNode }) {
  return (
    <FieldSet className={cn("pt-4 border-t", className)}>
      <FieldLegend className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</FieldLegend>
      {children}
    </FieldSet>
  );
}

// A titled card panel for long forms split into separate blocks.
export function FormCard({ title, description, children }: { title: ReactNode; description?: ReactNode; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-matte-black">{title}</CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function FormError({ error, className }: { error: string | null; className?: string }) {
  if (!error) return null;
  return (
    <Alert variant="destructive" className={className}>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}

type FormActionsProps = {
  submitLabel: ReactNode;
  pendingLabel?: ReactNode;
  isPending: boolean;
  cancelUrl?: string;
};

export function FormActions({ submitLabel, pendingLabel = "Saving…", isPending, cancelUrl }: FormActionsProps) {
  return (
    <div className="flex gap-3 pt-2">
      <Button type="submit" disabled={isPending} className="flex-1">
        {isPending ? pendingLabel : submitLabel}
      </Button>
      <CancelButton cancelUrl={cancelUrl} />
    </div>
  );
}
