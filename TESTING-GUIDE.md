# Feedback UI - End-to-End Testing Guide

## Phase 3: Testing & Validation

### Local Testing Setup

#### Prerequisites

1. **Backend API Running**:
   ```bash
   # In incident-manager directory
   cd /Users/devon/GitHub/restiv-infrastructure/kubernetes/apps/monitoring/incident-manager

   # Start FastAPI backend
   python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Database Ready**:
   - Ensure PostgreSQL is running
   - Run database migrations if needed
   - Seed with test incidents

3. **Frontend Dev Server**:
   ```bash
   # In nextjs-saas-template directory
   cd nextjs-saas-template
   npm run dev
   ```

#### Access Points

- **Frontend**: http://localhost:3000
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs (Swagger UI)

---

## Test Scenarios

### Scenario 1: View Incidents List

**Steps**:
1. Navigate to http://localhost:3000/incidents
2. Wait for incidents to load

**Expected Results**:
- [ ] Page loads without errors
- [ ] Incidents table displays with data
- [ ] Pagination controls visible
- [ ] Filter inputs show (namespace, severity, scan type)
- [ ] Feedback count shows for each incident

**API Calls Expected**:
- `GET /api/incidents/list/with-feedback?limit=20&offset=0`

**Troubleshooting**:
- If API fails: Check backend is running on port 8000
- If CORS error: Configure CORS in FastAPI main.py
- If no data: Seed test incidents in database

---

### Scenario 2: Filter Incidents

**Steps**:
1. On incidents list page
2. Enter "default" in Namespace filter
3. Select "High" from Severity dropdown
4. Click or press Enter to apply filter

**Expected Results**:
- [ ] Table updates with filtered results
- [ ] Page resets to 1 (offset = 0)
- [ ] Pagination updates
- [ ] Filter inputs retain values

**API Calls Expected**:
- `GET /api/incidents/list/with-feedback?namespace=default&severity=high&limit=20&offset=0`

**Troubleshooting**:
- If filter not working: Check network tab for API call
- If wrong results: Verify filter parameters match API

---

### Scenario 3: Paginate Through Incidents

**Steps**:
1. On incidents list page with >20 incidents
2. Click "Next" button
3. Verify page 2 loads
4. Click "Previous" button

**Expected Results**:
- [ ] Next/Previous buttons enabled/disabled correctly
- [ ] Page number buttons highlight current page
- [ ] Data updates when pagination changes
- [ ] Pagination info shows correct count

**API Calls Expected**:
- `GET /api/incidents/list/with-feedback?limit=20&offset=20` (page 2)
- `GET /api/incidents/list/with-feedback?limit=20&offset=0` (page 1)

---

### Scenario 4: View Incident Detail

**Steps**:
1. On incidents list page
2. Click "View" link for any incident
3. Verify detail page loads

**Expected Results**:
- [ ] URL changes to `/incidents/[id]`
- [ ] Incident metadata displays (pod, namespace, alert, severity)
- [ ] Tabs visible (Overview, Feedback History, Submit Feedback)
- [ ] Back button works

**API Calls Expected**:
- `GET /api/incidents/{id}/feedback`

**Response Should Include**:
```json
{
  "id": 1,
  "namespace": "default",
  "pod_name": "test-pod",
  "alert_name": "HighMemory",
  "severity": "high",
  "anomaly_score": 0.85,
  "created_at": "2025-12-12T10:30:00Z",
  "feedback_count": 2,
  "feedback": [
    {
      "id": 1,
      "incident_id": 1,
      "false_positive": false,
      "action_effectiveness": 80,
      "confidence_score": 90,
      "root_cause": "Memory leak",
      "created_at": "2025-12-12T10:35:00Z"
    }
  ]
}
```

---

### Scenario 5: View Feedback History Tab

**Steps**:
1. On incident detail page
2. Click "Feedback History" tab
3. Review feedback entries

**Expected Results**:
- [ ] Tab switches to show feedback list
- [ ] Each feedback shows all metadata
- [ ] True/False positive icons display correctly
- [ ] Effectiveness and confidence scores show
- [ ] Timestamps are formatted correctly
- [ ] Root cause and suggested action display

**Expected UI**:
- Green checkmark for true positives
- Red X for false positives
- Feedback badges (true-positive, false-positive, partial)
- Scan type badges in blue

---

### Scenario 6: Submit Feedback

**Steps**:
1. On incident detail page
2. Click "Submit Feedback" tab
3. Fill form:
   - Set Action Effectiveness to 75%
   - Set Confidence Score to 85%
   - Enter Root Cause: "Resource leak in container"
   - Enter Suggested Action: "Increase memory limit to 2Gi"
   - Leave "false positive" unchecked
4. Click "Submit Feedback" button
5. Wait for success message

**Expected Results**:
- [ ] Loading spinner appears during submission
- [ ] Success message displays: "Feedback submitted successfully!"
- [ ] Form resets to default values
- [ ] Page automatically switches to "Feedback History" tab
- [ ] New feedback appears in history

**API Calls Expected**:
- `POST /api/incidents/{id}/feedback`
- Body should match:
```json
{
  "incident_id": 1,
  "false_positive": false,
  "action_effectiveness": 75,
  "confidence_score": 85,
  "root_cause": "Resource leak in container",
  "suggested_action": "Increase memory limit to 2Gi",
  "feedback_type": "true-positive"
}
```

**Response Should Be**:
```json
{
  "id": 3,
  "incident_id": 1,
  "false_positive": false,
  "action_effectiveness": 75,
  "confidence_score": 85,
  "root_cause": "Resource leak in container",
  "suggested_action": "Increase memory limit to 2Gi",
  "created_at": "2025-12-12T15:30:00Z"
}
```

---

### Scenario 7: Submit False Positive Feedback

**Steps**:
1. On incident detail page, Submit Feedback tab
2. Check "This was a false positive" checkbox
3. Set Confidence Score to 95%
4. Enter Root Cause: "Alert threshold too low"
5. Click Submit

**Expected Results**:
- [ ] Feedback submitted successfully
- [ ] New feedback appears in history with red X icon
- [ ] False positive count increments

**API Difference**:
- `false_positive: true` in request body

---

### Scenario 8: Cache Invalidation

**Steps**:
1. On incident detail page
2. Submit feedback
3. Feedback appears in history
4. Navigate back to incidents list
5. Return to same incident detail

**Expected Results**:
- [ ] Feedback history updated (new feedback shows)
- [ ] Feedback count incremented on list page
- [ ] No manual refresh needed (React Query cache handles it)

**Cache Invalidation Should Trigger**:
- `['incidents']` - list page refreshes
- `['feedback', incidentId]` - detail page refreshes
- `['pattern-analysis']` - learning loop updates

---

### Scenario 9: Error Handling - API Down

**Steps**:
1. Stop backend API
2. On incidents list, refresh page
3. Try to load incident detail

**Expected Results**:
- [ ] Error message displays: "Failed to load incidents..."
- [ ] AlertCircle icon shows
- [ ] No blank page or infinite spinner
- [ ] User can still navigate (back button works)

**Frontend Should Show**:
- Error alert box with readable error message
- Suggestion to retry or check backend

---

### Scenario 10: Error Handling - Feedback Submission Fails

**Steps**:
1. On feedback form
2. Stop backend API temporarily
3. Submit feedback

**Expected Results**:
- [ ] Submit button shows loading state briefly
- [ ] Error message displays: "Failed to submit feedback..."
- [ ] Form data is NOT cleared (user can retry)
- [ ] User can fix and resubmit

---

## Browser DevTools Testing

### Network Tab

**To Verify API Calls**:
1. Open DevTools → Network tab
2. Navigate through incidents
3. Should see requests like:
   - `GET /api/incidents/list/with-feedback`
   - `GET /api/incidents/1/feedback`
   - `POST /api/incidents/1/feedback` (with request body)

**Verify Response Formats**:
- Click each request
- Check "Response" tab
- Verify JSON structure matches expected format
- Check status codes (200 for success, 4xx for errors)

### Console Tab

**To Check for Errors**:
1. Open DevTools → Console tab
2. Navigate through app
3. Should see NO red error messages
4. May see React warnings (non-blocking)
5. Check for CORS errors if API calls fail

---

## Database Verification

### Check Feedback Was Persisted

```bash
# Connect to PostgreSQL
psql -U incident_manager -d incident_manager

