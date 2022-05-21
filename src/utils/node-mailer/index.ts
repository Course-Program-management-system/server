import nodeMailer from "nodemailer";
import { autoInjectable } from "tsyringe";
import Utils from "utils";
type MailPriority = "high";
type MailBody = {
  from: string;
  to: string;
  subject?: string;
  html: string;
  priority?: MailPriority;
};
@autoInjectable()
export default class MailService {
  constructor(private utils: Utils) {}
  private service: string = "gmail";
  public generateMailBody(
    email: string,
    html: string,
    subject?: string,
    priority?: MailPriority
  ): MailBody {
    return {
      from: process.env.authEmail,
      html,
      to: email,
      subject,
      priority,
    };
  }

  public sendMail(mailBody: MailBody, ignoreError?: boolean): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.utils.isProduction()) return resolve(true);
      nodeMailer
        .createTransport({
          service: this.service,
          auth: {
            user: process.env.authEmail,
            pass: process.env.authEmailPassword,
          },
        })
        .sendMail(mailBody)
        .then(resolve)
        .catch((ignoreError && resolve) || reject);
    });
  }
  public getVerifyAdminHtml(link: string, route: string): string {
    return `<a rel="noopener noreferrer" target="_blank" href="${
      this.utils.isProduction() ? process.env.BASE_URL : "http://localhost:3000"
    }${route}">Click here to verify your account</a>`;
  }
}
