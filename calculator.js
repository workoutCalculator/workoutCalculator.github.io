import { timePerRep } from './timePerRep.js';

// constants
const beginnerAthlete = 2;
const averageAthlete = 1.25;
const strongerAthlete = 0.87;
const strongErg = 0.95;
const averageErg = 1.15;
const beginnerErg = 1.5;

// global variables
var athleteMutliplier = {
    strong: 1,
    average: 1,
    beginner: 1
};

// text constants
const notes = `Cardio machine and ERG machines are assumed to be in meters unless specified with <strong>cals</strong> in the movement name. See example above. Please include weight in <strong>kg</strong>. <strong style="color: pink;">Please do not use '-' in movements, this can only be used for rep ladders (e.g. '21-15-9).</strong> See example below:
<ul>
    <li>21-15-9</li>
    <li>pull ups</li>
    <li>40kg thrusters</li>
</ul>`;

document.getElementById('workout-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const type = document.getElementById('type').value;
    const rounds = document.getElementById('rounds').value || 1;
    const timeCap = document.getElementById('time-cap').value || 15;
    const rawMovements = document.getElementById('movements').value.trim().split('\n');
    const teamSize = document.getElementById('teamInput').value || 1;
    const teamType = document.querySelector('input[name="workoutType"]:checked').value;

    let totalTime = 0;
    var restMultiplier = 1.1;       // changes depending on rest time
    athleteMutliplier.strong = strongerAthlete;
    athleteMutliplier.beginner = beginnerAthlete;
    athleteMutliplier.average = averageAthlete;
    var timeIntervals = [];         // set default value to 0 min
    var timeIntervalTotals = [[]];  // array to store time intervals for time based workouts
    let workoutSegments = [];       // array to store workout segments for teamTime workouts
    var ladderParts = [];           // array to store ladder parts for ladder workouts, if exists

    if (teamSize > 1 && teamType === 'team') {
        teamMultiplier = 0.85 + 0.15*(1 / teamSize);
    }

    console.log('rawMovements', document.getElementById('movements').value.trim().split('\n'));
    for (let line of rawMovements) {

        if (line.split(',').map(s => s.trim()).length < 2 && ladderParts.length === 0) {
            // check if is timer
            if (teamType === "teamTime" && line.includes('@')) {
                // this is a time indicator
                // always assume set in min
                line.replace(/@/g, '');
                line.replace(/min/g, '');
                line.replace(/s/g, ''); // if put 'mins'

                // extract time
                timeIntervals.push(parseFloat(line.split('@')[1].trim()));
                timeIntervalTotals.push([]);
            }
            if (line.includes('-')) {
                // must be a ladder workout
                ladderParts = line.split('-').map(s => s.trim());
            }

            // if line does not contain a comma, skip it
            console.log('skipping line', line);
            continue;
        }
        // check ladder workout or not
        // if so, find correct reps for each part
        var [repsStr, movement] = [];
        if (ladderParts.length !== 0) {
            /* Must perform alternate time calc based on ladder structure */
            for (let i = 0; i < ladderParts.length; i++) {
                for (let j = 1; j < rawMovements.length; j++) {
                    var tempTime = 0;
                    [tempTime, restMultiplier] = findTotalTime(ladderParts[i], rawMovements[j].trim(),teamType, workoutSegments, timeIntervals, timeIntervalTotals);
                    totalTime += tempTime;
                }
            }
            break;
        } else {
            [repsStr, movement] = line.split(',').map(s => s.trim());
        }

        [tempTime, restMultiplier] = findTotalTime(repsStr, movement, teamType, workoutSegments, timeIntervals, timeIntervalTotals);
        totalTime += tempTime;
    }
        
    if (teamType === 'teamTime') {
        timeIntervalTotals.shift();
    }

    if (type !== 'emom' && type !== 'amrap') {
        totalTime *= rounds;
    }

    if (teamType === 'teamTime') {
        totalTime = estimateWorkoutTime({workoutSegments, timePerRep, teamSize});
    }
    // add slight rest
    totalTime *= restMultiplier;
    console.log('totalTime', totalTime);

    let message = '';
    let athelete = 'athlete';
    if (teamType === 'teamTime') {
        athelete = 'athletes';
    }

    // case for amrap, must determine the rounds done
    if (type === 'amrap') {
        const timePerRound = totalTime;
        const totalRounds = Math.round((timeCap * 60 / timePerRound) * 10) / 10;
        if (totalRounds < 1) {
            message = `You will not complete a single round in ${timeCap} minutes.`;
        } else {
            message = `Estimated rounds in ${timeCap} minutes:
            Strong ${athelete}: ${Math.round(totalRounds / athleteMutliplier.strong * 10) / 10} rounds
            Good ${athelete}: ${totalRounds} rounds
            Average ${athelete}: ${Math.round(totalRounds / athleteMutliplier.average * 10) / 10} rounds
            Beginner ${athelete}: ${Math.round(totalRounds / athleteMutliplier.beginner * 10) / 10} rounds`;
    }
        document.getElementById('results').innerText = message;
        return;
    }

    switch (type) {
        case 'for-time':
        message = `Estimated durations:
        Strong ${athelete}: ${Math.floor(totalTime * athleteMutliplier.strong / 60)} minutes ${Math.floor((totalTime * athleteMutliplier.strong) % 60)} seconds
        Good ${athelete}: ${Math.floor(totalTime / 60)} minutes ${Math.floor((totalTime) % 60)} seconds
        Average ${athelete}: ${Math.floor(totalTime * athleteMutliplier.average / 60)} minutes ${Math.floor((totalTime * athleteMutliplier.average) % 60)} seconds
        Beginner ${athelete}: ${Math.floor(totalTime * athleteMutliplier.beginner / 60)} minutes ${Math.floor((totalTime * athleteMutliplier.beginner) % 60)} seconds`;
        break;
        case 'emom':
        message = `Estimated round time: 
        Strong ${athelete}: ${Math.floor(totalTime / 60 * athleteMutliplier.strong)} minutes and ${Math.ceil((totalTime * athleteMutliplier.strong) % 60)} seconds
        Good ${athelete}: ${Math.floor(totalTime / 60)} minutes and ${Math.ceil((totalTime) % 60)} seconds
        Average ${athelete}: ${Math.floor(totalTime / 60 * athleteMutliplier.average)} minutes and ${Math.ceil((totalTime * athleteMutliplier.average) % 60)} seconds
        Beginner ${athelete}: ${Math.floor(totalTime / 60 * athleteMutliplier.beginner)} minutes and ${Math.ceil((totalTime * athleteMutliplier.beginner) % 60)} seconds`;
        break;
        case 'time-cap':
        message = totalTime / 60 > timeCap
            ? `You may hit the time cap before finishing. Est. duration: ${Math.ceil(totalTime / 60)} mins`
            : `You should complete this in about ${Math.ceil(totalTime / 60)} minutes.`;
        break;
    }

    document.getElementById('results').innerText = message;
});

