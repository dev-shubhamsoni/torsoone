import express, { Application, } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import userRoute from './routes/user'
import adminRoute from './routes/admin'

const app: Application = express();

// Express Middlewares
app.use(helmet());
app.use(cors());
app.use(express.urlencoded({ limit: '25mb', extended: true }));
app.use(express.json());

app.use("/api/user", userRoute);
app.use("/api/admin", adminRoute);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
