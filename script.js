document.getElementById('generate').addEventListener('click', generateBuilding);

let liftState = [];

function generateBuilding() {
    const floorsCount = parseInt(document.getElementById('floors').value);
    const liftsCount = parseInt(document.getElementById('lifts').value);
    
    const building = document.getElementById('building');
    building.innerHTML = ''; 

    liftState = Array(liftsCount).fill(1); 

    for (let i = 1; i <= floorsCount; i++) {
        const floor = document.createElement('div');
        floor.className = 'floor';
        floor.dataset.floor = i;

        const floorButtons = document.createElement('div');
        floorButtons.className = 'floor-buttons';

        if (i !== floorsCount) {
            const upButton = document.createElement('button');
            upButton.className = 'up';
            upButton.innerText = 'Up';
            upButton.onclick = () => requestLift(i);
            floorButtons.appendChild(upButton);
        }

        if (i !== 1) {
            const downButton = document.createElement('button');
            downButton.className = 'down';
            downButton.innerText = 'Down';
            downButton.onclick = () => requestLift(i);
            floorButtons.appendChild(downButton);
        }

        floor.appendChild(floorButtons);

        building.appendChild(floor);
    }

    for (let i = 0; i < liftsCount; i++) {
        const lift = document.createElement('div');
        lift.className = 'lift';
        lift.dataset.lift = i;
        lift.style.transform = `translateY(0px)`;
        lift.style.left = `${(i * 70) + 100}px`;
        building.firstChild.appendChild(lift); 
    }
}

function requestLift(floor) {
    const lifts = document.querySelectorAll('.lift');
    const targetY = -(floor - 1) * 110; 
    let closestLift = null;
    let minDistance = Infinity;

    lifts.forEach(lift => {
        const liftIndex = parseInt(lift.dataset.lift);
        const currentFloor = liftState[liftIndex];
        const distance = Math.abs(currentFloor - floor);

        if (distance < minDistance) {
            closestLift = lift;
            minDistance = distance;
        }
    });

    if (closestLift) {
        const liftIndex = parseInt(closestLift.dataset.lift);
        moveLift(closestLift, liftIndex, floor, targetY);
    }
}

function moveLift(lift, liftIndex, targetFloor, targetY) {
    lift.style.transform = `translateY(${targetY}px)`;
    liftState[liftIndex] = targetFloor;

    lift.addEventListener('transitionend', () => {
        lift.classList.add('door-open');

        setTimeout(() => {
            lift.classList.remove('door-open');
        }, 2500); 
    }, { once: true });
}

generateBuilding();


