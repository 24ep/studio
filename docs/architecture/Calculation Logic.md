# HRI Calculation & Aggregation Logic

HRI performs various real-time calculations to provide recruiters with actionable insights. This document outlines the logic behind core metrics and data transformations.

---

## 📊 Dashboard Metrics

The dashboard uses high-performance SQL aggregations to provide a snapshot of the recruitment pipeline.

### 1. Pipeline Distribution
Calculated using conditional counts in a single pass:
```sql
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'new' THEN 1 END) as new,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as inProgress,
    ...
FROM "applicant"
```

### 2. Application Trends
- **Growth Rate**: Comparing `thisMonth` (last 30 days) vs `lastMonth` (30-60 days ago).
- **Recruiter Load**: Active applicants divided by the number of active `Recruiter` roles.

---

## 💰 Financial Data & Salary Logic

### 1. Salary Field Normalization
applicant salaries are stored in two primary ways:
- **`expected_salary`**: A dedicated numeric column for easy filtering and range queries.
- **`suitable_salary_bath_month`**: (Legacy/Parsed) Often a string extracted from resumes, which the system attempts to cast to a number for the `expectedSalary` field.

### 2. Salary Range Matching
When matching applicants to positions, the AI uses the following logic:
- **Hard Upper Bound**: Positions often have a maximum budget.
- **Flexibility Buffer**: The AI may flag a "Strong Match" even if the salary is slightly over budget (usually within 10-15%) if skills are exceptional.

---

## 🎯 Scoring & Fit Calculation

### 1. Fit Score Normalization (`scoreUtils.ts`)
The system ensures that regardless of the input (0.00-1.00 or 0-100), the internal representation is consistent:
- `normalized = Math.min(100, Math.max(0, value * 100))` (if input is decimal)
- The UI then converts these to **Letter Grades** (A-E) as defined in the **Evaluation Flow**.

### 2. Aggregated Expertise
A applicant's `overall_expertise_score` is a weighted average of:
- **Technical Skills**: (70% weight) - Based on `applicantExpertiseScore`.
- **Soft Skills**: (30% weight) - Based on `applicantPersonalityScore`.

---

## 🔍 SLA & Time-to-Hire
- **Days in Stage**: `CURRENT_DATE - stage_entry_date`.
- **Time-to-Hire**: Total days from the `applicationDate` to the date the status changed to `Hired`.
