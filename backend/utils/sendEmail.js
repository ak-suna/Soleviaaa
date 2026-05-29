
// import nodemailer from "nodemailer";
// import dotenv from "dotenv";
// import config from "../src/config.js";

// dotenv.config();

// let resendClient = null;

// function getEmailMode() {
//     if (process.env.RESEND_API_KEY) return "resend";
//     if (process.env.SMTP_HOST || process.env.EMAIL_USER) return "smtp";
//     return "none";
// }

// function getFromAddress() {
//     if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM;
//     if (process.env.RESEND_API_KEY) return "Solevia <onboarding@resend.dev>";
//     return `"Solevia" <${process.env.EMAIL_USER}>`;
// }

// function assertEmailConfig() {
//     if (getEmailMode() === "none") {
//         throw new Error(
//             "Email is not configured on the server. Set RESEND_API_KEY or EMAIL_USER + EMAIL_PASSWORD (or SMTP_* variables)."
//         );
//     }
//     if (!config.FRONTEND_URL) {
//         throw new Error("FRONTEND_URL is not set on the server");
//     }
// }

// function getSmtpTransporter() {
//     const user = process.env.SMTP_USER || process.env.EMAIL_USER;
//     const pass = (process.env.SMTP_PASS || process.env.EMAIL_PASSWORD || "").replace(/\s/g, "");

//     if (!user || !pass) {
//         throw new Error("SMTP credentials missing (EMAIL_USER/EMAIL_PASSWORD or SMTP_USER/SMTP_PASS)");
//     }

//     if (process.env.SMTP_HOST) {
//         const port = Number(process.env.SMTP_PORT || 587);
//         return nodemailer.createTransport({
//             host: process.env.SMTP_HOST,
//             port,
//             secure: process.env.SMTP_SECURE === "true" || port === 465,
//             auth: { user, pass },
//         });
//     }

//     // Explicit Gmail SMTP (more reliable than service: "gmail" on cloud hosts)
//     return nodemailer.createTransport({
//         host: "smtp.gmail.com",
//         port: 465,
//         secure: true,
//         auth: { user, pass },
//     });
// }

// async function sendEmailMessage({ to, subject, html }) {
//     assertEmailConfig();
//     const from = getFromAddress();

//     if (getEmailMode() === "resend") {
//         const { Resend } = await import("resend");
//         if (!resendClient) {
//             resendClient = new Resend(process.env.RESEND_API_KEY);
//         }

//         const { data, error } = await resendClient.emails.send({
//             from,
//             to: [to],
//             subject,
//             html,
//         });

//         if (error) {
//             throw new Error(error.message);
//         }

//         return data;
//     }

//     const transporter = getSmtpTransporter();
//     return transporter.sendMail({ from, to, subject, html });
// }

// export async function verifyEmailTransport() {
//     const mode = getEmailMode();

//     if (mode === "none") {
//         console.warn("⚠️  Email NOT configured — verification, password reset, and notification emails will fail.");
//         console.warn("    Set RESEND_API_KEY (recommended on Render) or EMAIL_USER + EMAIL_PASSWORD.");
//         return false;
//     }

//     if (mode === "resend") {
//         console.log("✅ Email transport: Resend API");
//         return true;
//     }

//     try {
//         const transporter = getSmtpTransporter();
//         await transporter.verify();
//         console.log(`✅ Email transport: SMTP verified (${process.env.SMTP_HOST || "smtp.gmail.com"})`);
//         return true;
//     } catch (error) {
//         console.error("❌ Email SMTP verification failed:", error.message);
//         console.error("   Gmail often blocks cloud servers like Render. Use RESEND_API_KEY or Brevo/SendGrid SMTP.");
//         return false;
//     }
// }

// export const sendVerificationEmail = async (user) => {
//     try {
//         const verificationUrl = `${config.FRONTEND_URL}/verify-email/${user.verificationCode}`;

