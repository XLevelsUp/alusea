import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

// Payments are recorded and removed in Finances, as in the reference; the invoice only shows what has been received.
export default function PaymentPanel({
  payments,
  balancePaise,
  canRecord,
}: {
  payments: PaymentRow[];
  balancePaise: number;
  // Owners and developers get a shortcut to where payments are entered.
  canRecord: boolean;
}) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="p-5 border-b">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-matte-black">Payments</CardTitle>
        <CardDescription className="text-xs">
          {balancePaise > 0 ? `${formatPaise(balancePaise)} still outstanding` : "Fully paid"}
        </CardDescription>
        {canRecord && balancePaise > 0 && (
          <CardAction>
            <Button asChild size="lg" variant="outline">
              <Link href="/finances?tab=ledger">Record in Finances</Link>
            </Button>
          </CardAction>
        )}
      </CardHeader>

      {payments.length > 0 ? (
        <table className="w-full text-left border-collapse">
          <tbody className="divide-y divide-gray-100">
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td className="p-4 text-sm text-gray-600">
                  {new Date(payment.paidOn).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </td>
                <td className="p-4 text-sm text-gray-600">
                  {METHOD_LABELS[payment.method] ?? payment.method}
                  {payment.reference && <span className="block text-xs text-gray-500">{payment.reference}</span>}
                </td>
                <td className="p-4 text-sm font-semibold text-right text-gray-900">{formatPaise(payment.amountPaise)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="p-5 text-sm text-gray-500">No payments recorded yet.</p>
      )}
    </Card>
  );
}
