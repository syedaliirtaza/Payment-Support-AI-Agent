"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { appButtonClassName } from "@/lib/button-styles";
import { buildTicketInput } from "@/lib/ticket-utils";
import type { Ticket, TicketPriority } from "@/types/ticket";
import { cn } from "@/lib/utils";

type FormState = {
  title: string;
  message: string;
  customerEmail: string;
  priority: TicketPriority;
};

const emptyForm: FormState = {
  title: "",
  message: "",
  customerEmail: "",
  priority: "medium",
};

type AddTicketDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTicketAdded: (ticket: Ticket) => void;
};

export function AddTicketDialog({
  open,
  onOpenChange,
  onTicketAdded,
}: AddTicketDialogProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetForm() {
    setForm(emptyForm);
    setError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.title.trim() || !form.message.trim() || !form.customerEmail.trim()) {
      setError("Title, message, and customer email are required.");
      return;
    }

    const input = buildTicketInput(form);
    setIsSubmitting(true);

    try {
      onTicketAdded({
        id: input.id,
        title: input.title,
        message: input.message,
        customerEmail: input.customerEmail,
        priority: input.priority,
        createdAt: input.createdAt,
        status: "pending",
      });
      handleOpenChange(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to add ticket.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add new ticket</DialogTitle>
          <DialogDescription>
            Add a ticket to your queue, then select it and assign to the AI agent.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder="Payment failed for order #48291"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={form.message}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, message: event.target.value }))
              }
              placeholder="Describe the customer's issue…"
              rows={4}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="customerEmail">Customer email</Label>
            <Input
              id="customerEmail"
              type="email"
              value={form.customerEmail}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  customerEmail: event.target.value,
                }))
              }
              placeholder="customer@example.com"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={form.priority}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  priority: value as TicketPriority,
                }))
              }
              disabled={isSubmitting}
            >
              <SelectTrigger id="priority" className="w-full">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <DialogFooter className="px-0 pb-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className={cn(appButtonClassName)}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Adding…
                </>
              ) : (
                "Add ticket"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
