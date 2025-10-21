require('dotenv').config();
const sgMail = require('@sendgrid/mail')
const axios = require('axios');

sgMail.setApiKey(process.env.SENDGRID_API_KEY || ``)

class EmailService {
  async sendEmail(template_name, to, variables) {
    try {
      
      let data = JSON.stringify({
        "recipients": [
          {
            "to": [
              {
                "name": to.name,
                "email": to.email
              }
            ],
            "variables": variables
          }
        ],
        "from": {
          "name": "Assisthealth Support",
          "email": "support@mail.assisthealth.cloud"
        },
        "domain": "mail.assisthealth.cloud",
        "template_id": template_name
      });

      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://control.msg91.com/api/v5/email/send',
        headers: { 
          'authkey': '448794A487pnci686bc7bfP1', 
          'Content-Type': 'application/json', 
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4N2Y1OTM5NjFjNjM3OWRlYWE2Mjg2YyIsInVzZXJUeXBlIjoibWVtYmVyIiwiaWF0IjoxNzUzMTc2NDI3LCJleHAiOjU0MzY4MDQ0Mjd9.jKqTobUmrijBbT1wPMzObxs5Qb1oaQa8rP4ZYX_USog', 
          'Cookie': 'HELLO_APP_HASH=UjRuc1BiNWZOZjlHUXRRUXgwSEJveS9wbHhjWUlHUTVEQjlQUnVZT2wwcz0%3D; PHPSESSID=hhia1i565hta9mk7j43ihm6e53'
        },
        data : data
      };

      axios.request(config)
      .then((response) => {
        console.log(JSON.stringify(response.data));
        console.log('Email sent successfully');
        return response.data;
      })
      .catch((error) => {
        console.log(error);
        return error;
      });

    } catch (error) {
      console.error('Email error:', error);
      throw error;
    }
  }

  async sendPasswordReset(to, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const html = `
      <h1>Password Reset Request</h1>
      <p>Please click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>If you didn't request this, please ignore this email.</p>
    `;
    return this.sendEmail(to, 'Password Reset Request', html);
  }
  
}

  




module.exports = new EmailService(); 