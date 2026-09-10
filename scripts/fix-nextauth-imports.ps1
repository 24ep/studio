# PowerShell script to fix NextAuth v5 imports
$files = Get-ChildItem -Path "src" -Recurse -Filter "*.ts" -File | Where-Object { 
    $content = Get-Content $_.FullName -Raw
    $content -match "from ['\`"]next-auth/next['\`"]" -or $content -match "from ['\`"]next-auth['\`"]"
}

Write-Host "Found $($files.Count) files to update"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $original = $content
    
    # Replace imports
    $content = $content -replace "import\s+\{\s*getServerSession\s*\}\s+from\s+['\`"]next-auth/next['\`"];?\s*", ""
    $content = $content -replace "import\s+\{\s*getServerSession\s*\}\s+from\s+['\`"]next-auth['\`"];?\s*", ""
    $content = $content -replace "import\s+\{\s*authOptions\s*\}\s+from\s+['\`"]@/lib/auth['\`"];?\s*", ""
    
    # Add auth import if not present and we're using getServerSession
    if ($content -match "getServerSession|auth\(\)" -and $content -notmatch "from ['\`"]@/auth['\`"]") {
        # Find the last import statement
        if ($content -match "(import\s+.*?from\s+['\`"].*?['\`"];?\s*\n)") {
            $content = $content -replace "(import\s+.*?from\s+['\`"].*?['\`"];?\s*\n)(?!\s*import)", "`$1import { auth } from '@/auth';`n"
        } else {
            # Add at the top after other imports
            $content = $content -replace "(\n)(export|const|function|async)", "`$1import { auth } from '@/auth';`n`$1`$2"
        }
    }
    
    # Replace getServerSession(authOptions) with auth()
    $content = $content -replace "getServerSession\s*\(\s*authOptions\s*\)", "auth()"
    $content = $content -replace "getServerSession\s*\(\)", "auth()"
    
    # Only write if changed
    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "Done!"