//         await sendEmailMessage({
//             to: user.email,
//             subject: "Verify Your Email - SOLEVIA",
//             html: `
//                 <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
//                     <h2 style="color: #333;">Welcome to SOLEVIA!</h2>
//                     <p>Hi ${user.firstName},</p>
//                     <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
//                     <a href="${verificationUrl}" 
//                        style="display: inline-block; padding: 12px 24px; margin: 20px 0; 
//                               background-color: #4CAF50; color: white; text-decoration: none; 
//                               border-radius: 4px;">
//                         Verify Email
//                     </a>
//                     <p>Or copy and paste this link in your browser:</p>
//                     <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
//                     <p style="color: #999; font-size: 12px;">This link will expire in 24 hours.</p>
//                     <p>If you didn't create an account, please ignore this email.</p>
//                 </div>
//             `,
//         });

//         console.log("✅ Verification email sent to:", user.email);
//     } catch (error) {
//         console.error("❌ Error sending verification email:", error);
//         throw new Error(`Failed to send verification email: ${error.message}`);
//     }
// };

// export const sendPasswordResetEmail = async (user, resetToken) => {
//     try {
//         const resetUrl = `${config.FRONTEND_URL}/reset-password/${resetToken}`;

//         await sendEmailMessage({
//             to: user.email,
//             subject: "Password Reset Request - SOLEVIA",
//             html: `
//                 <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
//                     <h2 style="color: #333;">Password Reset Request</h2>
//                     <p>Hi ${user.firstName},</p>
//                     <p>We received a request to reset your password. Click the button below to reset it:</p>
//                     <a href="${resetUrl}" 
//                        style="display: inline-block; padding: 12px 24px; margin: 20px 0; 
//                               background-color: #f096b3; color: white; text-decoration: none; 
//                               border-radius: 4px;">
//                         Reset Password
//                     </a>
//                     <p>Or copy and paste this link in your browser:</p>
//                     <p style="color: #666; word-break: break-all;">${resetUrl}</p>
//                     <p style="color: #999; font-size: 12px;">This link will expire in 1 hour.</p>
//                     <p style="color: #d9534f; font-weight: bold;">⚠️ If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
//                 </div>
//             `,
//         });

//         console.log("✅ Password reset email sent to:", user.email);
//     } catch (error) {
//         console.error("❌ Error sending password reset email:", error);
//         throw new Error(`Failed to send password reset email: ${error.message}`);
//     }
// };

// export const sendNotificationEmail = async (user, notification) => {
//     try {
//         const priorityColors = {
//             HIGH: "#d9534f",
//             MEDIUM: "#f0ad4e",
//             LOW: "#5bc0de",
//         };

//         const color = priorityColors[notification.priority] || "#5bc0de";

//         let actionButton = "";
//         if (notification.data?.actionUrl) {
//             actionButton = `
//                 <a href="${config.FRONTEND_URL}${notification.data.actionUrl}" 
//                    style="display: inline-block; padding: 12px 24px; margin: 20px 0; 
//                           background-color: ${color}; color: white; text-decoration: none; 
//                           border-radius: 4px;">
//                     View Details
//                 </a>
//             `;
//         }

//         await sendEmailMessage({
//             to: user.email,
//             subject: `${notification.title} - SOLEVIA`,
//             html: `
//                 <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
//                     <div style="background-color: ${color}; color: white; padding: 15px; border-radius: 4px 4px 0 0;">
//                         <h2 style="margin: 0; color: white;">${notification.title}</h2>
//                         <span style="font-size: 12px; opacity: 0.9;">${notification.priority} Priority</span>
//                     </div>
//                     <div style="background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 4px 4px;">
//                         <p>Hi ${user.firstName},</p>
//                         <p style="font-size: 16px; line-height: 1.6;">${notification.message}</p>
//                         ${actionButton}
//                         <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
//                         <p style="color: #999; font-size: 12px;">
//                             You can manage your notification preferences in your 
//                             <a href="${config.FRONTEND_URL}/settings">account settings</a>.
//                         </p>
//                     </div>
//                 </div>
//             `,
//         });

