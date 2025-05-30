
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { KYCFormSchema, type KYCFormData } from "@/lib/schemas";
import { submitKycAction } from "@/lib/actions";
import { useAuth } from "@/hooks/use-auth";
import { useState, type ChangeEvent } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import type { KYCFormProps } from "@/types";


export function KYCForm({ onSuccess }: KYCFormProps) {
  const { user, fetchUserProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const form = useForm<KYCFormData>({
    resolver: zodResolver(KYCFormSchema),
    defaultValues: {
      fullName: "",
      dateOfBirth: "",
      address: "",
      governmentId: "",
      governmentIdPhoto: undefined,
    },
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewImage(null);
    }
  };

  const onSubmitHandler = async (values: KYCFormData) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to submit KYC.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const result = await submitKycAction(user.uid, values);
      if (result.success) {
        toast({ title: "KYC Submitted", description: result.message });
        form.reset();
        setPreviewImage(null);
        await fetchUserProfile(user.uid); 
        if (onSuccess) onSuccess(result);
      } else {
        // The result.message from submitKycAction now includes more specific error details
        toast({ 
            title: "KYC Submission Failed", 
            description: result.message || "An error occurred. Please check your inputs and try again.", 
            variant: "destructive",
            duration: 10000 // Give more time for potentially longer error messages
        });
        if (result.error && typeof result.error !== 'string') {
          Object.entries(result.error).forEach(([fieldName, errors]) => {
            const field = fieldName as keyof KYCFormData;
            if (Array.isArray(errors)) {
              form.setError(field, { type: "server", message: errors.join(", ") });
            }
          });
        }
      }
    } catch (error) {
      console.error("KYC submission error", error);
      toast({ title: "Error", description: "An unexpected error occurred during KYC submission.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitHandler)} className="space-y-8">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormDescription>As it appears on your government ID.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dateOfBirth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date of Birth</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
               <FormDescription>Format: YYYY-MM-DD.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Address</FormLabel>
              <FormControl>
                <Input placeholder="123 Main St, Anytown, USA" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="governmentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Government ID Number</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Driver's License or Passport No." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="governmentIdPhoto"
          render={({ field: { onChange, onBlur, name, ref } }) => ( 
            <FormItem>
              <FormLabel>Government ID Photo</FormLabel>
              <FormControl>
                <Input 
                  type="file" 
                  accept="image/png, image/jpeg, image/webp" 
                  onChange={(e) => {
                    onChange(e.target.files); 
                    handleFileChange(e); 
                  }}
                  onBlur={onBlur}
                  name={name}
                  ref={ref}
                 />
              </FormControl>
              <FormDescription>Upload a clear photo of your government-issued ID (e.g., Passport, Driver's License). Max 5MB.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {previewImage && (
          <div className="mt-4">
            <FormLabel>Photo Preview</FormLabel>
            <div className="mt-2 aspect-video w-full max-w-md rounded-md border border-dashed border-border p-2">
              <Image src={previewImage} alt="ID Preview" width={400} height={225} className="object-contain w-full h-full" />
            </div>
          </div>
        )}

        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit KYC Information
        </Button>
      </form>
    </Form>
  );
}
