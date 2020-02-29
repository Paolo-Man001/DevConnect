const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// const { check, validationResult } = require('express-validator/check');  // !!!DEPRECATED
const { check, validationResult } = require('express-validator');
const config = require('config');
const User = require('../../models/User');   // 'User' model from 'models' folder


/* @route   POST api/users
*  @desc    Register user
*  @access  Public
* */
router.post('/',
    // property for Express-Validator to check and validate: 'name, 'email', 'password'
    [
       check('name', 'Name is required.')
           .not()
           .isEmpty(),
       check('email', 'Please include a valid email.').isEmail(),
       check('password', 'Please enter a password with 6 or more characters')
           .isLength({ min: 6 })
    ],
    async ( req, res ) => {         // When using 'async' -- always have 'await'
       // console.log(req.body);
       const errors = validationResult(req);
       if ( !errors.isEmpty() ) {
          return res.status(400).json({ errors: errors.array() });
       }

       //------------------------------------------------------------------------------------------//
       const { name, email, password } = req.body;    // assign body fields with Destructuring(es6)

       try {
          let user = await User.findOne({ email });   // find user-email

          //----- CHECK If User(email) exists -----//
          if ( user ) {
             return res.status(400).json({ errors: [ { msg: 'User already exists' } ] });
          }


          //----- CREATE User Gravatar -----//
          const avatar = gravatar.url(email, {
             s: '200',       // size
             r: 'pg',        // rating
             d: 'https://api.adorable.io/avatars/285/abott@adorable.png'      // default !!you can change to 'retro' or 'mm'
          });

          user = new User({
             name, email, avatar, password
          });


          //----- ENCRYPT User Passsword with bcrypt -----//
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(password, salt);
          await user.save();


          //----- RETURN User's jsonwebtoken(JWT) -----//
          // CREATE Payload:
          const payload = {
             user: {
                id: user.id,        // user ID is created by JWT, included in the Token.
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

          // res.send('Users REGISTERED!');

       } catch ( err ) {
          console.error(err.message);
          res.status(500).send('Server ERROR');
       }

    });


module.exports = router;
