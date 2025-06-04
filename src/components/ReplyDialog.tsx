import React, { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CornerDownRight } from "lucide-react";

interface ReplyDialogProps {
  trigger: React.ReactNode;
  onSubmit: (text: string) => Promise<void>;
  disabled?: boolean;
}

const ReplyDialog: React.FC<ReplyDialogProps> = ({ trigger, onSubmit, disabled }) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!value.trim()) return;
    setIsSending(true);
    await onSubmit(value.trim());
    setIsSending(false);
    setValue("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md w-full">
        <Textarea
          rows={4}
          value={value}
          disabled={isSending || disabled}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Write a reply…"
          className="resize-none"
        />
        <div className="flex justify-end mt-2">
          <Button size="sm" onClick={handleSend} disabled={isSending || !value.trim() || disabled}>
            <CornerDownRight className="h-4 w-4 mr-1" /> {isSending ? "Sending" : "Send"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReplyDialog; 