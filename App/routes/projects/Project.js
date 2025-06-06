const express = require('express');
const router = express.Router();
const multer  = require('multer')
const path = require('path');
const projectdb = require('../../database/models/Project')

const {existingUserCheck, SessionCheck} = require('../../controllers/userCommonFunctions')


router.use(express.json({limit: '50mb'}));
router.use(express.urlencoded({ extended: true, limit: '50mb' }));

const uploadDirectory = path.join(__dirname, '../../Uploads/Documents');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDirectory); // Make sure this folder exists
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext);
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `${baseName}-${uniqueSuffix}${ext}`);
    }
  });
  
  const upload = multer({ storage: storage });

router.post("/register", upload.single('document'), async (req, res) => {
    try{

        if (req.file) {
            const fileUrl = `/Uploads/Documents/${req.file.filename}`;
            const originalName = req.file.originalname;
          }

        const users = req.body.Users ? JSON.parse(req.body.Users) : [];
        const milestones = req.body.Milestones ? JSON.parse(req.body.Milestones) : [];
        const locationOnMap = req.body.locationOnMap ? JSON.parse(req.body.locationOnMap) : {};

        const validUsers = users.filter(user => 
            user.userType && 
            ['user', 'contractor', 'architecture', 'supplier'].includes(user.userType)
        );


        const projectDataFields  = {
            projectName: req.body.projectName,
            owner: req.body.owner,
            location: req.body.location,
            description: req.body.description,
            Sdate: req.body.Sdate,
            Edate: req.body.Edate,
            locationOnMap: locationOnMap,
            Users: validUsers,
            Milestones: milestones
        }

        if (req.file) {
            projectDataFields.documents = [{
                link: `/Uploads/Documents/${req.file.filename}`,
                status: true,
                name: req.file.originalname
            }];
        }

        const projectData = new projectdb(projectDataFields);

        await projectData.save();
        console.log('project stored successfully')
        res.status(201).json({message: 'Succesfully updated'});

    }
    catch (err) {
        res.status(500).json({error: err})
    }
});


router.post("/getAll", async (req, res) => {
  try{
    const Session = await SessionCheck(req, res)
     if (Session){
      console.log(req.body.email)
      const allProject = await projectdb.find({owner: req.body.email})
      res.status(201).json({projects: allProject})
     }

  } catch (err) {
    res.status(500).json({error: err})
  }
})

router.post("/getProject" , async (req,res) => {
  try{
    const Session = await SessionCheck(req, res)
    if (Session){
    const project = await projectdb.findById({id})
    }
  } catch (err) {
    res.status(500).json({error: err})
  }
})

router.post("/getOne", async (req, res) => {
  try {
    const Session = await SessionCheck(req, res);
    if (Session) {
      if (!req.body.id) {
        return res.status(400).json({ error: "Project ID is required" });
      }
      const project = await projectdb.findById(req.body.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.status(200).json({ project });
    }
  } catch (err) {
    console.error("Error fetching project:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/delete", async (req, res) => {
  try {
    const Session = await SessionCheck(req, res);
    if (Session) {
      if (!req.body.id) {
        return res.status(400).json({ error: "Project ID is required" });
      }
      const project = await projectdb.findById(req.body.id);
      
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      if (project.owner !== req.body.email) {
        return res.status(403).json({ error: "You are not authorized to delete this project" });
      }
      const deletedProject = await projectdb.findByIdAndDelete(req.body.id);
      
      res.status(200).json({ 
        message: "Project deleted successfully", 
        projectId: req.body.id 
      });
    }
  } catch (err) {
    console.error("Error deleting project:", err);
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;