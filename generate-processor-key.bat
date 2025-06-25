@echo off
echo Generating PROCESSOR_API_KEY...
echo.

REM Generate a random 32-character string
set "chars=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
set "key="
for /L %%i in (1,1,32) do (
    set /a "rand=!random! %% 62"
    for %%j in (!rand!) do set "key=!key!!chars:~%%j,1!"
)

echo Generated PROCESSOR_API_KEY: %key%
echo.
echo Please add this to your .env file:
echo PROCESSOR_API_KEY=%key%
echo.
echo Or run this command to add it automatically:
echo echo PROCESSOR_API_KEY=%key% >> .env
echo.

pause 