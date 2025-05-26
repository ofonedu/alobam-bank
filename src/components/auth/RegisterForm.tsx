
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RegisterSchema, type RegisterFormData } from "@/lib/schemas";
import { useState, useEffect } from "react";
import { Loader2, AlertTriangle } from "lucide-react"; // Added AlertTriangle
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getAccountTypesAction } from "@/lib/actions/admin-settings-actions";
import type { AccountType } from "@/types";

interface RegisterFormProps {
  onSubmit: (values: RegisterFormData) => Promise<void>;
}

export function RegisterForm({ onSubmit }: RegisterFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountTypesList, setAccountTypesList] = useState<AccountType[]>([]);
  const [isLoadingAccountTypes, setIsLoadingAccountTypes] = useState(true);
  const [accountTypesError, setAccountTypesError] = useState<string | null>(null);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phoneNumber: "",
      accountType: "", // Will store the ID of the selected account type
      currency: "USD", // Default currency
    },
  });

  useEffect(() => {
    async function fetchAccountTypes() {
      setIsLoadingAccountTypes(true);
      setAccountTypesError(null);
      try {
        const result = await getAccountTypesAction();
        if (result.success && result.accountTypes) {
          setAccountTypesList(result.accountTypes);
        } else {
          setAccountTypesError(result.error || "Failed to load account types.");
        }
      } catch (err: any) {
        setAccountTypesError(err.message || "An unexpected error occurred while fetching account types.");
      } finally {
        setIsLoadingAccountTypes(false);
      }
    }
    fetchAccountTypes();
  }, []);

  const handleSubmit = async (values: RegisterFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      await onSubmit(values);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const noAccountTypesAvailable = !isLoadingAccountTypes && accountTypesList.length === 0 && !accountTypesError;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Registration Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} type="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input placeholder="••••••••" {...field} type="password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="(123) 456-7890" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="accountType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingAccountTypes || accountTypesList.length === 0}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingAccountTypes ? "Loading types..." : "Select account type"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {noAccountTypesAvailable && (
                     <SelectItem value="no-types" disabled>No account types available</SelectItem>
                  )}
                  {accountTypesError && (
                     <SelectItem value="error-loading" disabled>{accountTypesError}</SelectItem>
                  )}
                  {accountTypesList.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {noAccountTypesAvailable && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Account Types Missing</AlertTitle>
            <AlertDescription>
              No account types are currently configured. An administrator needs to add account types in the admin settings before registration can be completed.
            </AlertDescription>
          </Alert>
        )}
        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Currency</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="USD">USD - United States Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  {/* Add more currencies as needed */}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading || isLoadingAccountTypes || noAccountTypesAvailable}>
          {(isLoading || isLoadingAccountTypes) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Account
        </Button>
      </form>
    </Form>
  );
}
