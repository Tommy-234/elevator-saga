


{
    init: function(elevators, floors) {
	var global_queue = [];
	var idling_elevators = [];
	
	// The buttonStates property is not in the documentation, I found this in the source code.
	// A button's state is either empty or set to "activated"
	function floorButtonStateChange(floor) {
		var up = floor.buttonStates.up;
		var down = floor.buttonStates.down;
			
		if (up === "" && down === "") {
			// If neither buttons are pressed, remove this floor from the global_queue.
			var index = global_queue.indexOf(floor.floorNum());
			if (index >= 0) {
				global_queue.splice(index, 1);
			}
		} else {
			// If 1 or both buttons are pressed, add to global_queue.
			if (global_queue.indexOf(floor.floorNum()) < 0) {
				global_queue.push(floor.floorNum());
			}
			// Send an idle elevator to the first floor in the queue.
			if (idling_elevators.length > 0) {
				var firstElevator = idling_elevators.splice(0, 1)[0];
				var firstQueue = global_queue.splice(0, 1);
				firstElevator.goToFloor(firstQueue);
			}
		}
	}
		
	// Send the idle elevator to the first floor in the queue, otherwise add elevator to idling_elevators.
	function elevatorIsIdle(elevator) {
		if (global_queue.length > 0) {
			var firstQueue = global_queue.splice(0, 1);
			elevator.goToFloor(firstQueue);
		} else {
			idling_elevators.push(elevator);
		}
	}
		
	// Set the elevator's direction indicators. I'm not convinced this helps.
	function elevatorDirection(elevator) {
		var nextFloor = elevator.destinationQueue[0];
		var currentFloor = elevator.currentFloor();
		
		// This function seems to really not help with fewer elevators.
		if (elevators.length < 4) {
			return;
		}
		
		if (elevator.loadFactor() > 0.65) {
			// Too many people on board to stop for more.
			elevator.goingDownIndicator(false);
			elevator.goingUpIndicator(false);
		} else {
			if (!nextFloor) {
				elevator.goingDownIndicator(true);
				elevator.goingUpIndicator(true);
			} else if (nextFloor > currentFloor) {
				elevator.goingDownIndicator(false);
				elevator.goingUpIndicator(true);
			} else {
				elevator.goingDownIndicator(true);
				elevator.goingUpIndicator(false);
			}
		}
	}
	
	// Set up the elevators' event listeners
	for (var i = 0; i < elevators.length; i++) {
            	var thisElevator = elevators[i];
            
		thisElevator.on("idle", function() {
			elevatorIsIdle(this);
            	});
		
		thisElevator.on("stopped_at_floor", function(floorNum) {
			elevatorDirection(this);
		});
		
		thisElevator.on("floor_button_pressed", function(floorNum) {
			// Add floor to destination queue, if not already there.
			if (this.destinationQueue.indexOf(floorNum) < 0) {
				this.goToFloor(floorNum);
			}
			
			// I found weird behaviour with floor 0. Sometimes an elevator would wait there until it was full
			// Turns out floor 0 was making its way to the front of the elevator's destination queue.
			var nextFloor = this.destinationQueue[0];
			var currentFloor = this.currentFloor();
			if (nextFloor == currentFloor) {
				if (floors.length > 4) {
					this.destinationQueue.splice(0, 1);
				}
			}
			
			elevatorDirection(this);
            	});
		
		thisElevator.on("passing_floor", function(floorNum, direction) {
			var queue = this.destinationQueue;
			var stopping = false;
			
			// Check if the passing floor is part of the destination queue
			for (var j = 0; j < queue.length; j++) {
				var thisQueue = queue[j];
				if (thisQueue == floorNum) {
					queue.splice(j, 1);
					stopping = true;
				}
			}
			
			// Check if passing floor has people waiting to go the same direction of the elevator
			// Only do this in later levels with 10 or more floors
			if (floors.length >= 10 && this.loadFactor() < 0.6) {
				var floor = floors[floorNum];
				if (direction === "up" && floor.buttonStates.up === "activated") {
					stopping = true;
				}
				if (direction === "down" && floor.buttonStates.down === "activated") {
					stopping = true;
				}
			}
			
			if (stopping) {
				// Make immediate stop at the passing floor
				this.goToFloor(floorNum, true);
			}
		});
        }
	
	for (var j = 0; j < floors.length; j++) {
		var thisFloor = floors[j];
		
		// This event is not in the documentation, I found this little secret in the source code
   		thisFloor.on("buttonstate_change", function() {
			floorButtonStateChange(this);
		})
	}
    },
    update: function(dt, elevators, floors) {
        // We normally don't need to do anything here
    }
}