# Query feedback table
SELECT * FROM feedback WHERE incident_id = 1;

# Should show submitted feedback with all fields
# id | incident_id | false_positive | action_effectiveness | confidence_score | created_at | ...
# 3  | 1           | f              | 75                   | 85              | 2025-12-12... | ...
```

### Check Audit Log

```bash
SELECT * FROM feedback_audit_log WHERE feedback_id = 3;

# Should show change_type = 'created'
# id | feedback_id | changed_by | changed_at | new_values | ...
```

---

## Performance Testing

### Load Testing

**To Test with Multiple Incidents**:

1. **Seed 1000 incidents**:
   ```bash
   # In backend directory
   python scripts/seed_incidents.py --count 1000
   ```

2. **Test pagination**:
   - Navigate through pages 1-50
   - Measure API response times
   - Should be <500ms per request

3. **Test filtering**:
   - Apply complex filters (namespace + severity + scan_type)
   - Should complete in <1s

### Memory Leak Testing

1. Open DevTools → Memory tab
2. Take heap snapshot
3. Load incidents list (scroll through 5 pages)
4. Take another snapshot
5. Compare - should not see unbounded growth

---

## Accessibility Testing

### Keyboard Navigation

**Steps**:
1. Tab through page elements
2. Verify focus order is logical
3. Enter key submits forms
4. Escape cancels actions (if implemented)

**Expected**:
- [ ] All buttons keyboard accessible
- [ ] Form inputs focusable
- [ ] Clear focus indicators
- [ ] Tab order makes sense

### Screen Reader

**Using NVDA or VoiceOver**:
1. Read page title
2. Navigate to table
3. Read column headers
4. Submit feedback form

**Expected**:
- [ ] Form labels associated with inputs
- [ ] Buttons have descriptive text
- [ ] Icons have alt text or aria-labels

---

## Checklist: All Tests Passing

- [ ] Scenario 1: View Incidents List ✅
- [ ] Scenario 2: Filter Incidents ✅
- [ ] Scenario 3: Paginate Through Incidents ✅
- [ ] Scenario 4: View Incident Detail ✅
- [ ] Scenario 5: View Feedback History Tab ✅
- [ ] Scenario 6: Submit Feedback ✅
- [ ] Scenario 7: Submit False Positive Feedback ✅
- [ ] Scenario 8: Cache Invalidation ✅
- [ ] Scenario 9: Error Handling - API Down ✅
- [ ] Scenario 10: Error Handling - Submission Fails ✅
- [ ] Network Requests Verified ✅
- [ ] Database Persistence Verified ✅
- [ ] Performance Acceptable ✅
- [ ] Accessibility Baseline Met ✅

---

## Deployment Readiness Criteria

Before deploying to Kubernetes, verify:

- [ ] All test scenarios passing
- [ ] No console errors
- [ ] API response times <500ms
- [ ] Database persistence confirmed
- [ ] Error handling works gracefully
- [ ] Loading states display correctly
- [ ] Mobile responsive design verified
- [ ] Accessibility baseline met

---

## Next Steps After Testing

1. **Fix Any Bugs Found**:
   - Update Frontend code
   - Update Backend code
   - Re-test affected scenarios

2. **Performance Optimization** (if needed):
   - Implement virtual scrolling for large lists
   - Add request caching/stale-while-revalidate
   - Optimize bundle size

3. **Kubernetes Deployment**:
   - Build Docker image
   - Push to registry
   - Update deployment manifests
   - Deploy to cluster

4. **Production Validation**:
   - Test in staging environment
   - Monitor learning loop feedback collection
   - Validate pattern analysis accuracy
   - Check auto-escalation at 80% threshold
