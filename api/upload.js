import fetch from 'node-fetch';
import FormData from 'form-data';

export default async function handler(req, res) {
  try {
    let txt = '';
    for await (const chunk of req) txt += chunk;
    const { image } = JSON.parse(txt);
    if (!image) throw new Error('No image provided');

    const m = image.match(/^data:(.+);base64,(.+)$/);
    if (!m) throw new Error('Invalid image format');
    const [, mime, b64] = m;
    const buffer = Buffer.from(b64, 'base64');

    const form = new FormData();
    form.append('chat_id', process.env.TELEGRAM_CHAT_ID);
    form.append('photo', buffer, {
      filename: 'snapshot.jpg',
      contentType: mime
    });

    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendPhoto`;
    const tgRes = await fetch(url, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    if (!tgRes.ok) {
      const err = await tgRes.text();
      console.error('Telegram error:', err);
      return res.status(502).send(err);
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('Function error:', err);
    res.status(500).send(err.message);
  }
}

export const config = { api: { bodyParser: false } };