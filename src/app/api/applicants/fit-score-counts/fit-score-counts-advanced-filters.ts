import {
  appendCondition,
  splitFilterValues,
  type FilterState,
} from './fit-score-counts-filter-state';

export function normalizeFitScoreFilterValue(value: number) {
  return value > 1 ? value / 100 : value;
}

function appendFitScoreFilter(state: FilterState, searchParams: URLSearchParams) {
  const minRaw = searchParams.get('minAppliedJobFitScore');
  const maxRaw = searchParams.get('maxAppliedJobFitScore');
  const includeNoScore = searchParams.get('includeNoScoreInApplied') === 'true';
  if (minRaw === null && maxRaw === null) {
    return;
  }

  const minScore = minRaw ? parseFloat(minRaw) : undefined;
  const maxScore = maxRaw ? parseFloat(maxRaw) : undefined;
  const noScoreCondition = `(c."fitScore" IS NULL OR c."fitScore" = 0)`;
  if (minScore === -1 && maxScore === -1) {
    state.whereClauses.push(noScoreCondition);
    return;
  }

  const regularScoreConditions: string[] = [];
  if (minScore !== undefined && minScore !== -1) {
    regularScoreConditions.push(`c."fitScore" >= $${state.paramIndex++}`);
    state.queryParams.push(normalizeFitScoreFilterValue(minScore));
  }
  if (maxScore !== undefined && maxScore !== -1) {
    regularScoreConditions.push(`c."fitScore" <= $${state.paramIndex++}`);
    state.queryParams.push(normalizeFitScoreFilterValue(maxScore));
  }

  if (includeNoScore) {
    state.whereClauses.push(
      regularScoreConditions.length > 0
        ? `((${regularScoreConditions.join(' AND ')}) OR ${noScoreCondition})`
        : `(${noScoreCondition})`
    );
  } else {
    state.whereClauses.push(...regularScoreConditions);
  }
}

function appendApplicationDateFilters(state: FilterState, searchParams: URLSearchParams) {
  const applicationDateStart = searchParams.get('applicationDateStart');
  const applicationDateEnd = searchParams.get('applicationDateEnd');

  if (applicationDateStart) {
    appendCondition(state, `c."applicationDate" >= $${state.paramIndex++}`, [new Date(applicationDateStart)]);
  }
  if (applicationDateEnd) {
    appendCondition(state, `c."applicationDate" <= $${state.paramIndex++}`, [new Date(applicationDateEnd)]);
  }
}

function appendExperienceFilters(state: FilterState, searchParams: URLSearchParams) {
  const minExperienceYears = searchParams.get('minExperienceYears');
  const maxExperienceYears = searchParams.get('maxExperienceYears');

  if (minExperienceYears !== null) {
    const minExp = parseInt(minExperienceYears, 10);
    if (minExp === -1) {
      state.whereClauses.push(`(c."parsedData"->>'experience' IS NULL OR c."parsedData"->>'experience' = '[]' OR c."parsedData"->>'experience' = '')`);
    } else {
      appendCondition(
        state,
        `(c."parsedData"->>'totalExperienceYears' IS NULL OR CAST(c."parsedData"->>'totalExperienceYears' AS DECIMAL) >= $${state.paramIndex++})`,
        [minExp]
      );
    }
  }

  if (maxExperienceYears !== null) {
    appendCondition(
      state,
      `(c."parsedData"->>'totalExperienceYears' IS NULL OR CAST(c."parsedData"->>'totalExperienceYears' AS DECIMAL) <= $${state.paramIndex++})`,
      [parseInt(maxExperienceYears, 10)]
    );
  }
}

function appendSkillsFilter(state: FilterState, searchParams: URLSearchParams) {
  const skills = splitFilterValues(searchParams.get('skills')).map(skill => skill.toLowerCase());
  if (skills.length === 0) {
    return;
  }

  const skillsConditions = skills.map((_, index) =>
    `LOWER(c."parsedData"->>'skills') LIKE $${state.paramIndex + index}`
  ).join(' AND ');
  appendCondition(
    state,
    `(${skillsConditions})`,
    skills.map(skill => `%${skill}%`),
    state.paramIndex + skills.length
  );
}

function appendLocationFilter(state: FilterState, searchParams: URLSearchParams) {
  const location = searchParams.get('location');
  if (!location) {
    return;
  }

  const locationOperator = searchParams.get('locationOperator') || 'contains';
  if (locationOperator === 'is') {
    appendCondition(state, `c.location = $${state.paramIndex++}`, [location]);
  } else if (locationOperator === 'startsWith') {
    appendCondition(state, `c.location ILIKE $${state.paramIndex++}`, [`${location}%`]);
  } else if (locationOperator === 'endsWith') {
    appendCondition(state, `c.location ILIKE $${state.paramIndex++}`, [`%${location}`]);
  } else {
    appendCondition(state, `c.location ILIKE $${state.paramIndex++}`, [`%${location}%`]);
  }
}

export function appendFitScoreAdvancedFilters(state: FilterState, searchParams: URLSearchParams) {
  appendFitScoreFilter(state, searchParams);
  appendApplicationDateFilters(state, searchParams);
  appendExperienceFilters(state, searchParams);
  appendSkillsFilter(state, searchParams);
  appendLocationFilter(state, searchParams);
}
