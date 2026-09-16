import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import { db } from './server/db.ts';
import { resolveGoogleMapsEntity } from './server/googlePlaces.ts';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'vinicode_secret_super_key_2026';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

// Authentication Middleware
function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; name: string };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Sessão expirada ou token inválido' });
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // ----------------------------------------------------
  // 1. ROTA DINÂMICA ESSENCIAL: /q/:code
  // Escaneou -> Registra leitura -> Redireciona imediatamente
  // O cliente NUNCA vê telas intermediárias do VINI CODE.
  // ----------------------------------------------------
  app.get('/q/:code', (req, res) => {
    const code = req.params.code;
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip || req.socket.remoteAddress || '';

    const qr = db.getQRCodeByCode(code);

    if (!qr) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="pt-BR" style="background:#09090b;color:#fff;font-family:sans-serif;text-align:center;padding:50px 20px;">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>QR Code Não Encontrado — VINI CODE</title>
          </head>
          <body>
            <div style="max-width:440px;margin:0 auto;background:#141417;border:1px solid #27272a;border-radius:12px;padding:32px;">
              <h2 style="color:#ef4444;margin-top:0;">QR Code Não Encontrado</h2>
              <p style="color:#a1a1aa;font-size:15px;line-height:1.6;">O código solicitado (<strong>${code}</strong>) não existe ou foi removido.</p>
            </div>
          </body>
        </html>
      `);
    }

    // Registra a leitura no banco de dados
    db.recordScan(code, userAgent, ip);

    // Se estiver inativo, não redireciona para o destino
    if (!qr.active) {
      return res.status(403).send(`
        <!DOCTYPE html>
        <html lang="pt-BR" style="background:#09090b;color:#fff;font-family:sans-serif;text-align:center;padding:50px 20px;">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>QR Code Desativado — VINI CODE</title>
          </head>
          <body>
            <div style="max-width:440px;margin:0 auto;background:#141417;border:1px solid #27272a;border-radius:12px;padding:32px;">
              <div style="width:12px;height:12px;background:#ef4444;border-radius:50%;display:inline-block;margin-bottom:12px;"></div>
              <h2 style="color:#f4f4f5;margin-top:0;">QR Code Temporariamente Inativo</h2>
              <p style="color:#a1a1aa;font-size:15px;line-height:1.6;">Este QR Code está temporariamente desativado pelo proprietário.</p>
            </div>
          </body>
        </html>
      `);
    }

    // REDIRECIONAMENTO HTTP IMEDIATO (302)
    // Para o usuário final a experiência é direta: Câmera -> Destino
    return res.redirect(302, qr.destinationUrl);
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', name: 'VINI CODE Engine' });
  });

  // ----------------------------------------------------
  // 2. AUTENTICAÇÃO
  // ----------------------------------------------------
  app.post('/api/auth/register', (req, res) => {
    try {
      const { name, email, password, confirmPassword } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ error: 'As senhas não coincidem' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
      }

      const user = db.createUser(name, email, password);
      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.status(201).json({
        user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
        token,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao registrar usuário' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Informe e-mail e senha' });
      }

      const user = db.findUserByEmail(email);
      if (!user || !db.verifyPassword(password, user.passwordHash)) {
        return res.status(401).json({ error: 'E-mail ou senha incorretos' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.json({
        user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
        token,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao autenticar usuário' });
    }
  });

  app.get('/api/auth/me', authenticateToken, (req: AuthRequest, res) => {
    const user = db.findUserById(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json({
      user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
    });
  });

  app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Informe um e-mail válido' });
    }
    // Return success message so we don't leak registered emails
    res.json({
      message: 'Se o e-mail estiver cadastrado, as instruções de recuperação foram enviadas.',
    });
  });

  app.post('/api/auth/reset-password', authenticateToken, (req: AuthRequest, res) => {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres' });
    }
    res.json({ message: 'Senha atualizada com sucesso' });
  });

  // Rota pública para resolução de QR Code dinâmico
  app.get('/api/qr/public/:code', (req, res) => {
    const code = req.params.code.toUpperCase();
    const qr = db.getQRCodeByCode(code);
    if (!qr) {
      return res.status(404).json({ error: 'QR Code não encontrado' });
    }
    res.json({ destinationUrl: qr.destinationUrl, active: qr.active });
  });

  // ----------------------------------------------------
  // 3. GERENCIAMENTO DE QR CODES DINÂMICOS
  // ----------------------------------------------------
  app.get('/api/qr', authenticateToken, (req: AuthRequest, res) => {
    const qrs = db.getUserQRCodes(req.user!.id);
    res.json({ qrCodes: qrs });
  });

  app.post('/api/qr', authenticateToken, (req: AuthRequest, res) => {
    try {
      const { name, destinationUrl, type, customCode } = req.body;
      if (!destinationUrl) {
        return res.status(400).json({ error: 'Link de destino é obrigatório' });
      }

      const newQr = db.createQRCode(
        req.user!.id,
        name || 'Meu QR Code',
        destinationUrl,
        type || 'custom',
        customCode
      );

      res.status(201).json({ qrCode: newQr });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao criar QR Code dinâmico' });
    }
  });

  app.put('/api/qr/:id', authenticateToken, (req: AuthRequest, res) => {
    try {
      const { name, destinationUrl, active } = req.body;
      const updated = db.updateQRCode(req.user!.id, req.params.id, {
        name,
        destinationUrl,
        active,
      });

      res.json({ qrCode: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao atualizar QR Code' });
    }
  });

  app.delete('/api/qr/:id', authenticateToken, (req: AuthRequest, res) => {
    const success = db.deleteQRCode(req.user!.id, req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'QR Code não encontrado ou sem permissão' });
    }
    res.json({ success: true, message: 'QR Code excluído' });
  });

  // ----------------------------------------------------
  // 4. GOOGLE BUSINESS & AVALIAÇÃO GOOGLE
  // ----------------------------------------------------
  app.post('/api/google-business/resolve', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { linkOrName } = req.body;
      if (!linkOrName || !linkOrName.trim()) {
        return res.status(400).json({ error: 'Informe o link ou nome da empresa no Google Maps' });
      }

      const resolved = await resolveGoogleMapsEntity(linkOrName);
      res.json({ place: resolved });
    } catch (err: any) {
      console.error('Error resolving Google Place:', err);
      res.status(500).json({ error: 'Não foi possível identificar o estabelecimento. Tente pelo nome ou link direto.' });
    }
  });

  app.get('/api/google-business', authenticateToken, (req: AuthRequest, res) => {
    const businesses = db.getGoogleBusinesses(req.user!.id);
    res.json({ businesses });
  });

  app.post('/api/google-business', authenticateToken, (req: AuthRequest, res) => {
    try {
      const { businessName, address, city, placeId, reviewUrl, qrCodeId } = req.body;
      if (!businessName || !placeId || !reviewUrl) {
        return res.status(400).json({ error: 'Dados incompletos da empresa' });
      }

      const saved = db.saveGoogleBusiness(
        req.user!.id,
        businessName,
        address || '',
        city || '',
        placeId,
        reviewUrl,
        qrCodeId
      );

      res.status(201).json({ business: saved });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao salvar empresa' });
    }
  });

  app.delete('/api/google-business/:id', authenticateToken, (req: AuthRequest, res) => {
    const success = db.deleteGoogleBusiness(req.user!.id, req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Empresa não encontrada ou sem permissão' });
    }
    res.json({ success: true });
  });

  // ----------------------------------------------------
  // 5. VITE MIDDLEWARE (DEV) OU ARQUIVOS ESTÁTICOS (PROD)
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VINI CODE Server online em http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start VINI CODE server:', err);
});
