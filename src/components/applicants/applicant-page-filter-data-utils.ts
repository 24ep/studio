import type { ApplicantSource, RecruitmentStage } from "@/lib/types";

import type {
  ApplicantFilterApiData,
  ApplicantFilterFallbackData,
} from "./applicant-page-filter-types";

function mapApiStageToRecruitmentStage(
  stage: NonNullable<ApplicantFilterApiData["stages"]>[number]
): RecruitmentStage {
  return {
    id: stage.id,
    name: stage.name,
    description: stage.description,
    isSystem: false,
    sortOrder: stage.sort_order,
    createdAt: undefined,
    updatedAt: undefined,
    color_complete: stage.color,
    color_badge: stage.color,
  };
}

function mapApiSourceToApplicantSource(
  source: NonNullable<ApplicantFilterApiData["sources"]>[number]
): ApplicantSource {
  return {
    id: source.id,
    name: source.name,
    description: source.description ?? null,
    email: null,
    logo: source.logo ?? null,
    allowSubSource: false,
    sortOrder: 0,
    isActive: true,
    createdAt: undefined,
    updatedAt: undefined,
  };
}

export function buildEffectiveApplicantFilterData(
  filterData: ApplicantFilterApiData | null | undefined,
  fallbackData: ApplicantFilterFallbackData
) {
  const positions = Array.isArray(filterData?.positions)
    ? filterData.positions
    : (Array.isArray(fallbackData.positions) ? fallbackData.positions : []);

  const stages = Array.isArray(filterData?.stages)
    ? filterData.stages.map(mapApiStageToRecruitmentStage)
    : (Array.isArray(fallbackData.stages) ? fallbackData.stages : []);

  const recruiters = Array.isArray(filterData?.recruiters)
    ? filterData.recruiters
    : (Array.isArray(fallbackData.recruiters) ? fallbackData.recruiters : []);

  const sources = Array.isArray(filterData?.sources)
    ? filterData.sources.map(mapApiSourceToApplicantSource)
    : (Array.isArray(fallbackData.sources) ? fallbackData.sources : []);

  return {
    positions,
    stages,
    recruiters,
    sources,
  };
}
