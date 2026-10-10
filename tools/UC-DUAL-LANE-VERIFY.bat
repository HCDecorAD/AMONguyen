@echo off
setlocal
set "OUT=D:\HCDecorHUB\TransportMesh\UniversalControl\dual-lane-verify.log"
> "%OUT%" echo DUAL LANE VERIFY %DATE% %TIME%
>>"%OUT%" echo === SERVICE A ===
sc query "Mesh Agent" >>"%OUT%" 2>&1
>>"%OUT%" echo === SERVICE B ===
sc query "meshcentral.exe" >>"%OUT%" 2>&1
>>"%OUT%" echo === RESCUE ===
sc query "HCDRRemoteMCP" >>"%OUT%" 2>&1
>>"%OUT%" echo === TCP LISTENERS ===
netstat -ano | findstr /I "LISTENING" | findstr /C:":8765" /C:":8766" >>"%OUT%" 2>&1
>>"%OUT%" echo === CHECKPOINT ===
if exist "D:\HCDecorHUB\TransportMesh\DUAL-LANE-PUBLIC-FROZEN.json" (>>"%OUT%" echo FROZEN_CHECKPOINT_PRESENT) else (>>"%OUT%" echo FROZEN_CHECKPOINT_MISSING)
>>"%OUT%" echo VERIFY_READ_ONLY_DONE
type "%OUT%"
endlocal
