


import { mg } from "../config/mailgun.config.js";
import logger from "../lib/logger.js";

// Generic Mailgun send function
export const sendEmail = async ({ to, subject, html }) => {
  const data = {
    from: `KandCo <${process.env.MAILGUN_FROM}>`,
    to,
    subject,
    html,
  };

  try {
    return await mg.messages.create(
      process.env.MAILGUN_DOMAIN, // e.g. mg.example.com
      data
    );
  } catch (error) {
    logger.error("Mailgun error:", error);
    throw error;
  }
};


/* ================= VERIFICATION EMAIL ================= */
export const sendVerificationEmail = async (email, full_name, otp) => {
  try {
    await sendEmail({
      to: email,
      subject: "Verify your email",
      html: `<!DOCTYPE html>
<html>
<head>
    <style>
        /* Reset and Base Styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f3fbf7;
            color: #133a2d;
            line-height: 1.5;
        }
        
        /* Container */
        .email-container {
            max-width: 500px;
            margin: 40px auto;
            background-color: #ffffff;
            border: 1px solid rgba(15, 157, 115, 0.20);
            border-radius: 24px;
            padding: 32px;
            box-shadow: 0 20px 60px rgba(15, 157, 115, 0.12);
        }
        
        /* Header */
        .header {
            text-align: center;
            margin-bottom: 32px;
        }
        
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 12px;
            background: rgba(15, 157, 115, 0.10);
            border: 1px solid rgba(15, 157, 115, 0.24);
            border-radius: 9999px;
            color: #0f3d2f;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 24px;
        }
        
        .pulse-dot {
            width: 8px;
            height: 8px;
            background-color: #0f9d73;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% {
                opacity: 1;
                transform: scale(1);
            }
            50% {
                opacity: 0.5;
                transform: scale(1.2);
            }
        }
        
        .title {
            font-size: 28px;
            font-weight: bold;
            background: linear-gradient(to right, #0f3d2f, #0f9d73);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 8px;
            color: #133a2d;
        }
        
        /* Content */
        .greeting {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 16px;
            color: #133a2d;
        }
        
        .greeting span {
            color: #0f9d73;
        }
        
        .instruction {
            color: #5f7a70;
            margin-bottom: 24px;
            font-size: 16px;
        }
        
        /* OTP Box */
        .otp-container {
            background: rgba(15, 157, 115, 0.08);
            border: 1px solid rgba(15, 157, 115, 0.20);
            border-radius: 20px;
            padding: 32px 24px;
            text-align: center;
            margin-bottom: 24px;
        }
        
        .otp-code {
            font-size: 48px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #133a2d;
            margin-bottom: 16px;
            font-family: monospace;
        }
        
        .expiry {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            color: #5f7a70;
            font-size: 14px;
        }
        
        .expiry svg {
            width: 16px;
            height: 16px;
        }
        
        /* Info Box */
        .info-box {
            background: rgba(15, 157, 115, 0.08);
            border: 1px solid rgba(15, 157, 115, 0.20);
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 24px;
        }
        
        .info-text {
            color: #5f7a70;
            font-size: 14px;
            line-height: 1.6;
        }
        
        /* Footer */
        .footer {
            border-top: 1px solid rgba(15, 157, 115, 0.20);
            padding-top: 24px;
            text-align: center;
        }
        
        .footer-text {
            color: #6d8379;
            font-size: 12px;
            line-height: 1.5;
        }
        
        .security-text {
            color: #0f9d73;
            opacity: 0.8;
            margin-top: 4px;
        }
        
        /* Responsive */
        @media (max-width: 600px) {
            .email-container {
                margin: 20px;
                padding: 24px;
                border-radius: 20px;
            }
            
            .otp-code {
                font-size: 36px;
                letter-spacing: 6px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <div class="badge">
                <span class="pulse-dot"></span>
                Verify Your Account
            </div>
            <h1 class="title">Welcome!</h1>
        </div>
        
        <!-- Content -->
        <div class="content">
            <h3 class="greeting">Hello <span id="full_name">${full_name}</span></h3>
            <p class="instruction">Your verification code is:</p>
            
            <!-- OTP Display -->
            <div class="otp-container">
                <div class="otp-code" id="otp_code">${otp}</div>
                <div class="expiry">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Expires in 1 hour</span>
                </div>
            </div>
            
            <!-- Instructions -->
            <div class="info-box">
                <p class="info-text">
                    Enter this code on the verification page to complete your registration.
                </p>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <p class="footer-text">
                    If you didn't request this code, please ignore this email.
                    <br>
                    <span class="security-text">Your security is our priority.</span>
                </p>
            </div>
        </div>
    </div>

    <script>
        // These would be dynamically replaced by your backend
        document.getElementById('full_name').textContent = 'John Doe';
        document.getElementById('otp_code').textContent = '123456';
    </script>
</body>
</html>`
    });

    return { success: true };
  } catch (error) {
    logger.error("Email error:", error);
    return { success: false, message: "Failed to send email" };
  }
};

