
import connectDB from "./config/db.js";
import app from "./app.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log("-----------------------------------");
      console.log("AIRBNB CAPSTONE BACKEND");
      console.log("-----------------------------------");
      console.log(`Server running at http://localhost:${PORT}`);
      console.log("MongoDB connection established.");
      console.log("User routes loaded.");
      console.log("Accommodation routes loaded.");
      console.log("Reservation routes loaded.");
      console.log("-----------------------------------");
    });

    server.on("error", (error) => {
      console.error("Server startup failed:", error.message);
      process.exit(1);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
