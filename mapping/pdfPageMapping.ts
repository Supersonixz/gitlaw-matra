// mapping/pdfPageMapping.ts

// This file configures which PDF page each section belongs to.
// Format: An array where the index corresponds to the page number (0 = Page 1, 1 = Page 2, etc.)
// Value: The LAST Section ID contained on that page.
//
// Example: [4, 8, 15]
// - Page 1: Ends at Section 4 (includes 1, 2, 3, 4)
// - Page 2: Ends at Section 8 (includes 5, 6, 7, 8)
// - Page 3: Ends at Section 15

export const PDF_PAGE_MAPPING: Record<string, number[]> = {
    // ---------------------------------------------------------
    // 1. ธรรมนูญการปกครองแผ่นดินสยามชั่วคราว 2475
    // ---------------------------------------------------------
    "con2475temp": [
        1,  // Page 1 ends at Sec 2
        4,  // Page 2 ends at Sec 4
        8,  // Page 3 ends at Sec 6
        10,
        10,
        12,
        14,
        18,
        23,
        26,
        29,
        33,
        36,
        39
    ],

    // ---------------------------------------------------------
    // 2. รัฐธรรมนูญแห่งราชอาณาจักรสยาม 2475
    // ---------------------------------------------------------
    "con2475": [
        // ... Fill here
    ],

    // ---------------------------------------------------------
    // 3. รัฐธรรมนูญแห่งราชอาณาจักรไทย 2489
    // ---------------------------------------------------------
    "con2489": [
        // ... Fill here
    ]
};

// Default Page Count for each PDF
export const PDF_TOTAL_PAGES: Record<string, number> = {
    "con2475temp": 14,
    "con2475": 12,
    "con2489": 18
};