/* ================= INQUIRY ACKNOWLEDGEMENT ================= */
export const sendInquiryAcknowledgementEmail = async (email, name, preferred_datetime, timezone) => {
  try {
    const meetingDate = new Date(preferred_datetime);
    const formattedDateTime = meetingDate.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: timezone,
    });

    await sendEmail({
      to: email,
      subject: "We've Received Your Inquiry",
      html:  `
        <!DOCTYPE html>
<html>
<head>
    <style>
        /* Reset and Base Styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f3fbf7;
            color: #133a2d;
            line-height: 1.6;
        }
        
        /* Container */
        .email-container {
            max-width: 520px;
            margin: 40px auto;
            background-color: #ffffff;
            border: 1px solid rgba(15, 157, 115, 0.20);
            border-radius: 24px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(15, 157, 115, 0.12);
        }
        
        /* Header */
        .header {
            text-align: center;
            margin-bottom: 36px;
        }
        
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            background: rgba(15, 157, 115, 0.10);
            border: 1px solid rgba(15, 157, 115, 0.24);
            border-radius: 9999px;
            color: #0f3d2f;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 24px;
        }
        
        .title {
            font-size: 28px;
            font-weight: bold;
            background: linear-gradient(to right, #0f3d2f, #0f9d73);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            color: #133a2d;
        }
        
        /* Content */
        .greeting {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #133a2d;
        }
        
        .greeting span {
            color: #0f9d73;
        }
        
        .message {
            color: #133a2d;
            margin-bottom: 20px;
            font-size: 16px;
        }
        
        .message strong {
            color: #0f9d73;
        }
        
        /* Meeting Time Card */
        .meeting-card {
            background: rgba(15, 157, 115, 0.08);
            border: 1px solid rgba(15, 157, 115, 0.20);
            border-radius: 16px;
            padding: 24px;
            margin: 28px 0;
        }
        
        .meeting-label {
            display: flex;
            align-items: center;
            gap: 10px;
            color: #133a2d;
            font-size: 15px;
            font-weight: 600;
            margin-bottom: 12px;
        }
        
        .meeting-label svg {
            width: 18px;
            height: 18px;
            color: #0f9d73;
        }
        
        .meeting-time {
            color: #133a2d;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 6px;
        }
        
        .timezone {
            color: #6d8379;
            font-size: 14px;
        }
        
        /* Info Box */
        .info-box {
            background: rgba(15, 157, 115, 0.08);
            border: 1px solid rgba(15, 157, 115, 0.18);
            border-radius: 16px;
            padding: 20px;
            margin: 24px 0;
        }
        
        .info-box strong {
            color: #0f9d73;
        }
        
        /* Response Time */
        .response-time {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 16px;
            background: rgba(15, 157, 115, 0.08);
            border-radius: 12px;
            margin: 24px 0;
        }
        
        .response-time svg {
            width: 20px;
            height: 20px;
            color: #0f9d73;
        }
        
        .response-time span {
            font-weight: 600;
            color: #0f9d73;
        }
        
        /* Signature */
        .signature {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid rgba(15, 157, 115, 0.20);
        }
        
        .signature strong {
            color: #0f9d73;
            font-size: 16px;
        }
        
        /* Footer */
        .footer {
            margin-top: 32px;
            text-align: center;
        }
        
        .company-name {
            color: #0f9d73;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        
        .footer-text {
            color: #6d8379;
            font-size: 13px;
            opacity: 0.8;
        }
        
        /* Responsive */
        @media (max-width: 600px) {
            .email-container {
                margin: 20px;
                padding: 28px;
            }
            
            .meeting-time {
                font-size: 16px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <div class="badge">
                Inquiry Received
            </div>
            <h1 class="title">Thank You</h1>
        </div>
        
        <!-- Content -->
        <div class="content">
            <h3 class="greeting">Hello <span id="name">${name}</span>,</h3>
            
            <p class="message">
                Thank you for contacting <strong>KandCo</strong>.
            </p>
            
            <p class="message">
                We've successfully received your inquiry and our team is reviewing it.
            </p>
            
            <!-- Meeting Time -->
            <div class="meeting-card">
                <div class="meeting-label">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Preferred Meeting Time</span>
                </div>
                <div class="meeting-time" id="formattedDateTime">${formattedDateTime}</div>
                <div class="timezone" id="timezone">${timezone}</div>
            </div>
            
            <!-- Next Steps -->
            <div class="info-box">
                <p class="message">
                    If your request is accepted, you'll receive a Google Meet link for further discussion.
                </p>
            </div>
            
            <!-- Response Time -->
            <div class="response-time">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="message">
                    We usually respond within <span>24 hours</span>.
                </p>
            </div>
            
            <!-- Signature -->
            <div class="signature">
                <p class="message">Best regards,</p>
                <p class="message"><strong>KandCo Team</strong></p>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <div class="company-name">KandCo</div>
                <p class="footer-text">
                    Cloud FinOps Audit Specialists
                </p>
            </div>
        </div>
    </div>

    <script>
        // These would be dynamically replaced by your backend
        document.getElementById('name').textContent = 'John Doe';
        document.getElementById('formattedDateTime').textContent = 'April 15, 2024 at 2:30 PM';
        document.getElementById('timezone').textContent = 'America/New_York';
    </script>
</body>
</html>
        `
    });

    return { success: true };
  } catch (error) {
    logger.error("Client email error:", error);
    return { success: false, message: "Failed to send acknowledgement email" };
  }
};

