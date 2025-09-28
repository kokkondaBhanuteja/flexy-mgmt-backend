import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

// DTO for validating incoming request body
class SendMailDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}


@ApiTags('mail')
@Controller('mail')
export class MailController {
  constructor(private readonly mailerService: MailerService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a contact form email' })
  @ApiResponse({ status: 200, description: 'Email sent successfully.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  async sendEmail(@Body() sendMailDto: SendMailDto) {
    const { name, email, message } = sendMailDto;

    const adminEmail = 'bhanuteja.edunet@gmail.com';

    await this.mailerService.sendMail({
      to: adminEmail, // recipient
      from: email, // sender
      replyTo: email,
      subject: `📩 New Message from ${name} via Contact Form`,
      html: `
        <div style="font-family: Arial, sans-serif; background: #f9fafb; padding: 30px;">
          <table align="center" cellpadding="0" cellspacing="0" width="600" 
            style="background: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); overflow: hidden;">
            
            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(135deg, #4f46e5, #3b82f6); padding: 20px; text-align: center; color: #fff;">
                <h2 style="margin: 0; font-size: 20px;">Tapza HoardMgmt</h2>
                <p style="margin: 0; font-size: 14px;">You’ve got a new contact form message 🚀</p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 25px 30px; color: #111827; font-size: 15px; line-height: 1.6;">
                <p style="margin-bottom: 16px;">Hi Admin,</p>
                <p style="margin-bottom: 16px;">You have received a new message through your contact form.</p>
                
                <div style="border-left: 4px solid #3b82f6; padding-left: 15px; margin-bottom: 20px;">
                  <p><strong>Name:</strong> ${name}</p>
                  <p><strong>Email:</strong> ${email}</p>
                </div>

                <h3 style="margin-top: 20px; margin-bottom: 12px; font-size: 16px; color: #4f46e5;">💬 Message:</h3>
                <p style="background: #f3f4f6; padding: 15px; border-radius: 8px; font-style: italic;">
                  ${message}
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
                <p style="margin: 0;">© ${new Date().getFullYear()} Tapza HoardMgmt. All rights reserved.</p>
              </td>
            </tr>

          </table>
        </div>
      `,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Email sent successfully',
    };
  }
}
