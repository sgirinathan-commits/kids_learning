# Generates one WAV clip per phonics sound from IPA (tools/phonemes.json)
# using the Windows built-in speech engine, then trims/normalises them
# into audio/phonics/ with tools/trim_phonics.py.
#   Run:  powershell -ExecutionPolicy Bypass -File tools\make-phonics.ps1
param([string]$Voice = "Microsoft Zira Desktop")
$root = Split-Path -Parent $PSScriptRoot
$raw = Join-Path $env:TEMP "phonics_raw"
New-Item -ItemType Directory -Force $raw | Out-Null
Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
try { $s.SelectVoice($Voice) } catch { Write-Host "Voice '$Voice' not found, using default" }
$map = Get-Content (Join-Path $PSScriptRoot "phonemes.json") -Raw -Encoding UTF8 | ConvertFrom-Json
foreach ($p in $map.PSObject.Properties) {
  if ($p.Name -like "_*") { continue }
  $ipa = $p.Value.ipa
  # held (continuous) sounds are slowed down so they can be stretched: "mmm", "sss", "aaa"
  $rate = if ($p.Value.hold) { "x-slow" } else { "medium" }
  $ssml = "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'><prosody rate='$rate'><phoneme alphabet='ipa' ph='$ipa'>x</phoneme></prosody></speak>"
  # file names must be case-safe on Windows: long vowels get a "_long" suffix
  $name = if ($p.Name -cmatch '^[AEIOU]$') { $p.Name.ToLower() + "_long" } else { $p.Name }
  $s.SetOutputToWaveFile((Join-Path $raw "$name.wav"))
  $s.SpeakSsml($ssml)
  $s.SetOutputToNull()
}
$s.Dispose()
python (Join-Path $PSScriptRoot "trim_phonics.py") $raw (Join-Path $root "audio\phonics")
