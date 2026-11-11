const path = require('path');
const jsonServer = require('json-server');

const app = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults({
  static: path.join(__dirname, 'dist'),
  noCors: false,
});

// Default json-server middlewares (cors, static, logger)
app.use(middlewares);

// Mount JSON API at /api
app.use('/api', router);

// Also mount at root for backward compatibility
app.use(router);

// Single Page Application (SPA) routing fallback:
// Any request that is not an API call returns dist/index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(500).send('Frontend bundle index.html not found. Please run npm run build first.');
    }
  });
});

const PORT = process.env.PORT || 10000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`===============================================`);
  console.log(`FixMaster Production Server is LIVE!`);
  console.log(`Listening on http://${HOST}:${PORT}`);
  console.log(`API available at http://${HOST}:${PORT}/api`);
  console.log(`===============================================`);
});
