const express = require('express');
const router = express.Router();

const usersDB = require('../database/models/User');

router.use(express.json());
router.use(express.urlencoded({ extended: true }));


async function existingUserCheck(email){

    try{
         const existingUserCheck = await usersDB.findOne({email: email})

         if (existingUserCheck){
            return existingUserCheck
         }

         return false
    } catch (err){
        return err
    }

}

async function SessionCheck(req, res){
    if(req.session.user){
        return req.session.user
    }
    else {
        return false
    }
}

module.exports = {existingUserCheck, SessionCheck};