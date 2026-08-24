const mongoose = require('mongoose');

const uri = "mongodb+srv://appdev_db_user:IdrIxpyeGuHhzhn0@cluster0.ed9fjps.mongodb.net/?appName=Cluster0";

async function run() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  
  const servicesCollection = db.collection('medicalservices');
  
  const updateDoc = {
    $set: {
      "sections": [
        {
          "title": "A. Pre-Therapy Routine Health Check with Predictive Longevity Report",
          "items": [
            "Ultrasound Abdomen",
            "Chest X-Ray",
            "2D Echocardiogram",
            "ECG",
            "Genetic Test",
            "Complete Blood Profile",
            "Body Composition Evaluation"
          ]
        },
        {
          "title": "B. 20 Precision IV Therapy Sessions (Phase 1: First 2 Months)",
          "items": [
            "6 NAD+ sessions",
            "6 Vytalyou Cocktail"
          ]
        },
        {
          "title": "B. 20 Precision IV Therapy Sessions (Phase 2: Next 4 Months)",
          "items": [
            "1 NAD and 1 VytalYou Cocktail each month (total 8 sessions)"
          ]
        },
        {
          "title": "C. Post-Therapy Routine Health Check and Comparative Analysis with previous Longevity Report",
          "items": [
            "Ultrasound Abdomen",
            "Complete Blood Profile",
            "Body Composition Evaluation"
          ]
        }
      ]
    }
  };

  const result = await servicesCollection.updateOne(
    { serviceId: "complete-recode" },
    updateDoc
  );
  
  console.log("Update Result:", result);
  await mongoose.disconnect();
}

run().catch(console.error);
