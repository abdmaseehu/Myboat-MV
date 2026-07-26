import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Ban, AlertCircle } from "lucide-react";

export default function CancellationPolicyDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full border-sky-500 text-sky-500 hover:bg-sky-500/10"
        >
          <Ban className="w-4 h-4 mr-2" />
          Cancellation Policy
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancellation Policy</DialogTitle>
          <DialogDescription>
            Terms and conditions for ticket cancellation
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-sky-500/10">
            <AlertCircle className="w-5 h-5 text-sky-500 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-medium">Before 24 hours</h4>
              <p className="text-sm text-muted-foreground">
                90% refund of ticket fare
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-sky-500/10">
            <AlertCircle className="w-5 h-5 text-sky-500 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-medium">Within 12-24 hours</h4>
              <p className="text-sm text-muted-foreground">
                50% refund of ticket fare
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-sky-500/10">
            <AlertCircle className="w-5 h-5 text-sky-500 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-medium">Less than 12 hours</h4>
              <p className="text-sm text-muted-foreground">
                No refund available
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
