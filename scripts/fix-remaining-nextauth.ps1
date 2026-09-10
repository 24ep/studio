# Fix remaining NextAuth imports
$files = @(
    "src/app/api/users/sync-ad/route.ts",
    "src/app/api/users/route.ts",
    "src/app/api/upload-queue/upload-file/route.ts",
    "src/app/api/upload-queue/blocking-process/route.ts",
    "src/app/api/upload-queue/route.ts",
    "src/app/api/upload-queue/blocking-process.ts",
    "src/app/api/auth/validate-session/route.ts",
    "src/app/api/auth/clear-user-cache/route.ts",
    "src/app/api/settings/webhooks/[id]/route.ts",
    "src/app/api/realtime/notifications/[id]/read/route.ts",
    "src/app/api/positions/[id]/personality-traits/[assignmentId]/route.ts",
    "src/app/api/positions/[id]/interviewers/[userId]/route.ts",
    "src/app/api/positions/[id]/expertise-skills/[assignmentId]/route.ts",
    "src/app/api/positions/[id]/expertise-skills/route.ts",
    "src/app/api/positions/[id]/personality-traits/route.ts",
    "src/app/api/applicants/[id]/export/route.ts",
    "src/app/api/applicants/[id]/avatar/route.ts",
    "src/app/api/positions/[id]/route.ts",
    "src/app/api/applicants/[id]/route.ts",
    "src/app/api/upload-queue/[id]/file/route.ts",
    "src/app/api/settings/custom-field-definitions/[id]/route.ts",
    "src/app/api/settings/recruitment-stages/[id]/route.ts",
    "src/app/api/settings/recruitment-stages/[id]/move/route.ts",
    "src/app/api/settings/recruitment-stages/[id]/migrate/route.ts",
    "src/app/api/settings/user-groups/[id]/route.ts",
    "src/app/api/transitions/[id]/route.ts",
    "src/app/api/v1/applicants/[id]/evaluation-link/route.ts",
    "src/app/api/v1/evaluation/links/[id]/route.ts",
    "src/app/api/positions/[id]/applicants/route.ts",
    "src/app/api/applicants/[id]/resumes/route.ts"
)

foreach ($filePath in $files) {
    $fullPath = Join-Path $PSScriptRoot ".." $filePath
    $fullPath = Resolve-Path $fullPath -ErrorAction SilentlyContinue
    if ($fullPath -and (Test-Path $fullPath)) {
        $content = [System.IO.File]::ReadAllText($fullPath)
        $original = $content
        
        # Remove old imports
        $content = $content -replace "import\s+\{\s*getServerSession\s*\}\s+from\s+['\`"]next-auth/next['\`"];?\s*\n?", ""
        $content = $content -replace "import\s+\{\s*getServerSession\s*\}\s+from\s+['\`"]next-auth['\`"];?\s*\n?", ""
        $content = $content -replace "import\s+\{\s*authOptions\s*\}\s+from\s+['\`"]@/lib/auth['\`"];?\s*\n?", ""
        
        # Add auth import if needed
        if ($content -match "getServerSession|auth\(\)" -and $content -notmatch "from ['\`"]@/auth['\`"]") {
            # Find first import line
            if ($content -match "(^import\s+.*?from\s+['\`"].*?['\`"];?\s*\n)") {
                $content = $content -replace "($matches[1])", "`$1import { auth } from '@/auth';`n"
            } else {
                $content = "import { auth } from '@/auth';`n" + $content
            }
        }
        
        # Replace usage
        $content = $content -replace "getServerSession\s*\(\s*authOptions\s*\)", "auth()"
        $content = $content -replace "getServerSession\s*\(\)", "auth()"
        
        if ($content -ne $original) {
            [System.IO.File]::WriteAllText($fullPath, $content)
            Write-Host "Fixed: $filePath"
        }
    }
}

Write-Host "Done fixing remaining files!"

