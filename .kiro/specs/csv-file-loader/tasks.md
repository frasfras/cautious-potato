# Implementation Plan

- [x] 1. Refactor CSV parsing logic into reusable functions
  - Extract the existing Papa.parse logic from the useEffect hook into a standalone `parseCSVData` function
  - Create an `extractGPSPoints` helper function that takes parsed CSV rows and returns GPS points array
  - Ensure both functions handle errors appropriately
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 2. Add state management for file loading
  - Add `loadingFile` state variable (boolean) to track loading status
  - Add `fileError` state variable (string or null) to store error messages
  - Add `currentFileName` state variable (string) initialized to "lap_2.csv"
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.4_

- [x] 3. Implement file input handler
  - Create `handleFileChange` async function that accepts file input event
  - Read file contents using the File API's `.text()` method
  - Call `parseCSVData` with file contents
  - Update `points` state with parsed GPS data
  - Reset `carPosition` to 0 when new data loads
  - Handle errors and update `fileError` state
  - Update loading states appropriately
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 4. Create file input UI component
  - Add a styled container div for the file input section
  - Add file input element with `type="file"` and `accept=".csv"` attributes
  - Add onChange handler that calls `handleFileChange`
  - Display current file name using `currentFileName` state
  - Add conditional rendering for loading indicator when `loadingFile` is true
  - Add conditional rendering for error message when `fileError` is not null
  - Style the section to match the existing dark theme with cyan accents
  - Position the section between the title and speed HUD
  - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5. Update initial data loading to use refactored functions
  - Modify the existing useEffect that loads "/lap_2.csv" to use the new `parseCSVData` function
  - Ensure the default file loads on component mount
  - Remove duplicate parsing logic
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 6. Add validation and edge case handling
  - Validate that parsed GPS points array is not empty before updating state
  - Add specific error messages for common failure scenarios (no GPS data, invalid format)
  - Test with various CSV formats and edge cases
  - _Requirements: 2.4, 2.5_
