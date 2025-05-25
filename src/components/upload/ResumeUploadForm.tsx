
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { UploadCloud, FileText, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { Candidate } from '@/lib/types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB (Increased from 5MB per API)
const ACCEPTED_FILE_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

const resumeUploadSchema = z.object({
  resume: z
    .custom<FileList>()
    .refine((files) => files && files.length === 1, 'Exactly one resume file is required.')
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `File size should be less than ${MAX_FILE_SIZE / (1024*1024)}MB.`)
    .refine((files) => files?.[0] && ACCEPTED_FILE_TYPES.includes(files[0].type), '.pdf, .doc, .docx files are accepted.'),
});

type ResumeUploadFormValues = z.infer<typeof resumeUploadSchema>;

interface ResumeUploadFormProps {
  candidateId: string;
  onUploadSuccess?: (updatedCandidate: Candidate) => void;
  currentResumePath?: string | null;
  cardMode?: boolean; // To conditionally render as a Card or just form elements
}

export function ResumeUploadForm({ candidateId, onUploadSuccess, currentResumePath, cardMode = true }: ResumeUploadFormProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ResumeUploadFormValues>({
    resolver: zodResolver(resumeUploadSchema),
    defaultValues: {
      resume: undefined,
    },
  });

  const onSubmit = async (data: ResumeUploadFormValues) => {
    if (!candidateId || !data.resume?.[0]) {
      toast({ title: "Error", description: "Candidate ID and resume file are required.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('resume', data.resume[0]);

    try {
      const response = await fetch(`/api/resumes/upload?candidateId=${candidateId}`, {
        method: 'POST',
        body: formData,
        // Headers are automatically set by browser for FormData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Failed to upload resume. Status: ${response.status}`);
      }

      toast({
        title: "Resume Uploaded",
        description: `Resume for candidate ${candidateId} uploaded successfully.`,
      });
      if (onUploadSuccess && result.candidate) {
        onUploadSuccess(result.candidate);
      }
      form.reset();
      setSelectedFile(null);
    } catch (error) {
      console.error("Error uploading resume:", error);
      toast({
        title: "Upload Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create a FileList to assign to form value
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      form.setValue('resume', dataTransfer.files, { shouldValidate: true });
    } else {
      setSelectedFile(null);
      form.setValue('resume', undefined, { shouldValidate: true });
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    form.setValue('resume', undefined, { shouldValidate: true });
    const fileInput = document.getElementById(`resume-upload-${candidateId}`) as HTMLInputElement;
    if (fileInput) fileInput.value = ''; // Clear the file input
  };

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={cardMode ? "" : "space-y-6"}>
        <CardContent className={cardMode ? "space-y-6" : "space-y-6 p-0"}>
          <FormField
            control={form.control}
            name="resume"
            render={({ fieldState }) => ( 
              <FormItem>
                <FormLabel htmlFor={`resume-upload-${candidateId}`} className={cardMode ? "text-base" : ""}>
                  Resume File {currentResumePath && <span className="text-xs text-muted-foreground">(Current: {currentResumePath.split('-').pop()})</span>}
                </FormLabel>
                <FormControl>
                   <div className="mt-2 flex justify-center rounded-lg border border-dashed border-input px-6 py-10 hover:border-primary transition-colors">
                      <div className="text-center">
                        <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden="true" />
                        <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
                          <Label
                            htmlFor={`resume-upload-${candidateId}`}
                            className="relative cursor-pointer rounded-md bg-background font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:text-primary/80"
                          >
                            <span>Select file</span>
                            <Input 
                              id={`resume-upload-${candidateId}`}
                              type="file" 
                              className="sr-only" 
                              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                              onChange={handleFileChange}
                            />
                          </Label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs leading-5 text-muted-foreground">PDF, DOC, DOCX up to {MAX_FILE_SIZE / (1024*1024)}MB</p>
                      </div>
                    </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {selectedFile && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Selected file:</h4>
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate">{selectedFile.name}</span> 
                  <span className="text-xs text-muted-foreground whitespace-nowrap">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={removeFile}>
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="sr-only">Remove file</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        {cardMode && (
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting || !selectedFile}>
              {isSubmitting ? "Uploading..." : "Upload Resume"}
            </Button>
          </CardFooter>
        )}
        {!cardMode && (
             <Button type="submit" className="w-full" disabled={isSubmitting || !selectedFile}>
                {isSubmitting ? "Uploading..." : "Upload Selected Resume"}
            </Button>
        )}
      </form>
    </Form>
  );

  if (cardMode) {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <UploadCloud className="mr-2 h-6 w-6 text-primary" /> Upload Resume {candidateId && <span className="text-base text-muted-foreground ml-2">for Candidate ID: {candidateId.substring(0,8)}...</span>}
          </CardTitle>
          <CardDescription>
            Upload a resume in PDF, DOC, or DOCX format.
          </CardDescription>
        </CardHeader>
        {formContent}
      </Card>
    );
  }

  return formContent;
}
