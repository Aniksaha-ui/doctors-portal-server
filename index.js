const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 4000;
const { MongoClient, ServerApiVersion } = require("mongodb");

app.use(cors());
app.use(express.json());
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.vt0ws.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
async function run() {
  try {
    await client.connect();
    console.log("Database Connected");

    const serviceCollection = client
      .db("doctors_portal")
      .collection("services");

    app.get("/services", async (req, res) => {
      const query = {};
      const servicesCursor = await serviceCollection.find(query);
      //   console.log(servicesCursor);
      const services = await servicesCursor.toArray();
      res.send(services);
    });
  } finally {
  }
}

run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send("Server is running successfully");
});

app.listen(port, () => {
  console.log(`Doctors App listening on port ${port}`);
});
