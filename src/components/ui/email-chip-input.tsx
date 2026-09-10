'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface EmailChipInputProps {
    value: string[];
    onChange: (emails: string[]) => void;
    placeholder?: string;
    className?: string;
}

export function EmailChipInput({
    value,
    onChange,
    placeholder = 'Add email...',
    className,
}: EmailChipInputProps) {
    const [inputValue, setInputValue] = React.useState('');

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
            e.preventDefault();
            addEmail();
        } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
            removeEmail(value.length - 1);
        }
    };

    const addEmail = () => {
        const email = inputValue.trim().replace(/,$/, '');
        if (email && validateEmail(email) && !value.includes(email)) {
            onChange([...value, email]);
            setInputValue('');
        }
    };

    const removeEmail = (index: number) => {
        const newEmails = [...value];
        newEmails.splice(index, 1);
        onChange(newEmails);
    };

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    return (
        <div
            className={cn(
                'flex flex-wrap items-center gap-2 p-2 border rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
                className
            )}
        >
            {value.map((email, index) => (
                <Badge key={index} variant="secondary" className="pl-2 pr-1 py-1 gap-1">
                    {email}
                    <button
                        type="button"
                        onClick={() => removeEmail(index)}
                        className="rounded-full hover:bg-muted p-0.5 transition-colors"
                    >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove {email}</span>
                    </button>
                </Badge>
            ))}
            <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={addEmail}
                placeholder={value.length === 0 ? placeholder : ''}
                className="flex-1 border-none shadow-none focus-visible:ring-0 min-w-[120px] h-7 p-0 text-sm"
            />
        </div>
    );
}
