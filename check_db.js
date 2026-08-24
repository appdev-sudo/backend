const mongoose = require('mongoose');

const uri = "mongodb+srv://appdev_db_user:IdrIxpyeGuHhzhn0@cluster0.ed9fjps.mongodb.net/?appName=Cluster0";

async function run() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  
  // Find collections
  const collections = await db.listCollections().toArray();
  console.log("Collections:", collections.map(c => c.name));
  
  const servicesCollection = db.collection('medicalservices'); // Assuming standard mongoose pluralization
  const doc = await servicesCollection.findOne({ serviceId: "complete-recode" });
  console.log("Document:", JSON.stringify(doc, null, 2));
  
  await mongoose.disconnect();
}

run().catch(console.error);
