export type EmployeeJourneyType = 'probation' | 'contract' | 'offboarding';

export type EmployeeJourneyStage = {
  id: string;
  title: string;
  description: string;
  ownerRole: string;
  dueOffsetDays: number;
  required: boolean;
  employeeVisible: boolean;
};

export type EmployeeJourneyTemplate = {
  id: string;
  name: string;
  description: string;
  journeyType: EmployeeJourneyType;
  isActive: boolean;
  stages: EmployeeJourneyStage[];
};

export type EmployeeJourneyConfiguration = {
  version: 1;
  templates: EmployeeJourneyTemplate[];
};

export type JourneyConfigurationGap = {
  id: string;
  templateId: string;
  severity: 'critical' | 'warning';
  message: string;
};

export const EMPLOYEE_JOURNEY_CONFIGURATION_KEY = 'employeeJourneyConfiguration' as const;

export const defaultEmployeeJourneyConfiguration: EmployeeJourneyConfiguration = {
  version: 1,
  templates: [
    {
      id: 'probation-standard',
      name: 'Standard probation journey',
      description: 'A structured review journey from goal setting through the final employment decision.',
      journeyType: 'probation',
      isActive: true,
      stages: [
        { id: 'probation-goals', title: 'Set probation goals', description: 'Manager and employee agree measurable outcomes for the probation period.', ownerRole: 'Line manager', dueOffsetDays: 7, required: true, employeeVisible: true },
        { id: 'probation-check-in', title: 'Midpoint check-in', description: 'Review progress, feedback, support needs, and any risks.', ownerRole: 'Line manager', dueOffsetDays: 45, required: true, employeeVisible: true },
        { id: 'probation-decision', title: 'Final probation decision', description: 'Record the outcome and communicate the decision before the probation end date.', ownerRole: 'People Operations', dueOffsetDays: 83, required: true, employeeVisible: false },
      ],
    },
    {
      id: 'contract-renewal-standard',
      name: 'Contract renewal journey',
      description: 'A controlled review and approval path before a fixed-term contract expires.',
      journeyType: 'contract',
      isActive: true,
      stages: [
        { id: 'contract-review', title: 'Review contract and performance', description: 'Confirm business need, performance, tenure, and renewal eligibility.', ownerRole: 'Line manager', dueOffsetDays: -60, required: true, employeeVisible: false },
        { id: 'contract-decision', title: 'Approve renewal decision', description: 'Record renewal, conversion, or end-of-contract approval.', ownerRole: 'People Operations', dueOffsetDays: -30, required: true, employeeVisible: false },
        { id: 'contract-signature', title: 'Issue and sign documents', description: 'Prepare the approved contract and capture employee acceptance.', ownerRole: 'People Operations', dueOffsetDays: -14, required: true, employeeVisible: true },
      ],
    },
    {
      id: 'offboarding-standard',
      name: 'Standard offboarding journey',
      description: 'The default checklist applied when HR creates a new employee exit case.',
      journeyType: 'offboarding',
      isActive: true,
      stages: [
        { id: 'notice-confirmed', title: 'Notice confirmed', description: 'Employee notice received and exit date confirmed.', ownerRole: 'People Operations', dueOffsetDays: -14, required: true, employeeVisible: true },
        { id: 'knowledge-transfer', title: 'Knowledge transfer', description: 'Handover plan created and key knowledge shared.', ownerRole: 'Line manager', dueOffsetDays: -3, required: true, employeeVisible: true },
        { id: 'equipment-return', title: 'Equipment return', description: 'All company equipment collected and verified.', ownerRole: 'IT Operations', dueOffsetDays: 0, required: true, employeeVisible: true },
        { id: 'access-revocation', title: 'Access revocation', description: 'System and application access reviewed and revoked.', ownerRole: 'IT Security', dueOffsetDays: 0, required: true, employeeVisible: false },
        { id: 'final-payroll', title: 'Final payroll', description: 'Final pay, leave, and benefits processed.', ownerRole: 'Payroll', dueOffsetDays: 0, required: true, employeeVisible: false },
      ],
    },
  ],
};

export function parseEmployeeJourneyConfiguration(value: unknown): EmployeeJourneyConfiguration {
  if (typeof value !== 'string' || !value.trim()) return structuredClone(defaultEmployeeJourneyConfiguration);
  try {
    const parsed = JSON.parse(value) as Partial<EmployeeJourneyConfiguration>;
    if (!Array.isArray(parsed.templates)) return structuredClone(defaultEmployeeJourneyConfiguration);
    return { version: 1, templates: parsed.templates as EmployeeJourneyTemplate[] };
  } catch {
    return structuredClone(defaultEmployeeJourneyConfiguration);
  }
}

export function getJourneyConfigurationGaps(configuration: EmployeeJourneyConfiguration): JourneyConfigurationGap[] {
  const gaps = configuration.templates.flatMap(template => {
    const gaps: JourneyConfigurationGap[] = [];
    if (!template.stages.length) gaps.push({ id: `${template.id}-empty`, templateId: template.id, severity: 'critical', message: 'Add at least one journey stage.' });
    if (!template.stages.some(stage => stage.required)) gaps.push({ id: `${template.id}-required`, templateId: template.id, severity: 'warning', message: 'Mark at least one stage as required.' });
    if (!template.stages.some(stage => stage.employeeVisible)) gaps.push({ id: `${template.id}-visibility`, templateId: template.id, severity: 'warning', message: 'Employees cannot see any stage in this journey.' });
    template.stages.forEach(stage => {
      if (!stage.title.trim()) gaps.push({ id: `${template.id}-${stage.id}-title`, templateId: template.id, severity: 'critical', message: 'A stage is missing its title.' });
      if (!stage.ownerRole.trim()) gaps.push({ id: `${template.id}-${stage.id}-owner`, templateId: template.id, severity: 'critical', message: `${stage.title || 'A stage'} has no owner.` });
    });
    return gaps;
  });
  (['probation', 'contract', 'offboarding'] as const).forEach(journeyType => {
    const templates = configuration.templates.filter(template => template.journeyType === journeyType);
    const activeTemplates = templates.filter(template => template.isActive);
    if (templates.length && activeTemplates.length === 0) gaps.push({ id: `${journeyType}-inactive`, templateId: templates[0].id, severity: 'critical', message: `Activate one ${journeyType} journey template.` });
    if (activeTemplates.length > 1) gaps.push({ id: `${journeyType}-multiple-active`, templateId: activeTemplates[0].id, severity: 'warning', message: `More than one ${journeyType} template is active; the first one will be used.` });
  });
  return gaps;
}

export function getActiveJourneyTemplate(configuration: EmployeeJourneyConfiguration, journeyType: EmployeeJourneyType) {
  return configuration.templates.find(template => template.journeyType === journeyType && template.isActive)
    ?? defaultEmployeeJourneyConfiguration.templates.find(template => template.journeyType === journeyType)!;
}

export function buildOffboardingChecklist(
  configuration: EmployeeJourneyConfiguration,
  lastWorkingDate: string,
) {
  const template = getActiveJourneyTemplate(configuration, 'offboarding');
  const anchor = new Date(`${lastWorkingDate}T12:00:00`);
  return template.stages.map(stage => {
    const dueDate = new Date(anchor);
    dueDate.setDate(dueDate.getDate() + stage.dueOffsetDays);
    return {
      id: stage.id,
      title: stage.title,
      description: stage.description,
      status: 'pending',
      dueDate: dueDate.toISOString().slice(0, 10),
      owner: stage.ownerRole,
      required: stage.required,
      employeeVisible: stage.employeeVisible,
    };
  });
}