document.getElementById('type').addEventListener('change', function () {
    updatePage();
});
document.querySelectorAll('input[name="workoutType"]').forEach((input) => {
    input.addEventListener('change', (e) => {
        updatePage();
    })
});

function updatePage() {

    const type = document.getElementById('type').value;
    const typ = document.getElementById('type');
    const typeLabel = document.getElementById('typeLabel');
    const rounds = document.getElementById('rounds');
    const roundsLabel = document.getElementById('roundsLabel');
    const timeCap = document.getElementById('time-cap');
    const timeCapLabel = document.getElementById('timeCapLabel');
    const team = document.getElementById('teamInput');
    const teamLabel = document.getElementById('teamLabel');
    const individualExample = document.getElementById('individualExample');
    const teamExample = document.getElementById('teamExample');
    const teamTimeExample = document.getElementById('teamTimeExample');
    
    // set notes
    document.querySelectorAll('.notes').forEach(p => {
    p.innerHTML = notes;});

    // Hide all elements by default
    rounds.classList.add('hidden');
    roundsLabel.classList.add('hidden');
    timeCap.classList.add('hidden');
    timeCapLabel.classList.add('hidden');
    team.classList.add('hidden');
    teamLabel.classList.add('hidden');
    individualExample.classList.add('hidden');
    teamExample.classList.add('hidden');
    teamTimeExample.classList.add('hidden');
    typ.classList.add('hidden');
    typeLabel.classList.add('hidden');

    document.querySelectorAll('input[name="workoutType"]').forEach((input) => {
        if (input.checked) {
            if (input.value === 'team') {
                team.classList.remove('hidden');
                teamLabel.classList.remove('hidden');
                individualExample.classList.add('hidden');
                teamExample.classList.remove('hidden');
                teamTimeExample.classList.add('hidden');

                timeCap.classList.add('hidden');
                timeCapLabel.classList.add('hidden');
                rounds.classList.remove('hidden');
                roundsLabel.classList.remove('hidden');
                typ.classList.add('hidden');
                typeLabel.classList.add('hidden');

                if (type === 'amrap') {
                    timeCap.classList.remove('hidden');
                    timeCapLabel.classList.remove('hidden');
                    rounds.classList.add('hidden');
                    roundsLabel.classList.add('hidden');
                } else if (type === 'for-time') {
                    timeCap.classList.add('hidden');
                    timeCapLabel.classList.add('hidden');
                    rounds.classList.remove('hidden');
                    roundsLabel.classList.remove('hidden');
                } else if (type === 'emom') {
                    timeCap.classList.remove('hidden');
                    timeCapLabel.classList.remove('hidden');
                    rounds.classList.add('hidden');
                    roundsLabel.classList.add('hidden');
                }

            }
            else if (input.value === 'teamTime') {
                team.classList.remove('hidden');
                teamLabel.classList.remove('hidden');
                teamTimeExample.classList.remove('hidden');
                teamExample.classList.add('hidden');
                individualExample.classList.add('hidden');
                rounds.classList.add('hidden');
                roundsLabel.classList.add('hidden');

                timeCap.classList.add('hidden');
                timeCapLabel.classList.add('hidden');
                rounds.classList.add('hidden');
                roundsLabel.classList.add('hidden');
                typ.classList.add('hidden');
                typeLabel.classList.add('hidden');
            }
            else {
                team.classList.add('hidden');
                teamLabel.classList.add('hidden');
                individualExample.classList.remove('hidden');
                teamExample.classList.add('hidden');
                teamTimeExample.classList.add('hidden');
                rounds.classList.remove('hidden');
                roundsLabel.classList.remove('hidden');

                typ.classList.remove('hidden');
                typeLabel.classList.remove('hidden');

                if (type === 'amrap') {
                    timeCap.classList.remove('hidden');
                    timeCapLabel.classList.remove('hidden');
                    rounds.classList.add('hidden');
                    roundsLabel.classList.add('hidden');
                } else if (type === 'for-time') {
                    timeCap.classList.add('hidden');
                    timeCapLabel.classList.add('hidden');
                    rounds.classList.remove('hidden');
                    roundsLabel.classList.remove('hidden');
                } else if (type === 'emom') {
                    timeCap.classList.remove('hidden');
                    timeCapLabel.classList.remove('hidden');
                    rounds.classList.add('hidden');
                    roundsLabel.classList.add('hidden');
                }
            }
        }
    });
}

