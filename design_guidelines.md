# CSV Price Updater - Design Guidelines

## Design Approach

**Selected Approach:** Design System - Material Design / Linear-inspired  
**Rationale:** Utility-focused data processing application requiring clarity, efficiency, and excellent table/form handling. Clean, professional aesthetic prioritizing usability over visual flair.

**Core Principles:**
- Information clarity above all
- Efficient workflow with minimal cognitive load
- Clear status feedback at every step
- Professional, trustworthy appearance

---

## Typography

**Font Family:** Inter (Google Fonts)
- Primary: Inter (400, 500, 600)
- Monospace: JetBrains Mono for data/CSV content

**Hierarchy:**
- Page Title: text-2xl font-semibold
- Section Headers: text-lg font-medium
- Body/Labels: text-sm font-medium
- Data Content: text-sm font-normal
- Helper Text: text-xs text-gray-600

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16
- Component padding: p-6
- Card spacing: space-y-6
- Form field gaps: gap-4
- Button spacing: px-4 py-2
- Section margins: mb-8

**Container Structure:**
- Max width: max-w-6xl mx-auto
- Page padding: px-6 py-8
- Single column layout for workflow clarity

---

## Component Library

### File Upload Zone
- Large drop area with dashed border (border-2 border-dashed)
- Upload icon (cloud-upload from Heroicons)
- Clear drag-and-drop instructions
- File name display after upload with remove option
- Preview table showing first 5 rows of CSV data

### Form Inputs (Percentage Controls)
- Two input fields side-by-side on desktop, stacked on mobile
- Label above each input (Lowest Price % / Current Price %)
- Number inputs with % suffix
- Default placeholder values (e.g., "20")
- Input styling: border rounded-md px-4 py-2

### Data Table
- Sticky header row
- Columns: itKey, itVendStyleCode, itRetailPrice (original → updated), itLowestPrice (calculated), itCurrentPrice (calculated), Status
- Status column with colored badges:
  - Success: green background
  - Failed: red background
  - Pending: gray background
- Alternating row backgrounds for readability
- Monospace font for numeric values
- Fixed column widths for alignment

### Progress Indicator
- Linear progress bar showing X of Y items processed
- Percentage text centered
- Appears during fetch/update process
- Individual row status icons (checkmark/warning from Heroicons)

### Action Buttons
- Primary: "Process Updates" (prominent, colored)
- Secondary: "Download Successful Items" / "Download Items for Review" (side-by-side)
- Disabled states during processing
- Icon + text labels (download icon from Heroicons)

### Cards/Sections
- White background with subtle border
- Rounded corners (rounded-lg)
- Consistent padding (p-6)
- Sections: Upload → Configure → Process → Results

---

## User Flow Layout

**Vertical Workflow (Top to Bottom):**

1. **Header Section:** App title + brief description
2. **Upload Section:** File upload zone with preview table
3. **Configuration Section:** Percentage input fields with helper text
4. **Action Section:** Process button (disabled until file uploaded)
5. **Progress Section:** Shows during processing with live updates
6. **Results Section:** Updated data table + download buttons

**Responsive Behavior:**
- Desktop: Full width tables, side-by-side percentage inputs
- Tablet/Mobile: Stack inputs vertically, horizontal scroll for tables

---

## Icons

**Library:** Heroicons (via CDN)
- Upload: cloud-arrow-up
- Success: check-circle
- Error: exclamation-circle  
- Download: arrow-down-tray
- Info: information-circle

---

## Key Interactions

- File upload: Click or drag-and-drop with visual feedback
- Input validation: Real-time percentage validation (0-100)
- Processing state: Disabled form, show progress bar
- Row-level status: Color-coded badges update in real-time
- Download: Automatic file download on button click, separate buttons for each CSV

---

## Accessibility

- Semantic HTML for all form elements
- Proper labels and ARIA attributes for screen readers
- Keyboard navigation for entire workflow
- Clear error messages with actionable guidance
- Focus indicators on all interactive elements
- Sufficient color contrast for status indicators