@echo off
echo ==========================================
echo Cambiando sistema de notificaciones a SMTP
echo ==========================================
cd /d "c:\Users\Rooster\Desktop\saas"
echo Desinstalando Resend...
call npm uninstall resend
echo.
echo Instalando Nodemailer y tipos...
call npm install nodemailer
call npm install -D @types/nodemailer
echo.
echo ==========================================
echo Migracion completada con exito!
echo ==========================================
pause
