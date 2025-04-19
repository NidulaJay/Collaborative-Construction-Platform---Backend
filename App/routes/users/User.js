const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const usersDB = require('../../database/models/User')

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.post("/register", async(req, res) => {
    
    try {
        const existingUserCheck = await usersDB.findOne({email: req.body.email});

        if (existingUserCheck) {
            console.log("already exist");
            return res.status(409).json({ error: 'this email already exist'});
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const newUser = new usersDB({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            phoneNumber: req.body.phoneNumber,
            userName: req.body.userName,
            birthdate: req.body.birthdate,
            gender: req.body.gender,
            nic: req.body.nic,
            address: req.body.address,
            userRole: req.body.userRole,
            city: req.body.city,
            state: req.body.state,
            Zip: req.body.zip,
            password: hashedPassword
        });

        console.log(newUser)

        await newUser.save();
        console.log('user created successfully')

        res.status(201).json({message: 'user created successfully'});

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err})
    }

});

router.post("/emailCheck", async(req, res) => {
    try {
        
        console.log(req.body)

        if (!req.body || !req.body.email) {
            console.log('first condition')
            return res.status(400).json({ error: 'Email and password are required' });
          }

         existingUserCheckForEmailCheck = await usersDB.findOne({email: req.body.email});

        if (existingUserCheckForEmailCheck) {
            console.log("already exist");
            return res.status(409).json({ error: 'this email already exist'});
        }

        console.log('email ready')
        res.status(201).json({message: 'email ready to signup'});

    } catch (err) {
        console.log('error occurs')
        console.error(err);

        res.status(500).json({ error: err})
    }
});

module.exports = router;