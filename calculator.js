import { timePerRep } from './timePerRep.js';

// constans
const averageAthlete = 1.25;
const strongerAthlete = 0.8;
const strongErg = 0.95;
const averageErg = 1.15;

document.getElementById('workout-form').addEventListener('submit', function (e) {
    e.preventDefault();

    var isBodyweight = false;
    var isWeighted = false;
    var isGymnastics = false;
    var isCore = false;
    var isMisc = false;
    var isErg = false;

    const type = document.getElementById('type').value;
    const rounds = document.getElementById('rounds').value || 1;
    const timeCap = document.getElementById('time-cap');
    const roundsVal = parseInt(document.getElementById('rounds').value);
    const timeCapVal = parseFloat(document.getElementById('time-cap').value) || null;
    const rawMovements = document.getElementById('movements').value.trim().split('\n');
    const teamSize = document.getElementById('teamInput').value || 1;
    const teamType = document.querySelector('input[name="workoutType"]:checked').value;

    let totalTime = 0;
    var teamMultiplier = 1;         // changes depending on chipper team size
    var weightMultiplier = 1;       // changes depending on weight of movement
    var restMultiplier = 1.1;       // changes depending on rest time
    var athleteMutliplier = {
        strong: 1,
        average: 1
    };
    var timeIntervals = [];           // set default value to 0 min
    var timeIntervalTotals = [[]];    // array to store time intervals for time based workouts
    let workoutSegments = [];       // array to store workout segments for teamTime workouts

    if (teamSize > 1 && teamType === 'team') {
        teamMultiplier = 0.85 + 0.15*(1 / teamSize);
    }

    console.log('rawMovements', document.getElementById('movements').value.trim().split('\n'));
    for (let line of rawMovements) {

        var time = 1; // set default value to 1 second   
        var reps = 0;
        if (line.split(',').map(s => s.trim()).length < 2) {
            // check if is timer
            if (teamType === 'teamTime' && line.includes('@')) {
                // this is a time indicator
                // always assume set in min
                line.replace(/@/g, '');
                line.replace(/min/g, '');
                line.replace(/s/g, ''); // if put 'mins'

                // extract time
                timeIntervals.push(parseFloat(line.split('@')[1].trim()));
                timeIntervalTotals.push([]);
            }

            // if line does not contain a comma, skip it
            console.log('skipping line', line);
            continue;
        }
        var [repsStr, movement] = line.split(',').map(s => s.trim());
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
                time = timePerRep[key][movement];
                if (key === 'weighted') {
                    // multiplier is determined by weight
                    console.log("we here");
                    console.log('weight', weight);
                    if (weight > 45 && weight <= 70) {
                        weightMultiplier = 1.5;
                    }
                    else if (weight > 70) {
                        weightMultiplier = 2.5;
                    } else {
                        weightMultiplier = 1;
                    }
                    console.log('weight', weight);

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
        } else {
            athleteMutliplier.strong = strongerAthlete;
            athleteMutliplier.average = averageAthlete;
        }
        console.log('movement', movement);
        console.log('time', time);
        console.log('reps', reps);
        console.log('multiplier', weightMultiplier);
        if (teamType === 'teamTime') {
           // need to append to time in intervals array
            timeIntervalTotals[timeIntervalTotals.length - 1].push(reps * weightMultiplier * time);
            workoutSegments.push({
                startTime: timeIntervals[timeIntervals.length - 1],
                type: movement,
                distance: reps
            });
        }
        else {
            totalTime += reps * weightMultiplier * teamMultiplier * time;
        }
    }
    if (teamType === 'teamTime') {
        timeIntervalTotals.shift();
    }

    if (type !== 'emom') {
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

    switch (type) {
        case 'for-time':
        message = `Estimated durations:
        Strong ${athelete}: ${Math.floor(totalTime * athleteMutliplier.strong / 60)} minutes ${Math.floor((totalTime * athleteMutliplier.strong) % 60)} seconds
        Good ${athelete}: ${Math.floor(totalTime / 60)} minutes ${Math.floor((totalTime) % 60)} seconds
        Average ${athelete}: ${Math.floor(totalTime * athleteMutliplier.average / 60)} minutes ${Math.floor((totalTime * athleteMutliplier.average) % 60)} seconds`;
        break;
        case 'amrap':
        message = `Estimated total reps in ${timeCap} minutes: ${Math.floor((timeCap * 60) / (totalTime / rounds)) * rawMovements.length}. Total Rounds: ${Math.floor((timeCap * 60) / (totalTime / rounds))}`;
        break;
        case 'emom':
        message = `Estimated round time: 
        Strong ${athelete}: ${Math.floor(totalTime / 60 * athleteMutliplier.strong)} minutes and ${Math.ceil((totalTime * athleteMutliplier.strong) % 60)} seconds
        Good ${athelete}: ${Math.floor(totalTime / 60)} minutes and ${Math.ceil((totalTime) % 60)} seconds
        Average ${athelete}: ${Math.floor(totalTime / 60 * athleteMutliplier.average)} minutes and ${Math.ceil((totalTime * athleteMutliplier.average) % 60)} seconds`;
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