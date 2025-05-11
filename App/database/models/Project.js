const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    projectName: {type: String, required: true, minlength: 2},
    owner: {type: String, required: true},
    location: {type: String},
    description: {type: String},
    Sdate: {type: Date, required: true},
    Edate: {type: Date, required: true},
    locationOnMap: {type: {lat: {type: Number}, lng: {type: Number}}},
    documents: {type: [{link: {type: String}, status: {type: Boolean, default: false}, name: {type: String}}]},
    Users: {type: [{userType: {type: String, enum: ['user', 'contractor', 'architecture', 'supplier']}, userEmail: {type: String}, default: []}]},
    Milestones:{type: [{sDate: {type: Date}, eDate: {type: Date}, Name: {type: String}, status: {type: Boolean, default: false}, started: {type: Boolean, default: false}}]},
    status: {type: Boolean, default: false},
    viewd: {type: Boolean, required: false}
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;