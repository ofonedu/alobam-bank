
// src/app/admin/settings/email-templates/page.tsx
"use client";

import * as React from "react";
import { useState, useEffect, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Loader2, AlertTriangle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAllEmailTemplatesAction, updateEmailTemplateAction } from "@/lib/actions/admin-settings-actions";
import type { EmailTemplate } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Timestamp } from "firebase/firestore";

const formatDateDisplay = (dateInput: Date | Timestamp | undefined): string => {
    if (!dateInput) return "N/A";
    let date: Date;
    if ((dateInput as Timestamp)?.toDate && typeof (dateInput as Timestamp).toDate === 'function') {
      date = (dateInput as Timestamp).toDate();
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      try {
        const parsed = new Date(dateInput as string | number);
        if (!isNaN(parsed.getTime())) {
          date = parsed;
        } else {
          return "Invalid Date";
        }
      } catch {
        return "Invalid Date";
      }
    }
    return date.toLocaleString();
  };

export default function EmailTemplatesPage() {
  const { toast } = useToast();
  
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [formErrorEdit, setFormErrorEdit] = useState<string | null>(null);

  async function fetchTemplates() {
    setIsLoadingTemplates(true);
    setFetchError(null);
    try {
      const result = await getAllEmailTemplatesAction();
      if (result.success && result.templates) {
         setTemplates(result.templates.map(template => ({
            ...template,
            lastUpdatedAt: (template.lastUpdatedAt as Timestamp)?.toDate ? (template.lastUpdatedAt as Timestamp).toDate() : new Date(template.lastUpdatedAt as Date | string | number)
        })));
      } else {
        setFetchError(result.error || "Failed to load email templates.");
      }
    } catch (error: any) {
      setFetchError(error.message || "An unexpected error occurred.");
    } finally {
      setIsLoadingTemplates(false);
    }
  }

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleEditClick = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setEditSubject(template.subjectTemplate);
    setEditBody(template.bodyTemplate);
    setFormErrorEdit(null);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingTemplate) return;

    setIsSubmittingEdit(true);
    setFormErrorEdit(null);
    
    const result = await updateEmailTemplateAction(editingTemplate.id, editSubject, editBody);

    if (result.success) {
      toast({ title: "Success", description: result.message });
      setIsEditModalOpen(false);
      setEditingTemplate(null);
      await fetchTemplates(); 
    } else {
      setFormErrorEdit(result.error || "An unknown error occurred.");
      toast({ title: "Error", description: result.message || "Failed to update template.", variant: "destructive" });
    }
    setIsSubmittingEdit(false);
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Email Templates</h1>
        <p className="text-muted-foreground">Customize the content of emails sent by the system.</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Email Templates</CardTitle>
          <CardDescription>Select a template to view and edit its content.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTemplates && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Loading email templates...</p>
            </div>
          )}
          {fetchError && !isLoadingTemplates && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Loading Templates</AlertTitle>
              <AlertDescription>{fetchError}</AlertDescription>
            </Alert>
          )}
          {!isLoadingTemplates && !fetchError && templates.length === 0 && (
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>No Email Templates Found</AlertTitle>
                <AlertDescription>
                  There are no email templates configured in the database yet. 
                  You might need to manually add initial templates (e.g., WELCOME_EMAIL, TRANSFER_SUCCESS) 
                  to the 'emailTemplates' collection in Firestore.
                </AlertDescription>
            </Alert>
          )}
          {!isLoadingTemplates && !fetchError && templates.length > 0 && (
            <div className="space-y-4">
              {templates.map((template) => (
                <Card key={template.id} className="bg-muted/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{template.templateName}</CardTitle>
                      <Button variant="outline" size="sm" onClick={() => handleEditClick(template)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </Button>
                    </div>
                    <CardDescription className="pt-1">{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <p><strong>Subject Preview:</strong> {template.subjectTemplate.substring(0, 100)}{template.subjectTemplate.length > 100 ? '...' : ''}</p>
                    <div className="mt-2">
                      <p className="font-medium text-muted-foreground">Available Placeholders:</p>
                      {Array.isArray(template.placeholders) && template.placeholders.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {template.placeholders.map(p => <code key={p} className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">{`{{${p}}}`}</code>)}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No placeholders defined for this template.</p>
                      )}
                    </div>
                     <p className="text-xs text-muted-foreground mt-2">Last Updated: {formatDateDisplay(template.lastUpdatedAt)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Template: {editingTemplate?.templateName}</DialogTitle>
            <DialogDescription>
              {"Update the subject and body. Use placeholders like "}<code>{'{{variableName}}'}</code>{". Available for this template: "}
              {(editingTemplate?.placeholders && Array.isArray(editingTemplate.placeholders)) ? editingTemplate.placeholders.map(p => `{{${p}}}`).join(', ') : 'None defined'}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(80vh-200px)]">
            <form id="editEmailTemplateForm" onSubmit={handleEditSubmit} className="space-y-4 py-4 px-1">
              {formErrorEdit && (
                  <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Update Error</AlertTitle>
                      <AlertDescription>{formErrorEdit}</AlertDescription>
                  </Alert>
              )}
              <div>
                <Label htmlFor="editSubject">Subject Template</Label>
                <Input
                  id="editSubject"
                  name="subject" 
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="editBody">Body Template (HTML or Plain Text)</Label>
                <Textarea
                  id="editBody"
                  name="body"
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={15} 
                  required
                  className="mt-1 font-mono text-xs"
                />
              </div>
            </form>
          </ScrollArea>
          <DialogFooter className="pt-4 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmittingEdit}>Cancel</Button>
            </DialogClose>
            <Button 
              type="submit"
              form="editEmailTemplateForm"
              disabled={isSubmittingEdit}
            >
              {isSubmittingEdit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
