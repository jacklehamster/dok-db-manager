import express from "express";
import { addRoutes } from "dok-db-manager";
import dotenv from 'dotenv';

const app = express();
dotenv.config();

app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', "true");
  next();
});

const port = parseInt(process.env.PORT ?? "3000");

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.use(express.static(__dirname));

const SECRET_WORD = process.env.SECRET_WORD ?? "secret";

addRoutes(app, {
  github: {
    owner: "jacklehamster",
    repo: "power-troll-levels",
  },
  secret: {
    secret: SECRET_WORD,
  },
  nocache: true,
  nolock: true,
});

app.get("/secret", (req, res) => {
  res.send(SECRET_WORD);
});

app.listen({ port });
console.log(`Listening on http://localhost:${port}`);
