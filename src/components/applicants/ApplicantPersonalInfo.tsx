import React from 'react';
import type { Applicant } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatApplicantNameWithLang } from '@/lib/applicantUtils';

interface ApplicantPersonalInfoProps {
  applicant: Applicant;
}

const ApplicantPersonalInfo: React.FC<ApplicantPersonalInfoProps> = ({ applicant }) => {
  const nameInfo = formatApplicantNameWithLang(applicant);
  
  // Render personal info fields, edit form, etc.
  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Display Applicant personal info here */}
        <div>
          <span className="font-medium">Name: </span>
          <span 
            className={nameInfo.fontClass}
            lang={nameInfo.lang}
          >
            {nameInfo.name}
          </span>
        </div>
        {/* Add more fields as needed */}
      </CardContent>
    </Card>
  );
};

export default ApplicantPersonalInfo; 