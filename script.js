let formDiv = document.querySelector("#inputForm");
let backBtnDiv = document.querySelector("#backBtnDiv");
let backBtn = document.querySelector("#backBtn");

backBtn.addEventListener("click", () => {
  backBtnDiv.style.display = "none";
  formDiv.style.display = "block";
  renderBuilding(0, 0);
});

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

let screenWidth = window.innerWidth;
let screenHeight = window.innerHeight;

window.addEventListener("load", () => {
  if (screenWidth < 220) {
    alert(
      "Screen size is too small. Lift simulation wouldn't work on this device."
    );
  }
});

let maxFloors;
let maxLifts;
let form = document.querySelector("form");
form.addEventListener("submit", generateUI);

function calculateMaxInputValues() {
  screenWidth = window.innerWidth;
  screenHeight = window.innerHeight;
  maxLifts = parseInt(screenWidth / 100);
  if (screenWidth < 500 && screenWidth >= 300) {
    maxLifts = 2;
  } else if (screenWidth < 330) {
    maxLifts = 1;
  }

  let numFloorsInput = document.querySelector("#num_floors");
  let numLiftsInput = document.querySelector("#num_lifts");
  
  // Add placeholders
  numFloorsInput.placeholder = "Enter number of floors";
  numLiftsInput.placeholder = `Max ${maxLifts} lifts`;
  
  numLiftsInput.max = maxLifts;
}

window.addEventListener("resize", calculateMaxInputValues);
window.addEventListener("load", calculateMaxInputValues);

function validateInput(numFloors, numLifts) {
  if (isNaN(numLifts) || isNaN(numFloors)) {
    alert(`Input fields can not be empty`);
    return false;
  } else if (numFloors <= 0 || numLifts <= 0) {
    alert("Number of Floors and Number of lifts must be a positive integer,");
    return false;
  } else if (numLifts > maxLifts) {
    alert(`Please enter number of lifts less than or equal to ${maxLifts}.`);
    return false;
  } else if (numLifts > numFloors) {
    alert(
      `Please enter number of lifts less than or equal to number of floors.`
    );
    return false;
  }
  return true;
}

function handleButtonClick(event) {
  floorId = getNumFromIdString(event.id);
  if (
    !pendingRequests.includes(floorId) &&
    !servingRequests.includes(floorId)
  ) {
    pendingRequests.push(floorId);
  }
}

function getNearestAvailableLift(floorId) {
  let nearestLiftDistance = 999;
  let nearestLift = null;
  for (let i = 0; i < lifts.length; i++) {
    if (lifts[i].isBusy) {
      continue;
    }
    const liftDistance = Math.abs(floorId - lifts[i].currFloor);
    if (liftDistance < nearestLiftDistance) {
      nearestLiftDistance = liftDistance;
      nearestLift = lifts[i];
    }
  }

  return nearestLift;
}

function moveLift(liftId, floorId) {
  pendingRequests.shift();
  servingRequests[liftId - 1] = floorId;
  const lift = lifts[liftId - 1];
  lifts[liftId - 1].isBusy = true;

  const y = (floorId - 1) * liftHeight * -1;

  // Change lift speed to 2 seconds per floor
  const x = Math.abs(floorId - lift.currFloor) * 2;

  lift.htmlEl.style.transform = `translateY(${y}px)`;
  lift.htmlEl.style.transition = `${x}s linear`;

  openCloseLift(liftId, x * 1000);
  setTimeout(() => {
    lifts[liftId - 1].currFloor = floorId;
    lifts[liftId - 1].isBusy = false;
  }, x * 1000 + 5000);
}

function openCloseLift(liftId, duration) {
  setTimeout(() => {
    openLift(liftId);
  }, duration);
  setTimeout(() => {
    closeLift(liftId);
  }, duration + 2500);
  setTimeout(() => {
    servingRequests[liftId - 1] = null;
  }, duration + 5000);
}

function openLift(liftId) {
  lifts[liftId - 1].htmlEl
    .querySelector(`#left-door${liftId}`)
    .classList.remove(`left-door-close`);
  lifts[liftId - 1].htmlEl
    .querySelector(`#right-door${liftId}`)
    .classList.remove(`right-door-close`);
  lifts[liftId - 1].htmlEl
    .querySelector(`#left-door${liftId}`)
    .classList.add(`left-door-open`);
  lifts[liftId - 1].htmlEl
    .querySelector(`#right-door${liftId}`)
    .classList.add(`right-door-open`);
}

function closeLift(liftId) {
  lifts[liftId - 1].htmlEl
    .querySelector(`#left-door${liftId}`)
    .classList.remove(`left-door-open`);
  lifts[liftId - 1].htmlEl
    .querySelector(`#right-door${liftId}`)
    .classList.remove(`right-door-open`);
  lifts[liftId - 1].htmlEl
    .querySelector(`#left-door${liftId}`)
    .classList.add(`left-door-close`);
  lifts[liftId - 1].htmlEl
    .querySelector(`#right-door${liftId}`)
    .classList.add(`right-door-close`);
}

function liftController() {
  if (pendingRequests.length > 0) {
    const nearestLift = getNearestAvailableLift(pendingRequests[0]);
    if (nearestLift) {
      liftId = getNumFromIdString(nearestLift.htmlEl.id);
      moveLift(liftId, pendingRequests[0]);
    }
  }
}

function renderBuilding(no_of_floors, no_of_lifts) {
  let building = document.querySelector("#building");
  building.innerHTML = "";
  for (let i = no_of_floors; i >= 1; i--) {
    let floor = document.createElement("div");
    floor.classList.add("floor");
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
  }));

  const liftHeight = 90.8; // units in px
  pendingRequests = [];
  servingRequests = Array(lifts.length).fill(null);
}

let lifts = [];

const liftHeight = 90.8; // units in px
let pendingRequests = [];
let servingRequests = [];

setInterval(liftController, 50);

function getNumFromIdString(string) {
  const regex = /\d+/;
  const match = regex.exec(string);
  return match ? parseInt(match[0], 10) : null;
}

