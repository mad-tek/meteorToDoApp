//mongo db database
Tasks = new Mongo.Collection("tasks");

//the client logic, methods, and variables
if (Meteor.isClient) {
  //client now has access to server's "tasks" which is a method that does Tasks.find()
  Meteor.subscribe("tasks")
  //This only runs on the client
  Template.body.helpers({
    tasks: function() {
      //within the unique user session (not public or global) show the list of tasks depending if hideCompleted is clicked
      if(Session.get("hideCompleted")){
        //gets data from db, only the ones that are not checked
        return Tasks.find({checked: {$ne: true}}, {sort: {createdAt: -1}});
      }else{
        //gets data from db, then sort by createdAt in descending order, or newest first
        return Tasks.find({}, {sort: {createdAt:-1}});
      }
    },
    hideCompleted: function(){
      //within the unique user session ((not public or global)) hide checked tasks
      return Session.get("hideCompleted");
    },
    incompleteCount: function(){
      //count the number of incompleted tasks (unchecked tasks)
      return Tasks.find({checked: {$ne: true}}).count();
    }
  });

  //in the body events
  Template.body.events({
  	//this function is called wehn the new task form is submitted
  	//listening to the submit event on any element that matches the CSS selector .new-task
  	"submit .new-task": function (event) {
  		//event.target is the form element, get the text input with text.value
  		var text = event.target.text.value;
      //call the method that adds task to db
  		Meteor.call("addTask", text);

  		//clear form
  		event.target.text.value = "";

  		//prevent default form submit
  		return false;
  	},
    "change .hide-completed input": function(event){
      //setting the unique session (not public or global) to check the event
      Session.set("hideCompleted", event.target.checked);
    }
  });

  //in the template events
  Template.task.events({
  	//listening to the click event on the element .toggle-checked
  	"click .toggle-checked": function() {
  		//call the method that update db entry with this id and set to check or uncheck
  		Meteor.call("setChecked", this._id, ! this.checked);
  	},
  	//listening to the click event on the element .delete
  	"click .delete": function(){
  		//call the method that deletes the data
  		Meteor.call("deleteTask", this._id);
  	},
    "click .toggle-private": function(){
      Meteor.call("setPrivate", this._id, ! this.private);
    }
  });

  //accounts signin
  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });

  //define a helper to check if the current user is the task owner
  Template.task.helpers({
    isOwner: function(){
      return this.owner === Meteor.userId();
    }
  });
}

//methods defined outside of the client and server but can be called anywhere and anytime
Meteor.methods({
  addTask: function(text){
    if(! Meteor.userId()){
      throw new Meteor.Error("not-authorized");
    }

    //puts data in db from the text field and we don't have to define a schema
    Tasks.insert({
      text: text,
      createdAt: new Date(), //current time
      owner: Meteor.userId(), //_id of logged in user
      username: Meteor.user().username //username of logged in user
    });
  },
  deleteTask: function(taskId){
    var task = Tasks.findOne(taskId);

    if(task.private && task.owner !== Meteor.userId()){
      throw new Meteor.Error("not-authorized");
    }
    //deleting the item on the db
    Tasks.remove(taskId);
  },
  setChecked: function(taskId, setChecked){
    var task = Tasks.findOne(taskId);

    if(task.private && task.owner !== Meteor.userId()){
      throw new Meteor.Error("not-authorized");
    }
    //updating the database
    Tasks.update(taskId, { $set: { checked: setChecked} });
  },
  setPrivate: function(taskId, setToPrivate){
    var task = Tasks.findOne(taskId);
    if (task.owner !== Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }
    Tasks.update(taskId, { $set: { private: setToPrivate } });
  }
});

//server side code
if (Meteor.isServer) {
  //makes Tasks.find() available to the client that subscribes to "tasks"
  Meteor.publish("tasks", function(){
    return Tasks.find({
      $or: [
        { private: {$ne: true} },
        { owner: this.userId }
      ]
    });
  });
}
