@echo off
setlocal EnableDelayedExpansion
rem ============================================================================
rem  bounce.cmd <profile> - push a code change into the running stack.
rem
rem  Rebuilds one profile's images and recreates only that profile's containers.
rem  This is the local loop the household has instead of CD: 6.4 puts the api on
rem  the parent's machine, so "deploy" here means the container on this desk
rem  restarts. There is no registry and nothing is pushed anywhere.
rem
rem  Usage:  bounce.cmd api
rem          bounce.cmd web
rem          bounce.cmd migrate
rem
rem  WHY THE SERVICES ARE NAMED RATHER THAN INFERRED
rem
rem  `docker compose --profile api up` starts every service matching that profile
rem  AND every service with no profile at all -- so postgres and gitea would come
rem  up too, and `--no-deps` does not prevent it because they are not
rem  dependencies, merely unprofiled. Compose cannot be asked "just this
rem  profile's services", so the mapping is written down here.
rem
rem  WHY --no-deps
rem
rem  Bouncing the api must not restart Postgres underneath it. A dependency is a
rem  thing to wait for at startup, not a thing to recycle every time a route
rem  handler changes -- and taking the database down to reload one is how a
rem  thirty-second edit becomes a two-minute one.
rem ============================================================================

cd /d "%~dp0"

set "PROFILE=%~1"
if "%PROFILE%"=="" (
  echo Usage: bounce.cmd ^<api^|web^|migrate^>
  exit /b 2
)

rem The profile-to-service mapping compose cannot infer.
if /i "%PROFILE%"=="api"     set "SERVICES=api runner"
if /i "%PROFILE%"=="web"     set "SERVICES=web"
if /i "%PROFILE%"=="migrate" set "SERVICES=migrate"

if not defined SERVICES (
  echo [FAIL] unknown profile "%PROFILE%". Known: api, web, migrate.
  exit /b 2
)

echo.
echo === building %PROFILE% ====================================================
rem A source edit does not reinstall the workspace: every Dockerfile copies
rem manifests and runs `npm ci` before copying source, so that layer stays cached
rem until the lockfile moves. If a bounce ever reinstalls, the layer order is
rem wrong rather than the approach.
docker compose --profile %PROFILE% build %SERVICES%
if errorlevel 1 (
  echo [FAIL] the build failed. Nothing was restarted, so what is running is unchanged.
  exit /b 1
)

rem `migrate` is a job rather than a service: it runs to completion and exits, so
rem there is nothing to recreate and its exit code is the answer.
if /i "%PROFILE%"=="migrate" (
  echo.
  echo === running the migration job =============================================
  docker compose --profile migrate run --rm migrate
  exit /b %errorlevel%
)

echo.
echo === recreating %SERVICES% =================================================
docker compose --profile %PROFILE% up -d --force-recreate --no-deps %SERVICES%
if errorlevel 1 (
  echo [FAIL] the containers did not come back up.
  exit /b 1
)

rem Same contract as start-full.cmd: do not report success while something is
rem crash-looping. A bounce that returns 0 on a broken build is a bounce that
rem sends somebody to the browser to find out.
for %%S in (%SERVICES%) do (
  set "CONTAINER=pyquest-%%S"
  rem Cleared per iteration for the same reason as STATE below: an empty result
  rem leaves the previous service's answer in place, and `runner` has no
  rem healthcheck while `api` does.
  set "HASHEALTH="
  for /f "tokens=*" %%H in ('docker inspect -f "{{if .State.Health}}has{{end}}" !CONTAINER! 2^>nul') do set "HASHEALTH=%%H"
  if "!HASHEALTH!"=="has" (
    call :wait_healthy !CONTAINER! 90 || exit /b 1
  ) else (
    echo       !CONTAINER! has no healthcheck - not waiting
  )
)

echo.
echo [OK] %PROFILE% is rebuilt and running.
exit /b 0

:wait_healthy
set "NAME=%~1"
set /a "LIMIT=%~2"
set /a "WAITED=0"
<nul set /p "=      waiting for %NAME% "
:wait_loop
rem Cleared before every poll, and that is not defensive tidiness.
rem
rem `for /f` does not run its body when the command prints nothing, so the variable
rem keeps whatever it last held. This loop reported `pyquest-runner  healthy`
rem instantly while the runner has no healthcheck at all -- it was reading the
rem api's "healthy" from the previous call. A crash-looping runner would have been
rem announced as fine, which is the exact failure this script's header says it
rem exists to prevent. Found by noticing the progress dots were missing.
set "STATE=none"
for /f "tokens=*" %%H in ('docker inspect -f "{{.State.Health.Status}}" %NAME% 2^>nul') do set "STATE=%%H"
if "%STATE%"=="healthy" (
  echo  healthy
  exit /b 0
)
if %WAITED% GEQ %LIMIT% (
  echo.
  echo [FAIL] %NAME% did not reach healthy in %LIMIT%s ^(last state: %STATE%^).
  docker logs --tail 20 %NAME% 2>&1
  exit /b 1
)
<nul set /p "=."
rem `ping` rather than `timeout`, and it is not a stylistic choice: `timeout` reads
rem the console and dies with "Input redirection is not supported" the moment this
rem script is run with stdin redirected -- from CI, from another script, or from
rem any tool that captures output. It fails nineteen times in a row and the poll
rem then spins. `ping -n 3 127.0.0.1` waits two seconds and does not care.
ping -n 3 127.0.0.1 >nul 2>&1
set /a "WAITED+=2"
goto :wait_loop
