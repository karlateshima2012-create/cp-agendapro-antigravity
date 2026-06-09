#!/bin/bash
# /home/deploy/cpagenda_backup.sh

DB_USER="cpagenda_user"
DB_PASS="Cp@genda2024!Vps#Secure"
DB_NAME="cp_agenda_pro"
BACKUP_DIR="/home/deploy/backups"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
FILE_NAME="cpagenda_backup_$DATE.sql.gz"
BACKUP_FILE="$BACKUP_DIR/$FILE_NAME"

# Note: We will use a local log file that deploy user can write to without sudo
LOG_FILE="/home/deploy/backups/cpagenda_backup.log"

TELEGRAM_TOKEN="8629056972:AAGMBvvE87ZmL-5uwr2wpSJ7-nOtd4073W4"
TELEGRAM_CHAT_ID="1280107206"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Iniciando backup do banco de dados..." >> "$LOG_FILE"

mysqldump --no-tablespaces --single-transaction -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "[$(date)] Backup local gerado com sucesso: $BACKUP_FILE" >> "$LOG_FILE"
    
    echo "[$(date)] Enviando para o Google Drive..." >> "$LOG_FILE"
    /usr/bin/rclone copy "$BACKUP_FILE" gdrive:"CPAgendaPro_Backups"
    
    if [ $? -eq 0 ]; then
        echo "[$(date)] Upload concluido com sucesso." >> "$LOG_FILE"
        
        # Deleta backups mais antigos que 30 dias no drive
        /usr/bin/rclone delete --min-age 30d gdrive:"CPAgendaPro_Backups"
        
        # Remove o arquivo local após upload de sucesso
        rm "$BACKUP_FILE"
    else
        echo "[$(date)] ERRO: Falha ao enviar para o Google Drive." >> "$LOG_FILE"
        curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_TOKEN/sendMessage" -d chat_id="$TELEGRAM_CHAT_ID" -d text="❌ ALERTA CP AGENDA PRO: Falha ao enviar backup para o Google Drive! Verifique o log na VPS." > /dev/null
    fi
else
    echo "[$(date)] ERRO: Falha ao gerar o dump do MySQL." >> "$LOG_FILE"
    curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_TOKEN/sendMessage" -d chat_id="$TELEGRAM_CHAT_ID" -d text="❌ ALERTA CP AGENDA PRO: Falha ao gerar backup (mysqldump)! Verifique a VPS." > /dev/null
fi
