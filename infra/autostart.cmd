@echo off
setlocal EnableDelayedExpansion
rem ============================================================================
rem  autostart.cmd - bring the stack up at sign-in, without anybody typing.
rem
rem  Installed as a shortcut in shell:startup by install-autostart.ps1. Run it by
rem  hand any time; it is idempotent, because everything it calls is.
rem
rem  WHY THIS IS NOT PART OF start-full.cmd
rem
rem  start-full.cmd's header commits it to failing loudly NOW: no .env, or Docker
rem  not running, and it exits 1 immediately. That is right for a human at a
rem  prompt and wrong at sign-in, when Docker Desktop is still starting and
rem  "not ready yet" is the normal case rather than an error. This wrapper owns
rem  the boot-only concerns -- waiting, logging, saying so when it fails -- and
rem  leaves that contract untouched.
rem
rem  WHAT IT FIXES
rem
rem  On 2026-09-06 api, runner and web all exited 255 at the same instant (the
rem  Docker daemon stopping) and stayed down, because only postgres and gitea
rem  carried a restart policy. All five carry one now, which covers a reboot --
rem  but a restart policy cannot resurrect a container that was REMOVED, and the
rem  documented stop command (`docker compose --profile api --profile web down`)
rem  removes them. It also never runs migrations. This does both.
rem
rem  Usage:  autostart.cmd
rem  Log:    infra\logs\autostart.log   (previous boot: autostart.prev.log)
rem ============================================================================

cd /d "%~dp0"

set "LOGDIR=%~dp0logs"
set "LOG=%LOGDIR%\autostart.log"
set "PREV=%LOGDIR%\autostart.prev.log"

rem Five minutes. Docker Desktop takes well under a minute from sign-in on a warm
rem machine and a good deal longer on a cold one; the limit exists so that a
rem daemon which is never coming ends in a notification rather than a process
rem that waits until the next reboot.
set /a "WAIT_LIMIT=300"

if not exist "%LOGDIR%" mkdir "%LOGDIR%"

rem Two generations, and no retention policy to maintain. The previous boot is
rem the one worth keeping: when the stack is wrong this morning, what it did last
rem time is the first question.
if exist "%PREV%" del /q "%PREV%" >nul 2>&1
if exist "%LOG%" move /y "%LOG%" "%PREV%" >nul 2>&1

echo PyQuest autostart - %DATE% %TIME%> "%LOG%"
echo.>> "%LOG%"

rem --- Wait for the Docker daemon -------------------------------------------
rem `ping` rather than `timeout`, and it is not a stylistic choice. See the same
rem note in start-full.cmd: `timeout` reads the console and dies with "Input
rem redirection is not supported" the moment stdin is redirected, which is
rem exactly what happens under a scheduled task or a Startup shortcut. It fails
rem instantly, every iteration, and the loop then spins at full speed until the
rem limit. `ping -n 6 127.0.0.1` waits five seconds and does not care.
set /a "WAITED=0"

:wait_docker
docker info >nul 2>&1
if not errorlevel 1 goto docker_ready

if !WAITED! GEQ %WAIT_LIMIT% (
  echo [FAIL] Docker did not become ready in %WAIT_LIMIT%s. The stack was not started.>> "%LOG%"
  call :notify "PyQuest: Docker never started. See %LOG%"
  exit /b 1
)

ping -n 6 127.0.0.1 >nul 2>&1
set /a "WAITED+=5"
echo   waiting for Docker (!WAITED!s)>> "%LOG%"
goto wait_docker

:docker_ready
echo Docker ready after !WAITED!s.>> "%LOG%"
echo.>> "%LOG%"

rem --- Start everything ------------------------------------------------------
rem start-full.cmd already refuses to return 0 while something is broken, so its
rem exit code is the answer and there is nothing to re-check here.
call "%~dp0start-full.cmd" >> "%LOG%" 2>&1
set "RC=!errorlevel!"

echo.>> "%LOG%"
echo start-full.cmd exited !RC!>> "%LOG%"

if not "!RC!"=="0" (
  call :notify "PyQuest did not start (exit !RC!). Log: %LOG%"
  echo.
  echo [FAIL] the stack did not start. See %LOG%
  exit /b !RC!
)

echo.
echo [OK] the stack is up. Log: %LOG%
exit /b 0

rem ----------------------------------------------------------------------------
rem  notify <message>
rem
rem  A failed boot has to reach a person, or the first anyone knows is a learner
rem  reporting that Submit does nothing. `msg.exe` is on Pro and Enterprise but
rem  NOT on Home, so this is best-effort by design: /TIME auto-dismisses so a
rem  failure never parks a dialog waiting for a click, and a machine without
rem  msg.exe still has the log and the exit code.
rem ----------------------------------------------------------------------------
:notify
msg "%USERNAME%" /TIME:120 "%~1" >nul 2>&1
exit /b 0
