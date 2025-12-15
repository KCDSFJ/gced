import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import Papa from "papaparse";
import axios from "axios";
import * as cheerio from "cheerio";
import { z } from "zod";
import { csvRowSchema, type ProcessingResult, type CsvRow } from "@shared/schema";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Fetch price from website using vendor style code
  async function fetchPriceFromWebsite(vendorCode: string): Promise<number | null> {
    try {
      const url = `https://backup.gabrielny.com/product/${vendorCode}`;
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // Try to find the price using the span#currencyAmount selector
      const priceText = $('#currencyAmount').first().text().trim();
      
      if (priceText) {
        // Remove any non-numeric characters except decimal point
        const cleanPrice = priceText.replace(/[^0-9.]/g, '');
        const price = parseFloat(cleanPrice);
        
        if (!isNaN(price) && price > 0) {
          return price;
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to fetch price for ${vendorCode}:`, error);
      return null;
    }
  }

  // POST /api/process - Main processing endpoint
  app.post('/api/process', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const lowestPricePercentage = parseFloat(req.body.lowestPricePercentage);
      const currentPricePercentage = parseFloat(req.body.currentPricePercentage);

      if (isNaN(lowestPricePercentage) || isNaN(currentPricePercentage)) {
        return res.status(400).json({ error: 'Invalid percentage values' });
      }

      // Parse CSV file
      const csvText = req.file.buffer.toString('utf-8');
      const parseResult = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
      });

      if (parseResult.errors.length > 0) {
        return res.status(400).json({ error: 'Failed to parse CSV file' });
      }

      const rows = parseResult.data as any[];
      const results: ProcessingResult[] = [];

      // Process each row
      for (const row of rows) {
        try {
          // Validate row structure
          const validatedRow = csvRowSchema.parse(row) as CsvRow;
          
          // Fetch price from website
          const fetchedPrice = await fetchPriceFromWebsite(validatedRow.itVendStyleCode);
          
          if (fetchedPrice !== null) {
            // Calculate derived prices
            const calculatedLowestPrice = fetchedPrice * (lowestPricePercentage / 100);
            const calculatedCurrentPrice = fetchedPrice * (currentPricePercentage / 100);
            
            results.push({
              row: validatedRow,
              status: 'success',
              fetchedPrice,
              calculatedLowestPrice,
              calculatedCurrentPrice,
              errorMessage: null,
            });
          } else {
            results.push({
              row: validatedRow,
              status: 'failed',
              fetchedPrice: null,
              calculatedLowestPrice: null,
              calculatedCurrentPrice: null,
              errorMessage: 'Failed to fetch price from website',
            });
          }
        } catch (error) {
          // If row validation fails or any other error
          results.push({
            row: row as CsvRow,
            status: 'failed',
            fetchedPrice: null,
            calculatedLowestPrice: null,
            calculatedCurrentPrice: null,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      const successCount = results.filter(r => r.status === 'success').length;
      const failedCount = results.filter(r => r.status === 'failed').length;

      res.json({
        results,
        successCount,
        failedCount,
      });
    } catch (error) {
      console.error('Processing error:', error);
      res.status(500).json({ error: 'Failed to process CSV file' });
    }
  });

  // POST /api/download/successful - Generate CSV for successful items
  app.post('/api/download/successful', async (req, res) => {
    try {
      const { results } = req.body;
      
      if (!Array.isArray(results)) {
        return res.status(400).json({ error: 'Invalid request body' });
      }

      // Build CSV rows with only the specified columns
      const csvRows = results.map((result: ProcessingResult) => {
        return {
          itKey: result.row.itKey,
          itVendorId: result.row.itVendorId,
          itVendStyleCode: result.row.itVendStyleCode,
          itRetailPrice: result.fetchedPrice?.toFixed(2) || result.row.itRetailPrice,
          itLowestPrice: result.calculatedLowestPrice?.toFixed(2) || result.row.itLowestPrice,
          itCurrentPrice: result.calculatedCurrentPrice?.toFixed(2) || result.row.itCurrentPrice,
        };
      });

      // Convert to CSV
      const csv = Papa.unparse(csvRows);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="successful_updates.csv"');
      res.send(csv);
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ error: 'Failed to generate CSV file' });
    }
  });

  // POST /api/download/failed - Generate CSV for items needing review
  app.post('/api/download/failed', async (req, res) => {
    try {
      const { results } = req.body;
      
      if (!Array.isArray(results)) {
        return res.status(400).json({ error: 'Invalid request body' });
      }

      // Build CSV rows with only the specified columns plus error message
      const csvRows = results.map((result: ProcessingResult) => {
        return {
          itKey: result.row.itKey,
          itVendorId: result.row.itVendorId,
          itVendStyleCode: result.row.itVendStyleCode,
          itRetailPrice: result.row.itRetailPrice,
          itLowestPrice: result.row.itLowestPrice,
          itCurrentPrice: result.row.itCurrentPrice,
          errorMessage: result.errorMessage || 'Failed to fetch price',
        };
      });

      // Convert to CSV
      const csv = Papa.unparse(csvRows);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="manual_review_required.csv"');
      res.send(csv);
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ error: 'Failed to generate CSV file' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
