# Final fix for all NextAuth imports
$files = Get-ChildItem -Path "src" -Recurse -Filter "*.ts" -File

$count = 0
foreach ($file in $files) {
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName)
        $original = $content
        
        # Remove old imports (with newline handling)
        $content = $content -replace "import\s+\{\s*getServerSession\s*\}\s+from\s+['\`"]next-auth/next['\`"];?\s*\r?\n", ""
        $content = $content -replace "import\s+\{\s*getServerSession\s*\}\s+from\s+['\`"]next-auth['\`"];?\s*\r?\n", ""
        $content = $content -replace "import\s+\{\s*authOptions\s*\}\s+from\s+['\`"]@/lib/auth['\`"];?\s*\r?\n", ""
        
        # Add auth import if needed (check if file uses auth but doesn't import it)
        if (($content -match "auth\(\)|getServerSession") -and ($content -notmatch "from ['\`"]@/auth['\`"]")) {
            # Find the last import line
            if ($content -match "(^import\s+.*?from\s+['\`"].*?['\`"];?\s*\r?\n)") {
                $lastImport = [regex]::Matches($content, "(^import\s+.*?from\s+['\`"].*?['\`"];?\s*\r?\n)", [System.Text.RegularExpressions.RegexOptions]::Multiline) | Select-Object -Last 1
                if ($lastImport) {
                    $content = $content.Insert($lastImport.Index + $lastImport.Length, "import { auth } from '@/auth';`r`n")
                } else {
                    # Add at top after first line
                    $content = $content -replace "^", "import { auth } from '@/auth';`r`n", 1
                }
            } else {
                # No imports, add at top
                $content = "import { auth } from '@/auth';`r`n" + $content
            }
        }
        
        # Replace usage
        $content = $content -replace "getServerSession\s*\(\s*authOptions\s*\)", "auth()"
        $content = $content -replace "getServerSession\s*\(\)", "auth()"
        
        if ($content -ne $original) {
            [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
            $count++
            Write-Host "Fixed: $($file.Name)"
        }
    } catch {
        Write-Host "Error processing $($file.FullName): $_"
    }
}

Write-Host "`nFixed $count files!"

