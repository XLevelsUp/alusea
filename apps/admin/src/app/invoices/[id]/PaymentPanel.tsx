"use client";

import { useState } from "react";
import { XIcon } from "lucide-react";
import { SelectField, TextField } from "@/components/form-fields";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelectOption } from "@/components/ui/native-select";
import { useConfirm } from "@/components/ConfirmProvider";
import { useActionRunner } from "@/hooks/use-action";
import type { Action } from "@/lib/actions";
import { formatPaise } from "@/lib/erp/money";

export type PaymentRow = {
  id: string;
  paidOn: string;
  amountPaise: number;
  method: string;
  reference: string;
};

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  bank_transfer: "Bank transfer",
  upi: "UPI",
  cheque: "Cheque",
  card: "Card",
  other: "Other",
};

export default function PaymentPanel({
  invoiceId,
  payments,
  balancePaise,
  canWrite,
  isIssued,
  record,
  remove,
}: {
  invoiceId: string;
  payments: PaymentRow[];
  balancePaise: number;
  canWrite: boolean;
  isIssued: boolean;
  record: Action;
  remove: Action;
}) {
  const { run, isPending, error, setError } = useActionRunner();
  const confirm = useConfirm();
  const [isAdding, setIsAdding] = useState(false);

  function submit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    run(record, new FormData(e.currentTarget)).then((result) => {
      if (result.ok) setIsAdding(false);
    });
  }

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="p-5 border-b">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-matte-black">Payments</CardTitle>
        <CardDescription className="text-xs">
          {balancePaise > 0 ? `${formatPaise(balancePaise)} still outstanding` : "Fully paid"}
        </CardDescription>
        {canWrite && isIssued && balancePaise > 0 && !isAdding && (
          <CardAction>
            <Button type="button" size="lg" variant="outline" onClick={() => setIsAdding(true)}>
              + Record Payment
            </Button>
          </CardAction>
        )}
      </CardHeader>

      {isAdding && (
        <form onSubmit={submit} className="p-5 bg-muted border-b space-y-4">
          <input type="hidden" name="invoice_id" value={invoiceId} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField
              label="Amount"
              name="amount"
              required
              inputMode="decimal"
              placeholder={(balancePaise / 100).toFixed(2)}
              className="*:data-[slot=input]:bg-white"
            />
            <TextField
              label="Date"
              name="paid_on"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="*:data-[slot=input]:bg-white"
            />
            <SelectField label="Method" name="method" defaultValue="bank_transfer" className="[&_select]:bg-white">
              {Object.entries(METHOD_LABELS).map(([value, label]) => (
                <NativeSelectOption key={value} value={value}>
                  {label}
                </NativeSelectOption>
              ))}
            </SelectField>
            <TextField label="Reference" name="reference" placeholder="UTR, cheque number…" className="*:data-[slot=input]:bg-white" />
          </div>

          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit" size="lg" disabled={isPending}>
              {isPending ? "Saving…" : "Save Payment"}
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              onClick={() => {
                setIsAdding(false);
                setError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {!isAdding && error && <p role="alert" className="px-5 pt-4 text-sm text-destructive">{error}</p>}

      {payments.length > 0 ? (
        <table className="w-full text-left border-collapse">
          <tbody className="divide-y divide-gray-100">
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td className="p-4 text-sm text-gray-600">
                  {new Date(payment.paidOn).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="p-4 text-sm text-gray-600">
                  {METHOD_LABELS[payment.method] ?? payment.method}
                  {payment.reference && <span className="block text-xs text-gray-400">{payment.reference}</span>}
                </td>
                <td className="p-4 text-sm font-semibold text-right text-gray-900">{formatPaise(payment.amountPaise)}</td>
                <td className="p-4 text-right w-10">
                  {canWrite && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={isPending}
                      aria-label="Remove payment"
                      onClick={async () => {
                        const ok = await confirm({
                          title: `Remove the ${formatPaise(payment.amountPaise)} payment?`,
                          description: "The invoice's outstanding balance goes back up by this amount.",
                          confirmLabel: "Remove payment",
                        });
                        if (!ok) return;
                        const fd = new FormData();
                        fd.set("id", payment.id);
                        fd.set("invoice_id", invoiceId);
                        run(remove, fd);
                      }}
                      className="text-gray-400 hover:text-destructive"
                    >
                      <XIcon />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !isAdding && <p className="p-5 text-sm text-gray-500">No payments recorded yet.</p>
      )}
    </Card>
  );
}
