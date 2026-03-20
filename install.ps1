#Requires -Version 5.1
<#
.SYNOPSIS
    oh-my-cursor installer for Windows.

.DESCRIPTION
    Install Team Avatar agent configurations for Cursor on Windows.
    PowerShell equivalent of install.sh.

.PARAMETER Scope
    Install scope: 'user' (default, ~/.cursor/) or 'project' (./.cursor/).

.PARAMETER Force
    Overwrite existing files.

.PARAMETER DryRun
    Show what would be done without making changes.

.PARAMETER Verbose
    Enable verbose output.

.PARAMETER Uninstall
    Remove installed agent and rule files.

.PARAMETER Disable
    Disable orchestration (rename rule so Cursor stops applying it).

.PARAMETER Enable
    Re-enable orchestration (rename rule back).

.PARAMETER AlsoClaude
    Also install to .claude/agents/ for Claude Code compatibility.

.PARAMETER AlsoCodex
    Also install to .codex/agents/ for Codex compatibility.

.PARAMETER NoSkills
    Skip installing bundled agent skills (skills are installed by default).

.EXAMPLE
    .\install.ps1
    # Install to user scope (default)

.EXAMPLE
    .\install.ps1 -Scope project
    # Install to project scope

.EXAMPLE
    .\install.ps1 -Force
    # Overwrite existing files

.EXAMPLE
    .\install.ps1 -DryRun
    # Preview changes

.EXAMPLE
    .\install.ps1 -Uninstall
    # Remove all components

.EXAMPLE
    irm https://raw.githubusercontent.com/tmcfarlane/oh-my-cursor/main/install.ps1 | iex
    # One-liner install from GitHub
#>

