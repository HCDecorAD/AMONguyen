@echo off
setlocal EnableExtensions
set "ROOT=D:\HCDecorHUB\TransportMesh\UniversalControl"
if not exist "%ROOT%" mkdir "%ROOT%"
set "LOG=%ROOT%\preflight.log"
> "%LOG%" echo UNIVERSAL CONTROL PREFLIGHT
>>"%LOG%" echo DATE=%DATE% TIME=%TIME%
>>"%LOG%" echo HOST=%COMPUTERNAME%
>>"%LOG%" echo USER=%USERNAME%
>>"%LOG%" echo [LANE A - LOCAL]
where powershell >>"%LOG%" 2>&1
where git >>"%LOG%" 2>&1
>>"%LOG%" echo [RELAY FILES]
if exist "D:\HCDecorHUB\TransportMesh\IMASTER-GLOBAL-OPERATIONS-NOTICE.json" (>>"%LOG%" echo GLOBAL_NOTICE_PRESENT) else (>>"%LOG%" echo GLOBAL_NOTICE_MISSING)
if exist "D:\HCDecorHUB\TransportMesh\DUAL-LANE-PUBLIC-FROZEN.json" (>>"%LOG%" echo DUAL_LANE_CHECKPOINT_PRESENT) else (>>"%LOG%" echo DUAL_LANE_CHECKPOINT_MISSING)
>>"%LOG%" echo [LANE B - MESH AGENT]
sc query MeshAgent >>"%LOG%" 2>&1
sc query MeshCentral >>"%LOG%" 2>&1
>>"%LOG%" echo [ZEUS LISTENERS]
netstat -ano | findstr /R /C:":8765 .*LISTENING" /C:":8766 .*LISTENING" >>"%LOG%" 2>&1
>>"%LOG%" echo [SECURITY]
>>"%LOG%" echo READ_ONLY; OWNER_LOCK_UNCHANGED; NO_AUTO_FAILOVER
type "%LOG%"
echo PREFLIGHT FINISHED
endlocal
