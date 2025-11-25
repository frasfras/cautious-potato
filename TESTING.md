# Testing Instructions - Racing Coach Chat

## 🧪 Manual Testing Guide

This document provides comprehensive testing instructions for the Racing Coach Chat application.

---

## Prerequisites

### Required
- Modern web browser (Chrome, Firefox, Safari, or Edge)
- Internet connection
- API key (OpenAI or Synthetic)

### Optional
- Sample CSV telemetry file (provided: `public/lap_2.csv`)
- Your own telemetry data from VBOX or similar data logger

---

## 🚀 Quick Start Testing

### 1. Launch Application

**Local Development**:
```bash
npm start
```
Expected: App opens at `http://localhost:3000`

**Production**:
Navigate to your deployed Netlify URL

### 2. Initial Load Test
- [ ] Page loads without errors
- [ ] Racing line visualization appears
- [ ] Default lap data (lap_2.csv) is loaded
- [ ] Car position indicator is visible
- [ ] Speed HUD shows "Speed: 0.0 km/h"

**Expected Console Logs**:
```
✅ Parsed GPS points: [number]
🔍 Environment variables check:
  REACT_APP_API_KEY exists: [true/false]
```

---

## 📋 Feature Testing Checklist

### Feature 1: File Upload & Data Loading

#### Test 1.1: Load Default CSV
- [ ] Default file (lap_2.csv) loads automatically on page load
- [ ] Racing line appears on track visualization
- [ ] GPS points are visible (if "Show GPS Points" is checked)
- [ ] Current filename shows "lap_2.csv"

#### Test 1.2: Upload Custom CSV
1. Click "Load CSV File" button
2. Select a CSV file from your computer
3. Verify:
   - [ ] "⏳ Loading file..." message appears
   - [ ] Racing line updates with new data
   - [ ] Filename updates to show new file name
   - [ ] Car resets to start position
   - [ ] No error messages appear

#### Test 1.3: Invalid File Handling
1. Try uploading a non-CSV file (e.g., .txt, .jpg)
2. Verify:
   - [ ] Error message appears
   - [ ] Previous data remains intact
   - [ ] App doesn't crash

#### Test 1.4: Empty/Invalid CSV
1. Upload a CSV with no valid GPS data
2. Verify:
   - [ ] Error message: "No valid GPS data found in file"
   - [ ] Previous visualization remains

**Console Verification**:
```
📁 File input clicked
📁 Selected file: [filename]
📁 File text length: [number]
📁 Parsed GPS points: [number]
```

---

### Feature 2: Racing Line Visualization

#### Test 2.1: Display Controls
1. Toggle "Show Track Image"
   - [ ] Track background appears/disappears
2. Toggle "Show Racing Line"
   - [ ] Cyan racing line appears/disappears
3. Toggle "Show GPS Points"
   - [ ] Red GPS dots appear/disappear

#### Test 2.2: Car Animation
1. Observe car movement
   - [ ] Green car marker moves along racing line
   - [ ] Movement is smooth and continuous
   - [ ] Car loops back to start after completing lap

#### Test 2.3: Speed Control
1. Press ↑ (Up Arrow) key
   - [ ] Speed increases
   - [ ] Speed HUD updates in real-time
   - [ ] Car moves faster along line
2. Press ↓ (Down Arrow) key
   - [ ] Speed decreases
   - [ ] Speed HUD updates
   - [ ] Car slows down
3. Release keys
   - [ ] Car maintains current speed
   - [ ] Speed gradually adjusts to target

#### Test 2.4: Transform Controls
1. Adjust sliders (a, e, c, f, rotation)
   - [ ] Racing line position/scale updates in real-time
   - [ ] Values display correctly
   - [ ] No lag or performance issues

---

### Feature 3: AI Chat Interface

#### Test 3.1: Open/Close Chat Panel
1. Click "💬 Open AI Coach" button
   - [ ] Chat panel slides in from right
   - [ ] Button text changes to "Close AI Coach"
   - [ ] Button color changes to cyan
   - [ ] Main content adjusts (desktop) or overlays (mobile)
2. Click "✕" in chat header
   - [ ] Chat panel closes
   - [ ] Main content returns to normal

#### Test 3.2: Chat Panel UI
With chat open, verify:
- [ ] Header shows "🏎️ AI Racing Coach"
- [ ] API Settings section is visible
- [ ] Example questions are displayed (when no messages)
- [ ] Message input area is at bottom
- [ ] All elements are properly styled

