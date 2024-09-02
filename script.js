// DOM elements
let formDiv = document.querySelector("#inputForm");
let backBtnDiv = document.querySelector("#backBtnDiv");
let backBtn = document.querySelector("#backBtn");

// Event listener for back button
backBtn.addEventListener("click", () => {
  backBtnDiv.style.display = "none";
  formDiv.style.display = "block";
  renderBuilding(0, 0);
});

// Generate UI based on user input
function generateUI(event) {
  event.preventDefault();
  let numFloorsInput = document.querySelector("#num_floors");
  let numLiftsInput = document.querySelector("#num_lifts");
  let numFloors = parseInt(numFloorsInput.value);
  let numLifts = parseInt(numLiftsInput.value);
  if (validateInput(numFloors, numLifts)) {
    formDiv.style.display = "none";
    backBtnDiv.style.display = "block";
    renderBuilding(numFloors, numLifts);
  }
}

// Screen size check
let screenWidth = window.innerWidth;
let screenHeight = window.innerHeight;

window.addEventListener("load", () => {
  if (screenWidth < 220) {
    alert("Screen size is too small. Lift simulation wouldn't work on this device.");
  }
});

// Form submission event listener
let form = document.querySelector("form");
form.addEventListener("submit", generateUI);

// Calculate and set max input values
function calculateMaxInputValues() {
  let numFloorsInput = document.querySelector("#num_floors");
  let numLiftsInput = document.querySelector("#num_lifts");

  numFloorsInput.placeholder = "Enter number of floors";
  numLiftsInput.placeholder = "Enter number of lifts";
}

window.addEventListener("resize", calculateMaxInputValues);
window.addEventListener("load", calculateMaxInputValues);

// Validate user input
function validateInput(numFloors, numLifts) {
  if (isNaN(numLifts) || isNaN(numFloors)) {
    alert("Input fields cannot be empty");
    return false;
  } else if (numFloors <= 0 || numLifts <= 0) {
    alert("Number of floors and number of lifts must be a positive integer");
    return false;
  }
  return true;
}

// Handle lift button click
function handleButtonClick(event) {
  let floorId = getNumFromIdString(event.id);
  let direction = event.id.includes("up") ? "up" : "down";
  let request = { floor: floorId, direction: direction };
  
  if (!pendingRequests.some(req => req.floor === floorId && req.direction === direction) &&
      !servingRequests.some(req => req && req.floor === floorId && req.direction === direction)) {
    pendingRequests.push(request);
    event.target.classList.add('active-' + direction);
  }
}

// Find the nearest available lift
function getNearestAvailableLift(request) {
  let nearestLiftDistance = 999;
  let nearestLift = null;
  for (let i = 0; i < lifts.length; i++) {
    let lift = lifts[i];
    if (lift.isBusy) {
      // Check if the busy lift is moving in the same direction and can stop at the requested floor
      if (canStopAtFloor(lift, request)) {
        return lift;
      }
      continue;
    }
    const liftDistance = Math.abs(request.floor - lift.currFloor);
    if (liftDistance < nearestLiftDistance) {
      nearestLiftDistance = liftDistance;
      nearestLift = lift;
    }
  }

  return nearestLift;
}

// Check if a busy lift can stop at the requested floor
function canStopAtFloor(lift, request) {
  let liftRequest = servingRequests[lift.htmlEl.id.slice(4) - 1];
  if (!liftRequest) return false;

  if (request.direction === 'up') {
    return liftRequest.direction === 'up' && 
           request.floor > lift.currFloor && 
           request.floor < liftRequest.floor;
  } else {
    return liftRequest.direction === 'down' && 
           request.floor < lift.currFloor && 
           request.floor > liftRequest.floor;
  }
}

// Move the lift
function moveLift(liftId, request) {
  pendingRequests = pendingRequests.filter(req => !(req.floor === request.floor && req.direction === request.direction));
  const lift = lifts[liftId - 1];
  
  if (!lift.isBusy) {
    servingRequests[liftId - 1] = request;
    lift.isBusy = true;
  } else {
    // Add intermediate stop
    lift.intermediateStops.push(request);
    lift.intermediateStops.sort((a, b) => request.direction === 'up' ? a.floor - b.floor : b.floor - a.floor);
  }

  const moveToFloor = (floor) => {
    const y = (floor - 1) * liftHeight * -1;
    const x = Math.abs(floor - lift.currFloor) * 2;

    lift.htmlEl.style.transform = `translateY(${y}px)`;
    lift.htmlEl.style.transition = `${x}s linear`;

    openCloseLift(liftId, x * 1000);
    setTimeout(() => {
      lift.currFloor = floor;
      // Remove active class from button
      let btn = document.querySelector(`#${request.direction}Btn${floor}`);
      if (btn) btn.classList.remove('active-' + request.direction);

      if (lift.intermediateStops.length > 0) {
        let nextStop = lift.intermediateStops.shift();
        moveToFloor(nextStop.floor);
      } else {
        lift.isBusy = false;
        servingRequests[liftId - 1] = null;
      }
    }, x * 1000 + 5000);
  };

  moveToFloor(request.floor);
}

