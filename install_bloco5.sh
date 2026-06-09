set -e
sudo mysql -e "CREATE DATABASE IF NOT EXISTS cp_agenda_pro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "DROP USER IF EXISTS 'cpagenda_user'@'localhost';"
sudo mysql -e "CREATE USER 'cpagenda_user'@'localhost' IDENTIFIED BY 'Cp@genda2024!Vps#Secure';"
sudo mysql -e "GRANT ALL PRIVILEGES ON cp_agenda_pro.* TO 'cpagenda_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"
mysql -u cpagenda_user -p'Cp@genda2024!Vps#Secure' cp_agenda_pro -e "SELECT 'banco ok' AS status;"
