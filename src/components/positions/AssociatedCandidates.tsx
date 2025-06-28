import React from 'react';
import type { Candidate } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface AssociatedCandidatesProps {
  candidates: Candidate[];
}

const AssociatedCandidates: React.FC<AssociatedCandidatesProps> = ({ candidates }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Associated Candidates</CardTitle>
      </CardHeader>
      <CardContent>
        {candidates && candidates.length > 0 ? (
          <ul>
            {candidates.map((candidate, idx) => (
              <li key={candidate.id || idx}>
                {candidate.name} (Fit Score: {candidate.fitScore || 0}%)
              </li>
            ))}
          </ul>
        ) : (
          <div>No candidates associated with this position.</div>
        )}
      </CardContent>
    </Card>
  );
};

export default AssociatedCandidates; 