//         console.log(`✅ Notification email sent to: ${user.email}`);
//     } catch (error) {
//         console.error("❌ Error sending notification email:", error);
//         throw new Error(`Failed to send notification email: ${error.message}`);
//     }
// };

// export const sendUserDisabledEmail = async (user, reason) => {
//     try {
//         await sendEmailMessage({
//             to: user.email,
//             subject: "Your Account Has Been Disabled - SOLEVIA",
//             html: `
//                 <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
//                     <h2 style="color: #d9534f;">Account Disabled</h2>
//                     <p>Hi ${user.firstName},</p>
//                     <p>Your account has been disabled by an administrator for the following reason:</p>
//                     <blockquote style="background: #f8d7da; color: #721c24; padding: 12px; border-radius: 4px;">${reason}</blockquote>
//                     <p>If you believe this is a mistake or need further assistance, please contact support at <a href="mailto:anuskagc100@gmail.com">anuskagc100@gmail.com</a>.</p>
//                     <p style="color: #999; font-size: 12px;">You will not be able to log in until your account is re-enabled.</p>
//                 </div>
//             `,
//         });
//         console.log(`✅ Disabled account email sent to: ${user.email}`);
//     } catch (error) {
//         console.error("❌ Error sending disabled account email:", error);
//         throw new Error(`Failed to send disabled account email: ${error.message}`);
//     }
// };

// export const sendAccountDeactivatedEmail = async (user) => {
//     try {
//         await sendEmailMessage({
//             to: user.email,
//             subject: "Your Account Has Been Deactivated - SOLEVIA",
//             html: `
//                 <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
//                     <h2 style="color: #f0ad4e;">Account Deactivated</h2>
//                     <p>Hi ${user.firstName},</p>
//                     <p>Your account has been successfully deactivated.</p>
//                     <p>Your profile and content are now hidden from the community. You will not receive any further notifications from us while your account is in this state.</p>
//                     <p>Whenever you are ready to return, simply log in to your account with your email and password, and click <strong>Restore</strong> to reactivate your account and pick up right where you left off.</p>
//                     <br/>
//                     <p>Take care,</p>
//                     <p>The SOLEVIA Team</p>
//                 </div>
//             `,
//         });
//         console.log(`✅ Deactivation email sent to: ${user.email}`);
//     } catch (error) {
//         console.error("❌ Error sending deactivation email:", error);
//     }
// };

// export const sendAccountDeletionRequestedEmail = async (user, expirationDate) => {
//     try {
//         const formattedDate = new Date(expirationDate).toLocaleDateString("en-US", {
//             weekday: "long",
//             year: "numeric",
//             month: "long",
//             day: "numeric",
//         });

//         await sendEmailMessage({
//             to: user.email,
//             subject: "Account Deletion Request Received - SOLEVIA",
//             html: `
//                 <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
//                     <h2 style="color: #d9534f;">Account Deletion Request</h2>
//                     <p>Hi ${user.firstName},</p>
//                     <p>We have received your request to permanently delete your SOLEVIA account.</p>
//                     <p>Your account is now scheduled for permanent deletion on <strong>${formattedDate}</strong>. After this date, all of your private data (journals, habits, mood logs, and goals) will be permanently erased and cannot be recovered.</p>
//                     <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #5bc0de; margin: 20px 0;">
//                         <p style="margin: 0;"><strong>Changed your mind?</strong></p>
//                         <p style="margin: 10px 0 0 0;">You have a 30-day grace period to cancel this request. If you wish to keep your account, simply log in before ${formattedDate} and click <strong>Cancel Deletion</strong>.</p>
//                     </div>
//                     <p>If you meant to do this, no further action is required from you.</p>
//                     <br/>
//                     <p>Best regards,</p>
//                     <p>The SOLEVIA Team</p>
//                 </div>
//             `,
//         });
//         console.log(`✅ Deletion request email sent to: ${user.email}`);
//     } catch (error) {
//         console.error("❌ Error sending deletion request email:", error);
//     }
// };

