const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://127.0.0.1:27017/eva_db')
  .then(async () => {
      const users = await User.find();
      for (const u of users) {
          console.log(u.email, u.password);
          const match = await u.matchPassword('123456');
          console.log('Match 123456:', match);
      }
      process.exit();
  });
