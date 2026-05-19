$BASE = "http://localhost:5000/api"
$pass = 0
$fail = 0
$errors = @()

function Invoke-API {
    param($uri, $method, $body, $token)
    $h = @{ "Content-Type" = "application/json" }
    if ($token) { $h["Authorization"] = "Bearer $token" }
    
    try {
        if ($body) {
            $json = $body | ConvertTo-Json
            $r = Invoke-WebRequest -Uri $uri -Method $method -Body $json -Headers $h -UseBasicParsing
        } else {
            $r = Invoke-WebRequest -Uri $uri -Method $method -Headers $h -UseBasicParsing
        }
        return @{ status = [int]$r.StatusCode; data = ($r.Content | ConvertFrom-Json) }
    } catch {
        $code = [int]$_.Exception.Response.StatusCode
        $body = ""
        try { $body = $_.Exception.Response.GetResponseStream() | % { $reader = New-Object System.IO.StreamReader($_); $reader.ReadToEnd() } } catch {}
        $data = $null
        try { $data = $body | ConvertFrom-Json } catch {}
        return @{ status = $code; data = $data }
    }
}

function Check {
    param($label, $result, $expectedStatus)
    if ($result.status -eq $expectedStatus) {
        Write-Host " PASS  [$label]"
        $script:pass++
        return $true
    } else {
        Write-Host " FAIL  [$label] Got $($result.status), expected $expectedStatus | $($result.data | ConvertTo-Json -Compress)"
        $script:fail++
        $script:errors += $label
        return $false
    }
}

Write-Host ""
Write-Host "=========================================="
Write-Host "  Smart Complaint Management System Tests"
Write-Host "=========================================="

# ── AUTH ───────────────────────────────────────────────────────
Write-Host "`n--- AUTH ENDPOINTS ---"
$TOKEN = $null; $CID = $null

$r = Invoke-API "$BASE/register" POST @{name="CMS Runner";email="cmsrunner99@test.com";password="Pass@1234"}
if ($r.status -eq 409) { Write-Host " INFO  [Register] User exists, continuing..." }
elseif (Check "POST /api/register (valid signup)" $r 201) { $TOKEN = $r.data.token }

$r = Invoke-API "$BASE/login" POST @{email="cmsrunner99@test.com";password="Pass@1234"}
if (Check "POST /api/login (valid → Token generated)" $r 200) { $TOKEN = $r.data.token }

$r = Invoke-API "$BASE/login" POST @{email="cmsrunner99@test.com";password="WRONG"}
Check "POST /api/login (bad password → Unauthorized error)" $r 401
if ($r.data) { Write-Host "       msg: $($r.data.message)" }

$r = Invoke-API "$BASE/login" POST @{email="nobody@nowhere.com";password="Pass@1234"}
Check "POST /api/login (bad email → Unauthorized error)" $r 401

$r = Invoke-API "$BASE/me" GET $null $TOKEN
Check "GET /api/me (with token → Access granted)" $r 200

$r = Invoke-API "$BASE/me" GET $null $null
Check "GET /api/me (no token → Access denied)" $r 401
if ($r.data) { Write-Host "       msg: $($r.data.message)" }

$r = Invoke-API "$BASE/verify-password-format/cmsrunner99@test.com" GET $null $null
Check "GET /api/verify-password-format (Encrypted format)" $r 200
if ($r.data) { Write-Host "       msg: $($r.data.message)" }

# ── COMPLAINTS ─────────────────────────────────────────────────
Write-Host "`n--- COMPLAINT ENDPOINTS ---"

$r = Invoke-API "$BASE/complaints" POST @{name="Rahul Kumar";email="rahul@gmail.com";title="Water Leakage Issue";description="Water pipeline damaged near market area.";category="Water Supply";location="Ghaziabad"} $null
if (Check "POST /api/complaints (valid → Complaint stored successfully)" $r 201) {
    $CID = $r.data.complaint._id
    Write-Host "       id: $CID | msg: $($r.data.message)"
}