/* ================= INQUIRY EMAIL TO COMPANY ================= */
export const sendInquiryEmailToCompany = async (name, email, message, preferred_datetime, timezone, acceptLink, rejectLink) => {
  try {
    const meetingDate = new Date(preferred_datetime);
    const formattedDateTime = meetingDate.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: timezone,
    });

    await sendEmail({
      to: process.env.COMPANY_EMAIL,
      subject: "New Inquiry Received - Action Required",
      html: `
        <!DOCTYPE html>
<html>
<head>
    <style>
        /* Reset and Base Styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f3fbf7;
            color: #133a2d;
            line-height: 1.6;
        }
        
        /* Container */
        .email-container {
            max-width: 560px;
            margin: 40px auto;
            background-color: #ffffff;
            border: 1px solid rgba(15, 157, 115, 0.20);
            border-radius: 24px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(15, 157, 115, 0.12);
        }
        
        /* Header */
        .header {
            text-align: center;
            margin-bottom: 36px;
        }
        
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            background: rgba(15, 157, 115, 0.10);
            border: 1px solid rgba(15, 157, 115, 0.24);
            border-radius: 9999px;
            color: #0f3d2f;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 20px;
        }
        
        .alert-icon {
            width: 10px;
            height: 10px;
            background-color: #0f9d73;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% {
                opacity: 1;
                transform: scale(1);
            }
            50% {
                opacity: 0.5;
                transform: scale(1.2);
            }
        }
        
        .title {
            font-size: 28px;
            font-weight: bold;
            background: linear-gradient(to right, #0f3d2f, #0f9d73);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            color: #133a2d;
        }
        
        /* Inquiry Info Card */
        .info-card {
            background: rgba(15, 157, 115, 0.08);
            border: 1px solid rgba(15, 157, 115, 0.20);
            border-radius: 16px;
            padding: 28px;
            margin-bottom: 28px;
        }
        
        .info-row {
            display: flex;
            align-items: flex-start;
            margin-bottom: 16px;
        }
        
        .info-label {
            width: 120px;
            color: #0f9d73;
            font-weight: 600;
            font-size: 14px;
            flex-shrink: 0;
        }
        
        .info-value {
            color: #133a2d;
            font-size: 15px;
            flex-grow: 1;
        }
        
        /* Message Box */
        .message-box {
            background: rgba(15, 157, 115, 0.08);
            border: 1px solid rgba(15, 157, 115, 0.18);
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .message-label {
            color: #0f9d73;
            font-weight: 600;
            margin-bottom: 12px;
            font-size: 15px;
        }
        
        .message-content {
            color: #133a2d;
            white-space: pre-wrap;
            font-size: 14px;
            line-height: 1.6;
        }
        
        /* Meeting Time Card */
        .meeting-card {
            background: rgba(15, 157, 115, 0.08);
            border: 1px solid rgba(15, 157, 115, 0.20);
            border-radius: 16px;
            padding: 24px;
            margin: 28px 0;
        }
        
        .meeting-label {
            display: flex;
            align-items: center;
            gap: 10px;
            color: #0f9d73;
            font-size: 15px;
            font-weight: 600;
            margin-bottom: 12px;
        }
        
        .meeting-label svg {
            width: 18px;
            height: 18px;
        }
        
        .meeting-time {
            color: #133a2d;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 6px;
        }
        
        .timezone {
            color: #6d8379;
            font-size: 14px;
        }
        
        /* Divider */
        .divider {
            height: 1px;
            background: rgba(15, 157, 115, 0.20);
            margin: 32px 0;
        }
        
        /* Action Section */
        .action-section {
            text-align: center;
            margin: 32px 0;
        }
        
        .action-title {
            color: #133a2d;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 24px;
        }
        
        .action-buttons {
            display: flex;
            gap: 16px;
            justify-content: center;
            margin-bottom: 28px;
        }
        
        .action-button {
            padding: 14px 28px;
            border-radius: 12px;
            font-weight: 600;
            text-decoration: none;
            font-size: 15px;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        
        .accept-button {
            background: rgba(15, 157, 115, 0.12);
            border: 1px solid rgba(40, 167, 69, 0.4);
            color: #0f9d73;
        }
        
        .accept-button:hover {
            background: rgba(15, 157, 115, 0.18);
            border-color: rgba(15, 157, 115, 0.35);
            transform: translateY(-2px);
            box-shadow: 0 4px 20px rgba(15, 157, 115, 0.12);
        }
        
        .reject-button {
            background: rgba(15, 157, 115, 0.12);
            border: 1px solid rgba(220, 53, 69, 0.4);
            color: #0b7d5b;
        }
        
        .reject-button:hover {
            background: rgba(15, 157, 115, 0.18);
            border-color: rgba(15, 157, 115, 0.35);
            transform: translateY(-2px);
            box-shadow: 0 4px 20px rgba(15, 157, 115, 0.12);
        }
        
        /* Note */
        .note {
            background: rgba(15, 157, 115, 0.06);
            border: 1px solid rgba(15, 157, 115, 0.08);
            border-radius: 12px;
            padding: 20px;
            margin-top: 28px;
        }
        
        .note p {
            color: #6d8379;
            font-size: 14px;
            text-align: center;
            line-height: 1.5;
        }
        
        /* Footer */
        .footer {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid rgba(15, 157, 115, 0.20);
            text-align: center;
        }
        
        .company-name {
            color: #0f9d73;
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        
        .footer-text {
            color: #5f7a70;
            font-size: 13px;
        }
        
        /* Responsive */
        @media (max-width: 600px) {
            .email-container {
                margin: 20px;
                padding: 24px;
            }
            
            .action-buttons {
                flex-direction: column;
                align-items: center;
            }
            
            .action-button {
                width: 100%;
                justify-content: center;
            }
            
            .info-row {
                flex-direction: column;
                gap: 4px;
            }
            
            .info-label {
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <div class="badge">
                New Inquiry
            </div>
            <h1 class="title">Inquiry Received</h1>
        </div>
        
        <!-- Inquiry Details -->
        <div class="info-card">
            <div class="info-row">
                <div class="info-label">Name:</div>
                <div class="info-value" id="name">${name}</div>
            </div>
            
            <div class="info-row">
                <div class="info-label">Email:</div>
                <div class="info-value" id="email">${email}</div>
            </div>
        </div>
        
        <!-- Message -->
        <div class="message-box">
            <div class="message-label">Message:</div>
            <div class="message-content" id="message">${message}</div>
        </div>
        
        <!-- Meeting Time -->
        <div class="meeting-card">
            <div class="meeting-label">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Preferred Meeting Time</span>
            </div>
            <div class="meeting-time" id="formattedDateTime">${formattedDateTime}</div>
            <div class="timezone" id="timezone">${timezone}</div>
        </div>
        
        <!-- Divider -->
        <div class="divider"></div>
        
        <!-- Action Section -->
        <div class="action-section">
            <h2 class="action-title">Take Action</h2>
            
            <div class="action-buttons">
                <a href="${acceptLink}" class="action-button accept-button">
                    <span>&#10004;</span>
                    Accept Inquiry
                </a>
                
                <a href="${rejectLink}" class="action-button reject-button">
                    <span>&#10060;</span>
                    Reject Inquiry
                </a>
            </div>
            
            <div class="note">
                <p>
                    If accepted, a Google Meet link will be automatically created
                    for the above time and sent to the client.
                </p>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="company-name">KandCo Dashboard</div>
            <p class="footer-text">
                Cloud FinOps Audit Management
            </p>
        </div>
    </div>

   
</body>
</html>
      `
    });

    return { success: true };
  } catch (error) {
    logger.error("Company email error:", error);
    return { success: false, message: "Failed to send company email" };
  }
};

