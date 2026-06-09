set -e
sudo DEBIAN_FRONTEND=noninteractive apt install nginx -y
sudo systemctl enable nginx --now

sudo DEBIAN_FRONTEND=noninteractive apt install software-properties-common -y
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo DEBIAN_FRONTEND=noninteractive apt install php8.3-fpm php8.3-mysql php8.3-mbstring php8.3-curl php8.3-xml php8.3-zip php8.3-intl php8.3-opcache -y
sudo systemctl enable php8.3-fpm --now

sudo DEBIAN_FRONTEND=noninteractive apt install mysql-server -y
sudo systemctl enable mysql --now

sudo mysql -e "DELETE FROM mysql.user WHERE User='';"
sudo mysql -e "DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');"
sudo mysql -e "DROP DATABASE IF EXISTS test;"
sudo mysql -e "DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';"
sudo mysql -e "FLUSH PRIVILEGES;"

curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

sudo DEBIAN_FRONTEND=noninteractive apt install certbot python3-certbot-nginx -y

echo "--- CHECKPOINT ---"
nginx -v
php8.3 -v
mysql --version
composer --version
