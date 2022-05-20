const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
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

    const bookingCollection = client.db("doctors_portal").collection("booking");
    const userCollection = client.db("doctors_portal").collection("user");

    //users login and register
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "2h" }
      );
      res.send({ result, token });
    });

    //get services
    app.get("/services", async (req, res) => {
      const query = {};
      const servicesCursor = await serviceCollection.find(query);
      const services = await servicesCursor.toArray();
      // console.log(services);
      res.send(services);
    });

    app.get("/available", async (req, res) => {
      const date = req.query.date || "May 15, 2022";
      // console.log(date);
      //get services
      const services = await serviceCollection.find().toArray();
      const query = { date: date };
      const bookings = await bookingCollection.find(query).toArray();
      //for each services,find booking for that service
      services.forEach((service) => {
        const serviceBookings = bookings.filter(
          (book) => book.treatment === service.name
        );
        const bookedSlots = serviceBookings.map((book) => book.slot);
        const available = service.slots.filter(
          (slot) => !bookedSlots.includes(slot)
        );
        service.slots = available;
      });
      res.send(services);
    });

    //get myitems
    app.get("/mybookings", async (req, res) => {
      const patient = req.query.patient;
      const query = { patient: patient };
      const bookings = await bookingCollection.find(query).toArray();
      res.send(bookings);
    });

    //Post services
    app.post("/booking", async (req, res) => {
      const booking = req.body;
      const query = {
        treatment: booking.treatment,
        date: booking.date,
        patient: booking.patient,
      };

      const exists = await bookingCollection.findOne(query);
      if (exists) {
        return res.send({ success: false, booking: exists });
      }
      const result = await bookingCollection.insertOne(booking);
      res.send({ success: true, result });
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
