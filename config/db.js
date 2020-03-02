const mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURI');     // Access 'default.json' from 'config' folder. GET 'mongoURI' value


const connectDB = async () => {
   try {
      await mongoose.connect(db, {
         useNewUrlParser: true,
         useCreateIndex: true,
         useFindAndModify: false,    // Always use this connection option
         useUnifiedTopology: true
      });

      console.log('mongoDB Connected...');

   } catch ( err ) {
      console.error(err.message);
      // Exit process with failure
      process.exit(1);
   }
};

module.exports = connectDB;
