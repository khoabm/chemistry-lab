# Read-only CP02 benchmark runner. No application source edits, dependencies or deployment.
# Run from the optimization branch: powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\run-codex-context-benchmark.ps1
param(
  [string]$ResultsDirectory = '',
  [string]$Model = '',
  [string]$ReasoningEffort = ''
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
if (-not $Model -or -not $ReasoningEffort) { throw 'Both -Model and -ReasoningEffort are required.' }
if ($ReasoningEffort -notin @('minimal','low','medium','high','xhigh')) { throw 'Unsupported reasoning effort.' }

$baseline = 'e860963977bec297d10b1a9eda1e596071fe2ff0'
$candidate = '6cde7280ada780ed46825f634a77bcd036bf56fc'
$branch = 'docs/codex-context-optimization-20261020'
$source = (git rev-parse --show-toplevel).Trim()
if ($LASTEXITCODE -ne 0 -or -not $source) { throw 'Run from the chemistry-lab Git repository.' }
$doc = Join-Path $source 'docs/CODEX_CONTEXT_BENCHMARK.md'
if (-not (Test-Path -LiteralPath $doc)) { throw "Benchmark spec missing: $doc" }
if (-not (Get-Command codex -ErrorAction SilentlyContinue)) { throw 'Codex CLI is not on PATH. No runs started.' }

$version = ((& codex --version) | Out-String).Trim()
$cliHelp = ((& codex exec --help) | Out-String)
foreach ($option in @('--json','--ephemeral','--sandbox','--output-last-message','--model','--config')) {
  if (-not $cliHelp.Contains($option)) { throw "Codex CLI $version does not advertise $option; stop and inspect compatibility." }
}

$prompts = @{}
$pending = $null
# Parse by ASCII task identifiers, not the Unicode punctuation in headings.
# Read the entire file as UTF-8 so the Vietnamese prompt text stays intact.
$spec = [IO.File]::ReadAllText($doc, [Text.Encoding]::UTF8)
foreach ($line in ($spec -split '\r?\n')) {
  if ($line -match '^###\s+(T[123])\b') { $pending = $Matches[1]; continue }
  if ($pending -and $line -match '^>\s+(.+)$') {
    $prompts[$pending] = $Matches[1]
    $pending = $null
  }
}
foreach ($task in @('T1','T2','T3')) {
  if (-not $prompts.ContainsKey($task)) { throw "Prompt $task missing from $doc; no runs started." }
}
if (-not $ResultsDirectory) {
  $ResultsDirectory = Join-Path (Split-Path -Parent $source) 'chemistry-bench-results'
}
$results = [IO.Path]::GetFullPath($ResultsDirectory)
$parent = Split-Path -Parent $source
$worktrees = @{
  A = @{ Path = (Join-Path $parent 'chemistry-bench-base'); Sha = $baseline }
  B = @{ Path = (Join-Path $parent 'chemistry-bench-candidate'); Sha = $candidate }
}
Write-Host "Codex $version; source $source"
Write-Host "Results outside repo: $results"
# Fetch only the fixed optimization branch. This does not checkout or reset the user's branch.
& git -C $source fetch origin $branch
if ($LASTEXITCODE -ne 0) { throw 'Git fetch failed. Nothing was checked out.' }
foreach ($kind in @('A','B')) {
  $wt = $worktrees[$kind]
  & git -C $source cat-file -e "$($wt.Sha)^{commit}"
  if ($LASTEXITCODE -ne 0) { throw "Missing commit $($wt.Sha). No benchmark should run." }
  if (-not (Test-Path -LiteralPath $wt.Path)) {
    & git -C $source worktree add --detach $wt.Path $wt.Sha
    if ($LASTEXITCODE -ne 0) { throw "Could not create worktree $($wt.Path)" }
  }
  $actual = ((& git -C $wt.Path rev-parse HEAD) | Out-String).Trim()
  if ($LASTEXITCODE -ne 0 -or $actual -ne $wt.Sha) {
    throw "Worktree $($wt.Path) is at $actual rather than required $($wt.Sha). Refusing to reset it."
  }
  $statusOutput = & git -C $wt.Path status --porcelain
  $statusExit = $LASTEXITCODE
  if ($statusExit -ne 0) { throw "Initial Git status failed for $($wt.Path) (exit $statusExit)." }
  $dirty = ($statusOutput | Out-String).Trim()
  if ($dirty) { throw "Worktree $($wt.Path) is dirty. Refusing to overwrite or benchmark it." }
}

New-Item -ItemType Directory -Path $results -Force | Out-Null
$metadata = [ordered]@{
  codex_version = $version
  model_requested = $Model
  reasoning_effort_requested = $ReasoningEffort
  effective_settings_verified = $false
  collected_at_utc = [DateTime]::UtcNow.ToString('o')
  source_repo = $source
  baseline_sha = $baseline
  candidate_sha = $candidate
  constraints = 'same local CLI/config; fresh ephemeral read-only runs; no runtime edits'
  note = 'Correctness and which documents were necessary require independent evaluation.'
}
$metadata | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $results 'metadata.json') -Encoding UTF8
$rows = New-Object System.Collections.Generic.List[object]