/* ================= MEETING CONFIRMATION EMAIL ================= */
/* ================= INQUIRY RELAY EMAIL TO BOSS ================= */
export const sendInquiryRelayEmailToBoss = async ({
  name,
  email,
  message,
  preferred_datetime,
  timezone,
  severity,
  note,
  reviewLink,
}) => {
  try {
    const meetingDate = new Date(preferred_datetime);
    const formattedDateTime = meetingDate.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: timezone,
    });

    await sendEmail({
      to: process.env.COMPANY_EMAIL,
      subject: "Inquiry Relay – Review Required",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background:#f8f9fa; color:#111827; }
            .card { max-width: 560px; margin: 30px auto; background:#fff; border-radius: 12px; padding: 28px; border: 1px solid #e5e7eb; }
            .title { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
            .meta { color:#6b7280; font-size: 13px; margin-bottom: 12px; }
            .label { font-size: 12px; color:#6b7280; text-transform: uppercase; letter-spacing: .6px; margin: 12px 0 4px; }
            .cta { display:inline-block; margin-top: 16px; padding: 10px 14px; background:#007758; color:#ffffff; border-radius: 8px; text-decoration:none; font-weight:600; }
            .severity { font-weight:700; color:#b45309; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="title">Inquiry Relay – Review Required</div>
            <div class="meta">${name} • ${email}</div>
            <div class="label">Preferred Timeslot</div>
            <div>${formattedDateTime} (${timezone})</div>
            <div class="label">Summary</div>
            <div>${message || "-"}</div>
            <div class="label">Severity</div>
            <div class="severity">${severity || "UNKNOWN"}</div>
            <div class="label">Admin Note</div>
            <div>${note || "-"}</div>
            <a class="cta" href="${reviewLink}">Review &amp; Decide</a>
          </div>
        </body>
        </html>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Inquiry relay email error:", error);
    return { success: false, message: "Failed to send relay email" };
  }
};

export const sendMeetingConfirmationEmail = async (email, name, preferred_datetime, timezone, meetLink) => {
  try {
    const meetingDate = new Date(preferred_datetime);
    const formattedDateTime = meetingDate.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: timezone,
    });

    await sendEmail({
      to: email,
      subject: "Your Meeting is Scheduled",
      html: `
       <!DOCTYPE html>
<html>
<head>
    <style>
        /* Reset and Base Styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f3fbf7;
            color: #133a2d;
            line-height: 1.6;
        }
        
        /* Container */
        .email-container {
            max-width: 560px;
            margin: 40px auto;
            background-color: #ffffff;
            border: 1px solid rgba(15, 157, 115, 0.20);
            border-radius: 24px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(15, 157, 115, 0.12);
        }
        
        /* Header */
        .header {
            text-align: center;
            margin-bottom: 36px;
        }
        
        .success-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 20px;
            background: rgba(40, 167, 69, 0.1);
            border: 1px solid rgba(15, 157, 115, 0.18);
            border-radius: 9999px;
            color: #0f9d73;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 24px;
        }
        
        .success-icon {
            width: 12px;
            height: 12px;
            background-color: #0f9d73;
            border-radius: 50%;
            animation: successPulse 2s infinite;
        }
        
        @keyframes successPulse {
            0%, 100% {
                opacity: 1;
                transform: scale(1);
            }
            50% {
                opacity: 0.7;
                transform: scale(1.1);
            }
        }
        
        .title {
            font-size: 28px;
            font-weight: bold;
            background: linear-gradient(to right, #0f3d2f, #0f9d73);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 12px;
            color: #133a2d;
        }
        
        .subtitle {
            color: #5f7a70;
            font-size: 16px;
            max-width: 400px;
            margin: 0 auto;
        }
        
        /* Content */
        .content {
            margin-bottom: 32px;
        }
        
        .greeting {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #133a2d;
        }
        
        .greeting span {
            color: #0f9d73;
        }
        
        .success-message {
            color: #133a2d;
            font-size: 16px;
            margin-bottom: 28px;
        }
        
        .success-message strong {
            color: #0f9d73;
        }
        
        /* Meeting Details Card */
        .meeting-card {
            background: rgba(15, 157, 115, 0.08);
            border: 1px solid rgba(15, 157, 115, 0.20);
            border-radius: 16px;
            padding: 28px;
            margin: 28px 0;
        }
        
        .card-title {
            display: flex;
            align-items: center;
            gap: 10px;
            color: #0f9d73;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
        }
        
        .card-title svg {
            width: 20px;
            height: 20px;
        }
        
        .details-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .detail-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 18px;
            padding-bottom: 18px;
            border-bottom: 1px solid rgba(15, 157, 115, 0.08);
        }
        
        .detail-item:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
        }
        
        .detail-label {
            width: 130px;
            color: #0f9d73;
            font-weight: 600;
            font-size: 14px;
            flex-shrink: 0;
        }
        
        .detail-value {
            color: #133a2d;
            font-size: 15px;
            flex-grow: 1;
        }
        
        .meet-link {
            color: #0f9d73;
            text-decoration: none;
            font-weight: 500;
            word-break: break-all;
            display: inline-block;
            padding: 8px 12px;
            background: rgba(15, 157, 115, 0.10);
            border-radius: 8px;
            border: 1px solid rgba(15, 157, 115, 0.18);
            transition: all 0.3s ease;
        }
        
        .meet-link:hover {
            background: rgba(15, 157, 115, 0.18);
            border-color: rgba(15, 157, 115, 0.30);
        }
        
        /* Join Button */
        .join-section {
            text-align: center;
            margin: 32px 0;
        }
        
        .join-button {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 16px 32px;
            background: #0f9d73;
            color: #ffffff;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
            border: 1px solid rgba(15, 157, 115, 0.18);
            box-shadow: 0 4px 20px rgba(15, 157, 115, 0.12);
        }
        
        .join-button:hover {
            background: #0b7d5b;
            transform: translateY(-2px);
            box-shadow: 0 6px 25px rgba(15, 157, 115, 0.18);
        }
        
        .join-button svg {
            width: 20px;
            height: 20px;
        }
        
        /* Instructions */
        .instructions {
            background: rgba(15, 157, 115, 0.06);
            border: 1px solid rgba(15, 157, 115, 0.08);
            border-radius: 12px;
            padding: 20px;
            margin: 24px 0;
        }
        
        .instructions p {
            color: #6d8379;
            font-size: 14px;
            text-align: center;
            line-height: 1.5;
        }
        
        /* Signature */
        .signature {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid rgba(15, 157, 115, 0.20);
        }
        
        .signature p {
            color: #133a2d;
            margin-bottom: 8px;
            font-size: 15px;
        }
        
        .team-name {
            color: #0f9d73;
            font-size: 16px;
            font-weight: bold;
        }
        
        /* Footer */
        .footer {
            margin-top: 32px;
            text-align: center;
        }
        
        .company-name {
            color: #0f9d73;
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        
        .footer-text {
            color: #5f7a70;
            font-size: 13px;
        }
        
        /* Calendar Add Section */
        .calendar-section {
            margin: 24px 0;
            text-align: center;
        }
        
        .calendar-link {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 20px;
            background: rgba(15, 157, 115, 0.08);
            border: 1px solid rgba(15, 157, 115, 0.20);
            border-radius: 8px;
            color: #6d8379;
            text-decoration: none;
            font-size: 14px;
            transition: all 0.3s ease;
        }
        
        .calendar-link:hover {
            background: rgba(15, 157, 115, 0.18);
            border-color: rgba(255, 255, 255, 0.2);
        }
        
        /* Responsive */
        @media (max-width: 600px) {
            .email-container {
                margin: 20px;
                padding: 24px;
            }
            
            .detail-item {
                flex-direction: column;
                gap: 4px;
            }
            
            .detail-label {
                width: 100%;
            }
            
            .join-button {
                width: 100%;
                justify-content: center;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <div class="success-badge">
                Inquiry Accepted
            </div>
            <h1 class="title">Meeting Scheduled</h1>
            <p class="subtitle">Your FinOps Audit consultation is confirmed</p>
        </div>
        
        <!-- Content -->
        <div class="content">
            <h3 class="greeting">Hello <span id="name">${name}</span>,</h3>
            
            <p class="success-message">
                Good news! Your inquiry has been <strong>accepted</strong> by our team.
            </p>
            
            <!-- Meeting Details Card -->
            <div class="meeting-card">
                <div class="card-title">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Meeting Details</span>
                </div>
                
                <ul class="details-list">
                    <li class="detail-item">
                        <div class="detail-label">Date & Time:</div>
                        <div class="detail-value">
                            <strong id="formattedDateTime">${formattedDateTime}</strong>
                            <br>
                            <small style="color: #5f7a70;" id="timezone">${timezone}</small>
                        </div>
                    </li>
                    
                    <li class="detail-item">
                        <div class="detail-label">Zoom Meeting Meet:</div>
                        <div class="detail-value">
                            <a href="${meetLink}" class="meet-link" id="meetLink">${meetLink}</a>
                        </div>
                    </li>
                </ul>
            </div>
            
            <!-- Join Button -->
            <div class="join-section">
                <a href="${meetLink}" class="join-button">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Join Meeting Now
                </a>
            </div>
          
            
            <!-- Instructions -->
            <div class="instructions">
                <p>
                    Please join the meeting at the scheduled time. 
                    <br>
                    We recommend joining 5 minutes early to test your audio and video.
                </p>
            </div>
            
            <!-- Signature -->
            <div class="signature">
                <p>Best regards,</p>
                <p class="team-name">KandCo Team</p>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="company-name">KandCo</div>
            <p class="footer-text">
                Cloud FinOps Audit Specialists
            </p>
        </div>
    </div>

  
</body>
</html>
      `
    });

    return { success: true };
  } catch (error) {
    logger.error("Meeting confirmation email error:", error);
    return { success: false, message: "Failed to send meeting confirmation email" };
  }
};

/* ================= INQUIRY REJECTION EMAIL ================= */
export const sendInquiryRejectionEmail = async (email, name, reason) => {
  try {
    await sendEmail({
      to: email,
      subject: "Your Inquiry Status",
      html:  `
        <!DOCTYPE html>
<html>
<head>
    <style>
        /* Reset and Base Styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f3fbf7;
            color: #133a2d;
            line-height: 1.6;
        }
        
        /* Container */
        .email-container {
            max-width: 560px;
            margin: 40px auto;
            background-color: #ffffff;
            border: 1px solid rgba(15, 157, 115, 0.20);
            border-radius: 24px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(15, 157, 115, 0.12);
        }
        
        /* Header */
        .header {
            text-align: center;
            margin-bottom: 36px;
        }
        
        .rejection-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 20px;
            background: rgba(220, 53, 69, 0.1);
            border: 1px solid rgba(15, 157, 115, 0.18);
            border-radius: 9999px;
            color: #0b7d5b;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 24px;
        }
        
        .rejection-icon {
            width: 12px;
            height: 12px;
            background-color: #0b7d5b;
            border-radius: 50%;
            position: relative;
        }
        
        .rejection-icon::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 6px;
            height: 6px;
            background-color: #f3fbf7;
            border-radius: 50%;
            transform: translate(-50%, -50%);
        }
        
        .title {
            font-size: 28px;
            font-weight: bold;
            background: linear-gradient(to right, #0f3d2f, #0f9d73);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 12px;
            color: #133a2d;
        }
        
        .subtitle {
            color: #5f7a70;
            font-size: 16px;
            max-width: 400px;
            margin: 0 auto;
        }
        
        /* Content */
        .content {
            margin-bottom: 32px;
        }
        
        .greeting {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #133a2d;
        }
        
        .greeting span {
            color: #0f9d73;
        }
        
        .message {
            color: #133a2d;
            font-size: 16px;
            margin-bottom: 16px;
        }
        
        .message strong {
            color: #0b7d5b;
        }
        
        /* Rejection Card */
        .rejection-card {
            background: rgba(220, 53, 69, 0.05);
            border: 1px solid rgba(15, 157, 115, 0.12);
            border-radius: 16px;
            padding: 28px;
            margin: 28px 0;
            position: relative;
            overflow: hidden;
        }
        
        .rejection-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            background: linear-gradient(to bottom, #0b7d5b, #0f9d73);
        }
        
        .card-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            background: rgba(220, 53, 69, 0.1);
            border-radius: 12px;
            margin-bottom: 16px;
        }
        
        .card-icon svg {
            width: 24px;
            height: 24px;
            color: #0b7d5b;
        }
        
        .card-title {
            color: #0b7d5b;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 12px;
        }
        
        .card-content {
            color: #133a2d;
            font-size: 15px;
            line-height: 1.6;
        }
        
        /* Appreciation Section */
        .appreciation {
            background: rgba(15, 157, 115, 0.06);
            border: 1px solid rgba(15, 157, 115, 0.08);
            border-radius: 12px;
            padding: 24px;
            margin: 28px 0;
            text-align: center;
        }
        
        .appreciation p {
            color: #6d8379;
            font-size: 15px;
            line-height: 1.6;
        }
        
        /* Next Steps */
        .next-steps {
            margin: 28px 0;
        }
        
        .next-steps-title {
            color: #0f9d73;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .next-steps-title svg {
            width: 18px;
            height: 18px;
        }
        
        .steps-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .step-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 12px;
            padding: 12px;
            background: rgba(15, 157, 115, 0.05);
            border-radius: 8px;
            border: 1px solid rgba(15, 157, 115, 0.08);
        }
        
        .step-item:last-child {
            margin-bottom: 0;
        }
        
        .step-number {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            background: rgba(15, 157, 115, 0.10);
            border-radius: 6px;
            color: #0f9d73;
            font-size: 12px;
            font-weight: 600;
            flex-shrink: 0;
        }
        
        .step-text {
            color: #133a2d;
            font-size: 14px;
        }
        
        /* Contact Info */
        .contact-info {
            background: rgba(15, 157, 115, 0.08);
            border: 1px solid rgba(15, 157, 115, 0.18);
            border-radius: 12px;
            padding: 20px;
            margin: 24px 0;
            text-align: center;
        }
        
        .contact-title {
            color: #0f9d73;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 8px;
        }
        
        .contact-email {
            color: #133a2d;
            font-size: 15px;
            text-decoration: none;
            transition: color 0.3s ease;
        }
        
        .contact-email:hover {
            color: #0f9d73;
        }
        
        /* Signature */
        .signature {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid rgba(15, 157, 115, 0.20);
        }
        
        .signature p {
            color: #133a2d;
            margin-bottom: 8px;
            font-size: 15px;
        }
        
        .team-name {
            color: #0f9d73;
            font-size: 16px;
            font-weight: bold;
        }
        
        /* Footer */
        .footer {
            margin-top: 32px;
            text-align: center;
        }
        
        .company-name {
            color: #0f9d73;
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        
        .footer-text {
            color: #5f7a70;
            font-size: 13px;
        }
        
        /* Future Opportunity */
        .future-opportunity {
            margin-top: 24px;
            padding: 16px;
            background: rgba(15, 157, 115, 0.05);
            border: 1px solid rgba(15, 157, 115, 0.08);
            border-radius: 12px;
            text-align: center;
        }
        
        .future-opportunity p {
            color: #6d8379;
            font-size: 14px;
        }
        
        /* Responsive */
        @media (max-width: 600px) {
            .email-container {
                margin: 20px;
                padding: 24px;
            }
            
            .step-item {
                flex-direction: column;
                gap: 8px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <div class="rejection-badge">
                Inquiry Update
            </div>
            <h1 class="title">Thank You for Your Interest</h1>
            <p class="subtitle">An update regarding your recent inquiry</p>
        </div>
        
        <!-- Content -->
        <div class="content">
            <h3 class="greeting">Hello <span id="name">${name}</span>,</h3>
            
            <p class="message">
                We appreciate you contacting <strong style="color: #0f9d73;">KandCo</strong>.
            </p>
            
            <!-- Rejection Card -->
            <div class="rejection-card">
                <div class="card-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
                <h3 class="card-title">Inquiry Not Accepted</h3>
                <div class="card-content">
                    After careful review, we regret to inform you that your inquiry has been <strong>rejected</strong>.
                </div>
                ${reason ? `<div class="card-content">Reason: ${reason}</div>` : ""}
            </div>
            
            <!-- Appreciation Message -->
            <div class="appreciation">
                <p>
                    Thank you for your interest in our FinOps Audit services. 
                    While we're unable to proceed at this time, we genuinely appreciate you considering KandCo.
                </p>
            </div>
            
            <!-- Next Steps -->
            <div class="next-steps">
                <h3 class="next-steps-title">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    What You Can Do Next
                </h3>
                
                <ul class="steps-list">
                    <li class="step-item">
                        <div class="step-number">1</div>
                        <div class="step-text">Review our service criteria for future reference</div>
                    </li>
                    <li class="step-item">
                        <div class="step-number">2</div>
                        <div class="step-text">Consider alternative solutions that might better fit your needs</div>
                    </li>
                    <li class="step-item">
                        <div class="step-number">3</div>
                        <div class="step-text">Reach out if your circumstances change in the future</div>
                    </li>
                </ul>
            </div>
            
            <!-- Contact Information -->
            <div class="contact-info">
                <div class="contact-title">Have Questions?</div>
                <a href="mailto:partnerships@kandco.com" class="contact-email">partnerships@kandco.com</a>
            </div>
            
            <!-- Future Opportunity -->
            <div class="future-opportunity">
                <p>
                    We hope to have the opportunity to work with you in the future.
                </p>
            </div>
            
            <!-- Signature -->
            <div class="signature">
                <p>Best regards,</p>
                <p class="team-name">KandCo Team</p>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="company-name">KandCo</div>
            <p class="footer-text">
                Cloud FinOps Audit Specialists
            </p>
        </div>
    </div>

    <script>
        // These would be dynamically replaced by your backend
        document.getElementById('name').textContent = 'John Doe';
    </script>
</body>
</html>
      `
    });

    return { success: true };
  } catch (error) {
    logger.error("Inquiry rejection email error:", error);
    return { success: false, message: "Failed to send inquiry rejection email" };
  }
};

/* ================= INQUIRY STANDBY EMAIL ================= */
export const sendInquiryStandbyEmail = async (email, name, note) => {
  try {
    await sendEmail({
      to: email,
      subject: "Your Inquiry Status",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background:#f8f9fa; color:#111827; }
            .card { max-width: 520px; margin: 30px auto; background:#fff; border-radius: 12px; padding: 28px; border: 1px solid #e5e7eb; }
            .title { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
            .meta { color:#6b7280; font-size: 13px; margin-bottom: 12px; }
            .note { margin-top: 12px; padding: 12px; background:#fef3c7; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="title">Inquiry On Standby</div>
            <div class="meta">Hello ${name},</div>
            <p>Your inquiry is currently on standby. We will get back to you shortly.</p>
            ${note ? `<div class="note">${note}</div>` : ""}
          </div>
        </body>
        </html>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Inquiry standby email error:", error);
    return { success: false, message: "Failed to send standby email" };
  }
};