function extractWeight(input) {
    const match = input.match(/(\d+(\.\d+)?)\s*kg/i);
    return match ? parseFloat(match[1]) : null;
}

document.addEventListener("DOMContentLoaded", function() {
    // Your code here
    updatePage();
});

function estimateWorkoutTime({ workoutSegments, timePerRep, teamSize, swapInterval = 60 }) {
    // Bonus function: reduce time per meter slightly for each resting person
    const impactOfResting = 0.04; // 4% pace improvement per resting teammate
    
    function getPaceMultiplier(activeCount, teamSize) {
        const resting = teamSize - activeCount;
        return 1 - impactOfResting * resting; // ~2% pace improvement per resting teammate
    }

    let timeline = []; // list of active tasks
    let currentTime = 0;
    let nextCheckpoint = 0;

    while (workoutSegments.length > 0 || timeline.length > 0) {
        // Add new segments starting now
        while (workoutSegments.length && workoutSegments[0].startTime <= currentTime) {
            const { startTime, type, distance } = workoutSegments.shift();
            timeline.push({
                type,
                remaining: distance,
                startTime
            });
        }

        if (timeline.length === 0) {
            // Nothing to do, skip to next startTime
            currentTime = workoutSegments[0].startTime;
            continue;
        }

        // Limit number of ergs being actively worked on by team members
        const peopleAvailable = Math.min(teamSize, timeline.length);
        const paceMultiplier = getPaceMultiplier(peopleAvailable, teamSize);

        // Sort tasks by remaining distance or use round-robin logic if preferred
        let activeTasks = timeline.slice(0, peopleAvailable); // basic selection
        let inactiveTasks = timeline.slice(peopleAvailable);

        // Calculate work done on active tasks
        // Total work done in this interval
        const timeStep = swapInterval; // 60s per round
        for (let task of activeTasks) {
            // work done by one person for this erg
            var tpm = 1;
            for (const key in timePerRep) {
                if (timePerRep[key][task.type] || timePerRep[key][task.type.slice(0, -1)]) {
                    tpm = timePerRep[key][task.type] * paceMultiplier;
                    break;
                }
            }
            const metersDone = timeStep / tpm;
            task.remaining = Math.max(0, task.remaining - metersDone);
        }
        // Inactive tasks make no progress

        // Combine tasks back
        timeline = activeTasks.concat(inactiveTasks).filter(task => task.remaining > 0);

        currentTime += timeStep;
    }

    return currentTime;
}

// Form submission Handler
document.getElementById('feedback-form').addEventListener('submit', async function (e) {
  e.preventDefault(); // Prevent default form submission

  const form = e.target;
  const data = new FormData(form);

  try {
    const response = await fetch(form.action, {
      method: form.method,
      body: data,
      headers: {
        'Accept': 'application/json'
      }
    });

    const resultDiv = document.getElementById('feedbackResult');
    if (response.ok) {
      resultDiv.textContent = "Thank you for your feedback!";
      form.reset();
    } else {
      resultDiv.textContent = "There was an issue submitting your feedback. Please try again.";
    }
  } catch (error) {
    document.getElementById('feedbackResult').textContent = "Network error. Please try again.";
  }
});

