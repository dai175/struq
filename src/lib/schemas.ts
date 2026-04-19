import { z } from "zod";
import { SECTION_TYPES } from "@/i18n/types";

const maxDateString = /^\d{4}-\d{2}-\d{2}$/;

const optionalTrimmedString = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform((value) => value || undefined);

const optionalMusicKey = z
  .string()
  .trim()
  .max(32)
  .optional()
  .transform((value) => value || undefined);

const optionalHttpUrl = z
  .string()
  .trim()
  .url()
  .refine((value) => value.startsWith("http://") || value.startsWith("https://"), {
    message: "Invalid URL",
  })
  .optional();

export const listInputSchema = z.object({
  offset: z.number().int().min(0).optional(),
  query: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((value) => value || undefined),
});

export const songIdInputSchema = z.object({
  songId: z.string().uuid(),
});

export const songBaseInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  artist: optionalTrimmedString,
  bpm: z.number().int().positive().max(400).optional(),
  key: optionalMusicKey,
  referenceUrl: optionalHttpUrl,
});

export const createSongInputSchema = songBaseInputSchema;

export const updateSongInputSchema = songBaseInputSchema.extend({
  id: z.string().uuid(),
});

export const deleteByIdInputSchema = z.object({
  id: z.string().uuid(),
});

export const generateSectionsInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  artist: z.string().trim().max(200),
  key: optionalMusicKey,
});

export const aiSectionSchema = z.object({
  type: z.string(),
  bars: z.number().int().positive(),
  extra_beats: z.number().int().min(0).max(7).optional(),
  chord_progression: z.string().nullable().optional(),
});

export const aiSectionsSchema = z.array(aiSectionSchema).min(1).max(50);

export const sectionTypeSchema = z.enum(SECTION_TYPES);

const sectionItemSchema = z.object({
  type: sectionTypeSchema,
  label: z.string().max(100).nullable().optional(),
  bars: z.number().int().positive(),
  extraBeats: z.number().int().min(0).max(7),
  chordProgression: z.string().max(255).nullable().optional(),
  memo: z.string().max(1000).nullable().optional(),
  sortOrder: z.number().int().min(0),
});

export const saveSongWithSectionsInputSchema = z.object({
  song: updateSongInputSchema,
  sections: z.array(sectionItemSchema).max(200),
});

export const setlistIdInputSchema = z.object({
  setlistId: z.string().uuid(),
});

export const listSongsForPickerInputSchema = z.object({
  setlistId: z.string().uuid(),
  query: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((value) => value || undefined),
});

export const setlistBaseInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((value) => value || undefined),
  sessionDate: z.string().regex(maxDateString).optional(),
  venue: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((value) => value || undefined),
});

export const createSetlistInputSchema = setlistBaseInputSchema;

export const updateSetlistInputSchema = setlistBaseInputSchema.extend({
  id: z.string().uuid(),
});

export const setlistSongPairInputSchema = z.object({
  setlistId: z.string().uuid(),
  songId: z.string().uuid(),
});

export const reorderSetlistSongsInputSchema = z.object({
  setlistId: z.string().uuid(),
  songIds: z.array(z.string().uuid()).max(500),
});
