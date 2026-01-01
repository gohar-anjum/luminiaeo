import { useMutation } from "@tanstack/react-query";
import { insertContactSchema, type InsertContact, type Contact } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Storage key for contacts
const CONTACTS_STORAGE_KEY = "lumini_contacts";

// Helper functions for localStorage
function getContacts(): Contact[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(CONTACTS_STORAGE_KEY);
  if (!stored) return [];
  const parsed = JSON.parse(stored);
  // Convert date strings back to Date objects
  return parsed.map((c: any) => ({
    ...c,
    createdAt: new Date(c.createdAt),
  }));
}

function saveContact(contact: Contact): Contact {
  if (typeof window === "undefined") return contact;
  const contacts = getContacts();
  contacts.push(contact);
  localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contacts));
  return contact;
}

export function useContactForm() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: InsertContact): Promise<Contact> => {
      // Validate with Zod
      const validated = insertContactSchema.parse(data);
      
      // Create contact object
      const contact: Contact = {
        id: Date.now(), // Use timestamp as ID
        ...validated,
        createdAt: new Date(),
      };
      
      // Save to localStorage
      return saveContact(contact);
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "We've received your message and will get back to you shortly.",
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

