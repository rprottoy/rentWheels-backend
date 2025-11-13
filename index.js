const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

// Connecting MongoDB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.plgjzw8.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get("/", (req, res) => {
  res.send("Smart server is running");
});

// MongoDB Connection last part
async function run() {
  try {
    await client.connect();

    const db = client.db("rentWheels_db");
    const carsCollection = db.collection("browseCars");
    const bookingCollection = db.collection("myBookings");

    // To get the cars based on user's email. if user is logged , then they will see their cars
    app.get("/browseCars", async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.email = email;
      }

      const cursor = carsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // To get User's Listings
    app.get("/my-listings", async (req, res) => {
      const email = req.query.email;
      const result = await carsCollection
        .find({ providerEmail: email })
        .toArray();
      res.send(result);
    });

    // To see limited cars in the website home page by default
    app.get("/featured-cars", async (req, res) => {
      const cursor = carsCollection.find().limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    // To see all the cars in browseCars page by default
    app.get("/browse-cars", async (req, res) => {
      const cursor = carsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // To Get user's Bookings
    app.get("/my-bookings/:email", async (req, res) => {
      const email = req.params.email;
      const query = { booked_by: email };
      const result = await bookingCollection.find(query).toArray();

      res.send(result);
    });

    // To get a specific Car
    app.get("/car-details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await carsCollection.findOne(query);
      res.send(result);
    });

    // For Search functionality
    app.get("/search", async (req, res) => {
      const searchTerm = req.query.search;
      const result = await carsCollection
        .find({ carName: { $regex: searchTerm, $options: "i" } })
        .toArray();

      // console.log(result);
      res.send(result);
    });

    // to new car details as json
    app.post("/browseCars", async (req, res) => {
      const newCar = req.body;

      const result = await carsCollection.insertOne(newCar);
      res.send(result);
    });

    // To store data for Bookings
    app.post("/myBookings", async (req, res) => {
      const data = req.body;
      const carId = data._id;
      // console.log(data, id);

      const result = await bookingCollection.insertOne(data);

      const query = { _id: new ObjectId(carId) };
      const updateStatus = {
        $set: { availabilityStatus: "Booked" },
      };
      const updateResult = await carsCollection.updateOne(query, updateStatus);
      res.send(result);
    });

    // To update any existing car
    app.patch("/car/:id", async (req, res) => {
      const id = req.params.id;
      const updatedCar = req.body;

      const query = { _id: new ObjectId(id) };
      const update = {
        $set: {
          carName: updatedCar.carName,
          rentPrice: updatedCar.rentPrice,
          category: updatedCar.category,
          description: updatedCar.description,
          location: updatedCar.location,
          imageUrl: updatedCar.imageUrl,
        },
      };
      const options = {};
      const result = await carsCollection.updateOne(query, update, options);
      res.send(result);
    });

    // to delete car detail
    app.delete("/browseCars/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await carsCollection.deleteOne(query);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Smart server is running on port: ${port}`);
});