#### Test 3.3: Example Questions
1. Click any example question
   - [ ] Question text appears in input field
   - [ ] Cursor is in input field
   - [ ] Ready to send

---

### Feature 4: API Configuration

#### Test 4.1: API Settings Panel
1. Click "⚙️ API Settings" button
   - [ ] Settings panel expands
   - [ ] Shows provider dropdown
   - [ ] Shows API key input
   - [ ] Shows test connection button
   - [ ] Shows debug info section

2. Click again to collapse
   - [ ] Settings panel collapses
   - [ ] Arrow icon changes direction

#### Test 4.2: No API Key Warning
With no API key configured:
- [ ] Orange warning box appears
- [ ] Message: "⚠️ No API Key Configured"
- [ ] Links to OpenAI and Synthetic are clickable
- [ ] Links open in new tab

#### Test 4.3: Provider Selection
1. Select "OpenAI" from dropdown
   - [ ] Placeholder changes to "sk-..."
   - [ ] Hint shows: "💡 OpenAI keys start with 'sk-'"
   - [ ] Debug info updates: "Provider: openai"

2. Select "Synthetic" from dropdown
   - [ ] Placeholder changes to "syn_..."
   - [ ] Hint shows: "💡 Synthetic keys start with 'syn_'"
   - [ ] Debug info updates: "Provider: synthetic"

#### Test 4.4: API Key Input
1. Enter API key in password field
   - [ ] Characters are masked (••••)
   - [ ] Debug info shows key length
   - [ ] Validation status resets to "untested"

2. Clear API key
   - [ ] Test button becomes disabled
   - [ ] Warning message reappears

#### Test 4.5: Test Connection - Success
1. Enter valid API key
2. Select correct provider
3. Click "🔌 Test Connection"
   - [ ] Button shows "Testing..." with spinner
   - [ ] Button is disabled during test
   - [ ] Success message appears (green)
   - [ ] Message: "✅ Connection successful! API key is valid."

**Console Verification**:
```
🔍 Testing connection to: [endpoint]
🔑 Using provider: [provider]
📤 Request body: {...}
📡 Response status: 200
✅ Connection successful!
```

#### Test 4.6: Test Connection - Failure
1. Enter invalid API key
2. Click "🔌 Test Connection"
   - [ ] Button shows "Testing..." with spinner
   - [ ] Error message appears (red)
   - [ ] Message: "❌ Connection failed. Please check your API key and provider."

**Console Verification**:
```
❌ Connection failed: 401
❌ Error response: {...}
```

#### Test 4.7: API Key Persistence
1. Enter API key and select provider
2. Refresh page
   - [ ] API key is remembered (localStorage)
   - [ ] Provider selection is remembered
   - [ ] No need to re-enter

#### Test 4.8: Environment Variables (Netlify)
If deployed with env vars:
- [ ] API key is pre-filled on load
- [ ] Provider is pre-selected
- [ ] Console shows: "REACT_APP_API_KEY exists: true"
- [ ] User can still override in UI

---

### Feature 5: Chat Functionality

#### Test 5.1: Send Message - No API Key
1. Without configuring API key
2. Type a question and click "📤 Send Message"
   - [ ] Message appears in chat
   - [ ] Error message: "Please configure your API key before sending messages"
   - [ ] No API call is made

#### Test 5.2: Send Message - No Telemetry Data
1. Configure valid API key
2. Before loading any CSV data
3. Send a question
   - [ ] Error message: "No telemetry data available. Please load a CSV file first."

#### Test 5.3: Send Message - Success
1. Configure valid API key
2. Ensure CSV data is loaded
3. Type question: "What was my top speed?"
4. Click "📤 Send Message" or press Enter
   - [ ] Input field clears immediately
   - [ ] User message appears (cyan background)
   - [ ] Loading indicator appears with spinner
   - [ ] "Analyzing telemetry..." message shows
   - [ ] AI response appears (with border)
   - [ ] Response includes specific data/numbers
   - [ ] Send button re-enables

**Console Verification**:
```
Telemetry Data Summary:
- Max speed: [number] km/h
- Average speed: [number] km/h
Sample Telemetry Data: [...]
```

#### Test 5.4: Multiple Messages
1. Send first question
2. Wait for response
3. Send second question
   - [ ] Both Q&A pairs are visible
   - [ ] Messages are in chronological order
   - [ ] Scroll works properly
   - [ ] Each message has unique styling

