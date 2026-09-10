export interface HiringDetailTabProps {
  userId: string;
}

export interface HiringDetails {
  headcount: {
    id: string;
    type: string;
    status: string;
    employeeId: string;
    position: {
      id: string;
      title: string;
      department: string;
    };
  } | null;
  applicant: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    positionId: string | null;
    recruitmentStage: {
      name: string;
      color_badge: string | null;
    } | null;
    position: {
      title: string;
      department: string;
    } | null;
    applicationDate: string;
  } | null;
  matchCriteria: {
    matchedByEmployeeId: boolean;
    matchedByEmail: boolean;
    matchedByPhone: boolean;
  };
}
