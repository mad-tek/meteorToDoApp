//mongo db database
Tasks = new Mongo.Collection("tasks");

if (Meteor.isClient) {
  //This only runs on the client
  Template.body.helpers({
    tasks: function() {
    	//gets data from db, then sort by createdAt in descending order, or newest first
    	return Tasks.find({}, {sort: {createdAt:-1}});
    }
  });

  //in the body events
  Template.body.events({
  	//this function is called wehn the new task form is submitted
  	//listening to the submit event on any element that matches the CSS selector .new-task
  	"submit .new-task": function (event) {
  		//event.target is the form element, get the text input with text.value
  		var text = event.target.text.value;

  		//puts data in db from the text field and we don't have to define a schema
  		Tasks.insert({
  			text: text,
  			createdAt: new Date() //current time
  		});

  		//clear form
  		event.target.text.value = "";

  		//prevent default form submit
  		return false;
  	}
  });

  //in the template events
  Template.task.events({
  	//listening to the click event on the element .toggle-checked
  	"click .toggle-checked": function() {
  		//updating the database
  		Tasks.update(this._id, {$set: {checked: ! this.checked}});
  	},
  	//listening to the click event on the element .delete
  	"click .delete": function(){
  		//deleting the item on the db
  		Tasks.remove(this._id);
  	}
  });
}
