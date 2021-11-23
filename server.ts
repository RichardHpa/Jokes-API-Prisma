require('dotenv').config();
import express from 'express';
import cors from 'cors';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import nodeMailer from 'nodemailer';
import jwt from 'jsonwebtoken';

const app = express();
// Set up middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
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

// register
app.post('/register', async (req: Request, res: Response) => {
  const { name, email } = req.body;
  const checkUser = await prisma.user.findFirst({
    where: {
      email,
    },
  });

  if (checkUser) {
    res.json({
      message: 'User already exists',
    });
  } else {
    const user = await prisma.user.create({
      data: {
        name,
        email,
      },
    });
    res.json(user);
  }
});

// Set up email
// const transport = nodeMailer.createTransport({
//   host: process.env.EMAIL_HOST,
//   port: 587,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASSWORD,
//   },
// });
const transporter = nodeMailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: 'jocelyn.schuppe54@ethereal.email',
    pass: 'kvBb923R6X1KEyEBxG',
  },
});

interface Email {
  name: string;
  link: string;
}

const emailTemplate = ({ name, link }: Email) => `
  <h2>Hey ${name}</h2>
  <p>Here's the login link you just requested:</p>
  <p>${link}</p>
`;

// Generate token
const makeToken = (email: string) => {
  const expirationDate = new Date();
  expirationDate.setHours(new Date().getHours() + 1);
  return jwt.sign({ email, expirationDate }, process.env.JWT_SECRET_KEY as string);
};
// login
app.post('/login', (req: Request, res: Response) => {
  const email = req.body.email;

  if (!email) {
    res.status(403);
    res.send({
      message: 'There is no email address that matches this.',
    });
  }

  if (email) {
    const token = makeToken(email);
    const mailOptions = {
      from: 'You Know',
      html: emailTemplate({
        name: email,
        link: `http://localhost:3000/account?token=${token}`,
      }),
      subject: 'Your Magic Link',
      to: email,
    };
    return transporter.sendMail(mailOptions, error => {
      if (error) {
        res.status(404);
        res.send("Can't send email.");
      } else {
        res.status(200);
        res.send(`Magic link sent. : http://localhost:3000/account?token=${token}`);
      }
    });
  }
});

app.get('/users', async (req: Request, res: Response) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

app.get('/users/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await prisma.user.findFirst({ where: { id } });
  res.json(user);
});

const isAuthenticated = (req: any, res: any) => {
  const { token } = req.query;
  if (!token) {
    res.status(403);
    res.send("Can't verify user.");
    return;
  }
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string);
  } catch {
    res.status(403);
    res.send('Invalid auth credentials.');
    return;
  }
  if (!decoded.hasOwnProperty('email') || !decoded.hasOwnProperty('expirationDate')) {
    res.status(403);
    res.send('Invalid auth credentials.');
    return;
  }
  const { expirationDate }: any = decoded;
  if (expirationDate < new Date()) {
    res.status(403);
    res.send('Token has expired.');
    return;
  }
  res.status(200);
  res.send('User has been validated.');
};
// Get account information
app.get('/account', (req, res) => {
  isAuthenticated(req, res);
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
