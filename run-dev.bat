@echo off
setlocal

pushd "%~dp0client"
IF NOT EXIST "node_modules" (
  echo Installing frontend dependencies...
  call npm install
  IF ERRORLEVEL 1 (
    popd
    exit /b 1
  )
)

call npm run dev
set EXIT_CODE=%ERRORLEVEL%
popd
exit /b %EXIT_CODE%
