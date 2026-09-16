import express, { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(express.json());

// Public redirect route: /q/:code
app.get('/q/:code', async (req: Request, res: Response) => {
  const code = req.params.code;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: qr } = await supabase
        .from('qr_codes')
        .select('id, destination_url, active, scan_count')
        .eq('code', code)
        .single();

      if (qr) {
        if (!qr.active) {
          return res.status(403).send(`
            <!DOCTYPE html>
            <html lang="pt-BR" style="background:#09090b;color:#fff;font-family:sans-serif;text-align:center;padding:50px 20px;">
              <head><meta charset="utf-8"><title>QR Code Pausado — VINI CODE</title></head>
              <body>
                <div style="max-width:440px;margin:0 auto;background:#141417;border:1px solid #27272a;border-radius:12px;padding:32px;">
                  <h2 style="color:#eab308;margin-top:0;">QR Code Pausado</h2>
                  <p style="color:#a1a1aa;font-size:15px;">Este QR Code está temporariamente desativado pelo proprietário.</p>
                </div>
              </body>
            </html>
          `);
        }

        // Increment scan count in background
        supabase
          .from('qr_codes')
          .update({
            scan_count: (qr.scan_count || 0) + 1,
            last_scanned_at: new Date().toISOString(),
          })
          .eq('id', qr.id)
          .then(() => {});

        return res.redirect(302, qr.destination_url);
      }
    } catch (err) {
      console.error('Error querying Supabase in /q/:code:', err);
    }
  }

  return res.status(404).send(`
    <!DOCTYPE html>
    <html lang="pt-BR" style="background:#09090b;color:#fff;font-family:sans-serif;text-align:center;padding:50px 20px;">
      <head><meta charset="utf-8"><title>QR Code Não Encontrado — VINI CODE</title></head>
      <body>
        <div style="max-width:440px;margin:0 auto;background:#141417;border:1px solid #27272a;border-radius:12px;padding:32px;">
          <h2 style="color:#ef4444;margin-top:0;">QR Code Não Encontrado</h2>
          <p style="color:#a1a1aa;font-size:15px;">O código solicitado (<strong>${code}</strong>) não foi localizado.</p>
        </div>
      </body>
    </html>
  `);
});

// API Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', name: 'VINI CODE Vercel API' });
});

export default app;