import nodemailer from "nodemailer";
import dotenv from "dotenv";
import config from "../src/config.js";

dotenv.config();

let resendClient = null;

function getEmailMode() {
    if (process.env.BREVO_API_KEY) return "brevo";
    if (process.env.RESEND_API_KEY) return "resend";
    if (process.env.SMTP_HOST || process.env.EMAIL_USER) return "smtp";
    return "none";
}

function getBrevoSender() {
    const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    if (!from) {
        throw new Error("Set EMAIL_FROM or EMAIL_USER as the verified Brevo sender address");
    }
    const match = from.match(/^(.+?)\s*<(.+?)>$/);
    if (match) {
        return { name: match[1].trim(), email: match[2].trim() };
    }
    return { name: "Solevia", email: from.trim() };
}

async function sendViaBrevo({ to, subject, html }) {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            accept: "application/json",
            "api-key": process.env.BREVO_API_KEY,
            "content-type": "application/json",
        },
        body: JSON.stringify({
            sender: getBrevoSender(),
            to: [{ email: to }],
            subject,
            htmlContent: html,
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `Brevo API error (${response.status})`);
    }

    return response.json();
}

function getFromAddress() {
    if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM;
    if (process.env.RESEND_API_KEY) return "Solevia <onboarding@resend.dev>";
    return `"Solevia" <${process.env.EMAIL_USER}>`;
}

function assertEmailConfig() {
    if (getEmailMode() === "none") {
        throw new Error(
            "Email is not configured. On Render free tier use BREVO_API_KEY (HTTPS). Locally you can use EMAIL_USER + EMAIL_PASSWORD."
        );
    }
    if (!config.FRONTEND_URL) {
        throw new Error("FRONTEND_URL is not set on the server");
    }
}

function getSmtpTransporter() {
    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const pass = (process.env.SMTP_PASS || process.env.EMAIL_PASSWORD || "").replace(/\s/g, "");

    if (!user || !pass) {
        throw new Error("SMTP credentials missing (EMAIL_USER/EMAIL_PASSWORD or SMTP_USER/SMTP_PASS)");
    }

    if (process.env.SMTP_HOST) {
        const port = Number(process.env.SMTP_PORT || 587);
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port,
            secure: process.env.SMTP_SECURE === "true" || port === 465,
            auth: { user, pass },
        });
    }

    // Gmail via STARTTLS — works better than port 465 on many cloud hosts (Render, etc.)
    return nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: { user, pass },
    });
}

async function sendEmailMessage({ to, subject, html }) {
    assertEmailConfig();
    const from = getFromAddress();

    if (getEmailMode() === "brevo") {
        return sendViaBrevo({ to, subject, html });
    }

    if (getEmailMode() === "resend") {
        const { Resend } = await import("resend");
        if (!resendClient) {
            resendClient = new Resend(process.env.RESEND_API_KEY);
        }

        const { data, error } = await resendClient.emails.send({
            from,
            to: [to],
            subject,
            html,
        });

        if (error) {
            throw new Error(error.message);
        }

        return data;
    }

    const transporter = getSmtpTransporter();
    return transporter.sendMail({ from, to, subject, html });
}

export async function verifyEmailTransport() {
    const mode = getEmailMode();

    if (mode === "none") {
        console.warn("⚠️  Email NOT configured.");
        console.warn("    Render FREE tier blocks Gmail SMTP. Add BREVO_API_KEY (see brevo.com).");
        return false;
    }

    if (mode === "brevo") {
        console.log("✅ Email transport: Brevo API (HTTPS — works on Render free tier)");
        return true;
    }

    if (mode === "resend") {
        console.log("✅ Email transport: Resend API");
        return true;
    }

    console.warn("⚠️  Using SMTP — Render FREE tier blocks ports 587/465. Gmail will timeout.");
    console.warn("    Use BREVO_API_KEY instead (free, uses HTTPS), or upgrade Render to a paid plan.");

    try {
        const transporter = getSmtpTransporter();
        await transporter.verify();
        const host = process.env.SMTP_HOST || "smtp.gmail.com";
        console.log(`✅ Email transport: SMTP verified (${host})`);
        return true;
    } catch (error) {
        console.error("❌ Email SMTP verification failed:", error.message);
        console.error("   Render free tier blocks SMTP. Add BREVO_API_KEY to Render environment and redeploy.");
        return false;
    }
}

