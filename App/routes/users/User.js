const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto')

const usersDB = require('../../database/models/User');
const { sendemail } = require('../../utils/Email');
// const { title } = require('process');

const {existingUserCheck, SessionCheck} = require('../../controllers/userCommonFunctions')

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

let DigiOtp;
let emailStore;

let OTPSucces = false;
let sessionCreationCheck = false;

router.post("/register", async(req, res) => {
    
    try {

        if (await existingUserCheck(req.body.email)) {
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

        if (!req.body || !req.body.email) {
            console.log('first condition')
            return res.status(400).json({ error: 'Email and password are required' });
          }

        if ( await existingUserCheck(req.body.email)) {
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


router.get("/otpGen", async(req, res) => {
    try {

        if (!await existingUserCheck(req.query.email)) {
            console.log("email not found" + req.query.email)
            return res.status(404).json({error: "Email not Found"})
        }

        console.log(req.query.email, req.query.type)
        emailStore = req.query.email

        DigiOtp = crypto.randomInt(100000, 999999).toString();
        
        let Title;
        let description;
        let subject;

        if (req.query.type == 'forget'){
            Title = 'Action Required: Reset Your Account Password';
            description = "We received a request to reset the password for your account. Use the One-Time Password (OTP) below to proceed with resetting your password. If you did't request this, please ignore this email"
            subject = 'Reset Your CCP Account Password'
        }

        else if (req.query.type == 'signup') {
            Title = 'Verify Your Email to Complete Your Registration';
            description = "Thank you for registering with CCP (Collaborative Construction Platform). To activate your account and ensure a secure experience, please verify your email address by entering the One-Time Password (OTP) provided below. We're excited to have you as part of the CCP community!";
            subject = 'Complete Your CCP Registration Verify Your Email'
        }

        try{
            console.log('attempting to send email')
            await sendemail(req.query.email, subject, Title, DigiOtp, description)
        } catch (err) {
            console.log(err)
            res.status(500).json({ error: err})
        }

         res.status(201).json({message: 'Email Sent Successfully'});

    } catch (err) {
        console.log(err)
        res.status(500).json({ error: err})
    }
});


router.post("/CheckOTP", async(req, res) => {
    try{
        const EmailOtp = req.body.email;

        if(emailStore != EmailOtp){
            return res.status(401).json({error: 'email didnt request to password change'})
        }

        if(DigiOtp == req.body.otp){
            DigiOtp = null;
            if (req.body.type == 'Signup') {
                try{
                    await usersDB.updateOne(
                        {email: req.body.email},
                        {$set: {status: true}}
                    );
                    console.log("signup email verified")
                    return res.status(201).json({message: 'Email Verified'})
                } catch (err) {
                    return res.status(500).json({error: err})
                }
            }

            else if (req.body.type == 'Forget password'){
                OTPSucces = true;
                console.log("forget password email verified")
                return res.status(201).json({message: 'Permison granted'})
            }
        }

        res.status(405).json({err: 'Something Happend! please try again later'})
    }
    catch (err) {
        res.status(500).json({ error: err})
    }
    
        
});

router.post("/changePassword", async(req, res) => {
    try{
        const Email = req.body.email;
        const Password = await bcrypt.hash(req.body.password, 10);
        if (emailStore == Email){
            if(OTPSucces){
                await usersDB.updateOne({email: Email},{$set: {password: Password}})
                emailStore = null;
                OTPSucces = false;
                return res.status(201).json({message: 'pasword changed'})
            }
            else{
                return res.status(409).json({err: 'Something Happend'})
            }
        }
        else{
            return res.status(409).json({err: 'Something Happend'})
        }
    } catch (err) {
        res.status(500).json({error: err})
    }
})


router.get("/verifyStatus", async (req, res) => {
    try{
        console.log("this function run")
        const user = await usersDB.findOne({email: req.query.email}).select("status")
        if (user.status == true){
            return res.status(201).json({message: 'email already verified'})
        }
        else {
            return res.status(410).json({err: 'emaild didnt verified'})
        }
    }catch (err){
        res.status(500).json({error: err})
    }
})

router.post("/login", async (req, res) => {
    try {
        const existingUser = await usersDB.findOne({email: req.body.email});
        if (!existingUser) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isPasswordValid = await bcrypt.compare(req.body.password, existingUser.password);
        if (!isPasswordValid) {
            console.log("password mismatch")
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const userDetails = await usersDB.findOne({email: req.body.email}).select("-password")
        req.session.user = userDetails;
        sessionCreationCheck = true;
        // console.log("session created ", req.session.user)
        res.status(200).json({ message: 'Login successful', user: userDetails });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post("/checkSession", async (req, res) => {
    try {
        const Session = await SessionCheck(req, res);
        if (Session) {
            console.log("Session exists:", Session);
            return res.status(200).json({ user: Session });
        }
        else {
            console.log("Session does NOT exist");
            return res.status(401).json({ error: "No active session" });
        }
    } catch (err) {
        res.status(500).json({error: err})
    }




});

router.get("/LoginStatus", async (req, res) => {
    if (sessionCreationCheck){
        sessionCreationCheck = false;
        return res.status(201).json({message: 'Forcefull Logout'})
    }

    res.status(401).json({error: 'error'})
})


module.exports = router;