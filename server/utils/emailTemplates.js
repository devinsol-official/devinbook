const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const baseStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
  
  body { 
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
    background-color: #020617; 
    color: #f8fafc; 
    margin: 0; 
    padding: 40px 20px; 
    -webkit-font-smoothing: antialiased;
  }
  
  .wrapper {
    max-width: 600px; 
    margin: 0 auto; 
  }

  .container { 
    background-color: #0f172a; 
    border-radius: 24px; 
    border: 1px solid #1e293b; 
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }

  .header { 
    text-align: center; 
    padding: 40px 30px;
    background: linear-gradient(135deg, rgba(30,27,75,1) 0%, rgba(15,23,42,1) 100%);
    border-bottom: 1px solid #1e293b;
  }

  .pro-badge {
    display: inline-block;
    background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
    color: #fff;
    font-size: 10px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 2px;
    padding: 6px 12px;
    border-radius: 100px;
    margin-bottom: 16px;
    box-shadow: 0 10px 15px -3px rgba(245, 158, 11, 0.3);
  }

  .title { 
    font-size: 28px; 
    font-weight: 900; 
    color: #ffffff; 
    margin: 0;
    letter-spacing: -0.5px;
  }

  .content { 
    padding: 40px 30px;
    font-size: 16px; 
    color: #94a3b8; 
    line-height: 1.7; 
  }

  .content p {
    margin-top: 0;
    margin-bottom: 20px;
  }

  .highlight-box {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 16px;
    padding: 20px;
    margin: 30px 0;
    text-align: center;
  }

  .highlight { 
    color: #f59e0b; 
    font-weight: 800; 
    font-size: 18px;
  }

  .btn { 
    display: inline-block; 
    padding: 16px 32px; 
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: #ffffff !important; 
    text-decoration: none; 
    border-radius: 16px; 
    font-weight: 800; 
    margin-top: 10px; 
    box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 14px;
  }

  .footer { 
    text-align: center; 
    margin-top: 40px; 
    font-size: 13px; 
    color: #475569; 
    font-weight: 600;
  }
`;

exports.subscriptionActivatedTemplate = (name, expiryDate) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>${baseStyle}</style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <div class="pro-badge">Pro Plan Activated</div>
              <h1 class="title">Welcome to DevinBook Pro!</h1>
            </div>
            <div class="content">
              <p>Hi <strong style="color: #fff;">${name}</strong>,</p>
              <p>Your subscription has been successfully activated. You've just unlocked the full power of DevinBook!</p>
              
              <p>You now have instant access to <strong>Unlimited Accounts</strong>, <strong>Infinite Categories</strong>, deep <strong>Financial Insights</strong>, and <strong>PDF Reports</strong>.</p>
              
              <div class="highlight-box">
                <p style="margin-bottom: 5px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; color: #64748b;">Plan active until</p>
                <div class="highlight">${formatDate(expiryDate)}</div>
              </div>

              <div style="text-align: center;">
                <a href="https://devinbook.devinsol.com/dashboard" class="btn">Enter Dashboard</a>
              </div>
            </div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Devinsol. All rights reserved.<br>
            <span style="color: #334155;">Designed for modern financial tracking</span>
          </div>
        </div>
      </body>
    </html>
  `;
};

exports.subscriptionRenewedTemplate = (name, expiryDate) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>${baseStyle}</style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <div class="pro-badge" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3);">Pro Extended</div>
              <h1 class="title">Subscription Renewed!</h1>
            </div>
            <div class="content">
              <p>Hi <strong style="color: #fff;">${name}</strong>,</p>
              <p>Great news! Your <strong>DevinBook Pro</strong> subscription has been successfully renewed.</p>
              <p>You can continue enjoying all your premium features uninterrupted.</p>
              
              <div class="highlight-box">
                <p style="margin-bottom: 5px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; color: #64748b;">New Expiration Date</p>
                <div class="highlight" style="color: #10b981;">${formatDate(expiryDate)}</div>
              </div>

              <div style="text-align: center;">
                <a href="https://devinbook.devinsol.com/dashboard" class="btn">Continue to App</a>
              </div>
            </div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Devinsol. All rights reserved.<br>
            <span style="color: #334155;">Designed for modern financial tracking</span>
          </div>
        </div>
      </body>
    </html>
  `;
};

exports.subscriptionCancelledTemplate = (name) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>${baseStyle}</style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <div class="pro-badge" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); box-shadow: 0 10px 15px -3px rgba(239, 68, 68, 0.3);">Plan Updated</div>
              <h1 class="title">Subscription Ended</h1>
            </div>
            <div class="content">
              <p>Hi <strong style="color: #fff;">${name}</strong>,</p>
              <p>Your <strong>DevinBook Pro</strong> subscription has ended. Your account has safely transitioned back to the Free plan.</p>
              <p>You can still use all the core features of DevinBook, but some limits on multiple accounts and categories will now apply.</p>
              
              <div class="highlight-box" style="padding: 15px;">
                <p style="margin: 0; font-size: 14px;">If this was a mistake, or if you'd like to unlock Pro again, you can easily upgrade from your dashboard at any time.</p>
              </div>

              <div style="text-align: center;">
                <a href="https://devinbook.devinsol.com/dashboard" class="btn" style="background: #334155; box-shadow: none;">Back to Dashboard</a>
              </div>
            </div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Devinsol. All rights reserved.<br>
            <span style="color: #334155;">Designed for modern financial tracking</span>
          </div>
        </div>
      </body>
    </html>
  `;
};
