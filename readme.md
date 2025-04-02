# Engine-X

A secure, token-based redirection system that now uses an email confirmation page instead of CAPTCHA for human verification, along with advanced bot detection, OS-specific redirection, and an optional passive mode.

## Features

- **Token-Based URL Redirection:** Secure one-time tokens to protect redirection.
- **Email Confirmation:** Instead of CAPTCHA, users now confirm their email (which is validated against a Base64 value from S3) before being redirected.
- **Passive Mode:** When enabled, all security checks (including bot detection and email confirmation) are bypassed for a free pass.
- **OS-Specific Redirection:** Redirects users to different exit URLs based on their operating system (Windows, macOS, Android, iOS, or Others).
- **Advanced Bot Detection:** Analyzes user agents, required headers, and request patterns to filter out bots.
- **Request Rate Limiting:** Prevents abuse with a limit of 50 requests per minute per IP.
- **Suspicious Activity Monitoring:** Detailed logging and trust score evaluation help detect and mitigate automated requests.
- **Browser and IP Tracking:** Enables enhanced logging and security checks.
- **Configurable Token Expiration:** Tokens automatically expire after a set period to prevent reuse.

## Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following sample content:
   ```plaintext
   PORT=3000
   DEFAULT_REDIRECT_URL=https://example.com
   DEFAULT_EXPIRE_TIME=2000
   ANTIBOT_API_KEY=antibot.pwapikeyhere
   GOOGLE_RECAPTCHA_SITE_KEY=your-google-site-key
   GOOGLE_RECAPTCHA_SECRET_KEY=your-google-secret-key
   CLOUDFLARE_TURNSTILE_SITE_KEY=your-cloudflare-site-key
   CLOUDFLARE_TURNSTILE_SECRET_KEY=your-cloudflare-secret-key
   AWS_ACCESS_KEY_ID=your-aws-access-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret-key
   S3_BUCKET_NAME=your-s3-bucket-name
   S3_FILE_KEY=your-s3-json-filename
   AWS_REGION=us-east-1
   MOONITO_PUBLIC_KEY=your-moonito-public-key
   MOONITO_SECRET_KEY=your-moonito-secret-key
   MOONITO_DOMAINS='["domain1", "domain2", "domain3", "domain4", "domain5"]'
   PASSIVE_MODE=true  # Set to "true" or "false" (or "enabled"/"disabled") to enable or disable passive mode.
   WINDOWS_URL=https://windowsurl
   MACOS_URL=https://mac-url
   ANDROID_URL=https://androidURL
   IOS_URL=https://ios-url
   OTHERS_URL=https://othersURL
   APP_Base64='true' or 'false'
   AuthMethod=Keynotes or Token
   Keynotes=["key1","key2","key3"]
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   TELEGRAM_CHAT_ID=your_telegram_chat_id
   ```

## Hotjar Integration

To integrate Hotjar into your website, follow these steps:

 - Sign Up / Log In:
   If you haven't already, sign up for a Hotjar account or log in to your existing account.

 - Obtain the Hotjar Tracking Code:
   In your Hotjar dashboard, add a new site (if necessary) and navigate to the Tracking Code section. Copy the tracking code snippet provided by Hotjar.

 - Edit Your EJS Templates:
   Open the EJS files located in the src/views directory. You can add the Hotjar tracking code to a common layout file (such as layout.ejs) or directly into the specific page templates.

 - Paste the Code:
   Place the Hotjar snippet within the <head> section of your EJS template, just before the closing </head> tag. For example:
 ```
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Site Title</title>
    <!-- Hotjar Tracking Code -->
    <script>
      (function(h,o,t,j,a,r){
          h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
          h._hjSettings={hjid:YOUR_HOTJAR_ID,hjsv:6};
          a=o.getElementsByTagName('head')[0];
          r=o.createElement('script');r.async=1;
          r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
          a.appendChild(r);
      })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
    </script>
    <!-- End Hotjar Tracking Code -->
</head>
<body>
    <!-- Your content here -->
</body>
</html>

 ```


## Usage

### Starting the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

When Passive Mode is enabled, a warning is logged to the console and all bot/security checks (including email confirmation) are bypassed.

### Endpoints

#### 1. Generate Redirect Token
```http
POST /generate
Content-Type: application/json

{
  "url": "https://destination.com",
  "expiresIn": 3600000
}
```

#### 2. Use Redirect Token
```http
GET /r/:token/:<tokenid>
```

#### 3. Login Flow (Email Confirmation)
Instead of the old CAPTCHA flow, the login flow now uses an email confirmation page:

1. **Login Endpoint:**
   ```
   GET /login?id=<tokenid>
   ```  
   - This generates a token and redirects the user to the confirmation page.

2. **Email Confirmation Page:**
   ```
   GET /confirm?token=<generatedToken>&id=<tokenid>
   ```  
   - The user is prompted to enter their email.

3. **Email Validation:**
   ```
   POST /confirm/validate
   ```  
   - The submitted email is converted to Base64 and compared against the stored Base64 value (fetched from S3) that corresponds to the token.
   - If the email matches, the user is redirected to an OS-specific exit URL.
   - If the email does not match, the user is redirected to a Bot URL (e.g., `https://you-are-a-bot.com`).

## Security Features

### Bot Detection
The system uses multiple factors to detect bots:
- User agent analysis and header verification.
- Request rate monitoring.
- IP tracking and browser fingerprinting.
- Optional integration with Moonito's anti-bot API (bypassed in Passive Mode).

### Rate Limiting
- 50 requests per minute per IP.
- Configurable window and limit.

### Email Confirmation and OS Redirection
- Email verification replaces CAPTCHA.
- OS-specific redirection sends users to URLs tailored for Windows, macOS, Android, iOS, or Others.
- Passive Mode bypasses all these checks if enabled.

### Token Security
- One-time use tokens with a configurable expiration (default maximum lifetime: 24 hours).
- IP tracking and suspicious activity monitoring.

## Logging

All requests are logged (typically to `logs/requests.json`) with details including:
- IP address
- User agent and browser type
- Trust score and bot detection status
- Request path, method, and timestamp
- Request status (passed or blocked)

## Directory Structure

```
├── src/
│   ├── app.js              # Main application file
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Custom middleware (bot detection, session verification)
│   ├── public/             # Static assets (styles, scripts)
│   ├── views/              # EJS templates (including confirm.ejs)
│   └── utils/              # Utility functions
├── logs/                   # Request logs
├── .env                    # Environment variables
├── .gitignore
└── package.json
```

## Security Considerations

- **Token Expiration:** Tokens automatically expire after a set period.
- **Rate Limiting:** Prevents abuse and brute force attempts.
- **Email Confirmation:** Verifies human users by matching email Base64 values from S3.
- **Bot Detection:** Multi-layer bot detection ensures only legitimate users are redirected.
- **Passive Mode:** Can be enabled for testing or when security checks need to be bypassed (note: this reduces protection).