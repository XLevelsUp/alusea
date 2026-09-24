import Link from "next/link";
import { SearchXIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// Shown for unknown URLs and whenever a page calls notFound(), e.g. an invoice or employee id that does not exist.
export default function NotFound() {
  return (
    <div className="p-8 max-w-2xl mx-auto w-full">
      <Card>
        <CardHeader>
          <SearchXIcon className="size-8 text-muted-foreground mb-2" aria-hidden="true" />
          <CardTitle className="text-xl font-bold uppercase tracking-tight text-matte-black">Not found</CardTitle>
          <CardDescription>
            This page or record does not exist. It may have been deleted, or the link may be wrong.
          </CardDescription>
        </CardHeader>
        <CardFooter className="gap-3 bg-transparent border-t-0 pt-0">
          <Button asChild>
            <Link href="/">Go to home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
