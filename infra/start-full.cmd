@echo off
setlocal EnableDelayedExpansion
rem ============================================================================
rem  start-full.cmd - bring the whole stack up, in order, and say what is running.
rem
rem  Every service in one command: postgres and gitea, then the migration job to
rem  completion, then api, web and runner.
rem
rem  THIS SCRIPT MUST NOT RETURN 0 WHILE SOMETHING IS BROKEN. That is the whole
rem  of its contract and the reason it is longer than three lines. `docker
rem  compose up -d` returns success the moment a container is *created*, which
rem  is true of a container that then crash-loops forever -- and a start script
rem  that reports success while the api is dying is worse than no script,
rem  because it moves the discovery to the moment somebody needs the api.
rem
rem  It waits for health and exits non-zero on: a missing .env, a failed
rem  migration, or any service that does not reach healthy.
rem
rem  Usage:  start-full.cmd
rem  Stop:   docker compose --profile api --profile web down
rem ============================================================================

cd /d "%~dp0"

rem --- Preflight -------------------------------------------------------------
rem .env holds POSTGRES_PASSWORD and the ports. Compose interpolates it, and a
rem missing file produces an empty password and a confusing auth failure three
rem steps later rather than an error here.
if not exist ".env" (
  echo [FAIL] infra\.env is missing.
  echo        Copy .env.example to .env and set POSTGRES_PASSWORD before starting.
  exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
  echo [FAIL] Docker is not running.
  exit /b 1
)

echo.
echo === 1/4  postgres and gitea ================================================
docker compose up -d
if errorlevel 1 (
  echo [FAIL] postgres and gitea did not come up.
  exit /b 1
)
call :wait_healthy pyquest-postgres 60 || exit /b 1
call :wait_healthy pyquest-gitea 60 || exit /b 1

echo.
echo === 2/4  migrations =======================================================
rem A job, not a service: it runs to completion and exits. Its exit code is the
rem real answer, so this stops here rather than starting an api against a schema
rem that was never applied.
docker compose --profile migrate run --rm migrate
if errorlevel 1 (
  echo [FAIL] the migration job failed. The stack is not started.
  exit /b 1
)

echo.
echo === 3/4  api and runner ===================================================
docker compose --profile api up -d api runner
if errorlevel 1 (
  echo [FAIL] the api profile did not come up.
  exit /b 1
)
call :wait_healthy pyquest-api 90 || exit /b 1

echo.
echo === 4/4  web ==============================================================
rem After the api on purpose. `web` cannot declare `depends_on: api` because the
rem two are in different profiles and compose refuses that, so the ordering the
rem dependency would have expressed lives here instead.
docker compose --profile web up -d web
if errorlevel 1 (
  echo [FAIL] the web profile did not come up.
  exit /b 1
)
call :wait_healthy pyquest-web 90 || exit /b 1

echo.
echo === running ===============================================================
echo   SPA        http://localhost:3082
echo   api        http://localhost:3081/health
echo   gitea      http://localhost:3080
echo   postgres   localhost:5433
echo.
echo   Nobody can sign in until the DM seat is claimed:
echo     npm run bootstrap --workspace @pyquest/db      (needs DATABASE_URL)
echo.
exit /b 0

rem ----------------------------------------------------------------------------
rem  wait_healthy <container> <seconds>
rem
rem  Polls the container's healthcheck rather than trusting `up -d`. A container
rem  with no healthcheck reports "none", which is treated as a failure here: every
rem  long-running service in this stack declares one, so "none" means the wrong
rem  container name or an image that lost its HEALTHCHECK.
rem ----------------------------------------------------------------------------
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