[CmdletBinding()]
param(
    [ValidateSet('user', 'project')]
    [string]$Scope = 'user',

    [switch]$Force,
    [switch]$DryRun,
    [switch]$Uninstall,
    [switch]$Disable,
    [switch]$Enable,
    [switch]$AlsoClaude,
    [switch]$AlsoCodex,
    [switch]$NoSkills
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

$VERSION = '0.2.0'
$CURSOR_MODE_LABEL = 'Team Avatar (Cursor 2.5+)'

$AGENT_FILES = @('aang.md', 'sokka.md', 'katara.md', 'zuko.md', 'toph.md', 'appa.md', 'momo.md', 'iroh.md')
$PROTOCOL_FILES = @('protocols/team-avatar.md')
$COMMAND_FILES = @('plan.md', 'build.md', 'search.md', 'fix.md', 'tasks.md', 'scout.md', 'cactus-juice.md', 'doc.md')
$HOOK_FILES = @('post-edit-lint.sh', 'pre-commit-check.sh')
$RULE_FILE = 'orchestrator.mdc'
$RULE_FILE_DISABLED = 'orchestrator.mdc.disabled'
$SKILL_DIRS = @(
    'architect'
    'codebase-search'
    'create-an-asset'
    'debugging'
    'design-patterns-implementation'
    'docs-write'
    'documentation-engineer'
    'documentation-writing'
    'exploring-codebases'
    'frontend-builder'
    'implementing-figma-designs'
    'mgrep-code-search'
    'planning'
    'refactoring'
    'refactoring-patterns'
    'technical-roadmap-planning'
    'vercel-composition-patterns'
    'vercel-react-best-practices'
    'web-design-guidelines'
)

$LEGACY_AGENT_FILES = @('atlas.md', 'explore.md', 'generalPurpose.md', 'hephaestus.md', 'librarian.md', 'metis.md', 'momus.md', 'multimodal-looker.md', 'oracle.md', 'prometheus.md', 'sisyphus.md')
$LEGACY_PROTOCOL_FILES = @('protocols/swarm-coordinator.md')

$SOURCE_BASE_URL_DEFAULT = 'https://raw.githubusercontent.com/tmcfarlane/oh-my-cursor/main'
$SourceBaseUrl = if ($env:OH_MY_CURSOR_SOURCE_BASE_URL) { $env:OH_MY_CURSOR_SOURCE_BASE_URL } else { $SOURCE_BASE_URL_DEFAULT }

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

function Write-Log {
    param([string]$Message)
    Write-Host $Message
}

function Write-LogVerbose {
    param([string]$Message)
    if ($VerbosePreference -ne 'SilentlyContinue') {
        Write-Host $Message -ForegroundColor DarkGray
    }
}

function Get-ScriptDir {
    if ($PSScriptRoot) {
        return $PSScriptRoot
    }
    return $null
}

# ---------------------------------------------------------------------------
# Directory resolution
# ---------------------------------------------------------------------------

function Resolve-InstallDirs {
    param([string]$InstallScope)

    if ($InstallScope -eq 'user') {
        $cursorDir = Join-Path $HOME '.cursor'
    }
    else {
        $cursorDir = Join-Path '.' '.cursor'
    }

    return @{
        CursorDir   = $cursorDir
        AgentsDir   = Join-Path $cursorDir 'agents'
        RulesDir    = Join-Path $cursorDir 'rules'
        CommandsDir = Join-Path $cursorDir 'commands'
        HooksDir    = Join-Path $cursorDir 'hooks'
        SkillsDir   = Join-Path $cursorDir 'skills'
    }
}

# ---------------------------------------------------------------------------
# Toggle orchestration rule
# ---------------------------------------------------------------------------

function Set-OrchestratorRule {
    param(
        [hashtable]$Dirs,
        [bool]$DisableRule,
        [bool]$IsDryRun
    )

    $rulePath = Join-Path $Dirs.RulesDir $RULE_FILE
    $disabledPath = Join-Path $Dirs.RulesDir $RULE_FILE_DISABLED

    Write-Host "oh-my-cursor v${VERSION}" -ForegroundColor White
    Write-Host $CURSOR_MODE_LABEL -ForegroundColor DarkGray
    Write-Host ''

    if ($DisableRule) {
        if (Test-Path $rulePath) {
            if ($IsDryRun) {
                Write-Host "  [would disable] ${RULE_FILE} in $($Dirs.RulesDir)" -ForegroundColor Yellow
            }
            else {
                Move-Item -Path $rulePath -Destination $disabledPath -Force
                Write-Host "  [disabled] ${RULE_FILE} - orchestration off. Agents and commands still available." -ForegroundColor Green
            }
        }
        else {
            if (Test-Path $disabledPath) {
                Write-Host "  Already disabled (${RULE_FILE_DISABLED} present)" -ForegroundColor DarkGray
            }
            else {
                Write-Host "  No rule file found at ${rulePath}" -ForegroundColor Yellow
            }
        }
    }
    else {
        if (Test-Path $disabledPath) {
            if ($IsDryRun) {
                Write-Host "  [would enable] ${RULE_FILE} in $($Dirs.RulesDir)" -ForegroundColor Yellow
            }
            else {
                Move-Item -Path $disabledPath -Destination $rulePath -Force
                Write-Host "  [enabled] ${RULE_FILE} - Team Avatar orchestration on." -ForegroundColor Green
            }
        }
        else {
            if (Test-Path $rulePath) {
                Write-Host "  Already enabled (${RULE_FILE} present)" -ForegroundColor DarkGray
            }
            else {
                Write-Host "  No disabled rule found at ${disabledPath}" -ForegroundColor Yellow
            }
        }
    }

    Write-Host ''
}

# ---------------------------------------------------------------------------
# Source file acquisition
# ---------------------------------------------------------------------------

function Copy-SourcesFromLocalRepo {
    param([string]$OutDir)

    $scriptDir = Get-ScriptDir
    if (-not $scriptDir) { return $false }
    if (-not (Test-Path (Join-Path $scriptDir 'agents'))) { return $false }
    if (-not (Test-Path (Join-Path $scriptDir 'rules'))) { return $false }

    try {
        foreach ($file in $AGENT_FILES) {
            Copy-Item (Join-Path $scriptDir 'agents' $file) (Join-Path $OutDir $file) -Force
        }

        foreach ($file in $PROTOCOL_FILES) {
            $destSubDir = Join-Path $OutDir (Split-Path $file -Parent)
            if (-not (Test-Path $destSubDir)) { New-Item -ItemType Directory -Path $destSubDir -Force | Out-Null }
            Copy-Item (Join-Path $scriptDir 'agents' $file) (Join-Path $OutDir $file) -Force
        }

        Copy-Item (Join-Path $scriptDir 'rules' $RULE_FILE) (Join-Path $OutDir $RULE_FILE) -Force

        $cmdSrcDir = Join-Path $scriptDir 'commands'
        if (Test-Path $cmdSrcDir) {
            $cmdOutDir = Join-Path $OutDir 'commands'
            if (-not (Test-Path $cmdOutDir)) { New-Item -ItemType Directory -Path $cmdOutDir -Force | Out-Null }
            foreach ($file in $COMMAND_FILES) {
                Copy-Item (Join-Path $cmdSrcDir $file) (Join-Path $cmdOutDir $file) -Force
            }
        }

        $hooksSrcDir = Join-Path $scriptDir 'hooks'
        if (Test-Path $hooksSrcDir) {
            $hooksOutDir = Join-Path $OutDir 'hooks'
            if (-not (Test-Path $hooksOutDir)) { New-Item -ItemType Directory -Path $hooksOutDir -Force | Out-Null }
            foreach ($file in $HOOK_FILES) {
                Copy-Item (Join-Path $hooksSrcDir $file) (Join-Path $hooksOutDir $file) -Force
            }
        }

        $skillsSrcDir = Join-Path $scriptDir 'skills'
        if (Test-Path $skillsSrcDir) {
            Copy-Item $skillsSrcDir (Join-Path $OutDir 'skills') -Recurse -Force
        }

        return $true
    }
    catch {
        return $false
    }
}

function Get-SourcesFromGitHub {
    param([string]$OutDir)

    try {
        foreach ($file in $AGENT_FILES) {
            $url = "${SourceBaseUrl}/agents/${file}"
            Invoke-WebRequest -Uri $url -OutFile (Join-Path $OutDir $file) -UseBasicParsing
        }

        foreach ($file in $PROTOCOL_FILES) {
            $destSubDir = Join-Path $OutDir (Split-Path $file -Parent)
            if (-not (Test-Path $destSubDir)) { New-Item -ItemType Directory -Path $destSubDir -Force | Out-Null }
            $url = "${SourceBaseUrl}/agents/${file}"
            Invoke-WebRequest -Uri $url -OutFile (Join-Path $OutDir $file) -UseBasicParsing
        }

        $url = "${SourceBaseUrl}/rules/${RULE_FILE}"
        Invoke-WebRequest -Uri $url -OutFile (Join-Path $OutDir $RULE_FILE) -UseBasicParsing

        $cmdOutDir = Join-Path $OutDir 'commands'
        if (-not (Test-Path $cmdOutDir)) { New-Item -ItemType Directory -Path $cmdOutDir -Force | Out-Null }
        foreach ($file in $COMMAND_FILES) {
            $url = "${SourceBaseUrl}/commands/${file}"
            Invoke-WebRequest -Uri $url -OutFile (Join-Path $cmdOutDir $file) -UseBasicParsing
        }

        $hooksOutDir = Join-Path $OutDir 'hooks'
        if (-not (Test-Path $hooksOutDir)) { New-Item -ItemType Directory -Path $hooksOutDir -Force | Out-Null }
        foreach ($file in $HOOK_FILES) {
            $url = "${SourceBaseUrl}/hooks/${file}"
            Invoke-WebRequest -Uri $url -OutFile (Join-Path $hooksOutDir $file) -UseBasicParsing
        }

        # Download skills via MANIFEST
        $manifestUrl = "${SourceBaseUrl}/skills/MANIFEST"
        $manifestTmpBase = if ($env:TEMP) { $env:TEMP } elseif ($env:TMPDIR) { $env:TMPDIR } else { '/tmp' }
        $manifestTmp = Join-Path $manifestTmpBase "oh-my-cursor-manifest-$([guid]::NewGuid().ToString('N').Substring(0, 8))"
        try {
            Invoke-WebRequest -Uri $manifestUrl -OutFile $manifestTmp -UseBasicParsing
            $skillsOutDir = Join-Path $OutDir 'skills'
            if (-not (Test-Path $skillsOutDir)) { New-Item -ItemType Directory -Path $skillsOutDir -Force | Out-Null }
            $manifestLines = Get-Content $manifestTmp
            foreach ($skillFile in $manifestLines) {
                if ([string]::IsNullOrWhiteSpace($skillFile)) { continue }
                $skillFileDir = Join-Path $skillsOutDir (Split-Path $skillFile -Parent)
                if (-not (Test-Path $skillFileDir)) { New-Item -ItemType Directory -Path $skillFileDir -Force | Out-Null }
                try {
                    Invoke-WebRequest -Uri "${SourceBaseUrl}/skills/${skillFile}" -OutFile (Join-Path $skillsOutDir $skillFile) -UseBasicParsing
                }
                catch {
                    # Non-fatal: individual skill file download failure
                }
            }
            Copy-Item $manifestTmp (Join-Path $skillsOutDir 'MANIFEST') -Force
        }
        catch {
            # MANIFEST not available, skip skills
        }
        finally {
            if (Test-Path $manifestTmp) { Remove-Item $manifestTmp -Force -ErrorAction SilentlyContinue }
        }

        return $true
    }
    catch {
        return $false
    }
}

function New-SourceFiles {
    param([string]$Dir)

    if (-not (Test-Path $Dir)) {
        New-Item -ItemType Directory -Path $Dir -Force | Out-Null
    }

    if (Copy-SourcesFromLocalRepo -OutDir $Dir) {
        Write-LogVerbose 'Using local repo sources'
        return
    }

    if (Get-SourcesFromGitHub -OutDir $Dir) {
        Write-LogVerbose "Downloaded sources from ${SourceBaseUrl}"
        return
    }

    Write-Host 'Failed to acquire source files.' -ForegroundColor Red
    Write-Host 'Tried local repo checkout and GitHub raw download.' -ForegroundColor DarkGray
    Write-Host 'Override the download base with $env:OH_MY_CURSOR_SOURCE_BASE_URL=...' -ForegroundColor DarkGray
    throw 'Source acquisition failed'
}

# ---------------------------------------------------------------------------
# Install a set of files from src_dir to dest_dir
# ---------------------------------------------------------------------------

function Install-FileSet {
    param(
        [string]$SrcDir,
        [string]$DestDir,
        [string]$Label,
        [string[]]$Files,
        [bool]$IsForce,
        [bool]$IsDryRun
    )

    if ($Files.Count -eq 0) { return }

    if (-not $IsDryRun) {
        if (-not (Test-Path $DestDir)) { New-Item -ItemType Directory -Path $DestDir -Force | Out-Null }
    }

    Write-Host "Installing ${Label} to ${DestDir}" -ForegroundColor White
    Write-Host ''

    foreach ($file in $Files) {
        $src = Join-Path $SrcDir $file
        $dest = Join-Path $DestDir $file

        if (-not (Test-Path $src)) {
            Write-LogVerbose "  [skip] ${file} (source not found)"
            continue
        }

        $destSubDir = Split-Path $dest -Parent
        if (-not $IsDryRun -and -not (Test-Path $destSubDir)) {
            New-Item -ItemType Directory -Path $destSubDir -Force | Out-Null
        }

        if (-not (Test-Path $dest)) {
            if ($IsDryRun) {
                Write-Host "  [new] ${file}" -ForegroundColor Green
            }
            else {
                try {
                    Copy-Item $src $dest -Force
                    Write-Host "  [installed] ${file}" -ForegroundColor Green
                }
                catch {
                    Write-Host "  [failed] ${file}" -ForegroundColor Red
                    continue
                }
            }
        }
        elseif ((Get-FileHash $src).Hash -eq (Get-FileHash $dest).Hash) {
            Write-Host "  [unchanged] ${file}" -ForegroundColor DarkGray
        }
        elseif ($IsForce) {
            if ($IsDryRun) {
                Write-Host "  [update] ${file}" -ForegroundColor Yellow
            }
            else {
                try {
                    Copy-Item $src $dest -Force
                    Write-Host "  [updated] ${file}" -ForegroundColor Yellow
                }
                catch {
                    Write-Host "  [failed] ${file}" -ForegroundColor Red
                    continue
                }
            }
        }
        else {
            Write-Host "  [skipped] ${file} (use -Force to overwrite)" -ForegroundColor Yellow
        }
    }

    Write-Host ''
}

# ---------------------------------------------------------------------------
# Migrate legacy agent files (Greek mythology -> ATLA)
# ---------------------------------------------------------------------------

function Remove-LegacyAgents {
    param(
        [string]$AgentsDir,
        [bool]$IsDryRun
    )

    $migrated = 0

    foreach ($file in $LEGACY_AGENT_FILES) {
        $target = Join-Path $AgentsDir $file
        if (Test-Path $target) {
            if ($IsDryRun) {
                Write-Host "  [migrate] removing legacy ${file}" -ForegroundColor Yellow
            }
            else {
                Remove-Item $target -Force
                Write-Host "  [migrated] removed legacy ${file}" -ForegroundColor Yellow
            }
            $migrated++
        }
    }

    foreach ($file in $LEGACY_PROTOCOL_FILES) {
        $target = Join-Path $AgentsDir $file
        if (Test-Path $target) {
            if ($IsDryRun) {
                Write-Host "  [migrate] removing legacy ${file}" -ForegroundColor Yellow
            }
            else {
                Remove-Item $target -Force
                Write-Host "  [migrated] removed legacy ${file}" -ForegroundColor Yellow
            }
            $migrated++
        }
    }

    if ($migrated -gt 0) {
        Write-Host ''
        Write-Host '  Migrated from v0.1 (Greek mythology) to v0.2 (Team Avatar)' -ForegroundColor Yellow
        Write-Host ''
    }
}

# ---------------------------------------------------------------------------
# Install to a specific tool directory (cursor, claude, or codex)
# ---------------------------------------------------------------------------

function Install-ToDir {
    param(
        [string]$TargetDir,
        [string]$WorkDir,
        [bool]$IsForce,
        [bool]$IsDryRun
    )

    $agentsDir = Join-Path $TargetDir 'agents'
    $rulesDir = Join-Path $TargetDir 'rules'
    $commandsDir = Join-Path $TargetDir 'commands'
    $hooksDir = Join-Path $TargetDir 'hooks'

    Remove-LegacyAgents -AgentsDir $agentsDir -IsDryRun $IsDryRun

    Install-FileSet -SrcDir $WorkDir -DestDir $agentsDir -Label 'agents' -Files $AGENT_FILES -IsForce $IsForce -IsDryRun $IsDryRun
    Install-FileSet -SrcDir $WorkDir -DestDir $agentsDir -Label 'protocols' -Files $PROTOCOL_FILES -IsForce $IsForce -IsDryRun $IsDryRun
    Install-FileSet -SrcDir (Join-Path $WorkDir 'commands') -DestDir $commandsDir -Label 'commands' -Files $COMMAND_FILES -IsForce $IsForce -IsDryRun $IsDryRun
    Install-FileSet -SrcDir (Join-Path $WorkDir 'hooks') -DestDir $hooksDir -Label 'hooks' -Files $HOOK_FILES -IsForce $IsForce -IsDryRun $IsDryRun

    # Install rule file
    Write-Host "Installing rules to ${rulesDir}" -ForegroundColor White
    Write-Host ''

    if (-not $IsDryRun -and -not (Test-Path $rulesDir)) {
        New-Item -ItemType Directory -Path $rulesDir -Force | Out-Null
    }

    $src = Join-Path $WorkDir $RULE_FILE
    $dest = Join-Path $rulesDir $RULE_FILE

    if (-not (Test-Path $dest)) {
        if ($IsDryRun) {
            Write-Host "  [new] ${RULE_FILE}" -ForegroundColor Green
        }
        else {
            try {
                Copy-Item $src $dest -Force
                Write-Host "  [installed] ${RULE_FILE}" -ForegroundColor Green
            }
            catch {
                Write-Host "  [failed] ${RULE_FILE}" -ForegroundColor Red
            }
        }
    }
    elseif ((Get-FileHash $src).Hash -eq (Get-FileHash $dest).Hash) {
        Write-Host "  [unchanged] ${RULE_FILE}" -ForegroundColor DarkGray
    }
    elseif ($IsForce) {
        if ($IsDryRun) {
            Write-Host "  [update] ${RULE_FILE}" -ForegroundColor Yellow
        }
        else {
            try {
                Copy-Item $src $dest -Force
                Write-Host "  [updated] ${RULE_FILE}" -ForegroundColor Yellow
            }
            catch {
                Write-Host "  [failed] ${RULE_FILE}" -ForegroundColor Red
            }
        }
    }
    else {
        Write-Host "  [skipped] ${RULE_FILE} (use -Force to overwrite)" -ForegroundColor Yellow
    }

    Write-Host ''
}

# ---------------------------------------------------------------------------
# Skills installation
# ---------------------------------------------------------------------------

function Install-Skills {
    param(
        [string]$WorkDir,
        [string]$SkillsDir,
        [bool]$IsForce,
        [bool]$IsDryRun
    )

    $srcSkillsDir = Join-Path $WorkDir 'skills'

    if (-not (Test-Path $srcSkillsDir)) {
        Write-Host 'Warning: bundled skills not found in work directory. Skipping.' -ForegroundColor Yellow
        Write-Host ''
        return
    }

    Write-Host "Installing skills to ${SkillsDir}" -ForegroundColor White
    Write-Host ''

    if (-not $IsDryRun -and -not (Test-Path $SkillsDir)) {
        New-Item -ItemType Directory -Path $SkillsDir -Force | Out-Null
    }

    foreach ($skill in $SKILL_DIRS) {
        $skillSrc = Join-Path $srcSkillsDir $skill
        $skillDest = Join-Path $SkillsDir $skill

        if (-not (Test-Path $skillSrc)) {
            Write-LogVerbose "  [skip] ${skill} (source not found)"
            continue
        }

        if (-not (Test-Path $skillDest)) {
            if ($IsDryRun) {
                Write-Host "  [new] ${skill}/" -ForegroundColor Green
            }
            else {
                Copy-Item $skillSrc $skillDest -Recurse -Force
                Write-Host "  [installed] ${skill}/" -ForegroundColor Green
            }
        }
        elseif (Compare-SkillDirs -SrcDir $skillSrc -DestDir $skillDest) {
            Write-Host "  [unchanged] ${skill}/" -ForegroundColor DarkGray
        }
        elseif ($IsForce) {
            if ($IsDryRun) {
                Write-Host "  [update] ${skill}/" -ForegroundColor Yellow
            }
            else {
                Remove-Item $skillDest -Recurse -Force
                Copy-Item $skillSrc $skillDest -Recurse -Force
                Write-Host "  [updated] ${skill}/" -ForegroundColor Yellow
            }
        }
        else {
            Write-Host "  [skipped] ${skill}/ (use -Force to overwrite)" -ForegroundColor Yellow
        }
    }

    Write-Host ''

    # Check for legacy skills location
    $legacySkillsDir = Join-Path $HOME '.agents' 'skills'
    if (Test-Path $legacySkillsDir) {
        $legacyCount = 0
        foreach ($skill in $SKILL_DIRS) {
            if (Test-Path (Join-Path $legacySkillsDir $skill)) { $legacyCount++ }
        }
        if ($legacyCount -gt 0) {
            Write-Host "Note: ${legacyCount} matching skill(s) found in ~/.agents/skills/ (legacy location)." -ForegroundColor DarkGray
            Write-Host "They show as 'Rules' in Cursor UI. The new installs in ~/.cursor/skills/ show as 'Skills'." -ForegroundColor DarkGray
            Write-Host 'You can safely delete ~/.agents/skills/ once verified.' -ForegroundColor DarkGray
            Write-Host ''
        }
    }
}

function Compare-SkillDirs {
    param(
        [string]$SrcDir,
        [string]$DestDir
    )

    $srcFiles = Get-ChildItem $SrcDir -Recurse -File | Where-Object { $_.Name -ne '.DS_Store' }
    $destFiles = Get-ChildItem $DestDir -Recurse -File | Where-Object { $_.Name -ne '.DS_Store' }

    if ($srcFiles.Count -ne $destFiles.Count) { return $false }

    foreach ($srcFile in $srcFiles) {
        $relativePath = $srcFile.FullName.Substring($SrcDir.Length)
        $destFile = Join-Path $DestDir $relativePath
        if (-not (Test-Path $destFile)) { return $false }
        if ((Get-FileHash $srcFile.FullName).Hash -ne (Get-FileHash $destFile).Hash) { return $false }
    }

    return $true
}

# ---------------------------------------------------------------------------
# Uninstall logic
# ---------------------------------------------------------------------------

function Uninstall-Agents {
    param(
        [hashtable]$Dirs,
        [bool]$IsDryRun
    )

    Write-Host "oh-my-cursor v${VERSION}" -ForegroundColor White
    Write-Host $CURSOR_MODE_LABEL -ForegroundColor DarkGray
    Write-Host ''

    if ($IsDryRun) {
        Write-Host 'Dry run mode -- no changes will be made' -ForegroundColor Yellow
        Write-Host ''
    }

    $removed = 0

    Write-Host "Removing agents from $($Dirs.AgentsDir)" -ForegroundColor White
    Write-Host ''

    foreach ($file in ($AGENT_FILES + $LEGACY_AGENT_FILES)) {
        $target = Join-Path $Dirs.AgentsDir $file
        if (Test-Path $target) {
            if ($IsDryRun) {
                Write-Host "  [remove] ${file}" -ForegroundColor Red
            }
            else {
                Remove-Item $target -Force
                Write-Host "  [removed] ${file}" -ForegroundColor Red
            }
            $removed++
        }
    }

    foreach ($file in ($PROTOCOL_FILES + $LEGACY_PROTOCOL_FILES)) {
        $target = Join-Path $Dirs.AgentsDir $file
        if (Test-Path $target) {
            if ($IsDryRun) {
                Write-Host "  [remove] ${file}" -ForegroundColor Red
            }
            else {
                Remove-Item $target -Force
                Write-Host "  [removed] ${file}" -ForegroundColor Red
            }
            $removed++
        }
    }

    $protocolsDir = Join-Path $Dirs.AgentsDir 'protocols'
    if (-not $IsDryRun -and (Test-Path $protocolsDir)) {
        $remaining = Get-ChildItem $protocolsDir -ErrorAction SilentlyContinue
        if (-not $remaining -or $remaining.Count -eq 0) {
            Remove-Item $protocolsDir -Force -ErrorAction SilentlyContinue
        }
    }

    Write-Host ''
    Write-Host "Removing commands from $($Dirs.CommandsDir)" -ForegroundColor White
    Write-Host ''

    foreach ($file in $COMMAND_FILES) {
        $target = Join-Path $Dirs.CommandsDir $file
        if (Test-Path $target) {
            if ($IsDryRun) {
                Write-Host "  [remove] ${file}" -ForegroundColor Red
            }
            else {
                Remove-Item $target -Force
                Write-Host "  [removed] ${file}" -ForegroundColor Red
            }
            $removed++
        }
    }

    Write-Host ''
    Write-Host "Removing hooks from $($Dirs.HooksDir)" -ForegroundColor White
    Write-Host ''

    foreach ($file in $HOOK_FILES) {
        $target = Join-Path $Dirs.HooksDir $file
        if (Test-Path $target) {
            if ($IsDryRun) {
                Write-Host "  [remove] ${file}" -ForegroundColor Red
            }
            else {
                Remove-Item $target -Force
                Write-Host "  [removed] ${file}" -ForegroundColor Red
            }
            $removed++
        }
    }

    Write-Host ''
    Write-Host "Removing rules from $($Dirs.RulesDir)" -ForegroundColor White
    Write-Host ''

    $target = Join-Path $Dirs.RulesDir $RULE_FILE
    if (Test-Path $target) {
        if ($IsDryRun) {
            Write-Host "  [remove] ${RULE_FILE}" -ForegroundColor Red
        }
        else {
            Remove-Item $target -Force
            Write-Host "  [removed] ${RULE_FILE}" -ForegroundColor Red
        }
        $removed++
    }

    $target = Join-Path $Dirs.RulesDir $RULE_FILE_DISABLED
    if (Test-Path $target) {
        if ($IsDryRun) {
            Write-Host "  [remove] ${RULE_FILE_DISABLED}" -ForegroundColor Red
        }
        else {
            Remove-Item $target -Force
            Write-Host "  [removed] ${RULE_FILE_DISABLED}" -ForegroundColor Red
        }
        $removed++
    }

    Write-Host ''
    Write-Host "Removing skills from $($Dirs.SkillsDir)" -ForegroundColor White
    Write-Host ''

    foreach ($skill in $SKILL_DIRS) {
        $skillDir = Join-Path $Dirs.SkillsDir $skill
        if (Test-Path $skillDir) {
            if ($IsDryRun) {
                Write-Host "  [remove] ${skill}/" -ForegroundColor Red
            }
            else {
                Remove-Item $skillDir -Recurse -Force
                Write-Host "  [removed] ${skill}/" -ForegroundColor Red
            }
            $removed++
        }
    }

    Write-Host ''
    Write-Host 'Summary' -ForegroundColor White
    Write-Host "  Mode: ${CURSOR_MODE_LABEL}" -ForegroundColor DarkGray
    if ($removed -gt 0) {
        Write-Host "  Removed: ${removed}" -ForegroundColor Red
    }
    else {
        Write-Host '  Nothing to remove' -ForegroundColor DarkGray
    }
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

function Main {
    if ($Disable -and $Enable) {
        Write-Host 'Cannot use -Disable and -Enable together.' -ForegroundColor Red
        exit 1
    }

    $dirs = Resolve-InstallDirs -InstallScope $Scope

    if ($Disable -or $Enable) {
        Set-OrchestratorRule -Dirs $dirs -DisableRule $Disable.IsPresent -IsDryRun $DryRun.IsPresent
        return
    }

    if ($Uninstall) {
        Uninstall-Agents -Dirs $dirs -IsDryRun $DryRun.IsPresent
        return
    }

    $tempBase = if ($env:TEMP) { $env:TEMP } elseif ($env:TMPDIR) { $env:TMPDIR } else { '/tmp' }
    $workDir = Join-Path $tempBase "oh-my-cursor-$([guid]::NewGuid().ToString('N').Substring(0, 8))"

    try {
        Write-Host "oh-my-cursor v${VERSION}" -ForegroundColor White
        Write-Host $CURSOR_MODE_LABEL -ForegroundColor DarkGray
        Write-Host ''

        if ($DryRun) {
            Write-Host 'Dry run mode -- no changes will be made' -ForegroundColor Yellow
            Write-Host ''
        }

        Write-LogVerbose "Scope: ${Scope}"
        Write-LogVerbose "Target: $($dirs.CursorDir)"
        Write-LogVerbose "Force: ${Force}"

        New-SourceFiles -Dir $workDir

        # Install to cursor dir
        Write-Host "Installing to $($dirs.CursorDir)" -ForegroundColor White
        Write-Host ''
        Install-ToDir -TargetDir $dirs.CursorDir -WorkDir $workDir -IsForce $Force.IsPresent -IsDryRun $DryRun.IsPresent

        if ($AlsoClaude) {
            $claudeDir = if ($Scope -eq 'user') { Join-Path $HOME '.claude' } else { Join-Path '.' '.claude' }
            Write-Host "Also installing to ${claudeDir} (Claude Code compatibility)" -ForegroundColor DarkGray
            Write-Host ''
            Install-ToDir -TargetDir $claudeDir -WorkDir $workDir -IsForce $Force.IsPresent -IsDryRun $DryRun.IsPresent
        }

        if ($AlsoCodex) {
            $codexDir = if ($Scope -eq 'user') { Join-Path $HOME '.codex' } else { Join-Path '.' '.codex' }
            Write-Host "Also installing to ${codexDir} (Codex compatibility)" -ForegroundColor DarkGray
            Write-Host ''
            Install-ToDir -TargetDir $codexDir -WorkDir $workDir -IsForce $Force.IsPresent -IsDryRun $DryRun.IsPresent
        }

        if (-not $NoSkills) {
            Install-Skills -WorkDir $workDir -SkillsDir $dirs.SkillsDir -IsForce $Force.IsPresent -IsDryRun $DryRun.IsPresent
        }

        Write-Host 'Summary' -ForegroundColor White
        Write-Host "  Mode: ${CURSOR_MODE_LABEL}" -ForegroundColor DarkGray
        if (-not $NoSkills) {
            Write-Host "  Agents: $($AGENT_FILES.Count) | Commands: $($COMMAND_FILES.Count) | Hooks: $($HOOK_FILES.Count) | Skills: $($SKILL_DIRS.Count)" -ForegroundColor Green
        }
        else {
            Write-Host "  Agents: $($AGENT_FILES.Count) | Commands: $($COMMAND_FILES.Count) | Hooks: $($HOOK_FILES.Count) | Skills: skipped" -ForegroundColor Green
        }
        Write-Host ''
    }
    finally {
        if (Test-Path $workDir) {
            Remove-Item $workDir -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

Main
