import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import connectToDB from "./db/db.js";

const port = 2345;

connectToDB()
  .then(() =>
    app.listen(port, () => console.log(`Server is running on port ${port}`))
  )
  .catch((e) => {
    console.log("Connection failed", e);
    process.exit(1);
  });
