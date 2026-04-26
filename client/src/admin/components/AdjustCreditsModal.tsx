import React, { useEffect, useState } from "react";
import { UseMutationResult } from "@tanstack/react-query";
import { Button, FilterInput, Modal } from "./ui";
import type { AdminAdjustCreditsResponse, AdminUserRow } from "@/lib/api/adminTypes";
import { getAdminErrorMessage } from "../utils/apiError";

const fieldStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  maxWidth: "100%",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--r)",
  padding: "8px 10px",
  color: "var(--text)",
  fontSize: 12,
  fontFamily: "var(--font-body)",
  outline: "none",
  boxSizing: "border-box" as const,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 10,
  fontFamily: "var(--font-mono)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.6px",
  color: "var(--muted)",
  marginBottom: 6,
};

type AdjustMutation = UseMutationResult<
  AdminAdjustCreditsResponse,
  unknown,
  { id: number; amount: number; note?: string }
>;

interface Props {
  user: AdminUserRow | null;
  onClose: () => void;
  mutation: AdjustMutation;
}

const NOTE_MAX = 2000;

export const AdjustCreditsModal: React.FC<Props> = ({ user, onClose, mutation }) => {
  const [amountStr, setAmountStr] = useState("");
  const [note, setNote] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      setAmountStr("");
      setNote("");
      setLocalError(null);
      return;
    }
    setAmountStr("");
    setNote("");
    setLocalError(null);
    mutation.reset();
  }, [user?.id]);

  if (!user) return null;

  const balance = user.credits_balance ?? 0;
  const parsed = parseInt(String(amountStr).replace(/\s/g, ""), 10);
  const amountValid = !Number.isNaN(parsed) && parsed !== 0;
  const overdraw =
    amountValid &&
    parsed < 0 &&
    Math.abs(parsed) > balance;

  const handleApply = async () => {
    setLocalError(null);
    if (!amountValid) {
      setLocalError("Enter a non-zero whole number (positive to add, negative to deduct).");
      return;
    }
    if (overdraw) {
      setLocalError(
        `Cannot deduct ${Math.abs(parsed).toLocaleString()} credits: only ${balance.toLocaleString()} available.`
      );
      return;
    }
    if (note.length > NOTE_MAX) {
      setLocalError(`Note must be at most ${NOTE_MAX} characters.`);
      return;
    }
    setSubmitting(true);
    try {
      const noteClean = note.trim() === "" ? undefined : note.trim();
      await mutation.mutateAsync({ id: user.id, amount: parsed, note: noteClean });
      onClose();
    } catch (e) {
      setLocalError(getAdminErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const serverErr =
    mutation.isError && mutation.error != null
      ? getAdminErrorMessage(mutation.error)
      : null;
  const showErr = localError || serverErr;

  return (
    <Modal
      open
      title="Adjust credits"
      subtitle={`${user.name} · ${user.email} · current balance: ${balance.toLocaleString()}`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => void handleApply()}
            disabled={submitting}
          >
            {submitting ? "Applying…" : "Apply"}
          </Button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
          <strong>Amount:</strong> positive adds credits, negative deducts. Must be a non-zero integer. The API
          returns 402 if a deduction would exceed the wallet (e.g. race with another admin action).
        </p>
        <div>
          <label style={labelStyle} htmlFor="admin-adjust-amount">
            Amount (credits)
          </label>
          <FilterInput
            id="admin-adjust-amount"
            type="text"
            inputMode="numeric"
            placeholder="e.g. 100 or -25"
            value={amountStr}
            onChange={(e) => {
              setLocalError(null);
              if (mutation.isError) mutation.reset();
              setAmountStr(e.target.value);
            }}
            style={{ width: "100%" }}
            autoComplete="off"
          />
          {overdraw && (
            <p style={{ color: "var(--red)", fontSize: 11, margin: "6px 0 0" }}>
              Deduction exceeds current balance. Reduce the amount or add credits first.
            </p>
          )}
        </div>
        <div>
          <label style={labelStyle} htmlFor="admin-adjust-note">
            Note (optional, audit trail)
          </label>
          <textarea
            id="admin-adjust-note"
            value={note}
            maxLength={NOTE_MAX}
            onChange={(e) => {
              setLocalError(null);
              setNote(e.target.value);
            }}
            placeholder="e.g. Goodwill credit, billing correction…"
            rows={3}
            style={{ ...fieldStyle, resize: "vertical" as const, minHeight: 72 }}
          />
          <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4, fontFamily: "var(--font-mono)" }}>
            {note.length} / {NOTE_MAX}
          </div>
        </div>
        {showErr && (
          <div
            style={{
              padding: "10px 12px",
              borderRadius: "var(--r)",
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.25)",
              color: "var(--red)",
              fontSize: 12,
            }}
          >
            {showErr}
          </div>
        )}
      </div>
    </Modal>
  );
};
