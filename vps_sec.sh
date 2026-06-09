ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
DEBIAN_FRONTEND=noninteractive apt-get install fail2ban -y
systemctl enable fail2ban --now
sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
echo 'root:Kx9_vQ2pL-mZ7wR!' | chpasswd
systemctl restart ssh
