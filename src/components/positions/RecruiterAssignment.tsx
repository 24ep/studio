import React from 'react';
import type { Candidate, UserProfile } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface RecruiterAssignmentProps {
  candidates: Candidate[];
  recruiters: { id: string; name: string }[];
  onAssign: (candidateId: string, recruiterId: string | null) => void;
}

const RecruiterAssignment: React.FC<RecruiterAssignmentProps> = ({ candidates, recruiters, onAssign }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recruiter Assignment</CardTitle>
      </CardHeader>
      <CardContent>
        {candidates.map(candidate => (
          <div key={candidate.id} style={{ marginBottom: 12 }}>
            <span>{candidate.name}:</span>
            <select
              value={candidate.recruiterId || ''}
              onChange={e => onAssign(candidate.id, e.target.value || null)}
            >
              <option value="">Unassigned</option>
              {recruiters.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default RecruiterAssignment; 