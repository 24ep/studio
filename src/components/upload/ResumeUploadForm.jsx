"use client";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { UploadCloud, FileText, XCircle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from "react-hot-toast";
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const ACCEPTED_FILE_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const resumeUploadSchema = z.object({
    resume: z
        .custom()
        .refine((files) => files && files.length === 1, 'Exactly one resume file is required.')
        .refine((files) => { var _a; return !!files && ((_a = files[0]) === null || _a === void 0 ? void 0 : _a.size) <= MAX_FILE_SIZE; }, `File size should be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB.`)
        .refine((files) => !!files && files[0] && ACCEPTED_FILE_TYPES.includes(files[0].type), '.pdf, .doc, .docx files are accepted.'),
});
export function ResumeUploadForm({ candidateId, onUploadSuccess, currentResumePath, cardMode = true }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const form = useForm({
        resolver: zodResolver(resumeUploadSchema),
        defaultValues: {
            resume: undefined,
        },
    });
    useEffect(() => {
        setSelectedFile(null);
        form.reset({ resume: undefined });
    }, [form, candidateId]);
    const onSubmit = async (data) => {
        var _a;
        if (!candidateId || !((_a = data.resume) === null || _a === void 0 ? void 0 : _a[0])) {
            toast.error("Candidate ID and resume file are required.");
            return;
        }
        // console.log("ResumeUploadForm: Submitting form data:", data); // Added for debugging auto-save
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('resume', data.resume[0]);
        try {
            const response = await fetch(`/api/resumes/upload?candidateId=${candidateId}`, {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || `Failed to upload resume. Status: ${response.status}`);
            }
            let toastDescription = `Resume uploaded successfully.`;
            if (result.n8nResponse) {
                if (result.n8nResponse.success) {
                    toastDescription += ` n8n processing status: ${result.n8nResponse.message || 'Initiated'}.`;
                    if (result.n8nResponse.data)
                        console.log("n8n data:", result.n8nResponse.data);
                }
                else {
                    toastDescription += ` n8n notification failed: ${result.n8nResponse.error || 'Unknown n8n error'}`;
                }
            }
            toast.success(toastDescription);
            if (onUploadSuccess && result.candidate) {
                onUploadSuccess(result.candidate, result.n8nResponse);
            }
            form.reset();
            setSelectedFile(null);
            const fileInput = document.getElementById(`resume-upload-${candidateId}`);
            if (fileInput)
                fileInput.value = '';
        }
        catch (error) {
            console.error("Error uploading resume:", error);
            toast.error(error.message);
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const handleFileChange = (event) => {
        var _a;
        const file = (_a = event.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (file) {
            setSelectedFile(file);
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            form.setValue('resume', dataTransfer.files, { shouldValidate: true });
        }
        else {
            setSelectedFile(null);
            form.setValue('resume', new DataTransfer().files, { shouldValidate: true });
        }
    };
    const removeFile = () => {
        setSelectedFile(null);
        form.setValue('resume', new DataTransfer().files, { shouldValidate: true });
        const fileInput = document.getElementById(`resume-upload-${candidateId}`);
        if (fileInput)
            fileInput.value = '';
    };
    const formContent = (<Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={cardMode ? "" : "space-y-6"}>
        <CardContent className={cardMode ? "space-y-6" : "space-y-6 p-0"}>
          <FormField control={form.control} name="resume" render={({ fieldState }) => (<FormItem>
                <FormLabel htmlFor={`resume-upload-${candidateId}`} className={cardMode ? "text-base" : ""}>
                  Resume File {currentResumePath && <span className="text-xs text-muted-foreground">(Current: {currentResumePath.split('-').pop()})</span>}
                </FormLabel>
                <FormControl>
                   <div className="mt-2 flex justify-center rounded-lg border border-dashed border-input px-6 py-10 hover:border-primary transition-colors">
                      <div className="text-center">
                        <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden="true"/>
                        <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
                          <Label htmlFor={`resume-upload-${candidateId}`} className="relative cursor-pointer rounded-md bg-background font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:text-primary/80">
                            <span>Select file</span>
                            <Input id={`resume-upload-${candidateId}`} type="file" className="sr-only" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleFileChange}/>
                          </Label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs leading-5 text-muted-foreground">PDF, DOC, DOCX up to {MAX_FILE_SIZE / (1024 * 1024)}MB</p>
                      </div>
                    </div>
                </FormControl>
                <FormMessage />
              </FormItem>)}/>
          {selectedFile && (<div>
              <h4 className="text-sm font-medium text-foreground mb-2">Selected file:</h4>
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="h-4 w-4 text-primary shrink-0"/>
                  <span className="truncate">{selectedFile.name}</span> 
                  <span className="text-xs text-muted-foreground whitespace-nowrap">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={removeFile}>
                  <XCircle className="h-4 w-4 text-destructive"/>
                  <span className="sr-only">Remove file</span>
                </Button>
              </div>
            </div>)}
        </CardContent>
        {cardMode && (<CardFooter>
            <Button type="submit" className="w-full btn-primary-gradient" disabled={isSubmitting || !selectedFile}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4"/>}
              {isSubmitting ? "Uploading..." : "Upload Resume"}
            </Button>
          </CardFooter>)}
        {!cardMode && (<Button type="submit" className="w-full btn-primary-gradient" disabled={isSubmitting || !selectedFile}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4"/>}
                {isSubmitting ? "Uploading..." : "Upload Selected Resume"}
            </Button>)}
      </form>
    </Form>);
    if (cardMode) {
        return (<Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <UploadCloud className="mr-2 h-6 w-6 text-primary"/> Upload Resume {candidateId && <span className="text-base text-muted-foreground ml-2">for Candidate ID: {candidateId.substring(0, 8)}...</span>}
          </CardTitle>
          <CardDescription>
            Upload a resume in PDF, DOC, or DOCX format. Results from n8n processing will be shown if configured.
          </CardDescription>
        </CardHeader>
        {formContent}
      </Card>);
    }
    return formContent;
}
