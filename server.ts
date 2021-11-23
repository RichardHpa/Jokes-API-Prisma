import express from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

// get all jokes
app.get('/jokes', async (req: Request, res: Response) => {
  const jokes = await prisma.joke.findMany({
    include: {
      creator: true,
    },
  });
  res.json(jokes);
});

// create a joke
app.post('/jokes', async (req: Request, res: Response) => {
  const joke = await prisma.joke.create({
    data: {
      text: 'I was wondering why the baseball was getting bigger. Then it hit me.',
      userId: 'ckwbg5usg00093yx53qpspzb1',
    },
  });
  res.json(joke);
});

// get a joke
app.get('/jokes/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  // const id = 'ckwbgltlw0005hxx5iq5gch71';
  const joke = await prisma.joke.findFirst({ where: { id } });
  res.json(joke);
});

// delete a single joke
app.put('/jokes/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const joke = await prisma.joke.update({
    where: { id },
    data: {
      text: 'Updated',
    },
  });
  res.json(joke);
});

// delete a single joke
app.delete('/jokes/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const joke = await prisma.joke.delete({ where: { id } });
  res.json(joke);
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
