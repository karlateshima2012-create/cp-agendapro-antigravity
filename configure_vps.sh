#!/bin/bash
ssh -o StrictHostKeyChecking=no deploy@76.13.209.192 << 'EOF'
echo "=== Bloco 7 ==="
sudo mkdir -p /var/www/cpagendapro/public
sudo mkdir -p /var/www/cpagendapro/backend
sudo chown -R deploy:www-data /var/www/cpagendapro
sudo chmod -R 755 /var/www/cpagendapro

echo "deploy ALL=(ALL) NOPASSWD: /bin/systemctl reload php8.3-fpm" | sudo tee /etc/sudoers.d/deploy-php-reload > /dev/null
sudo chmod 440 /etc/sudoers.d/deploy-php-reload

ls -la /var/www/cpagendapro/
sudo -l | grep php

echo "=== Bloco 8 ==="
cat << 'NGINXEOF' | sudo tee /etc/nginx/sites-available/cpagendapro > /dev/null
server {
    listen 80;
    server_name cpagendapro.creativeprintjp.com;

    root /var/www/cpagendapro/public;
    index index.html;

    # Segurança
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self'; frame-ancestors 'none';" always;

    # Assets estáticos — cache imutável (nomes têm hash)
    location ~* \.(js|css|png|jpg|jpeg|svg|ico|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # API PHP — todo /api/* vai para o index.php
    location /api/ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME /var/www/cpagendapro/backend/api/index.php;
        fastcgi_param REQUEST_URI $request_uri;
        include fastcgi_params;
    }

    # SPA React — fallback para index.html
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
NGINXEOF

sudo ln -sf /etc/nginx/sites-available/cpagendapro /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
EOF