export const sendVerificationEmail = async (user) => {
    try {
        const verificationUrl = `${config.FRONTEND_URL}/verify-email/${user.verificationCode}`;

        await sendEmailMessage({
            to: user.email,
            subject: "Verify Your Email - SOLEVIA",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Welcome to SOLEVIA!</h2>
                    <p>Hi ${user.firstName},</p>
                    <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
                    <a href="${verificationUrl}" 
                       style="display: inline-block; padding: 12px 24px; margin: 20px 0; 
                              background-color: #4CAF50; color: white; text-decoration: none; 
                              border-radius: 4px;">
                        Verify Email
                    </a>
                    <p>Or copy and paste this link in your browser:</p>
                    <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
                    <p style="color: #999; font-size: 12px;">This link will expire in 24 hours.</p>
                    <p>If you didn't create an account, please ignore this email.</p>
                </div>
            `,
        });

        console.log("✅ Verification email sent to:", user.email);
    } catch (error) {
        console.error("❌ Error sending verification email:", error);
        throw new Error(`Failed to send verification email: ${error.message}`);
    }
};

export const sendPasswordResetEmail = async (user, resetToken) => {
    try {
        const resetUrl = `${config.FRONTEND_URL}/reset-password/${resetToken}`;

        await sendEmailMessage({
            to: user.email,
            subject: "Password Reset Request - SOLEVIA",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Password Reset Request</h2>
                    <p>Hi ${user.firstName},</p>
                    <p>We received a request to reset your password. Click the button below to reset it:</p>
                    <a href="${resetUrl}" 
                       style="display: inline-block; padding: 12px 24px; margin: 20px 0; 
                              background-color: #f096b3; color: white; text-decoration: none; 
                              border-radius: 4px;">
                        Reset Password
                    </a>
                    <p>Or copy and paste this link in your browser:</p>
                    <p style="color: #666; word-break: break-all;">${resetUrl}</p>
                    <p style="color: #999; font-size: 12px;">This link will expire in 1 hour.</p>
                    <p style="color: #d9534f; font-weight: bold;">⚠️ If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
                </div>
            `,
        });

        console.log("✅ Password reset email sent to:", user.email);
    } catch (error) {
        console.error("❌ Error sending password reset email:", error);
        throw new Error(`Failed to send password reset email: ${error.message}`);
    }
};

