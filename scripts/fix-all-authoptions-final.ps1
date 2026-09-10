# Final cleanup: Remove unused authOptions imports
$files = Get-ChildItem -Path "src" -Recurse -Filter "*.ts" -File

$count = 0
foreach ($file in $files) {
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName)
        $original = $content
        
        # Remove authOptions from imports (but keep other imports from @/lib/auth)
        # Pattern: import { authOptions, other } or import { other, authOptions }
        $content = $content -replace "import\s+\{\s*authOptions\s*,\s*([^}]+)\s*\}\s+from\s+['\`"]@/lib/auth['\`"];?", "import { `$1 } from '@/lib/auth';"
        $content = $content -replace "import\s+\{\s*([^}]+),\s*authOptions\s*\}\s+from\s+['\`"]@/lib/auth['\`"];?", "import { `$1 } from '@/lib/auth';"
        $content = $content -replace "import\s+\{\s*authOptions\s*\}\s+from\s+['\`"]@/lib/auth['\`"];?\s*\r?\n", ""
        
        # Remove duplicate auth imports
        $content = $content -replace "(import\s+\{\s*auth\s*\}\s+from\s+['\`"]@/auth['\`"];?\s*\r?\n)+", "import { auth } from '@/auth';`r`n"
        
        if ($content -ne $original) {
            [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
            $count++
            Write-Host "Cleaned: $($file.Name)"
        }
    } catch {
        Write-Host "Error: $($file.FullName): $_"
    }
}

Write-Host "`nCleaned $count files!"

