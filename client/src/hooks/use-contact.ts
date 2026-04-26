import { useMutation } from "@tanstack/react-query";
import { insertContactSchema, type InsertContact } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "@/lib/apiConfig";
import { tryDispatchEmailUnverified } from "@/lib/api/emailUnverified";

type ContactResponse = { id?: number };

/**
 * Always calls the real `POST /api/contact` route.
 * With an empty `VITE_API_BASE_URL` (dev default), `getApiUrl` is a same-origin path and Vite’s proxy
 * forwards to the backend — same as other `/api` calls. We do not use the global mock-API switch here.
 */
async function postContact(data: InsertContact): Promise<ContactResponse> {
  const res = await fetch(getApiUrl("/api/contact"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      message: data.message,
    }),
    credentials: "omit",
  });
  const body = (await res.json().catch(() => null)) as
    | { status?: number; message?: string; response?: { id?: number } }
    | null;
  if (res.status === 429) {
    const retry = res.headers.get("Retry-After");
    throw new Error(
      retry
        ? `Too many requests. Try again in about ${retry} seconds.`
        : "Too many requests. Please wait a moment and try again."
    );
  }
  if (!res.ok) {
    tryDispatchEmailUnverified(res.status, body);
    const msg =
      body && typeof body === "object" && "message" in body && typeof body.message === "string"
        ? body.message
        : "Could not send your message.";
    throw new Error(msg);
  }
  if (body && typeof body === "object" && body.status === 201 && body.response) {
    return { id: body.response.id };
  }
  if (body && typeof body === "object" && typeof body.status === "number" && body.status < 300) {
    return (body.response as ContactResponse) ?? {};
  }
  return {};
}

export function useContactForm() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertContact): Promise<ContactResponse> => {
      const validated = insertContactSchema.parse(data);
      return postContact(validated);
    },
    onSuccess: () => {
      toast({
        title: "Message sent",
        description: "We received your message and will get back to you shortly.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
