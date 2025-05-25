
"use client";

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { UploadCloud, FileText, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

const resumeUploadSchema = z.object({
  resumes: z
    .custom<FileList>()
    .refine((files) => files && files.length > 0, 'At least one resume file is required.')
    .refine((files) => Array.from(files).every(file => file.size <= MAX_FILE_SIZE), `Each file size should be less than 5MB.`)
    .refine((files) => Array.from(files).every(file => ACCEPTED_FILE_TYPES.includes(file.type)), '.pdf, .doc, .docx files are accepted.'),
});

type ResumeUploadFormValues = z.infer<typeof resumeUploadSchema>;

export function ResumeUploadForm() {
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const form = useForm<ResumeUploadFormValues>({
    resolver: zodResolver(resumeUploadSchema),
    defaultValues: {
      resumes: undefined,
    },
  });

  const onSubmit = async (data: ResumeUploadFormValues) => {
    console.log('Uploading resumes:', data.resumes);
    // Here you would typically:
    // 1. Loop through data.resumes (which is a FileList)
    // 2. For each file, create FormData and send to your backend/n8n webhook
    // Example:
    // const formData = new FormData();
    // formData.append('resume', file);
    // await fetch('/api/upload-resume-webhook', { method: 'POST', body: formData });

    toast({
      title: "Resumes Submitted (Simulated)",
      description: `${data.resumes.length} resume(s) would be sent for processing. Check console.`,
    });
    form.reset();
    setSelectedFiles([]);
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (fileList) {
      const filesArray = Array.from(fileList);
      setSelectedFiles(filesArray);
      form.setValue('resumes', fileList, { shouldValidate: true });
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
    
    const dataTransfer = new DataTransfer();
    newFiles.forEach(file => dataTransfer.items.add(file));
    form.setValue('resumes', dataTransfer.files.length > 0 ? dataTransfer.files : new FileList(), { shouldValidate: true });

  };


  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <UploadCloud className="mr-2 h-6 w-6 text-primary" /> Upload Resumes
        </CardTitle>
        <CardDescription>
          Upload candidate resumes in PDF, DOC, or DOCX format. Files will be parsed to extract key information.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="resumes"
              render={({ fieldState }) => ( // field is not directly used here due to custom file handling
                <FormItem>
                  <FormLabel htmlFor="resume-upload" className="text-base">Resume Files</FormLabel>
                  <FormControl>
                     <div className="mt-2 flex justify-center rounded-lg border border-dashed border-input px-6 py-10 hover:border-primary transition-colors">
                        <div className="text-center">
                          <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden="true" />
                          <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
                            <Label
                              htmlFor="resume-upload"
                              className="relative cursor-pointer rounded-md bg-background font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:text-primary/80"
                            >
                              <span>Select files</span>
                              <Input 
                                id="resume-upload" 
                                type="file" 
                                className="sr-only" 
                                multiple 
                                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                onChange={handleFileChange}
                              />
                            </Label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs leading-5 text-muted-foreground">PDF, DOC, DOCX up to 5MB each</p>
                        </div>
                      </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {selectedFiles.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Selected files:</h4>
                <ul className="space-y-2 max-h-60 overflow-y-auto rounded-md border p-2">
                  {selectedFiles.map((file, index) => (
                    <li key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <span className="truncate">{file.name}</span> 
                        <span className="text-xs text-muted-foreground whitespace-nowrap">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(index)}>
                        <XCircle className="h-4 w-4 text-destructive" />
                        <span className="sr-only">Remove file</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || selectedFiles.length === 0}>
              {form.formState.isSubmitting ? "Uploading..." : "Upload and Process Resumes"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

