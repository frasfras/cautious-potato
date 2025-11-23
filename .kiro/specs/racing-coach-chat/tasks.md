# Implementation Plan

- [x] 1. Add chat state management and API configuration
  - Add state variables for chat panel visibility, messages array, input text, and loading status
  - Add state variables for API key, API provider selection, and API key validation status
  - Implement localStorage integration to persist API key and provider selection
  - Create helper functions to load and save API configuration from localStorage
  - _Requirements: 4.2, 4.3, 5.2_

- [x] 2. Create API communication functions
  - Implement `prepareTelemetryContext` function that extracts relevant GPS points and calculates summary statistics
  - Implement `askRacingCoach` function that makes POST requests to OpenAI or Synthetic API
  - Configure proper headers including Authorization with API key
  - Structure the request with system prompt for racing coach persona and user prompt with telemetry context
  - Handle API response parsing and error cases
  - _Requirements: 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 4.5_

- [x] 3. Implement message handling logic
  - Create `handleSendMessage` function that processes user input
  - Add message to chat history with loading state
  - Call API with telemetry context and update message with response
  - Implement error handling that displays errors inline in chat
  - Add retry capability for failed messages
  - Clear input field after successful send
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Build chat panel UI component
  - Create collapsible sidebar panel with fixed positioning on the right side
  - Add chat header with title and close button
  - Implement scrollable messages container that displays question-answer pairs
  - Create chat input section with textarea and send button
  - Add toggle button in main header to open/close chat panel
  - Style all components to match dark theme with cyan accents
  - _Requirements: 1.1, 5.1, 5.2, 5.3, 5.4_

- [x] 5. Add API configuration UI
  - Create API settings section within chat panel
  - Add dropdown to select between OpenAI and Synthetic API providers
  - Add password input field for API key entry
  - Implement test connection button that validates API key
  - Display validation status (valid/invalid/untested)
  - Show helpful message when no API key is configured
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 6. Implement example questions feature
  - Create array of 5+ example racing questions
  - Display example questions when chat history is empty
  - Make example questions clickable to populate input field
  - Hide examples after first message is sent
  - Add "Clear Chat" button that resets history and shows examples again
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 7. Add loading states and visual feedback
  - Display loading spinner or indicator while waiting for API response
  - Disable input field and send button during API calls
  - Show typing indicator in chat while response is loading
  - Re-enable controls after response or error
  - Add smooth transitions for chat panel open/close
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 8. Implement responsive layout adjustments
  - Adjust visualization width when chat panel is open on desktop
  - Make chat panel overlay on mobile devices instead of side-by-side
  - Ensure chat panel is usable on different screen sizes
  - Add media queries for mobile responsiveness
  - Test layout on various viewport sizes
  - _Requirements: 5.3, 5.5_

- [ ]* 9. Add context optimization and token management
  - Implement intelligent context window sizing based on question type
  - Add token counting to prevent exceeding API limits
  - Implement automatic context reduction if request is too large
  - Add caching for repeated questions
  - Optimize telemetry data serialization for smaller payloads
  - _Requirements: 2.3, 2.4_

- [ ]* 10. Add advanced error handling and edge cases
  - Handle no telemetry data scenario with informative message
  - Implement rate limiting protection with exponential backoff
  - Add network connectivity detection
  - Handle localStorage disabled scenario gracefully
  - Add message history limit (50 messages) to prevent memory issues
  - Implement input validation for empty or excessively long questions
  - _Requirements: 2.5, 3.4, 3.5_