# Alternate order to reduce straightforward warm-up bias.
$sequence = @(
  @{ Task = 'T1'; Order = @('A','B') },
  @{ Task = 'T2'; Order = @('B','A') },
  @{ Task = 'T3'; Order = @('A','B') }
)
foreach ($test in $sequence) {
  foreach ($variant in $test.Order) {
    $task = $test.Task
    $wt = $worktrees[$variant]
    $stem = "$variant-$task"
    $eventFile = Join-Path $results "$stem.jsonl"
    $stderrFile = Join-Path $results "$stem.stderr.txt"
    $answerFile = Join-Path $results "$stem.answer.txt"
    Write-Host "Running $stem at $($wt.Sha.Substring(0,12)) ..."
    $watch = [Diagnostics.Stopwatch]::StartNew()
    Push-Location $wt.Path
    try {
      & codex exec --json --ephemeral --sandbox read-only --model $Model --config "model_reasoning_effort=$ReasoningEffort" --output-last-message $answerFile $prompts[$task] 1> $eventFile 2> $stderrFile
      $exit = $LASTEXITCODE
    } finally {
      Pop-Location
      $watch.Stop()
    }
    $usage = $null
    $toolIds = @{}
    $toolEvents = 0
    foreach ($line in ([IO.File]::ReadAllLines($eventFile))) {
      if (-not $line.Trim()) { continue }
      try { $event = $line | ConvertFrom-Json -ErrorAction Stop } catch { continue }
      # JSONL event shapes vary: thread.started / turn.started have no item,
      # and completion/usage fields are not present on every event.
      $eventType = if ($event.PSObject.Properties['type']) { [string]$event.type } else { '' }
      $usageProperty = $event.PSObject.Properties['usage']
      if ($eventType -eq 'turn.completed' -and $usageProperty) { $usage = $usageProperty.Value }
      $itemProperty = $event.PSObject.Properties['item']
      if ($itemProperty -and $null -ne $itemProperty.Value) {
        $item = $itemProperty.Value
        $itemTypeProperty = $item.PSObject.Properties['type']
        if ($itemTypeProperty -and $itemTypeProperty.Value -in @('command_execution','mcp_tool_call','web_search')) {
          $itemIdProperty = $item.PSObject.Properties['id']
          if ($itemIdProperty -and $itemIdProperty.Value) { $toolIds[[string]$itemIdProperty.Value] = $true }
          elseif ($eventType -eq 'item.completed') { $toolEvents++ }
        }
      }
    }
    $inputTokens = $null
    $outputTokens = $null
    $cachedTokens = $null
    if ($usage) {
      $inProp = $usage.PSObject.Properties['input_tokens']
      $outProp = $usage.PSObject.Properties['output_tokens']
      $cacheProp = $usage.PSObject.Properties['cached_input_tokens']
      if ($inProp) { $inputTokens = $inProp.Value }
      if ($outProp) { $outputTokens = $outProp.Value }
      if ($cacheProp) { $cachedTokens = $cacheProp.Value }
    }
    $statusOutput = & git -C $wt.Path status --porcelain
    $statusExit = $LASTEXITCODE
    if ($statusExit -ne 0) { throw "Post-run Git status failed for $stem (exit $statusExit); clean state not verified." }
    $changed = ($statusOutput | Out-String).Trim()
    $row = [pscustomobject]@{
      task = $task; variant = $variant; sha = $wt.Sha; codex_version = $version
      model_requested = $Model; reasoning_effort_requested = $ReasoningEffort
      exit_code = $exit; duration_seconds = [math]::Round($watch.Elapsed.TotalSeconds,2)
      input_tokens = $inputTokens; cached_input_tokens = $cachedTokens; output_tokens = $outputTokens
      tool_calls_observed = ($toolIds.Count + $toolEvents)
      working_tree_clean = (-not [bool]$changed)
      correctness = 'NOT_EVALUATED'
      event_log = $eventFile; answer = $answerFile
    }
    $rows.Add($row)
    $rows | Export-Csv -LiteralPath (Join-Path $results 'results.csv') -NoTypeInformation -Encoding UTF8
    Write-Host "$stem exit=$exit time=$($row.duration_seconds)s tokens-in=$inputTokens tokens-out=$outputTokens clean=$($row.working_tree_clean)"
    if ($changed) { throw "Unexpected working tree changes in $($wt.Path): $changed. Stopping." }
    if ($exit -ne 0) { throw "$stem failed with exit code $exit. Inspect $stderrFile. Stopping." }
  }
}
Write-Host "Finished 6 read-only runs. Inspect $(Join-Path $results 'results.csv') and the six answers."
Write-Host 'Codex accuracy and context relevance MUST still be reviewed; script does not issue a PASS.'
