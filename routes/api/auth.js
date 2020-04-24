const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');     // Bring in middleware 'auth'
const User = require('../../models/User');        // Bring in 'User' model.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const config = require('config');

/** @route   GET api/auth
 *  @desc    get auth user data with verified token
 *  @access  Public
 * */

// Add Middleware 'auth' as 2nd param to makes this Route PROTECTED
router.get('/', auth, async ( req, res ) => {

   //--- GET jwt authenticated/verified user data
   try {
      const user = await User.findById(req.user.id).select('-password');    // '-password' will exclude the password
      await res.json(user);

      // res.send('Auth route')
   } catch ( err ) {
      console.error(err.message);
      res.status(500).send('Server Error!');
   }
});


/** @route   POST api/auth
 *  @desc    Authenticate user & get token
 *  @access  Public
 * */
router.post('/',
    // property for Express-Validator to check and validate: 'email', 'password'
    [
       check('email', 'Please include a valid email.').isEmail(),
       check('password', 'Password is required').exists()
    ],
    async ( req, res ) => {
       //--- CHECK for errors in the body
       const errors = validationResult(req);
       if ( !errors.isEmpty() ) {
          return res.status(400).json({ errors: errors.array() });
       }

       const { email, password } = req.body;    // Destructuring with ES6

       //--- CHECK for the User
       try {
          let user = await User.findOne({ email });

          if ( !user ) {
             return res.status(400).json({ errors: [ { msg: 'Invalid Credentials' } ] });
          }


          //--- CHECK Passwords:
          // bcrypt has a method compare() to compare('text pass' vs 'encrypted pass') If match or not
          const isMatch = await bcrypt.compare(password, user.password);
          if ( !isMatch ) {
             return res.status(400).json({ errors: [ { msg: 'Invalid Credentials' } ] });
          }


          //--- RETURN User's jsonwebtoken(JWT) -----//
          // CREATE Payload:
          const payload = {
             user: {
                id: user.id,     // ID is created by JWT
                name: user.name
             }
          };


          // SIGN Payload:
          jwt.sign(
              payload,
              config.get('jwtSecret'),    // Accesses 'default.json' from 'config' folder. GET 'jwtSecret' value
              { expiresIn: 360000 },
              ( err, token ) => {
                 if ( err ) throw err;

                 res.json({ token });
              });


       } catch ( err ) {
          console.error(err.message);
          res.status(500).send('Server ERROR');
       }

    });

module.exports = router;
