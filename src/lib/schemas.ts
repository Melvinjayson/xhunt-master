import { z } from 'zod';

export const StepSchema = z.object({
  id: z.number().int().positive(),
  type: z.enum(['action', 'reflection', 'discovery']),
  instruction: z.string().min(10).max(600).trim(),
  success_criteria: z.string().min(5).max(400).trim(),
});

export const HuntSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(3).max(120).trim(),
  story_context: z.string().min(20).max(1200).trim(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  estimated_time: z.string().min(1).trim(),
  steps: z.array(StepSchema).min(3).max(7),
  reward: z.string().min(3).max(200).trim(),
  tags: z.array(z.string().min(1)).min(1).max(8),
  createdAt: z.string().optional(),
});

export const HuntsArraySchema = z.array(HuntSchema).min(1);

export type ValidHunt = z.infer<typeof HuntSchema>;
export type ValidStep = z.infer<typeof StepSchema>;

export function validateHunt(raw: unknown): ValidHunt | null {
  const result = HuntSchema.safeParse(raw);
  if (result.success) return result.data;
  return null;
}

export function validateHuntsArray(raw: unknown): ValidHunt[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const h = validateHunt(item);
    return h ? [h] : [];
  });
}
