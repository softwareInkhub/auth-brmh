# Deploy BRMH Auth UI to Vercel

This guide will help you deploy your custom authentication UI to Vercel and configure the custom domain `auth.brmh.in`.

## Option 1: Vercel Deployment (Recommended)

### Prerequisites
- Vercel account (free tier available)
- Domain `auth.brmh.in` (or subdomain of your choice)
- GitHub account (for automatic deployments)

### Step 1: Prepare Your Repository

1. **Create a GitHub repository** (if you haven't already):
   ```bash
   cd brmh-auth-ui
   git init
   git add .
   git commit -m "Initial commit: BRMH Auth UI"
   git branch -M main
   git remote add origin https://github.com/yourusername/brmh-auth-ui.git
   git push -u origin main
   ```

2. **Update the API URL** in `index.html`:
   ```javascript
   const API_BASE_URL = 'https://brmh.in'; // Your backend URL
   ```

### Step 2: Deploy to Vercel

#### Method A: Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
cd brmh-auth-ui
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? (select your account)
# - Link to existing project? N
# - Project name: brmh-auth-ui
# - Directory: ./
# - Override settings? N

# Deploy to production
vercel --prod
```

#### Method B: Using Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - Framework Preset: Other
   - Root Directory: `./`
   - Build Command: `echo "Static files - no build needed"`
   - Output Directory: `./`
5. Click "Deploy"

### Step 3: Configure Custom Domain

1. **In Vercel Dashboard**:
   - Go to your project
   - Click "Settings" → "Domains"
   - Add domain: `auth.brmh.in`
   - Click "Add"

2. **Configure DNS**:
   Add these DNS records to your domain provider:
   ```
   Type: CNAME
   Name: auth
   Value: cname.vercel-dns.com
   ```

   Or if using A records:
   ```
   Type: A
   Name: auth
   Value: 76.76.19.61
   ```

3. **Verify Domain**:
   - Vercel will automatically verify your domain
   - SSL certificate will be provisioned automatically
   - This may take a few minutes

### Step 4: Update Backend Configuration

Update your backend `.env` file:
```env
AUTH_REDIRECT_URI=https://auth.brmh.in/callback
AUTH_LOGOUT_REDIRECT_URI=https://auth.brmh.in/
```

### Step 5: Configure AWS Cognito

1. **Go to AWS Cognito Console**
2. **Select your User Pool**
3. **Go to "App integration" → "Domain"**
4. **Set custom domain**: `auth.brmh.in`
5. **Go to "App integration" → "App clients"**
6. **Update callback URLs**:
   - Sign-in URL: `https://auth.brmh.in`
   - Sign-out URL: `https://auth.brmh.in`
   - Allowed callback URLs: `https://auth.brmh.in/callback`

### Step 6: Test the Deployment

1. **Visit your domain**: `https://auth.brmh.in`
2. **Test authentication flow**:
   - Try signing up
   - Test OAuth login
   - Verify callback works
3. **Check health endpoint**: `https://auth.brmh.in/health`

## Option 2: EC2 Deployment

### Prerequisites
- AWS EC2 instance (Ubuntu 20.04+)
- Domain `auth.brmh.in` pointing to your EC2 instance
- SSL certificate (Let's Encrypt recommended)

### Step 1: Set Up EC2 Instance

1. **Launch EC2 instance**:
   - AMI: Ubuntu Server 20.04 LTS
   - Instance type: t3.micro (free tier)
   - Security group: Allow HTTP (80) and HTTPS (443)

2. **Connect to your instance**:
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

### Step 2: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Nginx
sudo apt install nginx -y

# Install Node.js (for serving files)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y
```

### Step 3: Deploy the Application

```bash
# Create application directory
sudo mkdir -p /var/www/brmh-auth-ui
cd /var/www/brmh-auth-ui

# Clone your repository (or upload files)
sudo git clone https://github.com/yourusername/brmh-auth-ui.git .

# Set permissions
sudo chown -R www-data:www-data /var/www/brmh-auth-ui
sudo chmod -R 755 /var/www/brmh-auth-ui

# Install dependencies
sudo npm install
```

### Step 4: Configure Nginx

```bash
# Copy Nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/auth.brmh.in

# Enable the site
sudo ln -s /etc/nginx/sites-available/auth.brmh.in /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 5: Set Up SSL Certificate

```bash
# Get SSL certificate
sudo certbot --nginx -d auth.brmh.in

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose redirect option (recommended: 2)
```

### Step 6: Set Up Process Management

```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'brmh-auth-ui',
    script: 'npx',
    args: 'serve -s . -l 3000',
    cwd: '/var/www/brmh-auth-ui',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF

# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
```

### Step 7: Configure Firewall

```bash
# Allow Nginx
sudo ufw allow 'Nginx Full'

# Allow SSH
sudo ufw allow ssh

# Enable firewall
sudo ufw enable
```

## Comparison: Vercel vs EC2

| Feature | Vercel | EC2 |
|---------|--------|-----|
| **Setup Time** | 5 minutes | 30+ minutes |
| **Cost** | Free tier available | ~$5-10/month |
| **SSL** | Automatic | Manual setup |
| **Scaling** | Automatic | Manual |
| **Maintenance** | None | Server management |
| **Customization** | Limited | Full control |
| **Performance** | Global CDN | Single region |

## Recommended Approach

**For most users, Vercel is recommended because:**
- ✅ Zero server management
- ✅ Automatic SSL certificates
- ✅ Global CDN for fast loading
- ✅ Automatic deployments from GitHub
- ✅ Free tier available
- ✅ Built-in analytics and monitoring

**Choose EC2 if you need:**
- 🔧 Full server control
- 🔧 Custom server configurations
- 🔧 Integration with existing AWS infrastructure
- 🔧 Specific compliance requirements

## Troubleshooting

### Common Issues

1. **Domain not resolving**:
   - Check DNS propagation: `nslookup auth.brmh.in`
   - Wait up to 24 hours for DNS changes

2. **SSL certificate issues**:
   - Vercel: Automatic, no action needed
   - EC2: Check Certbot logs: `sudo certbot certificates`

3. **CORS errors**:
   - Ensure backend allows requests from `https://auth.brmh.in`
   - Check CORS configuration in your backend

4. **Callback not working**:
   - Verify callback URL in Cognito matches exactly
   - Check if the callback.html file is accessible

### Health Checks

```bash
# Check if the service is running
curl https://auth.brmh.in/health

# Check SSL certificate
openssl s_client -connect auth.brmh.in:443 -servername auth.brmh.in

# Check DNS
nslookup auth.brmh.in
```

## Next Steps

After successful deployment:

1. ✅ Test the authentication flow
2. ✅ Update your frontend applications
3. ✅ Set up monitoring and alerts
4. ✅ Document the new auth flow for your team
5. ✅ Plan for scaling if needed

## Support

If you encounter issues:
- Check the deployment logs
- Verify all configuration files
- Test each component individually
- Contact support: support@brmh.in