function findTotalTime(repsStr, movement, teamType, workoutSegments = [], timeIntervals = [], timeIntervalTotals = [[]]) {

    // Initialize variables
    var isBodyweight = false;
    var isWeighted = false;
    var isGymnastics = false;
    var isCore = false;
    var isMisc = false;
    var isErg = false;

    var restMultiplier = 1.1;        // changes depending on rest time
    var teamMultiplier = 1;         // changes depending on chipper team size
    var reps = 0;
    var time = 1;                   // set default value to 1 second
    let totalTime = 0;
    var weightMultiplier = 1;       // changes depending on weight of movement

    // if string contains 'km', replace it with '' and mulitply reps by 1000
    if (repsStr.includes('km')) {
        repsStr = repsStr.replace(/km/g, '');
        reps = parseInt(repsStr);
        reps *= 1000;
    } else {
        repsStr = repsStr.replace(/m/g, '');
        reps = parseInt(repsStr);
    }
    movement = movement.toLowerCase();
    // also replace all instances of '-' with ' ' in the movement name
    movement = movement.replace(/-/g, ' ');

    // extract weight from movenment if exists
    const weight = extractWeight(movement) || null;
    // remove weight from movement name
    if (weight) {
        movement = movement.replace(/(\d+(\.\d+)?)\s*kg/i, '').trim();
    }

    // loop through timePerRep and check if movement exists
    for (const key in timePerRep) {

        console.log('key', key);
        const value = timePerRep[key];
        // check if value is an object
        if (timePerRep[key][movement] || timePerRep[key][movement.slice(0, -1)]) {
            // if movement exists, break out of loop
            if (timePerRep[key][movement]) {
                time = timePerRep[key][movement];
            } else {
                // if movement ends with 's', remove it
                time = timePerRep[key][movement.slice(0, -1)];
            }
            if (key === 'weighted') {
                // multiplier is determined by weight
                weightMultiplier = calculateWeightMultiplier(weight);
            } else {
                weightMultiplier = 1;
            }

            switch (key) {
                case 'bodyweight':
                    isBodyweight = true;
                    break;
                case 'weighted':
                    isWeighted = true;
                    break;
                case 'gymnastics':
                    isGymnastics = true;
                    break;
                case 'core':
                    isCore = true;
                    break;
                case 'misc':
                    isMisc = true;
                    break;
                case 'erg':
                    isErg = true;
                    break;
            }
            break;
        } else {
            time = 1;
        }
    }

    if (isErg && !isBodyweight && !isWeighted && !isGymnastics && !isCore && !isMisc) {
        // if erg and noting else, set multiplier to 1
        var sprintFactor = 1;
        if (reps <= 500) {
            sprintFactor = 0.95;
            restMultiplier = 1;
        } else if (reps > 500 && reps < 1000) {
            sprintFactor = 1;
            restMultiplier = 1;
        } else {
            sprintFactor = 1.05;
        }
        time *= sprintFactor;
        athleteMutliplier.strong = strongErg;
        athleteMutliplier.average = averageErg;
        athleteMutliplier.beginner = beginnerErg;
    }

    if (teamType === 'teamTime') {
        // also if no time interval is set, then default to previous time interval, if none, then default to 0min
        if (timeIntervals.length === 0) {
            timeIntervals.push(0);
        }
        // need to append to time in intervals array
        timeIntervalTotals[timeIntervalTotals.length - 1].push(reps * weightMultiplier * time);
        workoutSegments.push({
            startTime: timeIntervals[timeIntervals.length - 1],
            type: movement,
            distance: reps
        });
    }
    else {
        totalTime = reps * weightMultiplier * teamMultiplier * time;
    }
    
    return [totalTime, restMultiplier];
}

function calculateWeightMultiplier(weight) {
    var base = 1; 

    function sigmoid(x, midpoint, steepness) {
        return 1 / (1 + Math.exp(-steepness * (x - midpoint)));
    }

    if (weight < 45) {
        return 1;
    } else if (weight <= 70) {
        // Sigmoid from 1 to 1.5
        base = sigmoid(weight, 57.5, 0.3); // Midpoint = (45 + 70) / 2
        return 1 + (0.6 * base); // Scales from 1 to ~1.5
    } else {
        // Sigmoid from 1.5 to 2
        base = sigmoid(weight, 85, 0.8); // Midpoint = shifted to fit upper range
        return 1.6 + (1 * base); // Scales from 1.5 to ~2
    }
}