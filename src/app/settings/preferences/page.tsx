import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const UI_DISPLAY_PREFERENCES = [
  { value: 'Standard', label: 'Standard' },
  { value: 'Emphasized', label: 'Emphasized' },
  { value: 'Hidden', label: 'Hidden' },
];

// Static candidate attribute config (from webhook-mapping)
const CANDIDATE_ATTRIBUTES = [
  { key: 'candidate_info.cv_language', label: 'CV Language' },
  { key: 'candidate_info.personal_info.title_honorific', label: 'Personal - Title' },
  { key: 'candidate_info.personal_info.firstname', label: 'Personal - First Name' },
  { key: 'candidate_info.personal_info.lastname', label: 'Personal - Last Name' },
  { key: 'candidate_info.personal_info.nickname', label: 'Personal - Nickname' },
  { key: 'candidate_info.personal_info.location', label: 'Personal - Location' },
  { key: 'candidate_info.personal_info.introduction_aboutme', label: 'Personal - About Me' },
  { key: 'candidate_info.contact_info.email', label: 'Contact - Email' },
  { key: 'candidate_info.contact_info.phone', label: 'Contact - Phone' },
  { key: 'candidate_info.education', label: 'Education' },
  { key: 'candidate_info.experience', label: 'Experience' },
  { key: 'candidate_info.skills', label: 'Skills' },
  { key: 'candidate_info.job_suitable', label: 'Job Suitability' },
  { key: 'jobs', label: 'Job Matches' },
  { key: 'job_applied.job_id', label: 'Applied Job - ID' },
  { key: 'job_applied.job_title', label: 'Applied Job - Title' },
  { key: 'job_applied.fit_score', label: 'Applied Job - Fit Score' },
  { key: 'job_applied.justification', label: 'Applied Job - Justification' },
  { key: 'targetPositionId', label: 'Target Position ID (Hint)' },
  { key: 'targetPositionTitle', label: 'Target Position Title (Hint)' },
  { key: 'targetPositionDescription', label: 'Target Position Description (Hint)' },
  { key: 'targetPositionLevel', label: 'Target Position Level (Hint)' },
];

// Basic static config for position attributes
const POSITION_ATTRIBUTES = [
  { key: 'title', label: 'Title' },
  { key: 'department', label: 'Department' },
  { key: 'description', label: 'Description' },
  { key: 'isOpen', label: 'Is Open' },
  { key: 'position_level', label: 'Position Level' },
];

export default function PreferencesPage() {
  const [candidatePrefs, setCandidatePrefs] = useState<Record<string, string>>({});
  const [positionPrefs, setPositionPrefs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchPrefs() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/settings/preferences');
        if (!res.ok) throw new Error('Failed to load preferences');
        const data = await res.json();
        setCandidatePrefs(
          Object.fromEntries(
            CANDIDATE_ATTRIBUTES.map(attr => [
              attr.key,
              data.candidateAttributes?.[attr.key]?.uiPreference || 'Standard',
            ])
          )
        );
        setPositionPrefs(
          Object.fromEntries(
            POSITION_ATTRIBUTES.map(attr => [
              attr.key,
              data.positionAttributes?.[attr.key]?.uiPreference || 'Standard',
            ])
          )
        );
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPrefs();
  }, []);

  const handleCandidatePrefChange = (key: string, value: string) => {
    setCandidatePrefs(p => ({ ...p, [key]: value }));
  };
  const handlePositionPrefChange = (key: string, value: string) => {
    setPositionPrefs(p => ({ ...p, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const payload = {
        candidateAttributes: Object.fromEntries(
          Object.entries(candidatePrefs).map(([key, uiPreference]) => [key, { uiPreference }])
        ),
        positionAttributes: Object.fromEntries(
          Object.entries(positionPrefs).map(([key, uiPreference]) => [key, { uiPreference }])
        ),
      };
      const res = await fetch('/api/settings/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save preferences');
      setSuccess(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
      setTimeout(() => setSuccess(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>User Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSave();
            }}
            className="space-y-8"
          >
            <div>
              <h3 className="font-semibold mb-2">Candidate Attributes</h3>
              <div className="space-y-3">
                {CANDIDATE_ATTRIBUTES.map(attr => (
                  <div key={attr.key} className="flex items-center justify-between gap-4">
                    <span>{attr.label}</span>
                    <Select
                      value={candidatePrefs[attr.key]}
                      onValueChange={val => handleCandidatePrefChange(attr.key, val)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UI_DISPLAY_PREFERENCES.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Position Attributes</h3>
              <div className="space-y-3">
                {POSITION_ATTRIBUTES.map(attr => (
                  <div key={attr.key} className="flex items-center justify-between gap-4">
                    <span>{attr.label}</span>
                    <Select
                      value={positionPrefs[attr.key]}
                      onValueChange={val => handlePositionPrefChange(attr.key, val)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UI_DISPLAY_PREFERENCES.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            {success && <div className="text-green-600 text-sm">Preferences saved!</div>}
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 