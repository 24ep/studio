"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

import { useChartSetup } from '@/hooks/use-chart-setup';
import type { Applicant, Position } from '@/lib/types';
import type {
    AveragedEvaluationData,
    EvaluationGroupConfig,
    EvaluationInterviewer,
    EvaluationRecord,
} from './types';
import {
    loadApplicantReportRecord,
    loadEvaluationInterviewers,
    loadEvaluationReportData,
    loadPersonalityGroupsConfig,
} from './evaluate-report-section-api';
import {
    canEditEvaluateReportApplicantBasic,
    getEvaluationCompletionSummary,
    getExpandedReportGroupIds,
    groupExpertiseSkills,
    groupPersonalityTraits,
} from './utils';
import { useEvaluateReportAvatarUpload } from './use-evaluate-report-avatar-upload';
import { useEvaluateReportBranding } from './use-evaluate-report-branding';

export function useEvaluateReportSection(applicantId: string) {
    const [applicant, setApplicant] = useState<Applicant | null>(null);
    const [position, setPosition] = useState<Position | null>(null);
    const [averagedEvaluationData, setAveragedEvaluationData] = useState<AveragedEvaluationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['detailed-analysis']));
    const [personalityGroupsConfig, setPersonalityGroupsConfig] = useState<EvaluationGroupConfig[]>([]);
    const [allEvaluations, setAllEvaluations] = useState<EvaluationRecord[]>([]);
    const [interviewers, setInterviewers] = useState<EvaluationInterviewer[]>([]);
    const { data: session } = useSession();
    const { chartReady } = useChartSetup();
    const branding = useEvaluateReportBranding();

    const canEditApplicantBasic = useCallback(() => (
        canEditEvaluateReportApplicantBasic(session?.user)
    ), [session?.user]);
    const {
        avatarInputRef,
        avatarUploading,
        handleAvatarUpload,
    } = useEvaluateReportAvatarUpload({
        applicant,
        canEditApplicantBasic,
        setApplicant,
    });

    const fetchApplicantData = useCallback(async () => {
        try {
            const reportRecord = await loadApplicantReportRecord(applicantId);
            setApplicant(reportRecord.applicant);
            setPosition(reportRecord.position);
        } catch (error) {
            console.error('Error fetching Applicant data:', error);
        }
    }, [applicantId]);

    const fetchEvaluationData = useCallback(async () => {
        try {
            setLoading(true);
            const reportData = await loadEvaluationReportData(applicantId);
            setAveragedEvaluationData(reportData.averagedEvaluationData);
            setAllEvaluations(reportData.allEvaluations);
        } catch (error) {
            console.error('Error fetching evaluation data:', error);
            toast.error('Failed to load evaluation data');
            setAveragedEvaluationData(null);
            setAllEvaluations([]);
        } finally {
            setLoading(false);
        }
    }, [applicantId]);

    const fetchInterviewers = useCallback(async () => {
        try {
            setInterviewers(await loadEvaluationInterviewers(applicantId));
        } catch (error) {
            console.error('Error fetching interviewers:', error);
            setInterviewers([]);
        }
    }, [applicantId]);

    const fetchPersonalityGroupsConfig = useCallback(async () => {
        try {
            setPersonalityGroupsConfig(await loadPersonalityGroupsConfig());
        } catch (error) {
            console.error('Error fetching personality groups config:', error);
        }
    }, []);

    useEffect(() => {
        if (!applicantId) return;

        void fetchApplicantData();
        void fetchEvaluationData();
        void fetchPersonalityGroupsConfig();
        void fetchInterviewers();
    }, [
        applicantId,
        fetchApplicantData,
        fetchEvaluationData,
        fetchInterviewers,
        fetchPersonalityGroupsConfig,
    ]);

    const toggleGroup = useCallback((groupId: string) => {
        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupId)) {
                newSet.delete(groupId);
            } else {
                newSet.add(groupId);
            }
            return newSet;
        });
    }, []);

    const handlePrint = useCallback(() => {
        setExpandedGroups(getExpandedReportGroupIds({
            averagedEvaluationData,
            personalityGroupsConfig,
        }));

        setTimeout(() => {
            window.print();
        }, 100);
    }, [averagedEvaluationData, personalityGroupsConfig]);

    const completionSummary = useMemo(() => getEvaluationCompletionSummary({
        interviewers,
        allEvaluations,
    }), [allEvaluations, interviewers]);

    const personalityGroups = useMemo(() => (
        groupPersonalityTraits(averagedEvaluationData, personalityGroupsConfig)
    ), [averagedEvaluationData, personalityGroupsConfig]);

    const expertiseGroups = useMemo(() => (
        groupExpertiseSkills(averagedEvaluationData, personalityGroupsConfig)
    ), [averagedEvaluationData, personalityGroupsConfig]);

    return {
        applicant,
        position,
        averagedEvaluationData,
        loading,
        ...branding,
        expandedGroups,
        allEvaluations,
        interviewers,
        avatarUploading,
        avatarInputRef,
        chartReady,
        canEditApplicantBasic,
        expertiseGroups,
        handleAvatarUpload,
        handlePrint,
        personalityGroups,
        toggleGroup,
        ...completionSummary,
    };
}
