const jwt = require('jsonwebtoken');
const config = require('config');


module.exports = function ( req, res, next ) {

   //--- GET token from header
   const token = req.header('x-auth-token');

   //--- CHECK if No token
   if ( !token ) {
      return res.status(401).json({ msg: 'No token. Authorization denied!' });
   }

   //--- VERIFY Token if there is one
   try {
      const decoded = jwt.verify(token, config.get('jwtSecret'));    // Decode the token with .verify()

      req.user = decoded.user;      // Take 'req' object and assign value into 'user'
      next();     // a call back once we're done so it moves on to the Next middleware.

   } catch ( err ) {
      res.status(401).json({ msg: 'Token is not valid.' });
   }
};
