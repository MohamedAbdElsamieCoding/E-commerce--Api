import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRouter from "./modules/auth/auth.route.js";
import { errorHandler } from "./middlewares/error-handler.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(helmet());
app.use(cors());

app.use("/api/v1/auth", authRouter);

app.use(errorHandler);
export default app;
