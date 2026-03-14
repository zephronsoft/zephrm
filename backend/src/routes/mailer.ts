import { Router, Response } from 'express';
import { AuthRequest, authenticate, authorize, ADMIN_ROLES } from '../middleware/auth';
import { getSmtpStatus, sendGenericEmail } from '../lib/mailer';

const router = Router();

router.get('/status', authenticate, authorize(...ADMIN_ROLES), async (_req: AuthRequest, res: Response) => {
  try {
    res.json(getSmtpStatus());
  } catch (e: any) {
    res.status(500).json({ message: e?.message || 'Failed to get SMTP status' });
  }
});

router.post('/send', authenticate, authorize(...ADMIN_ROLES), async (req: AuthRequest, res: Response) => {
  try {
    const toRaw = req.body?.to;
    const subject = String(req.body?.subject || '').trim();
    const text = String(req.body?.message || req.body?.text || '').trim();
    const html = String(req.body?.html || '').trim();

    if (!toRaw) return res.status(400).json({ message: 'Recipient email is required' });
    if (!subject) return res.status(400).json({ message: 'Subject is required' });
    if (!text && !html) return res.status(400).json({ message: 'Message content is required' });

    const recipients = Array.isArray(toRaw)
      ? toRaw.map((value) => String(value).trim()).filter(Boolean)
      : String(toRaw)
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean);

    if (!recipients.length) {
      return res.status(400).json({ message: 'At least one valid recipient is required' });
    }

    const result = await sendGenericEmail({
      to: recipients,
      subject,
      text: text || undefined,
      html: html || undefined,
    });

    if (!result.sent) {
      return res.status(400).json({ message: result.reason || 'Email not sent', detail: result });
    }

    res.json({ message: 'Email sent successfully', detail: result });
  } catch (e: any) {
    res.status(500).json({ message: e?.message || 'Failed to send email' });
  }
});

export default router;
