import express, { Request, Response } from 'express';
const app = express();
const server = require('http').Server(app);
const port = 3000;
app.get('/', (req: Request, res: Response) => {
    res.json({ data: 'hello world' });
});
server.listen(port, () => console.log(`Example app listening on port ${port}!`));