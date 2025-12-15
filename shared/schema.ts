import { z } from "zod";

// CSV Row Schema - represents a single row from the POS CSV file
export const csvRowSchema = z.object({
  itKey: z.string(),
  itVendorId: z.string(),
  itVendStyleCode: z.string(),
  itDesc: z.string(),
  catName: z.string(),
  itMetalColor: z.string(),
  itMetalFinish: z.string(),
  itMetalType: z.string(),
  itMetalWeight: z.string(),
  itSize: z.string(),
  itStyle: z.string(),
  itRetailPrice: z.string(),
  itLowestPrice: z.string(),
  itCurrentPrice: z.string(),
  itMfg: z.string(),
  itLength: z.string(),
  itMillimeter: z.string(),
  itFolioNumber: z.string(),
  itVendBarCode: z.string(),
  itSerialNumber: z.string(),
  imTitle: z.string(),
  imMetaTitle: z.string(),
  imMetaKeywords: z.string(),
  imMetaDescription: z.string(),
  imDescription: z.string(),
  imWebTags: z.string(),
  imBaseSKU: z.string(),
  imCategory: z.string(),
  wlkUrl: z.string(),
});

export type CsvRow = z.infer<typeof csvRowSchema>;

// Processing Configuration Schema
export const processingConfigSchema = z.object({
  lowestPricePercentage: z.number().min(0).max(100),
  currentPricePercentage: z.number().min(0).max(100),
});

export type ProcessingConfig = z.infer<typeof processingConfigSchema>;

// Processing Result for a single row
export const processingResultSchema = z.object({
  row: csvRowSchema,
  status: z.enum(['pending', 'success', 'failed']),
  fetchedPrice: z.number().nullable(),
  calculatedLowestPrice: z.number().nullable(),
  calculatedCurrentPrice: z.number().nullable(),
  errorMessage: z.string().nullable(),
});

export type ProcessingResult = z.infer<typeof processingResultSchema>;

// Batch Processing Response
export const batchProcessingResponseSchema = z.object({
  results: z.array(processingResultSchema),
  successCount: z.number(),
  failedCount: z.number(),
});

export type BatchProcessingResponse = z.infer<typeof batchProcessingResponseSchema>;
