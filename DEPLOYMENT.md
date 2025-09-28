# BRMH Auth UI Deployment Guide

This guide will walk you through deploying your custom authentication UI to `auth.brmh.in`.

## Prerequisites

- A server with Ubuntu 20.04+ or similar
- Domain `auth.brmh.in` pointing to your server
- SSL certificate (Let's Encrypt recommended)
- AWS CLI configured (for Cognito setup)
- Docker and Docker Compose (optional)

## Step 1: Server Setup

### 1.1 Update your server

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Install required packages

```bash
# Install Nginx
sudo apt install nginx -y

# Install Docker (optional)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y
```

## Step 2: Configure DNS

Point your domain to your server:

```
A    auth.brmh.in    YOUR_SERVER_IP
```

## Step 3: Deploy the Auth UI

### Option A: Using the deployment script

```bash
# Make the script executable (on Linux/Mac)
chmod +x deploy.sh

# Edit the script with your server details
nano deploy.sh

# Run the deployment
./deploy.sh
```

### Option B: Manual deployment

```bash
# Create directory
sudo mkdir -p /var/www/brmh-auth-ui

# Copy files
sudo cp index.html callback.html nginx.conf /var/www/brmh-auth-ui/

# Set permissions
sudo chown -R www-data:www-data /var/www/brmh-auth-ui
sudo chmod -R 755 /var/www/brmh-auth-ui

# Configure Nginx
sudo cp nginx.conf /etc/nginx/sites-available/auth.brmh.in
sudo ln -s /etc/nginx/sites-available/auth.brmh.in /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Option C: Using Docker

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t brmh-auth-ui .
docker run -d -p 80:80 -p 443:443 --name brmh-auth-ui brmh-auth-ui
```

## Step 4: Set up SSL Certificate

```bash
# Using Let's Encrypt
sudo certbot --nginx -d auth.brmh.in

# Follow the prompts to:
# 1. Enter your email
# 2. Agree to terms
# 3. Choose whether to share email with EFF
# 4. Select redirect option (recommended: 2)
```

## Step 5: Configure AWS Cognito

### 5.1 Run the Cognito setup script

```bash
# Make executable
chmod +x setup-cognito.sh

# Run the script
./setup-cognito.sh
```

### 5.2 Manual Cognito configuration

1. Go to AWS Cognito Console
2. Create or select your User Pool
3. Go to "App integration" → "Domain"
4. Set custom domain: `auth.brmh.in`
5. Go to "App integration" → "App clients"
6. Update callback URLs:
   - Sign-in URL: `https://auth.brmh.in`
   - Sign-out URL: `https://auth.brmh.in`
   - Allowed callback URLs: `https://auth.brmh.in/callback`

## Step 6: Update Backend Configuration

Update your backend `.env` file:

```env
AUTH_REDIRECT_URI=https://auth.brmh.in/callback
AUTH_LOGOUT_REDIRECT_URI=https://auth.brmh.in/
```

## Step 7: Test the Setup

### 7.1 Test the UI

```bash
# Test if the UI is accessible
curl -I https://auth.brmh.in

# Should return 200 OK
```

### 7.2 Test authentication flow

1. Visit `https://auth.brmh.in`
2. Try signing up with a test account
3. Check if the callback works
4. Verify tokens are stored correctly

### 7.3 Test backend integration

```bash
# Test backend health
curl https://brmh.in/health

# Test auth endpoints
curl -X POST https://brmh.in/auth/oauth-url
```

## Step 8: Update Frontend Applications

Update your frontend applications to use the new auth URL:

```javascript
// Old
const AUTH_URL = 'https://your-domain.auth.us-east-1.amazoncognito.com';

// New
const AUTH_URL = 'https://auth.brmh.in';
```

## Troubleshooting

### Common Issues

1. **502 Bad Gateway**
   - Check if Nginx is running: `sudo systemctl status nginx`
   - Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`

2. **SSL Certificate Issues**
   - Check certificate: `sudo certbot certificates`
   - Renew if needed: `sudo certbot renew`

3. **CORS Errors**
   - Ensure backend allows requests from `https://auth.brmh.in`
   - Check CORS configuration in your backend

4. **Callback Not Working**
   - Verify callback URL in Cognito matches exactly
   - Check if the callback.html file is accessible

### Logs and Monitoring

```bash
# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx -f

# Docker logs (if using Docker)
docker logs brmh-auth-ui -f
```

### Health Checks

```bash
# Check if the service is running
curl https://auth.brmh.in/health

# Check SSL certificate
openssl s_client -connect auth.brmh.in:443 -servername auth.brmh.in

# Check DNS
nslookup auth.brmh.in
```

## Security Considerations

1. **HTTPS Only**: Never serve the auth UI over HTTP in production
2. **Security Headers**: The nginx.conf includes security headers
3. **CORS**: Configure CORS properly on your backend
4. **Token Storage**: Consider using httpOnly cookies instead of localStorage
5. **Rate Limiting**: Implement rate limiting on auth endpoints

## Maintenance

### Regular Tasks

1. **SSL Certificate Renewal**
   ```bash
   sudo certbot renew --dry-run
   ```

2. **Log Rotation**
   ```bash
   sudo logrotate -f /etc/logrotate.d/nginx
   ```

3. **Security Updates**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

### Backup

```bash
# Backup configuration
sudo tar -czf brmh-auth-ui-backup.tar.gz /var/www/brmh-auth-ui /etc/nginx/sites-available/auth.brmh.in

# Backup SSL certificates
sudo tar -czf ssl-backup.tar.gz /etc/letsencrypt
```

## Support

If you encounter issues:

1. Check the logs first
2. Verify all configuration files
3. Test each component individually
4. Contact support: support@brmh.in

## Next Steps

After successful deployment:

1. Update your documentation
2. Train your team on the new auth flow
3. Set up monitoring and alerts
4. Plan for scaling if needed
5. Consider implementing additional security measures
