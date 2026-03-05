
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { userStore } from '../store/UserStore';

const router = express.Router();

// Login
router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const result = userStore.authenticate(username, password);
  if (!result) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const { passwordHash, ...userInfo } = result.user;
  res.json({ token: result.token, user: userInfo });
});

// Get current user info
router.get('/me', (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = userStore.getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { passwordHash, ...userInfo } = user;
  res.json(userInfo);
});

// Logout
router.post('/logout', (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    userStore.logout(token);
  }
  res.json({ success: true });
});

// List all users (admin only)
router.get('/users', (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  const currentUser = userStore.getUserByToken(token);
  if (!currentUser || currentUser.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  res.json(userStore.getAll());
});

// Create user (admin only)
router.post('/users', (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  const currentUser = userStore.getUserByToken(token);
  if (!currentUser || currentUser.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { username, password, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = userStore.createUser(username, password, role || 'user');
  if (!user) {
    return res.status(409).json({ error: 'Username already exists' });
  }

  const { passwordHash, ...userInfo } = user;
  res.json(userInfo);
});

// Delete user (admin only)
router.delete('/users/:id', (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  const currentUser = userStore.getUserByToken(token);
  if (!currentUser || currentUser.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params as { id: string };
  const success = userStore.deleteUser(id);
  if (!success) {
    return res.status(400).json({ error: 'Cannot delete this user' });
  }
  res.json({ success: true });
});

// Update user (admin only) – toggle permissions like canEditPublicKB
router.put('/users/:id', (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  const currentUser = userStore.getUserByToken(token);
  if (!currentUser || currentUser.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params as { id: string };
  const { canEditPublicKB } = req.body;
  const updated = userStore.updateUser(id, { canEditPublicKB });
  if (!updated) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { passwordHash, ...userInfo } = updated;
  res.json(userInfo);
});

// Change password
router.put('/password', (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  const currentUser = userStore.getUserByToken(token);
  if (!currentUser) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { newPassword } = req.body;
  if (!newPassword) {
    return res.status(400).json({ error: 'New password is required' });
  }

  userStore.changePassword(currentUser.id, newPassword);
  res.json({ success: true });
});

export default router;
