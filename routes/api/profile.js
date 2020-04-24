const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Profile = require('../../models/Profile');
const User = require('../../models/User');


/** @route   GET api/profile/me
 *  @desc    Get current user's profile
 *  @access  Private
 * */
router.get('/me', auth, async ( req, res ) => {

   try {
      const profile = await Profile.findOne({ user: req.user.id })   // user.id is from the Token JWT created/signed
          .populate('user', [ 'name', 'avatar' ]);    // 'user' is the reference. 'name' and 'avatar' will be from User.js fields

      //--- CHECK to see if profile NOT found:
      if ( !profile ) {
         return res.status(400).json({ msg: 'There is NO profile for this user' });
      }

      await res.json(profile);
   } catch ( err ) {
      console.error(err.message);
      res.status(500).send('Server Error');
   }

}); // END router.get() --> GET api/profile/me : Get current user's profile


/** @route   POST api/profile
 *  @desc    Create or Update a user profile
 *  @access  Private
 * */
router.post('/',
    [
       // auth and validation(check) middleware
       auth,
       [
          check('status', 'Status is required')
              .not()
              .isEmpty(),
          check('skills', 'Skills is required')
              .not()
              .isEmpty()
       ]
    ],
    async ( req, res ) => {
       //--- CHECK for request errors:
       const errors = validationResult(req);
       // if error occurs:
       if ( !errors.isEmpty() ) {
          return res.status(400).json({ errors: errors.array() });
       }

       // if No error occurs:
       const {
          company,
          website,
          location,
          bio,
          status,
          githubusername,
          skills,
          youtube,
          facebook,
          twitter,
          instagram,
          linkedin
       } = req.body;    //  Request-Body(json) fields are assigned to variables using ES6 Destructuring.

       //--- BUILD Profile Object:
       const profileFields = {};
       profileFields.user = req.user.id;  // It will know which user by checking the user.id in the Token(JWT)
       if ( company ) profileFields.company = company;
       if ( website ) profileFields.website = website;
       if ( location ) profileFields.location = location;
       if ( bio ) profileFields.bio = bio;
       if ( status ) profileFields.status = status;
       if ( githubusername ) profileFields.githubusername = githubusername;

       if ( skills ) {
          // 'skills' is going to be a comma-separated list. Turn List into an Array-of-skills, same in Profile.js
          profileFields.skills = skills.split(',').map(skill => skill.trim());
       }
       // console.log(profileFields.skills);    // Check for skills-array

       //--- BUILD Social Object:
       profileFields.social = {};
       if ( youtube ) profileFields.social.youtube = youtube;
       if ( twitter ) profileFields.social.twitter = twitter;
       if ( facebook ) profileFields.social.facebook = facebook;
       if ( instagram ) profileFields.social.instagram = instagram;
       if ( linkedin ) profileFields.social.linkedin = linkedin;

       //--- UPDATE/CREATE Profile and INSERT the data:
       try {
          let profile = await Profile.findOne({ user: req.user.id });

          // Update Profile:
          if ( profile ) {
             profile = await Profile.findOneAndUpdate(
                 { user: req.user.id },
                 { $set: profileFields },
                 { new: false }
             );

             // console.log(profileFields.social.twitter);
             return res.json(profile);
          }

          // Create Profile:
          profile = new Profile(profileFields);
          await profile.save();
          await res.json(profile);

       } catch ( err ) {
          console.log(err.message);
          res.status(500).send('Server Error');
       }

       // res.send('Hello and Welcome');

    }
);  // END router.post() --> POST api/profile : Create or Update a user profile


/** @route   GET api/profile
 *  @desc    Get ALL profiles
 *  @access  Public
 * */
router.get('/', async ( req, res ) => {
   try {
      const profiles = await Profile.find().populate('user', [ 'name', 'avatar' ]);
      await res.json(profiles);
   } catch ( err ) {
      console.log(err.message);
      res.status(500).send('Server Error');
   }
});   // END router.get() --> GET api/profile : Get ALL profiles


/** @route   GET api/profile/user/:user_id
 *  @desc    Get profile by user ID
 *  @access  Public
 * */
router.get('/user/:user_id', async ( req, res ) => {
   try {
      const profile = await Profile.findOne({ user: req.params.user_id })
          .populate('user', [ 'name', 'avatar' ]);

      //--- CHECK if User-Profile exists:
      if ( !profile )
         return res.status(400).json({ msg: 'User Profile Not Found!' });

      await res.json(profile);
   } catch ( err ) {
      console.log(err.message);

      //-- CHECK for a certain type of Message:
      if ( err.kind === 'ObjectId' ) {
         return res.status(400).json({ msg: 'User Profile Not Found!' });
      }
      res.status(500).send('Server Error');
   }

});   // END router.get() --> GET api/profile/user/:user_id : GET profile by user ID


/** @route   DELETE api/profile
 *  @desc    Delete profile, user & posts
 *  @access  Public
 * */
router.delete('/', auth, async ( req, res ) => {
   try {
      // @todo - REMOVE users-posts

      // Remove profile
      await Profile.findOneAndRemove({ user: req.user.id });
      // Remove user
      await User.findOneAndRemove({ _id: req.user.id });
      res.json({ msg: 'User Deleted' });
   } catch ( err ) {
      console.log(err.message);
      res.status(500).send('Server Error');
   }
});   // END router.get() --> DELETE api/profile : Get ALL profiles
module.exports = router;
