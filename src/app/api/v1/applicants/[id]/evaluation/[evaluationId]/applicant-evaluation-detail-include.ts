export const APPLICANT_EVALUATION_DETAIL_INCLUDE = {
  evaluator: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  personalityScores: {
    include: {
      trait: {
        include: {
          group: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      },
    },
  },
  expertiseScores: {
    include: {
      skill: {
        include: {
          group: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      },
    },
  },
} as const;