#### Test 5.5: Retry Failed Message
1. Cause a message to fail (disconnect internet)
2. Verify error message appears
3. Click "🔄 Retry" button
   - [ ] Message shows loading state again
   - [ ] New API call is made
   - [ ] Response appears or error shows again

#### Test 5.6: Clear Chat
1. Send several messages
2. Click "🗑️ Clear Chat" button
   - [ ] All messages are removed
   - [ ] Example questions reappear
   - [ ] Input field is cleared
   - [ ] No errors occur

#### Test 5.7: Enter Key Behavior
1. Type message and press Enter (without Shift)
   - [ ] Message sends immediately
2. Type message and press Shift+Enter
   - [ ] New line is added
   - [ ] Message does not send

#### Test 5.8: Disabled State
While message is sending:
- [ ] Input field is disabled and grayed out
- [ ] Send button is disabled
- [ ] Cursor shows "not-allowed"
- [ ] Cannot type new message

---

### Feature 6: Telemetry Data Analysis

#### Test 6.1: Speed Questions
Ask: "What was my top speed?"
- [ ] Response includes specific speed value
- [ ] Speed matches max speed in stats
- [ ] Units are specified (km/h)

Ask: "What was my average speed?"
- [ ] Response includes average speed
- [ ] Value is reasonable

#### Test 6.2: Braking Questions
Ask: "Where did I brake the hardest?"
- [ ] Response references brake pressure data
- [ ] Mentions specific location or corner
- [ ] Includes brake pressure values

#### Test 6.3: Gear Questions
Ask: "What gear was I in at turn 3?"
- [ ] Response analyzes gear data
- [ ] Provides specific gear number
- [ ] May include RPM context

#### Test 6.4: Acceleration Questions
Ask: "Where did I accelerate the hardest?"
- [ ] Response uses accelX/accelY data
- [ ] Mentions g-force values
- [ ] Identifies specific track location

#### Test 6.5: General Performance
Ask: "How can I improve my lap time?"
- [ ] Response provides actionable advice
- [ ] References multiple data points
- [ ] Suggests specific improvements

#### Test 6.6: Data Context Verification
Check that AI responses reference:
- [ ] Speed data
- [ ] Gear information
- [ ] Brake pressure
- [ ] Throttle position
- [ ] Steering angle
- [ ] G-forces (accelX/accelY)

---

## 🌐 Cross-Browser Testing

Test on multiple browsers:

### Chrome/Edge (Chromium)
- [ ] All features work
- [ ] No console errors
- [ ] Smooth animations
- [ ] File upload works

### Firefox
- [ ] All features work
- [ ] No console errors
- [ ] Smooth animations
- [ ] File upload works

### Safari (macOS/iOS)
- [ ] All features work
- [ ] No console errors
- [ ] Smooth animations
- [ ] File upload works
- [ ] Touch interactions work (mobile)

---

## 📱 Responsive Design Testing

### Desktop (1920x1080)
- [ ] Chat panel appears side-by-side
- [ ] Main content adjusts when chat opens
- [ ] All controls are accessible
- [ ] No horizontal scrolling

### Tablet (768x1024)
- [ ] Chat panel overlays main content
- [ ] Touch interactions work
- [ ] Buttons are large enough
- [ ] Text is readable

### Mobile (375x667)
- [ ] Chat panel is full width
- [ ] All features accessible
- [ ] Touch targets are adequate
- [ ] Virtual keyboard doesn't break layout
- [ ] Scrolling works smoothly

---

## ⚡ Performance Testing

### Load Time
- [ ] Initial page load < 3 seconds
- [ ] CSV parsing < 2 seconds for typical file
- [ ] Chat panel opens instantly
- [ ] No lag when typing

### Memory Usage
1. Open browser DevTools → Performance
2. Load large CSV file
3. Send multiple chat messages
4. Verify:
   - [ ] No memory leaks
   - [ ] Smooth 60fps animation
   - [ ] No excessive re-renders

### API Response Time
- [ ] Test connection: < 5 seconds
- [ ] Chat response: < 10 seconds (depends on API)
- [ ] Loading indicators show during waits

---

## 🔒 Security Testing

### API Key Handling
- [ ] API keys are stored in localStorage (not visible in URL)
- [ ] API keys are masked in password field
- [ ] API keys are not logged to console (except length)
- [ ] API keys are sent only to configured endpoint

