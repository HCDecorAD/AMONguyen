@echo off
setlocal
set "OUT=D:\HCDecorHUB\TransportMesh\UniversalControl\services-discovery.log"
> "%OUT%" echo SERVICE DISCOVERY %DATE% %TIME%
>> "%OUT%" echo === MATCHING SERVICES ===
sc query state= all | findstr /I /C:"mesh" /C:"remote" /C:"agent" >> "%OUT%" 2>&1
>> "%OUT%" echo === MATCHING PROCESSES ===
tasklist /v | findstr /I /C:"mesh" /C:"node.exe" /C:"transwarp" >> "%OUT%" 2>&1
>> "%OUT%" echo === PORTS ===
netstat -ano | findstr /C:":8765" /C:":8766" >> "%OUT%" 2>&1
type "%OUT%"
endlocal
