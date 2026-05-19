import { z } from "zod";

export const createAssessmentSchema = z.object({
  math_score: z.number().min(0).max(100, "Math value must not exceed 100"),
  physics_score: z.number().min(0).max(100, "Physics value must not exceed 100"),
  chemistry_score: z
    .number()
    .min(0)
    .max(100, "Chemistry value must not exceed 100"),
  biology_score: z.number().min(0).max(100, "Biology value must not exceed 100"),
  history_score: z.number().min(0).max(100, "History value must not exceed 100"),
  english_score: z.number().min(0).max(100, "English value must not exceed 100"),
  geography_score: z
    .number()
    .min(0)
    .max(100, "Geography grade must not exceed 100"),
  weekly_self_study_hours: z
    .number()
    .min(0)
    .max(168, "Irrational study time (maximum 168 hours/week)"),
  absence_days: z.number().min(0).max(365, "Maximum absence days: 365 days"),
  part_time_job: z.boolean({
    required_error: "Part-time status is required (true/false)",
  }),
  extracurricular: z.boolean({
    required_error: "Extracurricular status is required (true/false)",
  }),
});

export const predictRecommendationSchema = z.object({
  assessment_id: z
    .string()
    .uuid("The assessment_id format must be a valid UUID"),
});
