<#
.SYNOPSIS
    Make the PyQuest stack start at sign-in, and let the learner's laptop reach it.

.DESCRIPTION
    Two jobs, and only the second needs administrator:

      1. A shortcut to infra\autostart.cmd in the current user's Startup folder.
         Runs minimized at sign-in. Needs no elevation.

      2. Inbound Windows Firewall rules for the ports the LAN must reach.
         Needs elevation, and without them the stack runs perfectly and the
         learner's laptop cannot see it -- Docker binds 0.0.0.0 correctly and
         Windows drops the packet, so everything looks healthy from this desk.

    WHY THE STARTUP FOLDER AND NOT A SCHEDULED TASK

    A scheduled task buys a hidden window and a Last Run Result, and costs a
    principal, a settings object and an uninstall path. autostart.cmd already
    waits for the Docker daemon itself, so the task's start delay is redundant,
    and infra\logs\autostart.log is a better record than Last Run Result. The
    Startup folder is also visible to a person wondering why this machine does
    things: one place to look, one file to delete.

    WHY SIGN-IN AND NOT BOOT

    Docker Desktop is a desktop application; it starts when a user signs in.
    Anything triggered at boot would poll a daemon that is never coming. §6.4's
    availability is an arrangement -- the machine stays on, signed in, locked --
    so the goal is that nothing has to be TYPED, not that nobody has to sign in.

    WHICH PORTS, AND WHY NOT 3081

    3082 (the SPA) and Gitea's two. NOT the api: `web` is the api's front door
    now (apps/web/Caddyfile proxies /api/* to api:3081 over the Docker network),
    so compose binds 3081 to loopback and nothing off this machine needs it.
    Ports are read from infra\.env so they cannot drift from what compose
    publishes.

.PARAMETER Uninstall
    Remove the shortcut and the firewall rules.

.PARAMETER SkipFirewall
    Do the Startup shortcut only. Use when you are not elevated and just want
    the autostart half.

.EXAMPLE
    powershell -NoProfile -ExecutionPolicy Bypass -File .\install-autostart.ps1

.EXAMPLE
    powershell -NoProfile -ExecutionPolicy Bypass -File .\install-autostart.ps1 -Uninstall
#>
[CmdletBinding()]
param(
    [switch]$Uninstall,
    [switch]$SkipFirewall
)

$ErrorActionPreference = 'Stop'

$InfraDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$AutostartCmd = Join-Path $InfraDir 'autostart.cmd'
$EnvFile = Join-Path $InfraDir '.env'

$StartupDir = [Environment]::GetFolderPath('Startup')
$ShortcutPath = Join-Path $StartupDir 'PyQuest stack.lnk'

$RuleGroup = 'PyQuest'

function Write-Step { param([string]$Text) Write-Host ''; Write-Host "=== $Text ===" }
function Write-Ok { param([string]$Text) Write-Host "  OK    $Text" }
function Write-Skip { param([string]$Text) Write-Host "  SKIP  $Text" }
function Write-Warn { param([string]$Text) Write-Host "  WARN  $Text" }

function Test-Elevated {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

<#
    The ports compose actually publishes, read from the same .env compose reads.

    A hardcoded list here would be correct until the day somebody changes a port
    to dodge a collision -- which has already happened once in this stack:
    POSTGRES_PORT is 5433 because 5432 was taken. Firewall rules that quietly
    describe the wrong ports are worse than none, because the stack then looks
    configured.
#>
function Get-EnvPort {
    param([string]$Name, [int]$Default)

    if (-not (Test-Path $EnvFile)) { return $Default }

    $line = Select-String -Path $EnvFile -Pattern "^\s*$Name\s*=" -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if ($null -eq $line) { return $Default }

    $value = ($line.Line -split '=', 2)[1].Trim().Trim('"').Trim("'")
    $parsed = 0
    if ([int]::TryParse($value, [ref]$parsed) -and $parsed -gt 0) { return $parsed }
    return $Default
}

# -----------------------------------------------------------------------------
# Preflight
# -----------------------------------------------------------------------------
if (-not (Test-Path $AutostartCmd)) {
    throw "autostart.cmd not found beside this script ($AutostartCmd). Run it from infra\."
}

<#
    The shortcut must target the CANONICAL checkout, not wherever this script
    happens to be running from.

    This exists because the mistake was made rather than imagined: the first run
    of this script wrote a Startup shortcut pointing into
    .claude/worktrees/autostart, a directory deleted the moment its branch
    merges. The shortcut survives, the target does not, and the failure arrives
    weeks later as "the stack stopped starting" with nothing on screen to
    explain it.

    Refusing to run from a worktree was the first fix and it was the wrong one:
    it blocks a legitimate case (installing while the main checkout is busy on
    another branch) to prevent a bad path. Resolving the path is strictly
    better. In a linked worktree `git rev-parse --git-common-dir` points at the
    MAIN checkout's .git, so its parent is the directory the shortcut wants --
    and that directory holds infra\autostart.cmd on every branch that has it.

    Verified either way by the Test-Path below: a target that does not exist is
    refused rather than written, which is the property that actually matters.
#>
$RepoRoot = Split-Path -Parent $InfraDir

$canonicalRoot = $RepoRoot
try {
    $common = & git -C $RepoRoot rev-parse --path-format=absolute --git-common-dir 2>$null
    if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($common)) {
        $canonicalRoot = Split-Path -Parent ($common.Trim())
    }
}
catch {
    # No git on PATH, or not a repository. The script's own location is then the
    # only answer available, and the Test-Path below still vets it.
    $canonicalRoot = $RepoRoot
}

if ($canonicalRoot -ne $RepoRoot) {
    Write-Host ''
    Write-Host '  NOTE: running from a git worktree.'
    Write-Host "    here       $RepoRoot"
    Write-Host "    shortcut   $canonicalRoot"
    Write-Host '  The shortcut targets the main checkout, which outlives this branch.'
    $InfraDir = Join-Path $canonicalRoot 'infra'
    $AutostartCmd = Join-Path $InfraDir 'autostart.cmd'
    $EnvFile = Join-Path $InfraDir '.env'
}

if (-not (Test-Path $AutostartCmd)) {
    Write-Host ''
    Write-Host "  REFUSED: no autostart.cmd at $AutostartCmd"
    Write-Host '  A Startup shortcut to a file that does not exist fails silently at every sign-in.'
    Write-Host ''
    exit 2
}

$elevated = Test-Elevated

Write-Host ''
Write-Host 'PyQuest autostart installer'
Write-Host "  repo        $(Split-Path -Parent $InfraDir)"
Write-Host "  user        $env:USERNAME"
Write-Host "  elevated    $elevated"
Write-Host "  startup     $StartupDir"

# The Startup folder belongs to whoever is running this. Elevating with a
# DIFFERENT account would write the shortcut into that account's Startup folder,
# where it would never run for the person who actually signs in. Printing the
# path above is what makes that visible rather than mysterious.

# -----------------------------------------------------------------------------
# 1. The Startup shortcut
# -----------------------------------------------------------------------------
Write-Step 'Startup shortcut'

if ($Uninstall) {
    if (Test-Path $ShortcutPath) {
        Remove-Item $ShortcutPath -Force
        Write-Ok "removed $ShortcutPath"
    }
    else {
        Write-Skip 'no shortcut to remove'
    }
}
else {
    $shell = New-Object -ComObject WScript.Shell
    $lnk = $shell.CreateShortcut($ShortcutPath)
    $lnk.TargetPath = $AutostartCmd
    $lnk.WorkingDirectory = $InfraDir
    $lnk.WindowStyle = 7   # minimized; a boot script should not steal focus
    $lnk.Description = 'Bring the PyQuest stack up at sign-in (infra\autostart.cmd)'
    $lnk.Save()
    Write-Ok "created $ShortcutPath"
    Write-Ok "  -> $AutostartCmd (minimized)"
}

# -----------------------------------------------------------------------------
# 2. Firewall
# -----------------------------------------------------------------------------
Write-Step 'Firewall rules'

$webPort = Get-EnvPort -Name 'WEB_PORT' -Default 3082
$giteaHttp = Get-EnvPort -Name 'GITEA_HTTP_PORT' -Default 3080
$giteaSsh = Get-EnvPort -Name 'GITEA_SSH_PORT' -Default 3022

$rules = @(
    @{ Name = "PyQuest SPA ($webPort)"; Port = $webPort; Why = 'the learner opens the app here' },
    @{ Name = "PyQuest Gitea HTTP ($giteaHttp)"; Port = $giteaHttp; Why = 'clone and push over HTTP' },
    @{ Name = "PyQuest Gitea SSH ($giteaSsh)"; Port = $giteaSsh; Why = 'clone and push over SSH' }
)

if ($SkipFirewall) {
    Write-Skip '-SkipFirewall given'
}
elseif (-not $elevated) {
    Write-Warn 'not elevated - firewall rules were NOT created.'
    Write-Warn 'The stack will start at sign-in, but nothing off this machine can reach it.'
    Write-Host ''
    Write-Host '  Re-run from an elevated PowerShell:'
    Write-Host ''
    Write-Host "    powershell -NoProfile -ExecutionPolicy Bypass -File `"$($MyInvocation.MyCommand.Path)`""
    Write-Host ''
    exit 1
}
else {
    foreach ($rule in $rules) {
        # Remove-then-create rather than "create if absent": it makes a re-run
        # idempotent AND repairs a rule somebody edited by hand, which
        # create-if-absent silently leaves broken.
        $existing = Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue
        if ($null -ne $existing) { $existing | Remove-NetFirewallRule }

        if ($Uninstall) {
            Write-Ok "removed  $($rule.Name)"
            continue
        }

        New-NetFirewallRule `
            -DisplayName $rule.Name `
            -Group $RuleGroup `
            -Direction Inbound `
            -Action Allow `
            -Protocol TCP `
            -LocalPort $rule.Port `
            -Profile Private `
            -RemoteAddress LocalSubnet `
            -Description "PyQuest: $($rule.Why). Managed by infra\install-autostart.ps1." | Out-Null

        Write-Ok "allowed  TCP $($rule.Port)  - $($rule.Why)"
    }

    # Scoped deliberately. `-Profile Private` means the rule is inert on a
    # network Windows considers Public -- a coffee shop does not get the
    # household's Gitea -- and `-RemoteAddress LocalSubnet` keeps it to machines
    # on this network rather than anything that can route here.
    if (-not $Uninstall) {
        Write-Host '  (Private profile, local subnet only. The api on 3081 stays loopback-only'
        Write-Host '   on purpose: the SPA reaches it through the proxy on the port above.)'
    }
}

# -----------------------------------------------------------------------------
# What to check next
# -----------------------------------------------------------------------------
Write-Step 'Done'

if ($Uninstall) {
    Write-Host '  The stack no longer starts at sign-in and the LAN rules are gone.'
    Write-Host '  Running containers are untouched: docker compose --profile api --profile web down'
    exit 0
}

$lanAddress = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.IPAddress -notlike '127.*' -and $_.PrefixOrigin -ne 'WellKnown' } |
    Sort-Object -Property SkipAsSource, InterfaceMetric |
    Select-Object -First 1 -ExpandProperty IPAddress)

Write-Host '  Verify, in this order:'
Write-Host ''
Write-Host '    1. infra\autostart.cmd            - runs by hand, ends [OK]'
Write-Host "    2. http://localhost:$webPort              - the SPA, from this machine"
if ($lanAddress) {
    Write-Host "    3. http://${lanAddress}:$webPort   - the SPA, still from this machine, by address"
}
Write-Host '    4. reboot, sign in, touch nothing - the SPA answers within ~2 minutes'
Write-Host '    5. from the LEARNER''S laptop      - the step that cannot be faked from here'
Write-Host ''
Write-Host '  If step 5 fails on the .local name, the address from step 3 works with no'
Write-Host '  rebuild - the SPA derives the api from whatever host reached it. Pair a hosts'
Write-Host '  entry with a DHCP reservation, or the address in it goes stale.'
Write-Host ''
Write-Host "  Boot log: $(Join-Path $InfraDir 'logs\autostart.log')"
Write-Host ''