$r = Invoke-API "$BASE/complaints" POST @{name="Test";email="t@t.com";description="no title";category="Other";location="Place"} $null
Check "POST /api/complaints (missing title → Validation error)" $r 400
if ($r.data) { Write-Host "       msg: $($r.data.error)" }

$r = Invoke-API "$BASE/complaints" POST @{name="Test";email="notanemail";title="T";description="D";category="Other";location="Place"} $null
Check "POST /api/complaints (invalid email → Error message)" $r 400
if ($r.data) { Write-Host "       msg: $($r.data.error)" }

$r = Invoke-API "$BASE/complaints" GET $null $null
Check "GET /api/complaints (Complaints displayed)" $r 200
if ($r.data) { Write-Host "       count: $($r.data.complaints.Count)" }

$r = Invoke-API "$BASE/complaints/search?location=Ghaziabad" GET $null $null
Check "GET /api/complaints/search?location=Ghaziabad (Matching complaints displayed)" $r 200
if ($r.data) { Write-Host "       count: $($r.data.complaints.Count) | msg: $($r.data.message)" }

$r = Invoke-API "$BASE/complaints/search?q=Water" GET $null $null
Check "GET /api/complaints/search?q=Water (general search)" $r 200

if ($CID) {
    $r = Invoke-API "$BASE/complaints/$CID" PUT @{status="In Progress"} $null
    Check "PUT /api/complaints/:id (Updated status shown)" $r 200
    if ($r.data) { Write-Host "       status: $($r.data.complaint.status) | msg: $($r.data.message)" }

    $r = Invoke-API "$BASE/complaints/$CID" DELETE $null $null
    Check "DELETE /api/complaints/:id (Complaint removed)" $r 200
    if ($r.data) { Write-Host "       msg: $($r.data.message)" }
} else {
    Write-Host " SKIP  [PUT/DELETE complaint] No complaint ID available"
}

# ── AI ─────────────────────────────────────────────────────────
Write-Host "`n--- AI ENDPOINTS ---"

$r = Invoke-API "$BASE/ai/analyze" POST @{title="Water leakage";description="Pipeline broken.";category="Other";location="Market"} $null
if (Check "POST /api/ai/analyze (water leakage → Water department suggestion)" $r 200) {
    Write-Host "       dept: $($r.data.analysis.suggestedDepartment)"
}

$r = Invoke-API "$BASE/ai/analyze" POST @{title="Electricity issue";description="No power.";category="Other";location="Block B"} $null
if (Check "POST /api/ai/analyze (electricity issue → High priority alert)" $r 200) {
    Write-Host "       urgency: $($r.data.analysis.urgency)"
}

$r = Invoke-API "$BASE/ai/analyze" POST @{title="Garbage complaint";description="Waste not collected for weeks.";category="Other";location="Zone 4"} $null
if (Check "POST /api/ai/analyze (garbage complaint → Sanitation department)" $r 200) {
    Write-Host "       dept: $($r.data.analysis.suggestedDepartment)"
}

$r = Invoke-API "$BASE/ai/analyze" POST @{title="Long complaint text";description="This is a long complaint text describing multiple issues in detail.";category="Other";location="Campus"} $null
if (Check "POST /api/ai/analyze (long text → AI-generated summary)" $r 200) {
    Write-Host "       summary: $($r.data.analysis.summary)"
}

$r = Invoke-API "$BASE/ai/analyze" POST @{description="Missing required title and category"} $null
Check "POST /api/ai/analyze (missing fields → 400)" $r 400

Write-Host ""
Write-Host "=========================================="
Write-Host "  RESULTS: $pass PASSED | $fail FAILED"
if ($errors.Count -gt 0) {
    Write-Host "  Failed:"
    $errors | ForEach-Object { Write-Host "    - $_" }
}
Write-Host "=========================================="