### Input Validation
- [ ] Long messages don't break UI
- [ ] Special characters in questions work
- [ ] SQL injection attempts are harmless (no backend DB)
- [ ] XSS attempts don't execute (React escapes by default)

### CORS & Network
- [ ] API calls use HTTPS
- [ ] Proper error handling for network failures
- [ ] No sensitive data in network requests (except API key in header)

---

## 🐛 Error Handling Testing

### Network Errors
1. Disconnect internet
2. Try to send message
   - [ ] Clear error message appears
   - [ ] App doesn't crash
   - [ ] Retry option available

### Invalid API Key
1. Enter wrong API key
2. Send message
   - [ ] 401/403 error handled gracefully
   - [ ] User-friendly error message
   - [ ] Suggestion to check API key

### Malformed CSV
1. Upload CSV with wrong format
2. Verify:
   - [ ] Error message appears
   - [ ] App doesn't crash
   - [ ] Previous data intact

### API Rate Limits
1. Send many messages quickly
2. Verify:
   - [ ] Rate limit errors are caught
   - [ ] User-friendly message shown
   - [ ] App remains functional

---

## 🧩 Integration Testing

### End-to-End Flow
1. Open app
2. Load CSV file
3. Configure API key
4. Test connection
5. Send question
6. Receive answer
7. Send follow-up question
8. Clear chat
9. Load different CSV
10. Ask new question

All steps should work smoothly without errors.

---

## 📊 Test Data

### Sample Questions to Test

**Speed Analysis**:
- "What was my top speed?"
- "What was my average speed?"
- "Where was I going the slowest?"

**Braking Analysis**:
- "Where did I brake the hardest?"
- "What was my maximum brake pressure?"
- "Did I brake too early or too late?"

**Cornering Analysis**:
- "How was my cornering speed?"
- "What gear should I use in turn 3?"
- "Where did I have the most lateral g-force?"

**General Performance**:
- "How can I improve my lap time?"
- "Where am I losing the most time?"
- "What's my racing line consistency?"

**Technical Questions**:
- "What was my RPM at top speed?"
- "How much throttle was I using in corners?"
- "What was my steering angle range?"

---

## ✅ Acceptance Criteria

### Must Pass
- [ ] All core features work without errors
- [ ] API configuration saves and persists
- [ ] Chat sends and receives messages
- [ ] Telemetry data is correctly analyzed
- [ ] File upload works reliably
- [ ] No console errors in production build
- [ ] Works on Chrome, Firefox, Safari
- [ ] Responsive on mobile devices

### Should Pass
- [ ] Smooth animations (60fps)
- [ ] Fast load times (< 3s)
- [ ] Intuitive UI/UX
- [ ] Helpful error messages
- [ ] Good accessibility (keyboard navigation)

### Nice to Have
- [ ] Works offline (after initial load)
- [ ] PWA installable
- [ ] Dark mode support
- [ ] Export chat history

---

## 🚨 Known Issues / Limitations

Document any known issues here:

1. **Large CSV Files**: Files > 10MB may take longer to parse
2. **API Rate Limits**: Rapid-fire questions may hit rate limits
3. **Mobile Keyboard**: May cover input field on small screens
4. **Safari iOS**: File upload may require specific permissions

---

## 📝 Bug Report Template

When you find a bug, report it with:

```markdown
**Bug Description**: [Clear description]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior**: [What should happen]

**Actual Behavior**: [What actually happened]

**Environment**:
- Browser: [Chrome 120, Firefox 121, etc.]
- OS: [Windows 11, macOS 14, etc.]
- Device: [Desktop, iPhone 14, etc.]

**Console Errors**: [Paste any errors]

**Screenshots**: [If applicable]
```

---

## 🎯 Testing Completion

### Sign-off Checklist
- [ ] All feature tests passed
- [ ] Cross-browser testing complete
- [ ] Responsive design verified
- [ ] Performance acceptable
- [ ] Security checks passed
- [ ] Error handling verified
- [ ] Documentation reviewed

**Tested By**: _______________
**Date**: _______________
**Version**: _______________

---

## 📞 Support

If you encounter issues during testing:
1. Check TROUBLESHOOTING.md
2. Review console logs
3. Check GitHub issues
4. Create new issue with bug report template

---

**Happy Testing! 🏎️💨**
