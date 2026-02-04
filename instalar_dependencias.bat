@echo off
echo ============================================================
echo   INSTALADOR DE DEPENDENCIAS - SaaS Premium
echo ============================================================
echo.
echo Instalando dependencias necesarias para Supabase y Excel...
echo.
call npm install @supabase/supabase-js xlsx papaparse
echo.
echo ============================================================
echo   PROCESO COMPLETADO
echo ============================================================
echo Ahora puedes cerrar esta ventana y avisarme para continuar.
pause
