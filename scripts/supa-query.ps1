# Executa SQL no Supabase remoto via Management API
# Uso: .\scripts\supa-query.ps1 "SELECT 1"
#      .\scripts\supa-query.ps1 -File supabase/migrations/010_xxx.sql

param(
    [string]$Sql,
    [string]$File
)

# Lê o token do Windows Credential Manager (salvo pelo `supabase login`)
Add-Type @"
using System; using System.Runtime.InteropServices; using System.Text;
public class CredMgr {
    [DllImport("advapi32.dll", CharSet=CharSet.Unicode, SetLastError=true)]
    public static extern bool CredRead(string target, uint type, int flags, out IntPtr ptr);
    [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
    public struct CRED { public uint Flags,Type; public string TargetName,Comment;
        public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
        public uint BlobSize; public IntPtr Blob; public uint Persist,AttrCount;
        public IntPtr Attributes; public string TargetAlias,UserName; }
    public static string GetToken(string target) {
        IntPtr ptr; if (!CredRead(target, 1, 0, out ptr)) return null;
        var c = Marshal.PtrToStructure<CRED>(ptr);
        byte[] b = new byte[c.BlobSize]; Marshal.Copy(c.Blob, b, 0, b.Length);
        return Encoding.UTF8.GetString(b); }
}
"@
$token = [CredMgr]::GetToken("Supabase CLI:supabase")
if (-not $token) { Write-Error "Token não encontrado. Execute: supabase login"; exit 1 }

$ref = "qtxonhsjkgtxslxyxjsq"

if ($File) { $Sql = Get-Content $File -Raw }
if (-not $Sql) { Write-Error "Passe -Sql ou -File"; exit 1 }

$body = @{ query = $Sql } | ConvertTo-Json -Depth 5
$resp = Invoke-WebRequest `
    -Uri "https://api.supabase.com/v1/projects/$ref/database/query" `
    -Method POST `
    -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
    -Body $body -UseBasicParsing
$resp.Content | ConvertFrom-Json | Format-Table