export const sendNotificationEmail = async (user, notification) => {
    try {
        const priorityColors = {
            HIGH: "#d9534f",
            MEDIUM: "#f0ad4e",
            LOW: "#5bc0de",
        };

        const color = priorityColors[notification.priority] || "#5bc0de";

        let actionButton = "";
        if (notification.data?.actionUrl) {
            actionButton = `
                <a href="${config.FRONTEND_URL}${notification.data.actionUrl}" 
                   style="display: inline-block; padding: 12px 24px; margin: 20px 0; 
                          background-color: ${color}; color: white; text-decoration: none; 
                          border-radius: 4px;">
                    View Details
                </a>
            `;
        }

        await sendEmailMessage({
            to: user.email,
            subject: `${notification.title} - SOLEVIA`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: ${color}; color: white; padding: 15px; border-radius: 4px 4px 0 0;">
                        <h2 style="margin: 0; color: white;">${notification.title}</h2>
                        <span style="font-size: 12px; opacity: 0.9;">${notification.priority} Priority</span>
                    </div>
                    <div style="background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 4px 4px;">
                        <p>Hi ${user.firstName},</p>
                        <p style="font-size: 16px; line-height: 1.6;">${notification.message}</p>
                        ${actionButton}
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                        <p style="color: #999; font-size: 12px;">
                            You can manage your notification preferences in your 
                            <a href="${config.FRONTEND_URL}/settings">account settings</a>.
                        </p>
                    </div>
                </div>
            `,
        });

        console.log(`✅ Notification email sent to: ${user.email}`);
    } catch (error) {
        console.error("❌ Error sending notification email:", error);
        throw new Error(`Failed to send notification email: ${error.message}`);
    }
};

export const sendUserDisabledEmail = async (user, reason) => {
    try {
        await sendEmailMessage({
            to: user.email,
            subject: "Your Account Has Been Disabled - SOLEVIA",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #d9534f;">Account Disabled</h2>
                    <p>Hi ${user.firstName},</p>
                    <p>Your account has been disabled by an administrator for the following reason:</p>
                    <blockquote style="background: #f8d7da; color: #721c24; padding: 12px; border-radius: 4px;">${reason}</blockquote>
                    <p>If you believe this is a mistake or need further assistance, please contact support at <a href="mailto:anuskagc100@gmail.com">anuskagc100@gmail.com</a>.</p>
                    <p style="color: #999; font-size: 12px;">You will not be able to log in until your account is re-enabled.</p>
                </div>
            `,
        });
        console.log(`✅ Disabled account email sent to: ${user.email}`);
    } catch (error) {
        console.error("❌ Error sending disabled account email:", error);
        throw new Error(`Failed to send disabled account email: ${error.message}`);
    }
};

export const sendAccountDeactivatedEmail = async (user) => {
    try {
        await sendEmailMessage({
            to: user.email,
            subject: "Your Account Has Been Deactivated - SOLEVIA",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #f0ad4e;">Account Deactivated</h2>
                    <p>Hi ${user.firstName},</p>
                    <p>Your account has been successfully deactivated.</p>
                    <p>Your profile and content are now hidden from the community. You will not receive any further notifications from us while your account is in this state.</p>
                    <p>Whenever you are ready to return, simply log in to your account with your email and password, and click <strong>Restore</strong> to reactivate your account and pick up right where you left off.</p>
                    <br/>
                    <p>Take care,</p>
                    <p>The SOLEVIA Team</p>
                </div>
            `,
        });
        console.log(`✅ Deactivation email sent to: ${user.email}`);
    } catch (error) {
        console.error("❌ Error sending deactivation email:", error);
    }
};

export const sendAccountDeletionRequestedEmail = async (user, expirationDate) => {
    try {
        const formattedDate = new Date(expirationDate).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });

        await sendEmailMessage({
            to: user.email,
            subject: "Account Deletion Request Received - SOLEVIA",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #d9534f;">Account Deletion Request</h2>
                    <p>Hi ${user.firstName},</p>
                    <p>We have received your request to permanently delete your SOLEVIA account.</p>
                    <p>Your account is now scheduled for permanent deletion on <strong>${formattedDate}</strong>. After this date, all of your private data (journals, habits, mood logs, and goals) will be permanently erased and cannot be recovered.</p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #5bc0de; margin: 20px 0;">
                        <p style="margin: 0;"><strong>Changed your mind?</strong></p>
                        <p style="margin: 10px 0 0 0;">You have a 30-day grace period to cancel this request. If you wish to keep your account, simply log in before ${formattedDate} and click <strong>Cancel Deletion</strong>.</p>
                    </div>
                    <p>If you meant to do this, no further action is required from you.</p>
                    <br/>
                    <p>Best regards,</p>
                    <p>The SOLEVIA Team</p>
                </div>
            `,
        });
        console.log(`✅ Deletion request email sent to: ${user.email}`);
    } catch (error) {
        console.error("❌ Error sending deletion request email:", error);
    }
};
