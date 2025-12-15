# CSV Price Updater

## Overview

CSV Price Updater is a utility-focused web application for automated pricing management. It allows users to upload POS (Point of Sale) CSV files containing product information and automatically fetches retail prices from external websites. The application calculates updated lowest and current prices based on user-defined percentage adjustments, then exports the updated data back to CSV format.

The application serves jewelry/retail businesses that need to keep their pricing synchronized with manufacturer or distributor pricing from websites like backup.gabrielny.com.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **React** with TypeScript for the UI layer
- **Vite** as the build tool and development server
- **Wouter** for lightweight client-side routing
- **TanStack Query** (React Query) for server state management and API calls
- **Tailwind CSS** with shadcn/ui component library for styling

**Design Decisions:**
- Single-page application with minimal routing (Home page and 404)
- Material Design / Linear-inspired design system prioritizing clarity and efficiency
- Component-based architecture using shadcn/ui for consistent, accessible UI components
- Form state managed through React Hook Form with Zod validation
- File uploads handled through native browser APIs with drag-and-drop support

**Key Design Principle:** Information clarity and workflow efficiency over visual decoration, with clear status feedback at every processing step.

### Backend Architecture

**Technology Stack:**
- **Express.js** server with TypeScript
- **Node.js** runtime with ES modules
- **Multer** for handling multipart/form-data file uploads
- **Papa Parse** for CSV parsing and generation
- **Axios** for HTTP requests to external pricing sources
- **Cheerio** for HTML parsing and web scraping

**Architecture Pattern:**
- Stateless request/response model - no session storage required
- Single `/api/process` endpoint for CSV processing workflow
- In-memory CSV processing without persistent storage
- Synchronous price fetching per product row

**Processing Flow:**
1. Accept CSV file upload via multipart form data
2. Parse CSV using Papa Parse with schema validation
3. Extract vendor style codes from each row
4. Fetch prices from backup.gabrielny.com using web scraping (Cheerio targets `#currencyAmount` element)
5. Calculate new lowest/current prices using percentage adjustments
6. Return processed results with success/failure status per row
7. Client generates downloadable CSV from results

**Rationale:** Stateless architecture chosen for simplicity since this is a batch processing tool without user accounts or session persistence requirements. All data processing happens in-memory during request lifecycle.

### Data Schema

**CSV Row Structure (Zod Schema):**
- Product identification: `itKey`, `itVendorId`, `itVendStyleCode`
- Product details: `itDesc`, `catName`, metal properties, size, style
- Pricing fields: `itRetailPrice`, `itLowestPrice`, `itCurrentPrice`
- Manufacturer info: `itMfg`, serial numbers, barcodes
- Web metadata: `imTitle`, `imDescription`, `imMetaKeywords`, SEO tags
- 28 total fields representing complete product record

**Processing Result Schema:**
- Original CSV row data
- Processing status: `pending`, `success`, or `failed`
- Fetched price from website (nullable)
- Calculated lowest and current prices
- Error message for failed rows

**Configuration:**
- `lowestPricePercentage`: Discount percentage for lowest price calculation
- `currentPricePercentage`: Markup percentage for current price calculation

### External Dependencies

**Third-Party Services:**
- **backup.gabrielny.com** - Primary price data source
  - Accessed via web scraping (no API available)
  - Product URLs follow pattern: `/product/{vendorStyleCode}`
  - Prices extracted from `#currencyAmount` DOM element
  - Timeout: 10 seconds per request
  - User-Agent spoofing to avoid blocking

**Database:**
- **Drizzle ORM** configured with PostgreSQL dialect
- **Neon Database** (@neondatabase/serverless) as the database provider
- Connection via `DATABASE_URL` environment variable
- Schema location: `./shared/schema.ts`
- Migrations output: `./migrations`

**Note:** Database is configured but appears unused in current implementation. The application operates statelessly without data persistence. Database may be intended for future features like job history, user accounts, or caching scraped prices.

**Development Dependencies:**
- **ESBuild** for production server bundling
- **TSX** for TypeScript execution in development
- Replit-specific plugins for development environment integration

**UI Component Library:**
- shadcn/ui (Radix UI primitives) - Extensive component library including tables, forms, dialogs, toasts
- Configured with "new-york" style variant
- Custom Tailwind theme with neutral base colors
- Material Design-inspired elevation and spacing system