// Open and close lift doors
function openCloseLift(liftId, duration) {
  setTimeout(() => {
    openLift(liftId);
  }, duration);
  setTimeout(() => {
    closeLift(liftId);
  }, duration + 2500);
}

// Open lift doors
function openLift(liftId) {
  lifts[liftId - 1].htmlEl.querySelector(`#left-door${liftId}`).classList.remove(`left-door-close`);
  lifts[liftId - 1].htmlEl.querySelector(`#right-door${liftId}`).classList.remove(`right-door-close`);
  lifts[liftId - 1].htmlEl.querySelector(`#left-door${liftId}`).classList.add(`left-door-open`);
  lifts[liftId - 1].htmlEl.querySelector(`#right-door${liftId}`).classList.add(`right-door-open`);
}

// Close lift doors
function closeLift(liftId) {
  lifts[liftId - 1].htmlEl.querySelector(`#left-door${liftId}`).classList.remove(`left-door-open`);
  lifts[liftId - 1].htmlEl.querySelector(`#right-door${liftId}`).classList.remove(`right-door-open`);
  lifts[liftId - 1].htmlEl.querySelector(`#left-door${liftId}`).classList.add(`left-door-close`);
  lifts[liftId - 1].htmlEl.querySelector(`#right-door${liftId}`).classList.add(`right-door-close`);
}

// Lift controller
function liftController() {
  if (pendingRequests.length > 0) {
    for (let request of pendingRequests) {
      const nearestLift = getNearestAvailableLift(request);
      if (nearestLift) {
        let liftId = getNumFromIdString(nearestLift.htmlEl.id);
        moveLift(liftId, request);
        break; // Move one lift at a time
      }
    }
  }
}

// Render the building
function renderBuilding(no_of_floors, no_of_lifts) {
  let building = document.querySelector("#building");
  building.innerHTML = "";
  
  for (let i = no_of_floors; i >= 1; i--) {
    let floor = document.createElement("div");
    floor.classList.add("floor");
    
    const floorWidth = 100 + (no_of_lifts * 100);
    floor.style.width = `${floorWidth}px`;

    let liftLabels = document.createElement("div");
    liftLabels.classList.add("lift-labels");
    
    let floorLabel = document.createElement("span");
    floorLabel.textContent = "Floor " + i;
    liftLabels.appendChild(floorLabel);
    
    let buttonsContainer = document.createElement("div");
    buttonsContainer.classList.add("buttons-container");
    
    if (i !== no_of_floors) {
      let upBtn = document.createElement("button");
      upBtn.id = "upBtn" + i;
      upBtn.classList.add("upBtn");
      upBtn.onclick = () => handleButtonClick(upBtn);
      upBtn.innerHTML = "↑";
      buttonsContainer.appendChild(upBtn);
    }
    
    if (i !== 1) {
      let downBtn = document.createElement("button");
      downBtn.id = "downBtn" + i;
      downBtn.classList.add("downBtn");
      downBtn.onclick = () => handleButtonClick(downBtn);
      downBtn.innerHTML = "↓";
      buttonsContainer.appendChild(downBtn);
    }
    
    liftLabels.appendChild(buttonsContainer);
    floor.appendChild(liftLabels);
    
    if (i === 1) {
      for (let j = 1; j <= no_of_lifts; j++) {
        let lift = document.createElement("div");
        lift.id = "lift" + j;
        lift.classList.add("lift");
        
        let leftDoor = document.createElement("div");
        leftDoor.id = "left-door" + j;
        leftDoor.classList.add("left-door");
        
        let rightDoor = document.createElement("div");
        rightDoor.id = "right-door" + j;
        rightDoor.classList.add("right-door");
        
        lift.appendChild(leftDoor);
        lift.appendChild(rightDoor);
        floor.appendChild(lift);
      }
    }
    
    building.appendChild(floor);
  }

  lifts = Array.from(document.querySelectorAll(".lift"), (el) => ({
    htmlEl: el,
    isBusy: false,
    currFloor: 1,
    intermediateStops: []
  }));

  pendingRequests = [];
  servingRequests = Array(lifts.length).fill(null);
}

// Global variables
let lifts = [];
const liftHeight = 90.8; // units in px
let pendingRequests = [];
let servingRequests = [];

// Start the lift controller
setInterval(liftController, 50);

// Helper function to extract number from ID string
function getNumFromIdString(string) {
  const regex = /\d+/;
  const match = regex.exec(string);
  return match ? parseInt(match[0], 10) : null;
}

// Add this CSS to your stylesheet
/*
.upBtn.active-up, .downBtn.active-down {
  background-color: #ff0000;
}
*/